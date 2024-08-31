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

export { CDKTFProviderRandom } from "src/outputs/terraform/terraform-providers/CDKTFProviderRandom.ts";
export { CDKTFProviderAws } from "src/outputs/terraform/terraform-providers/CDKTFProviderAws.ts";
export { CDKTFProviderGoogle } from "src/outputs/terraform/terraform-providers/CDKTFProviderGoogle.ts";
export * as CDKTFProviderAzurerm from "src/outputs/terraform/terraform-providers/CDKTFProviderAzurerm.ts";
export * as CDKTFProviderKubernetes from "src/outputs/terraform/terraform-providers/CDKTFProviderKubernetes.ts";
export { CDKTFProviderTime } from "src/outputs/terraform/terraform-providers/CDKTFProviderTime.ts";
export { CDKTFProviderTls } from "src/outputs/terraform/terraform-providers/CDKTFProviderTls.ts";
export { CDKTFProviderHelm } from "src/outputs/terraform/terraform-providers/CDKTFProviderHelm.ts";
export { CDKTFProviderLocal } from "src/outputs/terraform/terraform-providers/CDKTFProviderLocal.ts";

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
