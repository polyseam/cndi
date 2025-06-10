import type { SherrorConfig, SherrorError } from "@polyseam/sherror";

const getPostBody = (code: number, desc: string, resolution: string) => {
  return `### description

The \`cndi\` CLI exits with error code \`${code}\` when ${desc}

### resolution tips

${resolution}`;
};

const getTitle = (code: number, desc: string) => {
  return "`cndi` E" + code + " - " + desc;
};

export const config: SherrorConfig = {
  category_name: "cndi",
  errors: [
    // 1-99: System and General Errors
    {
      error_code: 1,
      app_message:
        "Undefined Exception: this error has not yet been assigned a code and discussion",
      post_title: getTitle(1, "This error doesn't exist!"),
      post_body: getPostBody(
        1,
        "the CNDI team has not specifically implemented a designated error code.",
        "Please leave a comment if you hit this issue, and we will help track down the source for you!",
      ),
      _discussion_link: "https://github.com/orgs/polyseam/discussions/855",
    },
    {
      error_code: 10,
      app_message: '<🔴>Could not create staging directory</🔴> <🥶>"$1"</🥶>',
      post_title: getTitle(10, "Failed to create staging directory"),
      post_body: getPostBody(
        10,
        "the system was unable to create a staging directory for temporary files.",
        "This failure is likely permissions related. Please chime in with a comment if you've hit this error and are unable to resolve it, we're happy to help!",
      ),
      _discussion_link: "https://github.com/orgs/polyseam/discussions/291",
    },

    // 100-199: Git and Credential Errors
    {
      error_code: 100,
      app_message:
        "'GIT_USERNAME' and 'GIT_PRIVATE_SSH_KEY' env var are not set for terraform",
      post_title: "Error 100: Missing Git credentials for Terraform",
      post_body:
        "Terraform requires Git credentials for repository access. Please set both GIT_USERNAME and GIT_PRIVATE_SSH_KEY environment variables.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/457",
    },
    {
      error_code: 101,
      app_message:
        "'GIT_TOKEN' and 'GIT_PRIVATE_SSH_KEY' env var are not set for terraform",
      post_title: "Error 101: Missing Git authentication method",
      post_body:
        "Terraform requires either a Git token or SSH key for authentication. Please set either GIT_TOKEN or GIT_PRIVATE_SSH_KEY environment variable.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/458",
    },
    {
      error_code: 102,
      app_message: "'GIT_REPO' env var is not set for terraform",
      post_title: "Error 102: Missing Git repository URL",
      post_body:
        "The GIT_REPO environment variable is required for Terraform operations but was not set.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/459",
    },
    {
      error_code: 103,
      app_message: "'ARGOCD_ADMIN_PASSWORD' env var is not set for terraform",
      post_title: "Error 103: Missing ArgoCD admin password",
      post_body:
        "The ARGOCD_ADMIN_PASSWORD environment variable is required for ArgoCD setup but was not set.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/460",
    },
    {
      error_code: 104,
      app_message:
        "'SEALED_SECRETS_PRIVATE_KEY' env var is not set for terraform",
      post_title: "Error 104: Missing Sealed Secrets private key",
      post_body:
        "The SEALED_SECRETS_PRIVATE_KEY environment variable is required for managing sealed secrets but was not set.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/462",
    },
    {
      error_code: 105,
      app_message:
        "'SEALED_SECRETS_PUBLIC_KEY' env var is not set for terraform",
      post_title: "Error 105: Missing Sealed Secrets public key",
      post_body:
        "The SEALED_SECRETS_PUBLIC_KEY environment variable is required for managing sealed secrets but was not set.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/461",
    },

    // 200-299: Configuration Errors
    {
      error_code: 200,
      app_message:
        "cndi_config.infrastructure.cndi.nodes does not contain exactly one node with role 'leader'",
      post_title: "Error 200: Invalid leader node configuration",
      post_body:
        "The configuration must contain exactly one node with the 'leader' role.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/463",
    },
    {
      error_code: 202,
      app_message: "'globalThis.stagingDirectory' is not set",
      post_title: "Error 202: Staging directory not configured",
      post_body:
        "The staging directory path is not configured in the global context.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/474",
    },
    {
      error_code: 203,
      app_message:
        "cndi_config.infrastructure.terraform contains unknown terraform block",
      post_title: "Error 203: Unknown Terraform block in configuration",
      post_body:
        "The Terraform configuration contains an unrecognized block type.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/506",
    },

    // 300-399: Dependency and Installation Errors
    {
      error_code: 300,
      app_message: "Failed to install cndi dependency 'terraform'",
      post_title: "Error 300: Terraform installation failed",
      post_body:
        "The system encountered an error while trying to install the Terraform dependency.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/476",
    },
    {
      error_code: 301,
      app_message: "Failed to install cndi dependency 'kubeseal'",
      post_title: "Error 301: Kubeseal installation failed",
      post_body:
        "The system encountered an error while trying to install the kubeseal dependency.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/475",
    },
    {
      error_code: 302,
      app_message: "Failed to delete past version of cndi binary",
      post_title: "Error 302: Failed to clean up old binary",
      post_body:
        "The system was unable to remove a previous version of the cndi binary during update.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/507",
    },

    // 400-499: Initialization Errors
    {
      error_code: 400,
      app_message:
        "cndi init --template was called without a template identifier",
      post_title: "Error 400: Missing template identifier",
      post_body:
        "The --template flag was used without providing a template name or identifier.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/505",
    },
    {
      error_code: 401,
      app_message:
        "failed to load custom `cndi_responses.yaml` during 'cndi init'",
      post_title: "Error 401: Failed to load responses file",
      post_body:
        "The system could not load the cndi_responses.yaml file during initialization.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/889",
    },
    {
      error_code: 402,
      app_message: "failed to parse `./cndi_responses.yaml` during 'cndi init'",
      post_title: "Error 402: Invalid responses file format",
      post_body:
        "The cndi_responses.yaml file contains invalid YAML or an unsupported structure.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/890",
    },
    {
      error_code: 403,
      app_message:
        "'cndi init' failed because it did not receive a 'deployment_target_provider'",
      post_title: "Error 403: Missing deployment target provider",
      post_body:
        "The initialization process requires a deployment target provider to be specified.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/891",
    },
    {
      error_code: 404,
      app_message:
        "'cndi init' failed because it received an invalid '--deployment-target-label' slug as <provider>/<distribution>",
      post_title: "Error 404: Invalid deployment target format",
      post_body:
        "The deployment target label must be in the format <provider>/<distribution> (e.g., aws/eks).",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/892",
    },
    {
      error_code: 405,
      app_message:
        "'cndi init' failed because it was in 'git_credentials_mode=ssh' but it received a 'git_repo' https URL",
      post_title: "Error 405: Git URL/credentials mismatch",
      post_body:
        "SSH credentials were provided but an HTTPS Git URL was used, or vice versa.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/893",
    },
    {
      error_code: 406,
      app_message:
        "'cndi init' failed because the '--create' flag was supplied, but the 'git_credentials_mode' was not 'token'",
      post_title:
        "Error 406: Invalid git_credentials_mode for repository creation",
      post_body:
        "Repository creation requires token-based authentication. Please set git_credentials_mode to 'token' when using --create.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/894",
    },
    {
      error_code: 407,
      app_message:
        "failed to run `cndi init` because the user has not provided the necessary 'git_username' and 'git_repo' responses in '--create' mode",
      post_title: "Error 407: Missing required Git information",
      post_body:
        "Repository creation requires both git_username and git_repo to be specified when using --create mode.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/895",
    },

    // 500-599: Configuration and Overwrite Errors
    {
      error_code: 500,
      app_message: "cndi_config.yaml not found",
      post_title: "Error 500: Configuration file missing",
      post_body:
        "The cndi_config.yaml file was not found in the current directory.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/508",
    },
    {
      error_code: 501,
      app_message:
        "'SEALED_SECRETS_PUBLIC_KEY' and/or 'SEALED_SECRETS_PRIVATE_KEY' env vars not set during 'cndi overwrite'",
      post_title: "Error 501: Missing Sealed Secrets keys for overwrite",
      post_body:
        "The Sealed Secrets keys are required for the overwrite operation but were not provided.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/510",
    },
    {
      error_code: 502,
      app_message:
        "'ARGOCD_ADMIN_PASSWORD' env var is not set during 'cndi overwrite'",
      post_title: "Error 502: Missing ArgoCD password for overwrite",
      post_body:
        "The ArgoCD admin password is required for the overwrite operation but was not provided.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/511",
    },
    {
      error_code: 503,
      app_message:
        "'TERRAFORM_STATE_PASSPHRASE' env var is not set during 'cndi overwrite'",
      post_title: "Error 503: Missing Terraform state passphrase",
      post_body:
        "The Terraform state passphrase is required for the overwrite operation but was not provided.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/512",
    },
    {
      error_code: 504,
      app_message: "cndi_config failed to parse during 'cndi overwrite'",
      post_title: "Error 504: Configuration parse error",
      post_body:
        "The cndi_config.yaml file could not be parsed during the overwrite operation.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/513",
    },
    {
      error_code: 509,
      app_message: "Failed to persist staged files during 'cndi overwrite'",
      post_title: "Error 509: File persistence error",
      post_body:
        "The system encountered an error while trying to save the staged files during the overwrite operation.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/514",
    },

    // 600-699: Environment and Initialization Issues
    {
      error_code: 603,
      app_message:
        "'ARGOCD_ADMIN_PASSWORD' missing while building .env file during 'cndi init'",
      post_title: "Error 603: Missing ArgoCD password for .env",
      post_body:
        "The ArgoCD admin password is required for generating the .env file but was not provided.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/534",
    },
    {
      error_code: 604,
      app_message:
        "'SEALED_SECRETS_PUBLIC_KEY' and/or 'SEALED_SECRETS_PRIVATE_KEY' missing while building .env file during 'cndi init'",
      post_title: "Error 604: Missing Sealed Secrets keys for .env",
      post_body:
        "The Sealed Secrets keys are required for generating the .env file but were not provided.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/535",
    },
    {
      error_code: 605,
      app_message:
        "'TERRAFORM_STATE_PASSPHRASE' missing while building .env file during 'cndi init'",
      post_title: "Error 605: Missing Terraform state passphrase for .env",
      post_body:
        "The Terraform state passphrase is required for generating the .env file but was not provided.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/536",
    },
    {
      error_code: 606,
      app_message: "failed to generate .env invalid node 'kind'",
      post_title: "Error 606: Invalid node kind in configuration",
      post_body:
        "The configuration contains a node with an invalid or unsupported 'kind' value.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/538",
    },
    {
      error_code: 607,
      app_message:
        "failed to generate .env because there was no GCP key JSON found at the path specified during 'cndi init'",
      post_title: "Error 607: GCP key file not found",
      post_body:
        "The specified GCP service account key file could not be found at the provided path.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/541",
    },
    {
      error_code: 608,
      app_message:
        "failed to generate .env because the GCP key JSON found at the path specified failed to parse during 'cndi init'",
      post_title: "Error 608: Invalid GCP key format",
      post_body:
        "The GCP service account key file exists but contains invalid JSON or is malformed.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/544",
    },
    {
      error_code: 609,
      app_message:
        "failed to generate .env because the GCP key JSON found at the path specified failed to parse during 'cndi overwrite'",
      post_title: "Error 609: GCP key parse error during overwrite",
      post_body:
        "The GCP service account key file exists but could not be parsed during the overwrite operation.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/706",
    },

    // 700-799: Kubernetes Secrets and Security
    {
      error_code: 700,
      app_message:
        "Kubernetes Secret manifest 'data' was specified as a literal, Secrets must be sealed",
      post_title: "Error 700: Unsealed secret data",
      post_body:
        "Kubernetes Secret 'data' field contains unsealed values. All secrets must be sealed using kubeseal before being committed to version control.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/546",
    },
    {
      error_code: 701,
      app_message:
        "Kubernetes Secret manifest 'stringData' was specified as a literal, Secrets must be sealed",
      post_title: "Error 701: Unsealed string data in secret",
      post_body:
        "Kubernetes Secret 'stringData' field contains unsealed values. All secrets must be sealed using kubeseal before being committed to version control.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/548",
    },
    {
      error_code: 702,
      app_message:
        "Kubernetes Secret manifest has no 'data' or 'stringData', one of these must be specified",
      post_title: "Error 702: Empty secret manifest",
      post_body:
        "The Kubernetes Secret manifest is missing both 'data' and 'stringData' fields. At least one must be specified.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/549",
    },
    {
      error_code: 703,
      app_message: "Failed to Seal Secret using the kubeseal CLI",
      post_title: "Error 703: Secret sealing failed",
      post_body:
        "An error occurred while attempting to seal a Kubernetes secret using the kubeseal CLI.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/1010",
    },
    {
      error_code: 704,
      app_message: "Failed to make temporary file for unsealed secret",
      post_title: "Error 704: Temporary file creation failed",
      post_body:
        "The system was unable to create a temporary file needed for processing an unsealed secret.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/",
    },

    // 800-899: Terraform and Infrastructure Errors
    {
      error_code: 800,
      app_message: "Failed to initialize Terraform",
      post_title: "Error 800: Terraform initialization failed",
      post_body:
        "An error occurred while initializing Terraform. This could be due to network issues, invalid configuration, or missing dependencies.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/",
    },
    {
      error_code: 801,
      app_message: "Failed to apply Terraform configuration",
      post_title: "Error 801: Terraform apply failed",
      post_body:
        "An error occurred while applying the Terraform configuration. Check the Terraform logs for more details.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/",
    },
    {
      error_code: 802,
      app_message: "Failed to destroy Terraform resources",
      post_title: "Error 802: Terraform destroy failed",
      post_body:
        "An error occurred while destroying Terraform resources. Some resources may still exist in the cloud provider.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/",
    },
    {
      error_code: 803,
      app_message: "Terraform state is locked",
      post_title: "Error 803: Terraform state locked",
      post_body:
        "The Terraform state is currently locked by another process. Please wait and try again, or manually unlock the state if needed.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/",
    },
    {
      error_code: 804,
      app_message: "Terraform state is out of sync with infrastructure",
      post_title: "Error 804: State out of sync",
      post_body:
        "The Terraform state does not match the actual infrastructure. This can happen if changes were made outside of Terraform.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/",
    },
    {
      error_code: 805,
      app_message: "Failed to refresh Terraform state",
      post_title: "Error 805: State refresh failed",
      post_body:
        "Failed to refresh the Terraform state. This could be due to network issues or problems with the cloud provider.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/",
    },
    {
      error_code: 806,
      app_message: "Terraform backend configuration is invalid",
      post_title: "Error 806: Invalid backend configuration",
      post_body:
        "The Terraform backend configuration is missing required fields or contains invalid values.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/",
    },
    {
      error_code: 807,
      app_message: "Terraform provider configuration is invalid",
      post_title: "Error 807: Invalid provider configuration",
      post_body:
        "The Terraform provider configuration is missing required fields or contains invalid values.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/",
    },
    {
      error_code: 808,
      app_message: "Terraform module not found",
      post_title: "Error 808: Module not found",
      post_body:
        "The specified Terraform module could not be found. Check the module source path and try again.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/",
    },
    {
      error_code: 809,
      app_message:
        "failed to stage all gke terraform objects during 'cndi overwrite'",
      post_title: "Error 809: GKE Terraform staging failed",
      post_body:
        "Failed to stage all GKE Terraform objects during the overwrite operation. Check the logs for more details.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/564",
    },

    // 900-999: Validation and Schema Errors
    {
      error_code: 900,
      app_message: "Invalid configuration schema",
      post_title: "Error 900: Configuration validation failed",
      post_body:
        "The configuration file does not match the expected schema. Please check the documentation for the correct format.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/",
    },
    {
      error_code: 901,
      app_message: "Required field is missing",
      post_title: "Error 901: Missing required field",
      post_body:
        "A required field is missing from the configuration. Please check the documentation for required fields.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/",
    },
    {
      error_code: 902,
      app_message: "Invalid field value",
      post_title: "Error 902: Invalid field value",
      post_body:
        "A field contains an invalid value. Please check the documentation for allowed values.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/",
    },
    {
      error_code: 903,
      app_message: "Invalid field type",
      post_title: "Error 903: Invalid field type",
      post_body:
        "A field has an invalid type. Please check the documentation for the expected type.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/",
    },
    {
      error_code: 904,
      app_message: "Duplicate field found",
      post_title: "Error 904: Duplicate field",
      post_body:
        "A duplicate field was found in the configuration. Each field should be unique.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/",
    },
    {
      error_code: 905,
      app_message: "Invalid reference",
      post_title: "Error 905: Invalid reference",
      post_body:
        "A reference to another resource or value is invalid. Please check that the reference exists and is of the correct type.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/",
    },
    {
      error_code: 906,
      app_message: "Circular dependency detected",
      post_title: "Error 906: Circular dependency",
      post_body:
        "A circular dependency was detected in the configuration. Please check your resource dependencies.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/",
    },
    {
      error_code: 907,
      app_message: "Invalid version constraint",
      post_title: "Error 907: Invalid version constraint",
      post_body:
        "A version constraint in the configuration is invalid. Please check the format and try again.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/",
    },
    {
      error_code: 908,
      app_message: "Unsupported feature",
      post_title: "Error 908: Unsupported feature",
      post_body:
        "A feature used in the configuration is not supported in this version. Please check the documentation for supported features.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/",
    },
    {
      error_code: 909,
      app_message: "Invalid configuration value",
      post_title: "Error 909: Invalid configuration value",
      post_body:
        "A configuration value is invalid. Please check the documentation for allowed values.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/",
    },
    {
      error_code: 910,
      app_message: "Configuration file not found",
      post_title: "Error 910: Configuration file missing",
      post_body:
        "The specified configuration file could not be found. Please check the file path and try again.",
      _discussion_link: "https://github.com/orgs/polyseam/discussions/",
    },
  ],
  printer: (error: SherrorError, codepath?: string) => {
    console.error(
      `\n🔴 CNDI Error ${error.error_code}: ${error.app_message}\n` +
        `📝 Discussion: ${
          error._discussion_link || "No discussion link available"
        }\n` +
        (codepath ? `📍 Location: ${codepath}\n` : ""),
    );
  },
} satisfies SherrorConfig;
