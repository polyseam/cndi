import { getPrettyJSONString } from "../utils.ts";
import { NodeKind, TerraformDependencies } from "../types.ts";

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

interface GetTerraformRootFileArgs {
  leaderName: string;
  requiredProviders: Set<string>;
}

const getTerraformRootFile = ({
  leaderName,
  requiredProviders,
}: GetTerraformRootFileArgs): string => {
  // TODO: create compute engine instance
  // TODO: create compute engine instance group
  // TODO: create compute engine tcp load balancer
  // TODO: create vpc
  // TODO: link with _existing_ gcp project OR create new gcp project

  const mainTerraformFileObject = { ...terraformRootFileData };

  // add parts of setup-cndi.tf file that are required if kind===aws
  if (requiredProviders.has(NodeKind.aws)) {
    mainTerraformFileObject.locals[0].leader_node_ip =
      `\${aws_instance.${leaderName}.private_ip}`;
    // add aws provider dependency
    terraformDependencies.required_providers[0].aws =
      awsTerraformProviderDependency.aws;

    mainTerraformFileObject.terraform = [terraformDependencies];
  }

  return getPrettyJSONString(mainTerraformFileObject);
};

export default getTerraformRootFile;
