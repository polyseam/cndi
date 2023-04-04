import { getPrettyJSONString, getTFResourceName } from "src/utils.ts";
import { Subnet } from "https://esm.sh/@cdktf/provider-aws@12.0.12/lib/subnet";

export default function getSubnetAwsEc2(scope: any, id: string, options: {
  vpcId: string;
}): Subnet {
  const CNDIProject = scope.project_name;
  const Name = getTFResourceName("Subnet", CNDIProject);
  const { vpcId } = options;
  return new Subnet(scope, id, {
    count: 1,
    cidrBlock: "10.0.1.0/24",
    mapPublicIpOnLaunch: true,
    tags: {
      Name,
      CNDIProject,
    },
    vpcId,
  });
}
