import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";
import { ARGOCD_CHART_VERSION } from "versions";

export default function (_cndi_config: CNDIConfig) {
  const depends_on: Array<string> = [];
  const resource = {
    helm_release: {
      cndi_helm_release_argocd: {
        atomic: true,
        chart: "argo-cd",
        cleanup_on_fail: true,
        create_namespace: true,
        depends_on,
        name: "argocd",
        namespace: "argocd",
        replace: true,
        repository: "https://argoproj.github.io/argo-helm",
        set: [
          {
            name: "server.service.annotations.redeployTime",
            value: "${time_static.cndi_time_static_argocd_admin_password.id}",
          },
          {
            name: "configs.secret.argocdServerAdminPasswordMtime",
            value: "${time_static.cndi_time_static_argocd_admin_password.id}",
          },
          {
            name:
              "server.deploymentAnnotations.configmap\\.reloader\\.stakater\\.com/reload",
            value: "argocd-cm",
          },
        ],
        set_sensitive: [
          {
            name: "configs.secret.argocdServerAdminPassword",
            value:
              "${sensitive(sensitive(bcrypt(var.ARGOCD_ADMIN_PASSWORD, 10)))}",
          },
        ],
        timeout: 600,
        version: ARGOCD_CHART_VERSION,
      },
    },
  };
  return getPrettyJSONString({ resource });
}
