import { getSecretOfLength } from "../utils.ts";

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
  const secret = getSecretOfLength(32);
  Deno.env.set("ARGOCD_ADMIN_PASSWORD", secret);
  return secret;
};

export { createArgoUIAdminPassword, loadArgoUIAdminPassword };
