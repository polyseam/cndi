# Frequently Asked Questions (FAQ)

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
