import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getBcryptHashTFJSON(): string {
  const resource = getTFResource("bcrypt_hash", {
    cndi_bcrypt_hash_argocd_admin_password: {
      cleartext: "${var.argocd_admin_password}",
    },
  }, "cndi_bcrypt_hash_argocd_admin_password");
  return getPrettyJSONString(resource);
}
