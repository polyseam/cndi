import { getPrettyJSONString } from "src/utils.ts";

export default function getAWSLbTargetGroupTFJSON(): string {
  return getPrettyJSONString({
    resource: {
      aws_lb_target_group: {
        "cndi_aws_lb_target_group_https": [
          {
            tags: {
              Name: "HTTPSLBTargetGroup",
              CNDIProject: "${local.cndi_project_name}",
            },
            port: 443,
            protocol: "TCP",
            vpc_id: "${aws_vpc.vpc.id}",
          },
        ],
      },
    },
  },
  )
}

