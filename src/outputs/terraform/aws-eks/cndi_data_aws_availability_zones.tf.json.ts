import { getPrettyJSONString, getTFData } from "src/utils.ts";
export default function getAWSAvailabilityZonesDataTFJSON(): string {
  const data = getTFData("aws_availability_zones", {
    cndi_aws_availability_zones: { state: "available" },
  });
  return getPrettyJSONString(data);
}
