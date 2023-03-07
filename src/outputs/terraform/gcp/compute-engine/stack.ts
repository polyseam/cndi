import { Construct } from "https://esm.sh/v103/constructs@10.1.269";
import {
  App,
  Fn,
  TerraformStack,
  TerraformVariable,
} from "https://esm.sh/v103/cdktf@0.15.5";

import {
  computeDisk,
  computeFirewall,
  computeForwardingRule,
  computeInstance,
  computeInstanceGroup,
  computeNetwork,
  computeRegionBackendService,
  computeRegionHealthCheck,
  computeRouter,
  computeRouterNat,
  computeSubnetwork,
  projectService,
  provider,
} from "https://esm.sh/v103/@cdktf/provider-google@5.0.6";
import * as path from "https://deno.land/std@0.173.0/path/mod.ts";
import { CNDIConfig, GCPNodeItemSpec } from "../../../../types.ts";

import controllerBootstrapScript from "src/bootstrap/controller_bootstrap_cndi.sh.ts";
import leaderBootstrapScript from "src/bootstrap/controller_bootstrap_cndi.sh.ts";

interface SynthGCPComputeEngineStackOptions {
  cndiConfig: CNDIConfig;
  region: string;
}

export default function synthGCPComputeEngine(
  options: SynthGCPComputeEngineStackOptions,
) {
  const stagingDir = Deno.env.get("CNDI_STAGING_DIRECTORY");
  if (!stagingDir) throw new Error("CNDI_STAGING_DIRECTORY not set");

  const stagingDirSegments = stagingDir?.split(path.SEP) || [];
  const outdir = [...stagingDirSegments, "cndi", "terraform"].join(path.SEP);
  const GCPApp = new App({
    outdir,
  });

  const PREFIX = "cndi_google";

  class GCPComputeEngineStack extends TerraformStack {
    constructor(scope: Construct, name: string) {
      super(scope, name);

      const leaderUserDataFilePath = Deno.makeTempFileSync();
      const controllerUserDataFilePath = Deno.makeTempFileSync();

      Deno.writeTextFileSync(leaderUserDataFilePath, leaderBootstrapScript);
      Deno.writeTextFileSync(
        controllerUserDataFilePath,
        controllerBootstrapScript,
      );

      const { cndiConfig } = options;

      new provider.GoogleProvider(this, `${PREFIX}_provider`, {
        region: options?.region || "us-central1",
        zone: "us-central1-a",
      });

      const bootstrap_token = new TerraformVariable(this, "bootstrap_token", {
        type: "string",
        description: "secret token to invite nodes to the cluster",
      });

      const git_repo = new TerraformVariable(this, "git_repo", {
        // TF_VAR_git_repo
        type: "string",
        description: "git repo where your CNDI project is stored",
      });

      const git_username = new TerraformVariable(this, "git_username", {
        type: "string",
        description: "git username to access your CNDI project",
      });

      const git_password = new TerraformVariable(this, "git_password", {
        type: "string",
        description: "git password to access your CNDI project",
      });

      const sealed_secrets_public_key = new TerraformVariable(
        this,
        "sealed_secrets_public_key",
        {
          type: "string",
          description: "sealed secrets public key",
        },
      );

      const sealed_secrets_private_key = new TerraformVariable(
        this,
        "sealed_secrets_private_key",
        {
          type: "string",
          description: "sealed secrets private key",
        },
      );

      const argo_ui_admin_password = new TerraformVariable(
        this,
        "argo_ui_admin_password",
        {
          type: "string",
          description: "argo ui admin password",
        },
      );

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

      let leaderInstance: computeInstance.ComputeInstance;
      const instances: string[] = []; // list of "instance.selfLink"s for the instance group

      cndiConfig.infrastructure.cndi.nodes
        .sort(({ role }) => (role === "leader" ? -1 : +1)) // leader first
        .forEach((n) => {
          const node = n as GCPNodeItemSpec;

          const bootDisk = new computeDisk.ComputeDisk(
            this,
            `${PREFIX}_compute_disk_${node.name}`,
            {
              name: `${PREFIX}_compute_disk_${node.name}`,
              type: "pd-ssd",
              size: node?.size || node?.volume_size || 100,
              dependsOn: [computeProjectService],
              image: "ubuntu-2004-focal-v20221121",
            },
          );

          const networkInterface = [
            {
              network: net.selfLink,
              subnetwork: subnet.selfLink,
              accessConfig: [{ networkTier: "STANDARD" }],
            },
          ];

          if (node.role === "leader") {
            const user_data = Fn.templatefile(leaderUserDataFilePath, {
              bootstap_token: bootstrap_token.value,
              git_repo: git_repo.value,
              git_password: git_password.value,
              git_username: git_username.value,
              sealed_secrets_private_key: sealed_secrets_private_key.value,
              sealed_secrets_public_key: sealed_secrets_public_key.value,
              argo_ui_admin_password: argo_ui_admin_password.value,
            });

            leaderInstance = new computeInstance.ComputeInstance(
              this,
              `${PREFIX}_compute_instance_${node.name}`,
              {
                name: node.name,
                allowStoppingForUpdate: true,
                machineType: node?.machine_type || node?.instance_type ||
                  "n2-standard-2",
                tags: ["cndi", node.name],
                metadata: { user_data },
                networkInterface,
                bootDisk: {
                  source: bootDisk.selfLink,
                },
              },
            );
            instances.push(leaderInstance.selfLink);
            return;
          }

          const user_data = Fn.templatefile(controllerUserDataFilePath, {
            bootstap_token: bootstrap_token.value,
            leader_node_ip: leaderInstance.networkInterface.get(0).networkIp,
          });

          instances.push(
            new computeInstance.ComputeInstance(
              this,
              `${PREFIX}_compute_instance_${node.name}`,
              {
                name: node.name,
                allowStoppingForUpdate: true,
                machineType: node?.machine_type || node?.instance_type ||
                  "n2-standard-2",
                tags: ["cndi", node.name],
                metadata: { user_data },
                networkInterface,
                bootDisk: {
                  source: bootDisk.selfLink,
                },
              },
            ).selfLink,
          );
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

      const healthCheck = new computeRegionHealthCheck.ComputeRegionHealthCheck(
        this,
        `${PREFIX}_compute_region_health_check`,
        {
          checkIntervalSec: 1,
          name: `${PREFIX}_compute_region_health_check`,
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

      const instanceGroup = new computeInstanceGroup.ComputeInstanceGroup(
        this,
        `${PREFIX}_compute_instance_group`,
        {
          description: "group of instances that form a cndi cluster",
          instances,
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
          zone: `${options?.region || "us-central1"}a`,
        },
      );

      const _computeRegionBackendService = new computeRegionBackendService
        .ComputeRegionBackendService(
        this,
        `${PREFIX}_compute_region_backend_service`,
        {
          backend: [
            {
              group: instanceGroup.selfLink,
            },
          ],
          healthChecks: [healthCheck.selfLink],
          loadBalancingScheme: "EXTERNAL",
          name: "cndi-backend-service",
          portName: "http",
          protocol: "TCP",
        },
      );
    }
  }
  new GCPComputeEngineStack(GCPApp, `${PREFIX}_compute_engine_stack`);
  GCPApp.synth();
}
