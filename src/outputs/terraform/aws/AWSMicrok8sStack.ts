import {
  App,
  CDKTFProviderAWS,
  Construct,
  Fn,
  TerraformLocal,
  TerraformOutput,
} from "deps";
import { DEFAULT_INSTANCE_TYPES, DEFAULT_NODE_DISK_SIZE } from "consts";

import {
  getCDKTFAppConfig,
  getUserDataTemplateFileString,
  resolveCNDIPorts,
} from "src/utils.ts";
import { CNDIConfig, NodeRole } from "src/types.ts";
import AWSCoreTerraformStack from "./AWSCoreStack.ts";

const DEFAULT_EC2_AMI = "ami-0c1704bac156af62c";

export class AWSMicrok8sStack extends AWSCoreTerraformStack {
  constructor(scope: Construct, name: string, cndi_config: CNDIConfig) {
    super(scope, name, cndi_config);

    const open_ports = resolveCNDIPorts(cndi_config);
    const nodeIdList: string[] = [];
    const project_name = cndi_config.project_name!;
    const cndiVPC = new CDKTFProviderAWS.vpc.Vpc(this, `cndi_aws_vpc`, {
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
        vpcId: cndiVPC.id,
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
        vpcId: cndiVPC.id,
      },
    );

    let leaderInstance: CDKTFProviderAWS.instance.Instance;

    for (const node of cndi_config.infrastructure.cndi.nodes) {
      let role: NodeRole = nodeIdList.length === 0 ? "leader" : "controller";
      if (node?.role === "worker") {
        role = "worker";
      }

      const user_data = getUserDataTemplateFileString(role);
      const dependsOn = role === "leader" ? [igw] : [leaderInstance!];
      const volumeSize = node?.volume_size ||
        node?.disk_size ||
        node?.disk_size_gb ||
        DEFAULT_NODE_DISK_SIZE;

      const cndiInstance = new CDKTFProviderAWS.instance.Instance(
        this,
        `cndi_aws_instance_${node.name}`,
        {
          userData: user_data,
          tags: { Name: node.name },
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
        },
      );
      if (role === "leader") {
        leaderInstance = cndiInstance;
      }
      nodeIdList.push(cndiInstance.id);
    }

    new TerraformLocal(this, "leader_node_ip", leaderInstance!.privateIp);

    const cndiNLB = new CDKTFProviderAWS.lb.Lb(this, `cndi_aws_lb`, {
      internal: false,
      loadBalancerType: "network",
      subnets: [cndiPrimarySubnet.id],
      tags: {
        Name: `CNDINetworkLB_${project_name}`,
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
            Name: `CNDILBTargetGroupForPort-${port.name}_${project_name}`,
          },
          vpcId: cndiVPC.id,
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
            Name: `CNDILBListenerForPort-${port.name}_${project_name}`,
          },
        },
      );
      let targetIdIndex = 0;
      for (const node of cndi_config.infrastructure.cndi.nodes) {
        const targetId = nodeIdList[targetIdIndex];
        new CDKTFProviderAWS.lbTargetGroupAttachment.LbTargetGroupAttachment(
          this,
          `cndi_aws_lb_target_group_attachment_for_port_${port.name}_${node.name}`,
          {
            port: port.number,
            targetGroupArn: cndiTargetGroup.arn,
            targetId,
          },
        );
        targetIdIndex++;
      }
    }

    new TerraformOutput(this, "cndi_aws_lb_public_host", {
      value: Fn.replace(
        cndiNLB.dnsName,
        this.aws_region_local.asString,
        Fn.upper(this.aws_region_local.asString),
      ),
    });

    new TerraformOutput(this, "cndi_resource_group_url", {
      value:
        "https://${upper(local.aws_region)}.console.aws.amazon.com/resource-groups/group/CNDIResourceGroup_${local.cndi_project_name}?region=${upper(local.aws_region)}",
    });
  }
}

export async function synth(cndi_config: CNDIConfig) {
  const cdktfAppConfig = await getCDKTFAppConfig();
  const app = new App(cdktfAppConfig);
  new AWSMicrok8sStack(app, `cndi_stack`, cndi_config);
  app.synth();
}
