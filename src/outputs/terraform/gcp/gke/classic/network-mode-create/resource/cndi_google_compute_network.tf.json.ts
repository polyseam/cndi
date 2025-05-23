import { getPrettyJSONString, truncateString } from "src/utils.ts";

import { CNDIConfig } from "src/types.ts";

interface GoogleComputeNetwork {
  name: string;
  // traditional GKE clusters should leverage custom compute subnetworks
  auto_create_subnetworks: boolean;
  depends_on?: string[];
}

export default function (cndi_config: CNDIConfig) {
  const prefix = `cndi-net-`;
  const project_name = truncateString(
    cndi_config?.project_name || "x",
    64 - prefix.length,
  );
  const name = `cndi-net-${project_name}`;
  const google_compute_network: Record<string, GoogleComputeNetwork> = {
    cndi_google_compute_network: {
      name,
      auto_create_subnetworks: false,
      depends_on: ["time_sleep.cndi_time_sleep_services_ready"],
    },
  };

  return getPrettyJSONString({
    resource: {
      google_compute_network,
    },
  });
}
