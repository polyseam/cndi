import { getPrettyJSONString } from "src/utils.ts";
import {
  AWSNodeItemSpec,
  AWSTerraformEC2InstanceTypeOfferingsDataSource,
} from "src/types.ts";

export default function getAWSDataTFJSON(
  nodes: Array<AWSNodeItemSpec>,
): string {
  const availabilityZoneKeys: string[] = [];

  type TFData = [
    {
      aws_ec2_instance_type_offerings: Array<
        AWSTerraformEC2InstanceTypeOfferingsDataSource
      >;
      availability_zones: string; // this used to be in locals
    },
  ];

  const data: TFData = [{
    aws_ec2_instance_type_offerings: [
      {},
    ],
    availability_zones: ``, // sorted(setintersection(valid_locations))`,
  }];

  nodes.forEach((entry) => {
    const instance_type = entry?.instance_type || entry?.machine_type ||
      "t3.large";
    const azKey = `available_az_for_${entry.name}_instance_type`;

    availabilityZoneKeys.push(
      `data.aws_ec2_instance_type_offerings.${azKey}.locations`,
    );

    data[0].aws_ec2_instance_type_offerings[0][
      azKey
    ] = [
      {
        filter: [{ name: "instance-type", values: [instance_type] }],
        location_type: "availability-zone",
      },
    ];
  });

  data[0].availability_zones = `\${sort(setintersection(${
    availabilityZoneKeys.join(
      ",",
    )
  }))}`;

  return getPrettyJSONString(data);
  //   data: [
  //     {
  //       aws_ec2_instance_type_offerings: [
  //         {
  //           "available_az_for_x-airflow-node_instance_type": [
  //             {
  //               filter: [{ name: "instance-type", values: ["m5a.large"] }],
  //               location_type: "availability-zone",
  //             },
  //           ],
  //           "available_az_for_y-airflow-node_instance_type": [
  //             {
  //               filter: [{ name: "instance-type", values: ["m5a.large"] }],
  //               location_type: "availability-zone",
  //             },
  //           ],
  //           "available_az_for_z-airflow-node_instance_type": [
  //             {
  //               filter: [{ name: "instance-type", values: ["m5a.large"] }],
  //               location_type: "availability-zone",
  //             },
  //           ],
  //         },
  //       ],
  //     },
  //   ],
  // });
}
