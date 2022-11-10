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
      gateway_id: "${aws_internet_gateway.igw.id}",
      load_balancer_arn: "${aws_lb.nlb.arn}",
      route_table_id: "${aws_route_table.rt.id}",
      subnet_id: "${aws_subnet.subnet.id}",
      target_group_http_arn: "${aws_lb_target_group.tg-http.arn}",
      target_group_https_arn: "${aws_lb_target_group.tg-https.arn}",
      target_id: "",
      vpc_id: "${aws_vpc.vpc.id}",
      vpc_security_group_id: "${aws_security_group.sg.id}",
      route_table: "${aws_route_table.rt}",
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
        vpc_id: "${local.vpc_id}",
      },
    },
    aws_lb: {
      nlb: {
        internal: false,
        load_balancer_type: "network",
        name: "${var.owner}-nlb",
        subnets: ["${local.subnet_id}"],
      },
    },
    aws_route: {
      r: {
        depends_on: ["aws_route_table.rt"],
        route_table_id: "${local.route_table_id}",
        destination_cidr_block: "${var.destination_cidr_block}",
        gateway_id: "${local.gateway_id}",
      },
    },
    aws_route_table: {
      rt: {
        tags: { Name: "${var.owner}-aws-route-table" },
        vpc_id: "${local.vpc_id}",
      },
    }, aws_route_table_association: {
      rt_sbn_asso: {
        route_table_id: "${local.route_table_id}",
        subnet_id: "${local.subnet_id}",
      },
    }, aws_subnet: {
      subnet: {
        availability_zone: "${var.aws_region}${var.aws_region_az}",
        cidr_block: "${var.sbn_cidr_block}",
        map_public_ip_on_launch: "${var.sbn_public_ip}",
        tags: { Name: "${var.owner}-subnet" },
        vpc_id: "${local.vpc_id}",
      },
    },
    aws_security_group: [
      {
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
                description: "Kubernetes API server port to access cluster from local machine",
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
                description: "Nodeport port to quickly access applications INSECURE",
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
            vpc_id: "${local.vpc_id}",
          },
        ],
      },
    ], aws_lb_target_group: {
      "tg-http": [
        {
          name: "${var.owner}-tg-http",
          port: "${var.tg_http}",
          protocol: "${var.tg_http_proto}",
          vpc_id: "${local.vpc_id}",
        },
      ],
    },
  },
  {
    aws_lb_target_group_attachment: {
      "tg-http-target": [
        {
          target_group_arn: "${local.target_group_http_arn}",
          target_id: "${local.target_id}",
        },
      ],
    },
  },
  {
    aws_lb_listener: {
      "tg-http-listener": [
        {
          default_action: [
            {
              target_group_arn: "${local.target_group_http_arn}",
              type: "forward",
            },
          ],
          load_balancer_arn: "${local.load_balancer_arn}",
          port: "${var.tg_http}",
          protocol: "${var.tg_http_proto}",
        },
      ],
    },
  },
  {
    aws_lb_target_group: {
      "tg-https": [
        {
          name: "${var.owner}-tg-https",
          port: "${var.tg_https}",
          protocol: "${var.tg_https_proto}",
          vpc_id: "${local.vpc_id}",
        },
      ],
    },
  },
  {
    aws_lb_target_group_attachment: {
      "tg-https-target": [
        {
          target_group_arn: "${local.target_group_https_arn}",
          target_id: "${local.target_id}",
        },
      ],
    },
  },
  {
    aws_lb_listener: {
      "tg-https-listener": [
        {
          default_action: [
            {
              target_group_arn: "${local.target_group_https_arn}",
              type: "forward",
            },
          ],
          load_balancer_arn: "${local.load_balancer_arn}",
          port: "${var.tg_https}",
          protocol: "${var.tg_https_proto}",
        },
      ],
    }, aws_vpc: {
      vpc: {
        cidr_block: "${var.vpc_cidr_block}",
        enable_dns_hostnames: "${var.vpc_dns_hostnames}",
        enable_dns_support: "${var.vpc_dns_support}",
        tags: { Name: "${var.owner}-vpc" },
      },
    },


  }
  ],

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
