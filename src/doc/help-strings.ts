type HelpStrings = {
  default: string;
  init: string;
  install: string;
  overwrite: string;
  terraform: string;
  ow: string;
  run: string;
  help: string;
};

const owHelpString = `
NAME
        cndi-overwrite - reads a config file at the path supplied and uses it to overwrite the cndi project files in the ./cndi folder in your current working directory.
SYNOPSIS
        cndi overwrite [-f <config-file>] [-o <directory>]
        cndi ow [-f <config-file>] [-o <directory>]

DESCRIPTION
        Reads a config file and transforms that into a directory structure in the target directory that can later be deployed with "cndi run"
OPTIONS
        -f, --file
            The file to read the config from. Defaults to "./cndi-config.jsonc" in the current directory. You can use this to specify properties of the CNDI cluster we will deploy updates to on your behalf.

        -o --output <directory>
            The directory in which to replace the manifests and resources needed to deploy the cndi project. Defaults to the current directory.
`.trim();

const helpStrings: HelpStrings = {
  default: `
usage: cndi [--version] [--help] [-f | --file] 
<command> [<args>]

These are common CNDI commands used in various situations:

start a working area
    init              create a cndi project

modify the cndi project
    overwrite    overwrites the state of the cndi project using a cndi-config.json file

deploy the cndi project
    run               deploys the cndi project based on the configuration in ./cndi

install the required files to run the cndi CLI
    install

See 'cndi --help <command>' or 'cndi --help <concept>' to read about a specific subcommand or concept.
`.trim(),
  init: `
NAME
        cndi-init - initialize a cndi project into the target directory

SYNOPSIS
        cndi init [-f <config-file>] [-o <directory>] [-t <template>] [-i <interactive>]
DESCRIPTION
        Reads a config file at the path supplied and transforms that into a directory structure in the target directory that can later be deployed with "cndi run". 
        Also sets up some GitHub Actions and README.md files to assist you with next steps.
OPTIONS
        -f, --file
            The file to read the config from. Defaults to "./cndi-config.jsonc" in the current directory. You can use this to specify properties of the CNDI cluster we deploy on your behalf.
        
        -t, --template
            The template to use for the cndi project 
 
        -o --output <directory>
            The directory in which to create the manifests and resources needed to deploy the cndi project. Defaults to the current directory.
 
`.trim(),
  overwrite: owHelpString,
  ow: owHelpString,
  run: `
NAME
        cndi-run - reads all manifests and other resources in the target directory and deploys them to deploy the project as a CNDI cluster
SYNOPSIS
        cndi run
DESCRIPTION
        Reads files in the user's cndi directory and deploys as a cndi cluster
  `.trim(),
  install: `
NAME
        cndi-install - installs all critical source files needed to run the cndi CLI to the CNDI_HOME directory
SYNOPSIS
        cndi install
DESCRIPTION
        Fetches and unpacks files required for using cndi and installs them to the CNDI_HOME directory. 
        
        Must be run once before using cndi!
  `.trim(),
  terraform: `
NAME
        cndi-terrafrom - wraps the terraform cli so that it can be used within a cndi context
SYNOPSIS
        cndi terraform <command>
DESCRIPTION
        Runs the terraform CLI with the proper cndi environment variables set.
  `.trim(),
  help: `oops! "help" is not a command, you probably meant "--help"`,
};

export { helpStrings };
