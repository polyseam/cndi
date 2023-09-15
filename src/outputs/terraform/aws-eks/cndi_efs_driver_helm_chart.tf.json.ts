import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getEFSCSIDriverTFJSON(): string {
  const resource = getTFResource("helm_release", {
    chart: "aws-efs-csi-driver",
    create_namespace: true,
    depends_on: ["aws_efs_file_system.cndi_aws_efs_file_system"],
    name: "aws-efs-csi-driver",
    namespace: "kube-system",
    repository: "https://kubernetes-sigs.github.io/aws-efs-csi-driver/",
    timeout: "600",
    atomic: true,
    set: [
      {
        name:
          "controller.serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn",
        value: "${aws_iam_role.cndi_aws_iam_role_web_identity_policy.arn}",
      },
      {
        name: "node.serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn",
        value: "${aws_iam_role.cndi_aws_iam_role_web_identity_policy.arn}",
      },
      { name: "storageClasses[0].name", value: "nfs" },
      { name: "storageClasses[0].provisioner", value: "efs.csi.aws.com " },
      {
        name:
          "storageClasses[0].annotations.storageclass\\.kubernetes\\.io/is-default-class",
        value: '"true"',
      },
      {
        name: "storageClasses[0].parameters.provisioningMode",
        value: "efs-ap",
      },
      {
        name: "storageClasses[0].parameters.gidRangeEnd",
        type: "string",
        value: "2000",
      },
      {
        name: "storageClasses[0].parameters.gidRangeStart",
        type: "string",
        value: "1000",
      },
      {
        name: "storageClasses[0].parameters.fileSystemId",
        value: "${aws_efs_file_system.cndi_aws_efs_file_system.id}",
      },
      {
        name: "storageClasses[0].parameters.directoryPerms",
        type: "string",
        value: "700",
      },
    ],
    version: "2.4.9",
  }, "cndi_efs_driver_helm_chart");
  return getPrettyJSONString(resource);
}
