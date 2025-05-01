import { CNDIConfig, TFBlocks } from "src/types.ts";
import { path } from "deps";
import {
  ARGOCD_APPS_CHART_VERSION,
  ARGOCD_CHART_VERSION,
  DEFAULT_K8S_VERSION,
  SEALED_SECRETS_CHART_VERSION,
} from "versions";

// import { DEFAULT_INSTANCE_TYPES, DEFAULT_NODE_DISK_SIZE_MANAGED } from "consts";

import {
  getPrettyJSONString,
  // getTaintEffectForDistribution,
  patchAndStageTerraformFilesWithInput,
  stageFile,
  // useSshRepoAuth,
} from "src/utils.ts";

import { ErrOut } from "errout";

const AMI_TYPE = "AL2023_x86_64_NVIDIA";

type TerraformJSON = {
  terraform: Record<string, unknown>;
  provider: Record<string, unknown>;
  resource: Record<string, unknown>;
  data: Record<string, unknown>;
  output: Record<string, unknown>;
  locals: Record<string, unknown>;
  module: Record<string, unknown>;
  variable: Record<string, unknown>;
};

const generateTerraformJSON = (
  cndi_config: CNDIConfig,
): TerraformJSON => {
  const kubernetes = {
    cluster_ca_certificate:
      "${base64decode(module.cndi_aws_eks_module.cluster_certificate_authority_data)}",
    exec: {
      api_version: "client.authentication.k8s.io/v1beta1",
      args: [
        "eks",
        "get-token",
        "--cluster-name",
        "${module.cndi_aws_eks_module.cluster_name}",
      ],
      command: "aws",
    },
    host: "${module.cndi_aws_eks_module.cluster_endpoint}",
  };

  return {
    terraform: {
      requiredProviders: {
        aws: {
          source: "hashicorp/aws",
          version: "~> 5.0",
        },
        kubernetes: {
          source: "hashicorp/kubernetes",
          version: "~> 2.0",
        },
        helm: {
          source: "hashicorp/helm",
          version: "~> 3.0",
        },
        tls: {
          source: "hashicorp/tls",
          version: "~> 4.0",
        },
        time: {
          source: "hashicorp/time",
          version: "~> 2.0",
        },
      },
    },
    provider: {
      aws: [{
        default_tags: {
          tags: {
            CNDIProject: "${local.cndi_project_name}",
            CNDIVersion: "v2",
          },
        },
      }],
      helm: [{
        kubernetes,
      }],
      kubernetes: [{
        ...kubernetes,
        exec: [kubernetes.exec],
      }],
      random: [{}],
      time: [{}],
      tls: [{}],
    },

    resource: {
      efs_access_point: {
        cndi_aws_efs_access_point: {
          file_system_id: "${aws_efs_file_system.cndi_aws_efs_file_system.id}",
          posix_user: {
            gid: 1000,
            uid: 1000,
          },
          root_directory: {
            path: "/efs",
          },
          tags: {
            Name:
              "cndi-elastic-file-system-access-point_${local.cndi_project_name}",
          },
        },
      },
      aws_efs_file_system: {
        cndi_aws_efs_file_system: {
          creation_token: "cndi_aws_efs_token_for_${local.cndi_project_name}",
          encrypted: true,
          tags: {
            Name: "cndi-elastic-file-system_${local.cndi_project_name}",
          },
        },
      },
      aws_efs_mount_target: {
        cndi_aws_efs_mount_target_0: { // TODO: loop
          file_system_id: "${aws_efs_file_system.cndi_aws_efs_file_system.id}",
          security_groups: [
            "${module.cndi_aws_eks_module.cluster_primary_security_group_id}",
          ],
          subnet_id:
            "${element(module.cndi_aws_vpc_module.private_subnets, 0)}",
        },
        cndi_aws_efs_mount_target_1: {
          file_system_id: "${aws_efs_file_system.cndi_aws_efs_file_system.id}",
          security_groups: [
            "${module.cndi_aws_eks_module.cluster_primary_security_group_id}",
          ],
          subnet_id:
            "${element(module.cndi_aws_vpc_module.private_subnets, 1)}",
        },
        cndi_aws_efs_mount_target_2: {
          file_system_id: "${aws_efs_file_system.cndi_aws_efs_file_system.id}",
          security_groups: [
            "${module.cndi_aws_eks_module.cluster_primary_security_group_id}",
          ],
          subnet_id:
            "${element(module.cndi_aws_vpc_module.private_subnets, 2)}",
        },
      },
      aws_eks_node_group: {
        cndi_aws_eks_managed_node_group_0: { // TODO: loop
          ami_type: AMI_TYPE, // AMI_TYPE compatible with GPU acceleration
          capacity_type: "ON_DEMAND",
          cluster_name: "${module.cndi_aws_eks_module.cluster_name}",
          depends_on: [
            "aws_iam_role_policy_attachment.cndi_aws_iam_role_policy_attachment_ebs_efs",
            "aws_iam_role_policy_attachment.cndi_aws_iam_role_policy_attachment_eks_worker_node_policy",
            "aws_iam_role_policy_attachment.cndi_aws_iam_role_policy_attachment_eks_cni_policy",
            "aws_iam_role_policy_attachment.cndi_aws_iam_role_policy_attachment_ec2_container_registry_readonly",
            "aws_launch_template.cndi_aws_launch_template_0",
          ],
          instance_types: [
            "t3.large",
          ],
          labels: {},
          launch_template: {
            id: "${aws_launch_template.cndi_aws_launch_template_0.id}",
            version:
              "${aws_launch_template.cndi_aws_launch_template_0.latest_version}",
          },
          node_group_name: "x-node-group",
          node_role_arn: "${aws_iam_role.cndi_iam_role_compute.arn}",
          scaling_config: {
            desired_size: 3,
            max_size: 3,
            min_size: 3,
          },
          subnet_ids: "${module.cndi_aws_vpc_module.private_subnets}",
          tags: {
            CNDIProject: "${local.cndi_project_name}",
            Name: "cndi-eks-node-group-x-node-group",
          },
          taint: [],
        },
      },
      aws_iam_policy: {
        cndi_aws_iam_policy_ebs_efs: {
          policy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
              Effect: "Allow",
              Action: [[
                "ec2:CreateVolume",
                "ec2:AttachVolume",
                "ec2:DetachVolume",
                "ec2:ModifyVolume",
                "ec2:DeleteVolume",
                "ec2:DescribeVolumes",
                "ec2:DescribeVolumeStatus",
                "ec2:DescribeTags",
                "ec2:CreateTags",
                "ec2:DeleteTags",
                "ec2:CreateSnapshot",
                "ec2:DeleteSnapshot",
                "ec2:DescribeSnapshots",
                "ec2:ModifySnapshotAttribute",
                "ec2:CopySnapshot",
                "ec2:CreateTags",
                "ec2:DescribeTags",
                "ec2:DescribeAvailabilityZones",
                "ec2:CreateSnapshot",
                "ec2:AttachVolume",
                "ec2:DetachVolume",
                "ec2:ModifyVolume",
                "ec2:DescribeInstances",
                "ec2:DescribeVolumesModifications",
                "elasticfilesystem:CreateAccessPoint",
                "elasticfilesystem:DeleteAccessPoint",
                "elasticfilesystem:DescribeAccessPoints",
                "elasticfilesystem:CreateFileSystem",
                "elasticfilesystem:DeleteFileSystem",
                "elasticfilesystem:DescribeFileSystems",
                "elasticfilesystem:CreateMountTarget",
                "elasticfilesystem:DeleteMountTarget",
                "elasticfilesystem:DescribeMountTargets",
                "elasticfilesystem:ModifyMountTargetSecurityGroups",
                "elasticfilesystem:DescribeMountTargetSecurityGroups",
                "elasticfilesystem:TagResource",
                "elasticfilesystem:ClientWrite",
                "elasticfilesystem:DescribeTags",
              ]],
              Resource: "*",
            }],
          }),
        },
      },
      aws_iam_role: {
        cndi_aws_iam_role_compute: {
          assume_role_policy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Action: [
                  "ec2:CreateVolume",
                  "ec2:AttachVolume",
                  "ec2:DetachVolume",
                  "ec2:ModifyVolume",
                  "ec2:DeleteVolume",
                  "ec2:DescribeVolumes",
                  "ec2:DescribeVolumeStatus",
                  "ec2:DescribeTags",
                  "ec2:CreateTags",
                  "ec2:DeleteTags",
                  "ec2:CreateSnapshot",
                  "ec2:DeleteSnapshot",
                  "ec2:DescribeSnapshots",
                  "ec2:ModifySnapshotAttribute",
                  "ec2:CopySnapshot",
                  "ec2:DescribeAvailabilityZones",
                  "ec2:DescribeInstances",
                  "ec2:DescribeVolumesModifications",
                  "elasticfilesystem:CreateAccessPoint",
                  "elasticfilesystem:DeleteAccessPoint",
                  "elasticfilesystem:DescribeAccessPoints",
                  "elasticfilesystem:CreateFileSystem",
                  "elasticfilesystem:DeleteFileSystem",
                  "elasticfilesystem:DescribeFileSystems",
                  "elasticfilesystem:CreateMountTarget",
                  "elasticfilesystem:DeleteMountTarget",
                  "elasticfilesystem:DescribeMountTargets",
                  "elasticfilesystem:ModifyMountTargetSecurityGroups",
                  "elasticfilesystem:DescribeMountTargetSecurityGroups",
                  "elasticfilesystem:TagResource",
                  "elasticfilesystem:ClientWrite",
                  "elasticfilesystem:DescribeTags",
                ],
                Resource: "*",
              },
            ],
          }),
        },
      },
      aws_iam_role_policy_attachment: {
        cndi_aws_iam_role_policy_attachment_ebs_efs: {
          policy_arn: "${aws_iam_policy.cndi_aws_iam_policy_ebs_efs.arn}",
          role: "${aws_iam_role.cndi_iam_role_compute.name}",
        },
        cndi_aws_iam_role_policy_attachment_ec2_container_registryreadonly: {
          policy_arn:
            "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
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
      },
      aws_launch_template: {
        cndi_aws_launch_template_0: { // TODO: loop
          block_device_mappings: [
            {
              device_name: "/dev/xvda",
              ebs: {
                volume_size: 100,
              },
            },
          ],
          metadata_options: {
            http_put_response_hop_limit: 2,
            http_tokens: "required",
          },
          name_prefix: "cndi-x-node-group-0-",
          tag_specifications: [
            {
              resource_type: "instance",
              tags: {
                Name: "cndi-eks-node-group-x-node-group",
                CNDIProject: "${local.cndi_project_name}",
              },
            },
          ],
          depends_on: [
            "aws_iam_role_policy_attachment.cndi_aws_iam_role_policy_attachment_ebs_efs",
            "aws_iam_role_policy_attachment.cndi_aws_iam_role_policy_attachment_eks_worker_node_policy",
            "aws_iam_role_policy_attachment.cndi_aws_iam_role_policy_attachment_eks_cni_policy",
            "aws_iam_role_policy_attachment.cndi_aws_iam_role_policy_attachment_ec2_container_registryreadonly",
          ],
        },
      },
      aws_resourcegroups_group: {
        cndi_aws_resourcegroups_group: {
          name: "cndi-rg_${local.cndi_project_name}",
          resource_query: {
            query: JSON.stringify({
              ResourceTypeFilters: ["AWS::AllSupported"],
              TagFilters: [{
                Key: "CNDIProject",
                Values: ["${local.cndi_project_name}"],
              }],
            }),
          },
          tags: {
            Name: "cndi-rg_${local.cndi_project_name}",
            CNDIProject: "${local.cndi_project_name}", // NOTE: this is new, may cause issues
          },
        },
      },
      helm_release: {
        cndi_helm_release_argocd: {
          chart: "argo-cd",
          cleanup_on_fail: true,
          create_namespace: true,
          depends_on: [
            "${module.cndi_aws_eks_module}",
            "${aws_eks_node_group.cndi_aws_eks_managed_node_group_0}", // TODO: loop
          ],
          timeout: 600,
          atomic: true,
          name: "argocd",
          namespace: "argocd",
          replace: true,
          repository: "https://argoproj.github.io/argo-helm",
          version: ARGOCD_CHART_VERSION,
          set: [
            {
              name: "server.service.annotations.redeployTime",
              value: "${time_static.cndi_time_static_argocd_admin_password.id}",
            },
            {
              name: "configs.secret.argocdServerAdminPasswordMtime",
              value: "${time_static.cndi_time_static_argocd_admin_password.id}",
            },
            {
              name:
                "server.deploymentAnnotations.configmap\\.reloader\\.stakater\\.com/reload",
              value: "argocd-cm",
            },
          ],
          set_sensitive: [
            {
              name: "configs.secret.argocdServerAdminPassword",
              value: "${sensitive(bcrypt(var.ARGOCD_ADMIN_PASSWORD, 10))}",
            },
          ],
        },
        cndi_helm_release_argocd_apps: {
          chart: "argocd-apps",
          create_namespace: true,
          depends_on: [
            "${helm_release.cndi_helm_release_argocd}",
            "${aws_eks_node_group.cndi_aws_eks_managed_node_group_0}", // TODO: loop
            "${kubernetes_secret.cndi_kubernetes_secret_argocd_private_repo}",
          ],
          name: "root-argo-app",
          namespace: "argocd",
          repository: "https://argoproj.github.io/argo-helm",
          version: ARGOCD_APPS_CHART_VERSION,
          timeout: 600,
          atomic: true,
          values: [
            '${yamlencode({"applications" = [{"name" = "root-application", "namespace" = "argocd", "project" = "default", "finalizers" = ["resources-finalizer.argocd.argoproj.io"], "source" = {"repoURL" = var.GIT_REPO, "path" = "cndi/cluster_manifests", "targetRevision" = "HEAD", "directory" = {"recurse" = true}}, "destination" = {"server" = "https://kubernetes.default.svc", "namespace" = "argocd"}, "syncPolicy" = {"automated" = {"prune" = true, "selfHeal" = true}, "syncOptions" = ["CreateNamespace=true"]}}]})}',
          ],
        },
        cndi_helm_release_sealed_secrets: {
          chart: "sealed-secrets",
          depends_on: [
            "${aws_eks_node_group.cndi_aws_eks_managed_node_group_0}", // TODO: loop
            "${kubernetes_secret.cndi_kubernetes_secret_sealed_secrets_key}",
          ],
          name: "sealed-secrets",
          namespace: "kube-system",
          repository: "https://bitnami-labs.github.io/sealed-secrets",
          version: SEALED_SECRETS_CHART_VERSION,
          timeout: 300,
          atomic: true,
        },
      },
      kubernetes_secret: {
        cndi_kubernetes_secret_argocd_private_repo: {
          depends_on: [
            "${aws_eks_node_group.cndi_aws_eks_managed_node_group_0}", // TODO: loop
            "${helm_release.cndi_helm_release_argocd}",
          ],
          metadata: {
            name: "private-repo",
            namespace: "argocd",
            labels: {
              "argocd.argoproj.io/secret-type": "repository",
            },
          },
          data: {
            type: "git",
            url: "${var.GIT_REPO}",
            ssh_private_key: "${var.GIT_SSH_PRIVATE_KEY}",
          },
        },
        cndi_kubernetes_secret_sealed_secrets_key: {
          depends_on: [
            "${aws_eks_node_group.cndi_aws_eks_managed_node_group_0}", // TODO: loop
          ],
          type: "kubernetes.io/tls",
          metadata: {
            name: "sealed-secrets-key",
            namespace: "kube-system",
            labels: {
              "sealedsecrets.bitnami.com/sealed-secrets-key": "active",
            },
          },
          data: {
            "tls.crt": "${var.SEALED_SECRETS_PUBLIC_KEY}",
            "tls.key": "${var.SEALED_SECRETS_PRIVATE_KEY}",
          },
        },
      },
      kubernetes_storage_class: {
        cndi_kubernetes_storage_class_efs: {
          metadata: {
            name: "rwm",
            annotations: {
              "storageclass.kubernetes.io/is-default-class": "false",
            },
          },
          storage_provisioner: "efs.csi.aws.com",
          parameters: {
            provisioning_mode: "efs-ap",
            file_system_id:
              "${aws_efs_file_system.cndi_aws_efs_file_system.id}",
            directory_perms: "700",
            gid_range_start: "1000",
            gid_range_end: "2000",
          },
          reclaim_policy: "Delete",
          allow_volume_expansion: true,
          volume_binding_mode: "WaitForFirstConsumer",
        },
        cndi_kubernetes_storage_class_ebs: {
          metadata: {
            name: "rwo",
            annotations: {
              "storageclass.kubernetes.io/is-default-class": "true",
            },
          },
          storage_provisioner: "ebs.csi.aws.com",
          parameters: {
            fs_type: "ext4",
            type: "gp3",
          },
          reclaim_policy: "Delete",
          allow_volume_expansion: true,
          volume_binding_mode: "WaitForFirstConsumer",
        },
      },
      // random_password: {} - holdover from microk8s join token, should be safe to remove
      time_static: {
        cndi_time_static_argocd_admin_password: {
          triggers: {
            argocd_admin_password: "${sensitive(var.ARGOCD_ADMIN_PASSWORD)}",
          },
        },
      },
    },
    data: {
      aws_availability_zones: {
        "available-zones": {
          filter: [
            {
              name: "opt-in-status",
              values: ["opt-in-not-required"],
            },
          ],
          state: "available",
        },
      },
      aws_iam_policy: {
        ebs_csi_policy: {
          arn: "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy",
        },
        efs_csi_policy: {
          arn: "arn:aws:iam::aws:policy/service-role/AmazonEFSCSIDriverPolicy",
        },
      },
      locals: {
        aws_region: "",
        cluster_name: "${local.cndi_project_name}",
        cndi_project_name: cndi_config.project_name,
        // bootstrap_token: "",
      },
    },
    output: {},
    locals: {},
    module: {
      cndi_aws_eks_module: {
        source:
          "git::https://github.com/terraform-aws-modules/terraform-aws-eks.git?ref=a713f6f464eb579a39918f60f130a5fbb77a6b30",
        cluster_addons: {
          "aws-ebs-csi-driver": {
            mostRecent: true,
            serviceAccountRoleArn:
              "${module.cndi_aws_iam_assumable_role_ebs_with_oidc.iam_role_arn}",
          },
          "aws-efs-csi-driver": {
            mostRecent: true,
            serviceAccountRoleArn:
              "${module.cndi_aws_iam_assumable_role_efs_with_oidc.iam_role_arn}",
          },
        },
        cluster_name: "${local.cluster_name}",
        cluster_version: DEFAULT_K8S_VERSION,
        cluster_endpoint_public_access: true, // TODO: probably bad
        enable_cluster_creator_admin_permissions: true,
        vpc_id: "${module.cndi_aws_vpc_module.vpc_id}",
        subnet_ids: "${module.cndi_aws_vpc_module.private_subnets}",
      },
      cndi_aws_vpc_module: {},
      cndi_aws_iam_assumable_role_ebs_with_oidc_module: {},
      cndi_aws_iam_assumable_role_efs_with_oidc_module: {},
    },
    variable: {
      ARGOCD_ADMIN_PASSWORD: {
        type: "string",
        description: "ArgoCD admin password",
        sensitive: true,
      },
      GIT_REPO: {
        type: "string",
        description: "Cluster git repository URL",
      },
      GIT_SSH_PRIVATE_KEY: {
        type: "string",
        description: "SSH private key for Git repository access",
        sensitive: true,
      },
      GIT_TOKEN: {
        type: "string",
        description: "Git token for repository access",
        sensitive: true,
      },
      GIT_USERNAME: {
        type: "string",
        description: "Git username for repository access",
      },
      SEALED_SECRETS_PUBLIC_KEY: {
        type: "string",
        description:
          "Sealed Secrets public key for encrypting secrets in the cluster",
      },
      SEALED_SECRETS_PRIVATE_KEY: {
        type: "string",
        description:
          "Sealed Secrets private key for decrypting secrets in the cluster",
        sensitive: true,
      },
      SSH_PUBLIC_KEY: {
        description: "public key for accessing cluster nodes",
        type: "string",
      },
    },
  };
};

export async function stageTerraformSynthAWSEKS(
  cndi_config: CNDIConfig,
): Promise<null | ErrOut> {
  const terraform = generateTerraformJSON(cndi_config);

  await stageFile(
    path.join("cndi", "terraform", "cndi.terraform.json"),
    getPrettyJSONString(terraform),
  );

  const input: TFBlocks = {
    ...cndi_config?.infrastructure?.terraform,
  };

  // patch cndi.terraform.json with user's terraform pass-through
  const errorPatchingAndStaging = await patchAndStageTerraformFilesWithInput(
    input,
  );

  if (errorPatchingAndStaging) return errorPatchingAndStaging;
  return null;
}
