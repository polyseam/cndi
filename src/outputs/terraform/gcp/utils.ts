import { ErrOut } from "errout";
import { ccolors } from "deps";

const label = ccolors.faded("\nsrc/outputs/terraform/gcp/utils.ts:\n");

export const ensureValidGoogleCredentials = (): ErrOut | void => {
  const key = Deno.env.get("GOOGLE_CREDENTIALS");

  if (!key) {
    return new ErrOut(
      [
        ccolors.key_name(`"GOOGLE_CREDENTIALS"`),
        ccolors.error("env variable not set"),
      ],
      {
        label,
        code: 803,
        id: "!env.GOOGLE_CREDENTIALS",
      },
    );
  }

  if (key === "__GOOGLE_CREDENTIALS_PLACEHOLDER__") {
    return new ErrOut(
      [
        ccolors.key_name(`"GOOGLE_CREDENTIALS"`),
        ccolors.error(
          "placeholder value must be replaced with a valid JSON key",
        ),
      ],
      {
        label,
        code: 804,
        id: "env.GOOGLE_CREDENTIALS===__GOOGLE_CREDENTIALS_PLACEHOLDER__",
      },
    );
  }

  try {
    JSON.parse(key);
  } catch {
    return new ErrOut(
      [
        ccolors.key_name(`"GOOGLE_CREDENTIALS"`),
        ccolors.error("env variable is not valid JSON"),
      ],
      {
        label,
        code: 805,
        id: "!JSON.parse(env.GOOGLE_CREDENTIALS)",
      },
    );
  }
};
