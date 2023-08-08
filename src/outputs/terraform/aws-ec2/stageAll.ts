import { ccolors, path } from "deps";

import { AWSEC2NodeItemSpec, CNDIConfig } from "src/types.ts";
import {
  emitExitEvent,
  getLeaderNodeNameFromConfig,
  resolveCNDIPorts,
  stageFile,
} from "src/utils.ts";

import data from "./data.tf.json.ts";
import provider from "./provider.tf.json.ts";
import terraform from "./terraform.tf.json.ts";
import cndi_aws_instance from "./cndi_aws_instance.tf.json.ts";
import cndi_aws_internet_gateway from "./cndi_aws_internet_gateway.tf.json.ts";
import cndi_aws_lb_target_group_attachment_for_port from "./cndi_aws_lb_target_group_attachment_for_port.tf.json.ts";
import cndi_aws_lb_listener_for_port from "./cndi_aws_lb_listener_for_port.tf.json.ts";
import cndi_aws_lb_target_group_for_port from "./cndi_aws_lb_target_group_for_port.tf.json.ts";
import cndi_aws_lb from "./cndi_aws_lb.tf.json.ts";
import cndi_aws_resourcegroups_group from "./cndi_aws_resourcegroups_group.tf.json.ts";
import cndi_aws_security_group from "./cndi_aws_security_group.tf.json.ts";
import cndi_aws_vpc from "./cndi_aws_vpc.tf.json.ts";
import cndi_aws_locals from "./locals.tf.json.ts";
import cndi_outputs from "./cndi_outputs.tf.json.ts";

import cndi_aws_eip from "./cndi_aws_eip.tf.json.ts";
import cndi_aws_nat_gateway from "./cndi_aws_nat_gateway.tf.json.ts";
import cndi_aws_route_table_association_public from "./cndi_aws_route_table_association_public.tf.json.ts";
import cndi_aws_route_table_association_private from "./cndi_aws_route_table_association_private.tf.json.ts";
import cndi_aws_route_table_public from "./cndi_aws_route_table_public.tf.json.ts";
import cndi_aws_route_table_private from "./cndi_aws_route_table_private.tf.json.ts";
import cndi_aws_route_private from "./cndi_aws_route_private.tf.json.ts";
import cndi_aws_route_public from "./cndi_aws_route_public.tf.json.ts";
import cndi_aws_subnet_private from "./cndi_aws_subnet_private.tf.json.ts";
import cndi_aws_subnet_public from "./cndi_aws_subnet_public.tf.json.ts";

export default async function stageTerraformResourcesForAWS(
  config: CNDIConfig,
) {
  const aws_region = (Deno.env.get("AWS_REGION") as string) || "us-east-1";
  const project_name = config?.project_name;

  const leaderNodeName = await getLeaderNodeNameFromConfig(config);
  const leader_node_ip =
    `\${aws_instance.cndi_aws_instance_${leaderNodeName}.private_ip}`;

  const awsEC2Nodes = config.infrastructure.cndi.nodes as Array<
    AWSEC2NodeItemSpec
  >;

  const node_id_list: string[] = [];

  const ports = resolveCNDIPorts(config);

  const listeners = ports.map((port) => {
    return stageFile(
      path.join(
        "cndi",
        "terraform",
        `cndi_aws_lb_listener_for_port_${port.name}.tf.json`,
      ),
      cndi_aws_lb_listener_for_port(port),
    );
  });

  const targetGroups = ports.map((port) => {
    return stageFile(
      path.join(
        "cndi",
        "terraform",
        `cndi_aws_lb_target_group_for_port_${port.name}.tf.json`,
      ),
      cndi_aws_lb_target_group_for_port(port),
    );
  });

  const targetGroupAttachments = awsEC2Nodes.flatMap((node) => { // TODO: what even is this
    return ports.map((port) => {
      return stageFile(
        path.join(
          "cndi",
          "terraform",
          `cndi_aws_lb_target_group_attachment_for_port_${port.name}_${node.name}.tf.json`,
        ),
        cndi_aws_lb_target_group_attachment_for_port(node, port),
      );
    });
  });

  const stageNodes = awsEC2Nodes.map((node) => {
    node_id_list.push(`\${aws_instance.cndi_aws_instance_${node.name}.id}`);
    return stageFile(
      path.join(
        "cndi",
        "terraform",
        `cndi_aws_instance_${node.name}.tf.json`,
      ),
      cndi_aws_instance(node, leaderNodeName),
    );
  });

  // stage all the terraform files at once
  try {
    await Promise.all([
      ...stageNodes,
      ...listeners,
      ...targetGroups,
      ...targetGroupAttachments,
      stageFile(
        path.join("cndi", "terraform", "cndi_aws_resourcegroups_group.tf.json"),
        cndi_aws_resourcegroups_group(project_name),
      ),
      stageFile(
        path.join("cndi", "terraform", "data.tf.json"),
        data(awsEC2Nodes),
      ),
      stageFile(
        path.join("cndi", "terraform", "locals.tf.json"),
        cndi_aws_locals({
          node_id_list,
          leader_node_ip,
          aws_region,
          nodes: awsEC2Nodes,
        }),
      ),
      stageFile(
        path.join("cndi", "terraform", "provider.tf.json"),
        provider(),
      ),
      stageFile(
        path.join("cndi", "terraform", "terraform.tf.json"),
        terraform(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_outputs.tf.json"),
        cndi_outputs(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_internet_gateway.tf.json",
        ),
        cndi_aws_internet_gateway(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_lb.tf.json",
        ),
        cndi_aws_lb(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_security_group.tf.json",
        ),
        cndi_aws_security_group(ports),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_vpc.tf.json",
        ),
        cndi_aws_vpc(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_eip.tf.json",
        ),
        cndi_aws_eip(),
      ),

      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_nat_gateway.tf.json",
        ),
        cndi_aws_nat_gateway(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_route_table_association_public.tf.json",
        ),
        cndi_aws_route_table_association_public(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_route_table_association_private.tf.json",
        ),
        cndi_aws_route_table_association_private(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_route_table_private.tf.json",
        ),
        cndi_aws_route_table_private(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_route_table_public.tf.json",
        ),
        cndi_aws_route_table_public(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_aws_route_private.tf.json"),
        cndi_aws_route_private(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_aws_route_public.tf.json"),
        cndi_aws_route_public(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_aws_subnet_public.tf.json"),
        cndi_aws_subnet_public(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_aws_subnet_private.tf.json"),
        cndi_aws_subnet_private(),
      ),
    ]);
  } catch (e) {
    console.error(ccolors.error("failed to stage terraform resources"));
    console.log(ccolors.caught(e, 800));
    await emitExitEvent(800);
    Deno.exit(800);
  }
}
