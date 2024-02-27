import { ccolors, path } from "deps";
import { CNDIConfig } from "src/types.ts";
import { stageFile, useSshRepoAuth } from "src/utils.ts";
import { stageTerraformSynthAWSMicrok8s } from "src/outputs/terraform/aws/AWSMicrok8sStack.ts";
import { stageTerraformSynthAWSEKS } from "src/outputs/terraform/aws/AWSEKSStack.ts";
import { stageTerraformSynthAzureMicrok8s } from "src/outputs/terraform/azure/AzureMicrok8sStack.ts";
import { stageTerraformSynthAzureAKS } from "src/outputs/terraform/azure/AzureAKSStack.ts";
import { stageTerraformSynthGCPMicrok8s } from "src/outputs/terraform/gcp/GCPMicrok8sStack.ts";
import { stageTerraformSynthGCPGKE } from "src/outputs/terraform/gcp/GCPGKEStack.ts";
import { stageTerraformSynthDevMultipassMicrok8s } from "src/outputs/terraform/dev/DevMultipassMicrok8sStack.ts";

import microk8sCloudInitLeaderTerraformTemplate from "src/cloud-init/microk8s/leader.yml.ts";
import microk8sCloudInitFollowerTerraformTemplate from "src/cloud-init/microk8s/follower.yml.ts";

const stageTerraformResourcesForConfigLabel = ccolors.faded(
  "src/outputs/terraform/stageTerraformResourcesForConfig.ts:",
);

const ensureValidGoogleCredentials = () => {
  const key = Deno.env.get("GOOGLE_CREDENTIALS");

  if (!key) {
    throw new Error(
      [
        stageTerraformResourcesForConfigLabel,
        ccolors.key_name(`"GOOGLE_CREDENTIALS"`),
        ccolors.error("env variable not set"),
      ].join(" "),
      {
        cause: 4300,
      },
    );
  }

  try {
    JSON.parse(key);
  } catch {
    throw new Error(
      [
        stageTerraformResourcesForConfigLabel,
        ccolors.key_name(`"GOOGLE_CREDENTIALS"`),
        ccolors.error("env variable is not valid JSON"),
      ].join(" "),
      {
        cause: 4301,
      },
    );
  }
};

export default async function stageTerraformResourcesForConfig(
  config: CNDIConfig,
  // options: { output: string; initializing: boolean },
) {
  const { distribution, provider } = config;

  const label = `${provider}/${distribution}`;

  switch (label) {
    case "aws/microk8s":
      await stageTerraformSynthAWSMicrok8s(config);
      break;
    case "aws/eks":
      await stageTerraformSynthAWSEKS(config);
      break;
    case "gcp/gke":
      ensureValidGoogleCredentials();
      await stageTerraformSynthGCPGKE(config);
      break;
    case "gcp/microk8s":
      ensureValidGoogleCredentials();
      await stageTerraformSynthGCPMicrok8s(config);
      break;
    case "azure/microk8s":
      await stageTerraformSynthAzureMicrok8s(config);
      break;
    case "azure/aks":
      await stageTerraformSynthAzureAKS(config);
      break;
    case "dev/microk8s":
      await stageTerraformSynthDevMultipassMicrok8s(config);
      break;
    default:
      throw new Error(`Unknown label: ${label}`);
  }

  await Promise.all([
    // write tftpl terraform template for the user_data bootstrap script
    stageFile(
      path.join("cndi", "terraform", "microk8s-cloud-init-leader.yml.tftpl"),
      microk8sCloudInitLeaderTerraformTemplate(config, {
        useSshRepoAuth: useSshRepoAuth(),
        useClusterHA: config.infrastructure.cndi.nodes.length > 2,
      }),
    ),
    // this file may be extra
    stageFile(
      path.join(
        "cndi",
        "terraform",
        "microk8s-cloud-init-controller.yml.tftpl",
      ),
      microk8sCloudInitFollowerTerraformTemplate(config),
    ),
    // this file may be extra
    stageFile(
      path.join("cndi", "terraform", "microk8s-cloud-init-worker.yml.tftpl"),
      microk8sCloudInitFollowerTerraformTemplate(config, { isWorker: true }),
    ),
  ]);
}
