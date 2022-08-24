import * as JSONC from "https://deno.land/std@0.152.0/encoding/jsonc.ts";
import * as flags from "https://deno.land/std@0.152.0/flags/mod.ts";
import * as path from "https://deno.land/std@0.152.0/path/mod.ts";
import * as base64 from "https://deno.land/std@0.152.0/encoding/base64.ts";

import {
  CreateTagsCommand,
  EC2Client,
  EnableSerialConsoleAccessCommand,
  ImportKeyPairCommand,
  RunInstancesCommand,
} from "https://esm.sh/@aws-sdk/client-ec2@3.153.0";

import jwkToPem, { JWK } from "https://esm.sh/jwk-to-pem@2.0.5";


/* work on ssh-ing into each node to install dependencies for the cluster */

import "https://deno.land/std@0.152.0/dotenv/load.ts";

import { helpStrings } from "./docs/cli/help-strings.ts";

const DEFAULT_AWS_EC2_API_VERSION = "2016-11-15";
const DEFAULT_AWS_REGION = "us-east-1";
const DEFAULT_AWS_INSTANCE_TYPE = "t2.micro";
const DEFAULT_AWS_IMAGE_ID = "ami-0cf6c10214cc015c9";

const SSH_KEYGEN_ALGORITHM = "RSASSA-PKCS1-v1_5";
const SSH_KEYGEN_MODULUS_LENGTH = 2048;
const SSH_PUBLIC_EXPONENT = new Uint8Array([0x01, 0x00, 0x01]);
const SSH_KEYS_EXTRACTABLE = true;
const SSH_KEY_NAME = "cndi-run-key";

const { privateKey, publicKey } = await crypto.subtle.generateKey(
  {
    name: SSH_KEYGEN_ALGORITHM,
    modulusLength: SSH_KEYGEN_MODULUS_LENGTH,
    publicExponent: SSH_PUBLIC_EXPONENT,
    hash: { name: "SHA-256" },
  },
  SSH_KEYS_EXTRACTABLE,
  ["sign", "verify"],
);

const te = new TextEncoder();

const privateKeyJWK = await crypto.subtle.exportKey("jwk", privateKey);

const privatePem = jwkToPem(privateKeyJWK as JWK, { private: true });

Deno.writeTextFile("private.pem", privatePem);

const publicKeyJWK = await crypto.subtle.exportKey("jwk", publicKey);

const decodeFormattedBase64 = (encoded: string) => {
  return new Uint8Array(
    atob(encoded)
      .split("")
      .map((c) => c.charCodeAt(0)),
  );
};

const decodeRawBase64 = (input: string) => {
  try {
    return decodeFormattedBase64(
      input.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, ""),
    );
  } catch (_a) {
    throw new TypeError("The input to be decoded is not correctly encoded.");
  }
};

const modulus = decodeRawBase64(publicKeyJWK.n as string);

// thedigitalcatonline.com/blog/2018/04/25/rsa-keys/#:~:text=The%20OpenSSH%20public%20key%20format,format%20is%20encoded%20with%20Base64.
const publicKeyUint8Array = new Uint8Array([
  0x00,
  0x00,
  0x00,
  0x07, // length of "ssh-rsa" (next 0007 bytes)
  0x73, // "s"
  0x73, // "s"
  0x68, // "h"
  0x2d, // "-"
  0x72, // "r"
  0x73, // "s"
  0x61, // "a"
  0x00,
  0x00,
  0x00,
  0x03, // length of exponent (key.e) (next 3 bytes)
  0x01,
  0x00,
  0x01, // exponent (key.e)
  0x00, // length of modulus (key.n) (next 4 bytes)
  0x00,
  0x01,
  0x01,
  0x00, // bonus byte!
  ...modulus, // modulus (key.n)
]);

const keyBody = base64.encode(publicKeyUint8Array);
const PublicKeyMaterial = te.encode(`ssh-rsa ${keyBody} user@host`);

await Deno.writeFile("public.pub", PublicKeyMaterial);

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

const pathToConfig = cndiArguments.f ||
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
await ec2Client.send(new EnableSerialConsoleAccessCommand({ DryRun: false }));
await ec2Client.send(
  new ImportKeyPairCommand({
    PublicKeyMaterial,
    KeyName: SSH_KEY_NAME,
  }),
);

const pathToNodes = path.join(Deno.cwd(), "cndi/nodes.json");

const loadJSONC = async (path: string) => {
  return JSONC.parse(await Deno.readTextFile(path));
};

const aws = {
  // deno-lint-ignore no-explicit-any
  addNode: (node: CNDINode, deploymentTargetConfiguration: any) => {
    try {
      const ImageId = deploymentTargetConfiguration?.aws?.ImageId ||
        DEFAULT_AWS_IMAGE_ID;
      const InstanceType = deploymentTargetConfiguration?.aws?.InstanceType ||
        DEFAULT_AWS_INSTANCE_TYPE;

      const defaultInstanceParams = {
        ImageId,
        InstanceType,
        MinCount: 1,
        MaxCount: 1,
        KeyName: SSH_KEY_NAME,
      };

      return ec2Client.send(
        new RunInstancesCommand({
          ...defaultInstanceParams,
          ...node,
        }),
      );
    } catch (e) {
      console.log("aws.addNode error", e);
    }
  },
};

const initFn = async () => {
  const config = await loadJSONC(pathToConfig) as unknown as CNDIConfig;
  // TODO: write /cluster and /cluster/application manifests
  await Deno.writeTextFile(
    pathToNodes,
    JSON.stringify(config?.nodes ?? {}, null, 2),
  );
};

const overwriteWithFn = () => {
  console.log("cndi overwrite-with");
};

const runFn = async () => {
  console.log("cndi run");

  const nodes = await loadJSONC(pathToNodes);

  const entries = nodes?.entries as Array<CNDINode>;
  console.log("entries", entries);

  try {
    const instances = await Promise.all(entries.map((node) => {
      return aws.addNode(node, nodes?.deploymentTargetConfiguration as unknown);
    }));
    console.log("instances", instances);

    console.log(instances.length + 1, "instances created");

    // tagging instances with a Name corresponding to the user-specified node name
    const _instancesTagged = await Promise.all(
      instances.map((instance, idx) => {
        console.log("tagging instance", idx);

        const { InstanceId } = instance?.Instances[0];

        const instanceName = entries[idx].name;

        const tagParams = {
          Resources: [InstanceId],
          Tags: [{
            Key: "Name",
            Value: instanceName,
          }, {
            Key: "CNDIRun",
            Value: "true",
          }],
        };

        return ec2Client.send(new CreateTagsCommand(tagParams));
      }),
    );
  } catch (err) {
    console.error(err);
  }
};

const helpFn = (command: Command) => {
  const content = helpStrings?.[command];
  if (content) {
    console.log(content);
  } else {
    console.error(
      `Command "${command}" not found. Use "cndi --help" for more information.`,
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
      `Command "${c}" not found. Use "cndi --help" for more information.`,
    );
  },
};

const commandsInArgs = cndiArguments._;

// if the user uses --help we will show help text
if (cndiArguments.help || cndiArguments.h) {
  const key = typeof cndiArguments.help === "boolean"
    ? "default"
    : cndiArguments.help;
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
