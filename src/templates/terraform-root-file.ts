import { getPrettyJSONString } from "../utils.ts";
import {
  BaseNodeEntrySpec,
  CNDINodesSpec,
  NodeKind,
  AWSTerraformProviderConfiguration,
  TerraformDependencies,
} from "../types.ts";

import terraformRootFileData from "./data/terraform-root-file-data.ts";

const awsTerraformProviderConfiguration: AWSTerraformProviderConfiguration = {
  profile: "default",
  region: Deno.env.get("AWS_REGION") || "us-east-1",
};

const terraformDependencies: TerraformDependencies = {
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

const awsTerraformProviderDependency = {
  aws: {
    source: "hashicorp/aws",
    version: "~> 4.16",
  },
};

const provider = {
  aws: [awsTerraformProviderConfiguration],
};

const getTerraformRootFile = (cndiNodesSpec: CNDINodesSpec): string => {
  const providersRequired = new Set(
    cndiNodesSpec.entries.map((entry: BaseNodeEntrySpec) => {
      return entry.kind as NodeKind;
    })
  );

  const mainTerraformFileObject = { ...terraformRootFileData };

  mainTerraformFileObject.provider = {
    ...mainTerraformFileObject.provider,
    ...provider,
  };

  // add parts of main.tf file that are required if kind===aws
  if (providersRequired.has(NodeKind.aws)) {
    const region = cndiNodesSpec.deploymentTargetConfiguration.aws?.region;

    // add aws provider configuration
    mainTerraformFileObject.provider.aws =
      provider.aws as Array<AWSTerraformProviderConfiguration>;
    mainTerraformFileObject.provider.aws[0].region =
      region ?? awsTerraformProviderConfiguration.region;

      // add aws provider dependency
    terraformDependencies.required_providers[0].aws =
      awsTerraformProviderDependency.aws;

    mainTerraformFileObject.terraform = [terraformDependencies];
  }

  return getPrettyJSONString(mainTerraformFileObject);
};

export default getTerraformRootFile;
