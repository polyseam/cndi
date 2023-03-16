import "https://deno.land/std@0.173.0/dotenv/load.ts";
import { ccolors, Command, path } from "deps";

import {
  getPrettyJSONString,
  getStagingDir,
  loadJSONC,
  persistStagedFiles,
  stageFile,
} from "src/utils.ts";

import { loadSealedSecretsKeys } from "src/initialize/sealedSecretsKeys.ts";
import { loadTerraformStatePassphrase } from "src/initialize/terraformStatePassphrase.ts";
import { loadArgoUIAdminPassword } from "src/initialize/argoUIAdminPassword.ts";

import getApplicationManifest from "src/outputs/application-manifest.ts";
import RootChartYaml from "src/outputs/root-chart.ts";
import getSealedSecretManifest from "src/outputs/sealed-secret-manifest.ts";

import stageTerraformResourcesForConfig from "src/outputs/terraform/stageTerraformResourcesForConfig.ts";

import {
  BaseNodeItemSpec,
  CNDIConfig,
  KubernetesManifest,
  KubernetesSecret,
} from "src/types.ts";

const owLabel = ccolors.faded("\nsrc/commands/overwrite.ts:");

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
    console.error(
      owLabel,
      ccolors.error("there is no cndi-config file at"),
      ccolors.user_input(`"${pathToConfig}"`),
    );
    console.log(
      "if you don't have a cndi-config file try",
      ccolors.prompt(
        "cndi init --interactive",
      ),
      "\n",
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
    console.error(
      owLabel,
      ccolors.key_name(`"SEALED_SECRETS_PUBLIC_KEY"`),
      ccolors.error(`and/or`),
      ccolors.key_name(`"SEALED_SECRETS_PRIVATE_KEY"`),
      ccolors.error(`are not present in environment`),
      "\n",
    );
    Deno.exit(1);
  }

  if (!argoUIAdminPassword) {
    console.error(
      owLabel,
      ccolors.key_name(`"ARGO_UI_ADMIN_PASSWORD"`),
      ccolors.error(`is not set in environment`),
      "\n",
    );
    Deno.exit(1);
  }

  if (!terraformStatePassphrase) {
    console.error(
      owLabel,
      ccolors.key_name(`"TERRAFORM_STATE_PASSPHRASE"`),
      ccolors.error(`is not set in environment`),
      "\n",
    );
    Deno.exit(1);
  }

  if (!config?.project_name) {
    console.error(
      owLabel,
      ccolors.error(
        `you need to specify a`,
      ),
      ccolors.key_name(
        '"project_name"',
      ),
      ccolors.error(
        `for your CNDI cluster, it is used to tag resources we create in the cloud`,
      ),
      "\n",
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

  const leaders = nodes.filter((node) => node.role === "leader");

  if (leaders.length !== 1) {
    console.error(
      owLabel,
      ccolors.error(`There must be exactly one leader node`),
      "\n",
    );
    Deno.exit(1);
  }

  const requiredProviders = new Set(
    nodes.map((node: BaseNodeItemSpec, index: number) => {
      // eg: aws -> aws
      if (!node.kind) {
        console.error(
          `node`,
          ccolors.key_name(`${index}`),
          node.name ? ccolors.user_input(`("${node.name}")`) : "",
          `is missing the property`,
          ccolors.key_name(`"kind"`),
          "\n",
        );
        Deno.exit(1);
      }

      if (!node.name) {
        console.error(
          `node`,
          ccolors.key_name(`${index}`),
          `is missing the property`,
          ccolors.key_name(`"name"`),
          "\n",
        );
        Deno.exit(1);
      }

      const provider = node.kind;
      return provider;
    }),
  );

  if (requiredProviders.size !== 1) {
    console.error(
      ccolors.error(`we currently only support`),
      ccolors.warn("1"),
      ccolors.key_name(`"kind"`),
      ccolors.error(`per cluster`),
    );

    console.log(
      `your nodes have the following`,
      ccolors.user_input(
        `${requiredProviders.size}`,
      ),
      ccolors.key_name(`"kind"s`),
    );

    requiredProviders.forEach((kind) => {
      console.log(` - ${ccolors.warn(kind)}`);
    });

    console.log();
    Deno.exit(1);
  }

  await stageTerraformResourcesForConfig(config, options);

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
    console.error(
      owLabel,
      ccolors.error(
        `failed to persist staged cndi files to`,
      ),
      ccolors.user_input(`${options.output}`),
    );
    console.log(ccolors.caught(errorPersistingStagedFiles));
    await Deno.remove(getStagingDir(), { recursive: true });
    console.log();
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
