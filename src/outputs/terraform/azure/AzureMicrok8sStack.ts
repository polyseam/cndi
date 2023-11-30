import {
  App,
  CDKTFProviderAzure,
  Construct,
  Fn,
  // TerraformLocal,
  TerraformOutput,
} from "deps";

import {
  DEFAULT_INSTANCE_TYPES,
  DEFAULT_NODE_DISK_SIZE_UNMANAGED,
} from "consts";

import {
  getCDKTFAppConfig,
  resolveCNDIPorts,
  stageCDKTFStack,
} from "src/utils.ts";
import { CNDIConfig, NodeRole } from "src/types.ts";
import AzureCoreTerraformStack from "./AzureCoreStack.ts";

export class AzureMicrok8sStack extends AzureCoreTerraformStack {
  constructor(scope: Construct, name: string, cndi_config: CNDIConfig) {
    super(scope, name, cndi_config);

    const open_ports = resolveCNDIPorts(cndi_config);
    const _nodeIdList: string[] = [];

    const project_name = this.locals.cndi_project_name.asString!;
    const tags = {
      CNDIProject: project_name,
    };

    const publicIp = new CDKTFProviderAzure.publicIp.PublicIp(
      this,
      "cndi_azure_public_ip",
      {
        allocationMethod: "Static",
        sku: "Standard",
        name: `public-ip_${project_name}`,
        location: this.rg.location,
        resourceGroupName: this.rg.name,
        tags: {
          CNDIProject: project_name,
        },
      },
    );

    const vnet = new CDKTFProviderAzure.virtualNetwork.VirtualNetwork(
      this,
      "cndi_azure_vnet",
      {
        name: `cndi_azure_vnet`,
        resourceGroupName: this.rg.name,
        addressSpace: ["10.0.0.0/16"],
        location: this.rg.location,
        tags,
      },
    );

    const subnet = new CDKTFProviderAzure.subnet.Subnet(
      this,
      "cndi_azure_subnet",
      {
        name: `cndi_azure_subnet`,
        resourceGroupName: this.rg.name,
        virtualNetworkName: vnet.name,
        addressPrefixes: ["10.0.0.0/24"],
      },
    );

    const lb = new CDKTFProviderAzure.lb.Lb(this, "cndi_azure_load_balancer", {
      frontendIpConfiguration: [
        {
          name: `cndi_azure_lb_frontend_ip_configuration`,
          publicIpAddressId: publicIp.id,
        },
      ],
      sku: "Standard",
      skuTier: "Regional",
      location: this.rg.location!,
      name: `cndi_azure_load_balancer`,
      resourceGroupName: this.rg.name,
      tags,
    });

    const backendAddressPool = new CDKTFProviderAzure.lbBackendAddressPool
      .LbBackendAddressPool(
      this,
      "cndi_azure_lb_backend_address_pool",
      {
        loadbalancerId: lb.id,
        name: `cndi_azure_lb_backend_address_pool`,
      },
    );

    const securityRule: Array<
      CDKTFProviderAzure.networkSecurityGroup.NetworkSecurityGroupSecurityRule
    > = [];
    open_ports.map((port, index) => {
      securityRule.push({
        access: "Allow",
        description: `Allow inbound for ${port.name} on ${port.number}`,
        destinationAddressPrefix: "*",
        destinationAddressPrefixes: [],
        destinationApplicationSecurityGroupIds: [],
        destinationPortRange: `${port.number}`,
        destinationPortRanges: [],
        direction: "Inbound",
        name: `Allow_${port.name}`,
        priority: parseInt(`10${index}`),
        protocol: "Tcp",
        sourceAddressPrefix: "*",
        sourceAddressPrefixes: [],
        sourceApplicationSecurityGroupIds: [],
        sourcePortRange: "*",
        sourcePortRanges: [],
      });

      const lbProbe = new CDKTFProviderAzure.lbProbe.LbProbe(
        this,
        `cndi_azure_lb_probe_${port.number}`,
        {
          loadbalancerId: lb.id,
          name: `cndi_azure_lb_probe_${port.number}`,
          port: port.number,
        },
      );

      new CDKTFProviderAzure.lbRule.LbRule(
        this,
        `cndi_azure_lb_rule_${port.number}`,
        {
          backendAddressPoolIds: [backendAddressPool.id],
          backendPort: port.number,
          frontendPort: port.number,
          frontendIpConfigurationName: lb.frontendIpConfiguration.get(0).name,
          loadbalancerId: lb.id,
          protocol: "Tcp",
          name: port.name,
          probeId: lbProbe.id,
        },
      );
    });

    const cndiNsg = new CDKTFProviderAzure.networkSecurityGroup
      .NetworkSecurityGroup(
      this,
      "cndi_azure_subnet_nsg",
      {
        securityRule,
        resourceGroupName: this.rg.name,
        location: this.rg.location!,
        tags,
        name: "cndi_azure_nsg",
      },
    );

    new CDKTFProviderAzure.subnetNetworkSecurityGroupAssociation
      .SubnetNetworkSecurityGroupAssociation(
      this,
      "cndi_azure_subnet_nsg_association",
      {
        subnetId: subnet.id,
        networkSecurityGroupId: cndiNsg.id,
      },
    );

    const nodeList = [];

    let leaderInstance:
      CDKTFProviderAzure.linuxVirtualMachine.LinuxVirtualMachine;

    for (const node of cndi_config.infrastructure.cndi.nodes) {
      const count = node?.count || 1; // count will never be zero, defaults to 1

      let machine_type = node?.machine_type ||
        node?.instance_type ||
        DEFAULT_INSTANCE_TYPES.azure;
      // azure uses 'size' to describe the machine type, oof
      if (
        node?.size &&
        typeof node.size === "string" &&
        !node?.machine_type &&
        !node?.instance_type
      ) {
        machine_type = node.size;
      }

      let diskSizeGb = node?.disk_size_gb ||
        node?.volume_size ||
        DEFAULT_NODE_DISK_SIZE_UNMANAGED;

      if (node?.size && typeof node.size === "number") {
        diskSizeGb = node.size;
      }

      const zone = "1";

      const sourceImageReference = {
        publisher: "canonical",
        offer: "0001-com-ubuntu-server-focal",
        sku: "20_04-lts-gen2",
        version: "latest",
      };

      for (let i = 0; i < count; i++) {
        let role: NodeRole = "controller";

        if (nodeList.length === 0) {
          role = "leader";
        } else if (node?.role === "worker") {
          role = "worker";
        }

        const leader_node_ip = role === "leader"
          ? null
          : leaderInstance!.privateIpAddress;

        const nodeName = `${node.name}-${i}`;

        const osDisk = {
          name: `cndi_${nodeName}_disk`,
          caching: "ReadWrite",
          storageAccountType: "StandardSSD_LRS",
          diskSizeGb,
        };

        const nodePublicIp = new CDKTFProviderAzure.publicIp.PublicIp(
          this,
          `cndi_${nodeName}_public_ip`,
          {
            allocationMethod: "Static",
            sku: "Standard",
            name: `public-ip_${nodeName}`,
            location: this.rg.location,
            resourceGroupName: this.rg.name,
            zones: [zone],
            tags,
          },
        );

        const networkInterface = new CDKTFProviderAzure.networkInterface
          .NetworkInterface(
          this,
          `cndi_azure_network_interface_${nodeName}}`,
          {
            ipConfiguration: [
              {
                name:
                  `cndi_azure_network_interface_ip_configuration_${nodeName}`,
                subnetId: subnet.id,
                publicIpAddressId: nodePublicIp.id,
                privateIpAddressAllocation: "Dynamic",
              },
            ],
            location: this.rg.location,
            resourceGroupName: this.rg.name,
            name: `cndi_azure_network_interface_${nodeName}`,
            tags,
          },
        );

        new CDKTFProviderAzure.networkInterfaceBackendAddressPoolAssociation
          .NetworkInterfaceBackendAddressPoolAssociation(
          this,
          `cndi_azure_lb_backend_address_pool_association_${nodeName}`,
          {
            backendAddressPoolId: backendAddressPool.id,
            networkInterfaceId: networkInterface.id,
            ipConfigurationName: networkInterface.ipConfiguration.get(0).name,
          },
        );

        let userData: string = Fn.base64encode(
          Fn.templatefile("microk8s-cloud-init-controller.yml.tftpl", {
            bootstrap_token: this.locals.bootstrap_token.asString!,
            leader_node_ip,
          }),
        );

        if (role === "leader") {
          userData = Fn.base64encode(
            Fn.templatefile("microk8s-cloud-init-leader.yml.tftpl", {
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
            }),
          );
        } else if (role === "worker") {
          userData = Fn.base64encode(
            Fn.templatefile("microk8s-cloud-init-worker.yml.tftpl", {
              bootstrap_token: this.locals.bootstrap_token.asString!,
              leader_node_ip,
            }),
          );
        }

        const dependsOn = role === "leader" ? [] : [leaderInstance!];

        const cndiInstance:
          CDKTFProviderAzure.linuxVirtualMachine.LinuxVirtualMachine =
            new CDKTFProviderAzure.linuxVirtualMachine.LinuxVirtualMachine(
              this,
              `cndi_azure_virtual_machine_${nodeName}`,
              {
                dependsOn,
                userData,
                name: nodeName,
                location: this.rg.location,
                resourceGroupName: this.rg.name,
                size: machine_type,
                adminUsername: "ubuntu",
                adminPassword: "Password123",
                sourceImageReference,
                disablePasswordAuthentication: false,
                tags,
                osDisk,
                zone,
                networkInterfaceIds: [networkInterface.id],
              },
            );

        if (role === "leader") {
          leaderInstance = cndiInstance;
        }

        nodeList.push({ id: cndiInstance.id, name: nodeName });
      }
    }

    new TerraformOutput(this, "public_host", {
      value: publicIp.ipAddress,
    });

    new TerraformOutput(this, "resource_group", {
      value:
        `https://portal.azure.com/#view/HubsExtension/BrowseResourcesWithTag/tagName/CNDIProject/tagValue/${project_name}`,
    });
  }
}

export async function stageTerraformSynthAzureMicrok8s(
  cndi_config: CNDIConfig,
) {
  const cdktfAppConfig = await getCDKTFAppConfig();
  const app = new App(cdktfAppConfig);
  new AzureMicrok8sStack(app, `_cndi_stack_`, cndi_config);
  await stageCDKTFStack(app);
}
