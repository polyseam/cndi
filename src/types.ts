// list of all commands for the CLI

export const enum NodeKind {
  aws = "aws",
}

interface AirflowTlsTemplateAnswers {
  argocdDomainName: string;
  airflowDomainName: string;
  dagRepoUrl: string;
  letsEncryptClusterIssuerEmailAddress: string;
}

export const enum Command {
  init = "init",
  "overwrite-with" = "overwrite-with",
  run = "run",
  help = "help",
  default = "default",
  install = "install",
  terraform = "terraform",
  ow = "ow",
}

// node.role is either "leader" or "controller"
export const enum NodeRole {
  leader = "leader",
  controller = "controller",
}

// incomplete type, nodes will have more options
interface CNDINode {
  name: string;
  role: NodeRole;
  kind: NodeKind;
  instance_type?: string;
  ami?: string;
}

interface CNDINodesSpec {
  entries: Array<BaseNodeEntrySpec>;
  deploymentTargetConfiguration: DeploymentTargetConfiguration;
}

// cndi-config.jsonc["nodes"]["entries"][kind==="aws"]
interface AWSNodeEntrySpec extends BaseNodeEntrySpec {
  ami: string;
  instance_type: string;
  availability_zone: string;
}

// cndi-config.jsonc["nodes"]["deploymentTargetConfiguration"]["aws"]
interface AWSDeploymentTargetConfiguration extends BaseNodeEntrySpec {
  ami?: string;
  instance_type?: string;
  availability_zone?: string;
}

interface AWSTerraformNodeResource {
  resource: {
    aws_instance: {
      [name: string]: Array<{
        ami: string;
        instance_type: string;
        tags: {
          Name: string;
          CNDINodeRole: NodeRole;
        };
        user_data?: string;
        depends_on?: Array<string>;
        subnet_id?: string;
        vpc_security_group_ids: Array<string>;
        ebs_block_device?: Array<{
          device_name: string;
          volume_size: number;
          volume_type: string;
          delete_on_termination: boolean;
        }>;
      }>;
    };
  };
}
interface RandomTerraformRandomPasswordResource {
  generated_token: Array<{
    length: number;
    special: boolean;
    upper: boolean;
  }>;
}

interface AWSTerraformInternetGatewayResource {
  igw: {
    tags: {
      Name: string;
    };
    vpc_id: string;
  };
}

interface AWSTerraformLoadBalancerResource {
  nlb: {
    internal: boolean;
    load_balancer_type: string;
    subnets: Array<string>;
    tags: { Name: string; };
  };
}

interface AWSTerraformRouteResource {
  r: {
    depends_on: Array<string>;
    route_table_id: string;
    destination_cidr_block: string;
    gateway_id: string;
  };
}
interface AWSTerraformRouteTableResource {
  rt: {
    tags: {
      Name: string;
    };
    vpc_id: string;
  };
}
interface AWSTerraformRouteTableAssociationResource {
  rt_sbn_asso: {
    route_table_id: string;
    subnet_id: string;
  };
}

interface AWSTerraformSubnetResource {
  subnet: {
    availability_zone: string;
    cidr_block: string;
    map_public_ip_on_launch: string;
    tags: {
      Name: string;
    };
    vpc_id: string;
  };
}
interface AWSTerraformSecurityGroupResource {
  sg: Array<{
    description: string;
    egress: Array<{
      cidr_blocks: Array<string>;
      description: string;
      from_port: string;
      ipv6_cidr_blocks: Array<any>;
      prefix_list_ids: Array<any>;
      protocol: string;
      security_groups: Array<any>;
      self: boolean;
      to_port: string;
    }>;
    ingress: Array<{
      cidr_blocks: Array<string>;
      description: string;
      from_port: string;
      protocol: string;
      to_port: string;
      ipv6_cidr_blocks: Array<any>;
      prefix_list_ids: Array<any>;
      security_groups: Array<any>;
      self: boolean;
    }>;
    tags: {
      Name: string;
    };
    vpc_id: string;
  }>;
}

interface AWSTerraformTargetGroupResource {
  "tg-http": Array<{
    tags: {
      Name: string;
    };
    port: string;
    protocol: string;
    vpc_id: string;
  }>;
  "tg-https": Array<{
    tags: {
      Name: string;
    };
    port: string;
    protocol: string;
    vpc_id: string;
  }>;
}

interface AWSTerraformTargetGroupAttachmentResource {
  "tg-https-target": Array<{
    target_group_arn: string;
    target_id: string;
  }>;
  "tg-http-target": Array<{
    target_group_arn: string;
    target_id: string;
  }>;
}

