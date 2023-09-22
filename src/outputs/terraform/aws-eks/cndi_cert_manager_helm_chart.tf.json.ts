import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getCertManagerTFJSON(): string {
  const resource = getTFResource("helm_release", {
    chart: "cert-manager",
    create_namespace: true,
    depends_on: [
      "module.cndi_aws_eks_cluster",
    ],
    name: "cert-manager",
    namespace: "cert-manager",
    repository: "https://charts.jetstack.io",
    set: [{ name: "installCRDs", value: "true" }],
    version: "1.12.3",
    timeout: "600",
    atomic: true,
  }, "cndi_cert_manager_helm_chart");
  return getPrettyJSONString(resource);
}
