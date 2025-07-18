import { stageFile } from "src/utils.ts";
import { ErrOut } from "errout";
import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { path } from "deps";

// Import shared Terraform blocks
import getLocalsTfJSON from "src/outputs/terraform/shared/locals.tf.json.ts";
import getTerraformTfJSON from "src/outputs/terraform/shared/terraform.ts";
import getProviderTfJSON from "src/outputs/terraform/shared/provider.tf.json.ts";
import getVariableTfJSON from "src/outputs/terraform/shared/variable.tf.json.ts";
import getOutputTfJSON from "src/outputs/terraform/shared/output.tf.json.ts";

// Import Azure MicroK8s resources
import cndi_azurerm_resource_group from "./resource/cndi_azurerm_resource_group.tf.json.ts";
import cndi_azurerm_lb from "./resource/cndi_azurerm_lb.tf.json.ts";
import cndi_azurerm_lb_backend_address_pool from "./resource/cndi_azurerm_lb_backend_address_pool.tf.json.ts";
import cndi_azurerm_public_ip from "./resource/cndi_azurerm_public_ip.tf.json.ts";
import cndi_azurerm_network_security_group from "./resource/cndi_azurerm_network_security_group.tf.json.ts";
import cndi_azurerm_virtual_network from "./resource/cndi_azurerm_virtual_network.tf.json.ts";
import cndi_azurerm_subnet from "./resource/cndi_azurerm_subnet.tf.json.ts";
import cndi_azurerm_network_interface from "./resource/cndi_azurerm_network_interface.tf.json.ts";
import cndi_azurerm_linux_virtual_machine from "./resource/cndi_azurerm_linux_virtual_machine.tf.json.ts";
import cndi_random_password from "./resource/cndi_random_password.tf.json.ts";
import cndi_azurerm_network_interface_backend_address_pool_association from "./resource/cndi_azurerm_network_interface_backend_address_pool_association.tf.json.ts";

export async function stageAzureMicrok8sTerraformFiles(
  cndi_config: NormalizedCNDIConfig,
): Promise<null | ErrOut> {
  // Generate shared Terraform blocks
  const locals = getLocalsTfJSON(cndi_config);
  const terraform = getTerraformTfJSON(cndi_config);
  const provider = getProviderTfJSON(cndi_config);
  const variable = getVariableTfJSON(cndi_config);
  const output = getOutputTfJSON(cndi_config);
  // Stage all files
  await Promise.all([
    // Shared Terraform files
    stageFile(path.join("cndi", "terraform", "locals.tf.json"), locals),
    stageFile(path.join("cndi", "terraform", "output.tf.json"), output),
    stageFile(path.join("cndi", "terraform", "provider.tf.json"), provider),
    stageFile(path.join("cndi", "terraform", "variable.tf.json"), variable),
    stageFile(path.join("cndi", "terraform", "terraform.tf.json"), terraform),

    // Azure MicroK8s resource files
    stageFile(
      path.join("cndi", "terraform", "cndi_azurerm_resource_group.tf.json"),
      cndi_azurerm_resource_group(cndi_config),
    ),
    stageFile(
      path.join("cndi", "terraform", "cndi_azurerm_public_ip.tf.json"),
      cndi_azurerm_public_ip(cndi_config),
    ),
    stageFile(
      path.join("cndi", "terraform", "cndi_azurerm_lb.tf.json"),
      cndi_azurerm_lb(cndi_config),
    ),
    stageFile(
      path.join(
        "cndi",
        "terraform",
        "cndi_azurerm_lb_backend_address_pool.tf.json",
      ),
      cndi_azurerm_lb_backend_address_pool(cndi_config),
    ),
    stageFile(
      path.join(
        "cndi",
        "terraform",
        "cndi_azurerm_network_security_group.tf.json",
      ),
      cndi_azurerm_network_security_group(cndi_config),
    ),
    stageFile(
      path.join("cndi", "terraform", "cndi_azurerm_virtual_network.tf.json"),
      cndi_azurerm_virtual_network(cndi_config),
    ),
    stageFile(
      path.join("cndi", "terraform", "cndi_azurerm_subnet.tf.json"),
      cndi_azurerm_subnet(cndi_config),
    ),
    stageFile(
      path.join("cndi", "terraform", "cndi_azurerm_network_interface.tf.json"),
      cndi_azurerm_network_interface(cndi_config),
    ),
    stageFile(
      path.join(
        "cndi",
        "terraform",
        "cndi_azurerm_linux_virtual_machine.tf.json",
      ),
      cndi_azurerm_linux_virtual_machine(cndi_config),
    ),
    stageFile(
      path.join("cndi", "terraform", "cndi_random_password.tf.json"),
      cndi_random_password(cndi_config),
    ),
    stageFile(
      path.join(
        "cndi",
        "terraform",
        "cndi_azurerm_network_interface_backend_address_pool_association.tf.json",
      ),
      cndi_azurerm_network_interface_backend_address_pool_association(
        cndi_config,
      ),
    ),
  ]);

  return null;
}
