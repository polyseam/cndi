import { getPrettyJSONString, getTFData } from "src/utils.ts";
export default function getAWSCallerIdentityDataTFJSON(): string {
  const data = getTFData(
    "aws_caller_identity",
    {},
  );
  return getPrettyJSONString(data);
}
