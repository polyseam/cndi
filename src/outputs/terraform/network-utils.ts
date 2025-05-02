import { CNDIConfig } from "src/types.ts";
import {
  DEFAULT_SUBNET_ADDRESS_SPACE,
  DEFAULT_VNET_ADDRESS_SPACE,
} from "consts";

import { Netmask } from "netmask";

type ParsedNetworkConfig = {
  vnet_identifier: string;
  subnet_address_space: string;
  vnet_address_space: string;
  mode: "insert";
} | {
  subnet_address_space?: string;
  vnet_address_space: string;
  mode: "create";
};

// The user may specify any of the network configuration options in cndi_config.yaml[cndi][network]
type CNDINetworkSpec = {
  mode?: "create" | "insert";
  subnet_address_space?: string;
  vnet_address_space?: string;
  vnet_identifier?: string;
};

export function parseNetworkConfig(
  cndi_config: CNDIConfig,
): ParsedNetworkConfig {
  const network: CNDINetworkSpec = cndi_config?.infrastructure?.cndi?.network ||
    { mode: "create" };

  if (!network?.mode) {
    network.mode = "create";
  }

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
