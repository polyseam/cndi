import { getPrettyJSONString } from "src/utils.ts";

import { CNDIConfig } from "src/types.ts";

interface AWS_IAM_ROLE {
  assume_role_policy: string;
  name_prefix: string;
}

export default function (_cndi_config: CNDIConfig) {
  const aws_iam_role: Record<string, AWS_IAM_ROLE> = {
    cndi_aws_iam_role: {
      assume_role_policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Action: "sts:AssumeRole",
          Principal: { Service: "ec2.amazonaws.com" },
        }],
      }),
      name_prefix: "COMPUTE",
    },
  };

  return getPrettyJSONString({
    resource: {
      aws_iam_role,
    },
  });
}
