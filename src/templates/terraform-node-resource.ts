import {BaseNodeEntrySpec, AWSNodeEntrySpec, AWSDeploymentTargetConfiguration, DeploymentTargetConfiguration, AWSTerraformNodeResource } from "../types.ts";
import { getPrettyJSONString } from "../utils.ts";

const getTerraformNodeResource = (
  entry: BaseNodeEntrySpec, deploymentTargetConfiguration: DeploymentTargetConfiguration, controllerName: string
): string => {
  const {kind} = entry;

  switch (kind) {
    case "aws":
      return getAWSNodeResource(entry as AWSNodeEntrySpec, deploymentTargetConfiguration.aws as AWSDeploymentTargetConfiguration, controllerName);

    default: throw new Error(`node kind: "${kind}" not yet supported`);
  }
};

const getAWSNodeResource = (entry: AWSNodeEntrySpec, deploymentTargetConfiguration: AWSDeploymentTargetConfiguration, controllerName:string) => {
  const DEFAULT_AMI = "ami-0c1704bac156af62c";
  const DEFAULT_AVAILABILITY_ZONE = "us-east-1a";
  const DEFAULT_INSTANCE_TYPE = "t3.medium";

  const {name, role} = entry;

  const ami = entry?.ami || deploymentTargetConfiguration?.ami || DEFAULT_AMI;
  const availability_zone = entry?.availability_zone || deploymentTargetConfiguration?.availability_zone || DEFAULT_AVAILABILITY_ZONE;
  const instance_type = entry?.instance_type || deploymentTargetConfiguration?.instance_type || DEFAULT_INSTANCE_TYPE;

  const nodeResource: AWSTerraformNodeResource = {
    resource: {
      aws_instance: {
        [name]: [{
          ami,
          instance_type,
          availability_zone,
          tags: {
            Name: name,
            CNDINodeRole: role,
          },
        }],
      },
    },
  };
  

  if (role === "controller") {
    const user_data = "${templatefile(\"controller_bootstrap_cndi.sh.tftpl\",{ \"bootstrap_token\": \"${local.bootstrap_token}\", \"git_repo\": \"${local.git_repo}\", \"git_password\": \"${local.git_password}\", \"git_username\": \"${local.git_username}\"})}"

    const controllerNodeResourceObj = {...nodeResource}

    controllerNodeResourceObj.resource.aws_instance[name][0].user_data = user_data;

    const controllerNodeResourceString = getPrettyJSONString(controllerNodeResourceObj);

    console.log("nodeResource:", controllerNodeResourceString);
    return controllerNodeResourceString;

  } else if (role === "worker") {

    const user_data = "${templatefile(\"worker_bootstrap_cndi.sh.tftpl\",{\"bootstrap_token\": \"${local.bootstrap_token}\", \"controller_node_ip\": \"${local.controller_node_ip}\"})}"
    const workerNodeResourceObj = {...nodeResource}

    workerNodeResourceObj.resource.aws_instance[name][0].depends_on = [`aws_instance.${controllerName}`];
    workerNodeResourceObj.resource.aws_instance[name][0].user_data = user_data;

    const workerNodeResourceString = getPrettyJSONString(workerNodeResourceObj);

    console.log("nodeResource:", workerNodeResourceString);
    return workerNodeResourceString;
  }
  throw new Error(`NodeSpec.role must be "worker" or "controller": \n you entered "${role}"`);
}

export default getTerraformNodeResource;
