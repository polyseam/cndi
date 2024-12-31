# CNDI External-DNS

# with Cloudflare DNS

CNDI has built-in support for managing DNS records with
[Cloudflare DNS](https://www.cloudflare.com/en-ca/application-services/products/dns/).
This guide will walk you through setting it up.

The key idea is that you need to specify a Secret containing Cloudflare
credentials that External-DNS can use to manage Cloudflare DNS zones.

This Secret will be used to authenticate with Cloudflare DNS from inside your
CNDI Cluster, so that it can open your Ingress resources to your specified
domain names.

## Getting Dedicated External-DNS Credentials

## for Cloudflare DNS

### Step 1: Log in to the Cloudflare Console

1. Open a web browser and navigate to
   [dash.cloudflare.com](https://dash.cloudflare.com).
2. Login to Cloudflare
3. Go to the [API Tokens](https://dash.cloudflare.com/profile/api-tokens) page.
4. Click on the `Create Token` button.
5. Select the `Edit zone DNS` template.
6. Limit Access to the specific zone you want to manage, or allow all zones.
7. Click `Continue to Summary`.
8. Review the settings and click `Create Token`.
9. Copy the token to your clipboard.

### Step 2: Create a Cloudflare API Token Value Object in `.env`

1. Open the `.env` file in your project directory.
2. Create a new environment variable called `CLOUDFLARE_EXTERNAL_DNS_TOKEN` and
   paste the API Token value you copied in the previous step.

```dotenv
CLOUDFLARE_EXTERNAL_DNS_CREDENTIALS='Gkwfnoi823480hj54bDIQENI3j4'
```

### Step 3: Update your Secret and Config in `cndi_config.yaml` to use Cloudflare credentials

```yaml
infrastructure:
  cndi:
    external_dns:
      provider: cloudflare
      values:
        cloudflare:
          proxied: false
    {...}
cluster_manifests:
  {...}
  external-dns:
    kind: Secret
    metadata:
      name: external-dns
      namespace: external-dns
      stringData:
        cloudflare_api_token: $cndi_on_ow.seal_secret_from_env_var(CLOUDFLARE_EXTERNAL_DNS_CREDENTIALS)
```

### Step 4: Deploy Updated Secret to Your Cluster Securely

1. Run `cndi ow` and notice that the `external-dns` secret is now shown in the
   `./cndi/cluster_manifests/external-dns.yaml` file, and the values are
   encrypted.

2. Create a new Git commit and when you are ready, merge the changes to your
   `main` branch.

3. After some time, ArgoCD, ExternalDNS, and Cert-Manager will update your zone
   records with the new values found in your Ingress definitions, and you will
   be able to access your services using the new domain names.

## FAQ

**Q**: My domain is not yet live, how can I monitor progress and check for
errors?

**A**: You may just want to wait a half hour and go get a snack. If you've tried
that alreaady you might want to debug using `kubectl` or the `argocd` GUI. For
more info checkout the [connect.md](/docs/connect.md) guide.
