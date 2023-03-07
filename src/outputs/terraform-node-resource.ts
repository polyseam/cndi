import { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/colors.ts";
import {
  AWSDeploymentTargetConfiguration,
  AWSNodeItemSpec,
  AWSTerraformNodeResource,
  AWSTerraformTargetGroupAttachmentResource,
  AzureDeploymentTargetConfiguration,
  AzureNodeItemSpec,
  AzureTerraformNodeResource,
  BaseNodeItemSpec,
  DeploymentTargetConfiguration,
  GCPDeploymentTargetConfiguration,
  GCPNodeItemSpec,
  GCPTerraformNodeResource,
  NodeRole,
} from "../types.ts";

import { getPrettyJSONString } from "../utils.ts";
const terraformNodeResourceLabel = colors.white(
  "\nsrc/outputs/terraform-node-resource:",
);

const getTerraformNodeResource = (
  node: BaseNodeItemSpec,
  deployment_target_configuration: DeploymentTargetConfiguration,
  controllerName: string,
): string => {
  const { kind } = node;

  switch (kind) {
    case "aws":
      return getAWSNodeResource(
        node as AWSNodeItemSpec,
        deployment_target_configuration.aws as AWSDeploymentTargetConfiguration,
        controllerName,
      );

    case "gcp":
      return getGCPNodeResource(
        node as GCPNodeItemSpec,
        deployment_target_configuration.gcp as GCPDeploymentTargetConfiguration,
        controllerName,
      );
    case "azure":
      return getAzureNodeResource(
        node as AzureNodeItemSpec,
        deployment_target_configuration
          .azure as AzureDeploymentTargetConfiguration,
        controllerName,
      );

    default:
      console.log(
        terraformNodeResourceLabel,
        colors.brightRed(
          `node kind: ${colors.white(`"${kind}"`)} not yet supported`,
        ),
      );
      Deno.exit(1);
  }
};

const getAzureNodeResource = (
  node: AzureNodeItemSpec,
  deployment_target_configuration: AzureDeploymentTargetConfiguration,
  leaderName: string,
) => {
  const { name, role } = node;
  const DEFAULT_IMAGE = "0001-com-ubuntu-server-focal"; // The image from which to initialize this disk
  const DEFAULT_MACHINE_TYPE = "Standard_DC2s_v2"; // The machine type to create.Standard_DC2s_v2 has 2cpu and 8g of ram
  const DEFAULT_SIZE = 130; // The size of the image in gigabytes\

  const image = node?.image || deployment_target_configuration?.image ||
    DEFAULT_IMAGE;

  let machine_type = node?.machine_type ||
    node?.instance_type ||
    DEFAULT_MACHINE_TYPE;

  let disk_size_gb = node?.disk_size_gb || node?.volume_size || DEFAULT_SIZE;

  if (node?.size && typeof node.size === "string") {
    machine_type = node.size;
  }

  if (node?.size && typeof node.size === "number") {
    disk_size_gb = node.size;
  }

  deployment_target_configuration?.machine_type || DEFAULT_MACHINE_TYPE;

  const resource_group_name =
    "${azurerm_resource_group.cndi_resource_group.name}";

  const location = "${azurerm_resource_group.cndi_resource_group.location}";

  const admin_username = "ubuntu";
  const admin_password = "Password123";
  const disable_password_authentication = false;

  const network_interface_ids = [
    `\${azurerm_network_interface.cndi_${name}_network_interface.id}`,
  ];

  const zone = "1";

  const os_disk = [
    {
      name: `cndi_${name}_disk`,
      caching: "ReadWrite",
      storage_account_type: "StandardSSD_LRS",
      disk_size_gb,
    },
  ];

  const source_image_reference = [
    {
      publisher: "canonical",
      offer: image,
      sku: "20_04-lts-gen2",
      version: "latest",
    },
  ];

  const tags = {
    cndi_project_name: "${local.cndi_project_name}",
  };

  const azurerm_network_interface_backend_address_pool_association = {
    [`cndi_${name}_load_balancer_address_pool_association`]: {
      backend_address_pool_id:
        "${azurerm_lb_backend_address_pool.cndi_load_balancer_address_pool.id}",
      ip_configuration_name: `cndi_${name}_network_interface_ip_config`,
      network_interface_id:
        `\${azurerm_network_interface.cndi_${name}_network_interface.id}`,
    },
  };

  const azurerm_network_interface = {
    [`cndi_${name}_network_interface`]: {
      ip_configuration: [
        {
          name: `cndi_${name}_network_interface_ip_config`,
          private_ip_address_allocation: "Dynamic",
          subnet_id: "${azurerm_subnet.cndi_subnet.id}",
        },
      ],
      location: "${azurerm_resource_group.cndi_resource_group.location}",
      name: `cndi_${name}_network_interface`,
      resource_group_name: "${azurerm_resource_group.cndi_resource_group.name}",
      tags: { cndi_project_name: "${local.cndi_project_name}" },
    },
  };

  const nodeResource: AzureTerraformNodeResource = {
    resource: {
      azurerm_linux_virtual_machine: {
        [name]: {
          admin_username,
          admin_password,
          disable_password_authentication,
          zone,
          location,
          name,
          network_interface_ids,
          os_disk,
          resource_group_name,
          size: machine_type,
          source_image_reference,
          tags,
        },
      },
      azurerm_network_interface_backend_address_pool_association,
      azurerm_network_interface,
    },
  };

  if (role === "leader") {
    const user_data =
      '${base64encode(templatefile("leader_bootstrap_cndi.sh.tftpl",{ "bootstrap_token": "${local.bootstrap_token}", "git_repo": "${local.git_repo}", "git_password": "${local.git_password}", "git_username": "${local.git_username}", "sealed_secrets_private_key": "${local.sealed_secrets_private_key}", "sealed_secrets_public_key": "${local.sealed_secrets_public_key}", "argo_ui_admin_password": "${local.argo_ui_admin_password}" }))}';

    const leaderNodeResourceObj = { ...nodeResource };

    leaderNodeResourceObj.resource.azurerm_linux_virtual_machine[
      name
    ].user_data = user_data;

    const leaderNodeResourceString = getPrettyJSONString(leaderNodeResourceObj);

    return leaderNodeResourceString;
  } else {
    // if the role is non-null and also not controller, warn the user and run default
    if (role?.length && role !== "controller") {
      console.log(
        terraformNodeResourceLabel,
        colors.yellow(
          `node role: ${colors.white(`"${role}"`)} is not supported`,
        ),
      );
      console.log(colors.yellow("defaulting node role to"), '"controller"\n');
    }

    const user_data =
      '${base64encode(templatefile("controller_bootstrap_cndi.sh.tftpl",{"bootstrap_token": "${local.bootstrap_token}", "leader_node_ip": "${local.leader_node_ip}"}))}';

    const controllerNodeResourceObj = { ...nodeResource };
    controllerNodeResourceObj.resource.azurerm_linux_virtual_machine[
      name
    ].depends_on = [`azurerm_linux_virtual_machine.${leaderName}`];

    controllerNodeResourceObj.resource.azurerm_linux_virtual_machine[
      name
    ].user_data = user_data;

    const controllerNodeResourceString = getPrettyJSONString(
      controllerNodeResourceObj,
    );

    return controllerNodeResourceString;
  }
};
const getGCPNodeResource = (
  node: GCPNodeItemSpec,
  deployment_target_configuration: GCPDeploymentTargetConfiguration,
  leaderName: string,
) => {
  const DEFAULT_IMAGE = "ubuntu-2004-focal-v20221121"; // The image from which to initialize this disk
  const DEFAULT_MACHINE_TYPE = "n2-standard-2"; // The machine type to create.
  const { name, role } = node;
  const image = node?.image || deployment_target_configuration?.image ||
    DEFAULT_IMAGE;
  const machine_type = node?.machine_type ||
    node?.instance_type ||
    deployment_target_configuration?.machine_type ||
    DEFAULT_MACHINE_TYPE;
  const allow_stopping_for_update = true; // If true, allows Terraform to stop the instance to update its properties.
  const DEFAULT_SIZE = 100; // The size of the image in gigabytes
  const size = node?.size || node?.volume_size || DEFAULT_SIZE;
  const type = "pd-ssd"; //  The GCE disk type. Such as pd-standard, pd-balanced or pd-ssd.
  const network_tier = "STANDARD";
  const network = "${google_compute_network.cndi_vpc_network.self_link}"; //The name of the network to attach this interface to.
  const subnetwork =
    "${google_compute_subnetwork.cndi_vpc_subnetwork.self_link}"; //The name or self_link of the subnetwork to attach this interface to.
  const access_config = [{ network_tier }]; //Access config that set whether the instance can be accessed via the Internet. Omitting = not accessible from the Internet.
  const source = `\${google_compute_disk.${name}-cndi-disk.self_link}`;
  const boot_disk = [
    {
      source,
    },
  ];

  const network_interface = [
    {
      access_config,
      network,
      subnetwork,
    },
  ];

  const google_compute_disk = {
    [`${name}-cndi-disk`]: {
      name: `${name}-cndi-disk`,
      image,
      size,
      type,
      depends_on: ["google_project_service.cndi_enable_compute_service"],
    },
  };

  const nodeResource: GCPTerraformNodeResource = {
    resource: {
      google_compute_instance: {
        [name]: {
          allow_stopping_for_update,
          boot_disk,
          depends_on: [],
          machine_type,
          metadata: {},
          name: name,
          network_interface,
          tags: [name],
        },
      },
      google_compute_disk,
    },
  };

  if (role === "leader") {
    const user_data =
      '${templatefile("leader_bootstrap_cndi.sh.tftpl",{ "bootstrap_token": "${local.bootstrap_token}", "git_repo": "${local.git_repo}", "git_password": "${local.git_password}", "git_username": "${local.git_username}", "sealed_secrets_private_key": "${local.sealed_secrets_private_key}", "sealed_secrets_public_key": "${local.sealed_secrets_public_key}", "argo_ui_admin_password": "${local.argo_ui_admin_password}" })}';

    const leaderNodeResourceObj = { ...nodeResource };

    leaderNodeResourceObj.resource.google_compute_instance[name].metadata[
      "user-data"
    ] = user_data;

    const leaderNodeResourceString = getPrettyJSONString(leaderNodeResourceObj);

    return leaderNodeResourceString;
  } else {
    // if the role is non-null and also not controller, warn the user and run default
    if (role?.length && role !== "controller") {
      console.log(
        terraformNodeResourceLabel,
        colors.yellow(
          `node role: ${colors.white(`"${role}"`)} is not supported`,
        ),
      );
      console.log(colors.yellow("defaulting node role to"), '"controller"\n');
    }

    const user_data =
      '${templatefile("controller_bootstrap_cndi.sh.tftpl",{"bootstrap_token": "${local.bootstrap_token}", "leader_node_ip": "${local.leader_node_ip}"})}';

    const controllerNodeResourceObj = { ...nodeResource };

    controllerNodeResourceObj.resource.google_compute_instance[
      name
    ].depends_on = [`google_compute_instance.${leaderName}`];

    controllerNodeResourceObj.resource.google_compute_instance[name].metadata[
      "user-data"
    ] = user_data;

    const controllerNodeResourceString = getPrettyJSONString(
      controllerNodeResourceObj,
    );

    return controllerNodeResourceString;
  }
};

const getAWSNodeResource = (
  node: AWSNodeItemSpec,
  deployment_target_configuration: AWSDeploymentTargetConfiguration,
  leaderName: string,
) => {
  const DEFAULT_AMI = "ami-0c1704bac156af62c";
  const DEFAULT_INSTANCE_TYPE = "m5a.large";
  const { name } = node;
  const role = node.role as NodeRole;
  const ami = node?.ami || deployment_target_configuration?.ami || DEFAULT_AMI;
  const instance_type = node?.instance_type ||
    node?.machine_type ||
    deployment_target_configuration?.instance_type ||
    DEFAULT_INSTANCE_TYPE;

  const DEFAULT_VOLUME_SIZE = 100;
  const delete_on_termination = false; // TODO: prove this is good
  const device_name = "/dev/sda1";
  const volume_size = node?.volume_size || node?.size || DEFAULT_VOLUME_SIZE; //GiB
  const volume_type = "gp3"; // general purpose SSD

  // TODO: expose to user in cndi-config.jsonc["nodes"]["entries"][kind==="aws"]
  const ebs_block_device = [
    {
      device_name,
      volume_size,
      volume_type,
      delete_on_termination,
    },
  ];

  const subnet_id = `\${aws_subnet.subnet[0].id}`;
  const vpc_security_group_ids = ["${aws_security_group.sg.id}"];
  const target_group_arn_https = "${aws_lb_target_group.tg-https.arn}";
  const target_group_arn_http = "${aws_lb_target_group.tg-http.arn}";
  const target_id = `\${aws_instance.${name}.id}`;
  const aws_lb_target_group_attachment:
    AWSTerraformTargetGroupAttachmentResource = {
      [`tg-https-target-${name}`]: [
        {
          target_group_arn: target_group_arn_https,
          target_id,
        },
      ],
      [`tg-http-target-${name}`]: [
        {
          target_group_arn: target_group_arn_http,
          target_id,
        },
      ],
    };

  const nodeResource: AWSTerraformNodeResource = {
    resource: {
      aws_instance: {
        [name]: [
          {
            ami,
            instance_type,
            tags: {
              Name: name,
              CNDIProject: "${local.cndi_project_name}",
              CNDINodeRole: role,
            },
            ebs_block_device,
            subnet_id,
            vpc_security_group_ids,
          },
        ],
      },
      aws_lb_target_group_attachment,
    },
  };

  if (role === "leader") {
    const user_data =
      '${templatefile("leader_bootstrap_cndi.sh.tftpl",{ "bootstrap_token": "${local.bootstrap_token}", "git_repo": "${local.git_repo}", "git_password": "${local.git_password}", "git_username": "${local.git_username}", "sealed_secrets_private_key": "${local.sealed_secrets_private_key}", "sealed_secrets_public_key": "${local.sealed_secrets_public_key}", "argo_ui_admin_password": "${local.argo_ui_admin_password}" })}';

    const leaderNodeResourceObj = { ...nodeResource };

    leaderNodeResourceObj.resource.aws_instance[name][0].user_data = user_data;

    const leaderNodeResourceString = getPrettyJSONString(leaderNodeResourceObj);

    return leaderNodeResourceString;
  } else {
    // if the role is non-null and also not controller, warn the user and run default
    if (role?.length && role !== "controller") {
      console.log(
        terraformNodeResourceLabel,
        colors.yellow(
          `node role: ${colors.white(`"${role}"`)} is not supported`,
        ),
      );
      console.log(colors.yellow("defaulting node role to"), '"controller"\n');
    }

    const user_data =
      '${templatefile("controller_bootstrap_cndi.sh.tftpl",{"bootstrap_token": "${local.bootstrap_token}", "leader_node_ip": "${local.leader_node_ip}"})}';

    const controllerNodeResourceObj = { ...nodeResource };

    controllerNodeResourceObj.resource.aws_instance[name][0].depends_on = [
      `aws_instance.${leaderName}`,
    ];

    controllerNodeResourceObj.resource.aws_instance[name][0].user_data =
      user_data;

    const controllerNodeResourceString = getPrettyJSONString(
      controllerNodeResourceObj,
    );

    return controllerNodeResourceString;
  }
};

export default getTerraformNodeResource;
