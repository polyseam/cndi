import {
  CNDINetworkConfigCreate,
  CNDINetworkConfigInsert,
  NormalizedCNDIConfig,
} from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";
import { ccolors } from "deps";
import {
  DEFAULT_AVAILABILITY_ZONE_COUNT,
  DEFAULT_REGIONS,
  NETWORK_PROFILE,
} from "consts";

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

const _label = ccolors.faded("\nsrc/outputs/terraform/locals.tf.json.ts:\n");

function getGCPKey(): GCPKeyJSON {
  const key = Deno.env.get("GOOGLE_CREDENTIALS");

  // redundant check
  if (!key) {
    throw new Error("'GOOGLE_CREDENTIALS' env variable not set");
  }

  // assumes key was validated earlier
  try {
    const parsedKey = JSON.parse(key) as GCPKeyJSON;
    return parsedKey;
  } catch {
    throw new Error("'GOOGLE_CREDENTIALS' env variable is invalid JSON");
  }
}

function getGoogleLocals(_cndi_config: NormalizedCNDIConfig): {
  cndi_gcp_project_id: string;
  cndi_gcp_client_email: string;
} {
  const { project_id, client_email } = getGCPKey();

  if (!project_id || !client_email) {
    throw new Error(
      [
        ccolors.key_name(`'GOOGLE_CREDENTIALS'`),
        ccolors.error("is invalid"),
      ].join(" "),
    );
  }

  return {
    cndi_gcp_project_id: project_id,
    cndi_gcp_client_email: client_email,
  };
}

/**
 * Creates an array of strings from 1 to n
 * @param n number of strings to create
 * @returns array of strings from 1 to n
 *
 * @example
 * countStrings(3) // ["1", "2", "3"]
 */
const countStrings = (n: number): string[] =>
  Array.from({ length: n }, (_, i) => (i + 1).toString());

/**
 * Returns the availability zones for the given CNDI config
 * @param cndi_config the CNDI config
 * @returns the availability zones for the given CNDI config
 *
 * @example
 * getAvailabilityZones({
 *   infrastructure: {
 *     cndi: {
 *       network: {
 *         availability_zones: ["us-east-1a", "us-east-1b", "us-east-1c"]
 *       }
 *     }
 *   }
 * }) // ["us-east-1a", "us-east-1b", "us-east-1c"]
 */
const getAvailabilityZones = (
  cndi_config: NormalizedCNDIConfig,
): string | string[] => {
  const azs = cndi_config.infrastructure?.cndi?.network?.availability_zones;
  if (Array.isArray(azs)) {
    if (cndi_config.provider === "aws") return azs;
    if (cndi_config.provider === "azure") {
      const valid = azs.every((az) => parseInt(az) > 0 && parseInt(az) < 4);
      if (valid) return azs;
      console.error('Azure Zones must be subset of ["1", "2", "3"]');
    }
    if (cndi_config.provider === "gcp") {
      const valid = azs.every((az) => az.match(/-[a-z]$/));
      if (valid) return azs;
      console.error(
        'GCP Zones must end in -<letter> (e.g. "-a", "-b", "-c", etc.)',
      );
    }
  }

  let count = DEFAULT_AVAILABILITY_ZONE_COUNT;
  if (typeof azs === "number") {
    // MUST BE STRICTLY NUMBER
    count = azs;
  }

  switch (cndi_config.provider) {
    case "aws":
      return `\${slice(data.aws_availability_zones.available-zones.names, 0, ${count})}`;
    case "azure": {
      if (typeof azs === "string") return [azs];
      if (typeof azs === "number") {
        if (azs > 3) return countStrings(3); // Azure only supports 3 AZs max
        if (azs <= 1) return ["1"]; // we require at least 1 AZ
      }
      return countStrings(count);
    }
    case "gcp":
      return `\${slice(data.google_compute_zones.available-zones.names, 0, ${count})}`; // vibez
    case "dev":
      return [];
    default:
      return [];
  }
};

const getRegionForCNDIConfig = (
  cndi_config: NormalizedCNDIConfig,
): string | null => {
  return cndi_config.region || DEFAULT_REGIONS?.[cndi_config.provider] || null;
};

export default function getLocalsTfJSON(
  cndi_config: NormalizedCNDIConfig,
  patch: Locals = {},
): string {
  const l: Locals = {
    cndi_project_name: cndi_config.project_name,
  };

  const region = getRegionForCNDIConfig(cndi_config);
  const availability_zones = getAvailabilityZones(cndi_config);

  if (cndi_config.provider === "gcp") {
    const { cndi_gcp_project_id, cndi_gcp_client_email } = getGoogleLocals(
      cndi_config,
    );
    l.cndi_gcp_project_id = cndi_gcp_project_id;
    l.cndi_gcp_client_email = cndi_gcp_client_email;
  }

  // consider: we could check zones against regions and both against machine types...
  // currently we are conservative because they change
  if (region) l.region = region;

  if (availability_zones) l.availability_zones = availability_zones;

  const insert_mode =
    cndi_config.infrastructure?.cndi?.network?.mode === "insert";

  if (insert_mode) {
    const nc = cndi_config.infrastructure.cndi
      .network as CNDINetworkConfigInsert;

    l.network_identifier = nc?.network_identifier;
    l.public_subnet_ids = nc.subnet_identifiers?.public || [];
    l.private_subnet_ids = nc?.subnet_identifiers?.private || [];
  } else {
    // assume network mode is "create"
    const nc = cndi_config.infrastructure.cndi
      .network as CNDINetworkConfigCreate;

    l.network_address_space = nc?.network_address_space ||
      NETWORK_PROFILE.NETWORK_ADDRESS_SPACE;

    if (Array.isArray(nc?.subnet_address_spaces?.private)) {
      l.private_subnet_address_spaces = nc?.subnet_address_spaces?.private;
    } else {
      l.private_subnet_address_spaces =
        "${[for k, v in local.availability_zones : cidrsubnet(local.network_address_space, 4, k + length(local.availability_zones))]}";
    }

    if (Array.isArray(nc?.subnet_address_spaces?.public)) {
      l.public_subnet_address_spaces = nc?.subnet_address_spaces?.public;
    } else {
      l.public_subnet_address_spaces =
        "${[for k, v in local.availability_zones : cidrsubnet(local.network_address_space, 4, k)]}";
    }
  }

  const locals: Locals = {
    ...l,
    ...patch,
  };

  return getPrettyJSONString({ locals });
}
