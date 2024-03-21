import {
  App,
  CDKTFProviderGCP,
  CDKTFProviderTime,
  Construct,
  Fn,
  stageCDKTFStack,
  TerraformOutput,
} from "cdktf-deps";

import {
  DEFAULT_INSTANCE_TYPES,
  DEFAULT_NODE_DISK_SIZE_UNMANAGED,
} from "consts";

import {
  getCDKTFAppConfig,
  patchAndStageTerraformFilesWithInput,
  resolveCNDIPorts,
  useSshRepoAuth,
} from "src/utils.ts";

import { CNDIConfig, NodeRole, TFBlocks } from "src/types.ts";
import GCPCoreTerraformStack from "./GCPCoreStack.ts";

export class GCPMicrok8sStack extends GCPCoreTerraformStack {
  constructor(scope: Construct, name: string, cndi_config: CNDIConfig) {
    super(scope, name, cndi_config);

    new CDKTFProviderTime.provider.TimeProvider(this, "cndi_time_provider", {});

    const _project_name = this.locals.cndi_project_name.asString;
    const open_ports = resolveCNDIPorts(cndi_config);

    const projectServiceCloudResourseManager = new CDKTFProviderGCP
      .projectService.ProjectService(
      this,
      "cndi_google_project_service_cloudresourcemanager",
      {
        disableOnDestroy: false,
        service: "cloudresourcemanager.googleapis.com",
      },
    );

    const projectServiceCompute = new CDKTFProviderGCP.projectService
      .ProjectService(
      this,
      "cndi_google_project_service_compute",
      {
        disableOnDestroy: false,
        service: "compute.googleapis.com",
        dependsOn: [projectServiceCloudResourseManager],
      },
    );

    const projectServicesReady = new CDKTFProviderTime.sleep.Sleep(
      this,
      "cndi_time_sleep_services_ready",
      {
        createDuration: "60s",
        dependsOn: [projectServiceCloudResourseManager, projectServiceCompute],
      },
    );

    const computeNetwork = new CDKTFProviderGCP.computeNetwork.ComputeNetwork(
      this,
      "cndi_google_compute_network",
      {
        name: "cndi-compute-network", // rename to cndi-compute-network
        autoCreateSubnetworks: false,
        dependsOn: [projectServicesReady],
      },
    );

    const computeSubnetwork = new CDKTFProviderGCP.computeSubnetwork
      .ComputeSubnetwork(
      this,
      "cndi_google_compute_subnetwork",
      {
        name: "cndi-compute-subnetwork",
        ipCidrRange: "10.0.0.0/16",
        network: computeNetwork.selfLink,
      },
    );

    new CDKTFProviderGCP.computeFirewall.ComputeFirewall(
      this,
      "cndi_google_compute_firewall",
      {
        name: "cndi-compute-firewall-allow-internal",
        description: "Allow internal traffic between cluster nodes",
        direction: "INGRESS",
        network: computeNetwork.selfLink,
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
        sourceRanges: [computeSubnetwork.ipCidrRange],
      },
    );

    const computeRouter = new CDKTFProviderGCP.computeRouter.ComputeRouter(
      this,
      "cndi_google_compute_router",
      {
        name: "cndi-compute-router",
        network: computeNetwork.selfLink,
      },
    );

    new CDKTFProviderGCP.computeRouterNat.ComputeRouterNat(
      this,
      "cndi_google_compute_router_nat",
      {
        name: "cndi-compute-router-nat",
        router: computeRouter.name,
        natIpAllocateOption: "AUTO_ONLY",
        sourceSubnetworkIpRangesToNat: "ALL_SUBNETWORKS_ALL_IP_RANGES",
      },
    );

    new CDKTFProviderGCP.computeFirewall.ComputeFirewall(
      this,
      "cndi_google_compute_firewall_allow-external",
      {
        name: "cndi-compute-firewall-allow-external",
        description: "Allow external traffic to open ports",
        direction: "INGRESS",
        network: computeNetwork.selfLink,
        allow: open_ports.map((port) => ({
          ports: [`${port.number}`],
          protocol: "tcp",
        })),
        sourceRanges: ["0.0.0.0/0"],
      },
    );

    let leaderInstance: CDKTFProviderGCP.computeInstance.ComputeInstance;

    const instanceSelfLinks: string[] = [];

    for (const nodeSpec of cndi_config.infrastructure.cndi.nodes) {
      let role: NodeRole = instanceSelfLinks.length === 0
        ? "leader"
        : "controller";

      if (nodeSpec?.role === "worker") {
        role = "worker";
      }

      const count = nodeSpec.count || 1;

      const volumeSize = nodeSpec?.volume_size ||
        nodeSpec?.disk_size ||
        nodeSpec?.disk_size_gb ||
        DEFAULT_NODE_DISK_SIZE_UNMANAGED;

      const machineType = nodeSpec?.machine_type ||
        nodeSpec?.instance_type ||
        DEFAULT_INSTANCE_TYPES.gcp;

      const networkInterface = {
        network: computeNetwork.selfLink,
        subnetwork: computeSubnetwork.selfLink,
        accessConfig: [{ networkTier: "STANDARD" }],
      };

      for (let i = 0; i < count; i++) {
        const source = new CDKTFProviderGCP.computeDisk.ComputeDisk(
          this,
          `cndi_google_compute_disk_${nodeSpec.name}_${i}`,
          {
            name: `cndi-compute-disk-${nodeSpec.name}-${i}`,
            image: "ubuntu-2004-focal-v20221121",
            size: volumeSize,
            zone: this.locals.gcp_zone.asString,
            type: "pd-ssd",
          },
        );

        let userData;

        if (role === "leader") {
          if (useSshRepoAuth()) {
            userData = Fn.templatefile(
              "microk8s-cloud-init-leader.yml.tftpl",
              {
                bootstrap_token: this.locals.bootstrap_token.asString!,
                git_repo_encoded: Fn.base64encode(
                  this.variables.git_repo.stringValue,
                ),
                git_repo: this.variables.git_repo.stringValue,
                git_ssh_private_key: Fn.base64encode(
                  this.variables.git_ssh_private_key.stringValue,
                ),
                sealed_secrets_private_key: Fn.base64encode(
                  this.variables.sealed_secrets_private_key.stringValue,
                ),
                sealed_secrets_public_key: Fn.base64encode(
                  this.variables.sealed_secrets_public_key.stringValue,
                ),
                argocd_admin_password:
                  this.variables.argocd_admin_password.stringValue,
              },
            );
          } else {
            userData = Fn.templatefile("microk8s-cloud-init-leader.yml.tftpl", {
              bootstrap_token: this.locals.bootstrap_token.asString!,
              git_repo: this.variables.git_repo.stringValue,
              git_token: this.variables.git_token.stringValue,
              git_username: this.variables.git_username.stringValue,
              sealed_secrets_private_key: Fn.base64encode(
                this.variables.sealed_secrets_private_key.stringValue,
              ),
              sealed_secrets_public_key: Fn.base64encode(
                this.variables.sealed_secrets_public_key.stringValue,
              ),
              argocd_admin_password:
                this.variables.argocd_admin_password.stringValue,
            });
          }
        } else if (role === "worker") {
          userData = Fn.templatefile("microk8s-cloud-init-worker.yml.tftpl", {
            bootstrap_token: this.locals.bootstrap_token.asString!,
            leader_node_ip: leaderInstance!.networkInterface.get(0).networkIp,
          });
        } else {
          userData = Fn.templatefile(
            "microk8s-cloud-init-controller.yml.tftpl",
            {
              bootstrap_token: this.locals.bootstrap_token.asString!,
              leader_node_ip: leaderInstance!.networkInterface.get(0).networkIp,
            },
          );
        }

        const instance = new CDKTFProviderGCP.computeInstance.ComputeInstance(
          this,
          `cndi_google_compute_instance_${nodeSpec.name}_${i}`,
          {
            name: `${nodeSpec.name}-${i}`,
            machineType,
            zone: this.locals.gcp_zone.asString,
            bootDisk: {
              source: source.selfLink,
            },
            allowStoppingForUpdate: true, //  allows Terraform to stop the instance to update its properties.
            networkInterface: [networkInterface],
            metadata: {
              "user-data": userData,
              "ssh-keys": `ubuntu:${this.variables.ssh_public_key.stringValue}`,
            },
          },
        );
        if (role === "leader") {
          leaderInstance = instance;
        }
        instanceSelfLinks.push(instance.selfLink);
      }
    }

    const computeInstanceGroup = new CDKTFProviderGCP.computeInstanceGroup
      .ComputeInstanceGroup(
      this,
      "cndi_google_compute_instance_group",
      {
        name: "cndi-compute-instance-group",
        description: "Compute Engine Instance Group for CNDI Cluster nodes",
        instances: instanceSelfLinks,
        namedPort: open_ports.map((port) => ({
          name: port.name,
          port: port.number,
        })),
        zone: this.locals.gcp_zone.asString,
      },
    );

    const computeHealthCheck = new CDKTFProviderGCP.computeRegionHealthCheck
      .ComputeRegionHealthCheck(
      this,
      "cndi_google_compute_region_health_check",
      {
        name: "cndi-compute-region-health-check",
        checkIntervalSec: 1,
        timeoutSec: 1,
        tcpHealthCheck: {
          port: 80,
        },
        dependsOn: [projectServicesReady],
      },
    );

    const computeRegionBackendService = new CDKTFProviderGCP
      .computeRegionBackendService.ComputeRegionBackendService(
      this,
      "cndi_google_compute_region_backend_service",
      {
        name: "cndi-compute-region-backend-service",
        backend: [
          {
            group: computeInstanceGroup.selfLink,
          },
        ],
        healthChecks: [computeHealthCheck.selfLink],
        portName: "http",
        protocol: "TCP",
        loadBalancingScheme: "EXTERNAL",
      },
    );

    const computeForwardingRule = new CDKTFProviderGCP.computeForwardingRule
      .ComputeForwardingRule(
      this,
      "cndi_google_compute_forwarding_rule",
      {
        name: "cndi-compute-forwarding-rule",
        backendService: computeRegionBackendService.selfLink,
        networkTier: "STANDARD",
        ports: open_ports.map((port) => `${port.number}`),
      },
    );

    new TerraformOutput(this, "public_host", {
      value: computeForwardingRule.ipAddress,
    });

    new TerraformOutput(this, "resource_group_url", {
      value:
        `https://console.cloud.google.com/welcome?project=${this.locals.gcp_project_id.asString}`,
    });

    const sshAddr = // @ts-ignore no-use-before-defined
      leaderInstance.networkInterface.get(0).accessConfig.get(0).natIp;

    new TerraformOutput(this, "get_kubeconfig_command", {
      value: `ssh -i 'cndi_rsa' ubuntu@${sshAddr} -t 'sudo microk8s config'`,
    });
  }
}

export async function stageTerraformSynthGCPMicrok8s(cndi_config: CNDIConfig) {
  const cdktfAppConfig = await getCDKTFAppConfig();
  const app = new App(cdktfAppConfig);
  new GCPMicrok8sStack(app, `_cndi_stack_`, cndi_config);

  // write terraform stack to staging directory
  await stageCDKTFStack(app);

  const input: TFBlocks = {
    ...cndi_config?.infrastructure?.terraform,
  };

  // patch cdk.tf.json with user's terraform pass-through
  await patchAndStageTerraformFilesWithInput(input);
}
