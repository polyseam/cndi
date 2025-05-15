import { CNDIConfig } from "src/types.ts";
import { stageAzureAKSClassicTerraformFiles } from "./aks-classic/stage.ts";
import { ErrOut } from "src/ErrOut.ts";
import { ccolors } from "src/deps.ts";

const _useAKSAutomatic = (
  cndi_config: CNDIConfig,
) => (cndi_config?.infrastructure?.cndi?.nodes as unknown === "automatic");

const label = ccolors.faded(
  "src/outputs/terraform/azure/stage.ts:",
);

export default async function stageTerraformFilesForAZUREEKS(
  cndi_config: CNDIConfig,
): Promise<null | ErrOut> {
  const distribution = cndi_config?.distribution ?? "aks";
  switch (distribution) {
    case "aks":
      return await stageAzureAKSClassicTerraformFiles(cndi_config);
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
