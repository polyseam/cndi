interface ProviderDependency {
  [key: string]: {
    source: string;
    version: string;
  };
}

export default function getTerraformTFJSON(deps: ProviderDependency) {
  interface Terraform {
    terraform: {
      required_providers: {
        [key: string]: {
          source: string;
          version: string;
        };
      };
      required_version: string;
    };
  }

  const terraform: Terraform = {
    terraform: {
      required_providers: {
        external: {
          source: "hashicorp/external",
          version: "2.2.2",
        },
        ...deps,
      },
      required_version: ">= 1.2.0",
    },
  };

  return terraform;
}
