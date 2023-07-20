import { getPrettyJSONString } from "src/utils.ts";

export default function getMultipassLocalsTFJSON(): string {
  return getPrettyJSONString({
    locals: {
      bootstrap_token: "${random_password.cndi_join_token.result}",
    },
  });
}
