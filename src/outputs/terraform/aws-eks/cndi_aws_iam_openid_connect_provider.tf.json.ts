import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSIamOpenidConnectProviderTFJSON(): string {
  const resource = getTFResource("aws_iam_openid_connect_provider", {
    client_id_list: ["sts.amazonaws.com"],
    thumbprint_list:
      "${data.tls_certificate.cndi_tls_certificate.certificates[*].sha1_fingerprint}",
    url: "${data.tls_certificate.cndi_tls_certificate.url}",
  });
  return getPrettyJSONString(resource);
}
