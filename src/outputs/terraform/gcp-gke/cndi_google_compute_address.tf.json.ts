import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getGCPComputeAddressTFJSON(): string {
  const resource = getTFResource("google_compute_address", {
    name: "cndi-lb-ip-address",
    network_tier: "PREMIUM",
    address_type: "EXTERNAL",
    depends_on: ["google_project_service.cndi_google_project_service_compute"],
  });

  return getPrettyJSONString(resource);
}
