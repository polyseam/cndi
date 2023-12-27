import {
  App,
  Construct,
  Fn,
  stageCDKTFStack,
  TerraformOutput,
} from "cdktf-deps";

import { CDKTFProviderAWS } from "./deps.ts";

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
import AWSCoreTerraformStack from "./AWSCoreStack.ts";

const DEFAULT_EC2_AMI = "ami-0c1704bac156af62c";

export class AWSMicrok8sStack extends AWSCoreTerraformStack {
  constructor(scope: Construct, name: string, cndi_config: CNDIConfig) {
    super(scope, name, cndi_config);
    const project_name = this.locals.cndi_project_name.asString;
    const open_ports = resolveCNDIPorts(cndi_config);
    const nodeList: Array<{ name: string; id: string }> = [];

    const vpc = new CDKTFProviderAWS.vpc.Vpc(this, `cndi_aws_vpc`, {
      cidrBlock: "10.0.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `CNDIVPC_${project_name}`,
      },
    });

    const igw = new CDKTFProviderAWS.internetGateway.InternetGateway(
      this,
      `cndi_aws_internet_gateway`,
      {
        tags: {
          Name: `CNDIInternetGateway_${project_name}`,
        },
        vpcId: vpc.id,
      },
    );

    // TODO: should this be further filtered according to instance_type avaiability?
    const availabilityZones = new CDKTFProviderAWS.dataAwsAvailabilityZones
      .DataAwsAvailabilityZones(
      this,
      "available-zones",
      {
        state: "available",
      },
    );

