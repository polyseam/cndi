import { CNDIConfig } from "src/types.ts";
import { stageGCPGKETerraformFiles } from "./gke/stage.ts";
import { ErrOut } from "errout";
import { ccolors } from "deps";

const label = ccolors.faded(
  "\nsrc/outputs/terraform/gcp/stage.ts:\n",
);

export default async function stageTerraformFilesForGCPGKE(
  cndi_config: CNDIConfig,
): Promise<null | ErrOut> {
  const distribution = cndi_config?.distribution ?? "gke";
  switch (distribution) {
    case "gke":
      return await stageGCPGKETerraformFiles(cndi_config);
    case "clusterless":
      return null;
    case "microk8s":
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
