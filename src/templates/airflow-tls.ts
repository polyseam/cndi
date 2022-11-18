import { AirflowTlsTemplateAnswers, CNDIContext, EnvObject } from "../types.ts";
import { Input } from "https://deno.land/x/cliffy@v0.25.4/prompt/mod.ts";
import { Secret } from "https://deno.land/x/cliffy@v0.25.4/prompt/secret.ts";
import { cyan } from "https://deno.land/std@0.158.0/fmt/colors.ts";
import { getPrettyJSONString } from "../utils.ts";

const getAirflowTlsTemplateEnvObject = async (
  context: CNDIContext,
): Promise<EnvObject> => {
  let GIT_SYNC_USERNAME = "";
  let GIT_SYNC_PASSWORD = "";

  if (context.interactive) {
    GIT_SYNC_USERNAME = (await Input.prompt({
      message: cyan("Please enter your git username for Airflow DAG Storage:"),
      default: GIT_SYNC_USERNAME,
    })) as string;

    GIT_SYNC_PASSWORD = (await Secret.prompt({
      message: cyan("Please enter your git password for Airflow DAG Storage:"),
      default: GIT_SYNC_PASSWORD,
    })) as string;
  }
  const airflowTlsTemplateEnvObject = {
    GIT_SYNC_USERNAME: {
      comment: "airflow-git-credentials secret values for DAG Storage",
      value: GIT_SYNC_USERNAME,
    },
    GIT_SYNC_PASSWORD: {
      value: GIT_SYNC_PASSWORD,
    },
  };
  return airflowTlsTemplateEnvObject;
};

export default function getAirflowTlsTemplate({
  argocdDomainName,
  airflowDomainName,
  dagRepoUrl,
  letsEncryptClusterIssuerEmailAddress,
}: AirflowTlsTemplateAnswers): string {
  return getPrettyJSONString({
    nodes: {
      entries: [
        {
          name: "x-airflow-node",
          kind: "aws",
          role: "controller",
          instance_type: "m5a.xlarge",
          volume_size: 128,
        },
        {
          name: "y-airflow-node",
          kind: "aws",
          role: "worker",
          instance_type: "m5a.large",
          volume_size: 128,
        },
        {
          name: "z-airflow-node",
          kind: "aws",
          role: "worker",
          instance_type: "m5a.large",
          volume_size: 128,
        },
      ],
    },
    cluster: {
      "git-credentials-secret": {
        apiVersion: "v1",
        kind: "Secret",
        metadata: {
          name: "airflow-git-credentials",
          namespace: "airflow",
        },
        stringData: {
          GIT_SYNC_USERNAME: "$.cndi.secrets.GIT_SYNC_USERNAME",
          GIT_SYNC_PASSWORD: "$.cndi.secrets.GIT_SYNC_PASSWORD",
        },
      },
      "cert-manager-cluster-issuer": {
        apiVersion: "cert-manager.io/v1",
        kind: "ClusterIssuer",
        metadata: {
          name: "lets-encrypt",
        },
        spec: {
          acme: {
            email: letsEncryptClusterIssuerEmailAddress,
            server: "https://acme-v02.api.letsencrypt.org/directory",
            privateKeySecretRef: {
              name: "lets-encrypt-private-key",
            },
            solvers: [
              {
                http01: {
                  ingress: {
                    class: "public",
                  },
                },
              },
            ],
          },
        },
      },
      "argo-ingress": {
        apiVersion: "networking.k8s.io/v1",
        kind: "Ingress",
        metadata: {
          name: "argocd-server-ingress",
          namespace: "argocd",
          annotations: {
            "cert-manager.io/cluster-issuer": "lets-encrypt",
            "kubernetes.io/tls-acme": "true",
            "nginx.ingress.kubernetes.io/ssl-passthrough": "true",
            "nginx.ingress.kubernetes.io/backend-protocol": "HTTPS",
          },
        },
        spec: {
          tls: [
            {
              hosts: [argocdDomainName],
              secretName: "lets-encrypt-private-key",
            },
          ],
          rules: [
            {
              host: argocdDomainName,
              http: {
                paths: [
                  {
                    path: "/",
                    pathType: "Prefix",
                    backend: {
                      service: {
                        name: "argocd-server",
                        port: {
                          name: "https",
                        },
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    },
    applications: {
      airflow: {
        targetRevision: "1.7.0",
        destinationNamespace: "airflow",
        repoURL: "https://airflow.apache.org",
        chart: "airflow",
        values: {
          dags: {
            gitSync: {
              enabled: true,
              repo: dagRepoUrl, // private repo that requires credentials
              credentialsSecret: "airflow-git-credentials",
              branch: "main",
              wait: 40,
              subPath: "dags",
            },
          },
          config: {
            webserver: {
              expose_config: "True",
              instance_name: "Polyseam",
              enable_proxy_fix: "True",
              base_url: `https://${airflowDomainName}`,
            },
            operators: {
              default_owner: "Polyseam",
            },
          },
          ingress: {
            web: {
              enabled: true,
              annotations: {
                "cert-manager.io/cluster-issuer": "lets-encrypt",
              },
              hosts: [
                {
                  name: airflowDomainName,
                  tls: {
                    secretName: "lets-encrypt-private-key",
                    enabled: true,
                  },
                },
              ],
            },
          },
          logs: {
            persistence: {
              enabled: true,
              size: "15Gi",
            },
          },
          createUserJob: {
            useHelmHooks: false,
          },
          migrateDatabaseJob: {
            useHelmHooks: false,
          },
        },
      },
    },
  });
}

export { getAirflowTlsTemplateEnvObject };
