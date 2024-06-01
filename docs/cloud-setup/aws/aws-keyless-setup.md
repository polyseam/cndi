## Amazon Web Services (AWS) Console Setup Guide

### Step 1: Sign up / Sign in to AWS

If you do not have an AWS account, complete the following steps to create one.

1. Open
   [https://portal.aws.amazon.com/billing/signup](https://portal.aws.amazon.com/billing/signup)

2. Follow the online instructions.

### Step 2: Create an IAM user account

For the purpose of this tutorial we are using the AWS account root user. This is
NOT an best practice. Instead, create a new IAM user for each person that
requires administrator access. Then make those users administrators by placing
the users into an "Administrators" user group to which you attach. For more
infomation go to
[AWS Identity and Access Management User Guide](https://docs.aws.amazon.com/IAM/latest/UserGuide/getting-started.html)

1. Sign in to the IAM console as the account owner by choosing Root user and
   entering your AWS account email address. On the next page, enter your
   password.

![Sign in](/docs/cloud-setup/aws/img/sign-in.jpg)

2. Select the Users menu. Navigate to the Users screen. You'll find it in the
   IAM dashboard, under the Identity and Access Management (IAM) drop-down menu
   on the left side of the screen. Click on Users.

![Select the Users menu](/docs/cloud-setup/aws/img/select-users-menu.jpg)

3. Provide all details, such as the username and access type. In this tutorial,
   we use the name cli-user, and check the Programmatic access box under Access
   type. This option gives the user access to AWS development tools, such as the
   command line interface used later in this tutorial.

![Add a user](/docs/cloud-setup/aws/img/add-a-user.jpg)

4. Set the user permissions. Click Attach existing policies directly and then
   filter the policies by keyword: IAM. For this user, select IAMFullAccess from
   the list of available policies. The IAMFullAccess policy enables this user to
   create and manage user permissions in AWS

![Set the user permissions](/docs/cloud-setup/aws/img/set-user-permissions.jpg)

5. Choose Next: Tags.

6. Choose Next: Review to see the details of the username, AWS access type and
   permissions to be added to the new user. When you are ready to proceed,
   choose Create user.

### Step 3: Configure OIDC Provider

[AWS Documentation About Setup](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html)

1. Let's create a provider using the wizard found here in the IAM Console:
   https://us-east-1.console.aws.amazon.com/iam/home?region=us-east-1#/identity_providers/create

2. Select the `OpenID Connect` provider type and click `Next Step`.

3. Enter the following URL in the `Provider URL` field:
   `https://token.actions.githubusercontent.com`

4. Enter the following domain in the Audience field: `sts.amazonaws.com`

5. To keep track of the provider, we recommend adding a tag.

6. Click `Next Step` and review the provider details.

### Step 4: Create an access key ID and secret access key

1. Now that we have an OIDC Provider, let's attach the following role:

```jsonc
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::012345678910:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:polyseam/*" // Replace 'polyseam' with your org name
        }
      }
    }
  ]
}
```

# THIS CANNOT LIVE 💣

2. Next, let's attach a set of permissions to the role:

```jsonc
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iam:*",
        "organizations:DescribeAccount",
        "organizations:DescribeOrganization",
        "organizations:DescribeOrganizationalUnit",
        "organizations:DescribePolicy",
        "organizations:ListChildren",
        "organizations:ListParents",
        "organizations:ListPoliciesForTarget",
        "organizations:ListRoots",
        "organizations:ListPolicies",
        "organizations:ListTargetsForPolicy"
      ],
      "Resource": "*"
    }
  ]
}
```
