import * as path from "https://deno.land/std@0.173.0/path/mod.ts";
import {
  getPrettyJSONString,
  loadJSONC,
  persistStagedFiles,
  stageFile,
  stageFileSync,
} from "../utils.ts";
import {
  BaseNodeItemSpec,
  CNDIConfig,
  CNDIContext,
  DeploymentTargetConfiguration,
  KubernetesManifest,
  KubernetesSecret,
} from "../types.ts";
import getApplicationManifest from "../outputs/application-manifest.ts";
import getTerraformNodeResource from "../outputs/terraform-node-resource.ts";
import getTerraformRootFile from "../outputs/terraform-root-file.ts";
import RootChartYaml from "../outputs/root-chart.ts";
import getSealedSecretManifest from "../outputs/sealed-secret-manifest.ts";

import controllerBootstrapTerrformTemplate from "../bootstrap/controller_bootstrap_cndi.sh.ts";
import leaderBootstrapTerraformTemplate from "../bootstrap/leader_bootstrap_cndi.sh.ts";

import { loadSealedSecretsKeys } from "../initialize/sealedSecretsKeys.ts";

import { loadTerraformStatePassphrase } from "../initialize/terraformStatePassphrase.ts";

import { loadArgoUIAdminPassword } from "../initialize/argoUIAdminPassword.ts";

import { getEnvStringWithGoogleCredentials } from "../deployment-targets/gcp.ts";

import {
  brightRed,
  cyan,
  white,
  yellow,
} from "https://deno.land/std@0.173.0/fmt/colors.ts";

const owLabel = white("ow:");
/**
 * COMMAND fn: cndi overwrite
 * Overwrites ./cndi directory with the specified config file
 */
