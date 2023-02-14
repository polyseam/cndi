import { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/colors.ts";

import { getPrettyJSONString } from "../utils.ts";
export interface CNDIApplicationSpec {
  targetRevision: string;
  repoURL: string;
  destinationNamespace: string;
  chart?: string;
  path?: string;
  values: {
    [key: string]: unknown;
  };
}

const DEFAULT_SYNC_POLICY = {
  automated: {
    prune: true,
    selfHeal: true,
    allowEmpty: false,
  },
  syncOptions: [
    "Validate=false",
    "CreateNamespace=true",
    "PrunePropagationPolicy=foreground",
    "PruneLast=true",
  ],
  retry: {
    limit: 10,
    backoff: {
      duration: "5s",
      factor: 2,
      maxDuration: "4m",
    },
  },
};

const DEFAULT_DESTINATION_SERVER = "https://kubernetes.default.svc";
const DEFAULT_ARGOCD_API_VERSION = "argoproj.io/v1alpha1";
const DEFAULT_NAMESPACE = "default";
const DEFAULT_HELM_VERSION = "v3";
const DEFAULT_PROJECT = "default";
const DEFAULT_FINALIZERS = ["resources-finalizer.argocd.argoproj.io"];

const applicationManifestLabel = colors.white(
  "\nsrc/outputs/application-manifest:",
);

const manifestFramework = {
  apiVersion: DEFAULT_ARGOCD_API_VERSION,
  kind: "Application",
  metadata: {
    namespace: DEFAULT_NAMESPACE,
    finalizers: DEFAULT_FINALIZERS,
    labels: {},
  },
  spec: {
    project: DEFAULT_PROJECT,
    source: {
      helm: {
        version: DEFAULT_HELM_VERSION,
      },
    },
    destination: {
      server: DEFAULT_DESTINATION_SERVER,
    },
    syncPolicy: DEFAULT_SYNC_POLICY,
  },
};

const getApplicationManifest = (
  releaseName: string,
  applicationSpec: CNDIApplicationSpec,
): [string, string] => {
  // TODO: helm and argo require that values be passed into argocd as a string when using a helm chart repo instead of git
  // This means that we need to have this very ugly string in the manifests that we generate
  const values = JSON.stringify(applicationSpec.values ?? {});

  const specSourcePath = applicationSpec.path;
  const specSourceChart = applicationSpec.chart;

  if (!specSourcePath && !specSourceChart) {
    const releaseNameForPrint = colors.cyan(`"${releaseName}"`);
    console.log(
      applicationManifestLabel,
      colors.brightRed(
        `either applications[${releaseNameForPrint}].${
          colors.brightWhite("path")
        }`,
      ),
      colors.brightRed(
        `or applications[${releaseNameForPrint}].${
          colors.brightWhite(
            "chart",
          )
        } must be defined`,
      ),
    );
  }

  const manifest = {
    ...manifestFramework,
    metadata: {
      name: releaseName,
      labels: {
        name: releaseName,
      },
    },
    spec: {
      ...manifestFramework.spec,
      source: {
        ...manifestFramework.spec.source,
        repoURL: applicationSpec.repoURL,
        path: applicationSpec.path,
        targetRevision: applicationSpec.targetRevision,
        chart: applicationSpec.chart,
        helm: {
          ...manifestFramework.spec.source.helm,
          values,
        },
      },
      destination: {
        ...manifestFramework.spec.destination,
        namespace: applicationSpec.destinationNamespace,
      },
    },
  };
  return [getPrettyJSONString(manifest), `${releaseName}.application.json`];
};

export default getApplicationManifest;
