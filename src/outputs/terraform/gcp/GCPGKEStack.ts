import { CNDIConfig } from "src/types.ts";

import {
  App,
  // ccolors,
  // CDKTFProviderAzure,
  // CDKTFProviderHelm,
  // CDKTFProviderKubernetes,
  CDKTFProviderTime,
  CDKTFProviderTls,
  Construct,
  // Fn,
  // TerraformOutput,
  // TerraformVariable,
} from "deps";

// import { DEFAULT_INSTANCE_TYPES, DEFAULT_NODE_DISK_SIZE_MANAGED } from "consts";

import {
  getCDKTFAppConfig,
  // getPrettyJSONString,
  // resolveCNDIPorts,
  stageCDKTFStack,
  // useSshRepoAuth,
} from "src/utils.ts";

import GCPCoreTerraformStack from "./GCPCoreStack.ts";

// TODO: ensure that splicing project_name into tags.Name is safe
export default class GCPGKETerraformStack extends GCPCoreTerraformStack {
  constructor(scope: Construct, name: string, cndi_config: CNDIConfig) {
    super(scope, name, cndi_config);

    new CDKTFProviderTime.provider.TimeProvider(this, "time", {});
    new CDKTFProviderTls.provider.TlsProvider(this, "tls", {});
  }
}

export async function stageTerraformSynthGCPGKE(cndi_config: CNDIConfig) {
  const cdktfAppConfig = await getCDKTFAppConfig();
  const app = new App(cdktfAppConfig);
  new GCPGKETerraformStack(app, `_cndi_stack_`, cndi_config);
  await stageCDKTFStack(app);
}
