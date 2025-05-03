import { ccolors, path } from "deps";
import { CNDIConfig } from "src/types.ts";
import { stageFile, useSshRepoAuth } from "src/utils.ts";
import stageTerraformFilesForAWSEKS from "./aws/stage.ts";
import { stageTerraformSynthAzureMicrok8s } from "src/outputs/terraform/azure/AzureMicrok8sStack.ts";
import { stageTerraformSynthAzureAKS } from "src/outputs/terraform/azure/AzureAKSStack.ts";
import { stageTerraformSynthAzureClusterless } from "src/outputs/terraform/azure/AzureClusterlessStack.ts";
import { stageTerraformSynthGCPMicrok8s } from "src/outputs/terraform/gcp/GCPMicrok8sStack.ts";
import { stageTerraformSynthGCPGKE } from "src/outputs/terraform/gcp/GCPGKEStack.ts";
import { stageTerraformSynthGCPClusterless } from "src/outputs/terraform/gcp/GCPClusterlessStack.ts";
import { stageTerraformSynthDevMultipassMicrok8s } from "src/outputs/terraform/dev/DevMultipassMicrok8sStack.ts";
import { ErrOut } from "errout";

import microk8sCloudInitLeaderTerraformTemplate from "src/cloud-init/microk8s/leader.yml.ts";
import microk8sCloudInitFollowerTerraformTemplate from "src/cloud-init/microk8s/follower.yml.ts";

const label = ccolors.faded(
  "src/outputs/terraform/stageTerraformResourcesForConfig.ts:",
);

export default async function stageTerraformResourcesForConfig(
  config: CNDIConfig,
  // options: { output: string; initializing: boolean },
): Promise<ErrOut | null> {
  let errStagingStack: ErrOut | null = null;
  const { distribution, provider } = config;

  const deploymentTargetLabel = `${provider}/${distribution}`;

  switch (deploymentTargetLabel) {
    case "aws/microk8s":
      // errStagingStack = await stageTerraformSynthAWSMicrok8s(config);
      break;
    case "aws/eks":
      errStagingStack = await stageTerraformFilesForAWSEKS(config);
      break;
    case "aws/clusterless":
      // errStagingStack = await stageTerraformSynthAWSClusterless(config);
      break;
    case "gcp/gke":
      errStagingStack = await stageTerraformSynthGCPGKE(config);
      break;
    case "gcp/clusterless":
      errStagingStack = await stageTerraformSynthGCPClusterless(config);
      break;
    case "gcp/microk8s":
      errStagingStack = await stageTerraformSynthGCPMicrok8s(config);
      break;
    case "azure/microk8s":
      errStagingStack = await stageTerraformSynthAzureMicrok8s(config);
      break;
    case "azure/aks":
      errStagingStack = await stageTerraformSynthAzureAKS(config);
      break;
    case "azure/clusterless":
      errStagingStack = await stageTerraformSynthAzureClusterless(config);
      break;
    case "dev/clusterless":
      console.log(
        ccolors.user_input("dev/clusterless"),
        ccolors.error("is not available"),
      );
      break;
    case "dev/microk8s":
      errStagingStack = await stageTerraformSynthDevMultipassMicrok8s(config);
      break;
    default:
      return new ErrOut([
        ccolors.error(`unknown`),
        ccolors.key_name("deployment-target-label"),
        ccolors.user_input(`"${deploymentTargetLabel}"`),
      ], {
        label,
        code: 801,
        id: "unknown(deploymentTargetLabel)",
        metadata: { deploymentTargetLabel },
      });
  }

  if (distribution === "microk8s") {
    const errStagingLeaderCloudInit = await stageFile(
      path.join("cndi", "terraform", "microk8s-cloud-init-leader.yml.tftpl"),
      microk8sCloudInitLeaderTerraformTemplate(config, {
        useSshRepoAuth: useSshRepoAuth(),
        useClusterHA: config.infrastructure.cndi.nodes.length > 2,
      }),
    );
    if (errStagingLeaderCloudInit) {
      return errStagingLeaderCloudInit;
    }
    const errStagingFollowerCloudInit = await stageFile(
      path.join("cndi", "terraform", "microk8s-cloud-init-worker.yml.tftpl"),
      microk8sCloudInitFollowerTerraformTemplate(config, { isWorker: true }),
    );
    if (errStagingFollowerCloudInit) {
      return errStagingFollowerCloudInit;
    }
  }
  return errStagingStack;
}
