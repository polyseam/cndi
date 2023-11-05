import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getNginxControllerTFJSON(): string {
  const resource = getTFResource("helm_release", {
    chart: "ingress-nginx",
    create_namespace: true,
    depends_on: [
      "module.cndi_aks_cluster",
    ],
    name: "ingress-nginx-public",
    namespace: "ingress-public",
    repository: "https://kubernetes.github.io/ingress-nginx",
    timeout: "600",
    atomic: true,
    set: [
      {
        "name":
          "controller.admissionWebhooks.nodeSelector\\.kubernetes\\.io/os",
        "value": "linux",
      },
      {
        "name":
          "controller.service.annotations.service\\.beta\\.kubernetes\\.io/azure-load-balancer-health-probe-request-path",
        "value": "/healthz",
      },
      {
        "name":
          "controller.admissionWebhooks.patch.nodeSelector\\.kubernetes\\.io/os",
        "value": "linux",
      },
      {
        "name": "defaultBackend.nodeSelector\\.beta\\.kubernetes\\.io/os",
        "value": "linux",
      },
      {
        "name": "controller.ingressClassResource.default",
        "value": "false",
      },
      {
        "name": "controller.ingressClassResource.controllerValue",
        "value": "k8s.io/public-nginx",
      },
      {
        "name": "controller.ingressClassResource.enabled",
        "value": "true",
      },
      {
        "name": "controller.ingressClassResource.name",
        "value": "public",
      },
      {
        "name": "controller.electionID",
        "value": "public-controller-leader",
      },
      {
        "name": "controller.extraArgs.tcp-services-configmap",
        "value": "ingress-public/ingress-nginx-public-controller",
      },
      {
        "name": "rbac.create",
        "value": "false",
      },
    ],
    version: "4.8.3",
  }, "cndi_nginx_controller_helm_chart_public");
  return getPrettyJSONString(resource);
}