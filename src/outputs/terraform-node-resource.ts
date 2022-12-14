import {
  brightRed,
  white,
  yellow,
} from "https://deno.land/std@0.157.0/fmt/colors.ts";
import {
  AWSDeploymentTargetConfiguration,
  AWSNodeItemSpec,
  AWSTerraformNodeResource,
  AWSTerraformTargetGroupAttachmentResource,
  BaseNodeItemSpec,
  DeploymentTargetConfiguration,
  GCPDeploymentTargetConfiguration,
  GCPNodeItemSpec,
  GCPTerraformNodeResource,
} from "../types.ts";

import { getPrettyJSONString } from "../utils.ts";
const terraformNodeResourceLabel = white("outputs/terraform-node-resource:");

const getTerraformNodeResource = (
  node: BaseNodeItemSpec,
  deploymentTargetConfiguration: DeploymentTargetConfiguration,
  controllerName: string,
): string => {
  const { kind } = node;
  switch (kind) {
    case "aws":
      return getAWSNodeResource(
        node as AWSNodeItemSpec,
        deploymentTargetConfiguration.aws as AWSDeploymentTargetConfiguration,
        controllerName,
        
      );
    case "gcp":
      return getGCPNodeResource(
        node as GCPNodeItemSpec,
        deploymentTargetConfiguration.aws as GCPDeploymentTargetConfiguration,
        controllerName,
      );

    default:
      console.log(
        terraformNodeResourceLabel,
        brightRed(`node kind: ${white(`"${kind}"`)} not yet supported`),
      );
      Deno.exit(1);
  }
};

const getGCPNodeResource = (
  node: GCPNodeItemSpec,
  deploymentTargetConfiguration: GCPDeploymentTargetConfiguration,
  leaderName: string,
) => {
  const DEFAULT_IMAGE = "ubuntu-2004-focal-v20221121"; // The image from which to initialize this disk
  const DEFAULT_MACHINE_TYPE = "e2-standard-4"; // The machine type to create.
  const { name, role } = node;
  const image = node?.image || deploymentTargetConfiguration?.image ||
    DEFAULT_IMAGE;
  const machine_type = node?.machine_type || node?.instance_type ||
    deploymentTargetConfiguration?.machine_type || DEFAULT_MACHINE_TYPE;
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
      '${templatefile("leader_bootstrap_cndi.sh.tftpl",{ "bootstrap_token": "${local.bootstrap_token}", "git_repo": "${local.git_repo}", "git_password": "${local.git_password}", "git_username": "${local.git_username}", "sealed_secrets_private_key": "${local.sealed_secrets_private_key}", "sealed_secrets_public_key": "${local.sealed_secrets_public_key}", "argo_ui_readonly_password": "${local.argo_ui_readonly_password}" })}';

    const leaderNodeResourceObj = { ...nodeResource };

    leaderNodeResourceObj.resource.google_compute_instance[name]
      .metadata["user-data"] = user_data;

    const leaderNodeResourceString = getPrettyJSONString(leaderNodeResourceObj);

    return leaderNodeResourceString;
  } else {
    // if the role is non-null and also not controller, warn the user and run default
    if (role?.length && role !== "controller") {
      console.log(
        terraformNodeResourceLabel,
        yellow(`node role: ${white(`"${role}"`)} is not supported`),
      );
      console.log(yellow("defaulting node role to"), '"controller"\n');
    }

    const user_data =
      '${templatefile("controller_bootstrap_cndi.sh.tftpl",{"bootstrap_token": "${local.bootstrap_token}", "leader_node_ip": "${local.leader_node_ip}"})}';

    const controllerNodeResourceObj = { ...nodeResource };

    controllerNodeResourceObj.resource.google_compute_instance[name]
      .depends_on = [
        `google_compute_instance.${leaderName}`,
      ];

    controllerNodeResourceObj.resource.google_compute_instance[name]
      .metadata["user-data"] = user_data;

    const controllerNodeResourceString = getPrettyJSONString(
      controllerNodeResourceObj,
    );

    return controllerNodeResourceString;
  }
};

const getAWSNodeResource = (
  node: AWSNodeItemSpec,
  deploymentTargetConfiguration: AWSDeploymentTargetConfiguration,
  leaderName: string,
) => {
  const DEFAULT_AMI = "ami-0c1704bac156af62c";
  const DEFAULT_INSTANCE_TYPE = "t3.medium";
  const { name, role, nodeIndex } = node;
  const ami = node?.ami || deploymentTargetConfiguration?.ami || DEFAULT_AMI;
  const instance_type = node?.instance_type || node?.machine_type ||
    deploymentTargetConfiguration?.instance_type ||
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

  const subnet_id = `\${aws_subnet.subnet[${nodeIndex}].id}`;
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
      '${templatefile("leader_bootstrap_cndi.sh.tftpl",{ "bootstrap_token": "${local.bootstrap_token}", "git_repo": "${local.git_repo}", "git_password": "${local.git_password}", "git_username": "${local.git_username}", "sealed_secrets_private_key": "${local.sealed_secrets_private_key}", "sealed_secrets_public_key": "${local.sealed_secrets_public_key}", "argo_ui_readonly_password": "${local.argo_ui_readonly_password}" })}';

    const leaderNodeResourceObj = { ...nodeResource };

    leaderNodeResourceObj.resource.aws_instance[name][0].user_data = user_data;

    const leaderNodeResourceString = getPrettyJSONString(leaderNodeResourceObj);

    return leaderNodeResourceString;
  } else {
    // if the role is non-null and also not controller, warn the user and run default
    if (role?.length && role !== "controller") {
      console.log(
        terraformNodeResourceLabel,
        yellow(`node role: ${white(`"${role}"`)} is not supported`),
      );
      console.log(yellow("defaulting node role to"), '"controller"\n');
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
