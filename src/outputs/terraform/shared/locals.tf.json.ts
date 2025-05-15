import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";
import { ccolors } from "deps";

type Primitive = string | number | boolean | null;
type JSONValue = Primitive | JSONObject | JSONArray;
type JSONObject = { [key: string]: JSONValue };
type JSONArray = JSONValue[];

type Locals = Record<string, JSONValue>;

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

const label = ccolors.faded("\nsrc/outputs/terraform/locals.tf.json.ts:\n");

type LocalsGetter = (cndi_config: CNDIConfig) => Locals;

const getLocalsFor: Record<string, LocalsGetter> = {
  gcp: (_cndi_config: CNDIConfig): Locals => {
    const key = Deno.env.get("GOOGLE_CREDENTIALS");

    // redundant check
    if (!key) {
      throw new Error("'GOOGLE_CREDENTIALS' env variable not set");
    }

    // assumes key was validated earlier
    const parsedKey = JSON.parse(key) as GCPKeyJSON;

    const cndi_gcp_project_id = parsedKey?.project_id;

    if (!cndi_gcp_project_id) {
      throw new Error([
        label,
        ccolors.key_name(`'GOOGLE_CREDENTIALS'`),
        ccolors.error("is invalid"),
      ].join(" "));
    }

    const cndi_gcp_region = Deno.env.get("GCP_REGION") || "us-central1";
    const cndi_gcp_zone = `${cndi_gcp_region}-a`;
    const cndi_gcp_client_email = parsedKey.client_email;
    return {
      cndi_gcp_region,
      cndi_gcp_zone,
      cndi_gcp_project_id,
      cndi_gcp_client_email,
    };
  },
  aws: (_cndi_config: CNDIConfig): Locals => {
    const cndi_aws_region = Deno.env.get("AWS_REGION") || "us-east-1";
    return { cndi_aws_region };
  },
  azure: (_cndi_config: CNDIConfig): Locals => {
    const cndi_arm_region = Deno.env.get("ARM_REGION") || "eastus";
    return { cndi_arm_region };
  },
  dev: (_cndi_config: CNDIConfig): Locals => ({
    join_token: "${random_password.cndi_random_password_join_token.result}",
  }),
};

export default function getLocalsTfJSON(
  cndi_config: CNDIConfig,
  patch: Locals = {},
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
    ...getLocalsFor[cndi_config.provider](cndi_config),
    ...patch,
  };

  return getPrettyJSONString({ locals });
}
