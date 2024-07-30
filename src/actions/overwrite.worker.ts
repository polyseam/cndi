import { ccolors, loadEnv, path } from "deps";

import {
  checkDirectoryForFileSuffix,
  getPrettyJSONString,
  getYAMLString,
  loadCndiConfig,
  loadJSONC,
  persistStagedFiles,
  stageDirectory,
  stageFile,
} from "src/utils.ts";

import { loadSealedSecretsKeys } from "src/initialize/sealedSecretsKeys.ts";

import getApplicationManifest from "src/outputs/application-manifest.ts";
import RootChartYaml from "src/outputs/root-chart.ts";
import getSealedSecretManifestWithKSC from "src/outputs/sealed-secret-manifest.ts";

import { getFunctionsDockerfileContent } from "src/outputs/functions/runtime-dockerfile.ts";
import { getFunctionsMainContent } from "src/outputs/functions/main-function.ts";

import { getFunctionsNamespaceManifest } from "src/outputs/functions/manifests/fns-namespace.ts";
import { getFunctionsServiceManifest } from "src/outputs/functions/manifests/fns-service.ts";
import { getFunctionsIngressManifest } from "src/outputs/functions/manifests/fns-ingress.ts";
import { getFunctionsEnvSecretManifest } from "src/outputs/functions/manifests/fns-env-secret.ts";
import { getFunctionsPullSecretManifest } from "src/outputs/functions/manifests/fns-pull-secret.ts";
import { getFunctionsDeploymentManifest } from "src/outputs/functions/manifests/fns-deployment.ts";

import getCndiRunGitHubWorkflowYamlContents from "src/outputs/cndi-run-workflow.ts";
import getCndiOnPullGitHubWorkflowYamlContents from "src/outputs/cndi-onpull-workflow.ts";
import getCndiFnsGitHubWorkflowYamlContents from "src/outputs/cndi-fns-workflow.ts";

import getMicrok8sIngressTcpServicesConfigMapManifest from "src/outputs/custom-port-manifests/microk8s/ingress-tcp-services-configmap.ts";
import getMicrok8sIngressDaemonsetManifest from "src/outputs/custom-port-manifests/microk8s/ingress-daemonset.ts";

import getProductionClusterIssuerManifest from "src/outputs/cert-manager-manifests/production-cluster-issuer.ts";
import getDevClusterIssuerManifest from "src/outputs/cert-manager-manifests/self-signed/dev-cluster-issuer.ts";

import getExternalDNSManifest from "src/outputs/core-applications/external-dns.application.yaml.ts";
import getCertManagerApplicationManifest from "src/outputs/core-applications/cert-manager.application.yaml.ts";
import getPrivateNginxApplicationManifest from "src/outputs/core-applications/private-nginx.application.yaml.ts";
import getPublicNginxApplicationManifest from "src/outputs/core-applications/public-nginx.application.yaml.ts";
import getReloaderApplicationManifest from "src/outputs/core-applications/reloader.application.yaml.ts";
import stageTerraformResourcesForConfig from "src/outputs/terraform/stageTerraformResourcesForConfig.ts";

import {
  CNDIConfig,
  CNDIProvider,
  KubernetesManifest,
  KubernetesSecret,
} from "src/types.ts";
import validateConfig from "src/validate/cndiConfig.ts";

const owLabel = ccolors.faded("\nsrc/commands/overwrite.worker.ts:");

const PROVIDERS_SUPPORTING_KEYLESS: Array<CNDIProvider> = [];

interface OverwriteActionOptions {
  output: string;
  file?: string;
  initializing: boolean;
  workflowSourceRef?: string;
  updateGhWorkflow?: boolean;
  enablePrChecks?: boolean;
}

type OverwriteWorkerMessage = {
  data: {
    options?: OverwriteActionOptions;
    type: "begin-overwrite" | "complete-overwrite" | "error-overwrite";
    code?: number;
  };
};

declare const self: {
  onmessage: (message: OverwriteWorkerMessage) => void;
  postMessage: (
    message: {
      type: "complete-overwrite" | "error-overwrite";
      code?: number;
      message?: string;
    },
  ) => void;
  close: () => never;
  Deno: typeof Deno;
};

