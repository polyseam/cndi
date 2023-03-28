import { ccolors, path } from "deps";

import { CNDIConfig } from "src/types.ts";
import { emitExitEvent, stageFile } from "src/utils.ts";

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

const gcpStageAllLable = ccolors.faded(
  "\nsrc/outputs/terraform/gcp/stageAll.ts:",
);

export default async function stageTerraformResourcesForGCP(
  config: CNDIConfig,
  options: { output: string; initializing: boolean },
) {
  const dotEnvPath = path.join(options.output, ".env");
  const gcp_region = (Deno.env.get("GCP_REGION") as string) || "us-central1";
  const googleCredentials = Deno.env.get("GOOGLE_CREDENTIALS") as string; // project_id

  const leader_node_ip =
    "google_compute_instance.cndi_google_compute_instance_${local.leader_node_name}.network_interface.0.network_ip";

  if (!googleCredentials) {
    console.error(
      gcpStageAllLable,
      ccolors.key_name(`"GOOGLE_CREDENTIALS"`),
      ccolors.error("is not set in your environment"),
    );
    console.log(
      ccolors.error(
        "You need to set it to the contents of your service account key json file\n",
      ),
    );
    // the message about missing credentials should have already been printed
    await emitExitEvent(803);
    Deno.exit(803);
  }

  // we parse the key to extract the project_id for use in terraform
  // the json key is only used for auth within `cndi run`
  let parsedJSONServiceAccountKey = { project_id: "" };

  try {
    parsedJSONServiceAccountKey = JSON.parse(googleCredentials);
  } catch (parsingError) {
    const placeholder = "GOOGLE_CREDENTIALS_PLACEHOLDER__";
    if (googleCredentials === placeholder) {
      console.log(
        gcpStageAllLable,
        ccolors.error("ERROR:"),
        ccolors.key_name(`"GOOGLE_CREDENTIALS"`),
        ccolors.warn("not found in environment"),
      );
      console.log(
        ccolors.warn("You need to replace"),
        ccolors.key_name(placeholder),
        ccolors.warn(
          "with the contents of your service account key json file in",
        ),
        ccolors.user_input(`"${dotEnvPath}"`),
        ccolors.warn("\nthen run"),
        ccolors.success("cndi ow\n"),
      );
      if (!options.initializing) {
        console.log();
        await emitExitEvent(804);
        Deno.exit(804);
      }
    } else {
      console.error(
        ccolors.error("failed to parse service account key json from"),
        ccolors.user_input(`"${dotEnvPath}"`),
      );
      console.log(ccolors.caught(parsingError));
      await emitExitEvent(805);
      Deno.exit(805);
    }
  }

  const stageNodes = config.infrastructure.cndi.nodes.map((node) =>
    stageFile(
      path.join(
        "cndi",
        "terraform",
        `cndi_google_compute_instance_${node.name}.tf.json`,
      ),
      cndi_google_compute_instance(node),
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
    console.log(ccolors.error("failed to stage terraform resources"));
    console.log(ccolors.caught(e));
    await emitExitEvent(802);
    Deno.exit(802);
  }
}
