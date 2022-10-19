import {BaseNodeEntrySpec, AWSNodeEntrySpec, AWSDeploymentTargetConfiguration, DeploymentTargetConfiguration } from "../types.ts";
import { getPrettyJSONString } from "../utils.ts";

const getTerraformNodeResource = (
  entry: BaseNodeEntrySpec, deploymentTargetConfiguration: DeploymentTargetConfiguration
): string => {
  const {kind} = entry;

  switch (kind) {
    case "aws":
      return getAWSNodeResource(entry as AWSNodeEntrySpec, deploymentTargetConfiguration.aws as AWSDeploymentTargetConfiguration);

    default: throw new Error(`node kind: "${kind}" not yet supported`);
  }
};

const getAWSNodeResource = (entry: AWSNodeEntrySpec, deploymentTargetConfiguration: AWSDeploymentTargetConfiguration) => {
  const DEFAULT_AMI = "ami-0c2b8ca1dad447f8a";
  const DEFAULT_AVAILABILITY_ZONE = "us-east-1a";
  const DEFAULT_INSTANCE_TYPE = "t3.medium";

  const {name, role} = entry;

  const ami = entry?.ami || deploymentTargetConfiguration?.ami || DEFAULT_AMI;
  const availability_zone = entry?.availability_zone || deploymentTargetConfiguration?.availability_zone || DEFAULT_AVAILABILITY_ZONE;
  const instance_type = entry?.instance_type || deploymentTargetConfiguration?.instance_type || DEFAULT_INSTANCE_TYPE;

  const nodeResource = {
    resource: {
      aws_instance: {
        [name]: {
          ami,
          instance_type,
          availability_zone,
          tags: {
            Name: name,
            CNDINodeRole: role,
          },
          user_data: ''
        },
      },
    },
  };

  if (role === "controller") {
    const user_data = `
    \${templatefile("controller_bootstrap.sh.tftpl",
        { bootstrap_token = "\${local.bootstrap_token}"
          repo_url        = "\${local.repo_url}"
          git_password    = "\${local.git_password}"
          git_username    = "\${local.git_username}"
        }
      })
    }
    `.trim();

    const controllerNodeResourceObj = {...nodeResource}

    controllerNodeResourceObj.resource.aws_instance[name].user_data = user_data;

    const controllerNodeResourceString = getPrettyJSONString(controllerNodeResourceObj);

    console.log("nodeResource:", controllerNodeResourceString);
    return controllerNodeResourceString;

  } else if (role === "worker") {

    const user_data = `
    \${templatefile("controller_bootstrap.sh.tftpl",
        { bootstrap_token    = "\${local.bootstrap_token}"
          controller_node_ip = "\${local.repo_url}"
        }
      })
    }
    `.trim();
    const workerNodeResourceObj = {...nodeResource}

    workerNodeResourceObj.resource.aws_instance[name].user_data = user_data;

    const workerNodeResourceString = getPrettyJSONString(workerNodeResourceObj);

    console.log("nodeResource:", workerNodeResourceString);
    return workerNodeResourceString;
  }
  throw new Error(`NodeSpec.role must be "worker" or "controller": \n you entered "${role}"`);
}

export default getTerraformNodeResource;
