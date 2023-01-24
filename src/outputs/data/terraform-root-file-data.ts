import {
  AzureTerraformRootFileData,
  GCPTerraformRootFileData,
  TerraformRootFileData,
} from "../../types.ts";

const terraformRootFileData: TerraformRootFileData = {
  locals: [
    {
      region: "",
      leader_node_ip: "",
      node_count: "",
      cndi_project_name: "",
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
      aws_ec2_instance_type_offerings: [{}],
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
          tags: {
            Name: "InternetGateway",
            CNDIProject: "${local.cndi_project_name}",
          },
          vpc_id: "${aws_vpc.vpc.id}",
        },
      },
      aws_lb: {
        nlb: {
          internal: false,
          load_balancer_type: "network",
          subnets: "${aws_subnet.subnet[*].id}",
          tags: {
            Name: "NetworkLB",
            CNDIProject: "${local.cndi_project_name}",
          },
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
          tags: {
            Name: "RouteTable",
            CNDIProject: "${local.cndi_project_name}",
          },
          vpc_id: "${aws_vpc.vpc.id}",
        },
      },
      aws_route_table_association: {
        rt_sbn_asso: {
          count: "1",
          route_table_id: "${aws_route_table.rt.id}",
          subnet_id: "${element(aws_subnet.subnet[*].id, count.index)}",
        },
      },
      aws_subnet: {
        subnet: {
          count: "1",
          availability_zone:
            "${element(local.availability_zones, count.index)}",
          cidr_block: "${element(var.sbn_cidr_block, count.index)}",
          map_public_ip_on_launch: "${var.sbn_public_ip}",
          tags: { Name: "Subnet", CNDIProject: "${local.cndi_project_name}" },
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
            tags: {
              Name: "SecurityGroup",
              CNDIProject: "${local.cndi_project_name}",
            },
          },
        ],
      },
      aws_lb_target_group: {
        "tg-http": [
          {
            tags: {
              Name: "HTTPLBTargetGroup",
              CNDIProject: "${local.cndi_project_name}",
            },
            port: "${var.tg_http}",
            protocol: "${var.tg_http_proto}",
            vpc_id: "${aws_vpc.vpc.id}",
          },
        ],
        "tg-https": [
          {
            tags: {
              Name: "HTTPSLBTargetGroup",
              CNDIProject: "${local.cndi_project_name}",
            },
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
            tags: {
              Name: "HTTPSLBListener",
              CNDIProject: "${local.cndi_project_name}",
            },
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
            tags: {
              Name: "HTTPLBListener",
              CNDIProject: "${local.cndi_project_name}",
            },
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
          tags: { Name: "VPC", CNDIProject: "${local.cndi_project_name}" },
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
const azureTerraformRootFileData: AzureTerraformRootFileData = {
  locals: [
    {
      location: "",
      cndi_project_name: "",
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
  resource: [
    {
      azurerm_resource_group: {
        cndi_resource_group: {
          location: "${local.location}",
          name: "${local.cndi_project_name}",
          tags: { cndi_project_name: "${local.cndi_project_name}" },
        },
      },
      azurerm_virtual_network: {
        cndi_virtual_network: {
          address_space: ["10.0.0.0/16"],
          location: "${azurerm_resource_group.cndi_resource_group.location}",
          name: "cndi_virtual_network",
          resource_group_name:
            "${azurerm_resource_group.cndi_resource_group.name}",
          tags: { cndi_project_name: "${local.cndi_project_name}" },
        },
      },
      azurerm_subnet: {
        cndi_subnet: {
          address_prefixes: ["10.0.0.0/24"],
          name: "cndi_subnet",
          resource_group_name:
            "${azurerm_resource_group.cndi_resource_group.name}",
          virtual_network_name:
            "${azurerm_virtual_network.cndi_virtual_network.name}",
        },
      },
      azurerm_subnet_network_security_group_association: {
        cndi_subnet_network_security_group_association: {
          subnet_id: "${azurerm_subnet.cndi_subnet.id}",
          network_security_group_id:
            "${azurerm_network_security_group.cndi_network_security_group.id}",
        },
      },
      azurerm_public_ip: {
        cndi_load_balancer_public_ip: {
          allocation_method: "Static",
          location: "${azurerm_resource_group.cndi_resource_group.location}",
          name: "cndi_load_balancer_public_ip",
          resource_group_name:
            "${azurerm_resource_group.cndi_resource_group.name}",
          sku: "Standard",
          zones: ["1"],
          tags: { cndi_project_name: "${local.cndi_project_name}" },
        },
      },
      azurerm_lb: {
        cndi_load_balancer: {
          frontend_ip_configuration: [
            {
              name: "cndi_load_balancer_public_ip_address",
              public_ip_address_id:
                "${azurerm_public_ip.cndi_load_balancer_public_ip.id}",
            },
          ],
          location: "${azurerm_resource_group.cndi_resource_group.location}",
          name: "cndi_load_balancer",
          resource_group_name:
            "${azurerm_resource_group.cndi_resource_group.name}",
          sku: "Standard",
          sku_tier: "Regional",
          tags: { cndi_project_name: "${local.cndi_project_name}" },
        },
      },
      azurerm_lb_probe: {
        cndi_load_balancer_http_health_probe: {
          loadbalancer_id: "${azurerm_lb.cndi_load_balancer.id}",
          name: "cndi_load_balancer_http_health_probe",
          port: 80,
          protocol: "Tcp",
        },
        cndi_load_balancer_https_health_probe: {
          loadbalancer_id: "${azurerm_lb.cndi_load_balancer.id}",
          name: "cndi_load_balancer_https_health_probe",
          port: 443,
        },
      },
      azurerm_lb_rule: {
        HTTP: [
          {
            backend_address_pool_ids: [
              "${azurerm_lb_backend_address_pool.cndi_load_balancer_address_pool.id}",
            ],
            backend_port: 80,
            frontend_ip_configuration_name:
              "cndi_load_balancer_public_ip_address",
            frontend_port: 80,
            loadbalancer_id: "${azurerm_lb.cndi_load_balancer.id}",
            name: "HTTP",
            probe_id:
              "${azurerm_lb_probe.cndi_load_balancer_http_health_probe.id}",
            protocol: "Tcp",
          },
        ],
        HTTPS: [
          {
            backend_address_pool_ids: [
              "${azurerm_lb_backend_address_pool.cndi_load_balancer_address_pool.id}",
            ],
            backend_port: 443,
            frontend_ip_configuration_name:
              "cndi_load_balancer_public_ip_address",
            frontend_port: 443,
            loadbalancer_id: "${azurerm_lb.cndi_load_balancer.id}",
            name: "HTTPS",
            probe_id:
              "${azurerm_lb_probe.cndi_load_balancer_https_health_probe.id}",
            protocol: "Tcp",
          },
        ],
        SSH: [
          {
            backend_address_pool_ids: [
              "${azurerm_lb_backend_address_pool.cndi_load_balancer_address_pool.id}",
            ],
            backend_port: 22,
            frontend_ip_configuration_name:
              "cndi_load_balancer_public_ip_address",
            frontend_port: 22,
            loadbalancer_id: "${azurerm_lb.cndi_load_balancer.id}",
            name: "SSH",
            protocol: "Tcp",
          },
        ],
      },
      azurerm_lb_backend_address_pool: {
        cndi_load_balancer_address_pool: {
          loadbalancer_id: "${azurerm_lb.cndi_load_balancer.id}",
          name: "cndi_load_balancer_address_pool",
        },
      },
      azurerm_network_security_group: {
        cndi_network_security_group: {
          location: "${azurerm_resource_group.cndi_resource_group.location}",
          name: "cndi_network_security_group",
          resource_group_name:
            "${azurerm_resource_group.cndi_resource_group.name}",
          security_rule: [
            {
              access: "Allow",
              description: "Allow inbound SSH traffic",
              destination_address_prefix: "*",
              destination_address_prefixes: [],
              destination_application_security_group_ids: [],
              destination_port_range: "22",
              destination_port_ranges: [],
              direction: "Inbound",
              name: "AllowSSH",
              priority: 100,
              protocol: "Tcp",
              source_address_prefix: "*",
              source_address_prefixes: [],
              source_application_security_group_ids: [],
              source_port_range: "*",
              source_port_ranges: [],
            },
            {
              access: "Allow",
              description: "Allow inbound for HTTP traffic",
              destination_address_prefix: "*",
              destination_address_prefixes: [],
              destination_application_security_group_ids: [],
              destination_port_range: "80",
              destination_port_ranges: [],
              direction: "Inbound",
              name: "AllowHTTP",
              priority: 150,
              protocol: "Tcp",
              source_address_prefix: "*",
              source_address_prefixes: [],
              source_application_security_group_ids: [],
              source_port_range: "*",
              source_port_ranges: [],
            },
            {
              access: "Allow",
              description: "Allow inbound for HTTPS traffic",
              destination_address_prefix: "*",
              destination_address_prefixes: [],
              destination_application_security_group_ids: [],
              destination_port_range: "443",
              destination_port_ranges: [],
              direction: "Inbound",
              name: "AllowHTTPS",
              priority: 200,
              protocol: "Tcp",
              source_address_prefix: "*",
              source_address_prefixes: [],
              source_application_security_group_ids: [],
              source_port_range: "*",
              source_port_ranges: [],
            },
          ],
          tags: { cndi_project_name: "${local.cndi_project_name}" },
        },
      },
      random_password: {
        generated_token: [{ length: 32, special: false, upper: false }],
      },
    },
  ],
};
export {
  azureTerraformRootFileData,
  gcpTerraformRootFileData,
  terraformRootFileData,
};
