import { CNDIConfig, EnvObject, NodeKind } from "../types.ts";
import { getPrettyJSONString } from "../utils.ts";
import coreReadmeBlock from "../doc/core.ts";

export type GetTemplateFn = (
  kind: NodeKind,
  input: Record<string, unknown>,
) => CNDIConfig;

export type GetConfigurationFn = (
  interactive: boolean,
) => Promise<Record<string, unknown>>;

export interface TemplateOptions {
  getConfiguration: (interactive: boolean) => Promise<Record<string, unknown>>;
  getEnv: (interactive: boolean) => Promise<EnvObject>;
  getTemplate: (kind: NodeKind, input: Record<string, unknown>) => CNDIConfig;
  readmeBlock: string;
}


export class Template {
  name: string;
  options: TemplateOptions;
  env: EnvObject = {};
  configuration = {};
  readmeCore = coreReadmeBlock;
  readmeBlock: string;

  constructor(name: string, options: TemplateOptions) {
    this.name = name;
    this.options = options;
    this.readmeBlock = options.readmeBlock;
  }

  async getConfiguration(interactive: boolean) {
    this.configuration = await this.options.getConfiguration(interactive);
    return await this.configuration;
  }

  async getEnv(interactive: boolean) {
    this.env = await this.options.getEnv(interactive);
    return await this.env;
  }

  getTemplate(
    kind: NodeKind,
    configuration: Record<string, unknown>,
    project_name: string,
  ) {
    const template = this.options.getTemplate(kind, configuration);
    const cndi_version = "v1";

    return getPrettyJSONString({
      project_name,
      cndi_version,
      ...template,
    });
  }
}
