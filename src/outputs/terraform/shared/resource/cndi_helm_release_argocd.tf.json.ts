import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";
import { ARGOCD_CHART_VERSION } from "versions";
import { getDependsOnForClusterWithCNDIConfig } from "src/outputs/terraform/shared/utils.ts";

export default function (cndi_config: NormalizedCNDIConfig) {
  const depends_on = getDependsOnForClusterWithCNDIConfig(cndi_config);
  const resource = {
    helm_release: {
      cndi_helm_release_argocd: {
        atomic: true,
        chart: "argo-cd",
        cleanup_on_fail: true,
        create_namespace: true,
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
            value: "${sensitive(bcrypt(var.ARGOCD_ADMIN_PASSWORD, 10))}",
          },
        ],
        depends_on,
        timeout: 600,
        version: ARGOCD_CHART_VERSION,
      },
    },
  };
  return getPrettyJSONString({ resource });
}
