import { getPrettyJSONString } from "src/utils.ts";

export default function getAWSLocalsTFJSON(): string {
  return getPrettyJSONString({
    locals: [
      {
        region: "",
        leader_node_ip: "",
        node_count: "",
        cndi_project_name: "",
        bootstrap_token: "${random_password.generated_token.result}",
        availability_zones: "${sort(setintersection(data.aws_ec2_instance_type_offerings.available_az_for_x-airflow-node_instance_type.locations,data.aws_ec2_instance_type_offerings.available_az_for_y-airflow-node_instance_type.locations,data.aws_ec2_instance_type_offerings.available_az_for_z-airflow-node_instance_type.locations))}",
      },
    ],
  });
}
