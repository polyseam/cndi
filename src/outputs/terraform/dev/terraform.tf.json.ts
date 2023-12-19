import { getPrettyJSONString } from "src/utils.ts";

export default function getDevTerraformTFJSON() {
  const terraform = {
    terraform: {
      required_providers: {
        multipass: {
          source: "larstobi/multipass",
          version: "~> 1.4.2",
        },
        external: {
          source: "hashicorp/external",
          version: "2.2.2",
        },
      },
      required_version: ">= 1.2.0",
    },
  };

  return getPrettyJSONString(terraform);
}
