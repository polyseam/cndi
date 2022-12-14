// https://youtu.be/jjMbPt_H3RQ?t=303 Pocock Wizardry
type ObjectValues<T> = T[keyof T];

export const NODE_KIND = {
  aws: "aws",
  gcp: "gcp",
} as const;

export const DEPLOYMENT_TARGET = {
  aws: "aws",
  gcp: "gcp",
} as const;

export const COMMAND = {
  init: "init",
  overwrite: "overwrite",
  run: "run",
  help: "help",
  default: "default",
  install: "install",
  terraform: "terraform",
  ow: "ow",
} as const;

export const NODE_ROLE = {
  leader: "leader",
  controller: "controller",
} as const;

// NodeRole refers to the role of the node, e.g. leader, controller.. worker in the future?
export type NodeRole = ObjectValues<typeof NODE_ROLE>;

// NodeKind refers to the type of node, e.g. AWS EC2, GCP CE, etc.
export type NodeKind = ObjectValues<typeof NODE_KIND>;

// DeploymentTarget refers to the type of deployment target, e.g. AWS, GCP, etc.
export type DeploymentTarget = ObjectValues<typeof DEPLOYMENT_TARGET>;

// a map of all available commands in the cndi binary
export type Command = ObjectValues<typeof COMMAND>;

interface AirflowTlsTemplateAnswers {
  argocdDomainName: string;
  airflowDomainName: string;
  dagRepoUrl: string;
  letsEncryptClusterIssuerEmailAddress: string;
}

// incomplete type, nodes will have more options
interface CNDINode {
  name: string;
  role: NodeRole;
  kind: NodeKind;
  instance_type?: string;
  ami?: string;
  machine_type?: string;
  image?: string;
  size?: number;
}

interface CNDINodesSpec {
  entries: Array<BaseNodeItemSpec>;
  deployment_target_configuration: DeploymentTargetConfiguration;
}
// cndi-config.jsonc["nodes"]["entries"][kind==="_ce"]
interface GCPNodeItemSpec extends BaseNodeItemSpec {
  machine_type?: string;
  image?: string;
  size?: number;
  volume_size?: number;
  instance_type?: string;
}
// cndi-config.jsonc["nodes"]["deployment_target_configuration"]["gcp"]
interface GCPDeploymentTargetConfiguration extends BaseNodeItemSpec {
  machine_type?: string;
  image?: string;
  size?: number;
}
interface GCPTerraformNodeResource {
  resource: {
    google_compute_instance: {
      [name: string]: {
        allow_stopping_for_update: boolean;
        boot_disk: Array<{
          source: string;
        }>;
        depends_on?: Array<string>;
        machine_type: string;
        metadata: {
          "user-data"?: string;
        };
        name: string;
        network_interface: Array<{
          access_config: Array<{
            network_tier: string;
          }>;
          network: string;
          subnetwork: string;
        }>;
        tags: Array<string>;
      };
    };
    google_compute_disk: GCPTerraformDiskResource;
  };
}

interface GCPTerraformDiskResource {
  [cndi_disk: string]: {
    name: string;
    size: number;
    type: string;
    image: string;
  };
}

interface GCPTerraformProjectServiceResource {
  [cndi_enable_project_service: string]: {
    disable_on_destroy: boolean;
    service: string;
    depends_on?: Array<string>;
  };
}
interface GCPTerraformInstanceGroupResource {
  cndi_cluster: {
    description: string;
    instances: Array<string>;
    name: string;
    named_port: Array<{
      name: string;
      port: string;
    }>;
    zone: string;
  };
}

interface GCPTerraformNetworkResource {
  cndi_vpc_network: {
    auto_create_subnetworks: boolean;
    name: string;
    depends_on?: Array<string>;
  };
}

