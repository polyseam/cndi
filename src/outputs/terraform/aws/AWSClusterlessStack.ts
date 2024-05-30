import {
  App,
  CDKTFProviderAWS,
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

const DEFAULT_AWS_REGION = "us-east-1";
const CNDI_MAJOR_VERSION = "v2";

class AWSClusterlessTerraformStack extends TerraformStack {
  variables: Record<string, TerraformVariable> = {};
  locals: Record<string, TerraformLocal> = {};

  constructor(scope: Construct, name: string, cndi_config: CNDIConfig) {
    super(scope, name);

    this.locals.cndi_project_name = new TerraformLocal(
      this,
      "cndi_project_name",
      cndi_config.project_name,
    );

    const project_name = this.locals.cndi_project_name.asString;

    const aws_region = (Deno.env.get("AWS_REGION") as string) ||
      DEFAULT_AWS_REGION;

    this.locals.aws_region = new TerraformLocal(this, "aws_region", aws_region);

    new CDKTFProviderAWS.provider.AwsProvider(this, "cndi_aws_provider", {
      region: this.locals.aws_region.asString,
      defaultTags: [
        {
          tags: { CNDIVersion: CNDI_MAJOR_VERSION, CNDIProject: project_name! },
        },
      ],
    });

    const query = JSON.stringify({
      ResourceTypeFilters: ["AWS::AllSupported"],
      TagFilters: [
        {
          Key: "CNDIProject",
          Values: [`${project_name}`],
        },
      ],
    });

    new CDKTFProviderAWS.resourcegroupsGroup.ResourcegroupsGroup(
      this,
      `cndi_aws_resource_group`,
      {
        name: `cndi-rg_${project_name}`,
        tags: {
          Name: `cndi-rg_${project_name}`,
        },
        resourceQuery: {
          query,
        },
      },
    );
  }
}

async function stageTerraformSynthAWSClusterless(cndi_config: CNDIConfig) {
  const cdktfAppConfig = await getCDKTFAppConfig();
  const app = new App(cdktfAppConfig);
  new AWSClusterlessTerraformStack(app, `_cndi_stack_`, cndi_config);

  // write terraform stack to staging directory
  await stageCDKTFStack(app);

  const input: TFBlocks = {
    ...cndi_config?.infrastructure?.terraform,
  };

  // patch cdk.tf.json with user's terraform pass-through
  await patchAndStageTerraformFilesWithInput(input);
}

export { stageTerraformSynthAWSClusterless };
