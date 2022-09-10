import * as JSONC from "https://deno.land/std@0.152.0/encoding/jsonc.ts";
import * as flags from "https://deno.land/std@0.152.0/flags/mod.ts";
import * as path from "https://deno.land/std@0.152.0/path/mod.ts";
import * as base64 from "https://deno.land/std@0.152.0/encoding/base64.ts";
import "https://deno.land/std@0.152.0/dotenv/load.ts";
import { delay } from "https://deno.land/std@0.151.0/async/delay.ts";

import {
  CreateTagsCommand,
  DescribeInstanceStatusCommand,
  EC2Client,
  EnableSerialConsoleAccessCommand,
  ImportKeyPairCommand,
  RunInstancesCommand,
  DescribeInstancesCommand,
  InstanceStatus,
  Reservation,
} from "https://esm.sh/@aws-sdk/client-ec2@3.153.0";

import createKeyPair from "./keygen/create-keypair.ts";

import { helpStrings } from "./docs/cli/help-strings.ts";

import { ssh } from "./bootstrap/ssh.ts";

const DEFAULT_AWS_EC2_API_VERSION = "2016-11-15";
const DEFAULT_AWS_REGION = "us-east-1";
const DEFAULT_AWS_INSTANCE_TYPE = "t2.micro";
const DEFAULT_AWS_IMAGE_ID = "ami-0af3a0871fe1d8e4f";

const PUBLIC_KEY_FILENAME = "public.pub";
const PRIVATE_KEY_FILENAME = "private.pem";

enum NodeRole {
  "controller",
  "worker",
}

interface CNDINode {
  name: string;
  role: NodeRole;
  instanceType?: string;
  imageId?: string;
}

interface Instance {
  id: string;
  ready: boolean;
  address: string;
  role: "controller" | "worker";
}

interface CNDIConfig {
  nodes: {
    entries: Array<CNDINode>;
    aws: {
      region: string;
      defaultBootDiskSizeGB: number;
    };
  };
}

const enum Command {
  default = "default",
  init = "init",
  "overwrite-with" = "overwrite-with",
  run = "run",
  help = "help",
}

const DEFAULT_CNDI_CONFIG_PATH = path.join(Deno.cwd(), "cndi-config.json");
const DEFAULT_CNDI_CONFIG_PATH_JSONC = `${DEFAULT_CNDI_CONFIG_PATH}c`;

const cndiArguments = flags.parse(Deno.args);

const pathToConfig =
  cndiArguments.f ||
  cndiArguments.file ||
  DEFAULT_CNDI_CONFIG_PATH_JSONC ||
  DEFAULT_CNDI_CONFIG_PATH;

const awsConfig = {
  apiVersion: DEFAULT_AWS_EC2_API_VERSION,
  region: DEFAULT_AWS_REGION,
  credentials: {
    accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID") as string,
    secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY") as string,
  },
};

const ec2Client = new EC2Client(awsConfig);

const pathToNodes = path.join(Deno.cwd(), "cndi/nodes.json");

const loadJSONC = async (path: string) => {
  return JSONC.parse(await Deno.readTextFile(path));
};

async function getKeyNameFromPublicKeyFile(): Promise<string> {
  // ssh-rsa foobarbaznase64encodedGibberish cndi-key-Gibberish
  const publicKeyFileTextContent = await Deno.readTextFileSync(
    PUBLIC_KEY_FILENAME
  );
  return publicKeyFileTextContent.split(" ")[2];
}

const aws = {
  // deno-lint-ignore no-explicit-any
  addNode: (
    node: CNDINode,
    deploymentTargetConfiguration: any,
    keyName: string
  ) => {
    try {
      const ImageId =
        deploymentTargetConfiguration?.aws?.ImageId || DEFAULT_AWS_IMAGE_ID;
      const InstanceType =
        deploymentTargetConfiguration?.aws?.InstanceType ||
        DEFAULT_AWS_INSTANCE_TYPE;

      const defaultInstanceParams = {
        ImageId,
        InstanceType,
        MinCount: 1,
        MaxCount: 1,
        KeyName: keyName,
      };

      return ec2Client.send(
        new RunInstancesCommand({
          ...defaultInstanceParams,
          ...node,
        })
      );
    } catch (e) {
      console.log("aws.addNode error", e);
    }
  },
};

