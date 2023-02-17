import { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/colors.ts";

const setTF_VARsLabel = colors.white("\nsrc/setTF_VARs:");

export default function setTF_VARs() {
  const git_username = Deno.env.get("GIT_USERNAME");
  if (!git_username) {
    console.log(
      setTF_VARsLabel,
      colors.brightRed("GIT_USERNAME env var is not set"),
    );
    Deno.exit(1);
  }

  const git_password = Deno.env.get("GIT_PASSWORD");
  if (!git_password) {
    console.log(
      setTF_VARsLabel,
      colors.brightRed("GIT_PASSWORD env var is not set"),
    );
    Deno.exit(1);
  }

  const git_repo = Deno.env.get("GIT_REPO");
  if (!git_repo) {
    console.log(
      setTF_VARsLabel,
      colors.brightRed("GIT_REPO env var is not set"),
    );
    Deno.exit(1);
  }

  const argo_ui_admin_password = Deno.env.get("ARGO_UI_ADMIN_PASSWORD");
  if (!argo_ui_admin_password) {
    console.log(
      setTF_VARsLabel,
      colors.brightRed("ARGO_UI_ADMIN_PASSWORD env var is not set"),
    );
    Deno.exit(1);
  }

  const sealed_secrets_private_key = Deno.env
    .get("SEALED_SECRETS_PRIVATE_KEY")
    ?.trim();

  if (!sealed_secrets_private_key) {
    console.log(
      setTF_VARsLabel,
      colors.brightRed("SEALED_SECRETS_PRIVATE_KEY env var is not set"),
    );
    Deno.exit(1);
  }

  const sealed_secrets_public_key = Deno.env
    .get("SEALED_SECRETS_PUBLIC_KEY")
    ?.trim();

  if (!sealed_secrets_public_key) {
    console.log(
      setTF_VARsLabel,
      colors.brightRed("SEALED_SECRETS_PUBLIC_KEY env var is not set"),
    );
    Deno.exit(1);
  }

  Deno.env.set("TF_VAR_git_username", git_username);
  Deno.env.set("TF_VAR_git_password", git_password);
  Deno.env.set("TF_VAR_git_repo", git_repo);
  Deno.env.set("TF_VAR_argo_ui_admin_password", argo_ui_admin_password);
  Deno.env.set("TF_VAR_sealed_secrets_public_key", sealed_secrets_public_key);
  Deno.env.set("TF_VAR_sealed_secrets_private_key", sealed_secrets_private_key);
}
