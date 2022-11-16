import { AirflowTlsTemplateAnswers, CNDIContext } from "../types.ts";
import { brightRed, cyan } from "https://deno.land/std@0.158.0/fmt/colors.ts";
import * as path from "https://deno.land/std@0.157.0/path/mod.ts";
import overwriteWithFn from "./overwrite-with.ts";

import { Select } from "https://deno.land/x/cliffy@v0.25.4/prompt/select.ts";
import { Input } from "https://deno.land/x/cliffy@v0.25.4/prompt/mod.ts";

import airflowTlsTemplate from "../templates/airflow-tls.ts";
import basicTemplate from "../templates/basic.ts";

import availableTemplates from "../templates/available-templates.ts";

async function getAirflowTlsTemplateAnswers(
  context: CNDIContext,
): Promise<AirflowTlsTemplateAnswers> {
  const { interactive } = context;

  let argocdDomainName = "argocd.example.com";
  let airflowDomainName = "airflow.example.com";
  let dagRepoUrl = "https://github.com/polyseam/demo-dag-bag";
  let letsEncryptClusterIssuerEmailAddress = "admin@example.com";

  if (interactive) {
    argocdDomainName = await Input.prompt({
      message: cyan(
        "Please enter the domain name you want argocd to be accessible on:",
      ),
      default: argocdDomainName,
    }) as string;

    airflowDomainName = await Input.prompt({
      message: cyan(
        "Please enter the domain name you want airflow to be accessible on:",
      ),
      default: airflowDomainName,
    }) as string;

    dagRepoUrl = await Input.prompt({
      message: cyan(
        "Please enter the url of the git repo containing your dags:",
      ),
      default: dagRepoUrl,
    }) as string;

    letsEncryptClusterIssuerEmailAddress = await Input.prompt({
      message: cyan(
        "Please enter the email address you want to use for lets encrypt:",
      ),
      default: letsEncryptClusterIssuerEmailAddress,
    }) as string;
  }

  return {
    argocdDomainName,
    airflowDomainName,
    dagRepoUrl,
    letsEncryptClusterIssuerEmailAddress,
  };
}

const getTemplateString = async (
  context: CNDIContext,
): Promise<string | null> => {
  switch (context.template) {
    case "airflow-tls":
      return airflowTlsTemplate(await getAirflowTlsTemplateAnswers(context));
    case "basic":
      return basicTemplate();
    default:
      return null;
  }
};

/**
 * COMMAND fn: cndi init
 * Initializes ./cndi directory with the specified config file
 * and initializes workflows in .github
 */
export default async function init(context: CNDIContext) {
  const initializing = true;
  const CNDI_CONFIG_FILENAME = "cndi-config.jsonc";

  const { projectDirectory, interactive } = context;
  let { template } = context;

  if (interactive && !template) {
    template = await Select.prompt({
      message: cyan("Pick a template"),
      options: [
        { name: "basic", value: "basic" },
        { name: "airflow-tls", value: "airflow-tls" },
      ],
    });
  }

  // if the user has specified a template, use that
  if (template) {
    console.log(`cndi init --template ${template}\n`);

    if (!availableTemplates.includes(template)) {
      console.log(
        brightRed(
          `The template you selected "${template}" is not available.\n`,
        ),
      );

      console.log("Available templates are:\n");
      console.log(`${availableTemplates.map((t) => cyan(t)).join(", ")}\n`);
      return;
    }

    const configOutputPath = path.join(projectDirectory, CNDI_CONFIG_FILENAME);

    const templateString = await getTemplateString({ ...context, template });

    if (!templateString) {
      console.error(`Template "${template}" not yet implemented.`);
      Deno.exit(1);
    }

    await Deno.writeTextFile(configOutputPath, templateString);

    // because there is no "pathToConfig" when using a template, we need to set it here
    overwriteWithFn(
      { ...context, pathToConfig: configOutputPath },
      initializing,
    );

    return;
  } else {
    console.log(`cndi init -f "${context.pathToConfig}"`);
  }

  overwriteWithFn(context, initializing);
}
