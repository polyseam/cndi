import { Construct } from "https://esm.sh/constructs@10.1.292";
import {
  App,
  Fn,
  ITerraformDependable,
  TerraformStack,
} from "https://esm.sh/cdktf@0.15.5";
import { Instance } from "https://esm.sh/@cdktf/provider-aws@12.0.12/lib/instance";
import { AwsProvider } from "https://esm.sh/@cdktf/provider-aws@12.0.12/lib/provider";
import { Subnet } from "https://esm.sh/@cdktf/provider-aws@12.0.12/lib/subnet";
import { Vpc } from "https://esm.sh/@cdktf/provider-aws@12.0.12/lib/vpc";
import { ccolors, path } from "deps";
import { AWSNodeItemSpec, CNDIConfig } from "src/types.ts";
import data from "src/outputs/terraform/aws/data.tf.json.ts";
import cndi_aws_provider from "src/outputs/terraform/aws/provider.tf.json.ts";
import terraform from "src/outputs/terraform/aws/terraform.tf.json.ts";
import cndi_aws_lb_target_group_attachment_http from "src/outputs/terraform/aws/cndi_aws_lb_target_group_attachment_http.tf.json.ts";
import cndi_aws_lb_target_group_attachment_https from "src/outputs/terraform/aws/cndi_aws_lb_target_group_attachment_https.tf.json.ts";
import cndi_aws_instance from "src/outputs/terraform/aws/cndi_aws_instance.tf.json.ts";
import cndi_aws_internet_gateway from "src/outputs/terraform/aws/cndi_aws_internet_gateway.tf.json.ts";
import cndi_aws_lb_listener_http from "src/outputs/terraform/aws/cndi_aws_lb_listener_http.tf.json.ts";
import cndi_aws_lb_listener_https from "src/outputs/terraform/aws/cndi_aws_lb_listener_https.tf.json.ts";
import cndi_aws_lb_target_group_http from "src/outputs/terraform/aws/cndi_aws_lb_target_group_http.tf.json.ts";
import cndi_aws_lb_target_group_https from "src/outputs/terraform/aws/cndi_aws_lb_target_group_https.tf.json.ts";
import cndi_aws_lb from "src/outputs/terraform/aws/cndi_aws_lb.tf.json.ts";
import cndi_aws_route_table_association from "src/outputs/terraform/aws/cndi_aws_route_table_association.tf.json.ts";
import cndi_aws_route_table from "src/outputs/terraform/aws/cndi_aws_route_table.tf.json.ts";
import cndi_aws_route from "src/outputs/terraform/aws/cndi_aws_route.tf.json.ts";
import cndi_aws_security_group from "src/outputs/terraform/aws/cndi_aws_security_group.tf.json.ts";
import cndi_aws_subnet from "src/outputs/terraform/aws/cndi_aws_subnet.tf.json.ts";
import cndi_aws_vpc from "src/outputs/terraform/aws/cndi_aws_vpc.tf.json.ts";
import cndi_aws_locals from "src/outputs/terraform/aws/locals.tf.json.ts";
import validateConfig from "../../../../validate/cndiConfig.ts";
import { getStagingDir } from "../../../../utils.ts";
import getAWSSubnetTFJSON from "../cndi_aws_subnet.tf.json.ts";

class AWSEC2Stack extends TerraformStack {
  cndi_aws_provider: AwsProvider;
  cndi_vpc: Vpc;
  cndi_aws_subnet: Subnet;
  project_name?: string;

