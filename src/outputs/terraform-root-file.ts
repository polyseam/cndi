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
  const leaderName = cndiNodesSpec.entries.find(
    (entry) => (entry.role === "leader"),
  )?.name as string;

  const providersRequired = new Set(
    cndiNodesSpec.entries.map((entry: BaseNodeEntrySpec) => {
      return entry.kind as NodeKind;
    }),
  );

  const allInstanceIDs = (
    cndiNodesSpec.entries.map((entry) => {
      return `\${aws_instance.${entry.name}.id}`;
    })
  );

  const mainTerraformFileObject = { ...terraformRootFileData };

  mainTerraformFileObject.locals[0].leader_node_ip =
    `\${aws_instance.${leaderName}.private_ip}`;

  mainTerraformFileObject.locals[0].target_id = allInstanceIDs;

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
