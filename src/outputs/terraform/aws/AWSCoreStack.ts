import { CDKTFProviderAWS, Construct, TerraformLocal } from "cdktf-deps";
import { CNDIConfig } from "src/types.ts";
import { CNDITerraformStack } from "../CNDICoreTerraformStack.ts";

const DEFAULT_AWS_REGION = "us-east-1";
const CNDI_MAJOR_VERSION = "v2";

export default class AWSCoreTerraformStack extends CNDITerraformStack {
  constructor(scope: Construct, name: string, cndi_config: CNDIConfig) {
    super(scope, name, cndi_config);
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
