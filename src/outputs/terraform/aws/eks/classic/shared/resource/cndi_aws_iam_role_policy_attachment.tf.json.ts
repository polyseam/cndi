import { getPrettyJSONString } from "src/utils.ts";

import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";

interface AwsIamRolePolicyAttachment {
  policy_arn: string;
  role: string;
}

export default function (_cndi_config: NormalizedCNDIConfig) {
  const aws_iam_role_policy_attachment: Record<
    string,
    AwsIamRolePolicyAttachment
  > = {
    cndi_aws_iam_role_policy_attachment_ebs_efs: {
      policy_arn: "${aws_iam_policy.cndi_aws_iam_policy.arn}",
      role: "${aws_iam_role.cndi_aws_iam_role.name}",
    },
    cndi_aws_iam_role_policy_attachment_ec2_container_registryreadonly_policy: {
      policy_arn: "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
      role: "${aws_iam_role.cndi_aws_iam_role.name}",
    },
    cndi_aws_iam_role_policy_attachment_eks_cni_policy: {
      policy_arn: "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
      role: "${aws_iam_role.cndi_aws_iam_role.name}",
    },
    cndi_aws_iam_role_policy_attachment_eks_worker_node_policy: {
      policy_arn: "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
      role: "${aws_iam_role.cndi_aws_iam_role.name}",
    },
  };

  return getPrettyJSONString({
    resource: {
      aws_iam_role_policy_attachment,
    },
  });
}
