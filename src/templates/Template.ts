import { CNDIConfig, EnvObject, NodeKind } from "../types.ts";
import { getPrettyJSONString } from "../utils.ts";

export type GetTemplateFn = (
  kind: NodeKind,
  input: Record<string, unknown>,
) => CNDIConfig;

export type GetConfigurationFn = (
  interactive: boolean,
) => Promise<Record<string, unknown>>;

export type GetReadmeStringArgs = {
  project_name: string;
  kind: NodeKind;
};

export type GetReadmeStringFn = ({
  project_name,
  kind,
}: GetReadmeStringArgs) => string;

export interface TemplateOptions {
  getConfiguration: (interactive: boolean) => Promise<Record<string, unknown>>;
  getEnv: (interactive: boolean) => Promise<EnvObject>;
  getTemplate: (kind: NodeKind, input: Record<string, unknown>) => CNDIConfig;
  getReadmeString: GetReadmeStringFn;
}

export class Template {
  name: string;
  options: TemplateOptions;
  env: EnvObject = {};
  configuration = {};

  constructor(name: string, options: TemplateOptions) {
    this.name = name;
    this.options = options;
    this.getReadmeString = options.getReadmeString;
  }

  async getConfiguration(interactive: boolean) {
    this.configuration = await this.options.getConfiguration(interactive);
    return await this.configuration;
  }

  async getEnv(interactive: boolean) {
    this.env = await this.options.getEnv(interactive);
    return await this.env;
  }

  getReadmeString({ project_name, kind }: GetReadmeStringArgs) {
    return this.options.getReadmeString({ project_name, kind });
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
