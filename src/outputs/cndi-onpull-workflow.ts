import { YAML } from "deps";

const comment_tag = "checkov-failures-comment";

const skip_check = [
  "CKV_SECRET_6", // SealedSecrets is used to encrypt secrets so this is a non-issue
  "CKV_AWS_341", // Launch Template should have a hop limit of 2 because the nodes are in EKS
  "CKV_AWS_184", // System Managed Keys and their automation are Better for CNDI's user profile
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
    run: `RESULTS="\${{ steps.checkov.outputs.results }}"
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
