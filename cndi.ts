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
  RunInstancesCommandOutput,
} from "https://esm.sh/@aws-sdk/client-ec2@3.153.0";

import createKeyPair from "./keygen/create-keypair.ts";

import { helpStrings } from "./docs/cli/help-strings.ts";
import getApplicationManifest from "./templates/application.ts";
import getRepoConfigManifest from "./templates/repo-config.ts";
import { ssh } from "./bootstrap/ssh.ts";

const DEFAULT_AWS_EC2_API_VERSION = "2016-11-15";
const DEFAULT_AWS_REGION = "us-east-1";
const DEFAULT_AWS_INSTANCE_TYPE = "t2.micro";
const DEFAULT_AWS_IMAGE_ID = "ami-0af3a0871fe1d8e4f";

const PUBLIC_KEY_FILENAME = "public.pub";
const PRIVATE_KEY_FILENAME = "private.pem";

enum NodeRole {
  controller = "controller",
  worker = "worker",
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
  privateIpAddress: string;
  publicIpAddress: string;
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

interface NodeSpec {
  name: string;
  role: NodeRole;
  kind: "aws";
  InstanceType?: string;
}

interface NodeEntry extends NodeSpec {
  ready: boolean;
  id?: string;
  privateIpAddress?: string;
  publicIpAddress?: string;
}

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
        ImageId, // ami-iwgniwngo
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

const provisionNodes = async (
  nodes: Array<NodeEntry>,
  keyName: string
): Promise<NodeEntry[]> => {
  // for loop that loops through nodes
  const config = await loadJSONC("cndi/nodes.json");
  const provisionedNodes = [...nodes];
  const runOutputs = await Promise.all(
    nodes.map((node) => {
      switch (node.kind) {
        case "aws":
          return aws.addNode(
            node,
            config?.deploymentTargetConfiguration ?? {},
            keyName
          );
        default:
          throw new Error(`Unsupported node kind: ${node.kind}`);
      }
    })
  );
  runOutputs.forEach((i, idx) => {
    provisionedNodes[idx].id = i?.Instances[0].InstanceId;
  });
  return provisionedNodes;
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

  const nodes = (await loadJSONC(pathToNodes)) as unknown as {
    entries: Array<NodeSpec>;
  };

  const entries = nodes.entries.map(
    ({ name, role, kind, InstanceType }): NodeEntry => {
      return {
        name,
        role,
        kind,
        ready: false,
        InstanceType,
      };
    }
  );

  // generate a keypair
  const { publicKeyMaterial, privateKeyMaterial } = await createKeyPair();

  // generate a 32 character token for microk8s
  const token = crypto.randomUUID().replaceAll('-','').slice(0, 32);

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
    getRepoConfigManifest(gitRepo, gitUsername, gitPassword)
  );

  await Deno.writeTextFile(
    "bootstrap/controller/application.yaml",
    getApplicationManifest(gitRepo)
  );

  // redundant file read is OK for now
  const KeyName = await getKeyNameFromPublicKeyFile();

  // if there are any nodes on AWS, upload the keypair
  if (entries.some((e) => e.kind === "aws")) {
    console.log("aws nodes found...");
    console.log("uploading keypair to aws");
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

  console.log("provisioning nodes");
  const provisionedInstances = await provisionNodes(entries, KeyName);

  try {
    await Promise.all(
      provisionedInstances.map((instance, idx) => {
        console.log("tagging instance", idx);
        const { id, name } = instance;

        const tagParams = {
          Resources: [id as string],
          Tags: [
            {
              Key: "Name",
              Value: name,
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

    const checkAndUpdateInstances = async (instances: Array<NodeEntry>) => {
      console.log("checking and updating instances:", instances);
      await delay(10000); // ask aws about nodes every 10 seconds
      // const allRunning = ids.length === instances.length;
      const ids = instances.map((i) => i.id) as Array<string>;
      const allReady = instances.every((status) => status.ready);

      if (!allReady) {
        const response = await ec2Client.send(
          new DescribeInstanceStatusCommand({ InstanceIds: ids })
        );

        const instanceStatuses =
          response.InstanceStatuses as Array<InstanceStatus>;

        instanceStatuses.forEach((status) => {
          const id = status.InstanceId;
          const ready = status.SystemStatus?.Status === "ok";
          const instanceIndex = instances.findIndex((i) => i.id === id);
          instances[instanceIndex] = {
            ...instances[instanceIndex],
            ready,
          };
        });

        // Every instance will be in it's own Reservation because we are deploying them one by one.
        // We deploy instances one by one so they can have different properties.

        const addressesResponse = await ec2Client.send(
          new DescribeInstancesCommand({ InstanceIds: ids })
        );

        const Reservations =
          addressesResponse.Reservations as Array<Reservation>;

        Reservations.forEach((reservation) => {
          // not sure we can guarantee return order of Reservations matches order of InstanceIds so we return the IDs too

          const instance = reservation.Instances?.[0] as {
            PublicIpAddress: string;
            InstanceId: string;
            PrivateIpAddress: string;
          };

          const instanceIndex = instances.findIndex(
            (i) => i.id === instance.InstanceId
          );
          instances[instanceIndex] = {
            ...instances[instanceIndex],
            publicIpAddress: instance.PublicIpAddress,
            privateIpAddress: instance.PrivateIpAddress,
          };
        });
        checkAndUpdateInstances(instances);
      } else {
        console.log("all instances ready");
        bootstrapInstances();
      }
    };

    await checkAndUpdateInstances(provisionedInstances);

    const bootstrapInstances = async () => {
      provisionedInstances.forEach(async (vm) => {
        // vm is live now
        console.log("bootstrapping node", vm.id, "at publicIpAddress", vm.publicIpAddress);
        if (vm.role === "controller") {
          console.log(`${vm.id} is a controller`);

          //
          await Deno.writeTextFile(
            "./bootstrap/worker/accept-invite.sh",
            `#!/bin/bash
echo "accepting node invite with token ${token}"
microk8s join ${vm.privateIpAddress}:25000/${token} --worker`
          );
        } else {
          console.log(`${vm.id} is a worker`);
        }
        console.log(`${vm.id} is ready`);
      });

      Deno.writeTextFileSync(
        "./node-runtime-setup/nodes.json",
        JSON.stringify(provisionedInstances, null, 2)
      );

      // calling bootstrap using node.js (hack until we can use deno)
      // TODO: maybe use deno run in compat mode?
      const p = Deno.run({
        cmd: ["node", "./node-runtime-setup/bootstrap.js"],
        stdout: "piped",
        stderr: "piped",
      });

      const { code } = await p.status();
      // Reading the outputs closes their pipes
      const rawOutput = await p.output();
      const rawError = await p.stderrOutput();

      if (code === 0) {
        await Deno.stdout.write(rawOutput);
      } else {
        const errorString = new TextDecoder().decode(rawError);
        console.log(errorString);
      }
    };
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
