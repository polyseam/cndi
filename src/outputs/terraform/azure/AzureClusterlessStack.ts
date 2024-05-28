import {
  App,
  CDKTFProviderAzure,
  Construct,
  stageCDKTFStack,
  TerraformLocal,
  TerraformStack,
  TerraformVariable,
} from "cdktf-deps";

import { CNDIConfig, TFBlocks } from "src/types.ts";

import {
  getCDKTFAppConfig,
  patchAndStageTerraformFilesWithInput,
} from "src/utils.ts";

const DEFAULT_ARM_REGION = "eastus";

class AzureClusterlessTerraformStack extends TerraformStack {
  rg: CDKTFProviderAzure.resourceGroup.ResourceGroup;
  variables: Record<string, TerraformVariable> = {};
  locals: Record<string, TerraformLocal> = {};
  constructor(scope: Construct, name: string, cndi_config: CNDIConfig) {
    super(scope, name);
    this.locals.cndi_project_name = new TerraformLocal(
      this,
      "cndi_project_name",
      cndi_config.project_name,
    );
    const ARM_REGION = (Deno.env.get("ARM_REGION") as string) ||
      DEFAULT_ARM_REGION;

    this.locals.arm_region = new TerraformLocal(
      this,
      "cndi_arm_region",
      ARM_REGION,
    );

    new CDKTFProviderAzure.provider.AzurermProvider(
      this,
      "cndi_azurerm_provider",
      {
        features: {},
      },
    );

    this.rg = new CDKTFProviderAzure.resourceGroup.ResourceGroup(
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

async function stageTerraformSynthAzureClusterless(cndi_config: CNDIConfig) {
  const cdktfAppConfig = await getCDKTFAppConfig();
  const app = new App(cdktfAppConfig);
  new AzureClusterlessTerraformStack(app, `_cndi_stack_`, cndi_config);

  // write terraform stack to staging directory
  await stageCDKTFStack(app);

  const input: TFBlocks = {
    ...cndi_config?.infrastructure?.terraform,
  };

  // patch cdk.tf.json with user's terraform pass-through
  await patchAndStageTerraformFilesWithInput(input);
}

export { stageTerraformSynthAzureClusterless };
