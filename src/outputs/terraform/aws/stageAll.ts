import { ccolors, path } from "deps";

import { AWSNodeItemSpec, CNDIConfig } from "src/types.ts";
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

export default async function stageTerraformResourcesForAWS(
  config: CNDIConfig,
) {
  const aws_region = (Deno.env.get("AWS_REGION") as string) || "us-east-1";
  const leaderNodeName = await getLeaderNodeNameFromConfig(config);
  const leader_node_ip =
    `\${aws_instance.cndi_aws_instance_${leaderNodeName}.private_ip}`;

  const stageNodes = config.infrastructure.cndi.nodes.map((node) =>
    stageFile(
      path.join(
        "cndi",
        "terraform",
        `cndi_aws_instance_${node.name}.tf.json`,
      ),
      cndi_aws_instance(node, leaderNodeName),
    )
  );

  const stageLbTargetGroupAttachmentHTTP = config.infrastructure.cndi.nodes.map(
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

  const stageLbTargetGroupAttachmentHTTPS = config.infrastructure.cndi.nodes
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
      stageFile(
        path.join("cndi", "terraform", "data.tf.json"),
        data(config.infrastructure.cndi.nodes as Array<AWSNodeItemSpec>),
      ),
      stageFile(
        path.join("cndi", "terraform", "locals.tf.json"),
        cndi_aws_locals({
          leader_node_ip,
          aws_region,
          nodes: config.infrastructure.cndi.nodes,
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
    console.log(ccolors.caught(e));
    await emitExitEvent(800);
    Deno.exit(800);
  }
}
