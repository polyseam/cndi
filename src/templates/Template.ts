import { EnvObject, NodeKind } from "../types.ts";

export type GetTemplateFn = (
  kind: NodeKind,
  input: Record<string, unknown>
) => string;

export type GetConfigurationFn = (
  interactive: boolean
) => Promise<Record<string, unknown>>;

export interface TemplateOptions {
  getConfiguration: (interactive: boolean) => Promise<Record<string, unknown>>;
  getEnv: (interactive: boolean) => Promise<EnvObject>;
  getTemplate: (kind: NodeKind, input: Record<string, unknown>) => string;
}

export class Template {
  name: string;
  options: TemplateOptions;
  env: EnvObject = {};
  configuration = {};

  constructor(name: string, options: TemplateOptions) {
    this.name = name;
    this.options = options;
  }

  async getConfiguration(interactive: boolean) {
    this.configuration = await this.options.getConfiguration(interactive);
    return await this.configuration;
  }

  async getEnv(interactive: boolean) {
    this.env = await this.options.getEnv(interactive);
    return await this.env;
  }

  getTemplate(kind: NodeKind, configuration: Record<string, unknown>) {
    return this.options.getTemplate(kind, configuration);
  }
}
