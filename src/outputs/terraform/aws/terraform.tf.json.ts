import { getPrettyJSONString } from "src/utils.ts";
import getTerraform from "src/outputs/terraform/shared/basicTerraform.ts";

export default function getAWSTerraformTFJSON() {
  const terraform = getTerraform({
    aws: {
      source: "hashicorp/aws",
      version: "~> 4.16",
    },
  });
  return getPrettyJSONString(terraform);
}
