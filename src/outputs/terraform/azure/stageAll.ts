import * as path from "https://deno.land/std@0.172.0/path/mod.ts";
import { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/colors.ts";

import { CNDIConfig } from "src/types.ts";
import { stageFile } from "../../../utils.ts";

import provider from "./provider.tf.json.ts";
import terraform from "./terraform.tf.json.ts";
import cndi_azurerm_network_interface from "./azurerm_network_interface.tf.json.ts"
import cndi_azurerm_network_interface_backend_address_pool_association from "./azurerm_network_interface_backend_address_pool_association.tf.json.ts";
import cndi_azurerm_lb from "./cndi_azurerm_lb.tf.json.ts"
import cndi_azurerm_lb_backend_address_pool from "./cndi_azurerm_lb_backend_address_pool.tf.json.ts";
import cndi_azurerm_lb_probe from "./cndi_azurerm_lb_probe.tf.json.ts";
import cndi_azurerm_lb_rule from "./cndi_azurerm_lb_rule.tf.json.ts";
import cndi_azurerm_network_security_group from "./cndi_azurerm_network_security_group.tf.json.ts";
import cndi_azurerm_public_ip_load_balancer from "./cndi_azurerm_public_ip_load_balancer.tf.json.ts";
import cndi_azurerm_resource_group from "./cndi_azurerm_resource_group.tf.json.ts";
import cndi_azurerm_subnet from "./cndi_azurerm_subnet.tf.json.ts";
import cndi_azurerm_subnet_network_security_group_association from "./cndi_azurerm_subnet_network_security_group_association.tf.json.ts";
import cndi_azurerm_virtual_network from "./cndi_azurerm_virtual_network.tf.json.ts";
import cndi_azurerm_linux_virtual_machine from "./cndi_azurerm_linux_virtual_machine.tf.json.ts";

export default async function stageTerraformResourcesForAWS(
  config: CNDIConfig,
 
) {
  console.log('stageTerraformResourcesForAzure')
  const region = (Deno.env.get("GCP_REGION") as string) || "us-central1";
  

  const stageNodes = config.infrastructure.cndi.nodes.map((node) => {
    return stageFile(
      path.join(
        "cndi",
        "terraform", 
        `${node.name}.azurerm_linux_virtual_machine.tf.json`
      ),
      cndi_azurerm_linux_virtual_machine(node, config)
    );
  });
  const stageNetworkInterface = config.infrastructure.cndi.nodes.map((node) => {
    return stageFile(
      path.join(
        "cndi",
        "terraform", 
        `${node.name}.azurerm_network_interface.tf.json`
      ),
      cndi_azurerm_network_interface(node)
    );
  });
  const stageNetworkInterfaceBackendAddressPoolAssociation = config.infrastructure.cndi.nodes.map((node) => {
    return stageFile(
      path.join(
        "cndi",
        "terraform", 
        `${node.name}.azurerm_network_interface_backend_address_pool_association.tf.json`
      ),
      cndi_azurerm_network_interface_backend_address_pool_association(node)
    );
  });
  // stage all the terraform files at once
  try {
    await Promise.all([
      ...stageNodes,
      ...stageNetworkInterface,
      ...stageNetworkInterfaceBackendAddressPoolAssociation,
      stageFile(
        path.join("cndi", "terraform", "provider.tf.json"),
        provider({
          region,
        })
      ),
      stageFile(
        path.join("cndi", "terraform", "terraform.tf.json"),
        terraform()
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_azurerm_lb.tf.json"
        ),
        cndi_azurerm_lb()
      ), stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_azurerm_lb_backend_address_pool.tf.json"
        ),
        cndi_azurerm_lb_backend_address_pool()
      ), stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_azurerm_lb_probe.tf.json"
        ),
        cndi_azurerm_lb_probe()
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_azurerm_lb_rule.tf.json"
        ),
        cndi_azurerm_lb_rule()
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_azurerm_network_security_group.tf.json"),
        cndi_azurerm_network_security_group()
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_azurerm_public_ip_load_balancer.tf.json"
        ),
        cndi_azurerm_public_ip_load_balancer()
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_azurerm_resource_group.tf.json"
        ),
        cndi_azurerm_resource_group()
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_azurerm_subnet.tf.json"
        ),
        cndi_azurerm_subnet()
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_azurerm_subnet_network_security_group_association.tf.json"),
        cndi_azurerm_subnet_network_security_group_association()
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_security_group.tf.json"
        ),
        cndi_azurerm_virtual_network()
      ),
    ]);
  } catch (e) {
    console.log(colors.brightRed("failed to stage terraform resources\n"));
    console.log(e);
    Deno.exit(1);
  }
}
