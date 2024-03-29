import { ccolors, loadEnv, path } from "deps";

import {
  getPrettyJSONString,
  getYAMLString,
  loadCndiConfig,
  loadJSONC,
  persistStagedFiles,
  stageFile,
} from "src/utils.ts";

import { loadSealedSecretsKeys } from "src/initialize/sealedSecretsKeys.ts";
import { loadTerraformStatePassphrase } from "src/initialize/terraformStatePassphrase.ts";
import { loadArgoUIAdminPassword } from "src/initialize/argoUIAdminPassword.ts";

import getApplicationManifest from "src/outputs/application-manifest.ts";
import RootChartYaml from "src/outputs/root-chart.ts";
import getSealedSecretManifestWithKSC from "src/outputs/sealed-secret-manifest.ts";

import getMicrok8sIngressTcpServicesConfigMapManifest from "src/outputs/custom-port-manifests/microk8s/ingress-tcp-services-configmap.ts";
import getMicrok8sIngressDaemonsetManifest from "src/outputs/custom-port-manifests/microk8s/ingress-daemonset.ts";

import getProductionClusterIssuerManifest from "src/outputs/cert-manager-manifests/production-cluster-issuer.ts";
import getDevClusterIssuerManifest from "src/outputs/cert-manager-manifests/self-signed/dev-cluster-issuer.ts";

import getEKSIngressServiceManifestPublic from "src/outputs/custom-port-manifests/managed/ingress-service-public.ts";
import getEKSIngressTcpServicesConfigMapManifestPublic from "src/outputs/custom-port-manifests/managed/ingress-tcp-services-configmap-public.ts";

import getEKSIngressServiceManifestPrivate from "src/outputs/custom-port-manifests/managed/ingress-service-private.ts";
import getEKSIngressTcpServicesConfigMapManifestPrivate from "../outputs/custom-port-manifests/managed/ingress-tcp-services-configmap-private.ts";

import getExternalDNSManifest from "src/outputs/core-applications/external-dns.application.yaml.ts";
import getCertManagerApplicationManifest from "src/outputs/core-applications/cert-manager.application.yaml.ts";
import getReloaderApplicationManifest from "src/outputs/core-applications/reloader.application.yaml.ts";

import stageTerraformResourcesForConfig from "src/outputs/terraform/stageTerraformResourcesForConfig.ts";

import {
  CNDIConfig,
  KubernetesManifest,
  KubernetesSecret,
  ManagedNodeKind,
} from "src/types.ts";
import validateConfig from "src/validate/cndiConfig.ts";

const owLabel = ccolors.faded("\nsrc/commands/overwrite.worker.ts:");

interface OverwriteActionArgs {
  output: string;
  file?: string;
  initializing: boolean;
}

type OverwriteWorkerMessage = {
  data: {
    args?: OverwriteActionArgs;
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

self.onmessage = async (message: OverwriteWorkerMessage) => {
  // EVERY EXIT MUST BE PASSED UP TO THE WORKFLOW OWNER
  if (message.data.type === "begin-overwrite") {
    const options = message.data.args as OverwriteActionArgs;

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

    const sealedSecretsKeys = loadSealedSecretsKeys();
    const terraformStatePassphrase = loadTerraformStatePassphrase();
    const argoUIAdminPassword = loadArgoUIAdminPassword();

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

    const cluster_manifests = config?.cluster_manifests || {};

    // this ks_checks will be written to cndi/ks_checks.json
    let ks_checks: Record<string, string> = {};

    // ⚠️ ks_checks.json is being loaded into ksc here from a previous run of `cndi overwrite`
    let ksc: Record<string, string> = {};

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
          path.join(options.output, "cndi", "cluster_manifests", `${key}.yaml`),
        );
      } catch {
        console.log(
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

    await Deno.writeTextFile(
      tempPublicKeyFilePath,
      sealedSecretsKeys.sealed_secrets_public_key,
    );

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
    } else {
      const managedKind = config.distribution as ManagedNodeKind; //aks

      await stageFile(
        path.join("cndi", "cluster_manifests", "ingress-service-private.yaml"),
        getEKSIngressServiceManifestPrivate(open_ports, managedKind),
      );

      await stageFile(
        path.join("cndi", "cluster_manifests", "ingress-service-public.yaml"),
        getEKSIngressServiceManifestPublic(open_ports, managedKind),
      );

      await stageFile(
        path.join(
          "cndi",
          "cluster_manifests",
          "ingress-tcp-services-configmap-public.yaml",
        ),
        getEKSIngressTcpServicesConfigMapManifestPublic(open_ports),
      );

      await stageFile(
        path.join(
          "cndi",
          "cluster_manifests",
          "ingress-tcp-services-configmap-private.yaml",
        ),
        getEKSIngressTcpServicesConfigMapManifestPrivate(open_ports),
      );
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
      ? "initialized your cndi project in the ./cndi directory!"
      : "overwrote your cndi project in the ./cndi directory!";

    console.log("\n" + completionMessage);

    self.postMessage({ type: "complete-overwrite" });
    self.close();
  }
};
