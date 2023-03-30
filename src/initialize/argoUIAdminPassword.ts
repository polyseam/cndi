import { getSecretOfLength } from "src/utils.ts";

const loadArgoUIAdminPassword = (): string | null => {
  const argocd_admin_password = Deno.env
    .get("ARGOCD_ADMIN_PASSWORD")
    ?.trim();

  if (!argocd_admin_password) {
    return null;
  }

  return argocd_admin_password;
};

const createArgoUIAdminPassword = (): string => {
  return getSecretOfLength(32);
};

export { createArgoUIAdminPassword, loadArgoUIAdminPassword };
