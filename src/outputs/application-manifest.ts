import { ccolors, deepMerge } from "deps";
import { getYAMLString } from "src/utils.ts";

type ArgoAppInfo = Array<{ name: string; value: string }>;

type IgnoreDifferencesEntry = {
  group: string;
  kind: string;
  managedFieldsManagers: string[];
  name: string;
  namespace: string;
  jqPathExpressions: string[];
  jsonPointers: string[];
};

type Meta = {
  name?: string;
  namespace?: string;
  labels?: Record<string, string>;
  finalizers?: string[];
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
  ignoreDifferences?: Array<IgnoreDifferencesEntry>;
  revisionHistoryLimit?: number;
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
const DEFAULT_HELM_VERSION = "v3";
const DEFAULT_PROJECT = "default";

const applicationManifestLabel = ccolors.faded(
  "\nsrc/outputs/application-manifest.ts:",
);

type AppSpecSource = {
  repoURL: string;
  path?: string;
  chart?: string;
  targetRevision: string;
  directory?: {
    include?: string;
    exclude?: string;
  };
  helm?: {
    version: string;
    values: string;
  };
};

const getApplicationManifest = (
  releaseName: string,
  applicationSpec: CNDIApplicationSpec,
): [string, string] => {
  const values = getYAMLString(applicationSpec?.values || {});
  const specSourcePath = applicationSpec.path;
  const specSourceChart = applicationSpec.chart;
  const destinationNamespace = applicationSpec?.destinationNamespace;

  const releaseNameForPrint = ccolors.user_input(`"${releaseName}"`);

  if (!specSourcePath && !specSourceChart) {
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

  if (!destinationNamespace) {
    console.log(
      applicationManifestLabel,
      ccolors.error(
        `applications[${releaseNameForPrint}]${
          ccolors.key_name(
            ".destinationNamespace",
          )
        }`,
      ),
      ccolors.error(`must be defined`),
    );
    console.log(
      ccolors.warn("using"),
      releaseNameForPrint,
      ccolors.warn("for"),
      ccolors.key_name("destinationNamespace"),
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
    labels,
    finalizers: applicationSpec?.finalizers,
    ...userMeta,
  };

  const syncPolicy = deepMerge(
    DEFAULT_SYNC_POLICY,
    applicationSpec?.syncPolicy || {},
  );

  const finalSyncOptions: Record<string, string> = {};

  for (const syncOption of syncPolicy.syncOptions) {
    const [name, status] = syncOption.split("=");
    finalSyncOptions[name] = status;
  }

  // syncOptions are deduped and the user-supplied values are preferred
  syncPolicy.syncOptions = Object.entries(finalSyncOptions).map(([k, v]) =>
    `${k}=${v}`
  );

  const {
    repoURL,
    path,
    chart,
    targetRevision,
    info,
    directory,
    ignoreDifferences,
    revisionHistoryLimit,
  } = applicationSpec;

  const source: AppSpecSource = {
    repoURL,
    path,
    chart,
    targetRevision,
  };

  // directory and helm are mutually exclusive in the ArgoCD Application CRD
  if (directory) {
    source.directory = directory;
  } else {
    source.helm = {
      version: DEFAULT_HELM_VERSION,
      values,
    };
  }

  const spec = {
    project: DEFAULT_PROJECT,
    source,
    destination: {
      server: DEFAULT_DESTINATION_SERVER,
      namespace: destinationNamespace,
    },
    syncPolicy,
    info,
    ignoreDifferences,
    revisionHistoryLimit,
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
