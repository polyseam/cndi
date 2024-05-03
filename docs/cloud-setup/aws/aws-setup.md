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

### Step 3: Create an access key ID and secret access key

For CLI access, you need an `access key ID` and `secret access key`. Theses keys
are are used to sign programmatic requests that you make to AWS. If you don't
have access keys, you can create them from the AWS Management Console.

**To create access keys for an IAM user**

1. Sign in to the AWS Management Console and open the IAM console at
   [https://console.aws.amazon.com/iam/](https://console.aws.amazon.com/iam/).

2. In the navigation pane, choose Users.

3. Choose the name of the user whose access keys you want to create, and then
   choose the Security credentials tab.

4. In the Access keys section, choose Create access key.

5. To view the new access key pair, choose Show. You will not have access to the
   secret access key again after this dialog box closes. Your credentials will
   look something like this:

- Access key ID: _AKIAIOSFODNN7EXAMPLEID_

- Secret access key: _wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY_

6. To download the key pair, choose Download.csv file. Store the keys in a
   secure location. You will not have access to the secret access key again
   after this dialog box closes.

![Download secret access key](/docs/cloud-setup/aws/img/download-secret-access-key.jpg)

## Conclusion

In the end you should have all the credentials for a cluster deployment on AWS

- **Access key ID** - Access keys pair\
  Example access key ID : _AKIAIOSFODNN7EXAMPLEID_
- **Secret access key** - Access keys pair\
  Example secret access key: _wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY_

## Conclusion

In the end you should have all the credentials for a cluster deployment on AWS
