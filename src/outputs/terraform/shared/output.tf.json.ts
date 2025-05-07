import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";
import { ccolors } from "deps";

const _label = ccolors.faded("\nsrc/outputs/terraform/output.tf.json.ts:");

const OUTPUT = {
  get_argocd_port_forward_command: {
    value: "kubectl port-forward svc/argocd-server -n argocd 8080:443",
  },
};

const GET_KUBECONFIG_COMMAND = {
  gcp:
    "gcloud container clusters get-credentials ${local.cndi_project_name} --region ${local.cndi_gcp_region} --project ${local.cndi_gcp_project_id}",
  aws:
    "aws eks update-kubeconfig --region ${local.cndi_aws_region} --name ${local.cndi_project_name}",
  azure:
    "az aks get-credentials --resource-group rg-${local.cndi_project_name} --name cndi-aks-cluster-${local.cndi_project_name} --overwrite-existing",
  dev: "N/A", // TODO: actually solve
};

const RESOURCE_GROUP_URL = {
  gcp:
    "https://console.cloud.google.com/welcome?project=${cndi_gcp_project_id}",
  aws:
    "https://${local.cndi_aws_region}.console.aws.amazon.com/resource-groups/group/cndi-rg_${local.cndi_project_name}",
  azure:
    "https://portal.azure.com/#view/HubsExtension/BrowseResourcesWithTag/tagName/CNDIProject/tagValue/${local.cndi_project_name}",
  dev: "N/A", // TODO: actually solve
};

export default function getTerraformTfJSON(
  { provider }: CNDIConfig,
): string {
  const get_kubeconfig_command = { value: GET_KUBECONFIG_COMMAND[provider] };
  const resource_group_url = { value: RESOURCE_GROUP_URL[provider] };

  return getPrettyJSONString({
    output: {
      ...OUTPUT,
      resource_group_url,
      get_kubeconfig_command,
    },
  });
}
