import { CNDIConfig } from "src/types.ts";
import stageTerraformResourcesForAWS from "./aws/stageAll.ts";
import stageTerraformResourcesForGCP from "./gcp/stageAll.ts";
import stageTerraformResourcesForAzure from "./azure/stageAll.ts";
export default async function stageTerraformResourcesForConfig(
  config: CNDIConfig,
  options: { output: string; initializing: boolean }
) {
  const kind = config.infrastructure.cndi.nodes[0].kind;
  switch (kind) {
    case "aws":
      stageTerraformResourcesForAWS(config);
      break;
    case "gcp":
      await stageTerraformResourcesForGCP(config, options);
      break;
    case "azure":
      stageTerraformResourcesForAzure(config);
      break;
    default:
      throw new Error(`Unknown kind: ${kind}`);
  }
}
