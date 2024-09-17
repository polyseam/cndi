import { CDKTFProviderGCP, Construct, TerraformLocal } from "cdktf-deps";
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
    const keyless = cndi_config?.infrastructure?.cndi?.keyless === true;

    const key = Deno.env.get("GOOGLE_CREDENTIALS");
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

    let client_email = Deno.env.get("GCP_SERVICE_ACCOUNT");
    let project = Deno.env.get("GCP_PROJECT");

    if (!keyless) {
      // redundant check
      if (!key) {
        throw new Error("'GOOGLE_CREDENTIALS' env variable not set");
      }

      // assumes key was validated earlier
      const parsedKey = JSON.parse(key) as GCPKeyJSON;

      if (!parsedKey?.project_id) {
        throw new Error([
          gcpCoreTerraformStackLabel,
          ccolors.key_name(`'GOOGLE_CREDENTIALS'`),
          ccolors.error("is invalid"),
        ].join(" "));
      }

      if (!parsedKey?.client_email) {
        throw new Error([
          gcpCoreTerraformStackLabel,
          ccolors.key_name(`'GOOGLE_CREDENTIALS'`),
          ccolors.error("is invalid"),
        ].join(" "));
      }

      project = parsedKey.project_id;
      client_email = parsedKey.client_email;
    } else {
      if (!project) {
        throw new Error(
          [
            gcpCoreTerraformStackLabel,
            ccolors.key_name(`'GCP_PROJECT'`),
            ccolors.error("env var is not set"),
          ].join(" "),
          { cause: 999999 },
        );
      }

      if (!client_email) {
        throw new Error(
          [
            gcpCoreTerraformStackLabel,
            ccolors.key_name(`'GCP_SERVICE_ACCOUNT'`),
            ccolors.error("env var is not set"),
          ].join(" "),
          { cause: 999999 },
        );
      }
    }

    this.locals.gcp_region = new TerraformLocal(this, "gcp_region", region);
    this.locals.gcp_zone = new TerraformLocal(this, "gcp_zone", zone);
    this.locals.gcp_project_id = new TerraformLocal(
      this,
      "project_id",
      project,
    );

    this.locals.gcp_client_email = new TerraformLocal(
      this,
      "gcp_client_email",
      client_email,
    );

    new CDKTFProviderGCP.provider.GoogleProvider(this, "cndi_google_provider", {
      project,
      region,
      zone,
    });
  }
}
