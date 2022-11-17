import { padPrivatePem, padPublicPem } from "./utils.ts";

export default function setTF_VARs() {
  const git_username = Deno.env.get("GIT_USERNAME");
  if (!git_username) {
    console.error("GIT_USERNAME env var is not set");
    Deno.exit(31);
  }

  const git_password = Deno.env.get("GIT_PASSWORD");
  if (!git_password) {
    console.error("GIT_PASSWORD env var is not set");
    Deno.exit(32);
  }

  const git_repo = Deno.env.get("GIT_REPO");
  if (!git_repo) {
    console.error("GIT_REPO env var is not set");
    Deno.exit(33);
  }

  const argo_ui_readonly_password = Deno.env.get("ARGO_UI_READONLY_PASSWORD");
  if (!argo_ui_readonly_password) {
    console.error("ARGO_UI_READONLY_PASSWORD env var is not set");
    Deno.exit(34);
  }

  const sealed_secrets_private_key_material = Deno.env
    .get("SEALED_SECRETS_PRIVATE_KEY_MATERIAL")
    ?.trim()
    .replaceAll("_", "\n");

  if (!sealed_secrets_private_key_material) {
    console.error("SEALED_SECRETS_PRIVATE_KEY_MATERIAL env var is not set");
    Deno.exit(35);
  }

  const sealed_secrets_public_key_material = Deno.env
    .get("SEALED_SECRETS_PUBLIC_KEY_MATERIAL")
    ?.trim()
    .replaceAll("_", "\n");
  if (!sealed_secrets_public_key_material) {
    console.error("SEALED_SECRETS_PUBLIC_KEY_MATERIAL env var is not set");
    Deno.exit(36);
  }

  const sealed_secrets_private_key = padPrivatePem(
    sealed_secrets_private_key_material,
  );
  const sealed_secrets_public_key = padPublicPem(
    sealed_secrets_public_key_material,
  );

  Deno.env.set("TF_VAR_git_username", git_username);
  Deno.env.set("TF_VAR_git_password", git_password);
  Deno.env.set("TF_VAR_git_repo", git_repo);
  Deno.env.set("TF_VAR_argo_ui_readonly_password", argo_ui_readonly_password);
  Deno.env.set("TF_VAR_sealed_secrets_public_key", sealed_secrets_public_key);
  Deno.env.set("TF_VAR_sealed_secrets_private_key", sealed_secrets_private_key);
}
