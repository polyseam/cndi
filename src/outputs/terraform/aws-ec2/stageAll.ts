import { ccolors, path } from "deps";

import { AWSEC2NodeItemSpec, CNDIConfig } from "src/types.ts";
import {
  emitExitEvent,
  getLeaderNodeNameFromConfig,
  stageFile,
} from "src/utils.ts";

import data from "./data.tf.json.ts";
import provider from "./provider.tf.json.ts";
import terraform from "./terraform.tf.json.ts";
import cndi_aws_lb_target_group_attachment_http from "./cndi_aws_lb_target_group_attachment_http.tf.json.ts";
import cndi_aws_lb_target_group_attachment_https from "./cndi_aws_lb_target_group_attachment_https.tf.json.ts";
import cndi_aws_instance from "./cndi_aws_instance.tf.json.ts";
import cndi_aws_internet_gateway from "./cndi_aws_internet_gateway.tf.json.ts";
import cndi_aws_lb_listener_http from "./cndi_aws_lb_listener_http.tf.json.ts";
import cndi_aws_lb_listener_https from "./cndi_aws_lb_listener_https.tf.json.ts";
import cndi_aws_lb_target_group_http from "./cndi_aws_lb_target_group_http.tf.json.ts";
import cndi_aws_lb_target_group_https from "./cndi_aws_lb_target_group_https.tf.json.ts";
import cndi_aws_lb from "./cndi_aws_lb.tf.json.ts";
import cndi_aws_route_table_association from "./cndi_aws_route_table_association.tf.json.ts";
import cndi_aws_route_table from "./cndi_aws_route_table.tf.json.ts";
import cndi_aws_route from "./cndi_aws_route.tf.json.ts";
import cndi_aws_security_group from "./cndi_aws_security_group.tf.json.ts";
import cndi_aws_subnet from "./cndi_aws_subnet.tf.json.ts";
import cndi_aws_vpc from "./cndi_aws_vpc.tf.json.ts";
import cndi_aws_locals from "./locals.tf.json.ts";
import cndi_aws_ebs_volume from "./cndi_aws_ebs_volume.tf.json.ts";
import cndi_aws_volume_attachment from "./cndi_aws_volume_attachment.tf.json.ts";
export default async function stageTerraformResourcesForAWS(
  config: CNDIConfig,
) {
  const aws_region = (Deno.env.get("AWS_REGION") as string) || "us-east-1";
  const leaderNodeName = await getLeaderNodeNameFromConfig(config);
  const leader_node_ip =
    `\${aws_instance.cndi_aws_instance_${leaderNodeName}.private_ip}`;

  const awsEC2Nodes = config.infrastructure.cndi.nodes as Array<
    AWSEC2NodeItemSpec
  >;

  const node_id_list: string[] = [];

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

  const stageEbsVolume = awsEC2Nodes.map(
    (node) =>
      stageFile(
        path.join(
          "cndi",
          "terraform",
          `cndi_aws_ebs_volume_${node.name}.tf.json`,
        ),
        cndi_aws_ebs_volume(node),
      ),
  );
  const stageEbsVolumeAttachment = awsEC2Nodes.map(
    (node) =>
      stageFile(
        path.join(
          "cndi",
          "terraform",
          `cndi_aws_volume_attachment_${node.name}.tf.json`,
        ),
        cndi_aws_volume_attachment(node),
      ),
  );
  const stageLbTargetGroupAttachmentHTTP = awsEC2Nodes.map(
    (node) =>
      stageFile(
        path.join(
          "cndi",
          "terraform",
          `cndi_aws_lb_target_group_attachment_http_${node.name}.tf.json`,
        ),
        cndi_aws_lb_target_group_attachment_http(node),
      ),
  );

  const stageLbTargetGroupAttachmentHTTPS = awsEC2Nodes
    .map(
      (node) =>
        stageFile(
          path.join(
            "cndi",
            "terraform",
            `cndi_aws_lb_target_group_attachment_https_${node.name}.tf.json`,
          ),
          cndi_aws_lb_target_group_attachment_https(node),
        ),
    );

  // stage all the terraform files at once
  try {
    await Promise.all([
      ...stageNodes,
      ...stageLbTargetGroupAttachmentHTTP,
      ...stageLbTargetGroupAttachmentHTTPS,
      ...stageEbsVolume,
      ...stageEbsVolumeAttachment,
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
          "cndi_aws_lb_target_group_http.tf.json",
        ),
        cndi_aws_lb_target_group_http(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_lb_target_group_https.tf.json",
        ),
        cndi_aws_lb_target_group_https(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_lb_listener_http.tf.json",
        ),
        cndi_aws_lb_listener_http(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_aws_lb_listener_https.tf.json"),
        cndi_aws_lb_listener_https(),
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
          "cndi_aws_route_table_association.tf.json",
        ),
        cndi_aws_route_table_association(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_route_table.tf.json",
        ),
        cndi_aws_route_table(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_aws_route.tf.json"),
        cndi_aws_route(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_security_group.tf.json",
        ),
        cndi_aws_security_group(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_aws_subnet.tf.json"),
        cndi_aws_subnet(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_vpc.tf.json",
        ),
        cndi_aws_vpc(),
      ),
    ]);
  } catch (e) {
    console.error(ccolors.error("failed to stage terraform resources"));
    console.log(ccolors.caught(e, 800));
    await emitExitEvent(800);
    Deno.exit(800);
  }
}
