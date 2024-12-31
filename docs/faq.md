# Frequently Asked Questions (FAQ)

### Some `cndi` command has failed, how do I fix it?

If a `cndi` command fails, running the command often solves the issue.

"When in doubt, run it again."

This answer is _even less_ satisfying for us!

We'd love to know more about the issue, please check out the discussion page we
linked to when the command failed, or look for one here:
[https://github.com/orgs/polyseam/discussions/categories/error-message-discussion](https://github.com/orgs/polyseam/discussions/categories/error-message-discussion).

Feel free to [open an issue](https://github.com/polyseam/cndi/issues/new) too if
you need further assistance.

---

### Where I find the argocd admin password?

You can find the password in the `.env` file in your cndi project directory.

![Env file](/docs/img/argocd-password.png)

---

### I deployed a cluster but the run failed with missing required envrionment variables, how do I fix this it?

![gh-secret](/docs/img/cndi-run-missing-env.png)

Push the secret environment variables to GitHub.

```
gh secret set -f .env
```

---

### I'm trying to upload the required environment variables but the command errored out, how do I fix this it?

![missing-gh-secret](/docs/img/gh-secret-set-fail.png)

There is a ongoing Github bug that causes secrets to randomly not upload to
Github. Push the secret environment variables to GitHub again till there is no
errors.

```
gh secret set -f .env
```

![uploaded-gh-secret](/docs/img/uploaded-gh-secret.png)

---

## Conclusion

If you have any additional questions that are not covered in this FAQ, please
feel free to reach out to us for further assistance.
