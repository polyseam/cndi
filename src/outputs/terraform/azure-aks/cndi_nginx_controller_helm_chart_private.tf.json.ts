import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getNginxControllerTFJSON(): string {
  const resource = getTFResource("helm_release", {
    chart: "ingress-nginx",
    create_namespace: true,
    depends_on: [
      "module.cndi_aks_cluster",
    ],
    name: "ingress-nginx-private",
    namespace: "ingress-private",
    repository: "https://kubernetes.github.io/ingress-nginx",
    timeout: "600",
    atomic: true,
    set: [
      {
        "name":
          "controller.service.annotations.service\\.beta\\.kubernetes\\.io/azure-load-balancer-internal",
        "value": "true",
      },
      {
        "name":
          "controller.service.annotations.service\\.beta\\.kubernetes\\.io/azure-load-balancer-health-probe-request-path",
        "value": "/healthz",
      },
      {
        "name":
          "controller.admissionWebhooks.nodeSelector\\.kubernetes\\.io/os",
        "value": "linux",
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
        "value": "k8s.io/private-nginx",
      },
      {
        "name": "controller.ingressClassResource.enabled",
        "value": "true",
      },
      {
        "name": "controller.ingressClassResource.name",
        "value": "private",
      },
      {
        "name": "controller.electionID",
        "value": "private-controller-leader",
      },
      {
        "name": "controller.extraArgs.tcp-services-configmap",
        "value": "ingress-private/ingress-nginx-private-controller",
      },
      {
        "name": "rbac.create",
        "value": "false",
      },
    ],
    version: "4.8.3",
  }, "cndi_nginx_controller_helm_chart_private");
  return getPrettyJSONString(resource);
}
