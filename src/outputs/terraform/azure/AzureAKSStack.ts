import { CNDIConfig } from "src/types.ts";

import {
  App,
  // CDKTFProviderAWS,
  // CDKTFProviderHelm,
  // CDKTFProviderKubernetes,
  // CDKTFProviderTime,
  // CDKTFProviderTls,
  Construct,
  // Fn,
  // TerraformOutput,
} from "deps";

import {
  getCDKTFAppConfig,
  // getPrettyJSONString,
  resolveCNDIPorts,
  stageCDKTFStack,
  // useSshRepoAuth,
} from "src/utils.ts";

import AzureCoreTerraformStack from "./AzureCoreStack.ts";

// TODO: ensure that splicing project_name into tags.Name is safe
export default class AzureAKSTerraformStack extends AzureCoreTerraformStack {
  constructor(scope: Construct, name: string, cndi_config: CNDIConfig) {
    super(scope, name, cndi_config);
    const _project_name = this.locals.cndi_project_name.asString;
    const _open_ports = resolveCNDIPorts(cndi_config);
  }
}

export async function stageTerraformSynthAzureAKS(cndi_config: CNDIConfig) {
  const cdktfAppConfig = await getCDKTFAppConfig();
  const app = new App(cdktfAppConfig);
  new AzureAKSTerraformStack(app, `_cndi_stack_`, cndi_config);
  await stageCDKTFStack(app);
}
