import { getPrettyJSONString } from "src/utils.ts";
import getTerraform from "src/outputs/terraform/shared/basicTerraform.ts";

export default function getAzureTerraformTFJSON() {
  const terraform = getTerraform({
    azurerm: {
      source: "hashicorp/azurerm",
      version: "~> 3.0.2",
    },
    random: { source: "hashicorp/random", version: "3.5.1" },
  });

  return getPrettyJSONString(terraform);
}
