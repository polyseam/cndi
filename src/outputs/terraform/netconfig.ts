import {
  CNDIConfig,
  CNDINetworkConfigEncapsulated,
  CNDINetworkConfigExternalAWS,
  CNDINetworkConfigExternalAzure,
  CNDINetworkConfigExternalGCP,
  CNDIProvider,
} from "src/types.ts";

export default function getNetConfig(
  cndi_config: CNDIConfig,
  provider: CNDIProvider,
) {
  let netconfig = cndi_config?.infrastructure?.cndi?.network;

  if (netconfig?.mode === "external") {
    if (provider === "azure") {
      netconfig = netconfig as CNDINetworkConfigExternalAzure;
      const primary_subnet = netconfig?.azure?.primary_subnet;
      const private_subnets = netconfig?.azure?.private_subnets;
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
          primary_subnet,
          private_subnets,
        },
      } as CNDINetworkConfigExternalAzure;
    }

    if (provider === "aws") {
      netconfig = netconfig as CNDINetworkConfigExternalAWS;
      const vpc_id = netconfig?.aws?.vpc_id;
      const primary_subnet = netconfig?.aws?.primary_subnet;
      const private_subnets = netconfig?.aws?.private_subnets;

      if (!vpc_id) {
        throw new Error('no "network" provided in aws "external" mode');
      }
      if (!private_subnets) {
        throw new Error('no "subnets" provided in aws "external" mode');
      }

      return {
        mode: "external",
        aws: {
          vpc_id,
          primary_subnet,
          private_subnets,
        },
      } as CNDINetworkConfigExternalAWS;
    }

    if (provider === "gcp") {
      netconfig = netconfig as CNDINetworkConfigExternalGCP;
      const network_name = netconfig?.gcp?.network_name;
      const private_subnets = netconfig?.gcp?.private_subnets;
      const primary_subnet = netconfig?.gcp?.primary_subnet;
      const project = netconfig?.gcp?.project;

      if (!network_name) {
        throw new Error('no "network" provided in "external" mode');
      }

      if (!primary_subnet) {
        throw new Error('no "primary_subnet" provided in "external" mode');
      }

      return {
        mode: "external",
        gcp: {
          network_name,
          primary_subnet,
          private_subnets,
          project,
        },
      } as CNDINetworkConfigExternalGCP;
    }
  }

  if (netconfig?.mode && netconfig.mode !== "encapsulated") {
    throw new Error(`invalid network mode: '${netconfig.mode}'`);
  }

  return {
    mode: "encapsulated",
  } as CNDINetworkConfigEncapsulated;
}
