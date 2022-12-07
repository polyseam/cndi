import {
  CNDIConfig,
  CNDIContext,
  EnvObject,
  NodeKind,
  SealedSecretsKeys,
} from "../types.ts";

import { copy } from "https://deno.land/std@0.157.0/fs/copy.ts";

import { loadJSONC, trimPemString } from "../utils.ts";

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

import availableTemplates from "../templates/available-templates.ts";

import { checkInitialized } from "../utils.ts";

import writeEnvObject from "../outputs/env.ts";
import getGitignoreContents from "../outputs/gitignore.ts";
import coreReadme from '../doc/core.ts'

import { Template } from "../templates/Template.ts";

const initLabel = white("init:");

const getTemplateString = async (
  tpl: Template,
  kind: NodeKind,
  interactive: boolean
): Promise<string | null> => {
  const config = await tpl.getConfiguration(interactive);
  return tpl.getTemplate(kind, config);
};

const prepareAWSEnv = async (interactive: boolean): Promise<EnvObject> => {
  const AWS_REGION = "us-east-1";
  const AWS_ACCESS_KEY_ID = "";
  const AWS_SECRET_ACCESS_KEY = "";
  const awsEnvObject: EnvObject = {};

  awsEnvObject.AWS_REGION = {
    comment: "AWS",
    value: interactive
      ? ((await Input.prompt({
          message: cyan("Enter your AWS region:"),
          default: AWS_REGION,
        })) as string)
      : AWS_REGION,
  };

  awsEnvObject.AWS_ACCESS_KEY_ID = {
    value: interactive
      ? ((await Secret.prompt({
          message: cyan("Enter your AWS access key ID:"),
          default: AWS_ACCESS_KEY_ID,
        })) as string)
      : AWS_ACCESS_KEY_ID,
  };

  awsEnvObject.AWS_SECRET_ACCESS_KEY = {
    value: interactive
      ? ((await Secret.prompt({
          message: cyan("Enter your AWS secret access key:"),
          default: AWS_SECRET_ACCESS_KEY,
        })) as string)
      : AWS_SECRET_ACCESS_KEY,
  };
  return awsEnvObject;
};

const prepareGCPEnv = async (interactive: boolean): Promise<EnvObject> => {
  const GCP_REGION = "us-central1";
  const GCP_PATH_TO_SERVICE_ACCOUNT_KEY = "";

  const gcpEnvObject: EnvObject = {};

  gcpEnvObject.GCP_REGION = {
    comment: "GCP",
    value: interactive
      ? ((await Input.prompt({
          message: cyan("Enter your GCP Region:"),
          default: GCP_REGION,
        })) as string)
      : GCP_REGION,
  };

  gcpEnvObject.GCP_PATH_TO_SERVICE_ACCOUNT_KEY = {
    value: interactive
      ? ((await Input.prompt({
          message: cyan("Enter the path to your GCP service account key json:"),
          default: GCP_PATH_TO_SERVICE_ACCOUNT_KEY,
        })) as string)
      : GCP_PATH_TO_SERVICE_ACCOUNT_KEY,
  };

  return gcpEnvObject;
};

interface CNDIContextWithGeneratedValues extends CNDIContext {
  sealedSecretsKeys: SealedSecretsKeys;
  terraformStatePassphrase: string;
  argoUIReadOnlyPassword: string;
}

const getCoreEnvObject = async (
  context: CNDIContextWithGeneratedValues,
  kind: NodeKind
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
      brightRed(`"sealedSecretsKeys" is not defined in context`)
    );
    Deno.exit(1);
  }

  if (!TERRAFORM_STATE_PASSPHRASE) {
    console.log(
      initLabel,
      brightRed(`"terraformStatePassphrase" is not defined in context`)
    );
    Deno.exit(1);
  }

  if (!ARGO_UI_READONLY_PASSWORD) {
    console.log(
      initLabel,
      brightRed(`"argoUIReadOnlyPassword" is not defined in context`)
    );
    Deno.exit(1);
  }

  const SEALED_SECRETS_PUBLIC_KEY_MATERIAL = trimPemString(
    sealedSecretsKeys.sealed_secrets_public_key
  ).replaceAll("\n", "_");

  const SEALED_SECRETS_PRIVATE_KEY_MATERIAL = trimPemString(
    sealedSecretsKeys.sealed_secrets_private_key
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
      return {
        ...coreEnvObject,
        ...(await prepareAWSEnv(context.interactive)),
      };
    case "gcp":
      return {
        ...coreEnvObject,
        ...(await prepareGCPEnv(context.interactive)),
      };
    default:
      console.log(brightRed(`kind "${kind}" is not yet supported`));
      Deno.exit(1);
  }
};

