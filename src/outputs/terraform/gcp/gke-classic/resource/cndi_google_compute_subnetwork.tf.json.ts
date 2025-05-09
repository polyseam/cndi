import { getPrettyJSONString, truncateString } from "src/utils.ts";

import { CNDIConfig } from "src/types.ts";

interface GoogleComputeSubnetwork {
  name: string;
  // traditional GKE clusters should leverage custom compute subnetworks
  ip_cidr_range: string;
  network: string;
  private_ip_google_access: boolean;
}

export default function (cndi_config: CNDIConfig) {
  const prefix = `cndi-subnet-`;
  const project_name = truncateString(
    cndi_config?.project_name || "x",
    64 - prefix.length,
  );
  const name = `cndi-subnet-${project_name}`;
  const google_compute_subnetwork: Record<string, GoogleComputeSubnetwork> = {
    cndi_google_compute_subnetwork: {
      name,
      network: "${google_compute_network.cndi_google_compute_network.name}",
      private_ip_google_access: true,
      ip_cidr_range: "10.0.0.0/20",
    },
  };

  return getPrettyJSONString({
    resource: {
      google_compute_subnetwork,
    },
  });
}
