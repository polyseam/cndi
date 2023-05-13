import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getEBSCSIDriverTFJSON(): string {
  const resource = getTFResource("helm_release", {
    chart: "aws-ebs-csi-driver",
    create_namespace: true,
    depends_on: ["aws_efs_file_system.cndi_aws_efs_file_system"],
    name: "aws-ebs-csi-driver",
    namespace: "kube-system",
    repository: "https://kubernetes-sigs.github.io/aws-ebs-csi-driver/",
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
    ],
    version: "2.17.2",
  }, "cndi_ebs_driver_helm_chart");
  return getPrettyJSONString(resource);
}
