import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";
import { ccolors } from "deps";

const _label = ccolors.faded("\nsrc/outputs/terraform/output.tf.json.ts:\n");

type Outputs = Record<string, { value: string }>;

function getOutputsForProvider(
  cndi_config: CNDIConfig,
): Outputs {
  const { provider } = cndi_config;
  const get_argocd_port_forward_command = {
    value: "kubectl port-forward svc/argocd-server -n argocd 8080:443",
  };

  switch (provider) {
    case "gcp":
      return {
        get_argocd_port_forward_command,
        get_kubeconfig_command: {
          value:
            "gcloud container clusters get-credentials ${local.cndi_project_name} --region ${local.cndi_gcp_region} --project ${local.cndi_gcp_project_id}",
        },
        resource_group_url: {
          value:
            "https://console.cloud.google.com/welcome?project=${local.cndi_gcp_project_id}",
        },
      };
    case "aws":
      return {
        get_argocd_port_forward_command,
        get_kubeconfig_command: {
          value:
            "aws eks update-kubeconfig --region ${local.cndi_aws_region} --name ${local.cndi_project_name}",
        },
        resource_group_url: {
          value:
            "https://${local.cndi_aws_region}.console.aws.amazon.com/resource-groups/group/cndi-rg_${local.cndi_project_name}",
        },
      };
    case "azure":
      // az aks get-credentials --resource-group rg-cndi-json-aks --name cndi-aks-json-aks-aks --overwrite-existing
      return {
        get_argocd_port_forward_command,
        get_kubeconfig_command: {
          value:
            "az aks get-credentials --resource-group  ${azurerm_resource_group.cndi_azurerm_resource_group.name} --name ${module.cndi_azurerm_aks_module.aks_name} --overwrite-existing",
        },
        resource_group_url: {
          value:
            "https://portal.azure.com/#view/HubsExtension/BrowseResourcesWithTag/tagName/CNDIProject/tagValue/${local.cndi_project_name}",
        },
      };
    case "dev": {
      const [node] = cndi_config.infrastructure.cndi.nodes;
      return {
        cndi_dev_tutorial: {
          value: `Accessing ArgoCD UI
1. Get the IP address of the node
  run: multipass exec ${node.name} -- ip route get 1.2.3.4 | awk '{print $7}' | tr -d '\\n'

2. Port forward the argocd-server service
  run: multipass exec ${node.name} -- sudo microk8s kubectl port-forward svc/argocd-server -n argocd 8080:443 --address <ip address of node>
  
3. Login in the browser
  open: https://<ip address of node>:8080 in your browser to access the argocd UI`,
        },
      };
    }
    default:
      throw "Unsupported provider";
  }
}

export default function getOutputTfJSON(
  cndi_config: CNDIConfig,
): string {
  const output = getOutputsForProvider(cndi_config);
  return getPrettyJSONString({
    output,
  });
}
