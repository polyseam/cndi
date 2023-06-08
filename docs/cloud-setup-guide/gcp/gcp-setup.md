# Google Cloud Platform Setup Guide

### Step 1: Ensure you have a Google Cloud Platform (GCP) account

---

1. Go to [https://cloud.google.com/](https://cloud.google.com/)
2. Click on `Get started for free` button

3. Fill in your information and wait for your G-code to be texted to your cell
   number
4. Enter G-Code and click on `Verify`
5. Read and accept `Custom Search API Terms of Service` and
   `Google Cloud Platform Free Trial Terms of Service` under Terms of Service
6. Click `Continue`
7. Enter address and payment information
8. Click `Start free trial` button

---

### Step 2: Create a service account

#### A service account is a special type of Google account intended to represent a non-human user that needs to authenticate and be authorized to access data in Google APIs.

1. Go to Navigation menu > `IAM & Admin`, select `Service accounts` and click on
   `+ Create Service Account`.

2. Fill necessary details

![create service account](/docs/cloud-setup-guide/gcp/img/create-service-account-details.png)

3. Now click `Create and Continue` and then add the following roles: Role:
   `Compute Admin`,`Compute Network Admin`, `Compute Load Balancer Admin`

![service account access](/docs/cloud-setup-guide/gcp/img/service-account-access.png)

4. Click Continue and then click Done.

![create service account](/docs/cloud-setup-guide/gcp/img/create-service-account.png)

5. At the top, click `Key` > `Add Key` > `Create new key`.

![create service account keys](/docs/cloud-setup-guide/gcp/img/create-service-account-keys.png)

6. Make sure the key type is set to `JSON` and click`Create`.

7. You'll get a message that the service account's private key JSON file was
   downloaded to your computer. Make a note of the file name and where your
   browser saves it. You'll need it later.

8. Click Close.

![create service account keys json](/docs/cloud-setup-guide/gcp/img/create-service-account-keys-json.png)

![save service account keys json](/docs/cloud-setup-guide/gcp/img/save-json-service-account-details.png)

### Step 3: [Create a new GCP project](https://console.cloud.google.com/projectcreate) and note it's Project ID

A project is required to use Google Cloud, and forms the basis for creating,
enabling, and using all Google Cloud services, including billing, and managing
permissions.

All projects consist of the following: A Project ID, which is a unique
identifier for the project and a Project number, which is automatically assigned
when you create the project.

To create a project :

1. Click New Project
2. You will need to enter a project name
3. By default, it generates a project ID but you can also choose your own.
4. When you are finished entering new project details, click Create. You have
   now finished creating your first project
