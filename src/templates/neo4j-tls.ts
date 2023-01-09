/**
 * This template is used to deploy a neo4j cluster with TLS enabled.
 * it is not ready and shouldn't yet be added to available-templates.ts.
 */

import { CNDIConfig, EnvObject, NODE_ROLE, NodeKind } from "../types.ts";
import { Input } from "https://deno.land/x/cliffy@v0.25.4/prompt/mod.ts";
import { Secret } from "https://deno.land/x/cliffy@v0.25.4/prompt/secret.ts";
import { cyan } from "https://deno.land/std@0.158.0/fmt/colors.ts";
import { getDefaultVmTypeForKind } from "../utils.ts";
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

// neo4jTlsTemplate.getConfiguration()
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
        "Please enter the domain name you want neo4j to be accessible on:",
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
): CNDIConfig {
  const {
    argocdDomainName,
    neo4jDomainName,
    letsEncryptClusterIssuerEmailAddress,
  } = input;

  const [vmTypeKey, vmTypeValue] = getDefaultVmTypeForKind(kind);
  const volume_size = 128; //GiB

  const annotations = {
    /* for ingresses */
    "cert-manager.io/cluster-issuer": "lets-encrypt",
    "kubernetes.io/tls-acme": "true",
    "nginx.ingress.kubernetes.io/ssl-passthrough": "true",
    "nginx.ingress.kubernetes.io/backend-protocol": "HTTPS",
  };

  return {
    infrastructure: {
      cndi: {
        nodes: [
          {
            name: "x-neo4j-node",
            kind,
            role: NODE_ROLE.leader,
            [vmTypeKey]: vmTypeValue,
            volume_size,
          },
          {
            name: "y-neo4j-node",
            kind,
            [vmTypeKey]: vmTypeValue,
            volume_size,
          },
          {
            name: "z-neo4j-node",
            kind,
            [vmTypeKey]: vmTypeValue,
            volume_size,
          },
        ],
      },
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
      "neo4j-ingress": {
        apiVersion: "networking.k8s.io/v1",
        kind: "Ingress",
        metadata: {
          name: "neo4j-ingress",
          namespace: "neo4j",
          annotations,
        },
        spec: {
          tls: [
            {
              hosts: [neo4jDomainName],
              secretName: "lets-encrypt-private-key",
            },
          ],
          rules: [
            {
              host: neo4jDomainName,
              http: {
                paths: [
                  {
                    path: "/",
                    pathType: "Prefix",
                    backend: {
                      service: {
                        name: "neo4j",
                        port: {
                          number: 7473,
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
      "argo-ingress": {
        apiVersion: "networking.k8s.io/v1",
        kind: "Ingress",
        metadata: {
          name: "argocd-server-ingress",
          namespace: "argocd",
          annotations,
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
        destinationNamespace: "neo4j",
        targetRevision: "5.3.0",
        repoURL: "https://helm.neo4j.com/neo4j",
        chart: "neo4j",
        values: {
          neo4j: {
            name: "neo4j",
            edition: "community",
            resources: {
              cpu: "3",
              memory: "3Gi",
            },
            password: "FollowTheWhiteRabbit",
            acceptLicenseAgreement: "yes",
          },
          volumes: {
            data: {
              mode: "defaultStorageClass",
              defaultStorageClass: {
                requests: {
                  storage: "10Gi",
                },
              },
            },
          },
          config: {
            "dbms.default_advertised_address": neo4jDomainName,
          },
        },
      },
    },
  };
}

const neo4jTlsTemplate = new Template("neo4j-tls", {
  getEnv,
  getTemplate: getNeo4jTlsTemplate as unknown as GetTemplateFn,
  getConfiguration: getNeo4jTlsConfiguration as unknown as GetConfigurationFn,
  getReadmeString: getNeo4jTlsReadmeString,
});

export default neo4jTlsTemplate;
