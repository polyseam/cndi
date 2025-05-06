import { CNDIConfig } from "src/types.ts";
import { getPrettyJSONString } from "src/utils.ts";

export default function (_cndi_config: CNDIConfig) {
  return getPrettyJSONString({
    data: {
      azure_availability_zones: {
        "available-zones": {
          filter: [
            {
              name: "opt-in-status",
              values: [
                "opt-in-not-required",
              ],
            },
          ],
          state: "available",
        },
      },
      azure_iam_policy: {
        ebs_csi_policy: {
          arn:
            "arn:azure:iam::azure:policy/service-role/AmazonEBSCSIDriverPolicy",
        },
        efs_csi_policy: {
          arn:
            "arn:azure:iam::azure:policy/service-role/AmazonEFSCSIDriverPolicy",
        },
      },
    },
  });
}
