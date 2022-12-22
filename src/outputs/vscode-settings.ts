const settings = {
  "files.associations": {
    "*.sh.tftpl": "shellscript",
  },
  "json.schemas": [
    {
      fileMatch: ["*cndi-config.json*"],
      url:
        "https://github.com/polyseam/cndi/blob/main/src/schemas/cndi-config.schema.json",
    },
  ],
};
export default settings;
