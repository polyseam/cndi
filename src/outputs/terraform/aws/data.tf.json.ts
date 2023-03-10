import { getPrettyJSONString } from "src/utils.ts";
import {
  AWSNodeItemSpec,
  AWSTerraformEC2InstanceTypeOfferingsDataSource,
} from "src/types.ts";

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

  nodes.forEach((entry) => {
    const instance_type = entry?.instance_type || entry?.machine_type ||
      "t3.large";
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

  return getPrettyJSONString({data});
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
