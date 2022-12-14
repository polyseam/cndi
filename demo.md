# a demo that is very cool

This doc is going to walk through the "golden path" for CNDIv2. It uses the
GitHub CLI for creating GitHub Actions Secrets, but that isn't necessary.

1. Ensure you have the GitHub CLI
   [installed and configured](https://docs.github.com/en/github-cli/github-cli/quickstart)

2. Run `gh repo create polyseam/my-repo --private --clone` to create a private
   repo

3. To download your executable run:

```bash
# if you are on windows you should run this in 'git bash'
curl -fsSL https://raw.githubusercontent.com/polyseam/cndi/main/install.sh | sh
```

4. Download the following file and place it in the `my-repo` folder.
   [/cndi-config.jsonc](/cndi-config.jsonc)

5. Run `cndi init`

6. Populate your environment variables in the `.env` file

7. Run `gh secret set -f .env`

8. Run `git add .`

9. Run `git status`

10. Run `git commit -m 'first commit'`

11. Run `git push -u origin main`

12. Watch the magic 🪄
