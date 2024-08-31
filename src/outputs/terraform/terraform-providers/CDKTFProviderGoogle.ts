import {
  computeFirewall,
  computeNetwork,
  computeSubnetwork,
  containerCluster,
  containerNodePool,
  dataGoogleClientConfig,
  projectService,
  provider,
} from "@cdktf/provider-google";

export const CDKTFProviderGoogle = {
  provider,
  dataGoogleClientConfig,
  projectService,
  computeNetwork,
  computeSubnetwork,
  computeFirewall,
  containerCluster,
  containerNodePool,
};
