import {
  DEPLOYMENT_TARGET,
  DeploymentTarget,
  EnvObject,
  SealedSecretsKeys,
} from "../types.ts";
import { Secret } from "https://deno.land/x/cliffy@v0.25.4/prompt/secret.ts";
import { Input } from "https://deno.land/x/cliffy@v0.25.4/prompt/mod.ts";
import { trimPemString } from "../utils.ts";

import { prepareAWSEnv } from "../deployment-targets/aws.ts";
import { prepareGCPEnv } from "../deployment-targets/gcp.ts";
import { prepareAzureEnv } from "../deployment-targets/azure.ts";
import {
  brightRed,
  cyan,
  white,
} from "https://deno.land/std@0.173.0/fmt/colors.ts";

const deploymentTargetsSharedLabel = white("deployment-targets/shared:");

interface CNDIGeneratedValues {
  sealedSecretsKeys: SealedSecretsKeys;
  terraformStatePassphrase: string;
  argoUIAdminPassword: string;
}

const getCoreEnvObject = async (
  cndiGeneratedValues: CNDIGeneratedValues,
  deploymentTarget: DeploymentTarget,
  interactive: boolean,
): Promise<EnvObject> => {
  const {
    sealedSecretsKeys,
    terraformStatePassphrase,
    argoUIAdminPassword,
  } = cndiGeneratedValues;

  // git
  const GIT_USERNAME = "";
  const GIT_REPO = "";
  const GIT_PASSWORD = "";

  const TERRAFORM_STATE_PASSPHRASE = terraformStatePassphrase;
  const ARGO_UI_ADMIN_PASSWORD = argoUIAdminPassword;

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

  if (!ARGO_UI_ADMIN_PASSWORD) {
    console.log(
      deploymentTargetsSharedLabel,
      brightRed(`"argoUIAdminPassword" is not defined in context`),
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
    ARGO_UI_ADMIN_PASSWORD: {
      comment: "ArgoUI",
      value: ARGO_UI_ADMIN_PASSWORD,
    },
    TERRAFORM_STATE_PASSPHRASE: {
      comment: "Passphrase for encrypting/decrypting terraform state",
      value: TERRAFORM_STATE_PASSPHRASE,
    },
  };

  coreEnvObject.GIT_USERNAME = {
    comment: "git credentials",
    value: interactive
      ? ((await Input.prompt({
        message: cyan("Enter your GitHub username:"),
        default: GIT_USERNAME,
      })) as string)
      : GIT_USERNAME,
  };

  coreEnvObject.GIT_PASSWORD = {
    value: interactive
      ? ((await Secret.prompt({
        message: cyan("Enter your GitHub Personal Access Token:"),
        default: GIT_PASSWORD,
      })) as string)
      : GIT_PASSWORD,
  };

  coreEnvObject.GIT_REPO = {
    value: interactive
      ? await Input.prompt({
        message: cyan("Enter your GitHub repository URL:"),
        default: GIT_REPO,
      })
      : GIT_REPO,
  };

  switch (deploymentTarget) {
    case DEPLOYMENT_TARGET.aws:
      return {
        ...coreEnvObject,
        ...(await prepareAWSEnv(interactive)),
      };
    case DEPLOYMENT_TARGET.gcp:
      return {
        ...coreEnvObject,
        ...(await prepareGCPEnv(interactive)),
      };
    case DEPLOYMENT_TARGET.azure:
      return {
        ...coreEnvObject,
        ...(await prepareAzureEnv(interactive)),
      };
    default:
      console.log(brightRed(`kind "${deploymentTarget}" is not yet supported`));
      Deno.exit(1);
  }
};

const availableDeploymentTargets = Object.values(DEPLOYMENT_TARGET);

export { availableDeploymentTargets, getCoreEnvObject };
