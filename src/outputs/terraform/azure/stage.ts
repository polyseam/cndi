import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { stageAzureAKSTerraformFiles } from "./aks/stage.ts";
import { ErrOut } from "errout";
import { ccolors } from "deps";

const label = ccolors.faded(
  "src/outputs/terraform/azure/stage.ts:",
);

export default async function stageTerraformFilesForAZUREEKS(
  cndi_config: NormalizedCNDIConfig,
): Promise<null | ErrOut> {
  const distribution = cndi_config?.distribution ?? "aks";
  switch (distribution) {
    case "aks":
      return await stageAzureAKSTerraformFiles(cndi_config);
    case "clusterless":
      return null;
    case "microk8s":
    default:
      return new ErrOut([
        ccolors.error(
          "Unsupported Azure distribution. Please use",
        ),
        "aks",
        ccolors.error("instead of"),
        cndi_config.distribution,
      ], {
        label,
        code: -1,
        id: "unsupported-azure-distribution",
      });
  }
}
