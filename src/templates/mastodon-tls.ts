import { EnvObject, NodeKind } from "../types.ts";
import { Input } from "https://deno.land/x/cliffy@v0.25.4/prompt/mod.ts";
import { Secret } from "https://deno.land/x/cliffy@v0.25.4/prompt/secret.ts";
import { cyan } from "https://deno.land/std@0.158.0/fmt/colors.ts";
import { getPrettyJSONString, getDefaultVmTypeForKind } from "../utils.ts";
import { Template, GetConfigurationFn, GetTemplateFn } from "./Template.ts";

interface MastodonTlsTemplateConfiguration {
  adminUsername: string;
  adminEmail: string;
  argocdDomainName: string;
  mastodonDomainName: string;
  letsEncryptClusterIssuerEmailAddress: string;
}

const getConfiguration = async (
  interactive: boolean
): Promise<MastodonTlsTemplateConfiguration> => {
  let argocdDomainName = "argocd.example.com";
  let mastodonDomainName = "mastodon.example.com";
  let adminEmail = "admin@example.com";
  let adminUsername = "mastodonfan123";
  let letsEncryptClusterIssuerEmailAddress = "admin@example.com";

  if (interactive) {
    mastodonDomainName = (await Input.prompt({
      message: cyan(
        "Please enter the domain name you want mastodon to be accessible on:"
      ),
      default: mastodonDomainName,
    })) as string;

    argocdDomainName = (await Input.prompt({
      message: cyan(
        "Please enter the domain name you want argocd to be accessible on:"
      ),
      default: argocdDomainName,
    })) as string;

    adminEmail = (await Input.prompt({
      message: cyan(
        "Please enter the email address for your mastodon admin account:"
      ),
      default: adminEmail,
    })) as string;

    adminUsername = (await Input.prompt({
      message: cyan(
        "Please enter the username for your mastodon admin account:"
      ),
      default: adminUsername,
    })) as string;

    letsEncryptClusterIssuerEmailAddress = (await Input.prompt({
      message: cyan(
        "Please enter the email address you want to use for lets encrypt:"
      ),
      default: letsEncryptClusterIssuerEmailAddress,
    })) as string;
  }

  return {
    argocdDomainName,
    mastodonDomainName,
    adminEmail,
    adminUsername,
    letsEncryptClusterIssuerEmailAddress,
  };
};

const getEnv = async (interactive: boolean): Promise<EnvObject> => {
  let POSTGRESQL_PASSWORD = "";
  let REDIS_PASSWORD = "";

  if (interactive) {
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

function getTemplate(
  kind: NodeKind,
  input: MastodonTlsTemplateConfiguration
): string {
  const {
    adminUsername,
    adminEmail,
    argocdDomainName,
    mastodonDomainName,
    letsEncryptClusterIssuerEmailAddress,
  } = input;
  const [vmTypeKey, vmTypeValue] = getDefaultVmTypeForKind(kind);

  return getPrettyJSONString({
    nodes: {
      entries: [
        {
          name: "x-mastodon-node",
          kind,
          role: "leader",
          [vmTypeKey]: vmTypeValue,
          volume_size: 128,
        },
        {
          name: "y-mastodon-node",
          kind,
          [vmTypeKey]: vmTypeValue,
          volume_size: 128,
        },
        {
          name: "z-mastodon-node",
          kind,
          [vmTypeKey]: vmTypeValue,
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

const mastadonTlsTemplate = new Template("mastodon-tls", {
  getTemplate: getTemplate as unknown as GetTemplateFn,
  getEnv,
  getConfiguration: getConfiguration as unknown as GetConfigurationFn,
  readmeBlock: `\n`,
});

export default mastadonTlsTemplate;
