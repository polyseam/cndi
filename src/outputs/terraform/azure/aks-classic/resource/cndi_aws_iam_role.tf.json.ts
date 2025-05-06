import { getPrettyJSONString } from "src/utils.ts";

import { CNDIConfig } from "src/types.ts";

interface Azure_IAM_ROLE {
  assume_role_policy: string;
  name_prefix: string;
}

export default function (_cndi_config: CNDIConfig) {
  const azure_iam_role: Record<string, Azure_IAM_ROLE> = {
    cndi_azure_iam_role: {
      assume_role_policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Action: "sts:AssumeRole",
          Principal: { Service: "ec2.amazonazure.com" },
        }],
      }),
      name_prefix: "COMPUTE",
    },
  };

  return getPrettyJSONString({
    resource: {
      azure_iam_role,
    },
  });
}
