import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";
import { ccolors } from "deps";

type _Primitive = string | number | boolean | null;
type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
type JSONObject = { [key: string]: JSONValue };
type JSONArray = JSONValue[];

type Locals = {
  cndi_project_name?: string;

  region?: string;
  availability_zones?: string[] | string | number;

  network_identifier?: string;
  public_subnet_ids?: string | string[];
  private_subnet_ids?: string | string[];
  public_subnet_address_spaces?: string | string[];
  private_subnet_address_spaces?: string | string[];

  [key: string]: unknown;
};

type _GCPKeyJSON = {
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

const _label = ccolors.faded("\nsrc/outputs/terraform/locals.tf.json.ts:\n");

// type LocalsGetter = (cndi_config: NormalizedCNDIConfig) => Locals;

// const getLocalsFor: Record<string, LocalsGetter> = {
// gcp: (_cndi_config: NormalizedCNDIConfig): Locals => {
//   const key = Deno.env.get("GOOGLE_CREDENTIALS");

//   // redundant check
//   if (!key) {
//     throw new Error("'GOOGLE_CREDENTIALS' env variable not set");
//   }

//   // assumes key was validated earlier
//   const parsedKey = JSON.parse(key) as GCPKeyJSON;

//   const cndi_gcp_project_id = parsedKey?.project_id;

//   if (!cndi_gcp_project_id) {
//     throw new Error([
//       label,
//       ccolors.key_name(`'GOOGLE_CREDENTIALS'`),
//       ccolors.error("is invalid"),
//     ].join(" "));
//   }

//   const cndi_gcp_region = Deno.env.get("GCP_REGION") || "us-central1";
//   const cndi_gcp_zone = `${cndi_gcp_region}-a`;
//   const cndi_gcp_client_email = parsedKey.client_email;
//   return {
//     cndi_gcp_region,
//     cndi_gcp_zone,
//     cndi_gcp_project_id,
//     cndi_gcp_client_email,
//   };
// },
// aws: (_cndi_config: NormalizedCNDIConfig): Locals => {
//   const cndi_aws_region = Deno.env.get("AWS_REGION") || "us-east-1";
//   return { cndi_aws_region };
// },
// azure: (cndi_config: NormalizedCNDIConfig): Locals => {
//   const cndi_arm_region = Deno.env.get("ARM_REGION") || "eastus";
//   const networkSpec = cndi_config?.infrastructure?.cndi?.network;

//   const locals: Locals = { cndi_arm_region };

//   if (networkSpec?.mode === "insert") {
//     locals.network_identifier = networkSpec.network_identifier;

//     // Store all subnet identifiers for AKS to use
//     if (networkSpec.subnets?.length) {
//       // Store all subnet identifiers for the AKS module
//       locals.subnets = networkSpec.subnets;
//       // Keep subnet_identifier for backward compatibility (uses first subnet)
//       locals.subnet_identifier = networkSpec.subnets[0];
//     } else {
//       // Default to a subnet named 'default' in the VNet if no subnets provided
//       const defaultSubnet =
//         `${networkSpec.network_identifier}/subnets/default`;
//       locals.subnets = [defaultSubnet];
//       locals.subnet_identifier = defaultSubnet;
//     }
//   }

//   return locals;
// },
// dev: (_cndi_config: NormalizedCNDIConfig): Locals => ({
//   join_token: "${random_password.cndi_random_password_join_token.result}",
// }),
// };

export default function getLocalsTfJSON(
  cndi_config: NormalizedCNDIConfig,
  patch: Locals = {},
): string {
  const l: Locals = {
    cndi_project_name: cndi_config.project_name,
    region: cndi_config.region,
    availability_zones:
      cndi_config.infrastructure?.cndi?.network?.availability_zones || 3,
  };

  if (cndi_config.infrastructure?.cndi?.network?.mode === "insert") {
    l.network_identifier = cndi_config.infrastructure.cndi.network
      ?.network_identifier;
    l.public_subnet_ids =
      cndi_config.infrastructure.cndi.network?.subnets?.public || [];
    l.private_subnet_ids =
      cndi_config.infrastructure.cndi.network?.subnets?.private || [];
  } else {
    // assume network mode is "create"
    l.public_subnet_address_spaces =
      cndi_config.infrastructure.cndi.network?.subnets?.private || [];
    l.private_subnet_address_spaces =
      cndi_config.infrastructure.cndi.network?.subnets?.public || [];
  }

  const locals: Locals = {
    ...l,
    ...patch,
  };

  return getPrettyJSONString({ locals });
}
