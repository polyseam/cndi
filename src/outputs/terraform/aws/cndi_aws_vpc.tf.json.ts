import { getPrettyJSONString, getTFResource, getTFResourceName } from "src/utils.ts";
import { Vpc } from "https://esm.sh/@cdktf/provider-aws@12.0.12/lib/vpc";

export default function getVPCAwsEc2(
  scope: any,
  id: string
): Vpc {
  const CNDIProject = scope.project_name;
  const Name = getTFResourceName('Vpc', CNDIProject)
  return new Vpc(scope, id, {
    cidrBlock: "10.0.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
      Name,
      CNDIProject,
    },
  });
}
