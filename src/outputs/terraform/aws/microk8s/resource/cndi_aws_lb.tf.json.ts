import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

export default function (_cndi_config: CNDIConfig) {
  const project_name = "${local.cndi_project_name}";

  return getPrettyJSONString({
    resource: {
      aws_lb: {
        cndi_aws_lb: {
          internal: false,
          load_balancer_type: "network",
          subnets: ["${aws_subnet.cndi_aws_subnet.id}"],
          tags: {
            Name: `cndi-nlb_${project_name}`,
          },
        },
      },
    },
  });
}