interface AWSTerraformTargetGroupListenerResource {
  "tg-https-listener": Array<{
    default_action: Array<{
      target_group_arn: string;
      type: string;
    }>;
    load_balancer_arn: string;
    port: string;
    protocol: string;
  }>;
  "tg-http-listener": Array<{
    default_action: Array<{
      target_group_arn: string;
      type: string;
    }>;
    load_balancer_arn: string;
    port: string;
    protocol: string;
  }>;
}

interface AWSTerraformVPCResource {
  vpc: {
    cidr_block: string;
    enable_dns_hostnames: string;
    enable_dns_support: string;
    tags: {
      Name: string;
    };
  };
}
interface DeploymentTargetConfiguration {
  aws: AWSDeploymentTargetConfiguration;
  gcp: unknown;
  azure: unknown;
}

// incomplete type, config will have more options
interface CNDIConfig {
  nodes: CNDINodesSpec;
  applications: {
    [key: string]: CNDIApplicationSpec;
  };
  cluster: {
    [key: string]: unknown;
  };
}

interface KubernetesManifest {
  apiVersion: string;
  kind: string;
}

interface KubernetesSecret extends KubernetesManifest {
  kind: "Secret";
  data?: {
    [key: string]: string;
  };
  stringData?: {
    [key: string]: string;
  };
  metadata: {
    name: string;
  };
  isPlaceholder: boolean;
}

interface EnvObject {
  [key: string]: {
    value?: string;
    comment?: string;
  };
}
interface KubernetesSecretWithStringData extends KubernetesSecret {
  stringData: {
    [key: string]: string;
  };
}

interface CNDIApplicationSpec {
  targetRevision: string;
  repoURL: string;
  destinationNamespace: string;
  chart?: string;
  values: {
    [key: string]: unknown;
  };
}

interface CNDIContext {
  CNDI_HOME: string;
  CNDI_SRC: string;
  projectDirectory: string;
  projectCndiDirectory: string;
  githubDirectory: string;
  dotEnvPath: string;
  pathToConfig: string;
  pathToTerraformResources: string;
  pathToKubernetesManifests: string;
  pathToTerraformBinary: string;
  pathToCNDIBinary: string;
  fileSuffixForPlatform: string;
  noGitHub: boolean;
  noDotEnv: boolean;
  pathToOpenSSL: string;
  pathToKeys: string;
  pathToKubeseal: string;
  gitignorePath: string;
  noKeys: boolean;
  template: string;
  interactive: boolean;
  sealedSecretsKeys?: SealedSecretsKeys;
  terraformStatePassphrase?: string;
  argoUIReadOnlyPassword?: string;
}

// cndi-config.jsonc["nodes"]["entries"][*]
interface BaseNodeEntrySpec {
  name: string;
  role: NodeRole;
  kind: NodeKind;
}

interface CNDIClients {
  // deno-lint-ignore no-explicit-any
  aws?: any;
}

interface TerraformDependencies {
  required_providers: Array<{
    [key: string]: {
      source: string;
      version: string;
    };
  }>;
  required_version: string;
}

interface TerraformRootFileData {
  locals: [
    {
      bootstrap_token: "${random_password.generated_token.result}";
      leader_node_ip: string;
      git_password: "${var.git_password}";
      git_username: "${var.git_username}";
      git_repo: "${var.git_repo}";
      argo_ui_readonly_password: "${var.argo_ui_readonly_password}";
      sealed_secrets_private_key: "${var.sealed_secrets_private_key}";
      sealed_secrets_public_key: "${var.sealed_secrets_public_key}";
      target_id: string;
    },
  ];
  provider: {
    random: [Record<never, never>]; // equal to [{}]
    aws: [Record<never, never>]; // equal to [{}]
  };

