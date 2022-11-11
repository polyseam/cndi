import { TerraformRootFileData } from "../../types.ts";

const terraformRootFileData: TerraformRootFileData = {
  locals: [
    {
      bootstrap_token: "${random_password.generated_token.result}",
      controller_node_ip: "",
      git_password: "${var.git_password}",
      git_username: "${var.git_username}",
      git_repo: "${var.git_repo}",
      argoui_readonly_password: "${var.argoui_readonly_password}",
      sealed_secrets_private_key: "${var.sealed_secrets_private_key}",
      sealed_secrets_public_key: "${var.sealed_secrets_public_key}",
      target_id: "",
    },
  ],
  provider: {
    random: [{}],
    aws: [{}],
  },
  resource: [{
    random_password: {
      generated_token: [
        {
          length: 32,
          special: false,
          upper: false,
        },
      ],
    },
    aws_internet_gateway: {
      igw: {
        tags: { Name: "${var.owner}-internet-gateway" },
        vpc_id: "${aws_vpc.vpc.id}",
      },
    },
    aws_lb: {
      nlb: {
        internal: false,
        load_balancer_type: "network",
        name: "${var.owner}-nlb",
        subnets: ["${aws_subnet.subnet.id}"],
      },
    },
    aws_route: {
      r: {
        depends_on: ["aws_route_table.rt"],
        route_table_id: "${aws_route_table.rt.id}",
        destination_cidr_block: "${var.destination_cidr_block}",
        gateway_id: "${aws_internet_gateway.igw.id}",
      },
    },
    aws_route_table: {
      rt: {
        tags: { Name: "${var.owner}-aws-route-table" },
        vpc_id: "${aws_vpc.vpc.id}",
      },
    },
    aws_route_table_association: {
      rt_sbn_asso: {
        route_table_id: "${aws_route_table.rt.id}",
        subnet_id: "${aws_subnet.subnet.id}",
      },
    },
    aws_subnet: {
      subnet: {
        availability_zone: "us-east-1a",
        cidr_block: "${var.sbn_cidr_block}",
        map_public_ip_on_launch: "${var.sbn_public_ip}",
        tags: { Name: "${var.owner}-subnet" },
        vpc_id: "${aws_vpc.vpc.id}",
      },
    },
    aws_security_group: {
      sg: [
        {
          description: "Security firewall",
          egress: [
            {
              cidr_blocks: ["${var.sg_egress_cidr_block}"],
              description: "All traffic",
              from_port: "${var.sg_egress_all}",
              ipv6_cidr_blocks: [],
              prefix_list_ids: [],
              protocol: "${var.sg_egress_proto}",
              security_groups: [],
              self: false,
              to_port: "${var.sg_egress_all}",
            },
          ],
          ingress: [
            {
              cidr_blocks: ["${var.sg_ingress_cidr_block}"],
              description: "SSH port to access EC2 instances",
              from_port: "${var.sg_ingress_ssh}",
              protocol: "${var.sg_ingress_proto}",
              to_port: "${var.sg_ingress_ssh}",
              ipv6_cidr_blocks: [],
              prefix_list_ids: [],
              security_groups: [],
              self: false,
            },
            {
              cidr_blocks: ["${var.sg_ingress_cidr_block}"],
              description: "Port for HTTP traffic",
              from_port: "${var.sg_ingress_http}",
              protocol: "${var.sg_ingress_proto}",
              to_port: "${var.sg_ingress_http}",
              ipv6_cidr_blocks: [],
              prefix_list_ids: [],
              security_groups: [],
              self: false,
            },
            {
              cidr_blocks: ["${var.sg_ingress_cidr_block}"],
              description: "Port for HTTPS traffic",
              from_port: "${var.sg_ingress_https}",
              protocol: "${var.sg_ingress_proto}",
              to_port: "${var.sg_ingress_https}",
              ipv6_cidr_blocks: [],
              prefix_list_ids: [],
              security_groups: [],
              self: false,
            },
            {
              cidr_blocks: ["${var.sg_ingress_cidr_block}"],
              description:
                "Kubernetes API server port to access cluster from local machine",
              from_port: "${var.sg_ingress_k8s_API}",
              protocol: "${var.sg_ingress_proto}",
              to_port: "${var.sg_ingress_k8s_API}",
              ipv6_cidr_blocks: [],
              prefix_list_ids: [],
              security_groups: [],
              self: false,
            },
            {
              cidr_blocks: ["${var.sg_ingress_cidr_block}"],
              description:
                "Nodeport port to quickly access applications INSECURE",
              from_port: "${var.sg_ingress_nodeport_range_start}",
              protocol: "${var.sg_ingress_proto}",
              to_port: "${var.sg_ingress_nodeport_range_end}",
              ipv6_cidr_blocks: [],
              prefix_list_ids: [],
              security_groups: [],
              self: false,
            },
          ],
          name: "${var.owner}-sg",
          vpc_id: "${aws_vpc.vpc.id}",
        },
      ],
    },
    aws_lb_target_group: {
      "tg-http": [
        {
          name: "${var.owner}-tg-http",
          port: "${var.tg_http}",
          protocol: "${var.tg_http_proto}",
          vpc_id: "${aws_vpc.vpc.id}",
        },
      ],
      "tg-https": [
        {
          name: "${var.owner}-tg-https",
          port: "${var.tg_https}",
          protocol: "${var.tg_https_proto}",
          vpc_id: "${aws_vpc.vpc.id}",
        },
      ],
    },
    aws_lb_listener: {
      "tg-https-listener": [
        {
          default_action: [
            {
              target_group_arn: "${aws_lb_target_group.tg-https.arn}",
              type: "forward",
            },
          ],
          load_balancer_arn: "${aws_lb.nlb.arn}",
          port: "${var.tg_https}",
          protocol: "${var.tg_https_proto}",
        },
      ],
      "tg-http-listener": [
        {
          default_action: [
            {
              target_group_arn: "${aws_lb_target_group.tg-http.arn}",
              type: "forward",
            },
          ],
          load_balancer_arn: "${aws_lb.nlb.arn}",
          port: "${var.tg_http}",
          protocol: "${var.tg_http_proto}",
        },
      ],
    },
    aws_lb_target_group_attachment: {
      "tg-https-target": [
        {
          target_group_arn: "${aws_lb_target_group.tg-https.arn}",
          target_id: "${local.target_id}",
        },
      ],
      "tg-http-target": [
        {
          target_group_arn: "${aws_lb_target_group.tg-http.arn}",
          target_id: "${local.target_id}",
        },
      ],
    },
    aws_vpc: {
      vpc: {
        cidr_block: "${var.vpc_cidr_block}",
        enable_dns_hostnames: "${var.vpc_dns_hostnames}",
        enable_dns_support: "${var.vpc_dns_support}",
        tags: { Name: "${var.owner}-vpc" },
      },
    },
  }],

  terraform: [
    {
      required_providers: [
        {
          external: {
            source: "hashicorp/external",
            version: "2.2.2",
          },
        },
      ],
      required_version: ">= 1.2.0",
    },
  ],
  variable: {
    owner: [{
      default: "polyseam",
      description: "Org Name",
      type: "string",
    }],

    vpc_cidr_block: [{
      default: "10.0.0.0/16",
      description: "CIDR block for the VPC",
      type: "string",
    }],

    vpc_dns_support: [{
      default: true,
      description: "Enable DNS support in the VPC",
      type: "bool",
    }],

    vpc_dns_hostnames: [{
      default: true,
      description: "Enable DNS hostnames in the VPC",
      type: "bool",
    }],

    sg_ingress_proto: [{
      default: "tcp",
      description: "Protocol used for the ingress rule",
      type: "string",
    }],

    sg_ingress_http: [{
      default: "80",
      description: "Port for HTTP traffic",
      type: "string",
    }],

    sg_ingress_https: [{
      default: "443",
      description: "Port for HTTPS traffic",
      type: "string",
    }],

    sg_ingress_ssh: [{
      default: "22",
      description: "Port used SSL traffic",
      type: "string",
    }],

    sg_ingress_k8s_API: [{
      default: "16443",
      description: "Port used for Kubernetes API server",
      type: "string",
    }],

    sg_ingress_nodeport_range_start: [{
      default: "30000",
      description:
        "Nodeport start range port to quickly access applications INSECURE",
      type: "string",
    }],

    sg_ingress_nodeport_range_end: [{
      default: "33000",
      description:
        "Nodeport end range port to quickly access applications INSECURE",
      type: "string",
    }],

    sg_egress_proto: [{
      default: "-1",
      description: "Protocol used for the egress rule",
      type: "string",
    }],

    sg_egress_all: [{
      default: "0",
      description: "Port used for the egress rule",
      type: "string",
    }],

    sg_ingress_cidr_block: [{
      default: "0.0.0.0/0",
      description: "CIDR block for the ingres rule",
      type: "string",
    }],

    sg_egress_cidr_block: [{
      default: "0.0.0.0/0",
      description: "CIDR block for the egress rule",
      type: "string",
    }],

    tg_http: [{
      default: "80",
      description: "Target Group Port for HTTP traffic",
      type: "string",
    }],

    tg_http_proto: [{
      default: "TCP",
      description: "Protocol used for the HTTP Target Group",
      type: "string",
    }],

    tg_https: [{
      default: "443",
      description: "Target Group Port for HTTP traffic",
      type: "string",
    }],

    tg_https_proto: [{
      default: "TCP",
      description: "Protocol used for the HTTP Target Group",
      type: "string",
    }],

    sbn_public_ip: [{
      default: true,
      description: "Assign public IP to the instance launched into the subnet",
      type: "bool",
    }],

    sbn_cidr_block: [{
      default: "10.0.1.0/24",
      description: "CIDR block for the subnet",
      type: "string",
    }],

    destination_cidr_block: [{
      default: "0.0.0.0/0",
      description: "CIDR block for the route",
      type: "string",
    }],

    ebs_block_device_name: [{
      default: "/dev/sda1",
      description: "name of the ebs block device",
      type: "string",
    }],

    ebs_block_device_size: [{
      default: "80",
      description: "name of the ebs block device",
      type: "string",
    }],

    ebs_block_device_volume_type: [{
      default: "gp3",
      description: "volume_type of the ebs block device",
      type: "string",
    }],
    git_password: [
      {
        description: "password for accessing the repositories",
        type: "string",
      },
    ],
    git_username: [
      {
        description: "password for accessing the repositories",
        type: "string",
      },
    ],
    git_repo: [
      {
        description: "repository URL to access",
        type: "string",
      },
    ],
    argoui_readonly_password: [
      {
        description: "password for accessing the argo ui",
        type: "string",
      },
    ],
    sealed_secrets_private_key: [
      {
        description: "private key for decrypting sealed secrets",
        type: "string",
      },
    ],
    sealed_secrets_public_key: [
      {
        description: "public key for encrypting sealed secrets",
        type: "string",
      },
    ],
  },
};

export default terraformRootFileData;
