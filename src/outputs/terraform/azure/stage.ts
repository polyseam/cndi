import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { stageAzureAKSTerraformFiles } from "./aks/stage.ts";
import { stageAzureMicrok8sTerraformFiles } from "./microk8s/stage.ts";
import { ErrOut } from "src/ErrOut.ts";
import { ccolors } from "src/deps.ts";

const _useAKSAutomatic = (
  cndi_config: NormalizedCNDIConfig,
) => (cndi_config?.infrastructure?.cndi?.nodes as unknown === "automatic");

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
      return await stageAzureMicrok8sTerraformFiles(cndi_config);
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
