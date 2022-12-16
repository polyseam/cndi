import { getPrettyJSONString } from "../utils.ts";
import {
  AWSNodeItemSpec,
  BaseNodeItemSpec,
  NodeKind,
  TerraformDependencies,
} from "../types.ts";

import {
  gcpTerraformRootFileData,
  terraformRootFileData,
} from "./data/terraform-root-file-data.ts";
import { white } from "https://deno.land/std@0.158.0/fmt/colors.ts";
import { brightRed } from "https://deno.land/std@0.158.0/fmt/colors.ts";

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
  nodes: Array<BaseNodeItemSpec>;
}

const terraformRootFileLabel = white("outputs/terraform-root-file:");

const getTerraformRootFile = async ({
  leaderName,
  requiredProviders,
  nodes,
}: GetTerraformRootFileArgs): Promise<string> => {
  const nodeNames = nodes.map((entry) => entry.name);

  const nodeCount = nodes.length;
  // copy original terraformRootFileData to working copy for GCP using js spread operator

  if (requiredProviders.has("gcp")) {
    const gcpMainTerraformFileObject = { ...gcpTerraformRootFileData };
    const googleCredentials = Deno.env.get("GOOGLE_CREDENTIALS") as string;
    if (!googleCredentials) {
      console.log(
        terraformRootFileLabel,
        '"GOOGLE_CREDENTIALS"',
        brightRed(`is undefined\nPlease set`),
        '"GCP_PATH_TO_SERVICE_ACCOUNT_KEY"',
        brightRed("and try again\n"),
      );
      Deno.exit(1);
    }

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

    gcpMainTerraformFileObject.locals[0].leader_node_ip =
      `\${google_compute_instance.${leaderName}.network_interface.0.network_ip}`;

    gcpMainTerraformFileObject.locals[0].region = region;

    gcpMainTerraformFileObject.resource[0].google_compute_instance_group
      .cndi_cluster.instances = nodeNames.map(
        (name) => `\${google_compute_instance.${name}.self_link}`,
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
  if (requiredProviders.has(NodeKind.aws)) {
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
      `\${sort(setintersection(${availabilityZoneKeys.join(",")}))}`;

    awsMainTerraformFileObject.locals[0].leader_node_ip =
      `\${aws_instance.${leaderName}.private_ip}`;

    // maybe this should be a string??
    awsMainTerraformFileObject.locals[0].node_count = `${nodeCount}`;

    // TODO: verify that this provider configuration is being consumed instead of the environment variable
    awsMainTerraformFileObject.provider.aws = [{ region }];

    // add aws provider dependency
    terraformDependencies.required_providers[0].aws =
      awsTerraformProviderDependency;

    awsMainTerraformFileObject.terraform = [terraformDependencies];
    return getPrettyJSONString(awsMainTerraformFileObject);
  }

  console.log(
    terraformRootFileLabel,
    'required providers must contain either "gcp" or "aws"',
  );
  Deno.exit(1);
};

export default getTerraformRootFile;
