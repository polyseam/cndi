import { getPrettyJSONString } from "../utils.ts";
import { NodeKind, TerraformDependencies } from "../types.ts";

import terraformRootFileData from "./data/terraform-root-file-data.ts";
import { white } from "https://deno.land/std@0.158.0/fmt/colors.ts";
import { brightRed } from "https://deno.land/std@0.158.0/fmt/colors.ts";
import { brightWhite } from "https://deno.land/std@0.158.0/fmt/colors.ts";

const DEFAULT_AWS_REGION = "us-east-1";
const DEFAULT_GCP_REGION = "us-central1";

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
  source: "hashicorp/aws",
  version: "~> 4.16",
};

const googleTerraformProviderDependency = {
  source: "hashicorp/google",
  version: "~> 4.44",
};

interface GetTerraformRootFileArgs {
  leaderName: string;
  requiredProviders: Set<string>;
}

const terraformRootFileLabel = white("outputs/terraform-root-file:");

const getTerraformRootFile = async ({
  leaderName,
  requiredProviders,
}: GetTerraformRootFileArgs): Promise<string> => {
  const googleCredentials = Deno.env.get("GOOGLE_CREDENTIALS") as string;

  const mainTerraformFileObject = { ...terraformRootFileData };

  if (requiredProviders.has("gcp")) {
    const region = (Deno.env.get("GCP_REGION") as string) || DEFAULT_GCP_REGION;

    let parsedJSONServiceAccountKey: { project_id: string };

    try {
      parsedJSONServiceAccountKey = JSON.parse(googleCredentials);
    } catch {
      console.log(
        terraformRootFileLabel,
        brightRed("failed to parse service account key json"),
      );
      Deno.exit(1);
    }

    const tempFilePath = await Deno.makeTempFile();

    // TODO: can we delete this?
    Deno.writeTextFileSync(tempFilePath, googleCredentials); // contents of service account JSON written to temp file
    Deno.env.set("GOOGLE_APPLICATION_CREDENTIALS", tempFilePath); // set env var to give terraform path to temp file

    terraformDependencies.required_providers[0].google =
      googleTerraformProviderDependency;

    mainTerraformFileObject.locals[0].leader_node_ip =
      `\${google_compute_instance.${leaderName}.network_interface.0.network_ip}`;

    mainTerraformFileObject.provider.gcp = [
      { region, project: parsedJSONServiceAccountKey.project_id },
    ];

    mainTerraformFileObject.terraform = [terraformDependencies];

    return getPrettyJSONString(mainTerraformFileObject);
  }

  // add parts of setup-cndi.tf file that are required if kind===aws
  if (requiredProviders.has(NodeKind.aws)) {
    const region = Deno.env.get("AWS_REGION") || DEFAULT_AWS_REGION;

    mainTerraformFileObject.locals[0].leader_node_ip =
      `\${aws_instance.${leaderName}.private_ip}`;

    // TODO: verify that this provider configuration is being consumed instead of the environment variable
    mainTerraformFileObject.provider.aws = [{ region }];

    // add aws provider dependency
    terraformDependencies.required_providers[0].aws =
      awsTerraformProviderDependency;

    mainTerraformFileObject.terraform = [terraformDependencies];
  }

  return getPrettyJSONString(mainTerraformFileObject);
};

export default getTerraformRootFile;
