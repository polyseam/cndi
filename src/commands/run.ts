import * as path from "https://deno.land/std@0.157.0/path/mod.ts";
import { copy } from "https://deno.land/std@0.157.0/fs/copy.ts";
import { ensureDir } from "https://deno.land/std@0.157.0/fs/mod.ts";
import "https://deno.land/std@0.157.0/dotenv/load.ts";
import { delay } from "https://deno.land/std@0.157.0/async/delay.ts";
import { loadJSONC } from "../utils.ts";

import {
  CreateTagsCommand,
  DescribeInstanceStatusCommand,
  EC2Client,
  EnableSerialConsoleAccessCommand,
  ImportKeyPairCommand,
  RunInstancesCommand,
  DescribeInstancesCommand,
} from "https://esm.sh/v95/@aws-sdk/client-ec2@3.178.0/deno/client-ec2.js";

import type {
  InstanceStatus,
  DescribeInstancesCommandOutput,
  RunInstancesCommandOutput,
  CreateTagsCommandOutput,
  DescribeInstanceStatusCommandOutput,
  EnableSerialConsoleAccessCommandOutput,
  Reservation,
  Instance,
  EC2Client as EC2ClientType,
} from "https://esm.sh/v95/@aws-sdk/client-ec2@3.178.0/dist-types/index.d.ts";

import {
  CNDINode,
  CNDINodes,
  NodeEntry,
  CNDIContext,
  NodeSpec,
  CNDIClients,
} from "../types.ts";

// import * as GCPComputeEngine from 'https://esm.sh/@google-cloud/compute';
// TODO: const gcpClient = new GCPComputeEngine.InstancesClient();

// utility that generates a valid rsa keypair
import createKeyPair from "../keygen/create-keypair.ts";

// functions that return a manifest string for given parameters
import getRootApplicationManifest from "../templates/root-application.ts";
import getRepoConfigManifest from "../templates/repo-config.ts";

// AWS Constants
const DEFAULT_AWS_EC2_API_VERSION = "2016-11-15";
const DEFAULT_AWS_REGION = "us-east-1";
const DEFAULT_AWS_INSTANCE_TYPE = "t2.micro";
const DEFAULT_AWS_IMAGE_ID = "ami-06e67c2c137e90884";

const DEFAULT_BOOT_DISK_VOLUME_GIB = 80;

// CNDI Constants
const PUBLIC_KEY_FILENAME = "public.pub";
const PRIVATE_KEY_FILENAME = "private.pem";

// get the comment from a RSA public key, we use it as an identifier for the key
async function getKeyNameFromPublicKeyFile({
  CNDI_WORKING_DIR,
}: CNDIContext): Promise<string> {
  // ssh-rsa foobarbaznase64encodedGibberish cndi-key-Gibberish
  const publicKeyFileTextContent = await Deno.readTextFileSync(
    path.join(CNDI_WORKING_DIR, "keys", PUBLIC_KEY_FILENAME)
  );
  return publicKeyFileTextContent.split(" ")[2];
}

const getUndeployedNamedNodesForRepo = async (
  nodeNames: Array<string>,
  ec2Client: EC2ClientType,
  gitRepo: string
) => {
  console.log("checking which nodes are already deployed");
  // get the nodes that have the repo tag
  const describeInstancesCommand = new DescribeInstancesCommand({
    Filters: [
      {
        Name: "tag:CNDIBoundToRepo",
        Values: [gitRepo],
      },
      {
        Name: "tag:Name",
        Values: nodeNames,
      },
      {
        Name: "instance-state-name",
        Values: ["running"],
      },
    ],
  });

  // deno-lint-ignore no-explicit-any
  const describeInstancesResponse = await ec2Client.send(describeInstancesCommand as any ) as DescribeInstancesCommandOutput;

  const reservations = describeInstancesResponse?.Reservations as Array<Reservation>;

  const deployedNodeNames = reservations.map(
    (reservation: Reservation) => {
      const Instances = reservation.Instances as Instance[];
      const instance = Instances[0];
      return instance.Tags?.find(({ Key }) => Key === "Name")?.Value;
    }
  );

  return nodeNames.filter((nodeName) => !deployedNodeNames.includes(nodeName));
};

