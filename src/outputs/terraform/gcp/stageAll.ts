import * as path from "https://deno.land/std@0.172.0/path/mod.ts";
import { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/colors.ts";

import { CNDIConfig } from "src/types.ts";
import { getLeaderNodeNameFromConfig, stageFile } from "../../../utils.ts";

import provider from "./provider.tf.json.ts";
import terraform from "./terraform.tf.json.ts";

import cndi_google_compute_firewall_external from "./cndi_google_compute_firewall_external.tf.json.ts";
import cndi_google_compute_firewall_internal from "./cndi_google_compute_firewall_internal.tf.json.ts";
import cndi_google_compute_forwarding_rule from "./cndi_google_compute_forwarding_rule.tf.json.ts";
import cndi_google_compute_instance from "./cndi_google_compute_instance.tf.json.ts";
import cndi_google_compute_disk from "./cndi_google_compute_disk.tf.json.ts";
import cndi_google_compute_instance_group from "./cndi_google_compute_instance_group.tf.json.ts";
import cndi_google_compute_network from "./cndi_google_compute_network.tf.json.ts";
import cndi_google_compute_region_health_check from "./cndi_google_compute_region_health_check.tf.json.ts";
import cndi_google_compute_router from "./cndi_google_compute_router.tf.json.ts";
import cndi_google_compute_router_nat from "./cndi_google_compute_router_nat.tf.json.ts";
import cndi_google_compute_subnetwork from "./cndi_google_compute_subnetwork.tf.json.ts";
import cndi_google_project_service_compute from "./cndi_google_project_service_compute.tf.json.ts";
import cndi_google_project_service_cloudresourcemanager from "./cndi_google_project_service_cloudresourcemanager.tf.json.ts";
import cndi_google_compute_region_backend_service from "./cndi_google_compute_region_backend_service.tf.json.ts";
import cndi_google_locals from "./locals.tf.json.ts";

export default async function stageTerraformResourcesForGCP(
  config: CNDIConfig,
  options: { output: string; initializing: boolean },
) {
  const dotEnvPath = path.join(options.output, ".env");
  const gcp_region = (Deno.env.get("GCP_REGION") as string) || "us-central1";
  const googleCredentials = Deno.env.get("GOOGLE_CREDENTIALS") as string; // project_id

  const leaderName = getLeaderNodeNameFromConfig(config);

  const leader_node_ip =
    `\${google_compute_instance.cndi_google_compute_instance_${leaderName}.network_interface.0.network_ip}`;

  if (!googleCredentials) {
    console.log("google credentials are missing");
    // the message about missing credentials should have already been printed
    Deno.exit(1);
  }

  // we parse the key to extract the project_id for use in terraform
  // the json key is only used for auth within `cndi run`
  let parsedJSONServiceAccountKey = { project_id: "" };

  try {
    parsedJSONServiceAccountKey = JSON.parse(googleCredentials);
  } catch {
    const placeholder = "GOOGLE_CREDENTIALS_PLACEHOLDER__";
    if (googleCredentials === placeholder) {
      console.log(
        colors.yellow(
          `\n\n${
            colors.brightRed(
              "ERROR",
            )
          }: GOOGLE_CREDENTIALS not found in environment`,
        ),
      );
      console.log(
        `You need to replace `,
        colors.cyan(placeholder),
        `with the desired value in "${dotEnvPath}"\nthen run ${
          colors.green(
            "cndi ow",
          )
        }\n`,
      );
      if (!options.initializing) {
        console.log(
          colors.yellow(
            "If you are initializing a new project, you can ignore this message",
          ),
        );
        Deno.exit(1);
      }
    } else {
      console.log(
        colors.brightRed("failed to parse service account key json\n"),
      );
      Deno.exit(1);
    }
  }

  const stageNodes = config.infrastructure.cndi.nodes.map((node) =>
    stageFile(
      path.join(
        "cndi",
        "terraform",
        `cndi_google_compute_instance_${node.name}.tf.json`,
      ),
      cndi_google_compute_instance(node, config),
    )
  );

  const stageDisks = config.infrastructure.cndi.nodes.map((node) =>
    stageFile(
      path.join(
        "cndi",
        "terraform",
        `cndi_google_compute_disk_${node.name}.tf.json`,
      ),
      cndi_google_compute_disk(node),
    )
  );

  // stage all the terraform files at once
  try {
    await Promise.all([
      ...stageNodes,
      ...stageDisks,
      stageFile(
        path.join("cndi", "terraform", "locals.tf.json"),
        cndi_google_locals({ gcp_region, leader_node_ip }),
      ),
      stageFile(
        path.join("cndi", "terraform", "provider.tf.json"),
        provider({
          project_id: parsedJSONServiceAccountKey.project_id,
        }),
      ),
      stageFile(
        path.join("cndi", "terraform", "terraform.tf.json"),
        terraform(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_google_compute_region_backend_service.tf.json",
        ),
        cndi_google_compute_region_backend_service(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_google_project_service_compute.tf.json",
        ),
        cndi_google_project_service_compute(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_google_project_service_cloudresourcemanager.tf.json",
        ),
        cndi_google_project_service_cloudresourcemanager(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_google_compute_network.tf.json"),
        cndi_google_compute_network(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_google_compute_subnetwork.tf.json",
        ),
        cndi_google_compute_subnetwork(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_google_compute_firewall_external.tf.json",
        ),
        cndi_google_compute_firewall_external(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_google_compute_firewall_internal.tf.json",
        ),
        cndi_google_compute_firewall_internal(),
      ),
      stageFile(
        path.join("cndi", "terraform", "cndi_google_compute_router.tf.json"),
        cndi_google_compute_router(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_google_compute_router_nat.tf.json",
        ),
        cndi_google_compute_router_nat(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_google_compute_forwarding_rule.tf.json",
        ),
        cndi_google_compute_forwarding_rule(),
      ),
      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_google_compute_instance_group.tf.json",
        ),
        cndi_google_compute_instance_group(config.infrastructure.cndi.nodes),
      ),

      stageFile(
        path.join(
          "cndi",
          "terraform",
          "cndi_google_compute_region_health_check.tf.json",
        ),
        cndi_google_compute_region_health_check(),
      ),
    ]);
  } catch (e) {
    console.log(colors.brightRed("failed to stage terraform resources\n"));
    console.log(e);
    Deno.exit(1);
  }
}
