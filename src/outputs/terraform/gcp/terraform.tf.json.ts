import { getPrettyJSONString } from "../../../utils.ts";
import getTerraform from "../shared/basicTerraform.ts";

export default function getGCPTerraformTFJSON() {
  const terraform = getTerraform();

  terraform.required_providers.push({
    google: {
      source: "hashicorp/google",
      version: "~> 4.44",
    },
  });

  return getPrettyJSONString(terraform);
}
