import * as path from "https://deno.land/std@0.157.0/path/mod.ts";
import { copy } from "https://deno.land/std@0.157.0/fs/copy.ts";
import {
  checkInitialized,
  getPrettyJSONString,
  loadJSONC,
  padPrivatePem,
  padPublicPem,
} from "../utils.ts";
import {
  BaseNodeEntrySpec,
  CNDIConfig,
  CNDIContext,
  DeploymentTargetConfiguration,
  KubernetesManifest,
  KubernetesSecret,
  SealedSecretsKeys,
} from "../types.ts";
import getApplicationManifest from "../templates/application-manifest.ts";
import getTerraformNodeResource from "../templates/terraform-node-resource.ts";
import getTerraformRootFile from "../templates/terraform-root-file.ts";
import RootChartYaml from "../templates/root-chart.ts";
import getDotEnv from "../templates/env.ts";
import getSealedSecretManifest from "../templates/sealed-secret-manifest.ts";
import getReadme from '../templates/readme.ts';

import workerBootstrapTerrformTemplate from "../bootstrap/worker_bootstrap_cndi.sh.ts";
import controllerBootstrapTerraformTemplate from "../bootstrap/controller_bootstrap_cndi.sh.ts";

const createSealedSecretsKeys = async ({
  pathToKeys,
  pathToOpenSSL,
}: CNDIContext): Promise<SealedSecretsKeys> => {
  Deno.mkdir(pathToKeys, { recursive: true });
  const sealed_secrets_public_key_path = path.join(pathToKeys, "public.pem");
  const sealed_secrets_private_key_path = path.join(pathToKeys, "private.pem");

  let sealed_secrets_private_key;
  let sealed_secrets_public_key;

  const ranOpenSSLGenerateKeyPair = await Deno.run({
    cmd: [
      pathToOpenSSL,
      "req",
      "-x509",
      "-nodes",
      "-newkey",
      "rsa:4096",
      "-keyout",
      sealed_secrets_private_key_path,
      "-out",
      sealed_secrets_public_key_path,
      "-subj",
      "/CN=sealed-secret/O=sealed-secret",
    ],
    stdout: "piped",
    stderr: "piped",
  });

  const generateKeyPairStatus = await ranOpenSSLGenerateKeyPair.status();
  const generateKeyPairStderr = await ranOpenSSLGenerateKeyPair.stderrOutput();

  if (generateKeyPairStatus.code !== 0) {
    Deno.stdout.write(generateKeyPairStderr);
    Deno.exit(251); // arbitrary exit code
  } else {
    sealed_secrets_private_key = await Deno.readTextFile(
      sealed_secrets_private_key_path,
    );
    sealed_secrets_public_key = await Deno.readTextFile(
      sealed_secrets_public_key_path,
    );
    Deno.remove(pathToKeys, { recursive: true });
  }

  ranOpenSSLGenerateKeyPair.close();

  return {
    sealed_secrets_private_key,
    sealed_secrets_public_key,
  };
};

const loadSealedSecretsKeys = (): SealedSecretsKeys | null => {
  const sealed_secrets_public_key_material = Deno.env
    .get("SEALED_SECRETS_PUBLIC_KEY_MATERIAL")
    ?.trim()
    .replaceAll("_", "\n");
  const sealed_secrets_private_key_material = Deno.env
    .get("SEALED_SECRETS_PRIVATE_KEY_MATERIAL")
    ?.trim()
    .replaceAll("_", "\n");

  if (!sealed_secrets_public_key_material) {
    console.log("SEALED_SECRETS_PUBLIC_KEY_MATERIAL not found in environment");
    return null;
  }

  if (!sealed_secrets_private_key_material) {
    console.log("SEALED_SECRETS_PRIVATE_KEY_MATERIAL not found in environment");
    return null;
  }

  const sealedSecrets = {
    sealed_secrets_private_key: padPrivatePem(
      sealed_secrets_private_key_material,
    ),
    sealed_secrets_public_key: padPublicPem(sealed_secrets_public_key_material),
  };

  return sealedSecrets;
};

const loadTerraformStatePassphrase = (): string | null => {
  const terraform_state_passphrase = Deno.env
    .get("TERRAFORM_STATE_PASSPHRASE")
    ?.trim();

  if (!terraform_state_passphrase) {
    console.log("TERRAFORM_STATE_PASSPHRASE not found in environment");
    return null;
  }

  return terraform_state_passphrase;
};

