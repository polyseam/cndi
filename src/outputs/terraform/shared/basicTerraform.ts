export default function getTerraformTFJSON() {
  interface Terraform {
    required_providers: Array<{
      [key: string]: {
        source: string;
        version: string;
      };
    }>;
    required_version: string;
  }

  const terraform: Terraform = {
    required_providers: [
      {
        external: {
          source: "hashicorp/external",
          version: "2.2.2",
        },
      },
    ],
    required_version: ">= 1.2.0",
  };

  return terraform;
}
