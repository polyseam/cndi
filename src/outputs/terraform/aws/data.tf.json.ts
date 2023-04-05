import { getPrettyJSONString } from "src/utils.ts";
import { AWSNodeItemSpec } from "src/types.ts";
import { DEFAULT_INSTANCE_TYPES } from "deps";
import {
  TerraformDataSource
  } from "https://esm.sh/cdktf@0.15.5";
interface AWSTerraformEC2InstanceTypeOfferingsDataSource {
  [ec2_inst_type: string]: Array<{
    filter: Array<{
      name: string;
      values: Array<string>;
    }>;
    location_type: string;
  }>;
}

type TFData = [
  {
    aws_ec2_instance_type_offerings: Array<
      AWSTerraformEC2InstanceTypeOfferingsDataSource
    >;
  },
];

export default function getAWSDataTFJSON(
  nodes: Array<AWSNodeItemSpec>,
): string {
  const data: TFData = [{
    aws_ec2_instance_type_offerings: [
      {},
    ],
  }];

  const data = new TerraformDataSource(this, "cndi_aws_data", {
    aws_ec2_instance_type_offerings: []
  })

  nodes.forEach((entry) => {
    const instance_type = entry?.instance_type || entry?.machine_type ||
      DEFAULT_INSTANCE_TYPES.aws;
    const azKey = `available_az_for_${entry.name}_instance_type`;

    data[0].aws_ec2_instance_type_offerings[0][
      azKey
    ] = [
      {
        filter: [{ name: "instance-type", values: [instance_type] }],
        location_type: "availability-zone",
      },
    ];
  });

  return getPrettyJSONString({ data });
}
