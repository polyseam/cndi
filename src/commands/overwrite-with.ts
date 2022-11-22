import * as path from "https://deno.land/std@0.157.0/path/mod.ts";
import { white } from "https://deno.land/std@0.158.0/fmt/colors.ts";
import { getPrettyJSONString, loadJSONC } from "../utils.ts";
import {
  BaseNodeEntrySpec,
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

import workerBootstrapTerrformTemplate from "../bootstrap/worker_bootstrap_cndi.sh.ts";
import controllerBootstrapTerraformTemplate from "../bootstrap/controller_bootstrap_cndi.sh.ts";

import { loadSealedSecretsKeys } from "../initialize/sealedSecretsKeys.ts";

import { loadTerraformStatePassphrase } from "../initialize/terraformStatePassphrase.ts";

import { loadArgoUIReadOnlyPassword } from "../initialize/argoUIReadOnlyPassword.ts";
import { brightRed } from "https://deno.land/std@0.157.0/fmt/colors.ts";

const owLabel = white("ow:");
/**
 * COMMAND fn: cndi overwrite-with
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
    console.log(`cndi overwrite-with --file "${pathToConfig}"\n`);
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

  const cluster = config?.cluster || {};

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

  // create 'cndi/' 'cndi/cluster' and 'cndi/cluster/applications'
  await Deno.mkdir(path.join(pathToKubernetesManifests, "applications"), {
    recursive: true,
  });

  // create 'cndi/' 'cndi/terraform'
  await Deno.mkdir(pathToTerraformResources, {
    recursive: true,
  });

  // write tftpl terraform template for the user_data bootstrap script
  await Deno.writeTextFile(
    path.join(pathToTerraformResources, "worker_bootstrap_cndi.sh.tftpl"),
    workerBootstrapTerrformTemplate,
  );

  await Deno.writeTextFile(
    path.join(pathToTerraformResources, "controller_bootstrap_cndi.sh.tftpl"),
    controllerBootstrapTerraformTemplate,
  );

  const tempPublicKeyFilePath = await Deno.makeTempFile();

  await Deno.writeTextFile(
    tempPublicKeyFilePath,
    sealedSecretsKeys.sealed_secrets_public_key,
  );

  // write each manifest in the "cluster" section of the config to `cndi/cluster`
  Object.keys(cluster).forEach(async (key) => {
    const manifestObj = cluster[key] as KubernetesManifest;

    if (manifestObj?.kind && manifestObj.kind === "Secret") {
      const secret = cluster[key] as KubernetesSecret;
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

  const { nodes } = config;

  // generate setup-cndi.tf.json which depends on which kind of nodes are being deployed
  const terraformRootFile = getTerraformRootFile(nodes);

  // write terraform root file
  await Deno.writeTextFile(
    path.join(pathToTerraformResources, "setup-cndi.tf.json"),
    terraformRootFile,
  );

  const { entries } = nodes;
  const deploymentTargetConfiguration = nodes?.deploymentTargetConfiguration ||
    ({} as DeploymentTargetConfiguration);

  const controllerName = entries.find((entry) => entry.role === "controller")
    ?.name as string;

  // write terraform nodes files
  entries.forEach((entry: BaseNodeEntrySpec) => {
    const nodeFileContents: string = getTerraformNodeResource(
      entry,
      deploymentTargetConfiguration,
      controllerName,
    );
    Deno.writeTextFile(
      path.join(pathToTerraformResources, `${entry.name}.cndi-node.tf.json`),
      nodeFileContents,
    );
  });

  // write the cndi/cluster/Chart.yaml file
  await Deno.writeTextFile(
    path.join(pathToKubernetesManifests, "Chart.yaml"),
    RootChartYaml,
  );

  const { applications } = config;

  // write the `cndi/cluster/applications/${applicationName}.application.json` file for each application

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
