import { getPrettyJSONString } from "src/utils.ts";

import { CNDIConfig } from "src/types.ts";

interface Azure_IAM_ROLE_POLICY_ATTACHMENT {
  policy_arn: string;
  role: string;
}

export default function (_cndi_config: CNDIConfig) {
  const azure_iam_role_policy_attachment: Record<
    string,
    Azure_IAM_ROLE_POLICY_ATTACHMENT
  > = {
    cndi_azure_iam_role_policy_attachment_ebs_efs: {
      policy_arn: "${azure_iam_policy.cndi_azure_iam_policy.arn}",
      role: "${azure_iam_role.cndi_azure_iam_role.name}",
    },
    cndi_azure_iam_role_policy_attachment_ec2_container_registryreadonly_policy:
      {
        policy_arn:
          "arn:azure:iam::azure:policy/AmazonEC2ContainerRegistryReadOnly",
        role: "${azure_iam_role.cndi_azure_iam_role.name}",
      },
    cndi_azure_iam_role_policy_attachment_aks_cni_policy: {
      policy_arn: "arn:azure:iam::azure:policy/AmazonAKS_CNI_Policy",
      role: "${azure_iam_role.cndi_azure_iam_role.name}",
    },
    cndi_azure_iam_role_policy_attachment_aks_worker_node_policy: {
      policy_arn: "arn:azure:iam::azure:policy/AmazonAKSWorkerNodePolicy",
      role: "${azure_iam_role.cndi_azure_iam_role.name}",
    },
  };

  return getPrettyJSONString({
    resource: {
      azure_iam_role_policy_attachment,
    },
  });
}