const getEnvObject = async (
  tpl: Template,
  context: CNDIContextWithGeneratedValues,
  kind: NodeKind
): Promise<EnvObject> => {
  const coreEnvObject = await getCoreEnvObject(context, kind);

  if (!context?.template) {
    return coreEnvObject;
  }

  return {
    ...coreEnvObject,
    ...(await tpl.getEnv(context.interactive)),
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

  // kind comes in from one of 2 places
  // 1. if the user chooses a template, we use the first part of the template name, eg. "aws" or "gcp"
  // 2. if the user brings their own config file, we read it from the first node entry in the config file
  let kind: NodeKind | undefined;

  let template = c.template;

  // if 'template' and 'interactive' are both falsy we want to look for config at 'pathToConfig'
  const useCNDIConfigFile = !c.interactive && !template;

  if (useCNDIConfigFile) {
    try {
      console.log(`cndi init --file "${c.pathToConfig}"\n`);
      const config = (await loadJSONC(c.pathToConfig)) as unknown as CNDIConfig;
      // 1. the user brought their own config file, we use the kind of the first node
      kind = config.nodes.entries[0].kind as NodeKind; // only works when all nodes are the same kind
    } catch (e) {
      if (e instanceof Deno.errors.NotFound) {
        // if config is not found at 'pathToConfig' we want to throw an error
        console.log(
          initLabel,
          brightRed(
            `cndi-config file not found at ${white(`"${c.pathToConfig}"`)}\n`
          )
        );
        console.log(
          `if you don't have a cndi-config file try ${cyan(
            "cndi init --interactive"
          )}\n`
        );
        Deno.exit(1);
      }
    }
  } else if (c.interactive) {
    if (template) {
      // 2a. the user used a template name, we pull the 'kind' out of it
      kind = template.split("/")[0] as NodeKind;
      console.log(`cndi init --interactive --template ${template}\n`);
    } else {
      // we don't know the kind so we need to get it when the user chooses a template (see 2c)
      console.log("cndi init --interactive\n");
    }
  } else {
    // if the user passes -t or --template with no value, we raise an error
    if (`${template}` === "true") {
      // if template flag is truthy but empty, throw error
      console.log(`cndi init --template\n`);
      console.error(
        initLabel,
        brightRed(`--template (-t) flag requires a value`)
      );
      Deno.exit(1);
    }
    console.log(`cndi init --template ${template}\n`);
    // 2b.the user has passed a template name, we pull the 'kind'out of it
    kind = template?.split("/")[0] as NodeKind;
  }

  const directoryContainsCNDIFiles = await checkInitialized(c);

  const shouldContinue = directoryContainsCNDIFiles
    ? confirm(
        "It looks like you have already initialized a cndi project in this directory. Overwrite existing artifacts?"
      )
    : true;

  if (!shouldContinue) {
    Deno.exit(0);
  }

  if (template) {
    const templateUnavailable = availableTemplates.includes(template);
    if (templateUnavailable) {
      console.log(
        initLabel,
        brightRed(`The template you selected "${template}" is not available.\n`)
      );

      console.log("Available templates are:\n");
      console.log(`${availableTemplates.map((t) => cyan(t)).join(", ")}\n`);
      Deno.exit(1);
    }
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

  const kinds = ["gcp", "aws"];

  const baseTemplate = template?.split("/")[1]; // eg. "airflow-tls"

  const t: Template = availableTemplates.find(
    (t) => t.name === baseTemplate
  ) as Template;

  const templateNamesList: string[] = [];

  availableTemplates.forEach((tpl) => {
    kinds.forEach((k) => {
      templateNamesList.push(`${k}/${tpl.name}`);
    });
  });

  if (interactive && !template) {
    template = await Select.prompt({
      message: cyan("Pick a template"),
      options: templateNamesList,
    });
    // 2c. the user finally selected a template, we pull the 'kind' out of it
    kind = template.split("/")[0] as NodeKind;
  }

  if (!kind) {
    console.log(initLabel, brightRed(`"kind" cannot be inferred`));
    Deno.exit(1);
  }

  await Deno.writeTextFile(gitignorePath, getGitignoreContents());

  const envObject = await getEnvObject(t,
    {
      ...context,
      template,
      sealedSecretsKeys,
      terraformStatePassphrase,
      argoUIReadOnlyPassword,
    },
    kind
  );

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
        brightRed("failed to copy github integration files")
      );
      console.error(githubCopyError);
      Deno.exit(1);
    }
  }

  // write a readme, extend via Template.readmeBlock if it exists
  await Deno.writeTextFile(
    path.join(projectDirectory, "README.md"),
    coreReadme + (t?.readmeBlock || '')
  );

  // if the user has specified a template, use that
  if (template) {
    const configOutputPath = path.join(projectDirectory, CNDI_CONFIG_FILENAME);
    const conf = await t.getConfiguration(context.interactive)
    const templateString = await t.getTemplate(kind, conf);

    if (!templateString) {
      console.error(
        initLabel,
        brightRed(`Template "${white(template)}" not yet implemented.`)
      );
      Deno.exit(1);
    }

    await Deno.writeTextFile(configOutputPath, templateString);

    // because there is no "pathToConfig" when using a template, we need to set it here
    overwriteWithFn(
      { ...context, pathToConfig: configOutputPath },
      initializing
    );
    return;
  }

  overwriteWithFn(context, initializing);
}