    const cndiPrimarySubnet = new CDKTFProviderAWS.subnet.Subnet(
      this,
      `cndi_aws_subnet`,
      {
        availabilityZone: Fn.element(availabilityZones.names, 0),
        cidrBlock: "10.0.1.0/24",
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `CNDIPrimarySubnet_${project_name}`,
        },
        vpcId: vpc.id,
      },
    );

    const routeTable = new CDKTFProviderAWS.routeTable.RouteTable(
      this,
      `cndi_aws_route_table`,
      {
        tags: {
          Name: `CNDIRouteTable_${project_name}`,
        },
        vpcId: vpc.id,
      },
    );

    const _routeTableAssociation = new CDKTFProviderAWS.routeTableAssociation
      .RouteTableAssociation(
      this,
      "cndi_aws_route_table_association",
      {
        count: 1,
        routeTableId: routeTable.id,
        subnetId: cndiPrimarySubnet.id,
      },
    );

    const _route = new CDKTFProviderAWS.route.Route(this, `cndi_aws_route`, {
      dependsOn: [routeTable],
      routeTableId: routeTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: igw.id,
    });

    const securityGroupIngresses = [
      {
        cidrBlocks: ["10.0.0.0/16"],
        description:
          "Inbound rule that enables traffic between EC2 instances in the VPC ",
        fromPort: 0,
        ipv6CidrBlocks: [],
        prefixListIds: [],
        protocol: "-1",
        securityGroups: [],
        self: false,
        toPort: 0,
      },
    ];

    open_ports.forEach((port) => {
      securityGroupIngresses.push({
        cidrBlocks: ["0.0.0.0/0"],
        description: `Port for ${port.name} traffic`,
        fromPort: port.number,
        ipv6CidrBlocks: [],
        prefixListIds: [],
        protocol: "tcp",
        securityGroups: [],
        self: false,
        toPort: port.number,
      });
    });

    const securityGroup = new CDKTFProviderAWS.securityGroup.SecurityGroup(
      this,
      `cndi_aws_security_group`,
      {
        description: "Security firewall",
        vpcId: vpc.id,
        ingress: securityGroupIngresses,
        egress: [
          {
            cidrBlocks: ["0.0.0.0/0"],
            description: "All traffic",
            fromPort: 0,
            ipv6CidrBlocks: [],
            prefixListIds: [],
            protocol: "-1",
            securityGroups: [],
            toPort: 0,
          },
        ],
        tags: {
          Name: `CNDISecurityGroup_${project_name}`,
        },
      },
    );

    const instances = [];

    for (const node of cndi_config.infrastructure.cndi.nodes) {
      let role: NodeRole = instances.length === 0 ? "leader" : "controller";
      if (node?.role === "worker") {
        role = "worker";
      }

      let userData;

      if (role === "leader") {
        if (useSshRepoAuth()) {
          userData = Fn.templatefile(
            "microk8s-cloud-init-leader-ssh.yml.tftpl",
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
          leader_node_ip: instances[0]!.privateIp,
        });
      } else {
        userData = Fn.templatefile("microk8s-cloud-init-controller.yml.tftpl", {
          bootstrap_token: this.locals.bootstrap_token.asString!,
          leader_node_ip: instances[0]!.privateIp,
        });
      }

      const count = node?.count || 1; // count will never be zero, defaults to 1

      // deno-lint-ignore no-explicit-any
      const dependsOn: Array<any> = role === "leader" ? [igw] : [instances[0]];
      const volumeSize = node?.volume_size ||
        node?.disk_size ||
        node?.disk_size_gb ||
        DEFAULT_NODE_DISK_SIZE_UNMANAGED;

      for (let i = 0; i < count; i++) {
        const nodeName = `${node.name}-${i}`;
        instances.push(
          new CDKTFProviderAWS.instance.Instance(
            this,
            `cndi_aws_instance_${node.name}_${i}`,
            {
              userData,
              tags: { Name: nodeName },
              dependsOn,
              ami: DEFAULT_EC2_AMI,
              instanceType: node?.instance_type || DEFAULT_INSTANCE_TYPES.aws,
              rootBlockDevice: {
                volumeType: "gp3",
                volumeSize,
                deleteOnTermination: true,
              },
              userDataReplaceOnChange: false,
              subnetId: cndiPrimarySubnet.id,
              vpcSecurityGroupIds: [securityGroup.id],
            },
          ),
        );
      }
    }

    const cndiNLB = new CDKTFProviderAWS.lb.Lb(this, `cndi_aws_lb`, {
      internal: false,
      loadBalancerType: "network",
      subnets: [cndiPrimarySubnet.id],
      tags: {
        Name: `cndi-nlb_${project_name}`,
      },
    });

    for (const port of open_ports) {
      const cndiTargetGroup = new CDKTFProviderAWS.lbTargetGroup.LbTargetGroup(
        this,
        `cndi_aws_lb_target_group_for_port_${port.name}`,
        {
          port: port.number,
          protocol: "TCP",
          tags: {
            Name: `cndi-lb-target-group_${port.name}_${project_name}`,
          },
          vpcId: vpc.id,
        },
      );

      const _cndiListener = new CDKTFProviderAWS.lbListener.LbListener(
        this,
        `cndi_aws_lb_listener_for_port_${port.name}`,
        {
          defaultAction: [
            {
              type: "forward",
              targetGroupArn: cndiTargetGroup.arn,
            },
          ],
          loadBalancerArn: cndiNLB.arn,
          port: port.number,
          protocol: "TCP",
          tags: {
            Name: `cndi-lb-listener_for_${port.name}_${project_name}`,
          },
        },
      );
      for (const target of nodeList) {
        new CDKTFProviderAWS.lbTargetGroupAttachment.LbTargetGroupAttachment(
          this,
          `cndi_aws_lb_target_group_attachment_for_port_${port.name}_${target.name}`,
          {
            port: port.number,
            targetGroupArn: cndiTargetGroup.arn,
            targetId: target.id,
          },
        );
      }
    }

    new TerraformOutput(this, "public_host", {
      value: Fn.replace(
        cndiNLB.dnsName,
        this.locals.aws_region.asString,
        Fn.upper(this.locals.aws_region.asString),
      ),
    });

    new TerraformOutput(this, "resource_group_url", {
      value: `https://${
        Fn.upper(this.locals.aws_region.asString)
      }.console.aws.amazon.com/resource-groups/group/cndi-rg_${project_name}?region=${
        Fn.upper(this.locals.aws_region.asString)
      }`,
    });
  }
}

export async function stageTerraformSynthAWSMicrok8s(cndi_config: CNDIConfig) {
  const cdktfAppConfig = await getCDKTFAppConfig();
  const app = new App(cdktfAppConfig);
  new AWSMicrok8sStack(app, `_cndi_stack_`, cndi_config);

  // write terraform stack to staging directory
  await stageCDKTFStack(app);

  const input: TFBlocks = {
    ...cndi_config?.infrastructure?.terraform,
  };

  // patch cdk.tf.json with user's terraform pass-through
  await patchAndStageTerraformFilesWithInput(input);
}
