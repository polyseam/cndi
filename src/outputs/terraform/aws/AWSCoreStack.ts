import { CDKTFProviderAWS, Construct, TerraformLocal } from "deps";
import { CNDIConfig } from "src/types.ts";
import { CNDITerraformStack } from "../CNDICoreTerraformStack.ts";

const DEFAULT_AWS_REGION = "us-east-1";
const CNDI_MAJOR_VERSION = "v2";

export default class AWSCoreTerraformStack extends CNDITerraformStack {
  constructor(scope: Construct, name: string, cndi_config: CNDIConfig) {
    super(scope, name, cndi_config);
    const { project_name } = cndi_config;
    const aws_region = (Deno.env.get("AWS_REGION") as string) ||
      DEFAULT_AWS_REGION;

    new TerraformLocal(this, "aws_region", aws_region);

    new CDKTFProviderAWS.provider.AwsProvider(this, "aws", {
      region: aws_region,
      defaultTags: [
        {
          tags: { CNDIVersion: CNDI_MAJOR_VERSION, CNDIProject: project_name! },
        },
      ],
    });

    new CDKTFProviderAWS.resourcegroupsGroup.ResourcegroupsGroup(
      this,
      `cndi_aws_resource_group`,
      {
        name: `CNDIResourceGroup_${project_name}`,
        resourceQuery: {
          query: JSON.stringify({
            ResourceTypeFilters: ["AWS::AllSupported"],
            TagFilters: [
              {
                Key: "CNDIProject",
                Values: [`${project_name}`],
              },
            ],
          }),
        },
      },
    );
  }
}
