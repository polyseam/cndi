import { ccolors } from "deps";

import { CNDIConfig } from "src/types.ts";
import { emitExitEvent } from "src/utils.ts";

import { synth as synthAWSMicrok8sStack } from "../aws/AWSMicrok8sStack.ts";

export default async function stageTerraformResourcesForAWS(
  config: CNDIConfig,
) {
  try {
    await synthAWSMicrok8sStack(config);

    // const leaderNodeName = await getLeaderNodeNameFromConfig(config);
    // const leader_node_ip =
    //   `\${aws_instance.cndi_aws_instance_${leaderNodeName}.private_ip}`;

    // const awsEC2Nodes = config.infrastructure.cndi.nodes as Array<
    //   AWSEC2NodeItemSpec
    // >;

    // const node_id_list: string[] = [];

    // const ports = resolveCNDIPorts(config);

    // const listeners = ports.map((port) => {
    //   return stageFile(
    //     path.join(
    //       "cndi",
    //       "terraform",
    //       `cndi_aws_lb_listener_for_port_${port.name}.tf.json`,
    //     ),
    //     cndi_aws_lb_listener_for_port(port),
    //   );
    // });

    // const targetGroups = ports.map((port) => {
    //   return stageFile(
    //     path.join(
    //       "cndi",
    //       "terraform",
    //       `cndi_aws_lb_target_group_for_port_${port.name}.tf.json`,
    //     ),
    //     cndi_aws_lb_target_group_for_port(port),
    //   );
    // });

    // const targetGroupAttachments = awsEC2Nodes.flatMap((node) => { // TODO: what even is this
    //   return ports.map((port) => {
    //     return stageFile(
    //       path.join(
    //         "cndi",
    //         "terraform",
    //         `cndi_aws_lb_target_group_attachment_for_port_${port.name}_${node.name}.tf.json`,
    //       ),
    //       cndi_aws_lb_target_group_attachment_for_port(node, port),
    //     );
    //   });
    // });

    // const stageNodes = awsEC2Nodes.map((node) => {
    //   node_id_list.push(`\${aws_instance.cndi_aws_instance_${node.name}.id}`);
    //   return stageFile(
    //     path.join(
    //       "cndi",
    //       "terraform",
    //       `cndi_aws_instance_${node.name}.tf.json`,
    //     ),
    //     cndi_aws_instance(node, leaderNodeName),
    //   );
    // });

    // stage all the terraform files at once
    // try {

    //   await Promise.all([
    //     ...stageNodes,
    //     ...listeners,
    //     ...targetGroups,
    //     ...targetGroupAttachments,
    //     stageFile(
    //       path.join("cndi", "terraform", "cndi_aws_resourcegroups_group.tf.json"),
    //       cndi_aws_resourcegroups_group(project_name),
    //     ),
    //     stageFile(
    //       path.join("cndi", "terraform", "data.tf.json"),
    //       data(awsEC2Nodes),
    //     ),
    //     stageFile(
    //       path.join("cndi", "terraform", "locals.tf.json"),
    //       cndi_aws_locals({
    //         node_id_list,
    //         leader_node_ip,
    //         aws_region,
    //         nodes: awsEC2Nodes,
    //       }),
    //     ),
    //     stageFile(
    //       path.join("cndi", "terraform", "provider.tf.json"),
    //       provider(),
    //     ),
    //     stageFile(
    //       path.join("cndi", "terraform", "terraform.tf.json"),
    //       terraform(),
    //     ),
    //     stageFile(
    //       path.join("cndi", "terraform", "cndi_outputs.tf.json"),
    //       cndi_outputs(),
    //     ),
    //     stageFile(
    //       path.join(
    //         "cndi",
    //         "terraform",
    //         "cndi_aws_internet_gateway.tf.json",
    //       ),
    //       cndi_aws_internet_gateway(),
    //     ),
    //     stageFile(
    //       path.join(
    //         "cndi",
    //         "terraform",
    //         "cndi_aws_lb.tf.json",
    //       ),
    //       cndi_aws_lb(),
    //     ),
    //     stageFile(
    //       path.join(
    //         "cndi",
    //         "terraform",
    //         "cndi_aws_route_table_association.tf.json",
    //       ),
    //       cndi_aws_route_table_association(),
    //     ),
    //     stageFile(
    //       path.join(
    //         "cndi",
    //         "terraform",
    //         "cndi_aws_route_table.tf.json",
    //       ),
    //       cndi_aws_route_table(),
    //     ),
    //     stageFile(
    //       path.join("cndi", "terraform", "cndi_aws_route.tf.json"),
    //       cndi_aws_route(),
    //     ),
    //     stageFile(
    //       path.join(
    //         "cndi",
    //         "terraform",
    //         "cndi_aws_security_group.tf.json",
    //       ),
    //       cndi_aws_security_group(ports),
    //     ),
    //     stageFile(
    //       path.join("cndi", "terraform", "cndi_aws_subnet.tf.json"),
    //       cndi_aws_subnet(),
    //     ),
    //     stageFile(
    //       path.join(
    //         "cndi",
    //         "terraform",
    //         "cndi_aws_vpc.tf.json",
    //       ),
    //       cndi_aws_vpc(),
    //     ),
    //   ]);
  } catch (e) {
    console.error(ccolors.error("failed to stage terraform resources"));
    console.log(ccolors.caught(e, 800));
    await emitExitEvent(800);
    Deno.exit(800);
  }
}
