import { getPrettyJSONString, getTFData } from "src/utils.ts";
export default function getTlsCertificateDataTFJSON(): string {
  const data = getTFData("tls_certificate", {
    url: "${aws_eks_cluster.cndi_aws_eks_cluster.identity[0].oidc[0].issuer}",
  });
  return getPrettyJSONString(data);
}
