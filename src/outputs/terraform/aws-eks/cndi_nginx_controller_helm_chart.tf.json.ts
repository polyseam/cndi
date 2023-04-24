import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getNginxControllerTFJSON(): string {
  const resource = getTFResource("helm_release", {
    chart: "ingress-nginx",
    create_namespace: true,
    depends_on: ["aws_eks_node_group.cndi_aws_eks_node_group"],
    name: "ingress-nginx",
    namespace: "ingress",
    repository: "https://kubernetes.github.io/ingress-nginx",
    set: [
      {
        name:
          "controller.service.annotations.service\\.beta\\.kubernetes\\.io/aws-load-balancer-type",
        value: "nlb",
      },
    ],
    version: "4.6.0",
  }, "cndi_nginx_controller_helm_chart");
  return getPrettyJSONString(resource);
}