const initFn = async () => {
  const config = (await loadJSONC(pathToConfig)) as unknown as CNDIConfig;
  // TODO: write /cluster and /cluster/application manifests
  await Deno.writeTextFile(
    pathToNodes,
    JSON.stringify(config?.nodes ?? {}, null, 2)
  );

  console.log("initialized your cndi project in the ./cndi directory!");
};

const overwriteWithFn = () => {
  console.log("cndi overwrite-with");
};

const runFn = async () => {
  console.log("cndi run");

  const nodes = await loadJSONC(pathToNodes);

  // @ts-ignore
  const entries = nodes?.entries.sort((e) => {
    return e.role === "controller" ? -1 : 1;
  }) as Array<CNDINode>;

  console.log("entries", entries);

  // generate a keypair
  const { publicKeyMaterial, privateKeyMaterial } = await createKeyPair();

  const token = crypto.randomUUID().slice(0, 32);

  await Deno.writeTextFile("bootstrap/controller/join-token.txt", token);

  try {
    Deno.removeSync(PRIVATE_KEY_FILENAME);
    Deno.removeSync(PUBLIC_KEY_FILENAME);
  } catch {
    // no keys to remove
  }

  // write public and private keys to disk (eventually we will skip this step)
  await Deno.writeFile(PUBLIC_KEY_FILENAME, publicKeyMaterial);
  await Deno.writeFile(PRIVATE_KEY_FILENAME, privateKeyMaterial, {
    mode: 0o400,
  });

  const gitUsername = Deno.env.get("GIT_USERNAME") as string;
  const gitPassword = Deno.env.get("GIT_PASSWORD") as string;
  const gitRepo = Deno.env.get("GIT_REPO") as string;

  console.debug("GIT_USERNAME", gitUsername ? "good" : "undefined");
  console.debug("GIT_PASSWORD", gitPassword ? "good" : "undefined");
  console.debug("GIT_REPO", gitRepo ? "good" : "undefined");

  await Deno.writeTextFile(
    "bootstrap/controller/repo-config.yaml",
    `apiVersion: v1
    kind: Secret
    metadata:
      name: private-repo
      namespace: argocd
      labels:
        argocd.argoproj.io/secret-type: repository
    stringData:
      type: git
      url: ${gitRepo}
      username: ${gitUsername}
      password: ${gitPassword}`
  );

  // redundant file read is OK for now
  const KeyName = await getKeyNameFromPublicKeyFile();

  if (entries.some((e) => e.kind === "aws")) {
    await ec2Client.send(
      new EnableSerialConsoleAccessCommand({ DryRun: false })
    );
    await ec2Client.send(
      new ImportKeyPairCommand({
        PublicKeyMaterial: publicKeyMaterial,
        KeyName,
      })
    );
  }

  try {
    const initializingInstances = await Promise.all(
      entries.map((node) => {
        // @ts-ignore
        return aws.addNode(
          node,
          nodes?.deploymentTargetConfiguration as unknown,
          KeyName
        );
      })
    );

    const instanceIds = initializingInstances.map(
      (instance) => instance?.Instances[0].InstanceId as string
    ) as Array<string>;

    console.log(initializingInstances.length, "instances created");

    let instances: Array<Instance> = [];

    const getInstances = async (ids: Array<string>) => {
      console.log("instance statuses", instances);
      await delay(10000);
      const allRunning = ids.length === instances.length;
      const allReady = instances.every((status) => status.ready);

      if (!allRunning || !allReady) {
        const response = await ec2Client.send(
          new DescribeInstanceStatusCommand({ InstanceIds: ids })
        );

        const instanceStatuses =
          response.InstanceStatuses as Array<InstanceStatus>;

        // Every instance will be in it's own Reservation because we are deploying them one by one.
        // We deploy instances one by one so they can have different properties.

        const addressesResponse = await ec2Client.send(
          new DescribeInstancesCommand({ InstanceIds: ids })
        );

        const Reservations =
          addressesResponse.Reservations as Array<Reservation>;

        const addresses = Reservations.map((reservation) => {
          // not sure we can guarantee return order of Reservations matches order of InstanceIds so we return the IDs too
          const instance = reservation.Instances?.[0] as {
            PublicIpAddress: string;
            InstanceId: string;
          };

          return {
            address: instance.PublicIpAddress,
            id: instance.InstanceId,
          };
        });

        instances = instanceStatuses.map((s, idx) => {
          const status = s as InstanceStatus;
          const id = status.InstanceId as string;
          const address = addresses.find((a) => a.id === id)?.address as string;
          const ready = status.SystemStatus?.Status === "ok";
          const role = entries[idx].role as "controller" | "worker";
          return {
            id,
            ready,
            address,
            role,
          } as Instance;
        });
        getInstances(ids);
      } else {
        console.log("all instances ready");
        bootstrapInstances();
      }
    };

    await getInstances(instanceIds);

    const bootstrapInstances = () => {
      instances.forEach(async (vm) => {
        console.log("bootstrapping node", vm.id, "at", vm.address);
        if (vm.role === "controller") {
          console.log(`${vm.id} is a controller`);

          await Deno.writeTextFile(
            "./bootstrap/worker/accept-invite.sh",
            `#!/bin/bash
echo "accepting node invite with token ${token}"
microk8s join ${vm.address}:25000/${token} --worker`
          );
        } else {
          console.log(`${vm.id} is a worker`);
        }
        console.log(`${vm.id} is ready`);
      });
    };

    const _instancesTagged = await Promise.all(
      initializingInstances.map((instance, idx) => {
        console.log("tagging instance", idx);
        // @ts-ignore
        const { InstanceId } = instance?.Instances[0];

        const instanceName = entries[idx].name;

        const tagParams = {
          Resources: [InstanceId],
          Tags: [
            {
              Key: "Name",
              Value: instanceName,
            },
            {
              Key: "CNDIRun",
              Value: "true",
            },
          ],
        };

        return ec2Client.send(new CreateTagsCommand(tagParams));
      })
    );
  } catch (err) {
    console.log('error in "cndi run"');
    console.error(err);
  }
};

