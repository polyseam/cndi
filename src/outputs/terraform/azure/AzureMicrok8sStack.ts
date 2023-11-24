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
  resolveCNDIPorts,
  stageCDKTFStack,
} from "src/utils.ts";
import { CNDIConfig } from "src/types.ts";
import AzureCoreTerraformStack from "./AzureCoreStack.ts";

export class AzureMicrok8sStack extends AzureCoreTerraformStack {
  constructor(scope: Construct, name: string, cndi_config: CNDIConfig) {
    super(scope, name, cndi_config);

    const _open_ports = resolveCNDIPorts(cndi_config);
    const _nodeIdList: string[] = [];
    const _project_name = this.locals.cndi_project_name.asString!;
  }
}

export async function stageTerraformSynthAzureMicrok8s(
  cndi_config: CNDIConfig,
) {
  const cdktfAppConfig = await getCDKTFAppConfig();
  const app = new App(cdktfAppConfig);
  new AzureMicrok8sStack(app, `_cndi_stack_`, cndi_config);
  await stageCDKTFStack(app);
}
