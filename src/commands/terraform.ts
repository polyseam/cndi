import { Command, path } from "deps";

import pullStateForRun from "src/tfstate/git/read-state.ts";
import pushStateFromRun from "src/tfstate/git/write-state.ts";

import setTF_VARs from "src/setTF_VARs.ts";
import { getPathToTerraformBinary } from "src/utils.ts";

/**
 * COMMAND cndi terrafrom ...args
 * executes terraform against the resources in a project's ./cndi/terraform
 */
const terraformCommand = new Command()
  .description(
    `Execute terraform commands using your project files.`,
  )
  .option("-p, --path <path:string>", "path to your cndi git repository", {
    default: Deno.cwd(),
  })
  .arguments("<commands...>")
  .env(
    "GIT_REPO=<value:string>",
    "URL of your git repository where your cndi project is hosted.",
    { required: true },
  )
  .env(
    "TERRAFORM_STATE_PASSPHRASE=<value:string>",
    "Passphrase used to encrypt your terraform state file.",
    { required: true },
  )
  .env(
    "SEALED_SECRETS_PRIVATE_KEY=<value:string>",
    "Private key used to encrypt your sealed secrets.",
    { required: true },
  )
  .env(
    "SEALED_SECRETS_PUBLIC_KEY=<value:string>",
    "Public key used to encrypt your sealed secrets.",
    { required: true },
  )
  .env(
    "ARGOCD_ADMIN_PASSWORD=<value:string>",
    "Password used to authenticate to the ArgoCD UI.",
    { required: true },
  )
  .env(
    "GIT_USERNAME=<value:string>",
    "Username ArgoCD will use to authenticate to your git repository.",
    { required: false },
  )
  .env(
    "GIT_TOKEN=<value:string>",
    "Personal access token ArgoCD will use to authenticate to your git repository.",
    { required: false },
  )
  .env(
    "GIT_SSH_PRIVATE_KEY=<value:string>",
    "SSH Private Key ArgoCD will use to authenticate to your git repository.",
    { required: false },
  )
  .action(async (options) => {
    const args = Deno.args.slice(1);
    const pathToTerraformResources = path.join(
      options.path,
      "cndi",
      "terraform",
    );
    const cmd = `cndi terraform ${args.join(" ")}`;
    console.log(`${cmd}\n`);

    const pathToTerraformBinary = getPathToTerraformBinary();
    setTF_VARs(); // set TF_VARs using CNDI's .env variables

    await pullStateForRun({ pathToTerraformResources, cmd });

    const proxiedTerraformCommand = new Deno.Command(pathToTerraformBinary, {
      args: [
        `-chdir=${pathToTerraformResources}`,
        ...args,
      ],
      stderr: "piped",
      stdout: "piped",
    });

    const proxiedTerraformCommandChildProcess = proxiedTerraformCommand
      .spawn();

    for await (const chunk of proxiedTerraformCommandChildProcess.stdout) {
      Deno.stdout.write(chunk);
    }

    for await (const chunk of proxiedTerraformCommandChildProcess.stderr) {
      Deno.stderr.write(chunk);
    }

    const status = await proxiedTerraformCommandChildProcess.status;

    await pushStateFromRun({ pathToTerraformResources, cmd });

    if (status.code !== 0) {
      Deno.exit(status.code);
    }
  });

export default terraformCommand;
