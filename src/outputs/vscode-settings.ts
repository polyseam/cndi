const settings = {
  "files.associations": {
    "*.sh.tftpl": "shellscript",
  },
  "deno.enable": true,
  "deno.maxTsServerMemory": 8000,
  "editor.defaultFormatter": "denoland.vscode-deno",
  "deno.inlayHints.parameterNames.enabled": "none",
  "deno.inlayHints.parameterTypes.enabled": false,
  "deno.inlayHints.variableTypes.enabled": false,
  "deno.inlayHints.propertyDeclarationTypes.enabled": false,
  "deno.inlayHints.functionLikeReturnTypes.enabled": false,
  "deno.inlayHints.enumMemberValues.enabled": false,
  "yaml.schemas": {
    "https://raw.githubusercontent.com/polyseam/cndi/main/src/schemas/cndi_config.schema.json":
      ["cndi_config.yaml"],
  },
};
export default settings;
