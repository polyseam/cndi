import { ccolors } from "deps";
import { getYAMLString } from "src/utils.ts";

type ArgoAppInfo = Array<{ name: string; value: string }>;

type Meta = {
  name: string;
  namespace: string;
  labels: Record<string, string>;
  finalizers: string[];
};

type SyncPolicy = {
  automated: {
    prune: boolean;
    selfHeal: boolean;
    allowEmpty: boolean;
  };
  syncOptions: string[];
  retry: {
    limit: number;
    backoff: {
      duration: string;
      factor: number;
      maxDuration: string;
    };
  };
};

export interface CNDIApplicationSpec {
  targetRevision: string;
  repoURL: string;
  destinationNamespace: string;
  chart?: string;
  path?: string;
  values: {
    [key: string]: unknown;
  };
  labels?: Record<string, string>;
  finalizers?: string[];
  directory?: {
    include?: string;
    exclude?: string;
  };
  info?: ArgoAppInfo;
  syncPolicy?: SyncPolicy;
  metadata?: Meta;
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
    "PruneLast=false",
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

const applicationManifestLabel = ccolors.faded(
  "\nsrc/outputs/application-manifest.ts:",
);

const getApplicationManifest = (
  releaseName: string,
  applicationSpec: CNDIApplicationSpec,
): [string, string] => {
  const valuesObject = applicationSpec?.values || {};
  // const values = getYAMLString(applicationSpec?.values || {});
  const specSourcePath = applicationSpec.path;
  const specSourceChart = applicationSpec.chart;

  if (!specSourcePath && !specSourceChart) {
    const releaseNameForPrint = ccolors.user_input(`"${releaseName}"`);
    console.error(
      applicationManifestLabel,
      ccolors.error(
        `either applications[${releaseNameForPrint}]${
          ccolors.key_name(".path")
        }`,
      ),
      ccolors.error(
        `or applications[${releaseNameForPrint}]${ccolors.key_name(".chart")}`,
      ),
      ccolors.error(`must be defined`),
    );
  }

  const labelSpec = applicationSpec.labels || {};
  const name = releaseName;

  const userMeta: Partial<Meta> = applicationSpec?.metadata || {};

  const labels = {
    ...labelSpec,
    name,
  };

  const metadata: Meta = {
    name,
    namespace: DEFAULT_NAMESPACE,
    labels,
    finalizers: applicationSpec.finalizers || [],
    ...userMeta,
  };

  const syncPolicy = { ...DEFAULT_SYNC_POLICY, ...applicationSpec?.syncPolicy };
  const { repoURL, path, chart, targetRevision, info } = applicationSpec;

  const spec = {
    project: DEFAULT_PROJECT,
    source: {
      repoURL,
      path,
      chart,
      targetRevision,
      helm: {
        version: DEFAULT_HELM_VERSION,
        valuesObject,
      },
    },
    destination: {
      server: DEFAULT_DESTINATION_SERVER,
      namespace: applicationSpec.destinationNamespace,
    },
    syncPolicy,
    info,
  };

  const manifest = {
    apiVersion: DEFAULT_ARGOCD_API_VERSION,
    kind: "Application",
    metadata,
    spec,
  };

  return [getYAMLString(manifest), `${releaseName}.application.yaml`];
};

export default getApplicationManifest;