const aws = {
  addNode: (
    node: CNDINode,
    // deno-lint-ignore no-explicit-any
    deploymentTargetConfiguration: any,
    keyName: string,
    // deno-lint-ignore no-explicit-any
    ec2Client?: any
  ) => {
    if (!ec2Client) {
      throw new Error("aws.addNode: EC2 Client not provided");
    }
    try {
      // set a user-specified AMI id if one is specified, otherwise use the default AMI id
      const ImageId =
        deploymentTargetConfiguration?.aws?.ImageId || DEFAULT_AWS_IMAGE_ID;

      // set a user-specified instance type if one is specified, otherwise use the default instance type
      const InstanceType =
        deploymentTargetConfiguration?.aws?.InstanceType ||
        DEFAULT_AWS_INSTANCE_TYPE;

      // CNDI V1 boot disk mapping: --block-device-mappings DeviceName=/dev/sda1,Ebs={VolumeSize=$AWS_BOOT_VOL_SIZE}
      // default node config
      const defaultInstanceParams = {
        ImageId, // ami-iwgniwngo
        InstanceType,
        MinCount: 1,
        MaxCount: 1,
        KeyName: keyName,
        BlockDeviceMappings: [
          {
            DeviceName: "/dev/sda1",
            Ebs: { VolumeSize: DEFAULT_BOOT_DISK_VOLUME_GIB },
          },
        ],
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
  keyName: string,
  pathToNodes: string,
  clients: CNDIClients
): Promise<NodeEntry[]> => {
  // use ./cndi/nodes.json to get the deployment target configuration for the current node
  const config = (await loadJSONC(pathToNodes)) as unknown as CNDINodes;
  const provisionedNodes = [...nodes]; // copy the nodes array
  const runOutputs = (await Promise.all(
    nodes.map((node) => {
      // run a different deployment function depending on node.kind
      switch (node.kind) {
        case "aws":
          return aws.addNode(
            node,
            config?.deploymentTargetConfiguration ?? {},
            keyName,
            clients?.aws
          );
        default:
          throw new Error(`Unsupported node kind: ${node.kind}`); // if node.kind is not supported, throw
      }
    })
  )) as Array<RunInstancesCommandOutput>;

  // for each response from the deployment target, update the node
  runOutputs.forEach((i, idx) => {
    // deno-lint-ignore no-explicit-any
    const x = i as any;
    provisionedNodes[idx].id = x?.Instances[0].InstanceId;
  });

  // return nodes that we started
  return provisionedNodes;
};

/**
 * COMMAND fn: cndi run
 * Creates a CNDI cluster by reading the contents of ./cndi
 * */
const runFn = async (context: CNDIContext) => {
  console.log("cndi run");

  const clients: CNDIClients = {}; // we will add a client for each deployment target to this object

  const {
    CNDI_WORKING_DIR,
    CNDI_SRC,
    CNDI_HOME,
    pathToNodes,
    binaryForPlatform,
  } = context;

  await Promise.all([
    ensureDir(path.join(CNDI_WORKING_DIR, "keys")),
    ensureDir(path.join(CNDI_WORKING_DIR, "bootstrap")),
  ]);

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

  const entriesToDeploy = [];

  // generate a keypair for communicating with the nodes when they come online
  const { publicKeyMaterial, privateKeyMaterial } = await createKeyPair();

  // generate a 32 character token for microk8s
  const token = crypto.randomUUID().replaceAll("-", "").slice(0, 32);

  await copy(
    path.join(CNDI_SRC, "bootstrap"),
    path.join(CNDI_WORKING_DIR, "bootstrap"),
    { overwrite: true }
  );

  // write the token that the controller will register for it's microk8s peers
  await Deno.writeTextFile(
    path.join(CNDI_WORKING_DIR, "bootstrap", "controller", "join-token.txt"),
    token
  );

  // a bit extra: delete keys if they exist
  try {
    Deno.removeSync(path.join(CNDI_WORKING_DIR, "keys", PRIVATE_KEY_FILENAME));
    Deno.removeSync(path.join(CNDI_WORKING_DIR, "keys", PUBLIC_KEY_FILENAME));
  } catch {
    // no keys to remove, don't throw an error
  }

  // write public and private keys to disk (eventually we will skip this step and do it in memory)
  await Deno.writeFile(
    path.join(CNDI_WORKING_DIR, "keys", PUBLIC_KEY_FILENAME),
    publicKeyMaterial,
    {
      create: true,
    }
  );
  await Deno.writeFile(
    path.join(CNDI_WORKING_DIR, "keys", PRIVATE_KEY_FILENAME),
    privateKeyMaterial,
    {
      create: true,
      mode: 0o400, // this is a private key, make it readable only by the owner
    }
  );

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
    path.join(CNDI_WORKING_DIR, "bootstrap", "controller", "repo-config.yaml"),
    getRepoConfigManifest(gitRepo, gitUsername, gitPassword)
  );

  // generate a "root application" that all other applications will descend from
  await Deno.writeTextFile(
    path.join(
      CNDI_WORKING_DIR,
      "bootstrap",
      "controller",
      "root-application.yaml"
    ),
    getRootApplicationManifest(gitRepo)
  );

  // redundant file read is OK for now
  const KeyName = await getKeyNameFromPublicKeyFile(context);

  // if there are any nodes on AWS, upload the public key and name the key using the comment in the key
  if (entries.some((e) => e.kind === "aws")) {
    const credentials = {
      accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID") as string,
      secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY") as string,
    };

    if (!credentials.accessKeyId) {
      throw new Error("AWS_ACCESS_KEY_ID not found in env");
    }

    if (!credentials.secretAccessKey) {
      throw new Error("AWS_SECRET_ACCESS_KEY not found in env");
    }

    const awsConfig = {
      apiVersion: DEFAULT_AWS_EC2_API_VERSION,
      region: Deno.env.get("AWS_REGION") || DEFAULT_AWS_REGION,
      credentials,
    };

    clients.aws = new EC2Client(awsConfig);

    const undeployedNodeEntries = await getUndeployedNamedNodesForRepo(
      entries.map(({ name }) => name),
      clients.aws,
      gitRepo
    );

    entriesToDeploy.push(
      ...entries.filter((e) => undeployedNodeEntries.includes(e.name))
    );

    console.log("aws nodes found...");
    console.log("uploading keypair to aws");

    (await clients.aws.send(
      new EnableSerialConsoleAccessCommand({ DryRun: false })
    )) as EnableSerialConsoleAccessCommandOutput;

    await clients.aws.send(
      new ImportKeyPairCommand({
        PublicKeyMaterial: publicKeyMaterial,
        KeyName,
      })
    );
  }

  console.log("provisioning nodes");

  // take each node entry and ask it's deployment target to provision it
  if (!entriesToDeploy.length) {
    console.log("no nodes to deploy");
    Deno.exit(0);
  }

  const provisionedInstances = await provisionNodes(
    entriesToDeploy,
    KeyName,
    pathToNodes,
    clients
  );

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
            {
              Key: "CNDIBoundToRepo",
              Value: gitRepo,
            },
          ],
        };

        return clients.aws?.send(
          new CreateTagsCommand(tagParams)
        ) as CreateTagsCommandOutput;
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
        const response = (await clients.aws?.send(
          new DescribeInstanceStatusCommand({ InstanceIds: ids })
        )) as DescribeInstanceStatusCommandOutput;

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
        const addressesResponse = (await clients.aws?.send(
          new DescribeInstancesCommand({ InstanceIds: ids })
        )) as DescribeInstancesCommandOutput;

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
            path.join(
              CNDI_WORKING_DIR,
              "bootstrap",
              "worker",
              "accept-invite.sh"
            ),
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
        path.join(CNDI_WORKING_DIR, "live.nodes.json"),
        JSON.stringify(provisionedInstances, null, 2)
      );

      // calling bootstrap using node.js (hack until we can use deno)
      // when this finishes successfully, the cluster is ready

      const binaryName = `cndi-node-runtime-setup-${binaryForPlatform}`;

      // execute the cndi-node-runtime-setup binary for the current envionment
      const binaryPath = path.join(CNDI_HOME, binaryName);

      const p = Deno.run({
        cmd: [binaryPath, CNDI_WORKING_DIR],
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

export default runFn;
