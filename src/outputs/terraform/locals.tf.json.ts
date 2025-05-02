import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";
import { ccolors } from "deps";

type Locals = Record<string, string>;

type GCPKeyJSON = {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
};

const label = ccolors.faded("\nsrc/outputs/terraform/locals.tf.json.ts:");

const getLocalsFor = {
  gcp: (_cndi_config: CNDIConfig): Locals => {
    const key = Deno.env.get("GOOGLE_CREDENTIALS");

    // redundant check
    if (!key) {
      throw new Error("'GOOGLE_CREDENTIALS' env variable not set");
    }

    // assumes key was validated earlier
    const parsedKey = JSON.parse(key) as GCPKeyJSON;

    const gcp_project_id = parsedKey?.project_id;

    if (!gcp_project_id) {
      throw new Error([
        label,
        ccolors.key_name(`'GOOGLE_CREDENTIALS'`),
        ccolors.error("is invalid"),
      ].join(" "));
    }

    const gcp_region = Deno.env.get("GCP_REGION") || "us-central1";
    const gcp_zone = `${gcp_region}-a`;
    const gcp_client_email = parsedKey.client_email;
    return {
      gcp_region,
      gcp_zone,
      gcp_project_id,
      gcp_client_email,
    };
  },
  aws: (_cndi_config: CNDIConfig): Locals => {
    const aws_region = Deno.env.get("AWS_REGION") || "us-east-1";
    return { aws_region };
  },
  azure: (_cndi_config: CNDIConfig): Locals => {
    const arm_region = Deno.env.get("ARM_REGION") || "eastus";
    return { arm_region };
  },
  dev: (_cndi_config: CNDIConfig): Locals => ({
    bootstrap_token:
      "${random_password.cndi_random_password_bootstrap_token.result}",
  }),
};

export default function getLocalsTfJSON(
  cndi_config: CNDIConfig,
): string {
  const cndi_project_name = cndi_config.project_name;

  if (!cndi_project_name) {
    throw new Error(
      [
        label,
        ccolors.key_name("cndi_config[project_name]"),
        ccolors.error("is not set"),
      ].join(" "),
    );
  }

  const locals: Locals = {
    cndi_project_name,
    cluster_name: "${local.cndi_project_name}",
    ...getLocalsFor[cndi_config.provider](cndi_config),
  };

  return getPrettyJSONString({ locals });
}
