import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getVnetsuffixTFJSON(): string {
  const resource = getTFResource("random_integer", {
    byte_length: 4,
  }, "cndi_random_integer_vnet_suffix");
  return getPrettyJSONString(resource);
}