const helpFn = (command: Command) => {
  const content = helpStrings?.[command];
  if (content) {
    console.log(content);
  } else {
    console.error(
      `Command "${command}" not found. Use "cndi --help" for more information.`
    );
  }
};

const commands = {
  [Command.init]: initFn,
  [Command["overwrite-with"]]: overwriteWithFn,
  [Command.run]: runFn,
  [Command.help]: helpFn,
  [Command.default]: (c: string) => {
    console.log(
      `Command "${c}" not found. Use "cndi --help" for more information.`
    );
  },
};

const commandsInArgs = cndiArguments._;

// if the user uses --help we will show help text
if (cndiArguments.help || cndiArguments.h) {
  const key =
    typeof cndiArguments.help === "boolean" ? "default" : cndiArguments.help;
  commands.help(key);

  // if the user tries to run "help" instead of --help we will say that it's not a valid command
} else if (commandsInArgs.includes("help")) {
  commands.help(Command.help);
} else {
  // in any other case we will try to run the command
  const operation = `${commandsInArgs[0]}`;

  switch (operation) {
    case Command.init:
      commands[Command.init]();
      break;
    case Command.run:
      commands[Command.run]();
      break;
    case Command["overwrite-with"]:
      commands[Command["overwrite-with"]]();
      break;
    default:
      commands[Command.default](operation);
      break;
  }
}
