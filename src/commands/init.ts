import { AirflowTlsTemplateAnswers, CNDIContext } from "../types.ts";
import { brightRed, cyan } from "https://deno.land/std@0.158.0/fmt/colors.ts";
import * as path from "https://deno.land/std@0.157.0/path/mod.ts";
import overwriteWithFn from "./overwrite-with.ts";

import airflowTlsTemplate from "../templates/airflow-tls.ts";
import basicTemplate from "../templates/basic.ts";

import availableTemplates from "../templates/available-templates.ts";

function getAirflowTlsTemplateAnswers(
  context: CNDIContext,
): AirflowTlsTemplateAnswers {
  const { interactive } = context;

  let argocdDomainName = "argocd.example.com";
  let airflowDomainName = "airflow.example.com";
  let dagRepoUrl = "https://github.com/polyseam/demo-dag-bag";
  let letsEncryptClusterIssuerEmailAddress = "admin@example.com";

  if (interactive) {
    argocdDomainName = prompt(
      cyan("Please enter the domain name you want argocd to be accessible on:"),
      argocdDomainName,
    ) as string;
    airflowDomainName = prompt(
      cyan(
        "Please enter the domain name you want airflow to be accessible on:",
      ),
      airflowDomainName,
    ) as string;
    dagRepoUrl = prompt(
      cyan("Please enter the url of the git repo containing your dags:"),
      dagRepoUrl,
    ) as string;
    letsEncryptClusterIssuerEmailAddress = prompt(
      cyan("Please enter the email address you want to use for lets encrypt:"),
      letsEncryptClusterIssuerEmailAddress,
    ) as string;
  }

  return {
    argocdDomainName,
    airflowDomainName,
    dagRepoUrl,
    letsEncryptClusterIssuerEmailAddress,
  };
}

const getTemplateString = (context: CNDIContext): string | null => {
  switch (context.template) {
    case "airflow-tls":
      return airflowTlsTemplate(getAirflowTlsTemplateAnswers(context));
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
    template = prompt(
      cyan("Please enter the template you want to use:"),
      "basic",
    ) as string;
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

    const templateString = getTemplateString({ ...context, template });

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
