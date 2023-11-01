const settings = {
  "files.associations": {
    "*.sh.tftpl": "shellscript",
  },
  "json.schemas": [
    {
      fileMatch: ["*cndi_config.json*"],
      url:
        "https://raw.githubusercontent.com/polyseam/cndi/main/src/schemas/cndi_config.schema.json",
    },
  ],
  "yaml.schemas": {
    "https://raw.githubusercontent.com/polyseam/cndi/main/src/schemas/cndi_config.schema.json":
      ["cndi_config.yaml"],
  },
};
export default settings;
