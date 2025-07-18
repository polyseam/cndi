import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { path } from "deps";
import { stageFile } from "src/utils.ts";
import { ErrOut } from "errout";
import { getPrettyJSONString } from "src/utils.ts";

// Import shared Terraform blocks
import getLocalsTfJSON from "src/outputs/terraform/shared/locals.tf.json.ts";
import getTerraformTfJSON from "src/outputs/terraform/shared/terraform.ts";
import getProviderTfJSON from "src/outputs/terraform/shared/provider.tf.json.ts";
import getVariableTfJSON from "src/outputs/terraform/shared/variable.tf.json.ts";
import getOutputTfJSON from "src/outputs/terraform/shared/output.tf.json.ts";

// Import Microk8s-specific components
import getDataTfJSON from "./data.tf.json.ts";
import getCndiAWSVPCModuleTfJSON from "./module/cndi_aws_vpc_module.tf.json.ts";
import getCndiAWSInstanceTfJSON from "./resource/cndi_aws_instance.tf.json.ts";
import getCndiAWSKeyPairTfJSON from "./resource/cndi_aws_key_pair.tf.json.ts";
import getCndiAWSSecurityGroupTfJSON from "./resource/cndi_aws_security_group.tf.json.ts";
import getCndiAWSLBTfJSON from "./resource/cndi_aws_lb.tf.json.ts";
import getCndiAWSLBTargetGroupTfJSON from "./resource/cndi_aws_lb_target_group.tf.json.ts";
import getCndiAWSLBListenerTfJSON from "./resource/cndi_aws_lb_listener.tf.json.ts";

function getMicrok8sOutputsTfJSON(_cndi_config: NormalizedCNDIConfig) {
  return getPrettyJSONString({
    output: {
      public_host: {
        value: "${aws_lb.cndi_aws_lb.dns_name}",
      },
      resource_group_url: {
        value:
          "https://${local.aws_region}.console.aws.amazon.com/resource-groups/group/cndi-rg_${local.cndi_project_name}",
      },
      get_kubeconfig_command: {
        value:
          "ssh -i 'cndi_rsa' ubuntu@${aws_instance.cndi_aws_instance_${cndi_config.infrastructure.cndi.nodes[0].name}-0.public_dns} -t 'sudo microk8s config'",
      },
    },
  });
}

export async function stageAWSMicrok8sTerraformFiles(
  cndi_config: NormalizedCNDIConfig,
): Promise<null | ErrOut> {
  const data = getDataTfJSON(cndi_config);
  const locals = getLocalsTfJSON(cndi_config);
  const terraform = getTerraformTfJSON(cndi_config);
  const provider = getProviderTfJSON(cndi_config);
  const variable = getVariableTfJSON(cndi_config);
  const output = getOutputTfJSON(cndi_config);
  const microk8s_outputs = getMicrok8sOutputsTfJSON(cndi_config);

  // Get Microk8s-specific resources
  const cndi_aws_vpc_module = getCndiAWSVPCModuleTfJSON(cndi_config);
  const cndi_aws_instance = getCndiAWSInstanceTfJSON(cndi_config);
  const cndi_aws_key_pair = getCndiAWSKeyPairTfJSON(cndi_config);
  const cndi_aws_security_group = getCndiAWSSecurityGroupTfJSON(cndi_config);
  const cndi_aws_lb = getCndiAWSLBTfJSON(cndi_config);
  const cndi_aws_lb_target_group = getCndiAWSLBTargetGroupTfJSON(cndi_config);
  const cndi_aws_lb_listener = getCndiAWSLBListenerTfJSON(cndi_config);

  await Promise.all([
    stageFile(path.join("cndi", "terraform", "data.tf.json"), data),
    stageFile(path.join("cndi", "terraform", "locals.tf.json"), locals),
    stageFile(path.join("cndi", "terraform", "terraform.tf.json"), terraform),
    stageFile(path.join("cndi", "terraform", "provider.tf.json"), provider),
    stageFile(path.join("cndi", "terraform", "variable.tf.json"), variable),
    stageFile(path.join("cndi", "terraform", "output.tf.json"), output),
    stageFile(
      path.join("cndi", "terraform", "microk8s_outputs.tf.json"),
      microk8s_outputs,
    ),
    // Stage Microk8s-specific resources
    stageFile(
      path.join("cndi", "terraform", "cndi_aws_vpc_module.tf.json"),
      cndi_aws_vpc_module,
    ),
    stageFile(
      path.join("cndi", "terraform", "cndi_aws_instance.tf.json"),
      cndi_aws_instance,
    ),
    stageFile(
      path.join("cndi", "terraform", "cndi_aws_key_pair.tf.json"),
      cndi_aws_key_pair,
    ),
    stageFile(
      path.join("cndi", "terraform", "cndi_aws_security_group.tf.json"),
      cndi_aws_security_group,
    ),
    stageFile(
      path.join("cndi", "terraform", "cndi_aws_lb.tf.json"),
      cndi_aws_lb,
    ),
    stageFile(
      path.join("cndi", "terraform", "cndi_aws_lb_target_group.tf.json"),
      cndi_aws_lb_target_group,
    ),
    stageFile(
      path.join("cndi", "terraform", "cndi_aws_lb_listener.tf.json"),
      cndi_aws_lb_listener,
    ),
  ]);

  return null;
}
