import { CDKTFProviderDigitalOcean, Construct } from "cdktf-deps";
import { CNDIConfig } from "src/types.ts";
import { CNDITerraformStack } from "../CNDICoreTerraformStack.ts";

const DEFAULT_DIGITAL_OCEAN_REGION = "nyc1";

export default class DigitalOceanCoreTerraformStack extends CNDITerraformStack {
  project: CDKTFProviderDigitalOcean.project.Project;
  digitalOceanRegion:
    CDKTFProviderDigitalOcean.dataDigitaloceanRegion.DataDigitaloceanRegion;
  constructor(scope: Construct, name: string, cndi_config: CNDIConfig) {
    super(scope, name, cndi_config);

    const regionSlug = Deno.env.get("DIGITALOCEAN_REGION") ||
      DEFAULT_DIGITAL_OCEAN_REGION;

    new CDKTFProviderDigitalOcean.provider.DigitaloceanProvider(
      this,
      "cndi_digitalocean_provider",
      {},
    );

    this.digitalOceanRegion = new CDKTFProviderDigitalOcean
      .dataDigitaloceanRegion.DataDigitaloceanRegion(this, "cndi_region", {
      slug: regionSlug,
    });

    this.project = new CDKTFProviderDigitalOcean.project.Project(
      this,
      "cndi_project",
      {
        name: `cndi-${this.locals.cndi_project_name}`,
      },
    );
  }
}
