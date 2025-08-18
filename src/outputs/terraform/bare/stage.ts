import { ErrOut } from "errout";
import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { stageBareK3sTerraformFiles } from "./k3s/stage.ts";
import { ccolors } from "deps";

const label = ccolors.faded("src/outputs/terraform/bare/stage.ts");

/**
 * Stages Terraform files for bare provider deployments
 */
export default async function stageBareProviderTerraform(
  cndi_config: NormalizedCNDIConfig,
): Promise<null | ErrOut> {
  const distribution = cndi_config?.distribution ?? "k3s";

  switch (distribution) {
    case "k3s":
      return await stageBareK3sTerraformFiles(cndi_config);
    default:
      return new ErrOut([
        `Unsupported distribution "${distribution}" for "bare" provider`,
      ], {
        code: 1300,
        id: "stageBareProviderTerraform/unsupported-distribution",
        label,
      });
  }
}
