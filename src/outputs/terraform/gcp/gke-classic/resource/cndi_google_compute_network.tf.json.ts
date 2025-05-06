import { getPrettyJSONString } from "src/utils.ts";

import { CNDIConfig } from "src/types.ts";

interface GOOGLE_COMPUTE_NETWORK {
  name: string;
  // traditional GKE clusters should leverage custom compute subnetworks
  auto_create_subnetworks: boolean;
  depends_on: string[];
}

export default function (_cndi_config: CNDIConfig) {
  const google_compute_network: Record<string, GOOGLE_COMPUTE_NETWORK> = {
    cndi_google_compute_network: {
      name: "cndi-compute-network-${local.cndi_project_name}",
      auto_create_subnetworks: false,
      depends_on: ["time_sleep.cndi_time_sleep"],
    },
  };

  return getPrettyJSONString({
    resource: {
      google_compute_network,
    },
  });
}
