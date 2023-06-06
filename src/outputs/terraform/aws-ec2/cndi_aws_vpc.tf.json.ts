import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSVPCTFJSON(): string {
  const resource = getTFResource("aws_vpc", {
    cidr_block: "10.0.0.0/16",
    enable_dns_hostnames: true,
    enable_dns_support: true,
    tags: {
      Name:
        "VPC", /*, TODO: delete or uncomment CNDIProject: "${local.cndi_project_name}"*/
    },
  });
  return getPrettyJSONString(resource);
}
