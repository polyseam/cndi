import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { ccolors, path } from "deps";
import { ErrOut } from "errout";

import { stageFile, useSshRepoAuth } from "src/utils.ts";

const _label = ccolors.faded(
  "\nsrc/outputs/terraform/dev/microk8s/stage.ts:",
);

// Shared Terraform Blocks
import getLocalsTfJSON from "src/outputs/terraform/shared/locals.tf.json.ts";
import getTerraformTfJSON from "src/outputs/terraform/shared/terraform.ts";
import getProviderTfJSON from "src/outputs/terraform/shared/provider.tf.json.ts";
import getVariableTfJSON from "src/outputs/terraform/shared/variable.tf.json.ts";
import getOutputTfJSON from "src/outputs/terraform/shared/output.tf.json.ts";

// Shared Kubernetes Terraform Resources
import cndi_time_static_argocd_admin_password from "src/outputs/terraform/shared/resource/cndi_time_static_argocd_admin_password.tf.json.ts";

// Microk8s Dev Terraform Resources
import cndi_multipass_instance from "src/outputs/terraform/dev/microk8s/resource/cndi_multipass_instance.tf.json.ts";
import cndi_random_password_join_token from "./resource/cndi_random_password_join_token.tf.json.ts";

import cndi_local_sensitive_file_microk8s_leader_cloud_init from "src/outputs/terraform/dev/microk8s/resource/cndi_local_sensitive_file.tf.json.ts";
import cndi_local_sensitive_file_microk8s_leader_cloud_init_template from "src/outputs/terraform/dev/microk8s/templatefiles/cndi_local_sensitive_file_microk8s_leader_cloud_init.template.yml.tftpl.ts";

export default async function stageDevMicrok8sTerraformFiles(
  cndi_config: NormalizedCNDIConfig,
): Promise<null | ErrOut> {
  const locals = getLocalsTfJSON(cndi_config);
  const terraform = getTerraformTfJSON(cndi_config);
  const provider = getProviderTfJSON(cndi_config);
  const variable = getVariableTfJSON(cndi_config);
  const output = getOutputTfJSON(cndi_config);

  await Promise.all([
    stageFile(path.join("cndi", "terraform", "locals.tf.json"), locals),
    stageFile(path.join("cndi", "terraform", "output.tf.json"), output),
    stageFile(path.join("cndi", "terraform", "provider.tf.json"), provider),
    stageFile(path.join("cndi", "terraform", "variable.tf.json"), variable),
    stageFile(path.join("cndi", "terraform", "terraform.tf.json"), terraform),
    stageFile(
      path.join("cndi", "terraform", "cndi_random_password_join_token.tf.json"),
      cndi_random_password_join_token(cndi_config),
    ),
    stageFile(
      path.join(
        "cndi",
        "terraform",
        "cndi_local_sensitive_file_microk8s_leader_cloud_init.template.yml.tftpl",
      ),
      cndi_local_sensitive_file_microk8s_leader_cloud_init_template(
        cndi_config,
        {
          useSshRepoAuth: useSshRepoAuth(),
          useClusterHA: false,
        },
      ),
    ),
    stageFile(
      path.join("cndi", "terraform", "cndi_local_sensitive_file.tf.json"),
      cndi_local_sensitive_file_microk8s_leader_cloud_init(cndi_config),
    ),
    stageFile(
      path.join("cndi", "terraform", "cndi_multipass_instance.tf.json"),
      cndi_multipass_instance(cndi_config),
    ),
    stageFile(
      path.join(
        "cndi",
        "terraform",
        "cndi_time_static_argocd_admin_password.tf.json",
      ),
      cndi_time_static_argocd_admin_password(cndi_config),
    ),
  ]);

  return null;
}
