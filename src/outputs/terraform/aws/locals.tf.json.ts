import { getPrettyJSONString } from "src/utils.ts";
import { AWSNodeItemSpec } from "src/types.ts";

interface GetAWSLocalsTFJSONArgs {
  aws_region: string;
  leader_node_ip: string;
  nodes: Array<AWSNodeItemSpec>;
}

export default function getAWSLocalsTFJSON(
  { aws_region, leader_node_ip, nodes }: GetAWSLocalsTFJSONArgs,
): string {

  const availabilityZoneKeys = nodes.map((node) => {
    const azKey = `available_az_for_${node.name}_instance_type`;
    return `data.aws_ec2_instance_type_offerings.${azKey}.locations`;
  });

  const availability_zones = `\${sort(setintersection(${
    availabilityZoneKeys.join(
      ",",
    )
  }))}`;

  return getPrettyJSONString({
    locals: [
      {
        aws_region,
        leader_node_ip,
        bootstrap_token: "${random_password.generated_token.result}",
        availability_zones,
        // node_count: "", may be useful for az redundancy
        // availability_zones: this used to be in the locals, now it's in data.tf.json
      },
    ],
  });
}
