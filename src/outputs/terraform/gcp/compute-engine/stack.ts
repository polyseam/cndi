import { Construct } from "https://esm.sh/v103/constructs";
import { App, TerraformStack } from "https://esm.sh/v103/cdktf";

import {
  provider,
  computeSubnetwork,
  computeNetwork,
  computeInstance,
} from "https://esm.sh/v103/@cdktf/provider-google@5.0.6";
import { CNDIConfig } from "../../../../types.ts";

interface SynthGCPComputeEngineStackOptions {
  cndiConfig: CNDIConfig;
  region: string;
}

export default function synthGCPComputeEngine(
  options: SynthGCPComputeEngineStackOptions
) {
  const GCPApp = new App({
    outdir: "cndi/terraform",
  });

  class GCPComputeEngineStack extends TerraformStack {
    constructor(scope: Construct, name: string) {
      super(scope, name);
      const { cndiConfig } = options;

      new provider.GoogleProvider(this, "google", {
        region: options?.region || "us-central1",
        zone: "us-central1-a",
      });

      cndiConfig.infrastructure.cndi.nodes.forEach((node) => {
        console.log('adding new node', node.name)
        // new computeInstance.ComputeInstance(
        //   this,
        //   `cndi_google_compute_instance_${node.name}`,
        //   {}
        // );
      });

      const net = new computeNetwork.ComputeNetwork(this, "cndi_vpc_network", {
        name: "cndi-vpc-network",
        autoCreateSubnetworks: false,
      });

      new computeSubnetwork.ComputeSubnetwork(
        this,
        "cndi_google_compute_subnetwork",
        {
          ipCidrRange: "10.0.0.0/16",
          name: "cndi-vpc-network-subnetwork",
          network: net.selfLink,
        }
      );
    }
  }
  new GCPComputeEngineStack(GCPApp, "cndi-google-compute-subnetwork");
  GCPApp.synth();
}
