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
- From a single node local install to massive 100+ node clusters and anything in
  between

## Technical Questions

### Where I get the argocd admin password, how do I change it?

You can find the password in the `.env` file in the cndi project directory.

![Env file](/docs/frequently-asked-questions/img/argocd-password.png)

---

### I deployed a cluster but the run failed with missing required envrionment variables, how do I fix this it?

![gh-secret](/docs/frequently-asked-questions/img/gh-secret.png)

Push the secret environment variables to GitHub.

```
gh secret set -f .env
```

---

### I'm trying to upload the required environment variables but the command errored out, how do I fix this it?

![missing-gh-secret](/docs/frequently-asked-questions/img/missing-gh-secret.png)

There is a ongoing Github bug that causes secrets to randomly not upload to
Github. Push the secret environment variables to GitHub again till there is no
errors.

```
gh secret set -f .env
```

![uploaded-gh-secret](/docs/frequently-asked-questions/img/uploaded-gh-secret.png)

---

## Conclusion

If you have any additional questions that are not covered in this FAQ, please
feel free to reach out to us for further assistance.
