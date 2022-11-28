import {
  CNDIContext,
  EnvObject,
  NodeKind,
  SealedSecretsKeys,
  Template,
} from "../types.ts";

import { copy } from "https://deno.land/std@0.157.0/fs/copy.ts";

import { trimPemString } from "../utils.ts";

import {
  brightRed,
  cyan,
  white,
} from "https://deno.land/std@0.158.0/fmt/colors.ts";
import * as path from "https://deno.land/std@0.157.0/path/mod.ts";
import overwriteWithFn from "./overwrite-with.ts";

import { Select } from "https://deno.land/x/cliffy@v0.25.4/prompt/select.ts";
import { Secret } from "https://deno.land/x/cliffy@v0.25.4/prompt/secret.ts";
import { Input } from "https://deno.land/x/cliffy@v0.25.4/prompt/mod.ts";

import { createSealedSecretsKeys } from "../initialize/sealedSecretsKeys.ts";

import { createTerraformStatePassphrase } from "../initialize/terraformStatePassphrase.ts";

import { createArgoUIReadOnlyPassword } from "../initialize/argoUIReadOnlyPassword.ts";

import airflowTlsTemplate, {
  getAirflowTlsTemplateAnswers,
  getAirflowTlsTemplateEnvObject,
} from "../templates/airflow-tls.ts";

import basicTemplate from "../templates/basic.ts";

import { checkInitialized } from "../utils.ts";

import availableTemplates from "../templates/available-templates.ts";
import writeEnvObject from "../outputs/env.ts";
import getGitignoreContents from "../outputs/gitignore.ts";
import getREADME from "../outputs/readme.ts";

const initLabel = white("init:");

const getTemplateString = async (
  context: CNDIContext,
): Promise<string | null> => {
  const templateKind = context.template.split("/")[0] as NodeKind; // e.g. aws
  const templateBase = context.template.split("/")[1]; // e.g. airflow-tls

  switch (templateBase) {
    case "airflow-tls":
      return airflowTlsTemplate(
        templateKind,
        await getAirflowTlsTemplateAnswers(context.interactive),
      );
    case "basic":
      return basicTemplate(templateKind);
    default:
      return null;
  }
};

const prepareAWSEnv = async (context: CNDIContext): Promise<EnvObject> => {
  const AWS_REGION = "us-east-1";
  const AWS_ACCESS_KEY_ID = "";
  const AWS_SECRET_ACCESS_KEY = "";
  const awsEnvObject: EnvObject = {};

  awsEnvObject.AWS_REGION = {
    comment: "AWS",
    value: context.interactive
      ? ((await Input.prompt({
        message: cyan("Enter your AWS region:"),
        default: AWS_REGION,
      })) as string)
      : AWS_REGION,
  };

  awsEnvObject.AWS_ACCESS_KEY_ID = {
    value: context.interactive
      ? ((await Secret.prompt({
        message: cyan("Enter your AWS access key ID:"),
        default: AWS_ACCESS_KEY_ID,
      })) as string)
      : AWS_ACCESS_KEY_ID,
  };

  awsEnvObject.AWS_SECRET_ACCESS_KEY = {
    value: context.interactive
      ? ((await Secret.prompt({
        message: cyan("Enter your AWS secret access key:"),
        default: AWS_SECRET_ACCESS_KEY,
      })) as string)
      : AWS_SECRET_ACCESS_KEY,
  };
  return awsEnvObject;
};

const prepareGCPEnv = async (context: CNDIContext): Promise<EnvObject> => {
  const GCP_PROJECT_ID = "";
  const GCP_PATH_TO_SERVICE_ACCOUNT_KEY = "";

  const gcpEnvObject: EnvObject = {};

  gcpEnvObject.GCP_PROJECT_ID = {
    comment: "GCP",
    value: context.interactive
      ? ((await Input.prompt({
        message: cyan("Enter your GCP project ID:"),
        default: GCP_PROJECT_ID,
      })) as string)
      : GCP_PROJECT_ID,
  };

  gcpEnvObject.GCP_PATH_TO_SERVICE_ACCOUNT_KEY = {
    value: context.interactive
      ? ((await Input.prompt({
        message: cyan("Enter your GCP service account key json:"),
        default: GCP_PATH_TO_SERVICE_ACCOUNT_KEY,
      })) as string)
      : GCP_PATH_TO_SERVICE_ACCOUNT_KEY,
  };

  return gcpEnvObject;
};

