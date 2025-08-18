import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { getPrettyJSONString } from "src/utils.ts";
import { ccolors } from "deps";

const _label = ccolors.faded("\nsrc/outputs/terraform/terraform.tf.json.ts:\n");

const REQUIRED_PROVIDERS = {
  aws: {
    aws: {
      source: "hashicorp/aws",
      version: "5.91.0",
    },
  },
  gcp: {
    google: {
      source: "google",
      version: "6.25.0",
    },
  },
  azure: {
    azurerm: {
      source: "azurerm",
      version: "4.27.0",
    },
  },
  bare: {
    tailscale: { source: "tailscale/tailscale", version: "~> 0.21" },
    local: {},
    null: {},
  },
  dev: {
    multipass: {
      source: "larstobi/multipass",
      version: "1.4.2",
    },
    local: {
      source: "hashicorp/local",
      version: "2.5.2",
    },
    random: {
      source: "hashicorp/random",
      version: "3.7.1",
    },
    kubernetes: undefined,
    helm: undefined,
  },
} as const;

const CORE_REQUIRED_PROVIDERS = {
  helm: {
    source: "helm",
    version: "2.17.0",
  },
  kubernetes: {
    source: "kubernetes",
    version: "2.36.0",
  },
  time: {
    source: "hashicorp/time",
    version: "0.13.0",
  },
  tls: {
    source: "hashicorp/tls",
    version: "4.0.6",
  },
} as const;

export default function getTerraformTfJSON(
  { provider }: NormalizedCNDIConfig,
): string {
  const terraform = {
    required_providers: {
      ...CORE_REQUIRED_PROVIDERS,
      ...REQUIRED_PROVIDERS[provider],
    },
  };
  // TODO: some variables are not used in every stack
  return getPrettyJSONString({ terraform });
}
