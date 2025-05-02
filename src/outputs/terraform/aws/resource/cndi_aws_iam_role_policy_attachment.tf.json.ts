import { getPrettyJSONString } from "src/utils.ts";

import { CNDIConfig } from "src/types.ts";

interface AWS_IAM_ROLE_POLICY_ATTACHMENT {
  policy_arn: string;
  role: string;
}

export default function (_cndi_config: CNDIConfig) {
  const aws_iam_role_policy_attachment: Record<
    string,
    AWS_IAM_ROLE_POLICY_ATTACHMENT
  > = {
    cndi_aws_iam_role_policy_attachment_ebs_efs: {
      policy_arn: "${aws_iam_policy.cndi_aws_iam_policy_ebs_efs.arn}",
      role: "${aws_iam_role.cndi_iam_role_compute.name}",
    },
    cndi_aws_iam_role_policy_attachment_ec2_container_registryreadonly_policy: {
      policy_arn: "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
      role: "${aws_iam_role.cndi_iam_role_compute.name}",
    },
    cndi_aws_iam_role_policy_attachment_eks_cni_policy: {
      policy_arn: "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
      role: "${aws_iam_role.cndi_iam_role_compute.name}",
    },
    cndi_aws_iam_role_policy_attachment_eks_worker_node_policy: {
      policy_arn: "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
      role: "${aws_iam_role.cndi_iam_role_compute.name}",
    },
  };

  return getPrettyJSONString({
    resource: {
      aws_iam_role_policy_attachment,
    },
  });
}