const createTerraformStatePassphrase = (): string => {
  return crypto.randomUUID();
};

const loadArgoUIReadonlyPassword = (): string | null => {
  const argoui_readonly_password = Deno.env
    .get("ARGOUI_READONLY_PASSWORD")
    ?.trim();

  if (!argoui_readonly_password) {
    console.log("ARGOUI_READONLY_PASSWORD not found in environment");
    return null;
  }

  return argoui_readonly_password;
};

const createArgoUIReadOnlyPassword = (): string => {
  return crypto.randomUUID().replaceAll("-", "");
};

const updateGitIgnore = async (gitignorePath: string) => {
  const dotEnvIgnoreEntry = "\n.env\n";
  const dotKeysIgnoreEntry = "\n.keys/\n";
  const terraformIgnoreEntry =
    "\ncndi/terraform/.terraform*\ncndi/terraform/*.tfstate*\ncndi/terraform/.terraform/\n";
  try {
    const gitignoreContents = await Deno.readTextFile(gitignorePath);

    // gitignore exists in user's project directory

    if (!gitignoreContents.includes("env")) {
      await Deno.writeTextFile(
        gitignorePath,
        gitignoreContents + dotEnvIgnoreEntry,
      );
    }

    if (!gitignoreContents.includes(".keys")) {
      await Deno.writeTextFile(
        gitignorePath,
        gitignoreContents + dotKeysIgnoreEntry,
      );
    }

    if (!gitignoreContents.includes("terraform")) {
      await Deno.writeTextFile(
        gitignorePath,
        gitignoreContents + terraformIgnoreEntry,
      );
    }
  } catch {
    // gitignore does not exist in user's project directory, create it
    await Deno.writeTextFile(
      gitignorePath,
      "# cndi files\n" +
        dotEnvIgnoreEntry +
        dotKeysIgnoreEntry +
        terraformIgnoreEntry,
    );
  }
};

/**
 * COMMAND fn: cndi overwrite-with
 * Overwrites ./cndi directory with the specified config file
 */
const overwriteWithFn = async (context: CNDIContext, initializing = false) => {
  const {
    pathToConfig,
    githubDirectory,
    noGitHub,
    CNDI_SRC,
    projectDirectory,
    pathToKubernetesManifests,
    pathToTerraformResources,
    noDotEnv,
    dotEnvPath,
  } = context;

  if (!initializing) {
    console.log(`cndi overwrite-with -f "${pathToConfig}"`);
  }

  const sealedSecretsKeys = loadSealedSecretsKeys() ||
    (await createSealedSecretsKeys(context));

  const terraformStatePassphrase = loadTerraformStatePassphrase() ||
    createTerraformStatePassphrase();

  const argoUIReadonlyPassword = loadArgoUIReadonlyPassword() ||
    createArgoUIReadOnlyPassword();

  if (initializing) {
    const directoryContainsCNDIFiles = await checkInitialized(context);

    const shouldContinue = directoryContainsCNDIFiles
      ? confirm(
        "It looks like you have already initialized a cndi project in this directory. Overwrite existing artifacts?",
      )
      : true;

    if (!shouldContinue) {
      Deno.exit(0);
    }

    if (!noGitHub) {
      try {
        // overwrite the github workflows and readme, do not clobber other files
        await copy(path.join(CNDI_SRC, "github"), githubDirectory, {
          overwrite: true,
        });
      } catch (githubCopyError) {
        console.log("failed to copy github integration files");
        console.error(githubCopyError);
      }
    }

    // update gitignore
    const gitignorePath = path.join(projectDirectory, ".gitignore");
    updateGitIgnore(gitignorePath);

    if (!noDotEnv) {
      await Deno.writeTextFile(
        dotEnvPath,
        getDotEnv(
          sealedSecretsKeys,
          terraformStatePassphrase,
          argoUIReadonlyPassword,
        ),
      );
    }

    await Deno.writeTextFile(path.join(projectDirectory,'README.md'), getReadme());
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
      await Deno.writeTextFile(
        path.join(pathToKubernetesManifests, secretName),
        await getSealedSecretManifest(secret, tempPublicKeyFilePath, context),
      );
      console.log(`created encrypted secret:`, secretName);
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
  Object.keys(applications).forEach(async (releaseName) => {
    const applicationSpec = applications[releaseName];
    const [manifestContent, filename] = getApplicationManifest(
      releaseName,
      applicationSpec,
    );
    await Deno.writeTextFile(
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
