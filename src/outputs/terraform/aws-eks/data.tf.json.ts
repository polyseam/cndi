import { getPrettyJSONString } from "src/utils.ts";

export default function getAWSDataTFJSON(): string {
  return getPrettyJSONString({
    data: {
      aws_lb: {
        cndi_aws_lb: {
          tags: {
            "kubernetes.io/cluster/${local.cndi_project_name}": "owned",
          },
          depends_on: [
            "helm_release.cndi_nginx_controller_helm_chart",
          ],
        },
      },
      aws_availability_zones: {
        cndi_aws_availability_zones: {
          state: "available",
        },
      },
      aws_iam_policy_document: {
        cndi_aws_iam_policy_document_role_ec2: {
          statement: [
            {
              actions: ["sts:AssumeRole"],
              effect: "Allow",
              principals: [
                {
                  identifiers: ["ec2.amazonaws.com"],
                  type: "Service",
                },
              ],
            },
          ],
        },
        cndi_aws_iam_policy_document_role_eks: {
          statement: [
            {
              actions: ["sts:AssumeRole"],
              effect: "Allow",
              principals: [
                {
                  identifiers: ["eks.amazonaws.com"],
                  type: "Service",
                },
              ],
            },
          ],
        },
        cndi_aws_iam_policy_document_web_identity: {
          depends_on: [],
          statement: [
            {
              actions: ["sts:AssumeRoleWithWebIdentity"],
              condition: [
                {
                  test: "StringEquals",
                  values: [
                    "system:serviceaccount:kube-system:efs-csi-controller-sa",
                    "system:serviceaccount:kube-system:ebs-csi-controller-sa",
                  ],
                  variable:
                    '${replace(module.cndi_aws_eks_cluster.cluster_oidc_issuer_url, "https://", "")}:sub',
                },
              ],
              effect: "Allow",
              principals: [
                {
                  identifiers: [
                    "${module.cndi_aws_eks_cluster.oidc_provider_arn}",
                  ],
                  type: "Federated",
                },
              ],
            },
          ],
        },
      },
      template_file: {
        argocd_private_repo_secret_manifest: {
          template: '${file("argocd_private_repo_secret_manifest.yaml.tftpl")}',
          vars: {
            git_password: "${var.git_password}",
            git_repo: "${var.git_repo}",
            git_username: "${var.git_username}",
          },
        },
        sealed_secrets_secret_manifest: {
          template: '${file("sealed_secrets_secret_manifest.yaml.tftpl")}',
          vars: {
            sealed_secret_cert_pem:
              "${base64encode(var.sealed_secrets_public_key)}",
            sealed_secret_private_key_pem:
              "${base64encode(var.sealed_secrets_private_key)}",
          },
        },
        argocd_root_application_manifest: {
          template: '${file("argocd_root_application_manifest.yaml.tftpl")}',
          vars: {
            git_repo: "${var.git_repo}",
          },
        },
        argocd_admin_password_secret_manifest: {
          template:
            '${file("argocd_admin_password_secret_manifest.yaml.tftpl")}',
          vars: {
            admin_password_time:
              '${time_static.cndi_time_static_admin_password_update.id}")}',
            argocd_admin_password:
              "${bcrypt_hash.cndi_bcrypt_hash_argocd_admin_password.id}",
          },
        },
      },
    },
  });
}
