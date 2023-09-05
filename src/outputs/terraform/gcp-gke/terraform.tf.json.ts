import { getPrettyJSONString } from "src/utils.ts";
import getTerraform from "src/outputs/terraform/shared/basicTerraform.ts";
export default function getGCPTerraformTFJSON() {
  const terraform = getTerraform({
    google: {
      source: "hashicorp/google",
      version: "~> 4.80.0",
    },
    bcrypt: { source: "viktorradnai/bcrypt", version: "0.1.2" },
    external: { source: "hashicorp/external", version: "2.2.2" },
    helm: { source: "hashicorp/helm", version: "2.9.0" },
    kubectl: { source: "gavinbunney/kubectl", version: "1.14.0" },
    kubernetes: { source: "hashicorp/kubernetes", version: "2.19.0" },
    time: { source: "hashicorp/time", version: "0.9.1" },
  });

  return getPrettyJSONString(terraform);
}
