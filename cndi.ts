import * as JSONC from "https://deno.land/std@0.152.0/encoding/jsonc.ts";
import * as flags from "https://deno.land/std@0.152.0/flags/mod.ts";
import * as path from "https://deno.land/std@0.152.0/path/mod.ts";
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

// import * as GCPComputeEngine from 'https://esm.sh/@google-cloud/compute';
// TODO: const gcpClient = new GCPComputeEngine.InstancesClient();

// utility that generates a valid rsa keypair
import createKeyPair from "./keygen/create-keypair.ts";

// the responses for running `cndi help <command>`
import { helpStrings } from "./docs/cli/help-strings.ts";

// functions that return a manifest string for given parameters
import getApplicationManifest from "./templates/application.ts";
import getRepoConfigManifest from "./templates/repo-config.ts";

// AWS Constants
const DEFAULT_AWS_EC2_API_VERSION = "2016-11-15";
const DEFAULT_AWS_REGION = "us-east-1";
const DEFAULT_AWS_INSTANCE_TYPE = "t2.micro";
const DEFAULT_AWS_IMAGE_ID = "ami-0af3a0871fe1d8e4f";

// CNDI Constants
const PUBLIC_KEY_FILENAME = "public.pub";
const PRIVATE_KEY_FILENAME = "private.pem";

// list of all commands for the CLI
const enum Command {
  init = "init", // cndi init
  "overwrite-with" = "overwrite-with", // cndi overwrite-with
  run = "run", // cndi run
  help = "help", // cndi help
  default = "default", // cndi some-random-incorrect-command
}

// node.role is either "controller" or "worker"
enum NodeRole {
  controller = "controller",
  worker = "worker",
}

// incomplete type, nodes will have more options
interface CNDINode {
  name: string;
  role: NodeRole;
  instanceType?: string;
  imageId?: string;
}

// incomplete type, config will have more options
interface CNDIConfig {
  nodes: {
    entries: Array<CNDINode>;
    aws: {
      region: string;
      defaultBootDiskSizeGB: number;
    };
  };
}

// default paths to the user's config file
const DEFAULT_CNDI_CONFIG_PATH = path.join(Deno.cwd(), "cndi-config.json");
const DEFAULT_CNDI_CONFIG_PATH_JSONC = `${DEFAULT_CNDI_CONFIG_PATH}c`;

// parse the command line arguments
const cndiArguments = flags.parse(Deno.args);

// if the user has specified a config file, use that, otherwise use the default config file
const pathToConfig =
  cndiArguments.f ||
  cndiArguments.file ||
  DEFAULT_CNDI_CONFIG_PATH_JSONC ||
  DEFAULT_CNDI_CONFIG_PATH;

// get super secret AWS keys from the host environment
const awsConfig = {
  apiVersion: DEFAULT_AWS_EC2_API_VERSION,
  region: DEFAULT_AWS_REGION,
  credentials: {
    accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID") as string,
    secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY") as string,
  },
};

// initialize AWS EC2Client sdk, used to provision virtual machines
const ec2Client = new EC2Client(awsConfig);

// cndi init populates this file with nodes from the original config file, because it is consumed downstream
const pathToNodes = path.join(Deno.cwd(), "cndi/nodes.json");

// helper function to load a JSONC file
const loadJSONC = async (path: string) => {
  return JSONC.parse(await Deno.readTextFile(path));
};

// incomplete type, NodeSpec will have more options
// NodeSpec is the user-specified config for a node
interface NodeSpec {
  name: string;
  role: NodeRole;
  kind: "aws";
  InstanceType?: string;
}

// incomplete type, NodeEntry will probably have more options
// NodeEntry is the user-specified config for a node + data returned from deployment target
interface NodeEntry extends NodeSpec {
  ready: boolean;
  id?: string;
  privateIpAddress?: string;
  publicIpAddress?: string;
}

