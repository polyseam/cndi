import { getPrettyJSONString } from "src/utils.ts";

export default function getAWSDataTFJSON(): string {
  return getPrettyJSONString({
    "data": {
      "aws_eks_cluster": {
        "cndi_aws_eks_cluster": {
          "name": "${aws_eks_cluster.cndi_aws_eks_cluster.name}",
        },
      },

      "aws_eks_cluster_auth": {
        "cndi_aws_eks_cluster_auth": {
          "name": "${aws_eks_cluster.cndi_aws_eks_cluster.name}",
        },
      },

      "tls_certificate": {
        "cndi_tls_certificate": {
          "url":
            "${aws_eks_cluster.cndi_aws_eks_cluster.identity[0].oidc[0].issuer}",
        },
      },

      "aws_availability_zones": {
        "cndi_aws_availability_zones": {
          "state": "available",
        },
      },

      "aws_eks_node_group": {
        "cndi_aws_eks_node_group": {
          "cluster_name": "${aws_eks_cluster.cndi_aws_eks_cluster.name}",
          "node_group_name":
            "${aws_eks_node_group.cndi_aws_eks_node_group.node_group_name}",
        },
      },

      "aws_caller_identity": {
        "cndi_aws_caller_identity": {},
      },
      "aws_iam_policy_document": {
        "cndi_aws_iam_policy_document_eks_ec2_role": {
          "statement": [
            {
              "actions": [
                "sts:AssumeRole",
              ],
              "effect": "Allow",
              "principals": [
                {
                  "identifiers": [
                    "eks.amazonaws.com",
                  ],
                  "type": "Service",
                },
                {
                  "identifiers": [
                    "ec2.amazonaws.com",
                  ],
                  "type": "Service",
                },
              ],
            },
          ],
        },
        "cndi_aws_iam_policy_document_web_identity_policy": {
          "depends_on": [
            "aws_iam_openid_connect_provider.cndi_aws_iam_openid_connect_provider",
          ],
          "statement": [
            {
              "actions": [
                "sts:AssumeRoleWithWebIdentity",
              ],
              "condition": [
                {
                  "test": "StringEquals",
                  "values": [
                    "system:serviceaccount:kube-system:efs-csi-controller-sa",
                    "system:serviceaccount:kube-system:ebs-csi-controller-sa",
                  ],
                  "variable":
                    '${replace(aws_iam_openid_connect_provider.cndi_aws_iam_openid_connect_provider.url, "https://", "")}:sub',
                },
              ],
              "effect": "Allow",
              "principals": [
                {
                  "identifiers": [
                    "${aws_iam_openid_connect_provider.cndi_aws_iam_openid_connect_provider.arn}",
                  ],
                  "type": "Federated",
                },
              ],
            },
          ],
        },
        "cndi_aws_iam_policy_document_permissions": {
          "statement": [
            {
              "actions": [
                "autoscaling:DescribeAutoScalingGroups",
                "autoscaling:DescribeAutoScalingInstances",
                "autoscaling:DescribeLaunchConfigurations",
                "autoscaling:DescribeTags",
                "autoscaling:SetDesiredCapacity",
                "autoscaling:TerminateInstanceInAutoScalingGroup",
                "ec2:AttachVolume",
                "ec2:CreateSnapshot",
                "ec2:CreateTags",
                "ec2:CreateVolume",
                "ec2:DeleteSnapshot",
                "ec2:DeleteTags",
                "ec2:DeleteVolume",
                "ec2:DescribeInstances",
                "ec2:DescribeSnapshots",
                "ec2:DescribeTags",
                "ec2:DescribeVolumes",
                "ec2:DetachVolume",
                "elasticfilesystem:DescribeAccessPoints",
                "elasticfilesystem:DescribeFileSystems",
                "elasticfilesystem:DescribeMountTargets",
                "ec2:DescribeAvailabilityZones",
              ],
              "effect": "Allow",
              "resources": [
                "*",
              ],
            },
            {
              "actions": [
                "elasticfilesystem:CreateAccessPoint",
              ],
              "condition": [
                {
                  "test": "StringLike",
                  "values": [
                    "true",
                  ],
                  "variable": "aws:RequestTag/efs.csi.aws.com/cluster",
                },
              ],
              "effect": "Allow",
              "resources": [
                "*",
              ],
            },
            {
              "actions": [
                "elasticfilesystem:TagResource",
              ],
              "condition": [
                {
                  "test": "StringLike",
                  "values": [
                    "true",
                  ],
                  "variable": "aws:ResourceTag/efs.csi.aws.com/cluster",
                },
              ],
              "effect": "Allow",
              "resources": [
                "*",
              ],
            },
            {
              "actions": [
                "elasticfilesystem:DeleteAccessPoint",
              ],
              "condition": [
                {
                  "test": "StringEquals",
                  "values": [
                    "true",
                  ],
                  "variable": "aws:ResourceTag/efs.csi.aws.com/cluster",
                },
              ],
              "effect": "Allow",
              "resources": [
                "*",
              ],
            },
          ],
        },
      },
      "template_file": {
        "kubeconfig": {
          "template": '${file("kubeconfig.yaml.tftpl")}',
          "vars": {
            "cluster_ca_certificate":
              "${aws_eks_cluster.cndi_aws_eks_cluster.certificate_authority[0].data}",
            "cluster_endpoint":
              "${aws_eks_cluster.cndi_aws_eks_cluster.endpoint}",
            "cluster_name": "${aws_eks_cluster.cndi_aws_eks_cluster.name}",
            "cluster_user_arn": "${aws_eks_cluster.cndi_aws_eks_cluster.arn}",
            "region": "${local.aws_region}",
            "token":
              "${data.aws_eks_cluster_auth.cndi_aws_eks_cluster_auth.token}",
          },
        },
        "argocd_private_repo_secret_manifest": {
          "template":
            '${file("argocd_private_repo_secret_manifest.yaml.tftpl")}',
          "vars": {
            "git_password": "${var.git_password}",
            "git_repo": "${var.git_repo}",
            "git_username": "${var.git_username}",
          },
        },
        "sealed_secrets_secret_manifest": {
          "template": '${file("sealed_secrets_secret_manifest.yaml.tftpl")}',
          "vars": {
            "sealed_secret_cert_pem": "${base64encode(var.sealed_secrets_public_key)}",
            "sealed_secret_private_key_pem":
              "${base64encode(var.sealed_secrets_private_key)}",
          },
        },
        "argocd_root_application_manifest": {
          "template": '${file("argocd_root_application_manifest.yaml.tftpl")}',
          "vars": {
            "git_repo": "${var.git_repo}",
          },
        },
        "argocd_admin_password_secret_manifest": {
          "template":
            '${file("argocd_admin_password_secret_manifest.yaml.tftpl")}',
          "vars": {
            "admin_password_time":
              '${time_static.cndi_time_static_admin_password_update.id}")}',
            "argocd_admin_password":
              "${bcrypt_hash.cndi_bcrypt_hash_argocd_admin_password.id}",
          },
        },
      },
    },
  });
}
