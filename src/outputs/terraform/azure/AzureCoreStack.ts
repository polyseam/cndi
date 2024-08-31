import { CDKTFProviderAzurerm, Construct, TerraformLocal } from "cdktf-deps";
import { CNDIConfig } from "src/types.ts";
import { CNDITerraformStack } from "../CNDICoreTerraformStack.ts";

const DEFAULT_ARM_REGION = "eastus";
// const CNDI_MAJOR_VERSION = "v2";

export default class AzureCoreTerraformStack extends CNDITerraformStack {
  rg: CDKTFProviderAzurerm.resourceGroup.ResourceGroup;
  constructor(scope: Construct, name: string, cndi_config: CNDIConfig) {
    super(scope, name, cndi_config);

    const ARM_REGION = (Deno.env.get("ARM_REGION") as string) ||
      DEFAULT_ARM_REGION;

    this.locals.arm_region = new TerraformLocal(
      this,
      "cndi_arm_region",
      ARM_REGION,
    );

    new CDKTFProviderAzurerm.provider.AzurermProvider(
      this,
      "cndi_azurerm_provider",
      {
        features: {},
      },
    );

    this.rg = new CDKTFProviderAzurerm.resourceGroup.ResourceGroup(
      this,
      "cndi_azurerm_resource_group",
      {
        location: this.locals.arm_region.asString,
        name: `rg-${this.locals.cndi_project_name.asString}`,
        tags: { CNDIProject: this.locals.cndi_project_name.asString },
      },
    );
  }
}