// forgive me
self.Deno.exit = (code?: number): never => {
  if (code) {
    self.postMessage({ type: "error-overwrite", code });
  } else {
    self.postMessage({ type: "complete-overwrite" });
  }
  self.close();
};

type ManifestWithName = {
  metadata: {
    name: string;
  };
};

self.onmessage = async (message: OverwriteWorkerMessage) => {
  // EVERY EXIT MUST BE PASSED UP TO THE WORKFLOW OWNER
  if (message.data.type === "begin-overwrite") {
    const options = message.data.options as OverwriteActionOptions;

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

    const pathToFunctionsOutput = path.join(
      options.output,
      "cndi",
      "functions",
    );

    const envPath = path.join(options.output, ".env");
    let config: CNDIConfig;
    let pathToConfig: string;

    try {
      const result = await loadCndiConfig(options.output);
      config = result.config;
      pathToConfig = result.pathToConfig;
    } catch (errorLoadingCndiConfig) {
      self.postMessage({
        type: "error-overwrite",
        code: errorLoadingCndiConfig.cause,
        message: errorLoadingCndiConfig.message,
      });
      return;
    }

    await loadEnv({ export: true, envPath });

    try {
      await validateConfig(config, pathToConfig);
    } catch (errorValidatingConfig) {
      self.postMessage({
        type: "error-overwrite",
        code: errorValidatingConfig.cause,
        message: errorValidatingConfig.message,
      });
    }

    const tryKeyless = config?.infrastructure?.cndi?.keyless === true;

    if (tryKeyless) {
      if (!PROVIDERS_SUPPORTING_KEYLESS.includes(config?.provider)) {
        try {
          throw new Error(
            [
              owLabel,
              ccolors.error(
                `'keyless' infrastructure is not yet supported for provider`,
              ),
              ccolors.key_name(config?.provider),
            ].join(" "),
            { cause: 510 },
          );
        } catch (error) {
          self.postMessage({
            type: "error-overwrite",
            code: error.cause,
            message: error.message,
          });
          return;
        }
        // TODO: do keyless stuff
      }
    }

    // resources outside of ./cndi should only be staged if initializing or manually requested
    if (options.initializing || options.updateGhWorkflow) {
      const runWorkflowPath = path.join(
        ".github",
        "workflows",
        "cndi-run.yaml",
      );

      await stageFile(
        runWorkflowPath,
        getCndiRunGitHubWorkflowYamlContents(
          config,
          options?.workflowSourceRef,
        ),
      );

      console.log(
        ccolors.success("staged 'cndi-run' GitHub workflow:"),
        ccolors.key_name(runWorkflowPath),
      );

      if (options?.enablePrChecks) {
        const onPullWorkflowPath = path.join(
          ".github",
          "workflows",
          "cndi-onpull.yaml",
        );

        await stageFile(
          onPullWorkflowPath,
          getCndiOnPullGitHubWorkflowYamlContents(),
        );

        console.log(
          ccolors.success("staged 'cndi-onpull' GitHub workflow:"),
          ccolors.key_name(onPullWorkflowPath),
        );
      }
    }

    const pathToFunctionsInput = path.join(
      options.output,
      "functions",
    );

    const shouldBuildFunctions = await checkDirectoryForFileSuffix(
      pathToFunctionsInput,
      ".ts",
    );

    try {
      await Deno.remove(pathToFunctionsOutput, {
        recursive: true,
      });
    } catch {
      // folder did not exist
    }

    if (shouldBuildFunctions) {
      const fnsWorkflowPath = path.join(
        ".github",
        "workflows",
        "cndi-fns.yaml",
      );

      await stageDirectory(
        path.join("cndi", "functions", "src"),
        path.join("functions"),
      );

      await stageFile(
        path.join("cndi", "functions", "src", "main", "index.ts"),
        getFunctionsMainContent(),
      );
      console.log(
        ccolors.success("staged functions bootstrap source"),
        ccolors.key_name("cndi/functions/src/main/index.ts"),
      );

      await stageFile(
        path.join("cndi", "functions", "Dockerfile"),
        getFunctionsDockerfileContent(),
      );
      console.log(
        ccolors.success("staged functions Dockerfile"),
        ccolors.key_name("cndi/functions/Dockerfile"),
      );

      await stageFile(
        fnsWorkflowPath,
        getCndiFnsGitHubWorkflowYamlContents(
          config,
        ),
      );
      console.log(
        ccolors.success("staged 'cndi-fns' GitHub workflow:"),
        ccolors.key_name(fnsWorkflowPath),
      );

      await stageFile(
        path.join("cndi", "cluster_manifests", "fns-namespace.yaml"),
        getFunctionsNamespaceManifest(),
      );
      console.log(
        ccolors.success("staged functions namespace manifest:"),
        ccolors.key_name("fns-namespace.yaml"),
      );

      await stageFile(
        path.join("cndi", "cluster_manifests", "fns-service.yaml"),
        getFunctionsServiceManifest(),
      );
      console.log(
        ccolors.success("staged functions service manifest:"),
        ccolors.key_name("fns-service.yaml"),
      );

      const functionsIngressHostname = config?.infrastructure?.cndi?.functions
        ?.hostname;

      if (functionsIngressHostname) {
        await stageFile(
          path.join("cndi", "cluster_manifests", "fns-ingress.yaml"),
          getFunctionsIngressManifest(
            functionsIngressHostname,
          ),
        );
        console.log(
          ccolors.success("staged functions ingress manifest:"),
          ccolors.key_name("fns-ingress.yaml"),
        );
      }

      let hasExistingFnsEnvSecret = false;

      Object.entries(config?.cluster_manifests || {}).forEach(
        (manifestEntry) => {
          const m = manifestEntry[1] as ManifestWithName;
          if (m?.metadata?.name === "fns-env-secret") {
            hasExistingFnsEnvSecret = true;
          }
        },
      );

      // only insert empty env secret to cluster_manifests if the user doesn't supply one
      if (!hasExistingFnsEnvSecret) {
        config.cluster_manifests["fns-env-secret"] =
          getFunctionsEnvSecretManifest();
      }

      config.cluster_manifests["fns-pull-secret"] =
        getFunctionsPullSecretManifest();

      await stageFile(
        path.join("cndi", "cluster_manifests", "fns-deployment.yaml"),
        getFunctionsDeploymentManifest(),
      );

      console.log(
        ccolors.success("staged functions deployment manifest:"),
        ccolors.key_name("fns-deployment.yaml"),
      );
    }

    try {
      // remove all files in cndi/terraform
      await Deno.remove(pathToTerraformResources, {
        recursive: true,
      });
    } catch {
      // folder did not exist
    }

    const terraformStatePassphrase = Deno.env.get("TERRAFORM_STATE_PASSPHRASE");

    if (!terraformStatePassphrase) {
      self.postMessage({
        type: "error-overwrite",
        code: 503,
        message: [
          owLabel,
          ccolors.key_name(`"TERRAFORM_STATE_PASSPHRASE"`),
          ccolors.error(`is not set in environment`),
        ].join(" "),
      });
      return;
    }

    const isClusterless = config?.distribution === "clusterless";

    if (!isClusterless) {
      const cluster_manifests = config?.cluster_manifests || {};
      // this ks_checks will be written to cndi/ks_checks.json
      let ks_checks: Record<string, string> = {};

      // ⚠️ ks_checks.json is being loaded into ksc here from a previous run of `cndi overwrite`
      let ksc: Record<string, string> = {};

      // create temporary key for sealing secrets
      const tempPublicKeyFilePath = await Deno.makeTempFile();

      // these environment variables are required for clusters
      const sealedSecretsKeys = loadSealedSecretsKeys();

      const argoUIAdminPassword = Deno.env.get("ARGOCD_ADMIN_PASSWORD");

      if (!sealedSecretsKeys) {
        self.postMessage({
          type: "error-overwrite",
          code: 501,
          message: [
            owLabel,
            ccolors.key_name(`"SEALED_SECRETS_PUBLIC_KEY"`),
            ccolors.error(`and/or`),
            ccolors.key_name(`"SEALED_SECRETS_PRIVATE_KEY"`),
            ccolors.error(`are not present in environment`),
          ].join(" "),
        });
        return;
      }

      if (!argoUIAdminPassword) {
        self.postMessage({
          type: "error-overwrite",
          code: 502,
          message: [
            owLabel,
            ccolors.key_name(`"ARGOCD_ADMIN_PASSWORD"`),
            ccolors.error(`is not set in environment`),
          ].join(" "),
        });
        return;
      }

      // This is being loaded _from_ the CNDI directory to determine if we need to seal new secrets
      try {
        ksc = await loadJSONC(
          path.join(options.output, "cndi", "ks_checks.json"),
        ) as Record<string, string>;
      } catch {
        // ks_checks.json did not exist or was invalid JSON
      }

      // restage the SealedSecret yaml file for every key in ks_checks.json
      for (const key in ksc) {
        ks_checks[key] = ksc[key];

        let sealedManifest = "";

        try {
          sealedManifest = await Deno.readTextFileSync(
            path.join(
              options.output,
              "cndi",
              "cluster_manifests",
              `${key}.yaml`,
            ),
          );
        } catch {
          console.error(
            ccolors.warn(
              `failed to read SealedSecret: "${
                ccolors.key_name(key + ".yaml")
              }" referenced in 'ks_checks.json'`,
            ),
          );
          // sealedManifest from ks_checks.json did not exist
          // so we remove it from the ks_check.json list
          delete ks_checks[key];
        }

        try {
          if (sealedManifest && cluster_manifests?.[key]) {
            await stageFile(
              path.join("cndi", "cluster_manifests", `${key}.yaml`),
              sealedManifest,
            );
          } else {
            // sealedManifest either did not exist or is no longer in cluster_manifests
            delete ks_checks[key];
          }
        } catch {
          // failed to stage sealedManifest from ks_checks.json
        }
      }

      try {
        // remove all files in cndi/cluster
        await Deno.remove(pathToKubernetesManifests, {
          recursive: true,
        });
      } catch {
        // folder did not exist
      }

      await Deno.writeTextFile(
        tempPublicKeyFilePath,
        sealedSecretsKeys.sealed_secrets_public_key,
      );

      const cert_manager = config?.infrastructure?.cndi?.cert_manager;

      const skipCertManager = // explicitly disabled cert-manager
        config?.infrastructure?.cndi?.cert_manager?.enabled === false;

      if (cert_manager && !skipCertManager) {
        await stageFile(
          path.join(
            "cndi",
            "cluster_manifests",
            "applications",
            "cert-manager.application.yaml",
          ),
          getCertManagerApplicationManifest(),
        );

        console.log(
          ccolors.success("staged application manifest:"),
          ccolors.key_name("cert-manager.application.yaml"),
        );

        if (cert_manager?.self_signed) {
          await stageFile(
            path.join(
              "cndi",
              "cluster_manifests",
              "cert-manager-cluster-issuer.yaml",
            ),
            getDevClusterIssuerManifest(),
          );
        } else {
          await stageFile(
            path.join(
              "cndi",
              "cluster_manifests",
              "cert-manager-cluster-issuer.yaml",
            ),
            getProductionClusterIssuerManifest(cert_manager?.email),
          );
        }
      }

      const skipReloader = // explicitly disabled reloader
        config?.infrastructure?.cndi?.reloader?.enabled === false;

      if (!skipReloader) {
        await stageFile(
          path.join(
            "cndi",
            "cluster_manifests",
            "applications",
            "reloader.application.yaml",
          ),
          getReloaderApplicationManifest(),
        );
      }

      const ingress = config?.infrastructure?.cndi?.ingress;
      const skipPrivateIngress = ingress?.nginx?.private?.enabled !== true; // explicitly enabled private ingress
      const skipPublicIngress = ingress?.nginx?.public?.enabled === false; // explicitly disabled public ingress

      if (!skipPublicIngress) {
        await stageFile(
          path.join(
            "cndi",
            "cluster_manifests",
            "applications",
            "public_nginx.application.yaml",
          ),
          getPublicNginxApplicationManifest(config),
        );
        console.log(
          ccolors.success("staged application manifest:"),
          ccolors.key_name("public_nginx.application.yaml"),
        );
      }

      if (!skipPrivateIngress) {
        await stageFile(
          path.join(
            "cndi",
            "cluster_manifests",
            "applications",
            "private_nginx.application.yaml",
          ),
          getPrivateNginxApplicationManifest(config),
        );
        console.log(
          ccolors.success("staged application manifest:"),
          ccolors.key_name("private_nginx.application.yaml"),
        );
      }

      const open_ports = config?.infrastructure?.cndi?.open_ports || [];

      const isMicrok8sCluster = config?.distribution === "microk8s";

      if (
        isMicrok8sCluster
      ) {
        await Promise.all([
          stageFile(
            path.join(
              "cndi",
              "cluster_manifests",
              "ingress-tcp-services-configmap.yaml",
            ),
            getMicrok8sIngressTcpServicesConfigMapManifest(open_ports),
          ),
          stageFile(
            path.join("cndi", "cluster_manifests", "ingress-daemonset.yaml"),
            getMicrok8sIngressDaemonsetManifest(open_ports),
          ),
        ]);
      }
      console.log(ccolors.success("staged open ports manifests"));

      await stageFile(
        path.join("cndi", "cluster_manifests", "Chart.yaml"),
        RootChartYaml,
      );

      // write each manifest in the "cluster_manifests" section of the config to `cndi/cluster_manifests`
      for (const key in cluster_manifests) {
        const manifestObj = cluster_manifests[key] as KubernetesManifest;

        if (manifestObj?.kind && manifestObj.kind === "Secret") {
          const secret = cluster_manifests[key] as KubernetesSecret;
          const secretFileName = `${key}.yaml`;
          let sealedSecretManifestWithKSC;

          try {
            sealedSecretManifestWithKSC = await getSealedSecretManifestWithKSC(
              secret,
              {
                publicKeyFilePath: tempPublicKeyFilePath,
                envPath,
                ks_checks,
                secretFileName,
              },
            );
          } catch (error) {
            self.postMessage({
              type: "error-overwrite",
              code: error.cause,
              message: error.message,
            });
            return;
          }

          const sealedSecretManifest = sealedSecretManifestWithKSC?.manifest;

          if (sealedSecretManifest) {
            // add the ksc to the ks_checks object
            ks_checks = {
              ...ks_checks,
              ...sealedSecretManifestWithKSC?.ksc,
            };

            await stageFile(
              path.join("cndi", "cluster_manifests", secretFileName),
              sealedSecretManifest,
            );

            console.log(
              ccolors.success(`staged encrypted secret:`),
              ccolors.key_name(secretFileName),
            );
          }
          continue;
        }

        const manifestFilename = `${key}.yaml`;
        await stageFile(
          path.join("cndi", "cluster_manifests", manifestFilename),
          getYAMLString(manifestObj),
        );
        console.log(
          ccolors.success("staged manifest:"),
          ccolors.key_name(manifestFilename),
        );
      }

      await stageFile(
        path.join("cndi", "ks_checks.json"),
        getPrettyJSONString(ks_checks),
      );

      console.log(
        ccolors.success("staged metadata:"),
        ccolors.key_name("ks_checks.json"),
      );

      const skipExternalDNS =
        config?.infrastructure?.cndi?.external_dns?.enabled === false;

      if (!skipExternalDNS) {
        await stageFile(
          path.join(
            "cndi",
            "cluster_manifests",
            "applications",
            "external-dns.application.yaml",
          ),
          getExternalDNSManifest(config),
        );
        console.log(
          ccolors.success("staged application manifest:"),
          ccolors.key_name("external-dns.application.yaml"),
        );
      }

      const { applications } = config;

      // write the `cndi/cluster_manifests/applications/${applicationName}.application.yaml` file for each application
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
    }

    try {
      await stageTerraformResourcesForConfig(config); //, options);
    } catch (error) {
      self.postMessage({
        type: "error-overwrite",
        code: error.cause,
        message: error.message,
      });
      return;
    }

    console.log();

    console.log(ccolors.success("staged terraform stack"));

    try {
      await persistStagedFiles(options.output);
      console.log("  ");
    } catch (_errorPersistingStagedFiles) {
      try {
        throw new Error(
          [
            owLabel,
            ccolors.error(`failed to persist staged cndi files to`),
            ccolors.user_input(`${options.output}`),
          ].join(" "),
          { cause: 509 },
        );
      } catch (error) {
        self.postMessage({
          type: "error-overwrite",
          code: error.cause,
          message: error.message,
        });
        return;
      }
    }

    const completionMessage = options?.initializing
      ? `initialized your cndi project at ${ccolors.key_name(options.output)}!`
      : `overwrote your cndi project files in ${
        ccolors.key_name(path.join(options.output, "cndi"))
      }!`;

    console.log("\n" + completionMessage);

    self.postMessage({ type: "complete-overwrite" });
    self.close();
  }
};
