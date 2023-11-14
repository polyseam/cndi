## Setting up Microsoft Azure for CNDI

To create and use Azure services, you first need to sign up. If you’ve never
tried or paid for Azure before, you can sign up for the Azure free account.

### Step 1: Sign up to Azure

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

![app registrations in searchbar](/docs/cloud-setup-guide/azure/img/search-app-registrations.png)

2. Under Manage, select App registrations > New registration.

![Register an application](/docs/cloud-setup-guide/azure/img/register-application-1.png)

3. Enter a display Name for your application. The app registration's
   automatically generated Application (client) ID, not its display name,
   uniquely identifies your app within the identity platform.

4. Specify who can use the application

5. Don't enter anything for Redirect URI

![Add role assignment](/docs/cloud-setup-guide/azure/img/register-application-2.png)

5. When registration finishes, the Azure portal displays the app registration's
   Overview pane. You see the Application (client) ID. Also called the client
   ID, this value uniquely identifies your application in the Microsoft identity
   platform.

![Credentials](/docs/cloud-setup-guide/azure/img/register-application-3.png)

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

![Certificates-secrets](/docs/cloud-setup-guide/azure/img/certificates-secrets.png)

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

![Access control (IAM) page](/docs/cloud-setup-guide/azure/img/sub-access-control.png)

6. Click the Role assignments tab to view the role assignments at this scope.

![Add role assignment](/docs/cloud-setup-guide/azure/img/add-role-assignment-menu.png)

7. Click Add > Add role assignment.\
   If you don't have permissions to assign roles, the Add role assignment option
   will be disabled.

8. On the Roles tab, select a role that you want to use.\
   You can search for a role by name or by description. You can also filter
   roles by type and category.

Add the Contributor Role and if your using a AKS cluster add the Network
contributor role once you finish adding the Contributor role

![Add role assignment](/docs/cloud-setup-guide/azure/img/roles.png)

9. Click Next.

10. On the Members tab, select User, group, or service principal to assign the
    selected role to one or more Azure AD users, groups, or service principals
    (applications).

![Add role assignment](/docs/cloud-setup-guide/azure/img/members.png)

1. Click Select members.

2. Find and select the users, groups, or service principals.\
   You can type in the Select box to search the directory for your app name
3. Click Select to add the app to the Members list.

4. Click Next.

![Select-member](/docs/cloud-setup-guide/azure/img/select-members.png)

5. On the Review + assign tab, review the role assignment settings.

![Assign role](/docs/cloud-setup-guide/azure/img/review-assign.png)

6. Click Review + assign to assign the role.
   \
   After a few moments, the security principal is assigned the role at the
   selected scope.

![Review Assigned role](/docs/cloud-setup-guide/azure/img/r-role-assignments.png)

## Conclusion

In the end you should have all the credentials for a cluster deployment on azure

- ARM_CLIENT_SECRET from Secret Value
  ![Certificates-secrets](/docs/cloud-setup-guide/azure/img/certificates-secrets.png)

- ARM_TENANT_ID & ARM_CLIENT_ID from App Overview
  ![Credentials](/docs/cloud-setup-guide/azure/img/register-application-3.png)

- ARM_SUBSCRIPTION_ID from subscription overview

If you have any additional questions that are not covered in this FAQ, please
feel free to reach out to us for further assistance.
