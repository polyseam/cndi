import { CNDIConfig } from "src/types.ts";
import { stageGCPGKEClassicTerraformFiles } from "./gke-classic/stage.ts";
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
  switch (cndi_config.distribution) {
    case "gke":
      return await stageGCPGKEClassicTerraformFiles(cndi_config);
    case "microk8s":
    case "clusterless":
    default:
      return new ErrOut([
        ccolors.error(
          "Unsupported GCP distribution. Please use",
        ),
        "gke",
        ccolors.error("instead of"),
        cndi_config.distribution,
      ], {
        label,
        code: -1,
        id: "unsupported-gcp-distribution",
      });
  }
}