// get the comment from a RSA public key, we use it as an identifier for the key
async function getKeyNameFromPublicKeyFile(): Promise<string> {
  // ssh-rsa foobarbaznase64encodedGibberish cndi-key-Gibberish
  const publicKeyFileTextContent = await Deno.readTextFileSync(
    PUBLIC_KEY_FILENAME
  );
  return publicKeyFileTextContent.split(" ")[2];
}

const aws = {
  addNode: (
    node: CNDINode,
    // deno-lint-ignore no-explicit-any
    deploymentTargetConfiguration: any,
    keyName: string
  ) => {
    try {
      // set a user-specified AMI id if one is specified, otherwise use the default AMI id
      const ImageId =
        deploymentTargetConfiguration?.aws?.ImageId || DEFAULT_AWS_IMAGE_ID;

      // set a user-specified instance type if one is specified, otherwise use the default instance type
      const InstanceType =
        deploymentTargetConfiguration?.aws?.InstanceType ||
        DEFAULT_AWS_INSTANCE_TYPE;

      // default node config
      const defaultInstanceParams = {
        ImageId, // ami-iwgniwngo
        InstanceType,
        MinCount: 1,
        MaxCount: 1,
        KeyName: keyName,
      };

      // merge the default node config with the user-specified node config, prioritizing the user-specified config
      const instanceParams = {
        ...defaultInstanceParams,
        ...node,
      };

      // ask aws for a new ec2 vm with the given params
      return ec2Client.send(new RunInstancesCommand(instanceParams));
    } catch (e) {
      console.log("aws.addNode error", e);
    }
  },
};

const provisionNodes = async (
  nodes: Array<NodeEntry>,
  keyName: string
): Promise<NodeEntry[]> => {
  // use ./cndi/nodes.json to get the deployment target configuration for the current node
  const config = await loadJSONC("cndi/nodes.json");
  const provisionedNodes = [...nodes]; // copy the nodes array
  const runOutputs = await Promise.all(
    nodes.map((node) => {
      // run a different deployment function depending on node.kind
      switch (node.kind) {
        case "aws":
          return aws.addNode(
            node,
            config?.deploymentTargetConfiguration ?? {},
            keyName
          );
        default:
          throw new Error(`Unsupported node kind: ${node.kind}`); // if node.kind is not supported, throw
      }
    })
  );
  // for each response from the deployment target, update the node
  runOutputs.forEach((i, idx) => {
    provisionedNodes[idx].id = i?.Instances[0].InstanceId;
  });

  // return nodes that we started
  return provisionedNodes;
};

// COMMAND fn: cndi help <command>
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

// COMMAND fn: cndi init
const initFn = async () => {
  const config = (await loadJSONC(pathToConfig)) as unknown as CNDIConfig;
  // TODO: write /cluster and /cluster/application manifests
  await Deno.writeTextFile(
    pathToNodes,
    JSON.stringify(config?.nodes ?? {}, null, 2)
  );

  console.log("initialized your cndi project in the ./cndi directory!");
};

// COMMAND fn: cndi overwrite-with
const overwriteWithFn = () => {
  console.log("cndi overwrite-with");
};

