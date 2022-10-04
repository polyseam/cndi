const CONTROLLER_REPO_SERVER_TIMEOUT_SECONDS = 300;
const CONTROLLER_STATUS_PROCESSORS = 30;
const CONTROLLER_OPERATION_PROCESSORS = 15;

const getArgoCdCmdParamsConfigMap = (): string => {
  return `apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-cmd-params-cm
  labels:
    app.kubernetes.io/name: argocd-cmd-params-cm
    app.kubernetes.io/part-of: argocd
data:
  controller.repo.server.timeout.seconds: "${CONTROLLER_REPO_SERVER_TIMEOUT_SECONDS}"
  # Number of application status processors (default 20)
  controller.status.processors: "${CONTROLLER_STATUS_PROCESSORS}"
  # Number of application operation processors (default 10)
  controller.operation.processors: "${CONTROLLER_OPERATION_PROCESSORS}"`;
};

export default getArgoCdCmdParamsConfigMap;
