const settings = {
  "files.associations": {
    "*.sh.tftpl": "shellscript",
  },
  "json.schemas": [
    {
      fileMatch: ["*cndi-config.json*"],
      url:
        "https://raw.githubusercontent.com/polyseam/cndi/main/src/schemas/cndi-config.schema.json",
    },
  ],
};
export default settings;
