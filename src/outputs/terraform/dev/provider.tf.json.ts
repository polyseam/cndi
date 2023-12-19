import { getPrettyJSONString } from "../../../utils.ts";

export default function getDevProviderTFJSON() {
  const provider = {
    multipass: {},
  };

  return getPrettyJSONString({ provider });
}
