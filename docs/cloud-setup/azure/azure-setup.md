## Microsoft Azure Console Setup Guide

To create and use Azure services, you first need to sign up. If you’ve never
tried or paid for Azure before, you can sign up for the Azure free account.

### Step 1: Sign up / Sign in to Azure

1. In a web browser, go to
   [https://azure.microsoft.com/free](https://azure.microsoft.com/free).

2. Follow the online instructions.

3. Make sure the Azure account has permission to manage applications in Azure
   Active Directory (Azure AD). Any of the following Azure AD roles include the
   required permissions:

- Application administrator
- Application developer
- Cloud application administrator

### Step 2: [Register an application](https://portal.azure.com/)

1. Search for and select Azure Active Directory.

![app registrations in searchbar](/docs/cloud-setup/azure/img/search-app-registrations.png)

2. Under Manage, select App registrations > New registration.

![Register an application](/docs/cloud-setup/azure/img/register-application-1.png)

3. Enter a display Name for your application. The app registration's
   automatically generated Application (client) ID, not its display name,
   uniquely identifies your app within the identity platform.

4. Specify who can use the application

5. Don't enter anything for Redirect URI

![Add role assignment](/docs/cloud-setup/azure/img/register-application-2.png)

5. When registration finishes, the Azure portal displays the app registration's
   Overview pane. You see the Application (client) ID. Also called the client
   ID, this value uniquely identifies your application in the Microsoft identity
   platform.

![Credentials](/docs/cloud-setup/azure/img/register-application-3.png)

### Step 3: Add credentials

Credentials are used by confidential client applications that access a web API.
Examples of confidential clients are web apps, other web APIs, or service-type
and daemon-type applications. These Credentials allow your application to
authenticate as itself, requiring no interaction from a user at runtime.

1. In the Azure portal, in App registrations, select your application.
2. Select Certificates & secrets > Client secrets > New client secret.
3. Add a description for your client secret.
4. Select an expiration for the secret or specify a custom lifetime.
5. Client secret lifetime is limited to two years (24 months) or less. You can't
   specify a custom lifetime longer than 24 months.
6. Select Add.
7. Record the secret's value for use in your client application code. This
   secret value is never displayed again after you leave this page.

![Certificates-secrets](/docs/cloud-setup/azure/img/certificates-secrets.png)

### Step 4: Set up [Access Control (IAM)](https://docs.microsoft.com/en-us/azure/role-based-access-control/role-assignments-portal?tabs=current)

Azure role-based access control (Azure RBAC) is the authorization system you use
to manage access to Azure resources. To grant access, you assign roles to users,
groups, service principals, or managed identities at a particular scope.

1. Sign in to the [Azure portal](https://portal.azure.com/).

2. Go to your Subscriptions.

3. Open the Add role assignment page\
   Access control (IAM) is the page that you typically use to assign roles to
   grant access to Azure resources. It's also known as identity and access
   management (IAM) and appears in several locations in the Azure portal.

4. Click Access control (IAM).

![Access control (IAM) page](/docs/cloud-setup/azure/img/sub-access-control.png)

6. Click Add > Add custom role.\
   If you don't have permissions to create custom roles, the Add custom role
   option will be disabled.

![Add custom role](/docs/cloud-setup/azure/img/add-custom-role-button.png)

8. To create a custom role, begin by assigning a name and description to the
   role.

![Basic Role Information](/docs/cloud-setup/azure/img/custom-role-basic-tab.png)

9. Next, proceed to the JSON tab and click "edit" to update the JSON to include
   `"actions"` as follows:

![JSON Role Information](/docs/cloud-setup/azure/img/custom-role-json-tab.png)

```json
{
  "properties": {
    "roleName": "cndi-min-role",
    "description": "minimum permissions required for deploying a CNDI cluster to AKS",
    "assignableScopes": [
      "/subscriptions/<subscription-id>"
    ],
    "permissions": [
      {
        "actions": [
          "Microsoft.ContainerService/managedClusters/write",
          "Microsoft.ContainerService/managedClusters/delete",
          "Microsoft.ContainerService/managedClusters/read",
          "Microsoft.ContainerService/managedClusters/listClusterUserCredential/action",
          "Microsoft.Resources/subscriptions/resourceGroups/write",
          "Microsoft.Resources/subscriptions/resourceGroups/delete",
          "Microsoft.Resources/subscriptions/resourceGroups/read",
          "Microsoft.Network/virtualNetworks/write",
          "Microsoft.Network/virtualNetworks/read",
          "Microsoft.Network/virtualNetworks/delete",
          "Microsoft.Network/virtualNetworks/subnets/delete",
          "Microsoft.Network/virtualNetworks/subnets/write",
          "Microsoft.Network/virtualNetworks/subnets/read",
          "Microsoft.Network/virtualNetworks/subnets/join/action",
          "Microsoft.Network/dnszones/A/write",
          "Microsoft.Network/dnszones/A/read",
          "Microsoft.Network/dnszones/A/delete",
          "Microsoft.Network/dnszones/TXT/write",
          "Microsoft.Network/dnszones/TXT/read",
          "Microsoft.Network/dnszones/TXT/delete",
          "Microsoft.Network/dnszones/read"
        ]
      }
    ]
  }
}
```

10. Finally Click "Review + Create" to create the custom role

11. After creating the custom role, we want to assign it to our app
    registration. To do this, return to the Access control (IAM) page and click
    "Add" > "Add role assignment"

![Add role assignment](/docs/cloud-setup/azure/img/add-role-assignment-menu.png)

9. Filter through "Job function roles" to locate the custom role you created by
   name

![Add role assignment](/docs/cloud-setup/azure/img/add-role-assignment-custom.png)

10. On the Members tab, select "User, group, or service principal" to assign the
    selected role to one or more Azure AD users, groups, or service principals
    (applications).

![Add role assignment](/docs/cloud-setup/azure/img/members.png)

1. Select the "users, groups, or service principals".

2. Then click "Select members" and search for the app registration you created
   earlier.

3. Click "Select" to add the app to the Members list.

4. Click Next.

![Select-member](/docs/cloud-setup/azure/img/select-members.png)

5. On the Review + assign tab, review the role assignment settings.

![Assign role](/docs/cloud-setup/azure/img/review-assign.png)

6. Click Review + assign to assign the role.\
   After a few moments, the security principal is assigned the role at the
   selected scope.

![Review Assigned role](/docs/cloud-setup/azure/img/r-role-assignments.png)

## Conclusion

In the end you should have all the credentials for a cluster deployment on azure

- ARM_CLIENT_SECRET from Secret Value
  ![Certificates-secrets](/docs/cloud-setup/azure/img/certificates-secrets.png)

- ARM_TENANT_ID & ARM_CLIENT_ID from App Overview
  ![Credentials](/docs/cloud-setup/azure/img/register-application-3.png)

- ARM_SUBSCRIPTION_ID from subscription overview

If you have any additional questions that are not covered in this FAQ, please
feel free to reach out to us for further assistance.
