import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getNginxControllerTFJSON(): string {
  const resource = getTFResource("helm_release", {
    chart: "ingress-nginx",
    create_namespace: true,
    depends_on: [
      "module.cndi_gke_cluster",
    ],
    name: "ingress-nginx",
    namespace: "ingress",
    repository: "https://kubernetes.github.io/ingress-nginx",
    timeout: "600",
    atomic: true,
    set: [
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
      {
        "name": "controller.service.loadBalancerIP",
        "value":
          "${google_compute_address.cndi_google_compute_address.address}",
      },
    ],
    version: "4.7.1",
  }, "cndi_nginx_controller_helm_chart");
  return getPrettyJSONString(resource);
}
