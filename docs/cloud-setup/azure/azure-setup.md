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

3. Enter a display name for your app registration, and note it down, leave all
   other fields as default.

![Add role assignment](/docs/cloud-setup/azure/img/register-application-2.png)

5. Once your app registration has been created, you should see it's "Overview"
   pane, where you can see a arm-client-id value and an arm-tenant-id value.
   We'll use these as part of the credentials for the cluster deployment later.

![Credentials](/docs/cloud-setup/azure/img/register-application-3.png)

### Step 3: Add credentials

From the "Overview" pane, you can add a client secret to your app registration,
and that will give us a couple additional credentials we need for your CNDI
cluster deployment.

1. Select Certificates & secrets > Client secrets > New client secret.
2. Add a description for your client secret.
3. Select an expiration for the secret or specify a custom lifetime.
4. Client secret lifetime is limited to two years (24 months) or less. You can't
   specify a custom lifetime longer than 24 months.
5. Select "Add".
6. Record the secret's value for use in your client application code. This
   secret value is never displayed again after you leave this page.

![Certificates-secrets](/docs/cloud-setup/azure/img/certificates-secrets.png)

### Step 4: Set up [Access Control (IAM)](https://docs.microsoft.com/en-us/azure/role-based-access-control/role-assignments-portal?tabs=current)

The app registration represents the identity of the application that will
request resources from Azure cloud, so the next steps are to define which
resources that app registration can access.

1. Sign in to the [Azure portal](https://portal.azure.com/).

2. Go to your "Subscriptions".

3. Select the Subscription you want to use CNDI within.

4. Click Access control (IAM).

![Access control (IAM) page](/docs/cloud-setup/azure/img/sub-access-control.png)

6. Click "Add +" > "Add custom role".

![Add custom role](/docs/cloud-setup/azure/img/add-custom-role-button.png)

7. To create a custom role, begin by assigning a name and description to the
   role.

![Basic Role Information](/docs/cloud-setup/azure/img/custom-role-basic-tab.png)

8. Next, proceed to the JSON tab and click "edit" to update the JSON to include
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

9. Finally Click "Review + Create" to create the custom role. Note: you can use
   this custom role for multiple app registrations down the line.

10. After creating the new custom role, we want to assign it to our app
    registration. To do this, return to the Access control (IAM) page and click
    "Add +" > "Add role assignment".

![Add role assignment](/docs/cloud-setup/azure/img/add-role-assignment-menu.png)

11. Filter through "Job function roles" to locate the custom role you created by
    name.

![Add role assignment](/docs/cloud-setup/azure/img/add-role-assignment-custom.png)

12. On the "Members" tab Select the "User, group, or service principal".

![Add role assignment](/docs/cloud-setup/azure/img/members.png)

13. Then click "Select members" and search for the app registration you created
    earlier.

14. Click "Select" to add the app to the Members list, then click "Next".

![Select-member](/docs/cloud-setup/azure/img/select-members.png)

15. On the "Review + assign" tab, review the role assignment settings.

![Assign role](/docs/cloud-setup/azure/img/review-assign.png)

16. Click "Review + assign" to assign the custom role.

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
