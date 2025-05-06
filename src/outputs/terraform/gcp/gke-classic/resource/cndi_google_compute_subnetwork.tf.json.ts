import { getPrettyJSONString } from "src/utils.ts";

import { CNDIConfig } from "src/types.ts";

interface GOOGLE_COMPUTE_SUBNETWORK {
  name: string;
  // traditional GKE clusters should leverage custom compute subnetworks
  ip_cidr_range: string;
  network: string;
  private_ip_google_access: boolean;
}

export default function (_cndi_config: CNDIConfig) {
  const network = "cndi-compute-network-${local.cndi_project_name}";
  const google_compute_subnetwork: Record<string, GOOGLE_COMPUTE_SUBNETWORK> = {
    cndi_google_compute_subnetwork: {
      network,
      private_ip_google_access: true,
      name: "cndi-compute-subnetwork-${local.cndi_project_name}",
      ip_cidr_range: "10.0.0.0/20",
    },
  };

  return getPrettyJSONString({
    resource: {
      google_compute_subnetwork,
    },
  });
}
