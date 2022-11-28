import {
  MastodonTlsTemplateAnswers,
  CNDIContext,
  EnvObject,
} from "../types.ts";
import { Input } from "https://deno.land/x/cliffy@v0.25.4/prompt/mod.ts";
import { Secret } from "https://deno.land/x/cliffy@v0.25.4/prompt/secret.ts";
import { cyan } from "https://deno.land/std@0.158.0/fmt/colors.ts";
import { getPrettyJSONString } from "../utils.ts";

const getMastodonTlsTemplateEnvObject = async (
  context: CNDIContext
): Promise<EnvObject> => {
  let POSTGRESQL_PASSWORD = "";
  let REDIS_PASSWORD = "";

  if (context.interactive) {
    POSTGRESQL_PASSWORD = (await Input.prompt({
      message: cyan(
        "Please enter a new password for mastadon's postgres instance:"
      ),
      default: POSTGRESQL_PASSWORD,
    })) as string;

    REDIS_PASSWORD = (await Secret.prompt({
      message: cyan(
        "Please enter a new password for mastadon's redis instance:"
      ),
      default: REDIS_PASSWORD,
    })) as string;
  }

  const mastodonTlsTemplateEnvObject = {
    POSTGRESQL_PASSWORD: {
      comment: "postgres password, username is 'mastodon'",
      value: POSTGRESQL_PASSWORD,
    },
    REDIS_PASSWORD: {
      comment: "redis",
      value: REDIS_PASSWORD,
    },
  };

  return mastodonTlsTemplateEnvObject;
};

export default function getMastodonTlsTemplate({
  adminUsername,
  adminEmail,
  argocdDomainName,
  mastodonDomainName,
  letsEncryptClusterIssuerEmailAddress,
}: MastodonTlsTemplateAnswers): string {
  return getPrettyJSONString({
    nodes: {
      entries: [
        {
          name: "x-mastodon-node",
          kind: "aws",
          role: "leader",
          instance_type: "m5a.xlarge",
          volume_size: 128,
        },
        {
          name: "y-mastodon-node",
          kind: "aws",
          instance_type: "m5a.large",
          volume_size: 128,
        },
        {
          name: "z-mastodon-node",
          kind: "aws",
          instance_type: "m5a.large",
          volume_size: 128,
        },
      ],
    },
    applications: {
      mastodon: {
        targetRevision: "3.0.0",
        destinationNamespace: "mastodon",
        repoURL: "https://github.com/mastodon/mastodon",
        chart: "mastodon",
        values: {
          mastodon: {
            createAdmin: {
              enabled: true,
              email: adminEmail,
              username: adminUsername,
            },
            web_domain: mastodonDomainName,
          },
        },
        ingress: {
          enabled: true,
          annotations: {
            "cert-manager.io/cluster-issuer": "lets-encrypt",
            "kubernetes.io/tls-acme": "true",
            "nginx.ingress.kubernetes.io/ssl-passthrough": "true",
            "nginx.ingress.kubernetes.io/backend-protocol": "HTTPS",
          },
          tls: [
            {
              hosts: [mastodonDomainName],
              secretName: "lets-encrypt-private-key",
            },
          ],
        },
        postgresql: {
          auth: {
            existingSecret: "postgresql-password",
          },
        },
        redis: {
          existingSecret: "redis-password",
        },
      },
    },
    cluster: {
      "postgresql-password": {
        apiVersion: "v1",
        kind: "Secret",
        metadata: {
          name: "postgresql-password",
          namespace: "mastodon",
        },
        stringData: {
          password: "$.cndi.secrets.POSTGRESQL_PASSWORD",
        },
      },
      "redis-password": {
        apiVersion: "v1",
        kind: "Secret",
        metadata: {
          name: "redis-password",
          namespace: "mastodon",
        },
        stringData: {
          password: "$.cndi.secrets.REDIS_PASSWORD",
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
  });
}

export { getMastodonTlsTemplateEnvObject };
