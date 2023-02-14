import { getPrettyJSONString } from "../utils.ts";
import {
  AWSNodeItemSpec,
  BaseNodeItemSpec,
  TerraformDependencies,
} from "../types.ts";

import {
  azureTerraformRootFileData,
  gcpTerraformRootFileData,
  terraformRootFileData,
} from "./data/terraform-root-file-data.ts";
import { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/colors.ts";

const DEFAULT_AWS_REGION = "us-east-1";
const DEFAULT_GCP_REGION = "us-central1";
const DEFAULT_ARM_REGION = "eastus";
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
const azureTerraformProviderDependency = {
  source: "hashicorp/azurerm",
  version: "~> 3.0.2",
};
interface GetTerraformRootFileArgs {
  leaderName: string;
  requiredProviders: Set<string>;
  nodes: Array<BaseNodeItemSpec>;
  cndi_project_name: string;
  dotEnvPath: string;
}

const terraformRootFileLabel = colors.white("outputs/terraform-root-file:");

const getTerraformRootFile = ({
  leaderName,
  requiredProviders,
  nodes,
  cndi_project_name,
  dotEnvPath,
}: GetTerraformRootFileArgs): string => {
  const nodeNames = nodes.map((entry) => entry.name);

  const nodeCount = nodes.length;
  // copy original terraformRootFileData to working copy for GCP using js spread operator

  if (requiredProviders.has("gcp")) {
    const gcpMainTerraformFileObject = { ...gcpTerraformRootFileData };
    const googleCredentials = Deno.env.get("GOOGLE_CREDENTIALS") as string;
    if (!googleCredentials) {
      console.log("google credentials are missing");
      // the message about missing credentials should have already been printed
      Deno.exit(1);
    }

    const region = (Deno.env.get("GCP_REGION") as string) || DEFAULT_GCP_REGION;

    // we parse the key to extract the project_id for use in terraform
    // the json key is only used for auth within `cndi run`
    let parsedJSONServiceAccountKey: { project_id: string };
    try {
      parsedJSONServiceAccountKey = JSON.parse(googleCredentials);
    } catch {
      const placeholder = "GOOGLE_CREDENTIALS_PLACEHOLDER__";
      if (googleCredentials === placeholder) {
        console.log(
          colors.yellow(
            `\n\n${
              colors.brightRed(
                "ERROR",
              )
            }: GOOGLE_CREDENTIALS not found in environment`,
          ),
        );
        console.log(
          `You need to replace `,
          colors.cyan(placeholder),
          `with the desired value in "${dotEnvPath}"\nthen run ${
            colors.green(
              "cndi ow",
            )
          }\n`,
        );
        Deno.exit(1);
      }
      console.log(
        terraformRootFileLabel,
        colors.brightRed("failed to parse service account key json\n"),
      );
      Deno.exit(1);
    }

    terraformDependencies.required_providers[0].google =
      googleTerraformProviderDependency;

    gcpMainTerraformFileObject.locals[0].leader_node_ip =
      `\${google_compute_instance.${leaderName}.network_interface.0.network_ip}`;

    gcpMainTerraformFileObject.locals[0].region = region;

    gcpMainTerraformFileObject.resource[0].google_compute_instance_group
      .cndi_cluster.instances = nodeNames.map((name) =>
        `\${google_compute_instance.${name}.self_link}`
      );

    gcpMainTerraformFileObject.provider.google = [
      {
        region,
        zone: `${region}-a`,
        project: parsedJSONServiceAccountKey.project_id,
      },
    ];

    gcpMainTerraformFileObject.terraform = [terraformDependencies];

    return getPrettyJSONString(gcpMainTerraformFileObject);
  }

  // add parts of setup-cndi.tf file that are required if kind===aws
  if (requiredProviders.has("aws")) {
    const awsMainTerraformFileObject = { ...terraformRootFileData };
    const region = Deno.env.get("AWS_REGION") || DEFAULT_AWS_REGION;

    const awsNodeEntries = nodes as Array<AWSNodeItemSpec>;

    // this block is to ensure we only deploy nodes to compatible AWS Availability Zones
    const availabilityZoneKeys: string[] = [];

    awsNodeEntries.forEach((entry) => {
      const azKey = `available_az_for_${entry.name}_instance_type`;

      availabilityZoneKeys.push(
        `data.aws_ec2_instance_type_offerings.${azKey}.locations`,
      );

      awsMainTerraformFileObject.data[0].aws_ec2_instance_type_offerings[0][
        azKey
      ] = [
        {
          filter: [{ name: "instance-type", values: [entry.instance_type] }],
          location_type: "availability-zone",
        },
      ];
    });

    awsMainTerraformFileObject.locals[0].availability_zones =
      `\${sort(setintersection(${
        availabilityZoneKeys.join(
          ",",
        )
      }))}`;

    awsMainTerraformFileObject.locals[0].leader_node_ip =
      `\${aws_instance.${leaderName}.private_ip}`;

    // maybe this should be a string??
    awsMainTerraformFileObject.locals[0].node_count = `${nodeCount}`;

    awsMainTerraformFileObject.locals[0].cndi_project_name = cndi_project_name;

    // TODO: verify that this provider configuration is being consumed instead of the environment variable
    awsMainTerraformFileObject.provider.aws = [{ region }];

    // add aws provider dependency
    terraformDependencies.required_providers[0].aws =
      awsTerraformProviderDependency;

    awsMainTerraformFileObject.terraform = [terraformDependencies];
    return getPrettyJSONString(awsMainTerraformFileObject);
  }
  // add parts of setup-cndi.tf file that are required if kind===azure
  if (requiredProviders.has("azure")) {
    const azureMainTerraformFileObject = { ...azureTerraformRootFileData };

    azureMainTerraformFileObject.locals[0].cndi_project_name =
      cndi_project_name;

    const region = Deno.env.get("ARM_REGION") || DEFAULT_ARM_REGION;

    azureMainTerraformFileObject.locals[0].leader_node_ip =
      `\${azurerm_linux_virtual_machine.${leaderName}.private_ip_address}`;

    azureMainTerraformFileObject.locals[0].location = region;
    // add azure provider dependency
    terraformDependencies.required_providers[0].azurerm =
      azureTerraformProviderDependency;

    azureMainTerraformFileObject.provider.azurerm = [
      {
        features: {},
      },
    ];

    azureMainTerraformFileObject.terraform = [terraformDependencies];
    return getPrettyJSONString(azureMainTerraformFileObject);
  }

  console.log(
    terraformRootFileLabel,
    'required providers must contain either "gcp", "aws" or azure',
  );
  Deno.exit(1);
};

export default getTerraformRootFile;
