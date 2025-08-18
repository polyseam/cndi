import {
  getPrettyJSONString,
  getTaintEffectForDistribution,
} from "src/utils.ts";

import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";

import { DEFAULT_AMI_TYPE, DEFAULT_INSTANCE_TYPES } from "consts";

interface AwsEksNodeGroup {
  ami_type: string;
  capacity_type: string;
  cluster_name: string;
  instance_types: string[];
  node_group_name: string;
  launch_template: {
    id: string;
    version: string;
  };
  node_role_arn: string;
  scaling_config: {
    desired_size: number;
    max_size: number;
    min_size: number;
  };
  labels: Record<string, string>;
  tags: Record<string, string>;
  taint: Array<{
    key: string;
    value: string;
    effect: string;
  }>;
  subnet_ids: string;
}

export default function (cndi_config: NormalizedCNDIConfig) {
  const aws_eks_node_group: Record<string, AwsEksNodeGroup> = {};

  if (cndi_config.infrastructure.cndi.nodes !== "auto") {
    // original non-automatic node group
    let i = 0;
    for (const nodeSpec of cndi_config.infrastructure.cndi.nodes) {
      const count = nodeSpec?.count || 1;

      // reduce user intent to scaling configuration
      // count /should/ never be assigned alongside min_count or max_count

      const { min_count, max_count } = nodeSpec;

      const instance_type = nodeSpec?.instance_type ||
        DEFAULT_INSTANCE_TYPES.aws;

      const scaling_config = {
        desired_size: count,
        max_size: count,
        min_size: count,
      };

      if (min_count) {
        scaling_config.desired_size = min_count;
        scaling_config.min_size = min_count;
      }

      if (max_count) {
        scaling_config.max_size = max_count;
      }

      const labels = nodeSpec.labels || {};

      const tags = {
        Name: `cndi-eks-node-group-${nodeSpec.name}`,
        CNDIProject: cndi_config.project_name!,
      };

      const taint = nodeSpec.taints?.map((taint) => ({
        key: taint.key,
        value: taint.value,
        effect: getTaintEffectForDistribution(taint.effect, "eks"), // taint.effect must be valid by now
      })) || [];

      aws_eks_node_group[`cndi_aws_eks_node_group_${i}`] = {
        ami_type: DEFAULT_AMI_TYPE,
        capacity_type: "ON_DEMAND",
        cluster_name: "${module.cndi_aws_eks_module.cluster_name}",
        instance_types: [instance_type],
        node_group_name: nodeSpec.name,
        launch_template: {
          id: `\${aws_launch_template.cndi_aws_launch_template_${i}.id}`,
          version:
            `\${aws_launch_template.cndi_aws_launch_template_${i}.latest_version}`,
        },
        node_role_arn: "${aws_iam_role.cndi_aws_iam_role.arn}",
        scaling_config,
        labels,
        tags,
        taint,
        subnet_ids: "${local.private_subnet_ids}",
      };
      i++;
    }
  }

  return getPrettyJSONString({
    resource: {
      aws_eks_node_group,
    },
  });
}
