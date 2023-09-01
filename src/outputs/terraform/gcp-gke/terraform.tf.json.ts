import { getPrettyJSONString } from "src/utils.ts";
import getTerraform from "src/outputs/terraform/shared/basicTerraform.ts";
export default function getGCPTerraformTFJSON() {
  const terraform = getTerraform({
    google: {
      source: "hashicorp/google",
      version: "~> 4.80.0",
    },
  });

  return getPrettyJSONString(terraform);
}
