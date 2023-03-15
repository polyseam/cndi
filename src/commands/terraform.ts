import "https://deno.land/std@0.173.0/dotenv/load.ts";
import { Command, copy, path } from "deps";

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
    "GIT_USERNAME=<value:string>",
    "Username ArgoCD will use to authenticate to your git repository.",
    { required: true },
  )
  .env(
    "GIT_PASSWORD=<value:string>",
    "Personal access token ArgoCD will use to authenticate to your git repository.",
    { required: true },
  )
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
    "ARGO_UI_ADMIN_PASSWORD=<value:string>",
    "Password used to authenticate to the ArgoCD UI.",
    { required: true },
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

    const ranProxiedTerraformCmd = Deno.run({
      cmd: [
        pathToTerraformBinary,
        `-chdir=${pathToTerraformResources}`,
        ...args,
      ],
      stderr: "piped",
      stdout: "piped",
    });

    copy(ranProxiedTerraformCmd.stdout, Deno.stdout);
    copy(ranProxiedTerraformCmd.stderr, Deno.stderr);

    const proxiedTerraformCmdStatus = await ranProxiedTerraformCmd.status();

    await pushStateFromRun({ pathToTerraformResources, cmd });

    if (proxiedTerraformCmdStatus.code !== 0) {
      Deno.exit(proxiedTerraformCmdStatus.code); // arbitrary exit code
    }

    ranProxiedTerraformCmd.close();
  });

export default terraformCommand;