interface GetEnvObjectArgs extends CNDIContext {
  sealedSecretsKeys: SealedSecretsKeys;
  terraformStatePassphrase: string;
  argoUIReadOnlyPassword: string;
}

const getCoreEnvObject = async (
  context: GetEnvObjectArgs,
): Promise<EnvObject> => {
  const {
    sealedSecretsKeys,
    terraformStatePassphrase,
    argoUIReadOnlyPassword,
  } = context;

  // git
  const GIT_USERNAME = "";
  const GIT_REPO = "";
  const GIT_PASSWORD = "";

  const TERRAFORM_STATE_PASSPHRASE = terraformStatePassphrase;
  const ARGO_UI_READONLY_PASSWORD = argoUIReadOnlyPassword;

  if (!sealedSecretsKeys) {
    console.log(
      initLabel,
      brightRed(`"sealedSecretsKeys" is not defined in context`),
    );
    Deno.exit(1);
  }

  if (!TERRAFORM_STATE_PASSPHRASE) {
    console.log(
      initLabel,
      brightRed(`"terraformStatePassphrase" is not defined in context`),
    );
    Deno.exit(1);
  }

  if (!ARGO_UI_READONLY_PASSWORD) {
    console.log(
      initLabel,
      brightRed(`"argoUIReadOnlyPassword" is not defined in context`),
    );
    Deno.exit(1);
  }

  const SEALED_SECRETS_PUBLIC_KEY_MATERIAL = trimPemString(
    sealedSecretsKeys.sealed_secrets_public_key,
  ).replaceAll("\n", "_");

  const SEALED_SECRETS_PRIVATE_KEY_MATERIAL = trimPemString(
    sealedSecretsKeys.sealed_secrets_private_key,
  ).replaceAll("\n", "_");

  const coreEnvObject: EnvObject = {
    SEALED_SECRETS_PUBLIC_KEY_MATERIAL: {
      comment: "Sealed Secrets keys for Kubeseal",
      value: SEALED_SECRETS_PUBLIC_KEY_MATERIAL,
    },
    SEALED_SECRETS_PRIVATE_KEY_MATERIAL: {
      value: SEALED_SECRETS_PRIVATE_KEY_MATERIAL,
    },
    ARGO_UI_READONLY_PASSWORD: {
      comment: "ArgoUI",
      value: ARGO_UI_READONLY_PASSWORD,
    },
    TERRAFORM_STATE_PASSPHRASE: {
      comment: "Passphrase for encrypting/decrypting terraform state",
      value: TERRAFORM_STATE_PASSPHRASE,
    },
  };

  const kind = context.template.split("/")[0];

  coreEnvObject.GIT_USERNAME = {
    comment: "git credentials",
    value: context.interactive
      ? ((await Input.prompt({
        message: cyan("Enter your GitHub username:"),
        default: GIT_USERNAME,
      })) as string)
      : GIT_USERNAME,
  };

  coreEnvObject.GIT_PASSWORD = {
    value: context.interactive
      ? ((await Secret.prompt({
        message: cyan("Enter your GitHub Personal Access Token:"),
        default: GIT_PASSWORD,
      })) as string)
      : GIT_PASSWORD,
  };

  coreEnvObject.GIT_REPO = {
    value: context.interactive
      ? await Input.prompt({
        message: cyan("Enter your GitHub repository URL:"),
        default: GIT_REPO,
      })
      : GIT_REPO,
  };

  switch (kind) {
    case "aws":
      return { ...coreEnvObject, ...(await prepareAWSEnv(context)) };
    case "gcp":
      return { ...coreEnvObject, ...(await prepareGCPEnv(context)) };
    default:
      console.log(brightRed(`kind "${kind}" is not yet supported`));
      Deno.exit(1);
  }
};

const getEnvObject = async (context: GetEnvObjectArgs): Promise<EnvObject> => {
  const coreEnvObject = await getCoreEnvObject(context);

  if (!context?.template) {
    return coreEnvObject;
  }

  const baseTemplate = context.template.split("/")[1]; // eg. "airflow-tls"

  switch (baseTemplate) {
    case "airflow-tls":
      return {
        ...coreEnvObject,
        ...(await getAirflowTlsTemplateEnvObject(context)),
      };
    case "basic":
      return coreEnvObject;
    default:
      return coreEnvObject;
  }
};

/**
 * COMMAND fn: cndi init
 * Initializes ./cndi directory with the specified config file
 * and initializes workflows in .github
 */
