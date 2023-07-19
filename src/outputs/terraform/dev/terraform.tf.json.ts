import { getPrettyJSONString } from "src/utils.ts";
import getTerraform from "src/outputs/terraform/shared/basicTerraform.ts";

export default function getDevTerraformTFJSON() {
  const terraform = getTerraform({
    multipass: {
      source: "larstobi/multipass",
      version: "~> 1.4.2",
    },
  });

  return getPrettyJSONString(terraform);
}
