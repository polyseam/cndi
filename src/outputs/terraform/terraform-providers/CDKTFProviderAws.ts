import {
  dataAwsAvailabilityZones,
  dataAwsIamPolicy,
  efsAccessPoint,
  efsFileSystem,
  efsMountTarget,
  provider,
  resourcegroupsGroup,
  vpc,
} from "@cdktf/provider-aws";

export const CDKTFProviderAws = {
  provider,
  resourcegroupsGroup,
  efsFileSystem,
  dataAwsAvailabilityZones,
  dataAwsIamPolicy,
  efsAccessPoint,
  efsMountTarget,
  vpc,
};