const overwriteWithFn = async (context: CNDIContext, initializing = false) => {
  const { pathToConfig, pathToKubernetesManifests, pathToTerraformResources } =
    context;

  let sealedSecretsKeys;
  let terraformStatePassphrase;
  let argoUIAdminPassword;

  if (initializing) {
    sealedSecretsKeys = context.sealedSecretsKeys;
    terraformStatePassphrase = context.terraformStatePassphrase;
    argoUIAdminPassword = context.argoUIAdminPassword;
  } else {
    console.log(`cndi overwrite --file "${pathToConfig}"\n`);
    sealedSecretsKeys = loadSealedSecretsKeys();
    terraformStatePassphrase = loadTerraformStatePassphrase();
    argoUIAdminPassword = loadArgoUIAdminPassword();
  }

  if (!sealedSecretsKeys) {
    console.log(owLabel, brightRed(`"sealedSecretsKeys" are undefined`));
    Deno.exit(1);
  }

  if (!argoUIAdminPassword) {
    console.log(owLabel, brightRed(`"argoUIAdminPassword" is undefined`));
    Deno.exit(1);
  }

  if (!terraformStatePassphrase) {
    console.log(owLabel, brightRed(`"terraformStatePassphrase" is undefined`));
    Deno.exit(1);
  }

  const config = (await loadJSONC(pathToConfig)) as unknown as CNDIConfig;

  if (!config?.project_name) {
    console.log(
      owLabel,
      brightRed(
        `you need to specify a ${
          cyan(
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
    context.stagingDirectory,
    path.join("cndi", "terraform", "leader_bootstrap_cndi.sh.tftpl"),
    leaderBootstrapTerraformTemplate,
  );

  await stageFile(
    context.stagingDirectory,
    path.join("cndi", "terraform", "controller_bootstrap_cndi.sh.tftpl"),
    controllerBootstrapTerrformTemplate,
  );

  // create temporary key for sealing secrets
  const tempPublicKeyFilePath = await Deno.makeTempFile();
  await Deno.writeTextFile(
    tempPublicKeyFilePath,
    sealedSecretsKeys.sealed_secrets_public_key,
  );

  // write each manifest in the "cluster" section of the config to `cndi/cluster`
  Object.keys(cluster_manifests).forEach(async (key) => {
    const manifestObj = cluster_manifests[key] as KubernetesManifest;

    if (manifestObj?.kind && manifestObj.kind === "Secret") {
      const secret = cluster_manifests[key] as KubernetesSecret;
      const secretName = `${key}.json`;
      const sealedSecretManifest = await getSealedSecretManifest(
        secret,
        tempPublicKeyFilePath,
        context,
      );

      if (sealedSecretManifest) {
        stageFileSync(
          context.stagingDirectory,
          path.join("cndi", "cluster_manifests", secretName),
          sealedSecretManifest,
        );
        console.log(`created encrypted secret:`, secretName);
      }
      return;
    }

    await stageFile(
      context.stagingDirectory,
      path.join("cndi", "cluster_manifests", `${key}.json`),
      getPrettyJSONString(manifestObj),
    );
  });

  const { nodes } = config.infrastructure.cndi;

  const deployment_target_configuration =
    config.infrastructure.cndi.deployment_target_configuration ||
    ({} as DeploymentTargetConfiguration);

  const leaders = nodes.filter((node) => node.role === "leader");

  if (leaders.length !== 1) {
    console.log(owLabel, brightRed(`There must be exactly one leader node`));
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
      yellow(`we currently only support ${cyan("1")} "kind" per cluster\n`),
    );
    console.log(
      `your nodes have the following ${
        brightRed(
          `${requiredProviders.size}`,
        )
      } "kind"s:`,
    );
    requiredProviders.forEach((kind) => {
      console.log(` - ${yellow(kind)}`);
    });
    console.log();
    Deno.exit(1);
  }

  if (requiredProviders.has("gcp")) {
    // if there is a service account key path
    // read the contents and create a string of .env contents with the key
    // caution: this needs to run before the terraform root file is created
    const envStringIncludingGCPCreds = getEnvStringWithGoogleCredentials(
      context,
    );
    if (envStringIncludingGCPCreds) {
      stageFileSync(
        context.stagingDirectory,
        ".env",
        envStringIncludingGCPCreds,
      );
    }
  }

  // generate setup-cndi.tf.json which depends on which kind of nodes are being deployed
  const terraformRootFileContents = getTerraformRootFile({
    cndi_project_name: config.project_name,
    leaderName: leader.name,
    requiredProviders,
    nodes,
  });

  await stageFile(
    context.stagingDirectory,
    path.join("cndi", "terraform", "setup-cndi.tf.json"),
    terraformRootFileContents,
  );

  // write terraform nodes files
  nodes.forEach((node: BaseNodeItemSpec) => {
    const nodeFileContents: string = getTerraformNodeResource(
      node,
      deployment_target_configuration,
      leader.name,
    );

    stageFileSync(
      context.stagingDirectory,
      path.join("cndi", "terraform", `${node.name}.cndi-node.tf.json`),
      nodeFileContents,
    );
  });

  // write the cndi/cluster_manifests/Chart.yaml file
  await stageFile(
    context.stagingDirectory,
    path.join("cndi", "cluster_manifests", "Chart.yaml"),
    RootChartYaml,
  );

  const { applications } = config;

  // write the `cndi/cluster_manifests/applications/${applicationName}.application.json` file for each application
  Object.keys(applications).forEach((releaseName) => {
    const applicationSpec = applications[releaseName];
    const [manifestContent, filename] = getApplicationManifest(
      releaseName,
      applicationSpec,
    );
    stageFileSync(
      context.stagingDirectory,
      path.join("cndi", "cluster_manifests", "applications", filename),
      manifestContent,
    );
    console.log("created application manifest:", filename);
  });

  try {
    await persistStagedFiles(
      context.stagingDirectory,
      context.projectDirectory,
    );
  } catch (errorPersistingStagedFiles) {
    console.log(owLabel, brightRed(`Error persisting staged files`));
    console.log(errorPersistingStagedFiles);
    Deno.removeSync(context.stagingDirectory, { recursive: true });
    Deno.exit(1);
  }

  const completionMessage = initializing
    ? "initialized your cndi project in the ./cndi directory!"
    : "overwrote your cndi project in the ./cndi directory!";

  console.log(completionMessage);
  Deno.removeSync(context.stagingDirectory, { recursive: true });
};

export default overwriteWithFn;
