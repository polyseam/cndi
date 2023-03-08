import * as path from "https://deno.land/std@0.172.0/path/mod.ts";
import { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/colors.ts";

import { CNDIConfig } from "src/types.ts";
import { stageFile } from "../../../utils.ts";

import provider from "./provider.tf.json.ts";
import terraform from "./terraform.tf.json.ts";
import cndi_aws_instance from "./cndi_aws_instance.tf.json.ts"
import cndi_aws_internet_gateway from "./cndi_aws_internet_gateway.tf.json.ts";
import cndi_aws_lb_listener_http from "./cndi_aws_lb_listener_http.tf.json.ts";
import cndi_aws_lb_listener_https from "./cndi_aws_lb_listener_https.tf.json.ts";
import cndi_aws_lb_target_group_http from "./cndi_aws_lb_target_group_http.tf.json.ts";
import cndi_aws_lb_target_group_https from "./cndi_aws_lb_target_group_https.tf.json.ts";
import cndi_aws_load_balancer from "./cndi_aws_load_balancer.tf.json.ts";
import cndi_aws_route_table_association from "./cndi_aws_route_table_association.tf.json.ts";
import cndi_aws_route_table from "./cndi_aws_route_table.tf.json.ts";
import cndi_aws_route from "./cndi_aws_route.tf.json.ts";
import cndi_aws_security_group from "./cndi_aws_security_group.tf.json.ts";
import cndi_aws_subnet from "./cndi_aws_subnet.tf.json.ts";
import cndi_aws_vpc from "./cndi_aws_vpc.tf.json.ts";

export default async function stageTerraformResourcesForAWS(
  config: CNDIConfig,
) {
  console.log('stageTerraformResourcesForAWS')

  const region = (Deno.env.get("GCP_REGION") as string) || "us-central1";


  const stageNodes = config.infrastructure.cndi.nodes.map((node) => {
    return stageFile(
      path.join(
        "cndi",
        "terraform",
        `${node.name}.cndi_aws_instance.tf.json`
      ),
      cndi_aws_instance(node, config)
    );
  });
  const stageLbTargetGroupAttachment = config.infrastructure.cndi.nodes.map((node) => {
    return stageFile(
      path.join(
        "cndi",
        "terraform",
        `${node.name}.cndi_aws_lb_target_group_attachment.tf.json`
      ),
      cndi_aws_instance(node, config)
    );
  });
  // stage all the terraform files at once
  try {
    await Promise.all([
      ...stageNodes,
      ...stageLbTargetGroupAttachment,
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
          "cndi_aws_internet_gateway.tf.json"
        ),
        cndi_aws_internet_gateway()
      ), stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_lb_target_group_http.tf.json"
        ),
        cndi_aws_lb_target_group_http()
      ), stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_lb_target_group_https.tf.json"
        ),
        cndi_aws_lb_target_group_https()
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_lb_listener_http.tf.json"
        ),
        cndi_aws_lb_listener_http()
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_aws_lb_listener_https.tf.json"),
        cndi_aws_lb_listener_https()
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_load_balancer.tf.json"
        ),
        cndi_aws_load_balancer()
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_route_table_association.tf.json"
        ),
        cndi_aws_route_table_association()
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_route_table.tf.json"
        ),
        cndi_aws_route_table()
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_aws_route.tf.json"),
        cndi_aws_route()
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_security_group.tf.json"
        ),
        cndi_aws_security_group()
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_aws_subnet.tf.json"),
        cndi_aws_subnet()
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_aws_vpc.tf.json"
        ),
        cndi_aws_vpc()
      ),
    ]);
  } catch (e) {
    console.log(colors.brightRed("failed to stage terraform resources\n"));
    console.log(e);
    Deno.exit(1);
  }
}
