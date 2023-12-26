export { Construct } from "npm:constructs";
import { App } from "npm:cdktf";
export { App };

export {
  Fn,
  LocalBackend,
  TerraformLocal,
  TerraformOutput,
  TerraformStack,
  TerraformVariable,
} from "npm:cdktf";

// Terraform CDKTF Providers
export * as CDKTFProviderRandom from "npm:@cdktf/provider-random";
export * as CDKTFProviderHelm from "npm:@cdktf/provider-helm";
export * as CDKTFProviderKubernetes from "npm:@cdktf/provider-kubernetes";
export * as CDKTFProviderTime from "npm:@cdktf/provider-time";
export * as CDKTFProviderTls from "npm:@cdktf/provider-tls";
export * as CDKTFProviderLocal from "npm:@cdktf/provider-local";

import { getPrettyJSONString, getStagingDir } from "src/utils.ts";
import { path, walkSync } from "deps";

export async function stageCDKTFStack(app: App) {
  app.synth();
  const stagingDirectory = await getStagingDir();
  const tfHome = path.join(stagingDirectory, "cndi", "terraform");
  const synthDir = path.join(tfHome, "stacks", "_cndi_stack_");
  Deno.removeSync(path.join(tfHome, "manifest.json")); // this file is useless and confusing unless using cdktf-cli
  const synthFiles = walkSync(synthDir, { includeDirs: false });
  for (const entry of synthFiles) {
    const destinationAbsPath = entry.path.replace(synthDir, tfHome);
    if (entry.path.endsWith("cdk.tf.json")) {
      let jsonStr = await Deno.readTextFile(entry.path);
      const cdktfObj = JSON.parse(jsonStr);
      delete cdktfObj.terraform.backend;
      jsonStr = getPrettyJSONString(cdktfObj);
      Deno.writeTextFileSync(
        destinationAbsPath,
        jsonStr.replaceAll("_cndi_stack_", "."),
      );
      Deno.removeSync(entry.path);
      continue;
    }
    Deno.renameSync(entry.path, destinationAbsPath);
  }
}
