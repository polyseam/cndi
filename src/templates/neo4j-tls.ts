/**
 * This template is used to deploy a neo4j cluster with TLS enabled.
 * it is not ready and shouldn't yet be added to available-templates.ts.
 */

import { EnvObject, NodeKind } from "../types.ts";
import { Input } from "https://deno.land/x/cliffy@v0.25.4/prompt/mod.ts";
import { Secret } from "https://deno.land/x/cliffy@v0.25.4/prompt/secret.ts";
import { cyan } from "https://deno.land/std@0.173.0/fmt/colors.ts";
import { getDefaultVmTypeForKind, getPrettyJSONString } from "../utils.ts";
import {
  GetConfigurationFn,
  GetReadmeStringArgs,
  GetTemplateFn,
  Template,
} from "./Template.ts";
import getReadmeForProject from "../doc/readme-for-project.ts";

interface Neo4jTlsConfiguration {
  argocdDomainName: string;
  neo4jDomainName: string;
  letsEncryptClusterIssuerEmailAddress: string;
}

function getNeo4jTlsReadmeString({
  project_name,
  kind,
}: GetReadmeStringArgs): string {
  return `
${getReadmeForProject({ project_name, kind })}

## neo4j-tls

This template deploys a fully functional [Neo4j](https://neo4j.com) cluster using the neo4j Helm Chart.
`.trim();
}

// neo4jTlsTemplate.getEnv()
const getEnv = async (interactive: boolean): Promise<EnvObject> => {
  let NEO4J_PASSWORD = "";

  if (interactive) {
    NEO4J_PASSWORD = (await Secret.prompt({
      message: cyan("Please enter your new Neo4j password:"),
      default: NEO4J_PASSWORD,
    })) as string;
  }

  const neo4jTlsTemplateEnvObject = {
    NEO4J_PASSWORD: {
      value: NEO4J_PASSWORD,
    },
  };
  return neo4jTlsTemplateEnvObject;
};

// airflowTlsTemplate.getConfiguration()
async function getNeo4jTlsConfiguration(
  interactive: boolean,
): Promise<Neo4jTlsConfiguration> {
  let argocdDomainName = "argocd.example.com";
  let neo4jDomainName = "neo4j.example.com";
  let letsEncryptClusterIssuerEmailAddress = "admin@example.com";

  if (interactive) {
    argocdDomainName = (await Input.prompt({
      message: cyan(
        "Please enter the domain name you want argocd to be accessible on:",
      ),
      default: argocdDomainName,
    })) as string;

    neo4jDomainName = (await Input.prompt({
      message: cyan(
        "Please enter the domain name you want airflow to be accessible on:",
      ),
      default: neo4jDomainName,
    })) as string;

    letsEncryptClusterIssuerEmailAddress = (await Input.prompt({
      message: cyan(
        "Please enter the email address you want to use for lets encrypt:",
      ),
      default: letsEncryptClusterIssuerEmailAddress,
    })) as string;
  }

  return {
    argocdDomainName,
    neo4jDomainName,
    letsEncryptClusterIssuerEmailAddress,
  };
}

// neo4jTlsTemplate.getTemplate()
function getNeo4jTlsTemplate(
  kind: NodeKind,
  input: Neo4jTlsConfiguration,
): string {
  const {
    argocdDomainName,
    neo4jDomainName,
    letsEncryptClusterIssuerEmailAddress,
  } = input;

  const [vmTypeKey, vmTypeValue] = getDefaultVmTypeForKind(kind);
  return getPrettyJSONString({
    nodes: {
      entries: [
        {
          name: "x-neo4j-node",
          kind,
          role: "leader",
          [vmTypeKey]: vmTypeValue,
          volume_size: 128,
        },
        {
          name: "y-neo4j-node",
          kind,
          [vmTypeKey]: vmTypeValue,
          volume_size: 128,
        },
        {
          name: "z-neo4j-node",
          kind,
          [vmTypeKey]: vmTypeValue,
          volume_size: 128,
        },
      ],
    },
    cluster_manifests: {
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
      neo4j: {
        name: "neo4j",
        edition: "community",

        resources: {
          cpu: "3",
          memory: "3Gi",
        },
        "password-from-secret": "neo4j-password-secret",
      },
      ssl: {
        https: {
          privateKey: {
            secretName: "lets-encrypt-private-key",
            subPath: "tls.key",
          },
          publicCertificate: {
            secretName: "https-cert",
            subPath: "tls.crt",
          },
        },
        bolt: {
          privateKey: {
            secretName: "https-cert",
            subPath: "tls.key",
          },
          publicCertificate: {
            secretName: "https-cert",
            subPath: "tls.crt",
          },
        },
      },
      env: {
        NEO4JLABS_PLUGINS: '["apoc"]',
      },
      volumes: {
        data: {
          mode: "volume",
          volume: {
            gcePersistentDisk: {
              pdName: "untribe-neo4j-disk",
            },
          },
        },
      },
      config: {
        "dbms.default_advertised_address": neo4jDomainName,
      },
    },
  });
}

const neo4jTlsTemplate = new Template("neo4j-tls", {
  getEnv,
  getTemplate: getNeo4jTlsTemplate as unknown as GetTemplateFn,
  getConfiguration: getNeo4jTlsConfiguration as unknown as GetConfigurationFn,
  getReadmeString: getNeo4jTlsReadmeString,
});

export default neo4jTlsTemplate;
