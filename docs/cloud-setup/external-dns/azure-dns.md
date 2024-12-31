# CNDI External-DNS

# with Azure DNS

CNDI has built-in support for managing DNS records with
[Azure DNS](https://azure.microsoft.com/en-ca/products/dns). This guide will
walk you through setting it up.

The key idea is that you need to specify a Secret containing Azure credentials
that External-DNS can use to manage Azure DNS zones.

This Secret will be used to authenticate with Azure DNS from inside your CNDI
Cluster, so that it can open your Ingress resources to your specified domain
names.

If you are using AKS and are comfortable using the same `ARM_CLIENT_ID` you used
for your AKS Cluster provisioning, that is an option, you just need to be sure
that the credential has the necessary permissions to manage Azure DNS zone
records.

Alternatively, you can create a new credential with the necessary permissions
for External-DNS, and that will work even if your cluster is _not_ hosted on
Azure.

First let's focus on the simplest case, using the same credentials you used to
create your AKS Cluster. Most of the work is likely already done for you!

## Using Existing Cluster Credentials

The Azure Credentials should look like this:

```dotenv
# ExternalDNS azure.json
AZURE_CREDENTIALS='{
  "tenantId": "a1d2f34r-abc1-1dc5-6tre-124563t3fa",
  "subscriptionId": "r2oq3rojp-qrre-fg4t-t532rr3252332",
  "resourceGroup": "my-domainname-rg",
  "aadClientId": "rq3rq3q0-3223-2112-fr44-dgewgw43t6",
  "aadClientSecret": "wglknhw5i~qtopt3jgw4opg.gqini34pNZ"
}
'
```

If you selected the `azure` provider for `external_dns` when you created your
cluster with `cndi create ...`, these values should already be in your `.env`
file, and the Secret that encrypts and holds those values should already be in
your `cndi_config.yaml` file too.

```yaml
infrastructure:
  cndi:
    {...}
    external_dns:
      provider: azure
      values:
        azure:
          resourceGroup: 'my-dns-rg'
cluster_manifests:
  {...}
  external-dns:
    apiVersion: v1
    kind: Secret
    metadata:
      name: external-dns
      namespace: external-dns
    stringData:
      azure.json: $cndi_on_ow.seal_secret_from_env_var(AZURE_CREDENTIALS)
```

If your `cndi_config.yaml` and `.env` files are already set up this way, you're
all set and can begin using external-dns with Azure DNS!

## Getting Dedicated External-DNS Credentials

## for Azure DNS

Alternatively if you want to use a different Azure Principal, or if your cluster
is hosted on a cloud other than Azure, you can create a new Principal with the
necessary permissions to edit your Azure DNS zone records.

The implementation is the same, all that changes is the content of your
`azure.json` credentials variable you use in your `external-dns` Secret.

If you want to create a new JSON credential for External-DNS, you can follow
these steps:

### Step 1: Log in to the Azure Console

1. Open a web browser and navigate to
   [portal.azure.com](https://portal.azure.com).
2. Sign in with your Azure account credentials.

### Step 2: Register a New Azure Active Directory (AAD) Application

1. Navigate to Azure Active Directory > App registrations > New registration.
2. Fill out the form: •	Name: Enter a descriptive name, e.g., ExternalDNSApp.
   •	Supported account types: Select “Accounts in this organizational directory
   only”. •	Leave the Redirect URI field empty for this use case.
3. Click Register.

### Step 3: Assign Azure DNS Contributor Role

1. Navigate to your Azure DNS Zone in the portal: •	Go to Resource Groups and
   select the resource group containing your DNS Zone. •	Open the DNS Zone
   resource.
2. Click Access control (IAM) > Add role assignment.
3. Assign the role: •	Role: Select “DNS Zone Contributor”. •	Assign access to:
   Choose “User, group, or service principal”. •	Members: Click Select members,
   search for the app you created, and select it.
4. Click Save.

### Step 4: Gather Required Information

You’ll need the following details for the JSON object:

1. Subscription ID: Navigate to Subscriptions in the Azure Portal, and copy your
   subscription ID.
2. Tenant ID: Navigate to Azure Active Directory > Overview and copy the tenant
   ID.
3. Client ID: Under your registered app, copy the Application (client) ID.

### Step 5: Create the Azure Credentials JSON Object in `.env`

1. Open the `.env` file in your project directory.
2. Use the following template to create the JSON object:

```dotenv
AZURE_EXTERNAL_DNS_CREDENTIALS='{
  "tenantId": "<your-tenant-id>",
  "subscriptionId": "<your-subscription-id>",
  "clientId": "<your-client-id>",
  "clientSecret": "<your-client-secret>",
  "resourceGroup": "<your-dns-zone-resource-group>"
}
'
```

Replace the placeholders (<your-...>) with the appropriate values: •	tenantId:
Your Azure AD tenant ID. •	subscriptionId: Your Azure subscription ID.
•	clientId: Your app’s client ID. •	clientSecret: The client secret value you
saved earlier. •	resourceGroup: The name of the resource group containing your
Azure DNS Zone

### Step 6: Update your Secret in `cndi_config.yaml` to use Azure credentials

```yaml
infrastructure:
  cndi:
    external_dns:
      provider: aws
    {...}
cluster_manifests:
  {...}
  external-dns:
    kind: Secret
    metadata:
      name: external-dns
      namespace: external-dns
      stringData:
        azure.json: $cndi_on_ow.seal_secret_from_env_var(AZURE_EXTERNAL_DNS_CREDENTIALS)
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
