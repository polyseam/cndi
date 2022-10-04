# a demo that is very cool

This doc is going to walk through the "golden path" for CNDIv2. It uses the
GitHub CLI, but that isn't necessary.

1. Ensure you have the GitHub CLI
   [installed and configured](https://docs.github.com/en/github-cli/github-cli/quickstart)

2. Run `gh repo create polyseam/my-repo --private --clone` to create a
   private repo

3. To download your executable run:

   ```bash
   # macos (see README.md for windows and linux)
   curl https://cndi-binaries.s3.amazonaws.com/cndi/1.0.0/cndi-mac -o $HOME/bin/cndi --create-dirs && chmod +x $HOME/bin/cndi && source ~/.zshrc
   ```

4. Run `cndi install`

5. Download the following file and place it in the `my-repo` folder.
   [/cndi-config.jsonc](/cndi-config.jsonc)

6. Run `cndi init`

7. Populate your environment variables in the `.env` file

8. Run `gh secret set -f .env`

9. Run `git add .`

10. Run `git status`

11. Run `git commit -m 'first commit'`

12. Run `git push -u origin main`

13. Watch the magic 🪄