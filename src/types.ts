// list of all commands for the CLI

export const enum NodeKind {
  aws = "aws",
}

export const enum Command {
  init = "init",
  "overwrite-with" = "overwrite-with",
  run = "run",
  help = "help",
  default = "default",
  install = "install",
  ow = "ow",
}

// node.role is either "controller" or "worker"
export const enum NodeRole {
  controller = "controller",
  worker = "worker",
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
        availability_zone: string;
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

interface AWSTerraformInternetGatewayResource {
  resource: {
    aws_internet_gateway: {
      igw: {
        tags: {
          Name: string
        }
        vpc_id: string
      }
    }
  }
}
interface AWSTerraformLoadBalancerResource {
  resource: {
    aws_lb: {
      nlb: {
        internal: boolean;
        load_balancer_type: string;
        name: string;
        subnets: Array<string>;
      };
    };
  }
}
interface AWSTerraformRouteResource {
  resource: {
    aws_route: {
      r: {
        depends_on: Array<string>
        route_table_id: string
        destination_cidr_block: string
        gateway_id: string
      }
    }
  }
}
interface AWSTerraformRouteTableResource {
  resource: {
    aws_route_table: {
      rt: {
        tags: {
          Name: string
        }
        vpc_id: string
      }
    }
  }
}interface AWSTerraformRouteTableAssociationResource {
  resource: {
    aws_route_table_association: {
      rt_sbn_asso: {
        route_table_id: string
        subnet_id: string
      }
    }
  }
}

interface AWSTerraformSubnetResource {
  resource: {
    aws_subnet: {
      subnet: {
        availability_zone: string
        cidr_block: string
        map_public_ip_on_launch: string
        tags: {
          Name: string
        }
        vpc_id: string
      }
    }
  }
}
interface AWSTerraformSecurityGroupResource {
  resource: {
    aws_security_group: Array<{
      sg: Array<{
        description: string
        egress: Array<{
          cidr_blocks: Array<string>
          description: string
          from_port: string
          ipv6_cidr_blocks: Array<any>
          prefix_list_ids: Array<any>
          protocol: string
          security_groups: Array<any>
          self: boolean
          to_port: string
        }>
        ingress: Array<{
          cidr_blocks: Array<string>
          description: string
          from_port: string
          protocol: string
          to_port: string
          ipv6_cidr_blocks: Array<any>
          prefix_list_ids: Array<any>
          security_groups: Array<any>
          self: boolean
        }>
        name: string
        vpc_id: string
      }>
    }>
  }
}
interface AWSTerraformTargetGroupsResource {
  resource: Array<{
    aws_lb_target_group?: {
      "tg-https"?: Array<{
        name: string
        port: string
        protocol: string
        vpc_id: string
      }>
      "tg-http"?: Array<{
        name: string
        port: string
        protocol: string
        vpc_id: string
      }>
    }
    aws_lb_target_group_attachment?: {
      "tg-https-target"?: Array<{
        target_group_arn: string
        target_id: string
      }>
      "tg-http-target"?: Array<{
        target_group_arn: string
        target_id: string
      }>
    }
    aws_lb_listener?: {
      "tg-https-listener"?: Array<{
        default_action: Array<{
          target_group_arn: string
          type: string
        }>
        load_balancer_arn: string
        port: string
        protocol: string
      }>
      "tg-http-listener"?: Array<{
        default_action: Array<{
          target_group_arn: string
          type: string
        }>
        load_balancer_arn: string
        port: string
        protocol: string
      }>
    }
  }>

}
interface AWSTerraformVPCResource {
  resource: {
    aws_vpc: {
      vpc: {
        cidr_block: string
        enable_dns_hostnames: string
        enable_dns_support: string
        tags: {
          Name: string
        }
      }
    }
  }

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
      controller_node_ip: string;
      git_password: "${var.git_password}";
      git_username: "${var.git_username}";
      git_repo: "${var.git_repo}";
      argoui_readonly_password: "${var.argoui_readonly_password}";
      sealed_secrets_private_key: "${var.sealed_secrets_private_key}";
      sealed_secrets_public_key: "${var.sealed_secrets_public_key}";
      gateway_id: string;
      load_balancer_arn: string
      route_table_id: string;
      subnet_id: string
      target_group_http_arn: string;
      target_group_https_arn: string;
      target_id: string;
      vpc_id: string;
      vpc_security_group_id: string;
      route_table: string;
    },
  ];
  provider: {
    random: [Record<never, never>]; // equal to [{}]
    aws: [Record<never, never>]; // equal to [{}]
  };
  resource: {
    random_password: {
      generated_token: [
        {
          length: 32;
          special: false;
          upper: false;
        },
      ];
    };
  };
  terraform: [TerraformDependencies];
  variable: {

    aws_region: [{

      default: "us-east-1";
      description: "AWS region";
      type: "string"

    }];

    owner: [{

      default: "polyseam";
      description: "Org Name";
      type: "string"

    }];

    aws_region_az: [{

      default: "a";
      description: "AWS region availability zone";
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
      default: "80"; description: "Port for HTTP traffic"; type: "string"
    }];


    sg_ingress_https: [{

      default: "443";
      description: "Port for HTTPS traffic";
      type: "string";

    }];


    sg_ingress_ssh: [{
      default: "22"; description: "Port used SSL traffic"; type: "string"
    }];


    sg_ingress_k8s_API: [{

      default: "16443";
      description: "Port used for Kubernetes API server";
      type: "string";

    }];


    sg_ingress_nodeport_range_start: [{

      default: "30000";
      description: "Nodeport start range port to quickly access applications INSECURE";
      type: "string";

    }];


    sg_ingress_nodeport_range_end: [{

      default: "33000";
      description: "Nodeport end range port to quickly access applications INSECURE";
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


    instance_ami: [{

      default: "ami-0c1704bac156af62c";
      description: "ID of the AMI used";
      type: "string";

    }];


    instance_type: [{

      default: "m5a.xlarge";
      description: "Type of the instance";
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
    argoui_readonly_password: [
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
  KubernetesManifest,
  KubernetesSecret,
  KubernetesSecretWithStringData,
  SealedSecretsKeys,
  TerraformDependencies,
  TerraformRootFileData,
};
