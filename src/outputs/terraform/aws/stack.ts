import { Construct } from "https://esm.sh/v103/constructs@10.1.270";
import { App, TerraformStack } from "https://esm.sh/v103/cdktf@0.15.5";

import {
  provider,
  instance,
  albTargetGroup,
  albTargetGroupAttachment,
  route,
  routeTable,
  vpc,
  subnet,

} from "@cdktf/provider-aws";
import { CNDIConfig, AWSNodeItemSpec } from "../../../../types.ts";

interface SynthGCPComputeEngineStackOptions {
  cndiConfig: CNDIConfig;
  region: string;
  awsNodeItemSpec: AWSNodeItemSpec
}

export default function synthGCPComputeEngine(
  options: SynthGCPComputeEngineStackOptions
) {
  const AWSApp = new App({
    outdir: "cndi/terraform",
  });

  class AWSComputeEngineStack extends TerraformStack {
    constructor(scope: Construct, name: string) {
      super(scope, name);
      const { cndiConfig } = options;

      new provider.AWSProvider(this, "aws", {
        region: options?.region || "us-central1",
        zone: "us-central1-a",
      });
      const DEFAULT_AMI = "ami-0c1704bac156af62c";
      const DEFAULT_INSTANCE_TYPE = "m5a.large";
      const DEFAULT_VOLUME_SIZE = 100;

      cndiConfig.infrastructure.cndi.nodes.map((node: AWSNodeItemSpec) => {
        console.log('adding new node', node.name)
        new instance.Instance(this,
          `cndi_aws_instance_${node.name}`,
          {

            ami: node?.ami || DEFAULT_AMI,
            instance_type: node?.instance_type ||
              node?.machine_type || DEFAULT_INSTANCE_TYPE,
            tags: {
              Name: `${node.name}`,
              CNDIProject: "${local.cndi_project_name}",
              CNDINodeRole: "leader",
            },
            ebs_block_device: [
              {
                device_name: "/dev/sda1",
                volume_size: node?.volume_size || node?.size || DEFAULT_VOLUME_SIZE,
                volume_type: "gp3",
                delete_on_termination: false,
              },
            ],
            subnet_id: "${aws_subnet.subnet[0].id}",
            vpc_security_group_ids: ["${aws_security_group.sg.id}"],
            user_data: '${templatefile("leader_bootstrap_cndi.sh.tftpl",{ "bootstrap_token": "${local.bootstrap_token}", "git_repo": "${local.git_repo}", "git_password": "${local.git_password}", "git_username": "${local.git_username}", "sealed_secrets_private_key": "${local.sealed_secrets_private_key}", "sealed_secrets_public_key": "${local.sealed_secrets_public_key}", "argo_ui_admin_password": "${local.argo_ui_admin_password}" })}',

          },
        );

      });

      const aws_vpc = new vpc.Vpc(this, "cndi_aws_vpc", {
        cidr_block: "${var.vpc_cidr_block}",
        enable_dns_hostnames: "${var.vpc_dns_hostnames}",
        enable_dns_support: "${var.vpc_dns_support}",
        tags: { Name: "VPC", CNDIProject: "${local.cndi_project_name}" },
      });

      cndiConfig.infrastructure.cndi.nodes.map((node: AWSNodeItemSpec) => {
        const aws_lb_target_group_attachment_https = new new albTargetGroupAttachment.AlbTargetGroupAttachment(this, `aws_lb_target_group_attachment_https_${node.name}`, {
          target_group_arn: aws_lb_target_group_https.arn,
          target_id: cndiConfig.infrastructure.cndi.nodes.map((name) =>
            `aws_instance.${name}.self_link`),

        })
      });

      cndiConfig.infrastructure.cndi.nodes.map((node: AWSNodeItemSpec) => {
        const aws_lb_target_group_attachment_http = new new albTargetGroupAttachment.AlbTargetGroupAttachment(this, `aws_lb_target_group_attachment_http_${node.name}`, {
          target_group_arn: aws_lb_target_group_http.arn,
          target_id: cndiConfig.infrastructure.cndi.nodes.map((name) =>
            `aws_instance.${name}.self_link`),

        })
      });
      const aws_lb_target_group_http = new albTargetGroup.AlbTargetGroup(this, "cndi_aws_lb_target_group_http",
        {
          tags: {
            Name: "HTTPLBTargetGroup",
            CNDIProject: "${local.cndi_project_name}",
          },
          port: "${var.tg_http}",
          protocol: "${var.tg_http_proto}",
          vpc_id: aws_vpc.id,
        },
      );
      const aws_lb_target_group_https = new albTargetGroup.AlbTargetGroup(this, "cndi_aws_lb_target_group_https",
        {
          tags: {
            Name: "HTTPSLBTargetGroup",
            CNDIProject: "${local.cndi_project_name}",
          },
          port: "${var.tg_https}",
          protocol: "${var.tg_https_proto}",
          vpc_id: aws_vpc.id,
        }
      );



      const aws_subnet = new subnet.Subnet(this, "cndi_aws_subnet", {
        count: "1",
        availability_zone: "${element(local.availability_zones, count.index)}",
        cidr_block: "${element(var.sbn_cidr_block, count.index)}",
        map_public_ip_on_launch: "${var.sbn_public_ip}",
        tags: { Name: "Subnet", CNDIProject: "${local.cndi_project_name}" },
        vpc_id: aws_vpc.id,
      });
      const aws_route_table = new routeTable.RouteTable(this, "cndi_aws_route_table", {
        tags: { Name: "CNDI Route Table", CNDIProject: "${local.cndi_project_name}" },
        vpc_id: aws_vpc.id,
      });


      const aws_route = new route.Route(this, "cndi_aws_route", {
        route_table_id: aws_route_table.id,
        destination_cidr_block: "${var.destination_cidr_block}",
        gateway_id: "${aws_internet_gateway.igw.id}",
      });


    }
   


  }
}

new ASWComputeEngineStack(GCPApp, "stack");
AWSApp.synth();
}

