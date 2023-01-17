import * as path from "https://deno.land/std@0.173.0/path/mod.ts";
import { getPrettyJSONString, loadJSONC } from "../utils.ts";
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

import { loadArgoUIReadOnlyPassword } from "../initialize/argoUIReadOnlyPassword.ts";

import { getGoogleCredentials } from "../deployment-targets/gcp.ts";

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
  let argoUIReadOnlyPassword;

  if (initializing) {
    sealedSecretsKeys = context.sealedSecretsKeys;
    terraformStatePassphrase = context.terraformStatePassphrase;
    argoUIReadOnlyPassword = context.argoUIReadOnlyPassword;
  } else {
    console.log(`cndi overwrite --file "${pathToConfig}"\n`);
    sealedSecretsKeys = loadSealedSecretsKeys();
    terraformStatePassphrase = loadTerraformStatePassphrase();
    argoUIReadOnlyPassword = loadArgoUIReadOnlyPassword();
  }

  if (!sealedSecretsKeys) {
    console.log(owLabel, brightRed(`"sealedSecretsKeys" are undefined`));
    Deno.exit(1);
  }

  if (!argoUIReadOnlyPassword) {
    console.log(owLabel, brightRed(`"argoUIReadOnlyPassword" is undefined`));
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
          cyan('"project_name"')
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

  // create 'cndi/' 'cndi/cluster' and 'cndi/cluster_manifests/applications'
  await Deno.mkdir(path.join(pathToKubernetesManifests, "applications"), {
    recursive: true,
  });

  // create 'cndi/' 'cndi/terraform'
  await Deno.mkdir(pathToTerraformResources, {
    recursive: true,
  });

  // write tftpl terraform template for the user_data bootstrap script
  await Deno.writeTextFile(
    path.join(pathToTerraformResources, "leader_bootstrap_cndi.sh.tftpl"),
    leaderBootstrapTerraformTemplate,
  );

  await Deno.writeTextFile(
    path.join(pathToTerraformResources, "controller_bootstrap_cndi.sh.tftpl"),
    controllerBootstrapTerrformTemplate,
  );

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
        Deno.writeTextFileSync(
          path.join(pathToKubernetesManifests, secretName),
          sealedSecretManifest,
        );
        console.log(`created encrypted secret:`, secretName);
      }
      return;
    }

    await Deno.writeTextFile(
      path.join(pathToKubernetesManifests, `${key}.json`),
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
  }

  if (requiredProviders.has("gcp")) {
    // if there is a service account key path, read the contents and write them to .env and this runtime env
    // caution: this needs to run before the terraform root file is created
    await getGoogleCredentials(context.dotEnvPath);
  }

  // generate setup-cndi.tf.json which depends on which kind of nodes are being deployed
  const terraformRootFile = await getTerraformRootFile({
    leaderName: leader.name,
    requiredProviders,
    nodes,
  });

  // write terraform root file
  await Deno.writeTextFile(
    path.join(pathToTerraformResources, "setup-cndi.tf.json"),
    terraformRootFile,
  );

  // write terraform nodes files
  nodes.forEach((node: BaseNodeItemSpec) => {
    const nodeFileContents: string = getTerraformNodeResource(
      node,
      deployment_target_configuration,
      leader.name,
    );
    Deno.writeTextFileSync(
      path.join(pathToTerraformResources, `${node.name}.cndi-node.tf.json`),
      nodeFileContents,
    );
  });

  // write the cndi/cluster_manifests/Chart.yaml file
  await Deno.writeTextFile(
    path.join(pathToKubernetesManifests, "Chart.yaml"),
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
    Deno.writeTextFileSync(
      path.join(pathToKubernetesManifests, "applications", filename),
      manifestContent,
    );
    console.log("created application manifest:", filename);
  });

  const completionMessage = initializing
    ? "initialized your cndi project in the ./cndi directory!"
    : "overwrote your cndi project in the ./cndi directory!";

  console.log(completionMessage);
};

export default overwriteWithFn;