export default async function init(c: CNDIContext) {
  const initializing = true;
  const CNDI_CONFIG_FILENAME = "cndi-config.jsonc";

  let template = c.template;

  // if 'template' and 'interactive' are both falsy we want to look for config at 'pathToConfig'
  if (!template && !c.interactive) {
    try {
      console.log(`cndi init --file "${c.pathToConfig}"\n`);
      Deno.readFileSync(c.pathToConfig);
    } catch {
      // if config is not found at 'pathToConfig' we want to throw an error
      console.log(
        initLabel,
        brightRed(
          `cndi-config file not found at ${white(`"${c.pathToConfig}"`)}\n`,
        ),
      );
      console.log(
        `if you don't have a cndi-config file try ${
          cyan(
            "cndi init --interactive",
          )
        }\n`,
      );
      Deno.exit(1);
    }
  } else if (c.interactive) {
    if (!template) {
      console.log("cndi init --interactive\n");
    } else {
      console.log(`cndi init --interactive --template ${template}\n`);
    }
  } else {
    if (`${template}` === "true") {
      // if template flag is truthy but empty, throw error
      console.log(`cndi init --template\n`);
      console.error(
        initLabel,
        brightRed(`--template (-t) flag requires a value`),
      );
      Deno.exit(1);
    }
    console.log(`cndi init --template ${template}\n`);
  }

  const directoryContainsCNDIFiles = await checkInitialized(c);

  const shouldContinue = directoryContainsCNDIFiles
    ? confirm(
      "It looks like you have already initialized a cndi project in this directory. Overwrite existing artifacts?",
    )
    : true;

  if (!shouldContinue) {
    Deno.exit(0);
  }

  const templateUnavailable = template &&
    !availableTemplates.includes(template);

  if (templateUnavailable) {
    console.log(
      initLabel,
      brightRed(`The template you selected "${template}" is not available.\n`),
    );

    console.log("Available templates are:\n");
    console.log(`${availableTemplates.map((t) => cyan(t)).join(", ")}\n`);
    Deno.exit(1);
  }

  // GENERATE ENV VARS
  const sealedSecretsKeys = await createSealedSecretsKeys(c);
  const terraformStatePassphrase = createTerraformStatePassphrase();
  const argoUIReadOnlyPassword = createArgoUIReadOnlyPassword();

  // we need to keep these generated values in memory for automatically calling overwrite-with immediately after init
  const context = {
    ...c,
    sealedSecretsKeys,
    terraformStatePassphrase,
    argoUIReadOnlyPassword,
  };

  const {
    noGitHub,
    CNDI_SRC,
    githubDirectory,
    interactive,
    projectDirectory,
    gitignorePath,
    dotEnvPath,
  } = context;

  if (interactive && !template) {
    template = await Select.prompt({
      message: cyan("Pick a template"),
      options: availableTemplates,
    });
  }

  await Deno.writeTextFile(gitignorePath, getGitignoreContents());

  const envObject = await getEnvObject({
    ...context,
    template,
    sealedSecretsKeys,
    terraformStatePassphrase,
    argoUIReadOnlyPassword,
  });

  await writeEnvObject(dotEnvPath, envObject);

  if (!noGitHub) {
    try {
      // overwrite the github workflows and readme, do not clobber other files
      await copy(path.join(CNDI_SRC, "github"), githubDirectory, {
        overwrite: true,
      });
    } catch (githubCopyError) {
      console.log(
        initLabel,
        brightRed("failed to copy github integration files"),
      );
      console.error(githubCopyError);
      Deno.exit(1);
    }
  }

  await Deno.writeTextFile(
    path.join(projectDirectory, "README.md"),
    getREADME((template as Template) || null),
  );

  // if the user has specified a template, use that
  if (template) {
    const configOutputPath = path.join(projectDirectory, CNDI_CONFIG_FILENAME);

    const templateString = await getTemplateString({ ...context, template });

    if (!templateString) {
      console.error(
        initLabel,
        brightRed(`Template "${white(template)}" not yet implemented.`),
      );
      Deno.exit(1);
    }

    await Deno.writeTextFile(configOutputPath, templateString);

    // because there is no "pathToConfig" when using a template, we need to set it here
    overwriteWithFn(
      { ...context, pathToConfig: configOutputPath },
      initializing,
    );
    return;
  }

  overwriteWithFn(context, initializing);
}
