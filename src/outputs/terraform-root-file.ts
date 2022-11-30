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

const getTerraformRootFile = async ({
  leaderName,
  requiredProviders,
}: GetTerraformRootFileArgs): Promise<string> => {
  const mainTerraformFileObject = { ...terraformRootFileData };

  if (requiredProviders.has("gcp")) {
    // if terraform can't find credentials automatically
    // we probably need this:

    const tempFilePath = await Deno.makeTempFile();
    Deno.writeTextFileSync(
      tempFilePath,
      Deno.env.get("GOOGLE_CREDENTIALS") as string,
    ); // contents of service account JSON written to temp file
    Deno.env.set("GOOGLE_APPLICATION_CREDENTIALS", tempFilePath); // set env var to give terraform path to temp file

    return getPrettyJSONString(mainTerraformFileObject);
  }

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
