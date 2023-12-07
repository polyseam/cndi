import { CDKTFProviderGCP, Construct, TerraformLocal } from "deps";
import { CNDIConfig } from "src/types.ts";
import { CNDITerraformStack } from "../CNDICoreTerraformStack.ts";

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

export default class GCPCoreTerraformStack extends CNDITerraformStack {
  constructor(scope: Construct, name: string, cndi_config: CNDIConfig) {
    super(scope, name, cndi_config);
    const key = Deno.env.get("GOOGLE_CREDENTIALS");

    if (!key) {
      throw new Error("'GOOGLE_CREDENTIALS' env variable not set");
    }

    let parsedKey: GCPKeyJSON;

    try {
      parsedKey = JSON.parse(key) as GCPKeyJSON;
    } catch (e) {
      console.error("'GOOGLE_CREDENTIALS' env variable is not valid JSON");
      console.error(e);
      Deno.exit(1111);
    }

    const project = parsedKey?.project_id;

    if (!project) {
      throw new Error(
        "'GOOGLE_CREDENTIALS' env variable does not contain a project_id",
      );
    }

    const region = Deno.env.get("GCP_REGION");

    if (!region) {
      throw new Error("'GCP_REGION' env variable not set");
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

    new CDKTFProviderGCP.provider.GoogleProvider(this, "cndi_google_provider", {
      project,
      region,
      zone,
    });
  }
}
