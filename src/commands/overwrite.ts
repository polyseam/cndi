import { ccolors, Command, exists, path } from "deps";

import {
  emitExitEvent,
  getPrettyJSONString,
  getStagingDir,
  loadJSONC,
  loadYAML,
  persistStagedFiles,
  stageFile,
} from "src/utils.ts";

import { loadSealedSecretsKeys } from "src/initialize/sealedSecretsKeys.ts";
import { loadTerraformStatePassphrase } from "src/initialize/terraformStatePassphrase.ts";
import { loadArgoUIAdminPassword } from "src/initialize/argoUIAdminPassword.ts";

import getApplicationManifest from "src/outputs/application-manifest.ts";
import RootChartYaml from "src/outputs/root-chart.ts";
import getSealedSecretManifest from "src/outputs/sealed-secret-manifest.ts";

import getMicrok8sIngressTcpServicesConfigMapManifest from "src/outputs/custom-port-manifests/microk8s/ingress-tcp-services-configmap.ts";
import getMicrok8sIngressDaemonsetManifest from "src/outputs/custom-port-manifests/microk8s/ingress-daemonset.ts";

import getProductionClusterIssuerManifest from "src/outputs/cert-manager-manifests/production-cluster-issuer.ts";
import getDevClusterIssuerManifest from "src/outputs/cert-manager-manifests/self-signed/dev-cluster-issuer.ts";

import getEKSIngressServiceManifest from "src/outputs/custom-port-manifests/eks/ingress-service.ts";
import getEKSIngressTcpServicesConfigMapManifest from "src/outputs/custom-port-manifests/eks/ingress-tcp-services-configmap.ts";

import stageTerraformResourcesForConfig from "src/outputs/terraform/stageTerraformResourcesForConfig.ts";

import { CNDIConfig, KubernetesManifest, KubernetesSecret } from "src/types.ts";
import validateConfig from "src/validate/cndiConfig.ts";
import { NON_MICROK8S_NODE_KINDS } from "consts";

const owLabel = ccolors.faded("\nsrc/commands/overwrite.ts:");

interface OverwriteActionArgs {
  output: string;
  initializing: boolean;
}

const overwriteAction = async (options: OverwriteActionArgs) => {
  let pathToConfig;
  let configIsYAML = true;
  const isFile = true;
  if (await exists(path.join(options.output, "cndi-config.yaml"), { isFile })) {
    pathToConfig = path.join(options.output, "cndi-config.yaml");
  } else if (
    await exists(path.join(options.output, "cndi-config.yml"), { isFile })
  ) {
    pathToConfig = path.join(options.output, "cndi-config.yml");
  } else if (
    await exists(path.join(options.output, "cndi-config.jsonc"), { isFile })
  ) {
    pathToConfig = path.join(options.output, "cndi-config.jsonc");
    configIsYAML = false;
  } else if (
    await exists(path.join(options.output, "cndi-config.json"), { isFile })
  ) {
    pathToConfig = path.join(options.output, "cndi-config.json");
    configIsYAML = false;
  } else {
    console.error(
      owLabel,
      ccolors.error("there is no cndi-config file at"),
      ccolors.user_input(`"${options.output}"`),
    );
    console.log(
      "if you don't have a cndi-config file try",
      ccolors.prompt("cndi init"),
    );
    await emitExitEvent(500);
    Deno.exit(500);
  }

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
    config = configIsYAML
      ? ((await loadJSONC(pathToConfig)) as unknown as CNDIConfig)
      : ((await loadYAML(pathToConfig)) as unknown as CNDIConfig);
  } catch {
    console.error(
      owLabel,
      ccolors.error("your cndi config file at"),
      ccolors.user_input(`"${pathToConfig}"`),
      ccolors.error("is not valid"),
    );
    await emitExitEvent(504);
    Deno.exit(504);
  }

  if (!options.initializing) {
    console.log(`cndi overwrite --file "${pathToConfig}"\n`);
  } else {
    console.log();
  }

  await validateConfig(config, pathToConfig);

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
    );
    await emitExitEvent(501);
    Deno.exit(501);
  }

  if (!argoUIAdminPassword) {
    console.error(
      owLabel,
      ccolors.key_name(`"ARGOCD_ADMIN_PASSWORD"`),
      ccolors.error(`is not set in environment`),
    );
    await emitExitEvent(502);
    Deno.exit(502);
  }

  if (!terraformStatePassphrase) {
    console.error(
      owLabel,
      ccolors.key_name(`"TERRAFORM_STATE_PASSPHRASE"`),
      ccolors.error(`is not set in environment`),
    );
    await emitExitEvent(503);
    Deno.exit(503);
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

  await stageTerraformResourcesForConfig(config, options);

  console.log(ccolors.success("staged terraform files"));

  const cert_manager = config?.infrastructure?.cndi?.cert_manager;

  if (cert_manager) {
    if (cert_manager?.self_signed) {
      await stageFile(
        path.join(
          "cndi",
          "cluster_manifests",
          "cert-manager-cluster-issuer.json",
        ),
        getDevClusterIssuerManifest(),
      );
    } else {
      await stageFile(
        path.join(
          "cndi",
          "cluster_manifests",
          "cert-manager-cluster-issuer.json",
        ),
        getProductionClusterIssuerManifest(cert_manager?.email),
      );
    }
  }

  const open_ports = config?.infrastructure?.cndi?.open_ports;
  const isNotMicrok8sCluster = NON_MICROK8S_NODE_KINDS.includes(
    config?.infrastructure?.cndi?.nodes?.[0]?.kind,
  );

  if (open_ports) {
    if (
      isNotMicrok8sCluster // currently only EKS
    ) {
      await Promise.all([
        stageFile(
          path.join(
            "cndi",
            "cluster_manifests",
            "ingress-tcp-services-configmap.json",
          ),
          getEKSIngressTcpServicesConfigMapManifest(open_ports),
        ),
        stageFile(
          path.join("cndi", "cluster_manifests", "ingress-service.json"),
          getEKSIngressServiceManifest(open_ports),
        ),
      ]);
    } else {
      await Promise.all([
        stageFile(
          path.join(
            "cndi",
            "cluster_manifests",
            "ingress-tcp-services-configmap.json",
          ),
          getMicrok8sIngressTcpServicesConfigMapManifest(open_ports),
        ),
        stageFile(
          path.join("cndi", "cluster_manifests", "ingress-daemonset.json"),
          getMicrok8sIngressDaemonsetManifest(open_ports),
        ),
      ]);
    }
    console.log(ccolors.success("staged open ports manifests"));
  }

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
        console.log(
          ccolors.success(`staged encrypted secret:`),
          ccolors.key_name(secretName),
        );
      }
      continue;
    }
    const manifestFilename = `${key}.json`;
    await stageFile(
      path.join("cndi", "cluster_manifests", manifestFilename),
      getPrettyJSONString(manifestObj),
    );
    console.log(
      ccolors.success("staged manifest:"),
      ccolors.key_name(manifestFilename),
    );
  }

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
    console.log(
      ccolors.success("staged application manifest:"),
      ccolors.key_name(filename),
    );
  }

  try {
    await persistStagedFiles(options.output);
    console.log();
  } catch (errorPersistingStagedFiles) {
    console.error(
      owLabel,
      ccolors.error(`failed to persist staged cndi files to`),
      ccolors.user_input(`${options.output}`),
    );
    console.log(ccolors.caught(errorPersistingStagedFiles));
    await Deno.remove(await getStagingDir(), { recursive: true });
    await emitExitEvent(509);
    Deno.exit(509);
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
