import { getPrettyJSONString, getTFData } from "src/utils.ts";
export default function getAWSEKSClusterDataTFJSON(): string {
  const data = getTFData("aws_eks_cluster", {
    name: "${aws_eks_cluster.cndi_aws_eks_cluster.name}",
  }, "cndi_data_aws_eks_cluster");
  return getPrettyJSONString(data);
}
