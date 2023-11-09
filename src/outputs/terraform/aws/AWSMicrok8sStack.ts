import { App, CDKTFProviderAWS, Construct, Fn, TerraformOutput } from "deps";

import {
  getCDKTFAppConfig,
  getUserDataTemplateFileString,
  resolveCNDIPorts,
} from "src/utils.ts";
import { CNDIConfig } from "src/types.ts";
import AWSCoreTerraformStack from "./AWSCoreStack.ts";

export class AWSMicrok8sStack extends AWSCoreTerraformStack {
  constructor(scope: Construct, name: string, cndi_config: CNDIConfig) {
    super(scope, name, cndi_config);

    const open_ports = resolveCNDIPorts(cndi_config);
    const nodeIdList: string[] = [];
    const project_name = cndi_config.project_name!;

    new CDKTFProviderAWS.resourcegroupsGroup.ResourcegroupsGroup(
      this,
      `cndi_aws_resource_group`,
      {
        name: `CNDIResourceGroup_${project_name}`,
        tags: {
          Name: `CNDIResourceGroup_${project_name}`,
        },
      },
    );

    for (const node of cndi_config.infrastructure.cndi.nodes) {
      const role = nodeIdList.length === 0 ? "leader" : "controller";
      const user_data = getUserDataTemplateFileString(role);

      const cndiInstance = new CDKTFProviderAWS.instance.Instance(
        this,
        `cndi_aws_instance_${node.name}`,
        {
          userData: user_data,
          tags: { Name: node.name },
        },
      );
      nodeIdList.push(cndiInstance.id);
    }

    // TODO: should this be further filtered according to instance_type avaiability?
    const availabilityZones = new CDKTFProviderAWS.dataAwsAvailabilityZones
      .DataAwsAvailabilityZones(
      this,
      "available-zones",
      {
        state: "available",
      },
    );

    const cndiVPC = new CDKTFProviderAWS.vpc.Vpc(this, `cndi_aws_vpc`, {
      cidrBlock: "10.0.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `CNDIVPC_${project_name}`,
      },
    });

    const cndiPrimarySubnet = new CDKTFProviderAWS.subnet.Subnet(
      this,
      `cndi_aws_subnet`,
      {
        count: 1,
        availabilityZone: Fn.element(availabilityZones.names, 0),
        cidrBlock: "10.0.1.0/24",
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `CNDIPrimarySubnet_${project_name}`,
        },
        vpcId: cndiVPC.id,
      },
    );

    const cndiNLB = new CDKTFProviderAWS.lb.Lb(this, `cndi_aws_lb`, {
      internal: false,
      loadBalancerType: "network",
      subnets: [cndiPrimarySubnet.id],
      tags: {
        Name: `CNDINetworkLB_${project_name}}`,
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
      value: cndiNLB.dnsName,
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
  new AWSMicrok8sStack(app, `${cndi_config.project_name}`, cndi_config);
  app.synth();
}
