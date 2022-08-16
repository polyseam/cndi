
type HelpStrings = {
    default: string;
    init: string;
    "overwrite-with": string;
    run: string;
    help: string;
}

const helpStrings: HelpStrings = {
  default: `
usage: cndi [--version] [--help] [-f | --file] 
<command> [<args>]

These are common CNDI commands used in various situations:

start a working area (see also: cndi help tutorial)
    init              Create a cndi project

modify the cndi project
    overwrite-with    overwrites the state of the cndi project using a cndi-config.json file

deploy the cndi project
    run               deploys the cndi project based on the configuration in ./cndi

See 'cndi help <command>' or 'cndi help <concept>'
to read about a specific subcommand or concept.
See 'cndi help cndi' for an overview of the system.
`.trim(),
  init: `
NAME
        cndi-init - initialize a cndi project into the target directory

SYNOPSIS
        cndi init [-f <config-file>] [<directory>]
DESCRIPTION
        Reads a config file at the path supplied and transforms that into a directory structure in the target directory that can later be deployed with "cndi run". 
        Also sets up some GitHub Actions and README.md files to assist you with next steps.
OPTIONS
        -f, --file
            The file to read the config from. Defaults to "./cndi-config.json" in the current directory. You can use this to specify properties of the CNDI cluster we deploy on your behalf.
            To generate a config file with our interactive tool, visit https://configurator.cndi.run
 
        <directory>
            The directory in which to create the manifests and resources needed to deploy the cndi project. Defaults to the current directory.
 
`.trim(),
  "overwrite-with": `
NAME
        cndi-overwrite-with - reads a config file at the path supplied and uses it to overwrite the cndi project files in the ./cndi folder in your current directory.
SYNOPSIS
        cndi overwrite-with [-f <config-file>] [<directory>]
DESCRIPTION
        Reads a config file and transforms that into a directory structure in the target directory that can later be deployed with "cndi run"
OPTIONS
        -f, --file
            The file to read the config from. Defaults to "./cndi-config.json" in the current directory. You can use this to specify properties of the CNDI cluster we will deploy updates to on your behalf.
      
            To generate a config file with our interactive tool, visit https://configurator.cndi.run

        <directory>
            The directory in which to replace the manifests and other resources needed to deploy the cndi project. Defaults to the "./cndi" folder in the current directory.
`.trim(),
  run: `
NAME
        cndi-run - reads all manifests and other resources in the target directory and deploys them to deploy the project as a CNDI cluster
SYNOPSIS
        cndi run [<directory>]
DESCRIPTION
        The directory where the resources and manifests needed to deploy the cndi project are located.
OPTIONS
  <directory>
      The directory in which to find the manifests and other resources needed to deploy the cndi project. Defaults to the "./cndi" folder in the current directory.
  `.trim(),
  help:`oops! "help" is not a command, you probably meant "--help"`
};

export { helpStrings };
