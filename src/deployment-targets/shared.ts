import {
  CNDIContext,
  EnvObject,
  NodeKind,
  SealedSecretsKeys,
} from "../types.ts";
import { Secret } from "https://deno.land/x/cliffy@v0.25.4/prompt/secret.ts";
import { Input } from "https://deno.land/x/cliffy@v0.25.4/prompt/mod.ts";
import { trimPemString } from "../utils.ts";

import { prepareAWSEnv } from "../deployment-targets/aws.ts";
import { prepareGCPEnv } from "../deployment-targets/gcp.ts";

import {
  brightRed,
  cyan,
  white,
} from "https://deno.land/std@0.158.0/fmt/colors.ts";

const deploymentTargetsSharedLabel = white("deployment-targets/shared:");

interface CNDIContextWithGeneratedValues extends CNDIContext {
  sealedSecretsKeys: SealedSecretsKeys;
  terraformStatePassphrase: string;
  argoUIReadOnlyPassword: string;
}

const getCoreEnvObject = async (
  context: CNDIContextWithGeneratedValues,
  kind: NodeKind,
): Promise<EnvObject> => {
  const {
    sealedSecretsKeys,
    terraformStatePassphrase,
    argoUIReadOnlyPassword,
  } = context;

  // git
  const GIT_USERNAME = "";
  const GIT_REPO = "";
  const GIT_PASSWORD = "";

  const TERRAFORM_STATE_PASSPHRASE = terraformStatePassphrase;
  const ARGO_UI_READONLY_PASSWORD = argoUIReadOnlyPassword;

  if (!sealedSecretsKeys) {
    console.log(
      deploymentTargetsSharedLabel,
      brightRed(`"sealedSecretsKeys" is not defined in context`),
    );
    Deno.exit(1);
  }

  if (!TERRAFORM_STATE_PASSPHRASE) {
    console.log(
      deploymentTargetsSharedLabel,
      brightRed(`"terraformStatePassphrase" is not defined in context`),
    );
    Deno.exit(1);
  }

  if (!ARGO_UI_READONLY_PASSWORD) {
    console.log(
      deploymentTargetsSharedLabel,
      brightRed(`"argoUIReadOnlyPassword" is not defined in context`),
    );
    Deno.exit(1);
  }

  const SEALED_SECRETS_PUBLIC_KEY_MATERIAL = trimPemString(
    sealedSecretsKeys.sealed_secrets_public_key,
  ).replaceAll("\n", "_");

  const SEALED_SECRETS_PRIVATE_KEY_MATERIAL = trimPemString(
    sealedSecretsKeys.sealed_secrets_private_key,
  ).replaceAll("\n", "_");

  const coreEnvObject: EnvObject = {
    SEALED_SECRETS_PUBLIC_KEY_MATERIAL: {
      comment: "Sealed Secrets keys for Kubeseal",
      value: SEALED_SECRETS_PUBLIC_KEY_MATERIAL,
    },
    SEALED_SECRETS_PRIVATE_KEY_MATERIAL: {
      value: SEALED_SECRETS_PRIVATE_KEY_MATERIAL,
    },
    ARGO_UI_READONLY_PASSWORD: {
      comment: "ArgoUI",
      value: ARGO_UI_READONLY_PASSWORD,
    },
    TERRAFORM_STATE_PASSPHRASE: {
      comment: "Passphrase for encrypting/decrypting terraform state",
      value: TERRAFORM_STATE_PASSPHRASE,
    },
  };

  coreEnvObject.GIT_USERNAME = {
    comment: "git credentials",
    value: context.interactive
      ? ((await Input.prompt({
        message: cyan("Enter your GitHub username:"),
        default: GIT_USERNAME,
      })) as string)
      : GIT_USERNAME,
  };

  coreEnvObject.GIT_PASSWORD = {
    value: context.interactive
      ? ((await Secret.prompt({
        message: cyan("Enter your GitHub Personal Access Token:"),
        default: GIT_PASSWORD,
      })) as string)
      : GIT_PASSWORD,
  };

  coreEnvObject.GIT_REPO = {
    value: context.interactive
      ? await Input.prompt({
        message: cyan("Enter your GitHub repository URL:"),
        default: GIT_REPO,
      })
      : GIT_REPO,
  };

  switch (kind) {
    case NodeKind.aws_ec2:
      return {
        ...coreEnvObject,
        ...(await prepareAWSEnv(context.interactive)),
      };
    case NodeKind.gcp_ce:
      return {
        ...coreEnvObject,
        ...(await prepareGCPEnv(context.interactive)),
      };
    default:
      console.log(brightRed(`kind "${kind}" is not yet supported`));
      Deno.exit(1);
  }
};

const availableDeploymentTargets = ["aws", "gcp"];

export { availableDeploymentTargets, getCoreEnvObject };
