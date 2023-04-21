import { getPrettyJSONString, getTFResource } from "src/utils.ts";
export default function getTimeStaticTFJSON(): string {
  const resource = getTFResource("time_static", {
    triggers: { argocd_admin_password: "${local.argocd_admin_password}" },
  }, "cndi_time_static_admin_password_update");
  return getPrettyJSONString(resource);
}
