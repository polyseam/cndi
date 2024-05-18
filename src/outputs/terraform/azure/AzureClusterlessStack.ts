import {
  App,
  CDKTFProviderAzure,
  Construct,
  stageCDKTFStack,
  TerraformLocal,
  TerraformStack,
} from "cdktf-deps";
import { CNDIConfig, TFBlocks } from "src/types.ts";
import {
  getCDKTFAppConfig,
  patchAndStageTerraformFilesWithInput,
} from "src/utils.ts";

class AzureClusterlessTerraformStack extends TerraformStack {
  constructor(scope: Construct, name: string, cndi_config: CNDIConfig) {
    super(scope, name);
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

  console.log("patching clusterless");

  // patch cdk.tf.json with user's terraform pass-through
  await patchAndStageTerraformFilesWithInput(input);
}

export { stageTerraformSynthAzureClusterless };
