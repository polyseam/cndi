import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getCertManagerTFJSON(): string {
  const resource = getTFResource("helm_release", {
    chart: "cert-manager",
    create_namespace: true,
    depends_on: ["aws_eks_node_group.cndi_aws_eks_node_group"],
    name: "cert-manager",
    namespace: "cert-manager",
    repository: "https://charts.jetstack.io",
    set: [{ name: "installCRDs", value: "true" }],
    version: "1.11.1",
    timeout: "600",
    atomic: true,
  }, "cndi_cert_manager_helm_chart");
  return getPrettyJSONString(resource);
}
