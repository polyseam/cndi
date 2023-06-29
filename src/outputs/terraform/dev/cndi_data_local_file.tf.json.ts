import { getPrettyJSONString, getTFData } from "src/utils.ts";

export default function getDEVDataTFJSON(): string {
  const data = getTFData("local_file", {
    depends_on: ["terraform_data.cndi_terraform_data"],
    filename: "leader_ip_address.txt",
  });

  return getPrettyJSONString(data);
}
