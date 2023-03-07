import { Construct } from "https://esm.sh/v103/constructs@10.1.269";
import { App, TerraformStack } from "https://esm.sh/v103/cdktf@0.15.5";

import {
  computeFirewall,
  computeForwardingRule,
  // computeInstance,
  computeInstanceGroup,
  computeNetwork,
  computeRegionHealthCheck,
  computeRouter,
  computeRouterNat,
  computeSubnetwork,
  projectService,
  provider,
} from "https://esm.sh/v103/@cdktf/provider-google@5.0.6";
import { CNDIConfig } from "../../../../types.ts";

interface SynthGCPComputeEngineStackOptions {
  cndiConfig: CNDIConfig;
  region: string;
}

export default function synthGCPComputeEngine(
  options: SynthGCPComputeEngineStackOptions,
) {
  const GCPApp = new App({
    outdir: "cndi/terraform",
  });
  const PREFIX = "cndi_google";

  class GCPComputeEngineStack extends TerraformStack {
    constructor(scope: Construct, name: string) {
      super(scope, name);

      const { cndiConfig } = options;

      new provider.GoogleProvider(this, `${PREFIX}_provider`, {
        region: options?.region || "us-central1",
        zone: "us-central1-a",
      });

      const cloudresourcemanagerProjectService = new projectService
        .ProjectService(
        this,
        `${PREFIX}_cloudresourcemanager_project_service`,
        {
          service: "cloudresourcemanager.googleapis.com",
          disableOnDestroy: false,
        },
      );

      const computeProjectService = new projectService.ProjectService(
        this,
        `${PREFIX}_compute_project_service`,
        {
          service: "compute.googleapis.com",
          disableOnDestroy: false,
          dependsOn: [cloudresourcemanagerProjectService],
        },
      );

      cndiConfig.infrastructure.cndi.nodes.forEach((node) => {
        console.log("adding new node", node.name);
        // new computeInstance.ComputeInstance(
        //   this,
        //   `cndi_google_compute_instance_${node.name}`,
        //   {}
        // );
      });

      const net = new computeNetwork.ComputeNetwork(
        this,
        `${PREFIX}_compute_network`,
        {
          name: "cndi-vpc-network",
          autoCreateSubnetworks: false,
          dependsOn: [computeProjectService],
        },
      );

      const subnet = new computeSubnetwork.ComputeSubnetwork(
        this,
        `${PREFIX}_compute_subnetwork`,
        {
          ipCidrRange: "10.0.0.0/16",
          name: "cndi-vpc-network-subnetwork",
          network: net.selfLink,
        },
      );

      const _externalFirewall = new computeFirewall.ComputeFirewall(
        this,
        `${PREFIX}_external_compute_firewall`,
        {
          allow: [
            {
              ports: ["22"],
              protocol: "tcp",
            },
            {
              ports: ["80"],
              protocol: "tcp",
            },
            {
              ports: ["443"],
              protocol: "tcp",
            },
            {
              ports: ["30000-33000"],
              protocol: "tcp",
            },
          ],
          description: "Security firewall",
          direction: "INGRESS",
          name: "cndi-allow-external-traffic",
          network: net.selfLink,
          sourceRanges: ["0.0.0.0/0"],
        },
      );

      const _internalFirewall = new computeFirewall.ComputeFirewall(
        this,
        `${PREFIX}_internal_compute_firewall`,
        {
          allow: [
            {
              ports: ["0-65535"],
              protocol: "tcp",
            },
            {
              ports: ["0-65535"],
              protocol: "udp",
            },
            {
              protocol: "icmp",
            },
          ],
          description:
            "Inbound rule that enables traffic between EC2 instances in the VPC",
          direction: "INGRESS",
          name: "cndi-allow-internal-traffic",
          network: net.selfLink,
          sourceRanges: [subnet.ipCidrRange],
        },
      );

      const _forwardingRule = new computeForwardingRule.ComputeForwardingRule(
        this,
        `${PREFIX}_compute_forwarding_rule`,
        {
          backendService:
            "${google_compute_region_backend_service.cndi_backend_service.self_link}",
          name: "cndi-forwarding-rule",
          networkTier: "STANDARD",
          ports: ["80", "443"],
        },
      );

      const _healthCheck = new computeRegionHealthCheck
        .ComputeRegionHealthCheck(
        this,
        `${PREFIX}_compute_region_health_check`,
        {
          checkIntervalSec: 1,
          name: "cndi-healthcheck",
          tcpHealthCheck: {
            port: 80,
          },

          timeoutSec: 1,
          dependsOn: [computeProjectService],
        },
      );

      const router = new computeRouter.ComputeRouter(
        this,
        `${PREFIX}_compute_router`,
        {
          name: "cndi-router",
          network: net.selfLink,
        },
      );

      const _routerNat = new computeRouterNat.ComputeRouterNat(
        this,
        `${PREFIX}_compute_router_nat}`,
        {
          name: "cndi-router-nat",
          natIpAllocateOption: "AUTO_ONLY",
          router: router.name,
          sourceSubnetworkIpRangesToNat: "ALL_SUBNETWORKS_ALL_IP_RANGES",
        },
      );

      const _instanceGroup = new computeInstanceGroup.ComputeInstanceGroup(
        this,
        `${PREFIX}_compute_instance_group`,
        {
          description: "group of instances that form a cndi cluster",
          instances: [],
          name: "cndi-cluster",
          namedPort: [
            {
              name: "http",
              port: 80,
            },
            {
              name: "https",
              port: 443,
            },
          ],
          zone: "${local.zone}",
        },
      );
    }
  }
  new GCPComputeEngineStack(GCPApp, `${PREFIX}_compute_engine_stack`);
  GCPApp.synth();
}
