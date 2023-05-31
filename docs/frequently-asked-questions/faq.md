# Frequently Asked Questions (FAQ)

## General Questions

### What is CNDI?

CNDI is an open-source self-serve infrastructure deployment tool

### What are the benifits of CNDI?

#### Developer experience
- Store your data infrastructure as code
- Leverage the scale of Kubernetes, let us handle the setup
- Automatically secured including ingress authentication and SSL certificates

#### Only pay for your infrastructure
- CNDI is totally free, all you pay for is the infrastructure you deploy
- The cheapest option on the market, without needing to roll your own cluster

#### Scalable
- We can start small and then grow with your needs
- From a single node local install to massive 100+ node clusters and anything in between


## Technical Questions

### Where I get the argocd admin password, how do I change it?

You can find the password in the .env file in the cndi project directory.

![Env file](/docs/frequently-asked-questions/img/argocd-password.png)

---

### On my first deployment the first cndi workflow appears to fail, does this mean? 

![duplicate-workflow](/docs/frequently-asked-questions/img/duplicate-workflow.png)

There is a ongoing Github Action bug that creates a duplicate failed workflow on the first initial deployment, this is will only happen once.

---

### I deployed a cluster but the run failed with missing required envrionment variables, how do I fix this it? 

![gh-secret](/docs/frequently-asked-questions/img/gh-secret.png)

Push the secret environment variables to GitHub.

```
gh secret set -f .env
```

---

### I'm trying to upload the required envrionment variables but the command errored out, how do I fix this it? 

![missing-gh-secret](/docs/frequently-asked-questions/img/missing-gh-secret.png)

There is a ongoing Github bug that causes secrets to randomly not upload to Github. Push the secret environment variables to GitHub again till there is no errors.

```
gh secret set -f .env
```

![uploaded-gh-secret](/docs/frequently-asked-questions/img/uploaded-gh-secret.png)

---

### How do I connect to a node in my cluster in AWS

- Go to [AWS EC2 console](https://console.aws.amazon.com/ec2/).
- In the navigation pane, choose Instances.
- Select a instance and choose Connect.
- Choose EC2 Instance Connect.
- Verify the user name and choose Connect to open a terminal window

![Aws instances dashboard](/docs/walkthroughs/aws/img/aws-instances-ui.png)

![Aws instances dashboard](/docs/walkthroughs/aws/img/aws-connect.png)

--- 

### How do I connect to a node in my cluster in GCP

- Go to [GCP console](https://console.cloud.google.com).
- In the navigation pane, choose VM Instances.
- Select a instance and click on the SSH button to connect

![GCP instances dashboard](/docs/walkthroughs/gcp/img/gcp-instances-ui.png)

---

### How do I connect to a node in my cluster in Azure

- Go to the Azure portal.
- Search for and select Virtual machines.
- Select the virtual machine from the list.
- Select Connect from the left menu.
- Select the option that fits with your preferred way of connecting. 
- We recommend connecting to a VM over SSH using a public-private key pair, also known as SSH keys.

You can generate a new SSH key on your local machine. After you generate the key, you can add the public key to your vm on enable authentication over SSH.

```
ssh-keygen -t rsa
```
![Azure nlb](/docs/walkthroughs/azure/img/connect.png)
- Click on reset your ssh key 
- Copy the contents of the public key id_rsa.pub into SSH public key section 

![Azure nlb](/docs/walkthroughs/azure/img/reset.png)
Enter a file location to save the key to (by default it will save to your users directory)
When you are prompted to type a passphrase, press Enter
Once you've successfully created your private key will be saved in <your_chosen_directory>.ssh/id_rsa and your public key will be saved in <your_chosen_directory>.ssh/id_rsa.pub.

```
ssh -i id_rsa ubuntu@<ip_address_of_node>
```
**note**: Azure currently supports SSH protocol 2 (SSH-2) RSA public-private key pairs with a minimum length of 2048 bits. Other key formats such as ED25519 and ECDSA are not supported.

--- 

## Conclusion

If you have any additional questions that are not covered in this FAQ, please feel free to reach out to us for further assistance.