  resource: [{
    random_password: RandomTerraformRandomPasswordResource;
    aws_internet_gateway: AWSTerraformInternetGatewayResource;
    aws_lb: AWSTerraformLoadBalancerResource;
    aws_route: AWSTerraformRouteResource;
    aws_route_table: AWSTerraformRouteTableResource;
    aws_route_table_association: AWSTerraformRouteTableAssociationResource;
    aws_subnet: AWSTerraformSubnetResource;
    aws_security_group: AWSTerraformSecurityGroupResource;
    aws_lb_target_group: AWSTerraformTargetGroupResource;
    aws_lb_listener: AWSTerraformTargetGroupListenerResource;
    aws_lb_target_group_attachment: AWSTerraformTargetGroupAttachmentResource;
    aws_vpc: AWSTerraformVPCResource;
  }];
  terraform: [TerraformDependencies];
  variable: {
    owner: [{
      default: "polyseam";
      description: "Org Name";
      type: "string";
    }];

    vpc_cidr_block: [{
      default: "10.0.0.0/16";
      description: "CIDR block for the VPC";
      type: "string";
    }];

    vpc_dns_support: [{
      default: true;
      description: "Enable DNS support in the VPC";
      type: "bool";
    }];

    vpc_dns_hostnames: [{
      default: true;
      description: "Enable DNS hostnames in the VPC";
      type: "bool";
    }];

    sg_ingress_proto: [{
      default: "tcp";
      description: "Protocol used for the ingress rule";
      type: "string";
    }];

    sg_ingress_http: [{
      default: "80";
      description: "Port for HTTP traffic";
      type: "string";
    }];

    sg_ingress_https: [{
      default: "443";
      description: "Port for HTTPS traffic";
      type: "string";
    }];

    sg_ingress_ssh: [{
      default: "22";
      description: "Port used SSL traffic";
      type: "string";
    }];

    sg_ingress_k8s_API: [{
      default: "16443";
      description: "Port used for Kubernetes API server";
      type: "string";
    }];

    sg_ingress_nodeport_range_start: [{
      default: "30000";
      description:
        "Nodeport start range port to quickly access applications INSECURE";
      type: "string";
    }];

    sg_ingress_nodeport_range_end: [{
      default: "33000";
      description:
        "Nodeport end range port to quickly access applications INSECURE";
      type: "string";
    }];

    sg_egress_proto: [{
      default: "-1";
      description: "Protocol used for the egress rule";
      type: "string";
    }];

    sg_egress_all: [{
      default: "0";
      description: "Port used for the egress rule";
      type: "string";
    }];

    sg_ingress_cidr_block: [{
      default: "0.0.0.0/0";
      description: "CIDR block for the ingres rule";
      type: "string";
    }];

    sg_egress_cidr_block: [{
      default: "0.0.0.0/0";
      description: "CIDR block for the egress rule";
      type: "string";
    }];

    tg_http: [{
      default: "80";
      description: "Target Group Port for HTTP traffic";
      type: "string";
    }];

    tg_http_proto: [{
      default: "TCP";
      description: "Protocol used for the HTTP Target Group";
      type: "string";
    }];

    tg_https: [{
      default: "443";
      description: "Target Group Port for HTTP traffic";
      type: "string";
    }];

    tg_https_proto: [{
      default: "TCP";
      description: "Protocol used for the HTTP Target Group";
      type: "string";
    }];

    sbn_public_ip: [{
      default: true;
      description: "Assign public IP to the instance launched into the subnet";
      type: "bool";
    }];

    sbn_cidr_block: [{
      default: "10.0.1.0/24";
      description: "CIDR block for the subnet";
      type: "string";
    }];

    destination_cidr_block: [{
      default: "0.0.0.0/0";
      description: "CIDR block for the route";
      type: "string";
    }];

    ebs_block_device_name: [{
      default: "/dev/sda1";
      description: "name of the ebs block device";
      type: "string";
    }];

    ebs_block_device_size: [{
      default: "80";
      description: "name of the ebs block device";
      type: "string";
    }];

    ebs_block_device_volume_type: [{
      default: "gp3";
      description: "volume_type of the ebs block device";
      type: "string";
    }];

    git_password: [
      {
        description: "password for accessing the repositories";
        type: "string";
      },
    ];
    git_username: [
      {
        description: "password for accessing the repositories";
        type: "string";
      },
    ];
    git_repo: [
      {
        description: "repository URL to access";
        type: "string";
      },
    ];
    sealed_secrets_private_key: [
      {
        description: "private key for decrypting sealed secrets";
        type: "string";
      },
    ];
    sealed_secrets_public_key: [
      {
        description: "public key for encrypting sealed secrets";
        type: "string";
      },
    ];
    argo_ui_readonly_password: [
      {
        description: "password for accessing the argo ui";
        type: "string";
      },
    ];
  };
}

interface SealedSecretsKeys {
  sealed_secrets_private_key: string;
  sealed_secrets_public_key: string;
}
const enum Template {
  "airflow-tls" = "airflow-tls",
  "basic" = "basic",
}

export type {
  AirflowTlsTemplateAnswers,
  AWSDeploymentTargetConfiguration,
  AWSNodeEntrySpec,
  AWSTerraformNodeResource,
  BaseNodeEntrySpec,
  CNDIApplicationSpec,
  CNDIClients,
  CNDIConfig,
  CNDIContext,
  CNDINode,
  CNDINodesSpec,
  DeploymentTargetConfiguration,
  EnvObject,
  KubernetesManifest,
  KubernetesSecret,
  KubernetesSecretWithStringData,
  SealedSecretsKeys,
  Template,
  TerraformDependencies,
  TerraformRootFileData,
};
