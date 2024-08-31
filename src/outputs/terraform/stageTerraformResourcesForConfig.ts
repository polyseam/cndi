import { ccolors, path } from "deps";
import { CNDIConfig } from "src/types.ts";
import { stageFile, useSshRepoAuth } from "src/utils.ts";
import { stageTerraformSynthAWSEKS } from "src/outputs/terraform/aws/AWSEKSStack.ts";
import { stageTerraformSynthAWSClusterless } from "src/outputs/terraform/aws/AWSClusterlessStack.ts";
import { stageTerraformSynthAzureAKS } from "src/outputs/terraform/azure/AzureAKSStack.ts";
import { stageTerraformSynthAzureClusterless } from "src/outputs/terraform/azure/AzureClusterlessStack.ts";
import { stageTerraformSynthGCPGKE } from "src/outputs/terraform/gcp/GCPGKEStack.ts";
import { stageTerraformSynthGCPClusterless } from "src/outputs/terraform/gcp/GCPClusterlessStack.ts";

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
        cause: 803,
      },
    );
  }

  if (key === "__GOOGLE_CREDENTIALS_PLACEHOLDER__") {
    throw new Error(
      [
        stageTerraformResourcesForConfigLabel,
        ccolors.key_name(`"GOOGLE_CREDENTIALS"`),
        ccolors.error(
          "placeholder value must be replaced with a valid JSON key",
        ),
      ].join(" "),
      {
        cause: 804,
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
        cause: 805,
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
    case "aws/eks":
      await stageTerraformSynthAWSEKS(config);
      break;
    case "aws/clusterless":
      await stageTerraformSynthAWSClusterless(config);
      break;
    case "gcp/gke":
      ensureValidGoogleCredentials();
      await stageTerraformSynthGCPGKE(config);
      break;
    case "gcp/clusterless":
      ensureValidGoogleCredentials();
      await stageTerraformSynthGCPClusterless(config);
      break;
    case "azure/aks":
      await stageTerraformSynthAzureAKS(config);
      break;
    case "azure/clusterless":
      await stageTerraformSynthAzureClusterless(config);
      break;
    case "dev/clusterless":
      console.log(
        ccolors.user_input("dev/clusterless"),
        ccolors.error("is not available"),
      );
      break;
    default:
      throw new Error(`Unknown label: ${label}`);
  }

  if (distribution === "microk8s") {
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
}
