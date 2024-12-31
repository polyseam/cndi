# CNDI External-DNS

# with Google Cloud DNS

CNDI has built-in support for managing DNS records with
[Google Cloud DNS](https://cloud.google.com/dns?hl=en). This guide will walk you
through setting it up.

The key idea is that you need to specify a Secret containing GCP credentials
that External-DNS can use to manage Google Cloud DNS zones.

This Secret will be used to authenticate with Google Cloud DNS from inside your
CNDI Cluster, so that it can open your Ingress resources to your specified
domain names.

If you are using GKE and are comfortable using the same `GOOGLE_CREDENTIALS` you
used for your GKE Cluster provisioning, that is an option, you just need to be
sure that the credential has the necessary permissions to manage Google Cloud
DNS zone records.

Alternatively, you can create a new credential with the necessary permissions
for External-DNS, and that will work even if your cluster is _not_ hosted on
Google Cloud.

First let's focus on the simplest case, using the same credentials you used to
create your GKE Cluster. Most of the work is likely already done for you!

## Using Existing Cluster Credentials

The GCP Credential should look like this:

```dotenv
# ExternalDNS credentials.json
GOOGLE_CREDENTIALS='{
  "type": "service_account",
  "project_id": "example-project",
  "private_key_id": "1234567890abcdef1234567890abcdef1234567890",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "example-sa@example-project.iam.gserviceaccount.com",
  "client_id": "1234567890abcdef1234567890abcdef1234567890",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/example-project.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
'
```

If you selected the `google` provider for `external_dns` when you created your
cluster with `cndi create ...`, these values should already be in your `.env`
file, and the Secret that encrypts and holds those values should already be in
your `cndi_config.yaml` file too.

```yaml
infrastructure:
  cndi:
    {...}
    external_dns:
      provider: google
      values:
        google:
          project: example-project
          serviceAccountSecret: external-dns
cluster_manifests:
  {...}
  external-dns:
    apiVersion: v1
    kind: Secret
    metadata:
      name: external-dns
      namespace: external-dns
    stringData:
      credentials.json: $cndi_on_ow.seal_secret_from_env_var(GOOGLE_CREDENTIALS)
```

If your `cndi_config.yaml` and `.env` files are already set up this way, you're
all set and can begin using external-dns with Google Cloud DNS!

## Getting Dedicated External-DNS Credentials

## for Google Cloud DNS

Alternatively if you want to use a different Google Cloud Service Account, or if
your cluster is hosted on a cloud other than GCP, you can create a new Service
Account with the necessary permissions to edit your Google Cloud DNS zone
records.

The implementation is the same, all that changes is the content of your
`credentials.json` credentials variable you use in your `external-dns` Secret.

If you want to create a new JSON credential for External-DNS, you can follow
these steps:

### Step 1: Log in to the GCP Console

1. Open a web browser and navigate to
   [console.cloud.google.com](https://console.cloud.google.com/home/dashboard).
2. Sign in with your GCP Credentials.
3. Navigate to the
   [GCP Project](https://console.cloud.google.com/projectselector2) containing
   your DNS Zone

### Step 2: Create a New Service Account

1. Navigate to the IAM & Admin > Service Accounts page.
2. Click Create Service Account.
3. Fill out the form: •	Name: Enter a descriptive name, e.g., ExternalDNSApp.
   •	Service Account ID: Enter a unique ID, e.g., external-dns-app. •	Select
   Role: Select “DNS Administrator”. • Click Continue • Click Done.

### Step 3: Create JSON Key for the Service Account

1. Navigate to the
   [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
   page.
2. Click on the Service Account you just created.
3. Click Add Key > Create new key.
4. Select JSON and click Create.
5. Save the JSON file to your computer for use in the next step

### Step 4: Create the GCP credentials.json Object in `.env`

1. Open the `.env` file in your project directory.
2. Create a new environment variable called `GCP_EXTERNAL_DNS_CREDENTIALS` and
   paste the contents of the JSON file you downloaded in the previous step.

```dotenv
GCP_EXTERNAL_DNS_CREDENTIALS='{
  "type": "service_account",
  "project_id": "example-project",
  "private_key_id": "1234567890abcdef1234567890abcdef1234567890",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "wow-sa@example-project.iam.gserviceaccount.com",
  "client_id": "1234567890abcdef1234567890abcdef1234567890",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/example-project.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
'
```

### Step 6: Update your Secret and Config in `cndi_config.yaml` to use GCP credentials

```yaml
infrastructure:
  cndi:
    external_dns:
      provider: google
      values:
        google:
          project: example-project
          serviceAccountSecret: external-dns
    {...}
cluster_manifests:
  {...}
  external-dns:
    kind: Secret
    metadata:
      name: external-dns
      namespace: external-dns
      stringData:
        credentials.json: $cndi_on_ow.seal_secret_from_env_var(GCP_EXTERNAL_DNS_CREDENTIALS)
```

### Step 7: Deploy Updated Secret to Your Cluster Securely

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
