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

import { ErrOut } from "errout";

import { loadSealedSecretsKeys } from "src/initialize/sealedSecretsKeys.ts";

import getApplicationManifest from "src/outputs/application-manifest.ts";
import RootChartYaml from "src/outputs/root-chart.ts";

// Sealed Secrets
import getSealedSecretManifestWithKSC from "src/outputs/sealed-secret-manifest.ts";

// Functions Source
import { getFunctionsDockerfileContent } from "src/outputs/functions/runtime-dockerfile.ts";
import { getFunctionsMainContent } from "src/outputs/functions/main-function.ts";

// Functions Manifests
import { getFunctionsNamespaceManifest } from "src/outputs/functions/manifests/fns-namespace.ts";
import { getFunctionsServiceManifest } from "src/outputs/functions/manifests/fns-service.ts";
import { getFunctionsIngressManifest } from "src/outputs/functions/manifests/fns-ingress.ts";
import { getFunctionsEnvSecretManifest } from "src/outputs/functions/manifests/fns-env-secret.ts";
import { getFunctionsPullSecretManifest } from "src/outputs/functions/manifests/fns-pull-secret.ts";
import { getFunctionsDeploymentManifest } from "src/outputs/functions/manifests/fns-deployment.ts";

// GitHub Workflows
import getCndiRunGitHubWorkflowYamlContents from "src/outputs/cndi-run-workflow.ts";
import getCndiOnPullGitHubWorkflowYamlContents from "src/outputs/cndi-onpull-workflow.ts";
import getCndiFnsGitHubWorkflowYamlContents from "src/outputs/cndi-fns-workflow.ts";

// Microk8s Manifests
import getMicrok8sIngressTcpServicesConfigMapManifest from "src/outputs/custom-port-manifests/microk8s/ingress-tcp-services-configmap.ts";
import getMicrok8sIngressDaemonsetManifest from "src/outputs/custom-port-manifests/microk8s/ingress-daemonset.ts";

// Cert Manager Manifests
import getProductionClusterIssuerManifest from "src/outputs/cert-manager-manifests/production-cluster-issuer.ts";
import getDevClusterIssuerManifest from "src/outputs/cert-manager-manifests/self-signed/dev-cluster-issuer.ts";

// Core Apps
import getExternalDNSManifest from "src/outputs/core-applications/external-dns.application.yaml.ts";
import getCertManagerApplicationManifest from "src/outputs/core-applications/cert-manager.application.yaml.ts";
import getPrivateNginxApplicationManifest from "src/outputs/core-applications/private-nginx.application.yaml.ts";
import getPublicNginxApplicationManifest from "src/outputs/core-applications/public-nginx.application.yaml.ts";
import getReloaderApplicationManifest from "src/outputs/core-applications/reloader.application.yaml.ts";
import getKubePrometheusStackApplicationManifest from "src/outputs/core-applications/kube-prometheus-stack.application.yaml.ts";
import getPromtailApplicationManifest from "src/outputs/core-applications/promtail.application.yaml.ts";
import getLokiApplicationManifest from "src/outputs/core-applications/loki.application.yaml.ts";
import { getGrafanaIngressManifest } from "src/outputs/ingress/grafana-ingress.yaml.ts";
import { getArgoIngressManifest } from "src/outputs/ingress/argo-ingress.yaml.ts";

import stageTerraformResourcesForConfig from "src/outputs/terraform/stageTerraformResourcesForConfig.ts";

import { KubernetesManifest, KubernetesSecret } from "src/types.ts";

import validateConfig from "src/validate/cndiConfig.ts";

const label = ccolors.faded("\nsrc/commands/overwrite.worker.ts:");

interface OverwriteActionOptions {
  output: string;
  file?: string;
  initializing: boolean;
  runWorkflowSourceRef?: string;
  updateWorkflow: ("run" | "check")[];
}

type WorkerMessageType =
  | "begin-overwrite"
  | "complete-overwrite"
  | "error-overwrite";
export type OverwriteWorkerMessage = {
  data: {
    type: WorkerMessageType;
    options?: OverwriteActionOptions;
    code?: number;
  };
};