interface GCPTerraformSubNetworkResource {
  cndi_vpc_subnetwork: {
    ip_cidr_range: string;
    name: string;
    network: string;
  };
}
interface GCPTerraformFirewallResource {
  [cndi_firewall: string]: {
    allow: Array<{
      ports?: Array<string>;
      protocol?: string;
    }>;
    description: string;
    direction: string;
    name: string;
    network: string;
    source_ranges: Array<string>;
  };
}
interface GCPTerraformNATResource {
  cndi_nat: {
    name: string;
    nat_ip_allocate_option: string;
    router: string;
    source_subnetwork_ip_ranges_to_nat: string;
  };
}
interface GCPTerraformHTTPpForwardingRuleResource {
  cndi_http_forwarding_rule: {
    backend_service: string;
    name: string;
    network_tier: string;
    ports: Array<string>;
  };
}
interface GCPTerraformRegionHealthcheckResource {
  cndi_healthcheck: {
    check_interval_sec: number;
    name: string;
    tcp_health_check: Array<{
      port: number;
    }>;
    timeout_sec: number;
    depends_on?: Array<string>;
  };
}
interface GCPTerraformRegionBackendServiceResource {
  cndi_backend_service: Array<{
    backend: Array<{
      group: string;
    }>;
    health_checks: Array<string>;
    load_balancing_scheme: string;
    name: string;
    port_name: string;
    protocol: string;
  }>;
}
interface GCPTerraformRouterResource {
  cndi_router: {
    name: string;
    network: string;
  };
}
// cndi-config.jsonc["nodes"]["entries"][kind==="aws"]
interface AWSNodeItemSpec extends BaseNodeItemSpec {
  ami: string;
  instance_type: string;
  availability_zone: string;
  volume_size?: number;
  size?: number;
  machine_type?: string;
}

// cndi-config.jsonc["nodes"]["deployment_target_configuration"]["aws"]
interface AWSDeploymentTargetConfiguration extends BaseNodeItemSpec {
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
    aws_lb_target_group_attachment: AWSTerraformTargetGroupAttachmentResource;
  };
}

interface AWSTerraformEC2InstanceTypeOfferingsDataSource {
  [ec2_inst_type: string]: Array<{
    filter: Array<{
      name: string;
      values: Array<string>;
    }>;
    location_type: string;
  }>;
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
    subnets: string;
    tags: { Name: string };
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
    count: string;
    route_table_id: string;
    subnet_id: string;
  };
}

