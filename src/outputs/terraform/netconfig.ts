import {
  CNDIConfig,
  CNDINetworkConfigAWS,
  CNDINetworkConfigAzure,
  CNDINetworkConfigEncapsulated,
  CNDINetworkConfigGCP,
  CNDIProvider,
} from "src/types.ts";

export default function getNetConfig(
  cndi_config: CNDIConfig,
  provider: CNDIProvider,
) {
  let netconfig = cndi_config?.infrastructure?.cndi?.network;

  if (netconfig?.mode === "external") {
    if (provider === "azure") {
      netconfig = netconfig as CNDINetworkConfigAzure;
      const subnets = netconfig?.azure?.subnets;
      const network_resource_id = netconfig?.azure?.network_resource_id;
      if (!network_resource_id) {
        throw new Error(
          'no "network_resource_id" provided in azure "external" mode',
        );
      }
      return {
        mode: "external",
        azure: {
          network_resource_id,
          subnets,
        },
      } as CNDINetworkConfigAzure;
    }

    if (provider === "aws") {
      netconfig = netconfig as CNDINetworkConfigAWS;
      const vpc_id = netconfig?.aws?.vpc_id;
      const subnets = netconfig?.aws?.subnets;

      if (!vpc_id) {
        throw new Error('no "network" provided in aws "external" mode');
      }
      if (!subnets) {
        throw new Error('no "subnets" provided in aws "external" mode');
      }

      return {
        mode: "external",
        aws: {
          vpc_id,
          subnets,
        },
      } as CNDINetworkConfigAWS;
    }

    if (provider === "gcp") {
      netconfig = netconfig as CNDINetworkConfigGCP;
      const network_name = netconfig?.gcp?.network_name;
      const subnets = netconfig?.gcp?.subnets;
      const project = netconfig?.gcp?.project;

      if (!network_name) {
        throw new Error('no "network" provided in "external" mode');
      }

      if (!subnets) {
        throw new Error('no "public_subnet" provided in "external" mode');
      }

      return {
        mode: "external",
        gcp: {
          project,
          network_name,
          subnets,
        },
      } as CNDINetworkConfigGCP;
    }
  }

  if (netconfig?.mode && netconfig.mode !== "encapsulated") {
    throw new Error(`invalid network mode: '${netconfig.mode}'`);
  }

  return {
    mode: "encapsulated",
  } as CNDINetworkConfigEncapsulated;
}
