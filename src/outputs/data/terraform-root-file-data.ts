import {
  GCPTerraformRootFileData,
  TerraformRootFileData,
} from "../../types.ts";

const terraformRootFileData: TerraformRootFileData = {
  locals: [
    {
      region: "",
      leader_node_ip: "",
      node_count: "",
      bootstrap_token: "${random_password.generated_token.result}",
      git_password: "${var.git_password}",
      git_username: "${var.git_username}",
      git_repo: "${var.git_repo}",
      argo_ui_readonly_password: "${var.argo_ui_readonly_password}",
      sealed_secrets_private_key: "${var.sealed_secrets_private_key}",
      sealed_secrets_public_key: "${var.sealed_secrets_public_key}",
      availability_zones: "",
    },
  ],
  provider: {
    random: [{}],
  },
  data: [
    {
      aws_ec2_instance_type_offerings: [
        {
          "available_az_for_controller-airflow-node-1_instance_type": [
            {
              filter: [{ name: "instance-type", values: ["t3.medium"] }],
              location_type: "availability-zone",
            },
          ],
          "available_az_for_controller-airflow-node-2_instance_type": [
            {
              filter: [{ name: "instance-type", values: ["t2.medium"] }],
              location_type: "availability-zone",
            },
          ],
          "available_az_for_leader-airflow-node_instance_type": [
            {
              filter: [{ name: "instance-type", values: ["m5a.xlarge"] }],
              location_type: "availability-zone",
            },
          ],
        },
      ],
    },
  ],
  resource: [
    {
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
          subnets: "${aws_subnet.subnet[*].id}",
          tags: { Name: "${var.owner}-nlb" },
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
          count: "${local.node_count}",
          route_table_id: "${aws_route_table.rt.id}",
          subnet_id: "${element(aws_subnet.subnet[*].id, count.index)}",
        },
      },
      aws_subnet: {
        subnet: {
          count: "${local.node_count}",
          availability_zone:
            "${element(local.availability_zones, count.index)}",
          cidr_block: "${element(var.sbn_cidr_block, count.index)}",
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
              {
                cidr_blocks: ["${var.vpc_cidr_block}"],
                description:
                  "Inbound rule that enables traffic between EC2 instances in the VPC ",
                from_port: "${var.sg_ingress_all}",
                protocol: "${var.sg_ingress_proto_all}",
                to_port: "${var.sg_ingress_all}",
                ipv6_cidr_blocks: [],
                prefix_list_ids: [],
                security_groups: [],
                self: false,
              },
            ],
            vpc_id: "${aws_vpc.vpc.id}",
            tags: { Name: "${var.owner}-sg" },
          },
        ],
      },
      aws_lb_target_group: {
        "tg-http": [
          {
            tags: { Name: "${var.owner}-http-target-group " },
            port: "${var.tg_http}",
            protocol: "${var.tg_http_proto}",
            vpc_id: "${aws_vpc.vpc.id}",
          },
        ],
        "tg-https": [
          {
            tags: { Name: "${var.owner}-https-target-group " },
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
            tags: { Name: "${var.owner}-https-target-group-listener" },
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
            tags: { Name: "${var.owner}-https-target-group-listeners" },
            load_balancer_arn: "${aws_lb.nlb.arn}",
            port: "${var.tg_http}",
            protocol: "${var.tg_http_proto}",
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
    },
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
    owner: [
      {
        default: "polyseam",
        description: "Org Name",
        type: "string",
      },
    ],

    vpc_cidr_block: [
      {
        default: "10.0.0.0/16",
        description: "CIDR block for the VPC",
        type: "string",
      },
    ],

    vpc_dns_support: [
      {
        default: true,
        description: "Enable DNS support in the VPC",
        type: "bool",
      },
    ],

    vpc_dns_hostnames: [
      {
        default: true,
        description: "Enable DNS hostnames in the VPC",
        type: "bool",
      },
    ],

    sg_ingress_proto: [
      {
        default: "tcp",
        description: "Protocol used for the ingress rule",
        type: "string",
      },
    ],

    sg_ingress_http: [
      {
        default: "80",
        description: "Port for HTTP traffic",
        type: "string",
      },
    ],

    sg_ingress_https: [
      {
        default: "443",
        description: "Port for HTTPS traffic",
        type: "string",
      },
    ],

    sg_ingress_ssh: [
      {
        default: "22",
        description: "Port used SSL traffic",
        type: "string",
      },
    ],

    sg_ingress_k8s_API: [
      {
        default: "16443",
        description: "Port used for Kubernetes API server",
        type: "string",
      },
    ],

    sg_ingress_nodeport_range_start: [
      {
        default: "30000",
        description:
          "Nodeport start range port to quickly access applications INSECURE",
        type: "string",
      },
    ],

    sg_ingress_nodeport_range_end: [
      {
        default: "33000",
        description:
          "Nodeport end range port to quickly access applications INSECURE",
        type: "string",
      },
    ],

    sg_ingress_cidr_block: [
      {
        default: "0.0.0.0/0",
        description: "CIDR block for the ingres rule",
        type: "string",
      },
    ],

    sg_ingress_all: [
      {
        default: "0",
        description: "Port used for the All ingress rule",
        type: "string",
      },
    ],

    sg_ingress_proto_all: [
      {
        default: "-1",
        description: "Protocol used for the egress rule",
        type: "string",
      },
    ],

    sg_egress_proto: [
      {
        default: "-1",
        description: "Protocol used for the egress rule",
        type: "string",
      },
    ],

    sg_egress_all: [
      {
        default: "0",
        description: "Port used for the egress rule",
        type: "string",
      },
    ],

    sg_egress_cidr_block: [
      {
        default: "0.0.0.0/0",
        description: "CIDR block for the egress rule",
        type: "string",
      },
    ],

    tg_http: [
      {
        default: "80",
        description: "Target Group Port for HTTP traffic",
        type: "string",
      },
    ],

    tg_http_proto: [
      {
        default: "TCP",
        description: "Protocol used for the HTTP Target Group",
        type: "string",
      },
    ],

    tg_https: [
      {
        default: "443",
        description: "Target Group Port for HTTP traffic",
        type: "string",
      },
    ],

    tg_https_proto: [
      {
        default: "TCP",
        description: "Protocol used for the HTTP Target Group",
        type: "string",
      },
    ],

    sbn_public_ip: [
      {
        default: true,
        description:
          "Assign public IP to the instance launched into the subnet",
        type: "bool",
      },
    ],

    sbn_cidr_block: [
      {
        default: [
          "10.0.1.0/24",
          "10.0.2.0/24",
          "10.0.3.0/24",
          "10.0.4.0/24",
          "10.0.5.0/24",
          "10.0.6.0/24",
        ],
        description: "CIDR block for the subnet",
        type: "list(string)",
      },
    ],

    destination_cidr_block: [
      {
        default: "0.0.0.0/0",
        description: "CIDR block for the route",
        type: "string",
      },
    ],

    ebs_block_device_name: [
      {
        default: "/dev/sda1",
        description: "name of the ebs block device",
        type: "string",
      },
    ],

    ebs_block_device_size: [
      {
        default: "80",
        description: "name of the ebs block device",
        type: "string",
      },
    ],

    ebs_block_device_volume_type: [
      {
        default: "gp3",
        description: "volume_type of the ebs block device",
        type: "string",
      },
    ],
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
    argo_ui_readonly_password: [
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

const gcpTerraformRootFileData: GCPTerraformRootFileData = {
  locals: [
    {
      zone: "${local.region}-a",
      region: "",
      leader_node_ip: "",
      bootstrap_token: "${random_password.generated_token.result}",
      git_password: "${var.git_password}",
      git_username: "${var.git_username}",
      git_repo: "${var.git_repo}",
      argo_ui_readonly_password: "${var.argo_ui_readonly_password}",
      sealed_secrets_private_key: "${var.sealed_secrets_private_key}",
      sealed_secrets_public_key: "${var.sealed_secrets_public_key}",
    },
  ],
  provider: {
    random: [{}],
  },
  resource: [
    {
      random_password: {
        generated_token: [
          {
            length: 32,
            special: false,
            upper: false,
          },
        ],
      },
      google_project_service: {
        cndi_enable_cloudresourcemanager_service: {
          disable_on_destroy: false,
          service: "cloudresourcemanager.googleapis.com",
          depends_on: [],
        },
        cndi_enable_compute_service: {
          disable_on_destroy: false,
          service: "compute.googleapis.com",
          depends_on: [
            "google_project_service.cndi_enable_cloudresourcemanager_service",
          ],
        },
      },
      google_compute_instance_group: {
        cndi_cluster: {
          description: "group of instances that form a cndi cluster",
          instances: [],
          name: "cndi-cluster",
          named_port: [
            { name: "http", port: "80" },
            { name: "https", port: "443" },
          ],
          zone: "${local.zone}",
        },
      },
      google_compute_network: {
        cndi_vpc_network: {
          auto_create_subnetworks: false,
          name: "cndi-vpc-network",
          depends_on: ["google_project_service.cndi_enable_compute_service"],
        },
      },
      google_compute_subnetwork: {
        cndi_vpc_subnetwork: {
          ip_cidr_range: "10.0.0.0/16",
          name: "cndi-vpc-network-subnetwork",
          network: "${google_compute_network.cndi_vpc_network.self_link}",
        },
      },
      google_compute_firewall: {
        cndi_allow_external_traffic: {
          allow: [
            { ports: ["22"], protocol: "tcp" },
            { ports: ["80"], protocol: "tcp" },
            { ports: ["443"], protocol: "tcp" },
            { ports: ["30000-33000"], protocol: "tcp" },
          ],
          description: "Security firewall",
          direction: "INGRESS",
          name: "cndi-allow-external-traffic",
          network: "${google_compute_network.cndi_vpc_network.self_link}",
          source_ranges: ["0.0.0.0/0"],
        },
        cndi_allow_internal_traffic: {
          allow: [
            { ports: ["0-65535"], protocol: "tcp" },
            { ports: ["0-65535"], protocol: "udp" },
            { protocol: "icmp" },
          ],
          description:
            "Inbound rule that enables traffic between EC2 instances in the VPC",
          direction: "INGRESS",
          name: "cndi-allow-internal-traffic",
          network: "${google_compute_network.cndi_vpc_network.self_link}",
          source_ranges: [
            "${google_compute_subnetwork.cndi_vpc_subnetwork.ip_cidr_range}",
          ],
        },
      },
      google_compute_router: {
        cndi_router: {
          name: "cndi-router",
          network: "${google_compute_network.cndi_vpc_network.self_link}",
        },
      },
      google_compute_router_nat: {
        cndi_nat: {
          name: "cndi-router-nat",
          nat_ip_allocate_option: "AUTO_ONLY",
          router: "${google_compute_router.cndi_router.name}",
          source_subnetwork_ip_ranges_to_nat: "ALL_SUBNETWORKS_ALL_IP_RANGES",
        },
      },
      google_compute_forwarding_rule: {
        cndi_http_forwarding_rule: {
          backend_service:
            "${google_compute_region_backend_service.cndi_backend_service.self_link}",
          name: "cndi-forwarding-rule",
          network_tier: "STANDARD",
          ports: ["80", "443"],
        },
      },
      google_compute_region_health_check: {
        cndi_healthcheck: {
          check_interval_sec: 1,
          name: "cndi-healthcheck",
          tcp_health_check: [{ port: 80 }],
          timeout_sec: 1,
          depends_on: ["google_project_service.cndi_enable_compute_service"],
        },
      },
      google_compute_region_backend_service: {
        cndi_backend_service: [
          {
            backend: [
              {
                group:
                  "${google_compute_instance_group.cndi_cluster.self_link}",
              },
            ],
            health_checks: [
              "${google_compute_region_health_check.cndi_healthcheck.self_link}",
            ],
            load_balancing_scheme: "EXTERNAL",
            name: "cndi-backend-service",
            port_name: "http",
            protocol: "TCP",
          },
        ],
      },
    },
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
    argo_ui_readonly_password: [
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

export { gcpTerraformRootFileData, terraformRootFileData };
