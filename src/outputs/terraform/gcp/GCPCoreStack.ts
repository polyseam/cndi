import { CDKTFProviderGoogle, Construct, TerraformLocal } from "cdktf-deps";
import { CNDIConfig } from "src/types.ts";
import { CNDITerraformStack } from "../CNDICoreTerraformStack.ts";
import { ccolors } from "deps";

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

const gcpCoreTerraformStackLabel = ccolors.faded(
  "src/outputs/terraform/gcp/GCPCoreTerraformStack.ts:",
);

export default class GCPCoreTerraformStack extends CNDITerraformStack {
  constructor(scope: Construct, name: string, cndi_config: CNDIConfig) {
    super(scope, name, cndi_config);
    const key = Deno.env.get("GOOGLE_CREDENTIALS");

    // redundant check
    if (!key) {
      throw new Error("'GOOGLE_CREDENTIALS' env variable not set");
    }

    // assumes key was validated earlier
    const parsedKey = JSON.parse(key) as GCPKeyJSON;

    const project = parsedKey?.project_id;

    if (!project) {
      throw new Error([
        gcpCoreTerraformStackLabel,
        ccolors.key_name(`'GOOGLE_CREDENTIALS'`),
        ccolors.error("is invalid"),
      ].join(" "));
    }

    const region = Deno.env.get("GCP_REGION");

    if (!region) {
      throw new Error(
        [
          gcpCoreTerraformStackLabel,
          ccolors.key_name(`'GCP_REGION'`),
          ccolors.error("env var is not set"),
        ].join(" "),
        { cause: 811 },
      );
    }

    const zone = `${region}-a`;

    this.locals.gcp_region = new TerraformLocal(this, "gcp_region", region);
    this.locals.gcp_zone = new TerraformLocal(this, "gcp_zone", zone);
    this.locals.gcp_project_id = new TerraformLocal(
      this,
      "project_id",
      project,
    );

    if (!parsedKey?.client_email) {
      throw new Error("'client_email' not found in GOOGLE_CREDENTIALS JSON");
    }

    this.locals.gcp_client_email = new TerraformLocal(
      this,
      "gcp_client_email",
      parsedKey.client_email,
    );

    new CDKTFProviderGoogle.provider.GoogleProvider(
      this,
      "cndi_google_provider",
      {
        project,
        region,
        zone,
      },
    );
  }
}
