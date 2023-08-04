import { ccolors, path } from "deps";

import { CNDIConfig } from "src/types.ts";
import {
  emitExitEvent,
  getLeaderNodeNameFromConfig,
  resolveCNDIPorts,
  stageFile,
} from "src/utils.ts";
import output from "./output.tf.json.ts";
import provider from "./provider.tf.json.ts";
import terraform from "./terraform.tf.json.ts";
import cndi_azurerm_network_interface from "./cndi_azurerm_network_interface.tf.json.ts";
import cndi_azurerm_network_interface_backend_address_pool_association from "./cndi_azurerm_network_interface_backend_address_pool_association.tf.json.ts";
import cndi_azurerm_lb from "./cndi_azurerm_lb.tf.json.ts";
import cndi_azurerm_lb_backend_address_pool from "./cndi_azurerm_lb_backend_address_pool.tf.json.ts";
import cndi_azurerm_lb_rule_port from "./cndi_azurerm_lb_rule_for_port.tf.json.ts";
import cndi_azurerm_lb_probe_port from "./cndi_azurerm_lb_probe_for_port.tf.json.ts";
import cndi_azurerm_network_security_group from "./cndi_azurerm_network_security_group.tf.json.ts";
import cndi_azurerm_public_ip_lb from "./cndi_azurerm_public_ip_lb.tf.json.ts";
import cndi_azurerm_public_ip_node from "./cndi_azurerm_public_ip_node.tf.json.ts";
import cndi_azurerm_resource_group from "./cndi_azurerm_resource_group.tf.json.ts";
import cndi_azurerm_subnet from "./cndi_azurerm_subnet.tf.json.ts";
import cndi_azurerm_subnet_network_security_group_association from "./cndi_azurerm_subnet_network_security_group_association.tf.json.ts";
import cndi_azurerm_virtual_network from "./cndi_azurerm_virtual_network.tf.json.ts";
import cndi_azurerm_linux_virtual_machine from "./cndi_azurerm_linux_virtual_machine.tf.json.ts";
import cndi_azurerm_locals from "./locals.tf.json.ts";
import cndi_outputs from "./cndi_outputs.tf.json.ts";

export default async function stageTerraformResourcesForAzure(
  config: CNDIConfig,
) {
  const azure_location = (Deno.env.get("ARM_REGION") as string) || "eastus";

  const leaderNodeName = await getLeaderNodeNameFromConfig(config);

  const leader_node_ip =
    `\${azurerm_linux_virtual_machine.cndi_azurerm_linux_virtual_machine_${leaderNodeName}.private_ip_address}`;

  const node_id_list: string[] = [];

  const ports = resolveCNDIPorts(config);

  const lbRules = ports.map((port) =>
    stageFile(
      path.join(
        "cndi",
        "terraform",
        `cndi_azurerm_lb_rule_for_port_${port.name}.tf.json`,
      ),
      cndi_azurerm_lb_rule_port(port),
    )
  );

  const lbProbes = ports.map((port) =>
    stageFile(
      path.join(
        "cndi",
        "terraform",
        `cndi_azurerm_lb_probe_for_port_${port.name}.tf.json`,
      ),
      cndi_azurerm_lb_probe_port(port),
    )
  );

  const stageNodes = config.infrastructure.cndi.nodes.map((node) => {
    node_id_list.push(
      `\${azurerm_linux_virtual_machine.cndi_azurerm_linux_virtual_machine_${node.name}.id}`,
    );
    return stageFile(
      path.join(
        "cndi",
        "terraform",
        `cndi_azurerm_linux_virtual_machine_${node.name}.tf.json`,
      ),
      cndi_azurerm_linux_virtual_machine(node, leaderNodeName),
    );
  });

  const stageNetworkInterface = config.infrastructure.cndi.nodes.map((node) =>
    stageFile(
      path.join(
        "cndi",
        "terraform",
        `cndi_azurerm_network_interface_${node.name}.tf.json`,
      ),
      cndi_azurerm_network_interface(node),
    )
  );

  const stageNodePublicIP = config
    .infrastructure.cndi.nodes.map((node) =>
      stageFile(
        path.join(
          "cndi",
          "terraform",
          `cndi_azurerm_public_ip_${node.name}.tf.json`,
        ),
        cndi_azurerm_public_ip_node(node),
      )
    );
  const stageNetworkInterfaceBackendAddressPoolAssociation = config
    .infrastructure.cndi.nodes.map((node) =>
      stageFile(
        path.join(
          "cndi",
          "terraform",
          `cndi_azurerm_network_interface_backend_address_pool_association_${node.name}.tf.json`,
        ),
        cndi_azurerm_network_interface_backend_address_pool_association(node),
      )
    );

  // stage all the terraform files at once
  try {
    await Promise.all([
      ...lbRules,
      ...lbProbes,
      ...stageNodes,
      ...stageNetworkInterface,
      ...stageNetworkInterfaceBackendAddressPoolAssociation,
      ...stageNodePublicIP,
      stageFile(
        path.join("cndi", "terraform", "provider.tf.json"),
        provider(),
      ),
      stageFile(
        path.join("cndi", "terraform", "locals.tf.json"),
        cndi_azurerm_locals({ azure_location, leader_node_ip, node_id_list }),
      ),
      stageFile(
        path.join("cndi", "terraform", "terraform.tf.json"),
        terraform(),
      ),
      stageFile(
        path.join("cndi", "terraform", "output.tf.json"),
        output(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_azurerm_lb.tf.json",
        ),
        cndi_azurerm_lb(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_outputs.tf.json"),
        cndi_outputs(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_azurerm_lb_backend_address_pool.tf.json",
        ),
        cndi_azurerm_lb_backend_address_pool(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_azurerm_network_security_group.tf.json",
        ),
        cndi_azurerm_network_security_group(ports),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_azurerm_public_ip_lb.tf.json",
        ),
        cndi_azurerm_public_ip_lb(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_azurerm_resource_group.tf.json",
        ),
        cndi_azurerm_resource_group(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_azurerm_subnet.tf.json",
        ),
        cndi_azurerm_subnet(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_azurerm_subnet_network_security_group_association.tf.json",
        ),
        cndi_azurerm_subnet_network_security_group_association(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_azurerm_virtual_network.tf.json",
        ),
        cndi_azurerm_virtual_network(),
      ),
    ]);
  } catch (e) {
    console.error(ccolors.error("failed to stage terraform resources"));
    console.log(ccolors.caught(e, 801));
    await emitExitEvent(801);
    Deno.exit(801);
  }
}