  constructor(scope: Construct, id: string, config: CNDIConfig) {
    super(scope, id);
    this.project_name = config.project_name || "cndi-project";
    const DEFAULT_AMI = "ami-0c1704bac156af62c";
    const DEFAULT_INSTANCE_TYPE = "m5a.large";
    const DEFAULT_VOLUME_SIZE = 100;

    const region = (Deno.env.get("AWS_REGION") as string) || "us-east-1";

    this.cndi_aws_provider = cndi_aws_provider(this as any, "cndi_aws_provider", {region})
    this.cndi_vpc = cndi_aws_vpc(this as any, "cndi_aws_vpc")
    this.cndi_aws_subnet = cndi_aws_subnet(this as any, "cndi_aws_subnet", {
      vpcId: this.cndi_vpc.id,
    })
    this.data = data(this as any, "data", {})
    this.cndi_aws_locals = cndi_aws_locals(this as any, "cndi_aws_locals", {})


    const leaderNodeSpec = config.infrastructure.cndi.nodes.find(
      (n) => n.role === "leader",
    ) as AWSNodeItemSpec;

    const leaderNode = new Instance(
      this as any,
      `cndi_aws_instance_${leaderNodeSpec.name}`,
      {
        ami: DEFAULT_AMI,
        instanceType: leaderNodeSpec?.instance_type ||
          leaderNodeSpec?.machine_type ||
          DEFAULT_INSTANCE_TYPE,
        userData: Fn.templatefile("leader_bootstrap_cndi.sh.tftpl", {
          bootstrapToken: "${local.bootstrap_token}",
          git_repo: "${var.git_repo}",
          git_password: "${var.git_password}",
          git_username: "${var.git_username}",
          sealed_secrets_private_key: "${var.sealed_secrets_private_key}",
          sealed_secrets_public_key: "${var.sealed_secrets_public_key}",
          argocd_admin_password: "${var.argocd_admin_password}",
        }),
        ebsBlockDevice: [{
          deviceName: "/dev/sda1",
          volumeSize: leaderNodeSpec?.volume_size || leaderNodeSpec?.size ||
            DEFAULT_VOLUME_SIZE,
          volumeType: "gp3",
          deleteOnTermination: false,
        }],
      },
    );

    for (const node of config.infrastructure.cndi.nodes) {
      if (node.role === "leader") continue;
      const { name, role } = node;

      const ami = node?.ami || DEFAULT_AMI;
      const instanceType = node?.instance_type || node?.machine_type ||
        DEFAULT_INSTANCE_TYPE;
      const delete_on_termination = false;
      const device_name = "/dev/sda1";
      const volume_size = node?.volume_size || node?.size ||
        DEFAULT_VOLUME_SIZE; //GiB
      const volume_type = "gp3"; // general purpose SSD
      const subnet_id = `\${aws_subnet.cndi_aws_subnet[0].id}`;
      const vpc_security_group_ids = [
        "${aws_security_group.cndi_aws_security_group.id}",
      ];
      const ebs_block_device = [
        {
          device_name,
          // volume_size,
          volume_type,
          delete_on_termination,
        },
      ];
      const leaderAWSInstance =
        `aws_instance.cndi_aws_instance_${leaderNode.name}`;
      const leader_user_data =
        '${templatefile("leader_bootstrap_cndi.sh.tftpl",{ "bootstrap_token": "${local.bootstrap_token}", "git_repo": "${var.git_repo}", "git_password": "${var.git_password}", "git_username": "${var.git_username}", "sealed_secrets_private_key": "${var.sealed_secrets_private_key}", "sealed_secrets_public_key": "${var.sealed_secrets_public_key}", "argocd_admin_password": "${var.argocd_admin_password}" })}';
      const controller_user_data =
        '${templatefile("controller_bootstrap_cndi.sh.tftpl",{"bootstrap_token": "${local.bootstrap_token}", "leader_node_ip": "${local.leader_node_ip}"})}';
      const userData = role === "leader"
        ? leader_user_data
        : controller_user_data;

      const dependsOn = role !== "leader"
        ? [{ fqn: leaderAWSInstance }] as Array<ITerraformDependable>
        : [] as Array<ITerraformDependable>;

      new Instance(this as any, `cndi_aws_instance_${name}`, {
        ami,
        instanceType,
        userData,
        dependsOn: [leaderNode],
      });
    }
  }
}

