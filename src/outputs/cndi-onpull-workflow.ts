import { YAML } from "deps";

const comment_tag = "checkov-failures-comment";

// The following Checkov checks are skipped
// If you would like to contribute fixes we'd welcome an Issue and a PR!

const skip_check = [
  "CKV_SECRET_6", // N/A: Severity "low", SealedSecrets is used to encrypt secrets so this is a non-issue
  "CKV_SECRET_3", // N/A: Severity "high", SealedSecrets is used to encrypt secrets so this is a non-issue
  "CKV_AWS_341", // N/A: Severity "medium" Launch Template should have a hop limit of 2 because the nodes are in EKS
  "CKV_AWS_184", // Severity "low", System Managed Keys and their automation are Better for CNDI's user profile
  "CKV_GCP_26", // Severity "info", GCP wants us to enable VPC logs but it's not necessary
  "CKV_GCP_65", // Severirty "low", GCP wants us to use gsuite groups but it's not necessary
  "CKV_GCP_66", // Severity "low", This requires all images be "signed". too much operational risk for first pass
  "CKV_GCP_13", // Severity "low", Requires pre-configured service account, too much user burden
  "CKV_GCP_69", // Severity "low", Requires Workload Identity, needs significant development effort
  "CKV_GCP_20", // Severity "low", Terraform cannot contact the GKE API server from GitHub Actions
  "CKV_GCP_25", // Severity "medium", GKE Failed to pull a remote image
  "CKV_AZURE_4", // Severity "info", Azure wants us to enable their monitoring, we use self-managed observability
  "CKV_AZURE_117", // Severity "low", Azure wants us to manage our own keys, too much user burden (Consider provisioning them in TF)
  "CKV_AZURE_170", // Severity "low", Azure wants us to use the Paid tier of AKS, we use the free tier
  "CKV_AZURE_116", // Severity "low", Azure wants us to use their policy addon, We will use OPA eventually
  "CKV_AZURE_6", // Severity "low", Azure wants us to whitelist IPs for kubeapi access
  "CKV2_AZURE_31", // Severity "low", Azure wants us to create and attach an NSG
  "CKV_AZURE_115", // Severity "low", Azure wants private clusters but GitHub Actions won't connect
  "CKV_AZURE_141", // Severity "low", Azure wants "no local users" but we don't have the requisite Azure AD setup
  "CKV_AZURE_226", // Severity "medium", Azure wants Ephemeral OS disk, but claims our default instance type is too small
  "CKV_AZURE_5", // Severity "medium", Azure wants us to enable RBAC, we will do more eventually
  "CKV_AZURE_227", // Severity "high", Azure requires enryption to be enabled in your Subscription before deployment, too much user burden
  "CKV_AZURE_232", // Severity "high", Azure wants us to have a separate node pool for system services, cash and complexity cost is high
].join(",");

const cndiCheckovSteps = [
  {
    name: "Checkout",
    uses: "actions/checkout@v4",
    with: {
      "fetch-depth": 0,
    },
  },
  {
    name: "Test with Checkov",
    id: "checkov",
    uses: "bridgecrewio/checkov-action@master",
    "continue-on-error": true,
    with: {
      directory: "./cndi", // run on all cndi artifacts
      output_format: "github_failed_only", // github markdown of failed checks
      output_file_path: "console,checkov", // Save results to ./checkov and print to console
      skip_check,
    },
  },
  {
    name: "Check if Checkov Results are Empty",
    id: "check_empty_results",
    run: `RESULTS='\${{ steps.checkov.outputs.results }}'
          # Using grep to find any character not in the set of '-' or whitespace
          if echo "$RESULTS" | grep -Eq '[^-\s]'; then
            echo "empty_results=false" >> $GITHUB_OUTPUT
          else
            echo "empty_results=true" >> $GITHUB_OUTPUT
          fi
    `,
    shell: "bash",
  },
  {
    name: "Comment Checkov Issues",
    if: "${{ steps.check_empty_results.outputs.empty_results == 'false' }}",
    uses: "thollander/actions-comment-pull-request@v2",
    with: {
      mode: "recreate", // recreate the comment if it already exists
      comment_tag,
      message: `## Checkov Failures
          
Checkov found issues in your pull request. Please review and fix them.

\${{ steps.checkov.outputs.results }}`,
    },
  },
  {
    name: "Delete Comment Checkov",
    if: "${{ steps.check_empty_results.outputs.empty_results == 'true' }}",
    uses: "thollander/actions-comment-pull-request@v2",
    with: {
      mode: "delete", // delete the comment if it exists: no errors
      comment_tag,
      message: "Checkov found no issues",
    },
  },
  {
    name: "Print Checkov Results",
    if: "${{ steps.check_empty_results.outputs.empty_results == 'true' }}",
    run: 'echo "Checkov found no issues"', // log to console if no issues
  },
];

const getWorkflowYaml = () => {
  const on = {
    pull_request: {
      types: ["opened", "synchronize", "reopened"],
    },
  };

  const cndiWorkflowObj = {
    name: "cndi",
    on,
    jobs: {
      "cndi-onpull": {
        // TODO: determine min scope
        permissions: "write-all",
        "runs-on": "ubuntu-20.04",
        env: {
          GIT_REPO: "${{ secrets.GIT_REPO }}",
          CNDI_TELEMETRY: "${{ secrets.CNDI_TELEMETRY }}",
        },
        steps: cndiCheckovSteps,
      },
    },
  };

  return YAML.stringify(cndiWorkflowObj);
};
export default getWorkflowYaml;
