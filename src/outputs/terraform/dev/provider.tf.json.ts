import { getPrettyJSONString } from "src/utils.ts";

export default function getDevProviderTFJSON() {
  const provider = {
    multipass: {},
  };

  return getPrettyJSONString({ provider });
}
