import { getPrettyJSONString } from "src/utils.ts";
import { AWSNodeItemSpec } from "src/types.ts";
import {
TerraformLocal,
Fn
} from "https://esm.sh/cdktf@0.15.5";
interface GetAWSLocalsTFJSONArgs {
  aws_region: string;
  leader_node_ip: string;
  nodes: Array<AWSNodeItemSpec>;
}

export default function getAWSLocalsTFJSON(
  scope: any,
  id: string,
  { aws_region, leader_node_ip, nodes }: GetAWSLocalsTFJSONArgs,
) {



  // const availabilityZoneKeys = nodes.map((node) => {
  //   const azKey = `available_az_for_${node.name}_instance_type`;
  //   return `data.aws_ec2_instance_type_offerings.${azKey}.locations`;
  // });
  const availabilityZoneKeys = nodes.map((node) => {
    
    const azKey = `available_az_for_${node.name}_instance_type`;
    return `data.aws_ec2_instance_type_offerings.${azKey}.locations`;
  });

  

  const azs = Fn.sort(Fn.setintersection(availabilityZoneKeys));

getPrettyJSONString({
    locals: {
      aws_region,
      leader_node_ip,
      bootstrap_token: "${random_password.cndi_join_token.result}",
      availability_zones,
      // node_count: "", may be useful for az redundancy
      // availability_zones: this used to be in the locals, now it's in data.tf.json
    },
  });
  const l = new TerraformLocal(scope, "cndi_aws_locals", {
    aws_region,
    leader_node_ip,
    bootstrap_token: "${random_password.cndi_join_token.result}",
    availability_zones,
  })
}
