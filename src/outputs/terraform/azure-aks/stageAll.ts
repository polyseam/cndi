import { ccolors, path } from "deps";
import { AzureAKSNodeItemSpec, CNDIConfig } from "src/types.ts";
import { emitExitEvent, stageFile } from "src/utils.ts";
import provider from "./provider.tf.json.ts";
import terraform from "./terraform.tf.json.ts";
import cndi_azurerm_resource_group from "./cndi_azurerm_resource_group.tf.json.ts";
import cndi_azurerm_locals from "./locals.tf.json.ts";
import cndi_outputs from "./cndi_outputs.tf.json.ts";
import cndi_aks_cluster from "./cndi_aks_cluster.tf.json.ts";
import cndi_azurerm_public_ip_lb from "./cndi_azurerm_public_ip_lb.tf.json.ts";
export default async function stageTerraformResourcesForAzureAKS(
  config: CNDIConfig,
) {
  const azure_location = (Deno.env.get("ARM_REGION") as string) || "eastus";

  const stageNodes = config.infrastructure.cndi.nodes.map((node) =>
    stageFile(
      path.join(
        "cndi",
        "terraform",
        `cndi_aks_cluster_${node.name}.tf.json`,
      ),
      cndi_aks_cluster(node as AzureAKSNodeItemSpec),
    )
  );
  // stage all the terraform files at once
  try {
    await Promise.all([
      ...stageNodes,
      stageFile(
        path.join("cndi", "terraform", "provider.tf.json"),
        provider(),
      ),
      stageFile(
        path.join("cndi", "terraform", "locals.tf.json"),
        cndi_azurerm_locals({ azure_location }),
      ),
      stageFile(
        path.join("cndi", "terraform", "terraform.tf.json"),
        terraform(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_azurerm_public_ip_lb.tf.json",
        ),
        cndi_azurerm_public_ip_lb(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_outputs.tf.json"),
        cndi_outputs(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_azurerm_resource_group.tf.json",
        ),
        cndi_azurerm_resource_group(),
      ),
    ]);
  } catch (e) {
    console.error(ccolors.error("failed to stage terraform resources"));
    console.log(ccolors.caught(e, 801));
    await emitExitEvent(801);
    Deno.exit(801);
  }
}
