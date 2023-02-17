import "https://deno.land/std@0.173.0/dotenv/load.ts";
import * as path from "https://deno.land/std@0.173.0/path/mod.ts";

import { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/colors.ts";
import { Command } from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";

import {
  getPrettyJSONString,
  getStagingDir,
  loadJSONC,
  persistStagedFiles,
  stageFile,
} from "../utils.ts";

import { loadSealedSecretsKeys } from "../initialize/sealedSecretsKeys.ts";
import { loadTerraformStatePassphrase } from "../initialize/terraformStatePassphrase.ts";
import { loadArgoUIAdminPassword } from "../initialize/argoUIAdminPassword.ts";

import controllerBootstrapTerrformTemplate from "../bootstrap/controller_bootstrap_cndi.sh.ts";
import leaderBootstrapTerraformTemplate from "../bootstrap/leader_bootstrap_cndi.sh.ts";

import getApplicationManifest from "../outputs/application-manifest.ts";
import getTerraformNodeResource from "../outputs/terraform-node-resource.ts";
import getTerraformRootFile from "../outputs/terraform-root-file.ts";
import RootChartYaml from "../outputs/root-chart.ts";
import getSealedSecretManifest from "../outputs/sealed-secret-manifest.ts";

import {
  BaseNodeItemSpec,
  CNDIConfig,
  DeploymentTargetConfiguration,
  KubernetesManifest,
  KubernetesSecret,
} from "../types.ts";

const owLabel = colors.white("\noverwrite:");

interface OverwriteActionArgs {
  output: string;
  initializing: boolean;
}

const overwriteAction = async (options: OverwriteActionArgs) => {
  const pathToConfig = path.join(options.output, "cndi-config.jsonc");

  const pathToKubernetesManifests = path.join(
    options.output,
    "cndi",
    "cluster_manifests",
  );
  const pathToTerraformResources = path.join(
    options.output,
    "cndi",
    "terraform",
  );

  let config;

  try {
    config = (await loadJSONC(pathToConfig)) as unknown as CNDIConfig;
  } catch {
    console.log(
      owLabel,
      colors.brightRed(
        `there is no cndi-config file at ${
          colors.white(`"${pathToConfig}"`)
        }\n`,
      ),
    );
    console.log(
      `if you don't have a cndi-config file try ${
        colors.cyan(
          "cndi init --interactive",
        )
      }\n`,
    );
    Deno.exit(1);
  }
  if (!options.initializing) {
    console.log(`cndi overwrite --file "${pathToConfig}"\n`);
  }
  const sealedSecretsKeys = loadSealedSecretsKeys();
  const terraformStatePassphrase = loadTerraformStatePassphrase();
  const argoUIAdminPassword = loadArgoUIAdminPassword();

  if (!sealedSecretsKeys) {
    console.log(owLabel, colors.brightRed(`"sealedSecretsKeys" are undefined`));
    Deno.exit(1);
  }

  if (!argoUIAdminPassword) {
    console.log(
      owLabel,
      colors.brightRed(`"argoUIAdminPassword" is undefined`),
    );
    Deno.exit(1);
  }

  if (!terraformStatePassphrase) {
    console.log(
      owLabel,
      colors.brightRed(`"terraformStatePassphrase" is undefined`),
    );
    Deno.exit(1);
  }

  if (!config?.project_name) {
    console.log(
      owLabel,
      colors.brightRed(
        `you need to specify a ${
          colors.cyan(
            '"project_name"',
          )
        } for your CNDI cluster, it is used to tag resources we create`,
      ),
    );
    Deno.exit(1);
  }

  const cluster_manifests = config?.cluster_manifests || {};

  try {
    // remove all files in cndi/cluster
    await Deno.remove(pathToKubernetesManifests, {
      recursive: true,
    });
  } catch {
    // folder did not exist
  }

  try {
    // remove all files in cndi/terraform
    await Deno.remove(pathToTerraformResources, {
      recursive: true,
    });
  } catch {
    // folder did not exist
  }

  // write tftpl terraform template for the user_data bootstrap script

  await stageFile(
    path.join("cndi", "terraform", "leader_bootstrap_cndi.sh.tftpl"),
    leaderBootstrapTerraformTemplate,
  );

  await stageFile(
    path.join("cndi", "terraform", "controller_bootstrap_cndi.sh.tftpl"),
    controllerBootstrapTerrformTemplate,
  );

  // create temporary key for sealing secrets
  const tempPublicKeyFilePath = await Deno.makeTempFile();
  const dotEnvPath = path.join(options.output, ".env");

  await Deno.writeTextFile(
    tempPublicKeyFilePath,
    sealedSecretsKeys.sealed_secrets_public_key,
  );

  // write each manifest in the "cluster_manifests" section of the config to `cndi/cluster_manifests`
  for (const key in cluster_manifests) {
    const manifestObj = cluster_manifests[key] as KubernetesManifest;

    if (manifestObj?.kind && manifestObj.kind === "Secret") {
      const secret = cluster_manifests[key] as KubernetesSecret;
      const secretName = `${key}.json`;
      const sealedSecretManifest = await getSealedSecretManifest(secret, {
        publicKeyFilePath: tempPublicKeyFilePath,
        dotEnvPath,
      });

      if (sealedSecretManifest) {
        await stageFile(
          path.join("cndi", "cluster_manifests", secretName),
          sealedSecretManifest,
        );
        console.log(`created encrypted secret:`, secretName);
      }
      continue;
    }

    await stageFile(
      path.join("cndi", "cluster_manifests", `${key}.json`),
      getPrettyJSONString(manifestObj),
    );
  }

  const { nodes } = config.infrastructure.cndi;

  const deployment_target_configuration =
    config.infrastructure.cndi.deployment_target_configuration ||
    ({} as DeploymentTargetConfiguration);

  const leaders = nodes.filter((node) => node.role === "leader");

  if (leaders.length !== 1) {
    console.log(
      owLabel,
      colors.brightRed(`There must be exactly one leader node`),
    );
    Deno.exit(1);
  }

  const leader = leaders[0];

  const requiredProviders = new Set(
    nodes.map((node: BaseNodeItemSpec) => {
      // eg: aws -> aws
      const provider = node.kind;
      return provider;
    }),
  );

  if (requiredProviders.size !== 1) {
    console.log(
      colors.yellow(
        `we currently only support ${colors.cyan("1")} "kind" per cluster\n`,
      ),
    );
    console.log(
      `your nodes have the following ${
        colors.brightRed(
          `${requiredProviders.size}`,
        )
      } "kind"s:`,
    );
    requiredProviders.forEach((kind) => {
      console.log(` - ${colors.yellow(kind)}`);
    });
    console.log();
    Deno.exit(1);
  }

  // generate setup-cndi.tf.json which depends on which kind of nodes are being deployed
  const terraformRootFileContents = getTerraformRootFile({
    cndi_project_name: config.project_name,
    leaderName: leader.name,
    requiredProviders,
    nodes,
    dotEnvPath,
  });

  if (terraformRootFileContents) {
    await stageFile(
      path.join("cndi", "terraform", "setup-cndi.tf.json"),
      terraformRootFileContents,
    );
  }

  // write terraform nodes files
  for (const node of nodes) {
    const nodeFileContents: string = getTerraformNodeResource(
      node,
      deployment_target_configuration,
      leader.name,
    );

    await stageFile(
      path.join("cndi", "terraform", `${node.name}.cndi-node.tf.json`),
      nodeFileContents,
    );
  }

  // write the cndi/cluster_manifests/Chart.yaml file
  await stageFile(
    path.join("cndi", "cluster_manifests", "Chart.yaml"),
    RootChartYaml,
  );

  const { applications } = config;

  // write the `cndi/cluster_manifests/applications/${applicationName}.application.json` file for each application
  for (const releaseName in applications) {
    const applicationSpec = applications[releaseName];
    const [manifestContent, filename] = getApplicationManifest(
      releaseName,
      applicationSpec,
    );
    await stageFile(
      path.join("cndi", "cluster_manifests", "applications", filename),
      manifestContent,
    );
    console.log("created application manifest:", filename);
  }

  try {
    await persistStagedFiles(options.output);
  } catch (errorPersistingStagedFiles) {
    console.log(owLabel, colors.brightRed(`Error persisting staged files`));
    console.log(errorPersistingStagedFiles);
    await Deno.remove(getStagingDir(), { recursive: true });
    Deno.exit(1);
  }

  const completionMessage = options?.initializing
    ? "initialized your cndi project in the ./cndi directory!"
    : "overwrote your cndi project in the ./cndi directory!";

  console.log("\n" + completionMessage);
};

/**
 * COMMAND cndi overwrite
 * Creates a CNDI cluster by reading the contents of ./cndi
 */
const overwriteCommand = new Command()
  .description(`Update cndi project files using cndi-config.jsonc file.`)
  .alias("ow")
  .option("-o, --output <output:string>", "Path to your cndi git repository.", {
    default: Deno.cwd(),
  })
  .option(
    "--initializing <initializing:boolean>",
    'true if "cndi init" is the caller of this command',
    { hidden: true, default: false },
  )
  .action(overwriteAction);

export { overwriteAction, overwriteCommand };