export interface OverwriteWorkerMessageIncoming extends OverwriteWorkerMessage {
  data: {
    type: "begin-overwrite";
    options: OverwriteActionOptions;
    globalThis: {
      stagingDirectory: string;
    };
  };
}

export type OverwriteWorkerMessageOutgoing = {
  type: WorkerMessageType;
  code?: number;
  message?: string;
};

declare const self: {
  onmessage: (message: OverwriteWorkerMessage) => void;
  postMessage: (message: OverwriteWorkerMessageOutgoing) => void;
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

self.onmessage = async (msg: OverwriteWorkerMessage) => {
  // EVERY EXIT MUST BE PASSED UP TO THE WORKFLOW OWNER
  if (msg.data.type === "begin-overwrite") {
    const message = msg as OverwriteWorkerMessageIncoming;
    const options = message.data.options as OverwriteActionOptions;

    // deno-lint-ignore no-explicit-any
    (globalThis as any).stagingDirectory =
      message.data.globalThis.stagingDirectory;

    const envPath = path.join(options.output, ".env");

    const [errorLoadingConfig, result] = await loadCndiConfig(options.output);

    if (errorLoadingConfig) {
      await self.postMessage(errorLoadingConfig.owWorkerErrorMessage);
      return;
    }

    const config = result.config;

    const pathToConfig = result.pathToConfig;

    await loadEnv({ export: true, envPath });

    const validationError = validateConfig(config, pathToConfig);

    if (validationError) {
      await self.postMessage(validationError.owWorkerErrorMessage);
      return;
    }

    const tryKeyless = config?.infrastructure?.cndi?.keyless === true;

    if (tryKeyless) {
      // TODO: implement keyless
    }

    // resources outside of ./cndi should only be staged if initializing or manually requested
    if (options.initializing || options?.updateWorkflow?.includes("run")) {
      const runWorkflowPath = path.join(
        ".github",
        "workflows",
        "cndi-run.yaml",
      );

      if (config?.provider !== "dev") {
        const errStagingOnRunWorkflow = await stageFile(
          runWorkflowPath,
          getCndiRunGitHubWorkflowYamlContents(
            config,
            options?.runWorkflowSourceRef,
          ),
        );

        if (errStagingOnRunWorkflow) {
          await self.postMessage(errStagingOnRunWorkflow.owWorkerErrorMessage);
          return;
        }

        console.log(
          ccolors.success("staged 'cndi-run' GitHub workflow:"),
          ccolors.key_name(runWorkflowPath),
        );
      } else {
        console.log(
          ccolors.success("skipping 'cndi-run' workflow for"),
          ccolors.key_name("dev"),
          ccolors.success("provider"),
        );
      }
    }

    if (options.initializing || options?.updateWorkflow?.includes("check")) {
      const onPullWorkflowPath = path.join(
        ".github",
        "workflows",
        "cndi-onpull.yaml",
      );

      const errStagingOnPullWorkflow = await stageFile(
        onPullWorkflowPath,
        getCndiOnPullGitHubWorkflowYamlContents(),
      );

      if (errStagingOnPullWorkflow) {
        await self.postMessage(errStagingOnPullWorkflow.owWorkerErrorMessage);
        return;
      }

      console.log(
        ccolors.success("staged 'cndi-onpull' GitHub workflow:"),
        ccolors.key_name(onPullWorkflowPath),
      );
    }

    const pathToFunctionsInput = path.join(options.output, "functions");

    const shouldBuildFunctions = await checkDirectoryForFileSuffix(
      pathToFunctionsInput,
      ".ts",
    );

    if (shouldBuildFunctions) {
      const fnsWorkflowPath = path.join(
        ".github",
        "workflows",
        "cndi-fns.yaml",
      );

      const errStagingFnsDir = await stageDirectory(
        path.join(options.output, "functions"),
        path.join("cndi", "functions", "src"),
      );

      if (errStagingFnsDir) {
        await self.postMessage(errStagingFnsDir.owWorkerErrorMessage);
        return;
      }

      const errStagingFnsEntrySrc = await stageFile(
        path.join("cndi", "functions", "src", "main", "index.ts"),
        getFunctionsMainContent(),
      );

      if (errStagingFnsEntrySrc) {
        await self.postMessage(errStagingFnsEntrySrc.owWorkerErrorMessage);
        return;
      }
      console.log(
        ccolors.success("staged functions bootstrap source"),
        ccolors.key_name("cndi/functions/src/main/index.ts"),
      );

      const errStagingFnsDockerfile = await stageFile(
        path.join("cndi", "functions", "Dockerfile"),
        getFunctionsDockerfileContent(),
      );
      if (errStagingFnsDockerfile) {
        await self.postMessage(errStagingFnsDockerfile.owWorkerErrorMessage);
        return;
      }
      console.log(
        ccolors.success("staged functions Dockerfile"),
        ccolors.key_name("cndi/functions/Dockerfile"),
      );

      const fnsBuildWorkflowErr = await stageFile(
        fnsWorkflowPath,
        getCndiFnsGitHubWorkflowYamlContents(config),
      );
      if (fnsBuildWorkflowErr) {
        await self.postMessage(fnsBuildWorkflowErr.owWorkerErrorMessage);
        return;
      }

      console.log(
        ccolors.success("staged 'cndi-fns' GitHub workflow:"),
        ccolors.key_name(fnsWorkflowPath),
      );

      const errStagingFnsNamespace = await stageFile(
        path.join("cndi", "cluster_manifests", "fns-namespace.yaml"),
        getFunctionsNamespaceManifest(),
      );
      if (errStagingFnsNamespace) {
        await self.postMessage(errStagingFnsNamespace.owWorkerErrorMessage);
        return;
      }
      console.log(
        ccolors.success("staged functions namespace manifest:"),
        ccolors.key_name("fns-namespace.yaml"),
      );

      const errStagingFnsSvc = await stageFile(
        path.join("cndi", "cluster_manifests", "fns-service.yaml"),
        getFunctionsServiceManifest(),
      );
      if (errStagingFnsSvc) {
        await self.postMessage(errStagingFnsSvc.owWorkerErrorMessage);
        return;
      }
      console.log(
        ccolors.success("staged functions service manifest:"),
        ccolors.key_name("fns-service.yaml"),
      );

      const functionsIngressHostname = config?.infrastructure?.cndi?.functions
        ?.hostname;

      if (functionsIngressHostname) {
        const errStagingFnsIngress = await stageFile(
          path.join("cndi", "cluster_manifests", "fns-ingress.yaml"),
          getFunctionsIngressManifest(functionsIngressHostname),
        );
        if (errStagingFnsIngress) {
          await self.postMessage(errStagingFnsIngress.owWorkerErrorMessage);
          return;
        }
        console.log(
          ccolors.success("staged functions ingress manifest:"),
          ccolors.key_name("fns-ingress.yaml"),
        );
      }

      let hasExistingFnsEnvSecret = false;

      const manifestEntries = Object.entries(config?.cluster_manifests || {});

      if (!manifestEntries.length) {
        config.cluster_manifests = {};
      }

      manifestEntries.forEach(
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

      const errStagingFnsDeployment = await stageFile(
        path.join("cndi", "cluster_manifests", "fns-deployment.yaml"),
        getFunctionsDeploymentManifest(),
      );

      if (errStagingFnsDeployment) {
        await self.postMessage(errStagingFnsDeployment.owWorkerErrorMessage);
        return;
      }
      console.log(
        ccolors.success("staged functions deployment manifest:"),
        ccolors.key_name("fns-deployment.yaml"),
      );
    }

    const terraformStatePassphrase = Deno.env.get("TERRAFORM_STATE_PASSPHRASE");

    if (!terraformStatePassphrase) {
      const err = new ErrOut(
        [
          ccolors.key_name(`"TERRAFORM_STATE_PASSPHRASE"`),
          ccolors.error(`is not set in environment`),
        ],
        {
          label,
          code: 503,
          id: "!env.TERRAFORM_STATE_PASSPHRASE",
        },
      );
      await self.postMessage(err.owWorkerErrorMessage);
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
        const err = new ErrOut([
          ccolors.key_name(`"SEALED_SECRETS_PUBLIC_KEY"`),
          ccolors.error(`and/or`),
          ccolors.key_name(`"SEALED_SECRETS_PRIVATE_KEY"`),
          ccolors.error(`are not present in environment`),
        ], {
          label,
          code: 501,
          id: "!env.SEALED_SECRETS_PUBLIC_KEY||!env.SEALED_SECRETS_PRIVATE_KEY",
        });
        await self.postMessage(err.owWorkerErrorMessage);
        return;
      }

      if (!argoUIAdminPassword) {
        const err = new ErrOut(
          [
            ccolors.key_name(`"ARGOCD_ADMIN_PASSWORD"`),
            ccolors.error(`is not set in environment`),
          ],
          {
            label,
            code: 502,
            id: "!env.ARGOCD_ADMIN_PASSWORD",
          },
        );
        await self.postMessage(err.owWorkerErrorMessage);
        return;
      }

      await Deno.writeTextFile(
        tempPublicKeyFilePath,
        sealedSecretsKeys.sealed_secrets_public_key,
      );

      const cert_manager = config?.infrastructure?.cndi?.cert_manager;

      const skipCertManager = // explicitly disabled cert-manager
        config?.infrastructure?.cndi?.cert_manager?.enabled === false;

      if (cert_manager && !skipCertManager) {
        const errStagingCertManApplication = await stageFile(
          path.join(
            "cndi",
            "cluster_manifests",
            "applications",
            "cert-manager.application.yaml",
          ),
          getCertManagerApplicationManifest(config),
        );
        if (errStagingCertManApplication) {
          await self.postMessage(
            errStagingCertManApplication.owWorkerErrorMessage,
          );
          return;
        }
        console.log(
          ccolors.success("staged application manifest:"),
          ccolors.key_name("cert-manager.application.yaml"),
        );

        if (cert_manager?.self_signed || config?.provider == "dev") {
          const errStagingSelfSignedCertManIssuer = await stageFile(
            path.join(
              "cndi",
              "cluster_manifests",
              "cert-manager-cluster-issuer.yaml",
            ),
            getDevClusterIssuerManifest(),
          );
          if (errStagingSelfSignedCertManIssuer) {
            await self.postMessage(
              errStagingSelfSignedCertManIssuer.owWorkerErrorMessage,
            );
            return;
          }
        } else {
          const errStagingProdCertManIssuer = await stageFile(
            path.join(
              "cndi",
              "cluster_manifests",
              "cert-manager-cluster-issuer.yaml",
            ),
            getProductionClusterIssuerManifest(cert_manager?.email),
          );
          if (errStagingProdCertManIssuer) {
            await self.postMessage(
              errStagingProdCertManIssuer.owWorkerErrorMessage,
            );
            return;
          }
        }
      }

      const skipReloader = // explicitly disabled reloader
        config?.infrastructure?.cndi?.reloader?.enabled === false;

      if (!skipReloader) {
        const errStagingReloaderApp = await stageFile(
          path.join(
            "cndi",
            "cluster_manifests",
            "applications",
            "reloader.application.yaml",
          ),
          getReloaderApplicationManifest(config),
        );
        if (errStagingReloaderApp) {
          await self.postMessage(errStagingReloaderApp.owWorkerErrorMessage);
          return;
        }
      }

      const ingress = config?.infrastructure?.cndi?.ingress;
      const skipPrivateIngress = ingress?.nginx?.private?.enabled !== true; // explicitly enabled private ingress
      const skipPublicIngress = ingress?.nginx?.public?.enabled === false; // explicitly disabled public ingress

      if (!skipPublicIngress) {
        const errStagingPublicIngApp = await stageFile(
          path.join(
            "cndi",
            "cluster_manifests",
            "applications",
            "public_nginx.application.yaml",
          ),
          getPublicNginxApplicationManifest(config),
        );
        if (errStagingPublicIngApp) {
          await self.postMessage(errStagingPublicIngApp.owWorkerErrorMessage);
          return;
        }
        console.log(
          ccolors.success("staged application manifest:"),
          ccolors.key_name("public_nginx.application.yaml"),
        );
      }

      if (!skipPrivateIngress) {
        const errStagingPrivateIngApp = await stageFile(
          path.join(
            "cndi",
            "cluster_manifests",
            "applications",
            "private_nginx.application.yaml",
          ),
          getPrivateNginxApplicationManifest(config),
        );
        if (errStagingPrivateIngApp) {
          await self.postMessage(errStagingPrivateIngApp.owWorkerErrorMessage);
          return;
        }
        console.log(
          ccolors.success("staged application manifest:"),
          ccolors.key_name("private_nginx.application.yaml"),
        );
      }

      const open_ports = config?.infrastructure?.cndi?.open_ports || [];

      const isMicrok8sCluster = config?.distribution === "microk8s";
      const isNotDevCluster = config?.provider !== "dev";

      if (isMicrok8sCluster && isNotDevCluster) {
        const errStagingMicrok8sIngConfigMap = await stageFile(
          path.join(
            "cndi",
            "cluster_manifests",
            "ingress-tcp-services-configmap.yaml",
          ),
          getMicrok8sIngressTcpServicesConfigMapManifest(open_ports),
        );
        if (errStagingMicrok8sIngConfigMap) {
          await self.postMessage(
            errStagingMicrok8sIngConfigMap.owWorkerErrorMessage,
          );
          return;
        }
        console.log(
          ccolors.success("staged open ports configmap manifest:"),
          ccolors.key_name("ingress-tcp-services-configmap.yaml"),
        );

        const errStagingmicrok8sIngDaemonset = await stageFile(
          path.join("cndi", "cluster_manifests", "ingress-daemonset.yaml"),
          getMicrok8sIngressDaemonsetManifest(open_ports),
        );
        if (errStagingmicrok8sIngDaemonset) {
          await self.postMessage(
            errStagingmicrok8sIngDaemonset.owWorkerErrorMessage,
          );
          return;
        }
        console.log(
          ccolors.success("staged open ports daemonset manifest:"),
          ccolors.key_name("ingress-daemonset.yaml"),
        );
      }
      console.log(ccolors.success("staged open ports manifests"));

      const errStagingChartYaml = await stageFile(
        path.join("cndi", "cluster_manifests", "Chart.yaml"),
        RootChartYaml,
      );

      if (errStagingChartYaml) {
        await self.postMessage(errStagingChartYaml.owWorkerErrorMessage);
        return;
      }

      const skipExternalDNS =
        config?.infrastructure?.cndi?.external_dns?.enabled === false;

      if (!skipExternalDNS) {
        const errStagingExtDnsApp = await stageFile(
          path.join(
            "cndi",
            "cluster_manifests",
            "applications",
            "external-dns.application.yaml",
          ),
          getExternalDNSManifest(config),
        );
        if (errStagingExtDnsApp) {
          await self.postMessage(errStagingExtDnsApp.owWorkerErrorMessage);
          return;
        }
        console.log(
          ccolors.success("staged application manifest:"),
          ccolors.key_name("external-dns.application.yaml"),
        );
      }

      const argoIngressHostname = config?.infrastructure?.cndi?.argocd
        ?.hostname;
      if (argoIngressHostname) {
        const errStagingArgoIngress = await stageFile(
          path.join(
            "cndi",
            "cluster_manifests",
            "argo-ingress.yaml",
          ),
          getArgoIngressManifest(argoIngressHostname),
        );
        if (errStagingArgoIngress) {
          await self.postMessage(errStagingArgoIngress.owWorkerErrorMessage);
          return;
        }
        console.log(
          ccolors.success("staged ingress manifest:"),
          ccolors.key_name("argo-ingress.yaml"),
        );
      }

      const skipObservability =
        config?.infrastructure?.cndi?.observability?.enabled === false;

      if (!skipObservability) {
        const observabilityNsManifest = getYAMLString({
          apiVersion: "v1",
          kind: "Namespace",
          metadata: { name: "observability" },
        });

        const errStagingObservabilityNs = await stageFile(
          path.join(
            "cndi",
            "cluster_manifests",
            "observability-namespace.yaml",
          ),
          observabilityNsManifest,
        );

        if (errStagingObservabilityNs) {
          await self.postMessage(
            errStagingObservabilityNs.owWorkerErrorMessage,
          );
          return;
        }

        console.log(
          ccolors.success("staged namespace manifest:"),
          ccolors.key_name("observability-namespace.yaml"),
        );

        const skipKubePrometheusStack =
          config?.infrastructure?.cndi?.observability?.kube_prometheus_stack
            ?.enabled === false;

        if (!skipKubePrometheusStack) {
          const grafanaHostname = config?.infrastructure?.cndi?.observability
            ?.grafana?.hostname;
          if (grafanaHostname) {
            const errStagingGrafanaIngress = await stageFile(
              path.join(
                "cndi",
                "cluster_manifests",
                "grafana-ingress.yaml",
              ),
              getGrafanaIngressManifest(grafanaHostname),
            );
            if (errStagingGrafanaIngress) {
              await self.postMessage(
                errStagingGrafanaIngress.owWorkerErrorMessage,
              );
              return;
            }
            console.log(
              ccolors.success("staged ingress manifest:"),
              ccolors.key_name("grafana-ingress.yaml"),
            );
          }

          const errStagingKubePrometheusStackApp = await stageFile(
            path.join(
              "cndi",
              "cluster_manifests",
              "applications",
              "kube-prometheus-stack.application.yaml",
            ),
            getKubePrometheusStackApplicationManifest(config),
          );

          console.log(
            ccolors.success("staged application manifest:"),
            ccolors.key_name("kube-prometheus-stack.application.yaml"),
          );

          if (errStagingKubePrometheusStackApp) {
            await self.postMessage(
              errStagingKubePrometheusStackApp.owWorkerErrorMessage,
            );
            return;
          }

          const skipPromtail =
            config?.infrastructure?.cndi?.observability?.promtail?.enabled ===
              false;
          if (!skipPromtail) {
            const errStagingPromtailApp = await stageFile(
              path.join(
                "cndi",
                "cluster_manifests",
                "applications",
                "promtail.application.yaml",
              ),
              getPromtailApplicationManifest(config),
            );

            if (errStagingPromtailApp) {
              await self.postMessage(
                errStagingPromtailApp.owWorkerErrorMessage,
              );
              return;
            }

            console.log(
              ccolors.success("staged application manifest:"),
              ccolors.key_name("promtail.application.yaml"),
            );
          }

          const skipLoki =
            config?.infrastructure?.cndi?.observability?.loki?.enabled ===
              false;
          if (!skipLoki) {
            const errStagingLokiApp = await stageFile(
              path.join(
                "cndi",
                "cluster_manifests",
                "applications",
                "loki.application.yaml",
              ),
              getLokiApplicationManifest(config),
            );

            if (errStagingLokiApp) {
              await self.postMessage(errStagingLokiApp.owWorkerErrorMessage);
              return;
            }
            console.log(
              ccolors.success("staged application manifest:"),
              ccolors.key_name("loki.application.yaml"),
            );
          }
        }
      }

      const { applications } = config;

      // write the `cndi/cluster_manifests/applications/${applicationName}.application.yaml` file for each application
      for (const releaseName in applications) {
        const applicationSpec = applications[releaseName];
        const [manifestContent, filename] = getApplicationManifest(
          releaseName,
          applicationSpec,
        );
        const errStagingApplication = await stageFile(
          path.join("cndi", "cluster_manifests", "applications", filename),
          manifestContent,
        );
        if (errStagingApplication) {
          await self.postMessage(errStagingApplication.owWorkerErrorMessage);
          return;
        }
        console.log(
          ccolors.success("staged application manifest:"),
          ccolors.key_name(filename),
        );
      }

      // all cloberable manifests should be staged before this point,
      // begin processing cluster_manifests, including Secrets

      try {
        // This is being loaded _from_ the CNDI directory to determine if we need to seal new secrets
        ksc = (await loadJSONC(
          path.join(options.output, "cndi", "ks_checks.json"),
        )) as Record<string, string>;
      } catch {
        // ks_checks.json did not exist or was invalid JSON
      }

      // restage the SealedSecret yaml file for every key in ks_checks.json
      for (const key in ksc) {
        ks_checks[key] = ksc[key];

        let sealedManifest = "";

        try {
          sealedManifest = Deno.readTextFileSync(
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
                ccolors.key_name(
                  key + ".yaml",
                )
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

      // write each manifest in the "cluster_manifests" section of the config to `cndi/cluster_manifests`
      // should be done after any other manifest so they can clobber more high-level manifests
      // eg. Core Applications, user Applications, etc.
      for (const key in cluster_manifests) {
        const manifestObj = cluster_manifests[key] as KubernetesManifest;

        if (manifestObj?.kind && manifestObj.kind === "Secret") {
          const secret = cluster_manifests[key] as KubernetesSecret;
          const secretFileName = `${key}.yaml`;

          const [err, sealedSecretManifestWithKSC] =
            await getSealedSecretManifestWithKSC(
              secret,
              {
                publicKeyFilePath: tempPublicKeyFilePath,
                envPath,
                ks_checks,
                secretFileName,
              },
            );

          if (err) {
            await self.postMessage(err.owWorkerErrorMessage);
            return;
          }

          const sealedSecretManifest = sealedSecretManifestWithKSC?.manifest;

          if (sealedSecretManifest) {
            // add the ksc to the ks_checks object
            ks_checks = {
              ...ks_checks,
              ...sealedSecretManifestWithKSC?.ksc,
            };

            const errStagingASecretClusterManifest = await stageFile(
              path.join("cndi", "cluster_manifests", secretFileName),
              sealedSecretManifest,
            );

            if (errStagingASecretClusterManifest) {
              await self.postMessage(
                errStagingASecretClusterManifest.owWorkerErrorMessage,
              );
              return;
            }

            console.log(
              ccolors.success(`staged encrypted secret:`),
              ccolors.key_name(secretFileName),
            );
          }
          continue;
        }

        const manifestFilename = `${key}.yaml`;

        const errStagingAClusterManifest = await stageFile(
          path.join("cndi", "cluster_manifests", manifestFilename),
          getYAMLString(manifestObj),
        );
        if (errStagingAClusterManifest) {
          await self.postMessage(
            errStagingAClusterManifest.owWorkerErrorMessage,
          );
          return;
        }
        console.log(
          ccolors.success("staged manifest:"),
          ccolors.key_name(manifestFilename),
        );
      }
      const errStagingKSCJSON = await stageFile(
        path.join("cndi", "ks_checks.json"),
        getPrettyJSONString(ks_checks),
      );

      if (errStagingKSCJSON) {
        await self.postMessage(errStagingKSCJSON.owWorkerErrorMessage);
        return;
      }

      console.log(
        ccolors.success("staged metadata:"),
        ccolors.key_name("ks_checks.json"),
      );
    }

    try {
      await stageTerraformResourcesForConfig(config); //, options);
    } catch (errorStagingTerraformResources) {
      const error = errorStagingTerraformResources as Error;
      self.postMessage({
        type: "error-overwrite",
        code: typeof error?.cause === "number" ? error.cause : -1,
        message: error?.message ?? "unknown error staging terraform resources",
      });
      return;
    }

    console.log();

    console.log(ccolors.success("staged terraform stack"));

    const errPersistingStagedFiles = await persistStagedFiles(options.output, {
      purge: ["cndi"], // effectively says "always empty contents of cndi/ before staging"
    });

    if (errPersistingStagedFiles) {
      await self.postMessage(errPersistingStagedFiles.owWorkerErrorMessage);
      return;
    }
    console.log("  ");

    const completionMessage = options?.initializing
      ? `initialized your cndi project at ${ccolors.key_name(options.output)}!`
      : `overwrote your cndi project files in ${
        ccolors.key_name(
          path.join(options.output, "cndi"),
        )
      }!`;

    console.log("\n" + completionMessage);

    self.postMessage({ type: "complete-overwrite" });
    self.close();
  }
};
