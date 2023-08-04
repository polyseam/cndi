import { ccolors } from "deps";
import { emitExitEvent } from "src/utils.ts";
const setTF_VARsLabel = ccolors.faded("\nsrc/setTF_VARs.ts:");

export default async function setTF_VARs() {
  const git_ssh_private_key = Deno.env.get("GIT_SSH_PRIVATE_KEY");
  const git_password = Deno.env.get("GIT_PASSWORD");
  const git_username = Deno.env.get("GIT_USERNAME");

  if (!git_username && !git_ssh_private_key) {
    console.error(
      setTF_VARsLabel,
      ccolors.key_name(`"GIT_USERNAME"`),
      "env var is not set",
    );
    await emitExitEvent(100);
    Deno.exit(100);
  }

  if (!git_password && !git_ssh_private_key) {
    console.error(
      setTF_VARsLabel,
      ccolors.error("Either"),
      ccolors.key_name(`"GIT_PASSWORD"`),
      ccolors.error("or"),
      ccolors.key_name(`"GIT_SSH_PRIVATE_KEY"`),
      ccolors.error("must be set"),
    );
    await emitExitEvent(101);
    Deno.exit(101);
  }

  const git_repo = Deno.env.get("GIT_REPO");
  if (!git_repo) {
    console.error(
      setTF_VARsLabel,
      ccolors.key_name(`"GIT_REPO"`),
      ccolors.error("env var is not set"),
    );
    await emitExitEvent(102);
    Deno.exit(102);
  }

  const argocd_admin_password = Deno.env.get("ARGOCD_ADMIN_PASSWORD");
  if (!argocd_admin_password) {
    console.error(
      setTF_VARsLabel,
      ccolors.key_name(`"ARGOCD_ADMIN_PASSWORD"`),
      ccolors.error("env var is not set"),
    );
    await emitExitEvent(103);
    Deno.exit(103);
  }

  const sealed_secrets_private_key = Deno.env
    .get("SEALED_SECRETS_PRIVATE_KEY")
    ?.trim();

  if (!sealed_secrets_private_key) {
    console.error(
      setTF_VARsLabel,
      ccolors.key_name(`"SEALED_SECRETS_PRIVATE_KEY"`),
      ccolors.error("env var is not set"),
    );
    await emitExitEvent(104);
    Deno.exit(104);
  }

  const sealed_secrets_public_key = Deno.env
    .get("SEALED_SECRETS_PUBLIC_KEY")
    ?.trim();

  if (!sealed_secrets_public_key) {
    console.error(
      setTF_VARsLabel,
      ccolors.key_name(`"SEALED_SECRETS_PUBLIC_KEY"`),
      ccolors.error("env var is not set"),
    );
    await emitExitEvent(105);
    Deno.exit(105);
  }

  if (git_ssh_private_key) {
    Deno.env.set("TF_VAR_git_ssh_private_key", git_ssh_private_key);
  } else {
    git_username && Deno.env.set("TF_VAR_git_username", git_username);
    git_password && Deno.env.set("TF_VAR_git_password", git_password);
  }

  Deno.env.set("TF_VAR_git_repo", git_repo);
  Deno.env.set("TF_VAR_argocd_admin_password", argocd_admin_password);
  Deno.env.set("TF_VAR_sealed_secrets_public_key", sealed_secrets_public_key);
  Deno.env.set("TF_VAR_sealed_secrets_private_key", sealed_secrets_private_key);
}
