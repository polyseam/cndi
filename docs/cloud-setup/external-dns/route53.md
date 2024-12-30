# CNDI External-DNS

# with AWS Route53

CNDI has built-in support for managing DNS records with AWS Route53. This guide
will walk you through setting it up.

The key idea is that you need to specify a Secret containing AWS credentials
that External-DNS can use to manage Route53 records.

This Secret will be used to authenticate with AWS Route53 from inside your CNDI
Cluster, so that it can open your Ingress resources at a specified domain names.

If you are using EKS and are comfortable using the same `AWS_ACCESS_KEY_ID` and
`AWS_SECRET_ACCESS_KEY` you used for your EKS Cluster provisioning, that is an
option, you just need to be sure that the IAM user has the necessary permissions
to manage Route53 records.

Alternatively, you can create a new IAM user with the necessary permissions for
External-DNS, and that will work even if your cluster is _not_ hosted on AWS.

First let's focus on the simplest case, using the same credentials you used to
create your EKS Cluster. Most of the work is likely already done for you!

## Using Existing Cluster Credentials

The AWS Credentials should look like this:

```dotenv
AWS_ACCESS_KEY_ID=AKIAIiojoijoojEXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUIHNUBIYBAyddbPxRfiCYEXAMPLEKEY
```

If you selected the `aws` provider for `external_dns` when you created your
cluster with `cndi create ...`, these values should already be in your `.env`
file, and the Secret that encrypts and holds those values should already be in
your `cndi_config.yaml` file too.

```yaml
infrastructure:
  cndi:
    {...}
    external_dns:
      provider: aws
cluster_manifests:
  {...}
  external-dns:
    kind: Secret
    metadata:
      name: external-dns
      namespace: external-dns
      stringData:
        AWS_ACCESS_KEY_ID: $cndi_on_ow.seal_secret_from_env_var(AWS_ACCESS_KEY_ID)
        AWS_SECRET_ACCESS_KEY: $cndi_on_ow.seal_secret_from_env_var(AWS_SECRET_ACCESS_KEY)
```

If your `cndi_config.yaml` and `.env` files are already set up this way, you're
all set and can begin using external-dns with Route53!

## Getting Dedicated External-DNS Credentials

## for AWS Route53

Alternatively if you want to use a different IAM user, or if your cluster is
hosted on a cloud other than AWS, you can create a new IAM user with the
necessary permissions to edit your Route53 zone records.

The implementation is the same, all that changes is the IAM user credentials you
use in your `external-dns` Secret.

If you want to create a new IAM user for External-DNS, you can follow these
steps:

### Step 1: Log in to the AWS Management Console

1. Open a web browser and navigate to the AWS Management Console.
2. Sign in with your AWS account credentials.

### Step 2: Navigate to the IAM Management Console

1. In the AWS Console, search for IAM in the search bar at the top.
2. Click on the IAM service from the search results.

### Step 3: Create a New IAM Policy for ExternalDNS

1. In the IAM Console, click on Policies in the sidebar.
2. Click Create Policy to start creating a new policy.
3. Select the JSON tab and paste the following policy document, which grants the
   necessary permissions for ExternalDNS to manage Route53:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "route53:ListHostedZones",
        "route53:GetChange",
        "route53:ChangeResourceRecordSets"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": "route53:ListResourceRecordSets",
      "Resource": "*"
    }
  ]
}
```

4. Click Next to review the policy.
5. Give the policy a meaningful name, such as `My-ExternalDNS-Route53-Policy`,
   and optionally add a description.
6. Click Create Policy to save it.

### Step 4: Create a New IAM User

1. Go back to the IAM Console and click Users in the sidebar.
2. Click Add Users to start creating a new user.
3. Enter a username, such as externaldns-user.
4. Click Next: Permissions.

### Step 5: Attach the Custom Policy to the User

1. On the permissions page, select Attach existing policies directly.
2. Search for the policy you created earlier `My-ExternalDNS-Route53-Policy`.
3. Select the checkbox next to the policy name.
4. Click Next: Tags (optional), then click Next: Review.

### Step 6: Create the User and Download Credentials

1. Review the details on the final page to ensure everything is correct.
2. Click Create User.
3. Switch to the `Security Credentials` tab.
4. Click on `Create access key`.
5. Select `Other`
6. Click `Next`
7. Click `Create access key`
8. Download the credentials file by clicking `Download .csv file`

### Step 7: Set Up ExternalDNS with AWS Credentials

1. Open your cluster's `.env` file and add the `Access key ID` and
   `Secret access key` to the file as follows:

```bash
EXTERNAL_DNS_AWS_ACCESS_KEY_ID=AKIAIiojoijoojEXAMPLE
EXTERNAL_DNS_AWS_SECRET_ACCESS_KEY=wJalrXUIHNUBIYBAyddbPxRfiCYEXAMPLEKEY
```

### Step 8: Update your `cndi_config.yaml` with the AWS credentials

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
        AWS_ACCESS_KEY_ID: $cndi_on_ow.seal_secret_from_env_var(EXTERNAL_DNS_AWS_ACCESS_KEY_ID)
        AWS_SECRET_ACCESS_KEY: $cndi_on_ow.seal_secret_from_env_var(EXTERNAL_DNS_AWS_SECRET_ACCESS_KEY)
```

### Step 9: Deploy Updated Secret to Your Cluster Securely

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

**A**: You may just want to wait an hour and go get a snack, otherwise:

1. Ensure all jobs in GitHub Actions have completed successfully.
2. Run `cndi show-outputs` in your project directory.
3. Take the the resulting command from the output `get_kubeconfig_command` and
   run it in your terminal.
4. Take the resulting command from the output `get_argocd_port_forward_command`
   and run it in your terminal.
5. Open your browser and navigate to `localhost:8080`.
6. Log in to ArgoCD with username `admin` and the password from
   `ARGOCD_ADMIN_PASSWORD` in your `.env` file.
7. Check the `Applications` tab and search for any issues.