// COMMAND fn: cndi run
const runFn = async () => {
  console.log("cndi run");

  // load nodes from the nodes.json file
  const nodes = (await loadJSONC(pathToNodes)) as unknown as {
    entries: Array<NodeSpec>;
  };

  // get each node from the nodes.json file, map them to a NodeEntry
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

  // generate a keypair for communicating with the nodes when they come online
  const { publicKeyMaterial, privateKeyMaterial } = await createKeyPair();

  // generate a 32 character token for microk8s
  const token = crypto.randomUUID().replaceAll("-", "").slice(0, 32);

  // write the token that the controller will register for it's microk8s peers
  await Deno.writeTextFile("bootstrap/controller/join-token.txt", token);

  // a bit extra: delete keys if they exist
  try {
    Deno.removeSync(PRIVATE_KEY_FILENAME);
    Deno.removeSync(PUBLIC_KEY_FILENAME);
  } catch {
    // no keys to remove, don't throw an error
  }

  // write public and private keys to disk (eventually we will skip this step and do it in memory)
  await Deno.writeFile(PUBLIC_KEY_FILENAME, publicKeyMaterial);
  await Deno.writeFile(PRIVATE_KEY_FILENAME, privateKeyMaterial, {
    mode: 0o400, // this is a private key, make it readable only by the owner
  });

  // read repo credentials from the env of the machine running this script
  // used to enable gitops with these credentials:
  const gitUsername = Deno.env.get("GIT_USERNAME") as string;
  const gitPassword = Deno.env.get("GIT_PASSWORD") as string;
  const gitRepo = Deno.env.get("GIT_REPO") as string;

  // don't throw if credentials are not found, just log it (TODO: throw instead)
  console.debug("GIT_USERNAME", gitUsername ? "good" : "undefined");
  console.debug("GIT_PASSWORD", gitPassword ? "good" : "undefined");
  console.debug("GIT_REPO", gitRepo ? "good" : "undefined");

  // generate an argocd repo manifest with the git credentials
  await Deno.writeTextFile(
    "bootstrap/controller/repo-config.yaml",
    getRepoConfigManifest(gitRepo, gitUsername, gitPassword)
  );

  // generate a "root application" that all other applications will descend from
  await Deno.writeTextFile(
    "bootstrap/controller/application.yaml",
    getApplicationManifest(gitRepo)
  );

  // redundant file read is OK for now
  const KeyName = await getKeyNameFromPublicKeyFile();

  // if there are any nodes on AWS, upload the public key and name the key using the comment in the key
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

  // take each node entry and ask it's deployment target to provision it
  const provisionedInstances = await provisionNodes(entries, KeyName);

  // at this point we have a list of "provisioned instances" that are still waiting to come online
  try {
    await Promise.all(
      // give each node a 'name tag' according to node.name
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
            // also tag as a CNDI node
            {
              Key: "CNDIRun",
              Value: "true",
            },
          ],
        };

        return ec2Client.send(new CreateTagsCommand(tagParams));
      })
    );

    // every few seconds we want to ask if our nodes are online yet
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

        // check if instance has a ready status and updates the node entry accordingly
        instanceStatuses.forEach((status) => {
          const id = status.InstanceId;
          const ready = status.SystemStatus?.Status === "ok";
          const instanceIndex = instances.findIndex((i) => i.id === id);
          instances[instanceIndex] = {
            ...instances[instanceIndex],
            ready,
          };
        });

        // ask the deployment target about the addresses for the new instances
        const addressesResponse = await ec2Client.send(
          new DescribeInstancesCommand({ InstanceIds: ids })
        );

        // Every instance will be in it's own Reservation because we are deploying them one by one.
        // We deploy instances one by one so they can have different properties.
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
        // calling this same function, when everything is ready we go to the "else" just below
        checkAndUpdateInstances(instances);
      } else {
        console.log("all instances ready");
        bootstrapInstances();
      }
    };

    // wait for all instances to be ready
    await checkAndUpdateInstances(provisionedInstances);

    // instances are live, we need to ssh into them and bootstrap them
    const bootstrapInstances = async () => {
      provisionedInstances.forEach(async (vm) => {
        // vm is live now
        console.log(
          "bootstrapping node",
          vm.id,
          "at publicIpAddress",
          vm.publicIpAddress
        );

        if (vm.role === "controller") {
          console.log(`${vm.id} is a controller`);

          // we have a controller, so let's inject its private ip address and token into the worker bootstrap script
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

      // now we have a list of instances that are ready, and all the data they need to bootstrap
      Deno.writeTextFileSync(
        "./node-runtime-setup/nodes.json",
        JSON.stringify(provisionedInstances, null, 2)
      );

      // calling bootstrap using node.js (hack until we can use deno)
      // when this finishes successfully, the cluster is ready
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
        // CNDI cluster deployed successfully
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

// map command to function
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