export default async function stageTerraformResourcesForAWS(
  config: CNDIConfig,
) {
  await validateConfig(config, "?");
  const stagingDirectory = await getStagingDir()!;
  const outdir = path.join(stagingDirectory, "cndi", "terraform");
  await Deno.mkdir(outdir, { recursive: true });
  const app = new App({
    outdir,
  });

  const cndiAwsEc2Stack = new AWSEC2Stack(app, "cndi", config);
  app.synth();

  //   const leader_node_ip =
  //     `\${aws_instance.cndi_aws_instance_${leaderNodeName}.private_ip}`;

  //   const stageNodes = config.infrastructure.cndi.nodes.map((node) =>
  //     stageFile(
  //       path.join(
  //         "cndi",
  //         "terraform",
  //         `cndi_aws_instance_${node.name}.tf.json`,
  //       ),
  //       cndi_aws_instance(node, leaderNodeName),
  //     )
  //   );

  //   const stageLbTargetGroupAttachmentHTTP = config.infrastructure.cndi.nodes.map(
  //     (node) =>
  //       stageFile(
  //         path.join(
  //           "cndi",
  //           "terraform",
  //           `cndi_aws_lb_target_group_attachment_http_${node.name}.tf.json`,
  //         ),
  //         cndi_aws_lb_target_group_attachment_http(node),
  //       ),
  //   );

  //   const stageLbTargetGroupAttachmentHTTPS = config.infrastructure.cndi.nodes
  //     .map(
  //       (node) =>
  //         stageFile(
  //           path.join(
  //             "cndi",
  //             "terraform",
  //             `cndi_aws_lb_target_group_attachment_https_${node.name}.tf.json`,
  //           ),
  //           cndi_aws_lb_target_group_attachment_https(node),
  //         ),
  //     );

  //   // stage all the terraform files at once
  //   try {
  //     await Promise.all([
  //       ...stageNodes,
  //       ...stageLbTargetGroupAttachmentHTTP,
  //       ...stageLbTargetGroupAttachmentHTTPS,
  //       stageFile(
  //         path.join("cndi", "terraform", "data.tf.json"),
  //         data(config.infrastructure.cndi.nodes as Array<AWSNodeItemSpec>),
  //       ),
  //       stageFile(
  //         path.join("cndi", "terraform", "locals.tf.json"),
  //         cndi_aws_locals({
  //           leader_node_ip,
  //           aws_region,
  //           nodes: config.infrastructure.cndi.nodes,
  //         }),
  //       ),
  //       stageFile(
  //         path.join("cndi", "terraform", "provider.tf.json"),
  //         provider(),
  //       ),
  //       stageFile(
  //         path.join("cndi", "terraform", "terraform.tf.json"),
  //         terraform(),
  //       ),
  //       stageFile(
  //         path.join(
  //           "cndi",
  //           "terraform",
  //           "cndi_aws_internet_gateway.tf.json",
  //         ),
  //         cndi_aws_internet_gateway(),
  //       ),
  //       stageFile(
  //         path.join(
  //           "cndi",
  //           "terraform",
  //           "cndi_aws_lb_target_group_http.tf.json",
  //         ),
  //         cndi_aws_lb_target_group_http(),
  //       ),
  //       stageFile(
  //         path.join(
  //           "cndi",
  //           "terraform",
  //           "cndi_aws_lb_target_group_https.tf.json",
  //         ),
  //         cndi_aws_lb_target_group_https(),
  //       ),
  //       stageFile(
  //         path.join(
  //           "cndi",
  //           "terraform",
  //           "cndi_aws_lb_listener_http.tf.json",
  //         ),
  //         cndi_aws_lb_listener_http(),
  //       ),
  //       stageFile(
  //         path.join("cndi", "terraform", "cndi_aws_lb_listener_https.tf.json"),
  //         cndi_aws_lb_listener_https(),
  //       ),
  //       stageFile(
  //         path.join(
  //           "cndi",
  //           "terraform",
  //           "cndi_aws_lb.tf.json",
  //         ),
  //         cndi_aws_lb(),
  //       ),
  //       stageFile(
  //         path.join(
  //           "cndi",
  //           "terraform",
  //           "cndi_aws_route_table_association.tf.json",
  //         ),
  //         cndi_aws_route_table_association(),
  //       ),
  //       stageFile(
  //         path.join(
  //           "cndi",
  //           "terraform",
  //           "cndi_aws_route_table.tf.json",
  //         ),
  //         cndi_aws_route_table(),
  //       ),
  //       stageFile(
  //         path.join("cndi", "terraform", "cndi_aws_route.tf.json"),
  //         cndi_aws_route(),
  //       ),
  //       stageFile(
  //         path.join(
  //           "cndi",
  //           "terraform",
  //           "cndi_aws_security_group.tf.json",
  //         ),
  //         cndi_aws_security_group(),
  //       ),
  //       stageFile(
  //         path.join("cndi", "terraform", "cndi_aws_subnet.tf.json"),
  //         cndi_aws_subnet(),
  //       ),
  //       stageFile(
  //         path.join(
  //           "cndi",
  //           "terraform",
  //           "cndi_aws_vpc.tf.json",
  //         ),
  //         cndi_aws_vpc(),
  //       ),
  //     ]);
  //   } catch (e) {
  //     console.error(ccolors.error("failed to stage terraform resources"));
  //     console.log(ccolors.caught(e));
  //     await emitExitEvent(800);
  //     Deno.exit(800);
  //   }
}
