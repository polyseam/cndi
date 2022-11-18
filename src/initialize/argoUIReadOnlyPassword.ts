const loadArgoUIReadOnlyPassword = (): string | null => {
  const argo_ui_readonly_password = Deno.env
    .get("ARGO_UI_READONLY_PASSWORD")
    ?.trim();

  if (!argo_ui_readonly_password) {
    return null;
  }

  return argo_ui_readonly_password;
};

const createArgoUIReadOnlyPassword = (): string => {
  return crypto.randomUUID().replaceAll("-", "");
};

export { createArgoUIReadOnlyPassword, loadArgoUIReadOnlyPassword };
