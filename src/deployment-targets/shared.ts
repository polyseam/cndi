import {
  DEPLOYMENT_TARGET,
  DeploymentTarget,
  EnvLines,
  SealedSecretsKeys,
} from "../types.ts";

import { getAWSEnvLines } from "../deployment-targets/aws.ts";
import { getGCPEnvLines } from "../deployment-targets/gcp.ts";
import { getAzureEnvLines } from "../deployment-targets/azure.ts";
import { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/colors.ts";

const deploymentTargetsSharedLabel = colors.white(
  "\nsrc/deployment-targets/shared:",
);

interface CNDIGeneratedValues {
  sealedSecretsKeys: SealedSecretsKeys;
  terraformStatePassphrase: string;
  argoUIAdminPassword: string;
}

const getCoreEnvLines = async (
  cndiGeneratedValues: CNDIGeneratedValues,
  deploymentTarget: DeploymentTarget,
  interactive: boolean,
): Promise<EnvLines> => {
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
      colors.brightRed(`"sealedSecretsKeys" is not defined in context`),
    );
    Deno.exit(1);
  }

  if (!TERRAFORM_STATE_PASSPHRASE) {
    console.log(
      deploymentTargetsSharedLabel,
      colors.brightRed(`"terraformStatePassphrase" is not defined in context`),
    );
    Deno.exit(1);
  }

  if (!ARGO_UI_ADMIN_PASSWORD) {
    console.log(
      deploymentTargetsSharedLabel,
      colors.brightRed(`"argoUIAdminPassword" is not defined in context`),
    );
    Deno.exit(1);
  }

  const coreEnvLines: EnvLines = [
    { comment: "Sealed Secrets keys for Kubeseal" },
    {
      value: {
        SEALED_SECRETS_PUBLIC_KEY: sealedSecretsKeys.sealed_secrets_public_key,
      },
    },
    {
      value: {
        SEALED_SECRETS_PRIVATE_KEY:
          sealedSecretsKeys.sealed_secrets_private_key,
      },
    },
    { comment: "ArgoCD" },
    { value: { ARGO_UI_ADMIN_PASSWORD } },
    { comment: "Passphrase for encrypting/decrypting terraform state" },
    { value: { TERRAFORM_STATE_PASSPHRASE } },
    { comment: "git credentials" },
    { value: { GIT_USERNAME } },
    { value: { GIT_REPO } },
    { value: { GIT_PASSWORD } },
  ];

  switch (deploymentTarget) {
    case DEPLOYMENT_TARGET.aws:
      return [...coreEnvLines, ...(await getAWSEnvLines(interactive))];
    case DEPLOYMENT_TARGET.gcp:
      return [...coreEnvLines, ...(await getGCPEnvLines(interactive))];
    case DEPLOYMENT_TARGET.azure:
      return [...coreEnvLines, ...(await getAzureEnvLines(interactive))];
    default:
      console.log(
        colors.brightRed(`kind "${deploymentTarget}" is not yet supported`),
      );
      Deno.exit(1);
  }
};

const availableDeploymentTargets = Object.values(DEPLOYMENT_TARGET);

export { availableDeploymentTargets, getCoreEnvLines };
