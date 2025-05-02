import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";
import { ccolors } from "deps";

const _label = ccolors.faded("\nsrc/outputs/terraform/terraform.tf.json.ts:");

const REQUIRED_PROVIDERS = {
  aws: {
    aws: {
      source: "hashicorp/aws",
      version: "~> 5.0",
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
      version: "4.23.0",
    },
  },
  dev: {
    multipass: {
      source: "larstobi/multipass",
      version: "1.4.2",
    },
  },
} as const;

const CORE_REQUIRED_PROVIDERS = {
  kubernetes: {
    source: "hashicorp/kubernetes",
    version: "~> 2.0",
  },
  helm: {
    source: "hashicorp/helm",
    version: "~> 3.0",
  },
  tls: {
    source: "hashicorp/tls",
    version: "~> 4.0",
  },
  time: {
    source: "hashicorp/time",
    version: "~> 2.0",
  },
} as const;

export default function getTerraformTfJSON(
  { provider }: CNDIConfig,
): string {
  const terraform = {
    required_providers: {
      ...REQUIRED_PROVIDERS[provider],
      ...CORE_REQUIRED_PROVIDERS,
    },
  };
  // TODO: some variables are not used in every stack
  return getPrettyJSONString({ terraform });
}
