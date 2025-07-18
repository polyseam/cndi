import { getPrettyJSONString } from "src/utils.ts";

import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";

interface AwsIamRole {
  assume_role_policy: string;
  name_prefix: string;
}

export default function (_cndi_config: NormalizedCNDIConfig) {
  const aws_iam_role: Record<string, AwsIamRole> = {
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
