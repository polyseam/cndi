import { CNDIConfig, TFBlocks } from "src/types.ts";

import {
  ARGOCD_CHART_VERSION,
  DEFAULT_INSTANCE_TYPES,
  DEFAULT_K8S_VERSION,
  DEFAULT_NODE_DISK_SIZE_MANAGED,
  SEALED_SECRETS_CHART_VERSION,
} from "consts";

import {
  App,
  AwsEksModule,
  AwsIamAssumableRoleWithOidcModule,
  AwsVpcModule,
  CDKTFProviderAWS,
  CDKTFProviderHelm,
  CDKTFProviderKubernetes,
  CDKTFProviderTime,
  CDKTFProviderTls,
  Construct,
  divideCIDRIntoSubnets,
  Fn,
  parseNetworkConfig,
  stageCDKTFStack,
  TerraformLocal,
  TerraformOutput,
} from "cdktf-deps";

import {
  getCDKTFAppConfig,
  getTaintEffectForDistribution,
  patchAndStageTerraformFilesWithInput,
  useSshRepoAuth,
} from "src/utils.ts";

import AWSCoreTerraformStack from "./AWSCoreStack.ts";

import { ErrOut } from "errout";

const AMI_TYPE = "AL2023_x86_64_NVIDIA";

export default class AWSEKSTerraformStack extends AWSCoreTerraformStack {
  constructor(scope: Construct, name: string, cndi_config: CNDIConfig) {
    super(scope, name, cndi_config);
    new CDKTFProviderTime.provider.TimeProvider(this, "cndi_time_provider", {});
    new CDKTFProviderTls.provider.TlsProvider(this, "cndi_tls_provider", {});

    this.locals.clusterName = new TerraformLocal(
      this,
      "cluster_name",
      this.locals.cndi_project_name.asString,
    );

    const clusterName = this.locals.clusterName.asString;

    const project_name = this.locals.cndi_project_name.asString;

    const network = parseNetworkConfig(cndi_config);

    const efsFs = new CDKTFProviderAWS.efsFileSystem.EfsFileSystem(
      this,
      "cndi_aws_efs_file_system",
      {
        creationToken: `cndi_aws_efs_token_for_${project_name}`,
        tags: {
          Name: `cndi-elastic-file-system_${project_name}`,
        },
      },
    );

    const ebsRoleName = `AmazonEKSTFEBSCSIRole-${clusterName}`;

    const efsRoleName = `AmazonEKSTFEFSCSIRole-${clusterName}`;

    const availabilityZones = new CDKTFProviderAWS.dataAwsAvailabilityZones
      .DataAwsAvailabilityZones(
      this,
      "available-zones",
      {
        filter: [
          {
            name: "opt-in-status",
            values: ["opt-in-not-required"],
          },
        ],
        state: "available",
      },
    );

    let privateSubnetIds: string | string[];

    let vpcm: AwsVpcModule | undefined = undefined;
    let vpcId: string;

    const subnets = divideCIDRIntoSubnets(
      network.subnet_address_space!,
      6,
    );

    const privateSubnets = subnets.slice(0, 3);
    const publicSubnets = subnets.slice(3, 6);

    const publicSubnetTags = {
      "kubernetes.io/role/elb": "1",
      [`kubernetes.io/cluster/${project_name}`]: "owned",
    };

    const privateSubnetTags = {
      "kubernetes.io/role/internal-elb": "1",
      [`kubernetes.io/cluster/${project_name}`]: "owned",
    };

    if (network.mode === "create") {
      vpcm = new AwsVpcModule(this, "cndi_aws_vpc_module", {
        name: `cndi-vpc_${project_name}`,
        cidr: network.vnet_address_space,
        azs: availabilityZones.names.slice(0, 3),
        createVpc: true,
        privateSubnets,
        publicSubnets,
        enableNatGateway: true,
        singleNatGateway: true,
        enableDnsHostnames: true,
        publicSubnetTags,
        privateSubnetTags,
      });

      privateSubnetIds = vpcm.privateSubnetsOutput;

      vpcId = vpcm.vpcIdOutput;
    } else if (network.mode === "insert") {
      vpcId = network.vnet_identifier!;
      privateSubnetIds = [];

      const igw = new CDKTFProviderAWS.internetGateway.InternetGateway(
        this,
        "cndi_aws_internet_gateway",
        {
          vpcId: vpcId,
          tags: {
            Name: `cndi-igw_${project_name}`,
          },
        },
      );

      const publicRT = new CDKTFProviderAWS.routeTable.RouteTable(
        this,
        `cndi_aws_route_table_public`,
        {
          vpcId: vpcId,
          tags: {
            Name: `cndi-public-route-table_${project_name}`,
          },
        },
      );

      const privateRT = new CDKTFProviderAWS.routeTable.RouteTable(
        this,
        `cndi_aws_route_table_private`,
        {
          vpcId: vpcId,
          tags: {
            Name: `cndi-private-route-table_${project_name}`,
          },
        },
      );

      const _igwRoute = new CDKTFProviderAWS.route.Route(
        this,
        `cndi_aws_route_igw_public`,
        {
          routeTableId: publicRT.id,
          destinationCidrBlock: "0.0.0.0/0",
          gatewayId: igw.id,
          timeouts: {
            create: "5m", // from VPCM GitHub Repo
          },
        },
      );

      let ix = 0;
      for (const cidrBlock of publicSubnets) {
        const publicSubnet = new CDKTFProviderAWS.subnet.Subnet(
          this,
          `cndi_aws_subnet_public_${ix}`,
          {
            vpcId,
            cidrBlock,
            tags: {
              Name: `cndi-public-subnet-${ix}_${project_name}`,
              ...publicSubnetTags,
            },
            mapPublicIpOnLaunch: true,
            availabilityZone: Fn.element(availabilityZones.names, ix),
          },
        );

        if (ix === 0) {
          // create nat gateway and eip in first public subnet
          const eip = new CDKTFProviderAWS.eip.Eip(this, "cndi_aws_eip", {
            tags: {
              Name: `cndi-eip_${project_name}`,
            },
          });
          const ngw = new CDKTFProviderAWS.natGateway.NatGateway(
            this,
            "cndi_aws_nat_gateway",
            {
              subnetId: publicSubnet.id,
              allocationId: eip.id,
              tags: {
                Name: `cndi-ngw_${project_name}`,
              },
            },
          );

          const _ngwRoute = new CDKTFProviderAWS.route.Route(
            this,
            "cndi_aws_route_ngw",
            {
              routeTableId: privateRT.id,
              destinationCidrBlock: "0.0.0.0/0",
              natGatewayId: ngw.id,
            },
          );
        }

        new CDKTFProviderAWS.routeTableAssociation.RouteTableAssociation(
          this,
          `cndi_aws_route_table_association_public_${ix}`,
          {
            routeTableId: publicRT.id,
            subnetId: publicSubnet.id,
          },
        );
        ix++;
      }

      let iy = 0;
      for (const cidrBlock of privateSubnets) {
        const ps = new CDKTFProviderAWS.subnet.Subnet(
          this,
          `cndi_aws_subnet_private_${iy}`,
          {
            vpcId,
            cidrBlock,
            tags: {
              Name: `cndi-private-subnet-${iy}_${project_name}`,
              ...privateSubnetTags,
            },
            mapPublicIpOnLaunch: false,
            availabilityZone: Fn.element(availabilityZones.names, iy),
          },
        );
        privateSubnetIds.push(ps.id);
        new CDKTFProviderAWS.routeTableAssociation.RouteTableAssociation(
          this,
          `cndi_aws_route_table_association_private_${iy}`,
          {
            routeTableId: privateRT.id,
            subnetId: ps.id,
          },
        );
        iy++;
      }
    } else {
      throw new Error(`Invalid network mode ${network?.["mode"]}`);
    }

    const ebsCsiPolicy = new CDKTFProviderAWS.dataAwsIamPolicy.DataAwsIamPolicy(
      this,
      "ebs_csi_policy",
      {
        arn: "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy",
      },
    );

    const efsCsiPolicy = new CDKTFProviderAWS.dataAwsIamPolicy.DataAwsIamPolicy(
      this,
      "efs_csi_policy",
      {
        arn: "arn:aws:iam::aws:policy/service-role/AmazonEFSCSIDriverPolicy",
      },
    );

    const iamAssumableRoleEbS = new AwsIamAssumableRoleWithOidcModule(
      this,
      "cndi_aws_iam_assumable_role_ebs_with_oidc",
      {
        createRole: true,
        roleName: ebsRoleName,
        providerUrl: "${module.cndi_aws_eks_module.oidc_provider}", // find a way to generate url provider
        rolePolicyArns: [ebsCsiPolicy.arn],
        oidcFullyQualifiedSubjects: [
          "system:serviceaccount:kube-system:ebs-csi-controller-sa",
        ],
      },
    );

    const iamAssumableRoleEfs = new AwsIamAssumableRoleWithOidcModule(
      this,
      "cndi_aws_iam_assumable_role_efs_with_oidc",
      {
        createRole: true,
        roleName: efsRoleName,
        providerUrl: "${module.cndi_aws_eks_module.oidc_provider}",
        rolePolicyArns: [efsCsiPolicy.arn],
        oidcFullyQualifiedSubjects: [
          "system:serviceaccount:kube-system:efs-csi-controller-sa",
        ],
      },
    );

    const _efsAccessPoint = new CDKTFProviderAWS.efsAccessPoint.EfsAccessPoint(
      this,
      "cndi_aws_efs_access_point",
      {
        fileSystemId: efsFs.id,
        tags: {
          Name: `cndi-elastic-file-system-access-point_${project_name}`,
        },
      },
    );

    const EKSMDeps = [];

    if (vpcm) EKSMDeps.push(vpcm);

    const eksm = new AwsEksModule(this, "cndi_aws_eks_module", {
      dependsOn: EKSMDeps,
      clusterName,
      clusterVersion: DEFAULT_K8S_VERSION,
      clusterEndpointPublicAccess: true,
      enableClusterCreatorAdminPermissions: true,
      vpcId: vpcId!,
      // deno-lint-ignore no-explicit-any
      subnetIds: privateSubnetIds! as any,
      clusterAddons: {
        "aws-ebs-csi-driver": {
          serviceAccountRoleArn: iamAssumableRoleEbS.iamRoleArnOutput,
          mostRecent: true,
        },
        "aws-efs-csi-driver": {
          serviceAccountRoleArn: iamAssumableRoleEfs.iamRoleArnOutput,
          mostRecent: true,
        },
      },
    });

    let subnetIdx = 0;

    if (vpcm) {
      for (const _subnet of privateSubnets) {
        const _efsMountTarget = new CDKTFProviderAWS.efsMountTarget
          .EfsMountTarget(
          this,
          `cndi_aws_efs_mount_target_${subnetIdx}`,
          {
            fileSystemId: efsFs.id,
            securityGroups: [eksm.clusterPrimarySecurityGroupIdOutput],
            subnetId: Fn.element(vpcm.privateSubnetsOutput, subnetIdx),
          },
        );
        subnetIdx++;
      }
    } else {
      for (const subnetId of privateSubnetIds!) {
        const _efsMountTarget = new CDKTFProviderAWS.efsMountTarget
          .EfsMountTarget(
          this,
          `cndi_aws_efs_mount_target_${subnetIdx}`,
          {
            fileSystemId: efsFs.id,
            securityGroups: [eksm.clusterPrimarySecurityGroupIdOutput],
            subnetId,
          },
        );
        subnetIdx++;
      }
    }

    const eksNodeGroupRole = new CDKTFProviderAWS.iamRole.IamRole(
      this,
      "cndi_iam_role_compute",
      {
        namePrefix: "COMPUTE",
        assumeRolePolicy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: "sts:AssumeRole",
              Principal: {
                Service: "ec2.amazonaws.com",
              },
            },
          ],
        }),
      },
    );

    const workerNodePolicyAttachment = new CDKTFProviderAWS
      .iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      "cndi_aws_iam_role_policy_attachment_eks_worker_node_policy",
      {
        policyArn: "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
        role: eksNodeGroupRole.name,
      },
    );

    const cniPolicyAttachment = new CDKTFProviderAWS.iamRolePolicyAttachment
      .IamRolePolicyAttachment(
      this,
      "cndi_aws_iam_role_policy_attachment_eks_cni_policy",
      {
        policyArn: "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
        role: eksNodeGroupRole.name,
      },
    );

    const containerRegistryAttachment = new CDKTFProviderAWS
      .iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      "cndi_aws_iam_role_policy_attachment_ec2_container_registry_readonly",
      {
        policyArn: "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
        role: eksNodeGroupRole.name,
      },
    );

    const ebsEfsPolicy = new CDKTFProviderAWS.iamPolicy.IamPolicy(
      this,
      "cndi_aws_iam_policy_ebs_efs",
      {
        policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: [
                // EBS Permissions
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

                // EFS Permissions
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
    );

    const ebsEfsPolicyAttachment = new CDKTFProviderAWS
      .iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      "cndi_aws_iam_role_policy_attachment_ebs_efs",
      {
        policyArn: ebsEfsPolicy.arn,
        role: eksNodeGroupRole.name,
      },
    );

    const eksManagedNodeGroups: Record<
      string,
      CDKTFProviderAWS.eksNodeGroup.EksNodeGroup
    > = {};

    let firstNodeGroup: CDKTFProviderAWS.eksNodeGroup.EksNodeGroup;
    let nodeGroupIndex = 0;

    for (const nodeGroup of cndi_config.infrastructure.cndi.nodes) {
      const count = nodeGroup?.count || 1;

      // reduce user intent to scaling configuration
      // count /should/ never be assigned alongside min_count or max_count

      const maxCount = nodeGroup?.max_count;
      const minCount = nodeGroup?.min_count;
      const nodeGroupName = nodeGroup.name;

      const instanceType = nodeGroup?.instance_type ||
        DEFAULT_INSTANCE_TYPES.aws;

      const volumeSize = nodeGroup?.volume_size ||
        nodeGroup?.disk_size ||
        nodeGroup?.disk_size_gb ||
        DEFAULT_NODE_DISK_SIZE_MANAGED;

      const scalingConfig = {
        desiredSize: count,
        maxSize: count,
        minSize: count,
      };

      if (minCount) {
        scalingConfig.desiredSize = minCount;
        scalingConfig.minSize = minCount;
      }

      if (maxCount) {
        scalingConfig.maxSize = maxCount;
      }

      const taint = nodeGroup.taints?.map((taint) => ({
        key: taint.key,
        value: taint.value,
        effect: getTaintEffectForDistribution(taint.effect, "eks"), // taint.effect must be valid by now
      })) || [];

      const tags = {
        Name: `cndi-eks-node-group-${nodeGroupName}`,
        CNDIProject: project_name,
      };

      const nodegroupLaunchTemplate = new CDKTFProviderAWS.launchTemplate
        .LaunchTemplate(
        this,
        `cndi_aws_launch_template_${nodeGroupIndex}`,
        {
          namePrefix: `cndi-${nodeGroupName}-${nodeGroupIndex}-`,
          metadataOptions: {
            httpTokens: "optional",
          },
          blockDeviceMappings: [
            {
              deviceName: "/dev/xvda",
              ebs: {
                volumeSize,
              },
            },
          ],
          tagSpecifications: [
            {
              resourceType: "instance",
              tags,
            },
          ],
          dependsOn: [
            workerNodePolicyAttachment,
            ebsEfsPolicyAttachment,
            cniPolicyAttachment,
            containerRegistryAttachment,
          ],
        },
      );

      const labels = nodeGroup.labels || {};

      eksManagedNodeGroups[nodeGroupName] = new CDKTFProviderAWS.eksNodeGroup
        .EksNodeGroup(
        this,
        `cndi_aws_eks_managed_node_group_${nodeGroupIndex}`,
        {
          clusterName: eksm.clusterNameOutput,
          // deno-lint-ignore no-explicit-any
          subnetIds: privateSubnetIds! as any,
          amiType: AMI_TYPE,
          instanceTypes: [instanceType],
          nodeGroupName,
          nodeRoleArn: eksNodeGroupRole.arn,
          scalingConfig,
          launchTemplate: {
            id: nodegroupLaunchTemplate.id,
            version: `${nodegroupLaunchTemplate.latestVersion}`,
          },
          capacityType: "ON_DEMAND",
          labels,
          taint,
          tags,
          dependsOn: [
            ebsEfsPolicyAttachment,
            workerNodePolicyAttachment,
            cniPolicyAttachment,
            containerRegistryAttachment,
            nodegroupLaunchTemplate,
          ],
        },
      );

      if (!nodeGroupIndex) {
        // save the first node group for use in dependsOn
        firstNodeGroup = eksManagedNodeGroups[nodeGroupName];
      }

      nodeGroupIndex++;
    }

    const kubernetes = {
      host: eksm.clusterEndpointOutput,
      clusterCaCertificate: Fn.base64decode(
        eksm.clusterCertificateAuthorityDataOutput,
      ),
      exec: {
        apiVersion: "client.authentication.k8s.io/v1beta1",
        command: "aws",
        args: ["eks", "get-token", "--cluster-name", eksm.clusterNameOutput],
      },
    };

    new CDKTFProviderKubernetes.provider.KubernetesProvider(
      this,
      "cndi_kubernetes_provider",
      { ...kubernetes, exec: [kubernetes.exec] },
    );

    new CDKTFProviderKubernetes.storageClass.StorageClass(
      this,
      "cndi_kubernetes_storage_class_efs",
      {
        metadata: {
          name: "rwm",
          annotations: {
            "storageclass.kubernetes.io/is-default-class": "false",
          },
        },
        storageProvisioner: "efs.csi.aws.com",
        parameters: {
          provisioningMode: "efs-ap",
          fileSystemId: efsFs.id,
          directoryPerms: "700",
          gidRangeStart: "1000",
          gidRangeEnd: "2000",
        },
        reclaimPolicy: "Delete",
        allowVolumeExpansion: true,
        volumeBindingMode: "WaitForFirstConsumer",
        dependsOn: [firstNodeGroup!],
      },
    );

    new CDKTFProviderKubernetes.storageClass.StorageClass(
      this,
      "cndi_kubernetes_storage_class_ebs",
      {
        metadata: {
          name: "rwo",
          annotations: {
            "storageclass.kubernetes.io/is-default-class": "true",
          },
        },
        storageProvisioner: "ebs.csi.aws.com",
        parameters: {
          fsType: "ext4",
          type: "gp3",
        },
        reclaimPolicy: "Delete",
        allowVolumeExpansion: true,
        volumeBindingMode: "WaitForFirstConsumer",
        dependsOn: [firstNodeGroup!],
      },
    );

    new CDKTFProviderHelm.provider.HelmProvider(this, "cndi_helm_provider", {
      kubernetes,
    });

    const helmReleaseArgoCD = new CDKTFProviderHelm.release.Release(
      this,
      "cndi_helm_release_argocd",
      {
        chart: "argo-cd",
        cleanupOnFail: true,
        createNamespace: true,
        dependsOn: [eksm, firstNodeGroup!],
        timeout: 600,
        atomic: true,
        name: "argocd",
        namespace: "argocd",
        replace: true,
        repository: "https://argoproj.github.io/argo-helm",
        version: ARGOCD_CHART_VERSION,
      },
    );

    let argocdRepoSecret: CDKTFProviderKubernetes.secret.Secret;

    if (useSshRepoAuth()) {
      argocdRepoSecret = new CDKTFProviderKubernetes.secret.Secret(
        this,
        "cndi_kubernetes_secret_argocd_private_repo",
        {
          dependsOn: [firstNodeGroup!, helmReleaseArgoCD],
          metadata: {
            name: "private-repo",
            namespace: "argocd",
            labels: {
              "argocd.argoproj.io/secret-type": "repository",
            },
          },
          data: {
            type: "git",
            url: this.variables.git_repo.value,
            sshPrivateKey: this.variables.git_ssh_private_key.value,
          },
        },
      );
    } else {
      argocdRepoSecret = new CDKTFProviderKubernetes.secret.Secret(
        this,
        "cndi_kubernetes_secret_argocd_private_repo",
        {
          dependsOn: [firstNodeGroup!, helmReleaseArgoCD],
          metadata: {
            name: "private-repo",
            namespace: "argocd",
            labels: {
              "argocd.argoproj.io/secret-type": "repository",
            },
          },
          data: {
            type: "git",
            password: this.variables.git_token.value, // this makes a reasonable case we should call it git_password as before
            username: this.variables.git_username.value,
            url: this.variables.git_repo.value,
          },
        },
      );
    }

    const sealedSecretsSecret = new CDKTFProviderKubernetes.secret.Secret(
      this,
      "cndi_kubernetes_secret_sealed_secrets_key",
      {
        dependsOn: [eksm, firstNodeGroup!],
        type: "kubernetes.io/tls",
        metadata: {
          name: "sealed-secrets-key",
          namespace: "kube-system",
          labels: {
            "sealedsecrets.bitnami.com/sealed-secrets-key": "active",
          },
        },

        data: {
          "tls.crt": this.variables.sealed_secrets_public_key.value,
          "tls.key": this.variables.sealed_secrets_private_key.value,
        },
      },
    );

    const _helmReleaseSealedSecrets = new CDKTFProviderHelm.release.Release(
      this,
      "cndi_helm_release_sealed_secrets",
      {
        chart: "sealed-secrets",
        dependsOn: [eksm, sealedSecretsSecret, firstNodeGroup!],
        name: "sealed-secrets",
        namespace: "kube-system",
        repository: "https://bitnami-labs.github.io/sealed-secrets",
        version: SEALED_SECRETS_CHART_VERSION,
        timeout: 300,
        atomic: true,
      },
    );

    const argoAppsValues = {
      applications: [
        {
          name: "root-application",
          namespace: "argocd",
          project: "default",
          finalizers: ["resources-finalizer.argocd.argoproj.io"],
          source: {
            repoURL: this.variables.git_repo.value,
            path: "cndi/cluster_manifests",
            targetRevision: "HEAD",
            directory: {
              recurse: true,
            },
          },
          destination: {
            server: "https://kubernetes.default.svc",
            namespace: "argocd",
          },
          syncPolicy: {
            automated: {
              prune: true,
              selfHeal: true,
            },
            syncOptions: ["CreateNamespace=true"],
          },
        },
      ],
    };

    new CDKTFProviderHelm.release.Release(
      this,
      "cndi_helm_release_argocd_apps",
      {
        chart: "argocd-apps",
        createNamespace: true,
        dependsOn: [helmReleaseArgoCD, firstNodeGroup!, argocdRepoSecret],
        name: "root-argo-app",
        namespace: "argocd",
        repository: "https://argoproj.github.io/argo-helm",
        version: "1.4.1",
        timeout: 600,
        atomic: true,
        values: [Fn.yamlencode(argoAppsValues)],
      },
    );

    new TerraformOutput(this, "resource_group_url", {
      value:
        `https://${this.locals.aws_region.asString}.console.aws.amazon.com/resource-groups/group/cndi-rg_${project_name}`,
    });

    new TerraformOutput(this, "get_kubeconfig_command", {
      value:
        `aws eks update-kubeconfig --region ${this.locals.aws_region.asString} --name ${eksm.clusterName}`,
    });

    new TerraformOutput(this, "get_argocd_port_forward_command", {
      value: `kubectl port-forward svc/argocd-server -n argocd 8080:443`,
    });
  }
}

export async function stageTerraformSynthAWSEKS(
  cndi_config: CNDIConfig,
): Promise<null | ErrOut> {
  const [errGettingAppConfig, cdktfAppConfig] = await getCDKTFAppConfig();

  if (errGettingAppConfig) return errGettingAppConfig;

  const app = new App(cdktfAppConfig);
  new AWSEKSTerraformStack(app as Construct, `_cndi_stack_`, cndi_config);

  // write terraform stack to staging directory
  const errStagingApp = await stageCDKTFStack(app);
  if (errStagingApp) return errStagingApp;

  const input: TFBlocks = {
    ...cndi_config?.infrastructure?.terraform,
  };

  // patch cdk.tf.json with user's terraform pass-through
  const errorPatchingAndStaging = await patchAndStageTerraformFilesWithInput(
    input,
  );
  if (errorPatchingAndStaging) return errorPatchingAndStaging;
  return null;
}
