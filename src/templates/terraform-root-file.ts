import { getPrettyJSONString } from "../utils.ts";
import {
  BaseNodeEntrySpec,
  CNDINodesSpec,
  NodeKind,
  TerraformDependencies,
} from "../types.ts";

import terraformRootFileData from "./data/terraform-root-file-data.ts";

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

const getTerraformRootFile = (cndiNodesSpec: CNDINodesSpec): string => {
  const controllerName = cndiNodesSpec.entries.find(
    (entry) => (entry.role === "controller"),
  )?.name as string;

  const providersRequired = new Set(
    cndiNodesSpec.entries.map((entry: BaseNodeEntrySpec) => {
      return entry.kind as NodeKind;
    }),
  );

  const mainTerraformFileObject = { ...terraformRootFileData };

  mainTerraformFileObject.locals[0].controller_node_ip =
    `aws_instance.${controllerName}.private_ip`;

  // add parts of setup-cndi.tf file that are required if kind===aws
  if (providersRequired.has(NodeKind.aws)) {
    // add aws provider dependency
    terraformDependencies.required_providers[0].aws =
      awsTerraformProviderDependency.aws;

    mainTerraformFileObject.terraform = [terraformDependencies];
  }

  return getPrettyJSONString(mainTerraformFileObject);
};

export default getTerraformRootFile;
