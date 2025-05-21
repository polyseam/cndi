import { CNDIConfig } from "src/types.ts";
import { stageAWSEKSTerraformFiles } from "./eks/stage.ts";
import { ErrOut } from "errout";
import { ccolors } from "deps";

const label = ccolors.faded(
  "\nsrc/outputs/terraform/aws/stage.ts:\n",
);

export default async function stageTerraformFilesForAWSEKS(
  cndi_config: CNDIConfig,
): Promise<null | ErrOut> {
  const distribution = cndi_config?.distribution ?? "eks";
  switch (distribution) {
    case "eks":
      return await stageAWSEKSTerraformFiles(cndi_config);
    case "clusterless":
      return null;
    case "microk8s":
    default:
      return new ErrOut([
        ccolors.error(
          "Unsupported AWS distribution. Please use",
        ),
        "eks",
        ccolors.error("instead of"),
        cndi_config.distribution,
      ], {
        label,
        code: -1,
        id: "unsupported-aws-distribution",
      });
  }
}
