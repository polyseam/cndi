import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getNginxControllerTFJSON(
  firstNodeGroupName: string,
): string {
  const resource = getTFResource("helm_release", {
    chart: "ingress-nginx",
    create_namespace: true,
    depends_on: [
      `aws_eks_node_group.cndi_aws_eks_node_group_${firstNodeGroupName}`,
    ],
    name: "ingress-nginx",
    namespace: "ingress",
    repository: "https://kubernetes.github.io/ingress-nginx",
    timeout: "600",
    atomic: true,
    set: [
      {
        name:
          "controller.service.annotations.service\\.beta\\.kubernetes\\.io/aws-load-balancer-type",
        value: "nlb",
      },
      {
        "name": "controller.ingressClassResource.default",
        "value": "true",
      },
      {
        "name": "controller.ingressClassResource.name",
        "value": "public",
      },
      {
        "name": "controller.extraArgs.tcp-services-configmap",
        "value": "ingress/ingress-nginx-controller",
      },
    ],
    version: "4.7.1",
  }, "cndi_nginx_controller_helm_chart");
  return getPrettyJSONString(resource);
}
