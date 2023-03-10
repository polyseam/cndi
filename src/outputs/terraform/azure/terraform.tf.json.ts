import { getPrettyJSONString } from "../../../utils.ts";
import getTerraform from "../shared/basicTerraform.ts";

export default function getAzureTerraformTFJSON() {
  const terraform = getTerraform({
    azurerm: {
      source: "hashicorp/azurerm",
      version: "~> 3.0.2",
    },
  });

  return getPrettyJSONString(terraform);
}
