# Google Cloud Platform (GCP) Console Setup Guide

### Step 1: Create a Google Cloud Platform Project

Your CNDI project should be created in a Google Cloud Platform (GCP) project. We
recommend that you creating a new
[Create a new Google Cloud Platform Project](https://console.cloud.google.com/projectcreate)
to keep things organized.

### Step 2: Create a service account for CNDI

CNDI will use a service account to interact with GCP and create cloud resources
on your behalf. You are always free to call `cndi destroy` to clean up any
resources you no longer want.

1. Go to Navigation menu > `IAM & Admin`, select `Service accounts` and click on
   `+ Create Service Account`.

2. Fill necessary details

![create service account](/docs/cloud-setup/gcp/img/create-service-account-details.png)

3. Now click `Create and Continue` and then add the following roles: Role:
   `Compute Admin`,`Compute Network Admin`, `Compute Load Balancer Admin`,
   `Service Management Administrator`, `Quota Admin`, and if your using an GKE
   cluster add the `Kubernetes Engine Service Agent` role as well

![service account access](/docs/cloud-setup/gcp/img/service-account-access.png)

4. Click Continue and then click Done.

![create service account](/docs/cloud-setup/gcp/img/create-service-account.png)

5. At the top, click `Key` > `Add Key` > `Create new key`.

![create service account keys](/docs/cloud-setup/gcp/img/create-service-account-keys.png)

6. Make sure the key type is set to `JSON` and click `Create`.

7. You'll get a message that the service account's private key JSON file was
   downloaded to your computer. Make a note of the file name and where your
   browser saves it. You'll need it later.

8. Click Close.

![create service account keys json](/docs/cloud-setup/gcp/img/create-service-account-keys-json.png)

![save service account keys json](/docs/cloud-setup/gcp/img/save-json-service-account-details.png)
