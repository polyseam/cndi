# a demo that is very cool

This doc is going to walk through the "golden path" for CNDI. It uses the GitHub
CLI for creating GitHub Actions Secrets, but that isn't necessary.

1. Ensure you have the GitHub CLI
   [installed and configured](https://docs.github.com/en/github-cli/github-cli/quickstart)

2. Run `gh repo create polyseam/my-repo --private --clone` to create a private
   repo

3. To download your executable run:

```bash
# if you are on windows you should run this in 'git bash'
curl -fsSL https://raw.githubusercontent.com/polyseam/cndi/main/install.sh | sh
```

4. Run `cndi init --interactive` and choose a template

5. Run `gh secret set -f .env`

6. Run `git add .`

7. Run `git status`

8. Run `git commit -m 'deploy!'`

9. Run `git push -u origin main`

10. Watch the magic 🪄
