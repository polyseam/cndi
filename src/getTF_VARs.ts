import { ccolors, loadEnvSync, path } from "deps";
import { loadCndiConfig, type PxResult } from "src/utils.ts";
import { ErrOut } from "errout";

const label = ccolors.faded("\nsrc/setTF_VARs.ts:");

const BACKWARDS_COMPATIBILITY = true;

export async function getTF_VARs(
  projectDir: string,
): Promise<PxResult<Record<string, string>>> {
  let isClusterless = false;

  const env = new Map<string, string>();

  const [errorLoadingConfig, loadConfigResult] = await loadCndiConfig(
    projectDir,
  );

  if (errorLoadingConfig) return [errorLoadingConfig];

  const { config } = loadConfigResult;

  isClusterless = config.distribution === "clusterless";

  const envPath = path.join(projectDir, ".env");

  const envIn = loadEnvSync({ export: true, envPath });

  for (const [key, value] of Object.entries(envIn)) {
    if (key.indexOf("TF_VAR_") === 0) { // only set TF_VARs
      env.set(key, value);
    } // reserved keywords below
  }

  const git_ssh_private_key = Deno.env.get("GIT_SSH_PRIVATE_KEY");
  const git_token = Deno.env.get("GIT_TOKEN");
  const git_username = Deno.env.get("GIT_USERNAME");

  if (!git_username && !git_ssh_private_key) {
    return [
      new ErrOut(
        [
          ccolors.error("Either"),
          ccolors.key_name(`"GIT_USERNAME"`),
          ccolors.error("or"),
          ccolors.key_name(`"GIT_SSH_PRIVATE_KEY"`),
          ccolors.error("must be set"),
        ],
        {
          code: 100,
          label,
          id: "setTF_VARs: !env.GIT_USERNAME && !env.GIT_SSH_PRIVATE_KEY",
        },
      ),
    ];
  }

  if (!git_token && !git_ssh_private_key) {
    return [
      new ErrOut(
        [
          ccolors.error("Either"),
          ccolors.key_name(`"GIT_TOKEN"`),
          ccolors.error("or"),
          ccolors.key_name(`"GIT_SSH_PRIVATE_KEY"`),
          ccolors.error("must be set"),
        ],
        {
          code: 101,
          label,
          id: "setTF_VARs: !env.GIT_TOKEN && !env.GIT_SSH_PRIVATE_KEY",
        },
      ),
    ];
  }

  const git_repo = Deno.env.get("GIT_REPO");
  if (!git_repo) {
    return [
      new ErrOut(
        [
          ccolors.key_name(`"GIT_REPO"`),
          ccolors.error("env var is not set"),
        ],
        {
          code: 102,
          label,
          id: "setTF_VARs: !env.GIT_REPO",
        },
      ),
    ];
  }

  if (!isClusterless) {
    const argocd_admin_password = Deno.env.get("ARGOCD_ADMIN_PASSWORD");
    if (!argocd_admin_password) {
      return [
        new ErrOut(
          [
            ccolors.key_name(`"ARGOCD_ADMIN_PASSWORD"`),
            ccolors.error("env var is not set"),
          ],
          {
            code: 103,
            label,
            id:
              "setTF_VARs: !env.ARGOCD_ADMIN_PASSWORD && cndi_config.distribution !== 'clusterless'",
          },
        ),
      ];
    }

    const sealed_secrets_private_key = Deno.env
      .get("SEALED_SECRETS_PRIVATE_KEY")
      ?.trim();

    if (!sealed_secrets_private_key) {
      return [
        new ErrOut(
          [
            ccolors.key_name(`"SEALED_SECRETS_PRIVATE_KEY"`),
            ccolors.error("env var is not set"),
          ],
          {
            code: 104,
            label,
            id:
              "setTF_VARs: !env.SEALED_SECRETS_PRIVATE_KEY && cndi_config.distribution !== 'clusterless'",
          },
        ),
      ];
    }

    const sealed_secrets_public_key = Deno.env
      .get("SEALED_SECRETS_PUBLIC_KEY")
      ?.trim();

    if (!sealed_secrets_public_key) {
      return [
        new ErrOut(
          [
            ccolors.key_name(`"SEALED_SECRETS_PUBLIC_KEY"`),
            ccolors.error("env var is not set"),
          ],
          {
            code: 105,
            label,
            id:
              "setTF_VARs: !env.SEALED_SECRETS_PUBLIC_KEY && cndi_config.distribution !== 'clusterless'",
          },
        ),
      ];
    }
    env.set("TF_VAR_ARGOCD_ADMIN_PASSWORD", argocd_admin_password);
    env.set("TF_VAR_SEALED_SECRETS_PUBLIC_KEY", sealed_secrets_public_key);
    env.set(
      "TF_VAR_SEALED_SECRETS_PRIVATE_KEY",
      sealed_secrets_private_key,
    );
  }

  if (git_ssh_private_key) {
    env.set("TF_VAR_GIT_SSH_PRIVATE_KEY", git_ssh_private_key);
  } else {
    git_username && env.set("TF_VAR_GIT_USERNAME", git_username);
    git_token && env.set("TF_VAR_GIT_TOKEN", git_token);
  }

  const ssh_public_key = Deno.env.get("SSH_PUBLIC_KEY");

  // only required for microk8s
  if (ssh_public_key) {
    env.set("TF_VAR_SSH_PUBLIC_KEY", ssh_public_key);
  } else {
    env.set("TF_VAR_SSH_PUBLIC_KEY", "");
  }

  env.set("TF_VAR_GIT_REPO", git_repo);

  // aks module requires cred be set explicitly
  const azurerm_client_id = Deno.env.get("ARM_CLIENT_ID") || "";
  const azurerm_client_secret = Deno.env.get("ARM_CLIENT_SECRET") || "";
  env.set("TF_VAR_ARM_CLIENT_ID", azurerm_client_id);
  env.set("TF_VAR_ARM_CLIENT_SECRET", azurerm_client_secret);

  // We want to set TF_VAR_UPPERCASED and TF_VAR_lowercase for backwards compatibility <= 2.25.3
  if (BACKWARDS_COMPATIBILITY) {
    for (const [key, value] of env.entries()) {
      const components = key.split("TF_VAR_");
      if (components && components.length > 1) {
        const newKey = `TF_VAR_${components[1].toLowerCase()}`;
        env.set(newKey, value);
      }
    }
  }

  return [undefined, Object.fromEntries(env)];
}
