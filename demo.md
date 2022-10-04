# a demo that is very cool

This doc is going to walk through the "golden path" for CNDIv2. It uses the
GitHub CLI, but that isn't necessary.

1. Ensure you have the GitHub CLI
   [installed and configured](https://docs.github.com/en/github-cli/github-cli/quickstart),
   it will save us some time!

2. To create a private GitHub repo run:

   ```bash
   gh repo create polyseam/my-repo --private --clone
   ```

   This is where we will store the desired state of our cluster, including
   `node` specifications, Kubernetes manifests, and more.

3. To download your executable run:

   ```bash
   # macos (see README.md for windows and linux)
   curl https://cndi-binaries.s3.amazonaws.com/cndi/1.0.0/cndi-mac -o $HOME/bin/cndi --create-dirs && chmod +x $HOME/bin/cndi && source ~/.zshrc
   ```

4. CNDI needs to be installed after it is downloaded, to do this one-time setup
   run:

   ```bash
   cndi install
   ```

5. Download the following file and place it in the `my-repo` folder:
   [/cndi-config.jsonc](/cndi-config.jsonc)

   That file name `cndi-config.jsonc` is the default name for a cndi config
   file, so now when you are in the same directory cndi can pick it up
   automatically.

6. To initialize your cndi project run:

   ```bash
   # if the file was not in this directory you could use the -f option to point to it

   cndi init
   ```

7. Populate your environment variables in the `.env` file.

   Running `cndi init` created a number of files, we need to add our own secrets
   to the `.env` file it created. Note: these are `gitignored` and should never
   be commited.

8. To take your secret variables and add them as repo secrets run:

   ```bash
   gh secret set -f .env
   ```

9. To stage the files cndi created for us run:

   ```bash
   git add .
   ```

10. To view the contents you are about to push to your repo run:

```bash
git status
```

11. Commit those changes:

```bash
git commit -m 'first commit'
```

12. Push those changes:

```bash
git push -u origin main
```

13. Watch the magic 🪄