import { getSecretOfLength } from "src/utils.ts";

const loadArgoUIAdminPassword = (): string | null => {
  const argo_ui_admin_password = Deno.env
    .get("ARGO_UI_ADMIN_PASSWORD")
    ?.trim();

  if (!argo_ui_admin_password) {
    return null;
  }

  return argo_ui_admin_password;
};

const createArgoUIAdminPassword = (): string => {
  return getSecretOfLength(32);
};

export { createArgoUIAdminPassword, loadArgoUIAdminPassword };
