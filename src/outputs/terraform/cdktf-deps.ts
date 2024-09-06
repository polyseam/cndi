export { Construct } from "constructs";

import {
  App,
  Fn,
  LocalBackend,
  TerraformLocal,
  TerraformOutput,
  TerraformStack,
  TerraformVariable,
} from "cdktf";

export type { ITerraformDependable } from "cdktf";

export {
  App,
  Fn,
  LocalBackend,
  TerraformLocal,
  TerraformOutput,
  TerraformStack,
  TerraformVariable,
};

// Terraform CDKTF Providers
export * as CDKTFProviderRandom from "@cdktf/provider-random";
export * as CDKTFProviderAWS from "@cdktf/provider-aws";
export * as CDKTFProviderAzure from "@cdktf/provider-azurerm";
export * as CDKTFProviderGCP from "@cdktf/provider-google";
export * as CDKTFProviderHelm from "@cdktf/provider-helm";
export * as CDKTFProviderKubernetes from "@cdktf/provider-kubernetes";
export * as CDKTFProviderTime from "@cdktf/provider-time";
export * as CDKTFProviderTls from "@cdktf/provider-tls";
export * as CDKTFProviderLocal from "@cdktf/provider-local";

export { AwsEks as AwsEksModule } from "@cndi/cdktf/modules/aws-eks.ts";
export { AwsVpc as AwsVpcModule } from "@cndi/cdktf/modules/aws-vpc.ts";
export { AwsIamAssumableRoleWithOidc as AwsIamAssumableRoleWithOidcModule } from "@cndi/cdktf/modules/aws-iam-assumable-role-with-oidc.ts";
export { AwsEksManagedNodeGroup as AwsEksManagedNodeGroupModule } from "@cndi/cdktf/modules/aws-eks-managed-node-group.ts";

import { getPrettyJSONString, getStagingDir } from "src/utils.ts";
import { path, walkSync } from "deps";

export async function stageCDKTFStack(app: App) {
  app.synth();

  const stagingDirectory = getStagingDir();

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