interface AWSTerraformSubnetResource {
  subnet: {
    count: string;
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
      ipv6_cidr_blocks: [];
      prefix_list_ids: [];
      protocol: string;
      security_groups: [];
      self: boolean;
      to_port: string;
    }>;
    ingress: Array<{
      cidr_blocks: Array<string>;
      description: string;
      from_port: string;
      protocol: string;
      to_port: string;
      ipv6_cidr_blocks: [];
      prefix_list_ids: [];
      security_groups: [];
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
  [httptarget: string]: Array<{
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
    tags: {
      Name: string;
    };
  }>;
  "tg-http-listener": Array<{
    default_action: Array<{
      target_group_arn: string;
      type: string;
    }>;
    load_balancer_arn: string;
    port: string;
    protocol: string;
    tags: {
      Name: string;
    };
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
  project_name?: string;
  cndi_version?: string;
  infrastructure: {
    cndi: {
      deployment_target_configuration?: DeploymentTargetConfiguration;
      nodes: Array<BaseNodeItemSpec>;
    };
  };
  applications: {
    [key: string]: CNDIApplicationSpec;
  };
  cluster_manifests: {
    [key: string]: unknown;
  };
}

interface KubernetesManifest {
  cndiVersion: string;
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
  dotVSCodeDirectory: string;
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
  interactive: boolean;
  template?: string;
  sealedSecretsKeys?: SealedSecretsKeys;
  terraformStatePassphrase?: string;
  argoUIReadOnlyPassword?: string;
}

// cndi-config.jsonc["infrastructure"]["cndi"]["nodes"]["*"]
interface BaseNodeItemSpec {
  name: string;
  kind: NodeKind;
  role?: NodeRole; // default: controller
  volume_size?: number; // we use this when writing config regardless of the provider, but support provider-native keys too
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
interface GCPTerraformRootFileData {
  locals: [
    {
      region: string;
      zone: "${local.region}-a";
      leader_node_ip: string;
      bootstrap_token: "${random_password.generated_token.result}";
      git_password: "${var.git_password}";
      git_username: "${var.git_username}";
      git_repo: "${var.git_repo}";
      argo_ui_readonly_password: "${var.argo_ui_readonly_password}";
      sealed_secrets_private_key: "${var.sealed_secrets_private_key}";
      sealed_secrets_public_key: "${var.sealed_secrets_public_key}";
    },
  ];
  provider: {
    random: [Record<never, never>]; // equal to [{}]
    aws?: Array<{ region: string }>;
    google?: Array<{ region: string; project: string; zone?: string }>;
  };

  resource: [
    {
      random_password: RandomTerraformRandomPasswordResource;
      google_compute_instance_group: GCPTerraformInstanceGroupResource;
      google_compute_network: GCPTerraformNetworkResource;
      google_compute_subnetwork: GCPTerraformSubNetworkResource;
      google_compute_firewall: GCPTerraformFirewallResource;
      google_compute_router: GCPTerraformRouterResource;
      google_compute_router_nat: GCPTerraformNATResource;
      google_compute_forwarding_rule: GCPTerraformHTTPpForwardingRuleResource;
      google_compute_region_health_check: GCPTerraformRegionHealthcheckResource;
      google_compute_region_backend_service:
        GCPTerraformRegionBackendServiceResource;
      google_project_service: GCPTerraformProjectServiceResource;
    },
  ];

  terraform: [TerraformDependencies];
  variable: {
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
interface TerraformRootFileData {
  locals: [
    {
      node_count: string;
      leader_node_ip: string;
      region: string;
      bootstrap_token: "${random_password.generated_token.result}";
      git_password: "${var.git_password}";
      git_username: "${var.git_username}";
      git_repo: "${var.git_repo}";
      argo_ui_readonly_password: "${var.argo_ui_readonly_password}";
      sealed_secrets_private_key: "${var.sealed_secrets_private_key}";
      sealed_secrets_public_key: "${var.sealed_secrets_public_key}";
      availability_zones: string;
    },
  ];
  provider: {
    random: [Record<never, never>]; // equal to [{}]
    aws?: Array<{ region: string }>;
    gcp?: Array<{ region: string; project: string }>;
  };
  data: [
    {
      aws_ec2_instance_type_offerings: [
        AWSTerraformEC2InstanceTypeOfferingsDataSource,
      ];
    },
  ];
  resource: [
    {
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
      aws_vpc: AWSTerraformVPCResource;
    },
  ];

  terraform: [TerraformDependencies];
  variable: {
    owner: [
      {
        default: "polyseam";
        description: "Org Name";
        type: "string";
      },
    ];

    vpc_cidr_block: [
      {
        default: "10.0.0.0/16";
        description: "CIDR block for the VPC";
        type: "string";
      },
    ];

    vpc_dns_support: [
      {
        default: true;
        description: "Enable DNS support in the VPC";
        type: "bool";
      },
    ];

    vpc_dns_hostnames: [
      {
        default: true;
        description: "Enable DNS hostnames in the VPC";
        type: "bool";
      },
    ];

    sg_ingress_proto: [
      {
        default: "tcp";
        description: "Protocol used for the ingress rule";
        type: "string";
      },
    ];

    sg_ingress_http: [
      {
        default: "80";
        description: "Port for HTTP traffic";
        type: "string";
      },
    ];

    sg_ingress_https: [
      {
        default: "443";
        description: "Port for HTTPS traffic";
        type: "string";
      },
    ];

    sg_ingress_ssh: [
      {
        default: "22";
        description: "Port used SSL traffic";
        type: "string";
      },
    ];

    sg_ingress_proto_all: [
      {
        default: "-1";
        description: "Protocol used for the egress rule";
        type: "string";
      },
    ];

    sg_ingress_all: [
      {
        default: "0";
        description: "Port used for the All ingress rule";
        type: "string";
      },
    ];

    sg_ingress_k8s_API: [
      {
        default: "16443";
        description: "Port used for Kubernetes API server";
        type: "string";
      },
    ];

    sg_ingress_nodeport_range_start: [
      {
        default: "30000";
        description:
          "Nodeport start range port to quickly access applications INSECURE";
        type: "string";
      },
    ];

    sg_ingress_nodeport_range_end: [
      {
        default: "33000";
        description:
          "Nodeport end range port to quickly access applications INSECURE";
        type: "string";
      },
    ];

    sg_egress_proto: [
      {
        default: "-1";
        description: "Protocol used for the egress rule";
        type: "string";
      },
    ];

    sg_egress_all: [
      {
        default: "0";
        description: "Port used for the egress rule";
        type: "string";
      },
    ];

    sg_ingress_cidr_block: [
      {
        default: "0.0.0.0/0";
        description: "CIDR block for the ingres rule";
        type: "string";
      },
    ];

    sg_egress_cidr_block: [
      {
        default: "0.0.0.0/0";
        description: "CIDR block for the egress rule";
        type: "string";
      },
    ];

    tg_http: [
      {
        default: "80";
        description: "Target Group Port for HTTP traffic";
        type: "string";
      },
    ];

    tg_http_proto: [
      {
        default: "TCP";
        description: "Protocol used for the HTTP Target Group";
        type: "string";
      },
    ];

    tg_https: [
      {
        default: "443";
        description: "Target Group Port for HTTP traffic";
        type: "string";
      },
    ];

    tg_https_proto: [
      {
        default: "TCP";
        description: "Protocol used for the HTTP Target Group";
        type: "string";
      },
    ];

    sbn_public_ip: [
      {
        default: true;
        description:
          "Assign public IP to the instance launched into the subnet";
        type: "bool";
      },
    ];

    sbn_cidr_block: [
      {
        default: [
          "10.0.1.0/24",
          "10.0.2.0/24",
          "10.0.3.0/24",
          "10.0.4.0/24",
          "10.0.5.0/24",
          "10.0.6.0/24",
        ];
        description: "CIDR block for the subnet";
        type: "list(string)";
      },
    ];

    destination_cidr_block: [
      {
        default: "0.0.0.0/0";
        description: "CIDR block for the route";
        type: "string";
      },
    ];

    ebs_block_device_name: [
      {
        default: "/dev/sda1";
        description: "name of the ebs block device";
        type: "string";
      },
    ];

    ebs_block_device_size: [
      {
        default: "80";
        description: "name of the ebs block device";
        type: "string";
      },
    ];

    ebs_block_device_volume_type: [
      {
        default: "gp3";
        description: "volume_type of the ebs block device";
        type: "string";
      },
    ];

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

export type {
  AirflowTlsTemplateAnswers,
  AWSDeploymentTargetConfiguration,
  AWSNodeItemSpec,
  AWSTerraformNodeResource,
  AWSTerraformTargetGroupAttachmentResource,
  BaseNodeItemSpec,
  CNDIApplicationSpec,
  CNDIClients,
  CNDIConfig,
  CNDIContext,
  CNDINode,
  CNDINodesSpec,
  DeploymentTargetConfiguration,
  EnvObject,
  GCPDeploymentTargetConfiguration,
  GCPNodeItemSpec,
  GCPTerraformInstanceGroupResource,
  GCPTerraformNodeResource,
  GCPTerraformRootFileData,
  KubernetesManifest,
  KubernetesSecret,
  KubernetesSecretWithStringData,
  SealedSecretsKeys,
  TerraformDependencies,
  TerraformRootFileData,
};
