import {
  App,
  // CDKTFProviderAWS,
  Construct,
  // Fn,
  // TerraformLocal,
  // TerraformOutput,
} from "deps";

// import { DEFAULT_INSTANCE_TYPES, DEFAULT_NODE_DISK_SIZE } from "consts";

import {
  getCDKTFAppConfig,
  // getUserDataTemplateFileString,
  // resolveCNDIPorts,
  stageCDKTFStack,
} from "src/utils.ts";
import { CNDIConfig } from "src/types.ts";
import GCPCoreTerraformStack from "./GCPCoreStack.ts";

export class GCPMicrok8sStack extends GCPCoreTerraformStack {
  constructor(scope: Construct, name: string, cndi_config: CNDIConfig) {
    super(scope, name, cndi_config);
  }
}

export async function stageTerraformSynthGCPMicrok8s(
  cndi_config: CNDIConfig,
) {
  const cdktfAppConfig = await getCDKTFAppConfig();
  const app = new App(cdktfAppConfig);
  new GCPMicrok8sStack(app, `_cndi_stack_`, cndi_config);
  await stageCDKTFStack(app);
}
