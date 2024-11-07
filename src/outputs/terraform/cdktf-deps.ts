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

import { getPrettyJSONString, getStagingDirectory } from "src/utils.ts";
import { path, walkSync } from "deps";
import { ErrOut } from "errout";

import { CNDIConfig } from "src/types.ts";
import {
  DEFAULT_SUBNET_ADDRESS_SPACE,
  DEFAULT_VNET_ADDRESS_SPACE,
} from "consts";
import { Netmask } from "netmask";

export async function stageCDKTFStack(app: App): Promise<ErrOut | void> {
  app.synth();

  const [err, stagingDirectory] = getStagingDirectory();

  if (err) return err;

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

type ParsedNetworkConfig = {
  vnet_identifier: string;
  subnet_address_space: string;
  vnet_address_space: string;
  mode: "insert";
} | {
  subnet_address_space?: string;
  vnet_address_space?: string;
  mode: "encapsulated";
};

export function parseNetworkConfig(
  cndi_config: CNDIConfig,
): ParsedNetworkConfig {
  const network = cndi_config?.infrastructure?.cndi?.network ||
    { mode: "encapsulated" };

  if (!network?.subnet_address_space) {
    network.subnet_address_space = DEFAULT_SUBNET_ADDRESS_SPACE;
  }

  if (!network?.vnet_address_space) {
    network.vnet_address_space = DEFAULT_VNET_ADDRESS_SPACE;
  }

  if (network.mode === "insert") {
    if (!network?.vnet_identifier) {
      throw new Error(`Invalid network config: ${JSON.stringify(network)}`);
    }
  }

  return network as ParsedNetworkConfig;
}

export function divideCIDRIntoSubnets(
  cidr: string,
  numSubnets: number,
): string[] {
  const blocks: string[] = [];
  const baseBlock = new Netmask(cidr);
  const originalPrefix = baseBlock.bitmask;

  // Calculate the new prefix (y) needed to create the specified number of subnets
  const newPrefix = originalPrefix + Math.ceil(Math.log2(numSubnets));
  const subnetCount = Math.pow(2, newPrefix - originalPrefix);

  // Validate if the requested number of subnets can fit into the /x block
  if (numSubnets > subnetCount) {
    throw new Error(
      "Cannot fit the specified number of subnets within the given block.",
    );
  }

  // Generate the subnets
  let baseAddress = baseBlock.base;
  for (let i = 0; i < numSubnets; i++) {
    const subnet = new Netmask(`${baseAddress}/${newPrefix}`);
    blocks.push(subnet.base + `/${newPrefix}`);
    baseAddress = subnet.next().base;
  }

  return blocks;
}
