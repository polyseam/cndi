import { getPrettyJSONString, getTFData } from "src/utils.ts";
export default function getAWSEKSClusterAuthDataTFJSON(): string {
  const data = getTFData("aws_eks_cluster_auth", {
    name: "${aws_eks_cluster.cndi_aws_eks_cluster.name}",
  });
  return getPrettyJSONString(data);
}
