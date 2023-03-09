import { getPrettyJSONString } from "src/utils.ts";

interface GetAWSLocalsTFJSONArgs {
  aws_region: string;
  leader_node_ip: string;
}

export default function getAWSLocalsTFJSON(
  { aws_region, leader_node_ip }: GetAWSLocalsTFJSONArgs,
): string {
  return getPrettyJSONString({
    locals: [
      {
        aws_region,
        leader_node_ip,
        bootstrap_token: "${random_password.generated_token.result}",
        // node_count: "", may be useful for az redundancy
        // availability_zones: this used to be in the locals, now it's in data.tf.json
      },
    ],
  });
}
