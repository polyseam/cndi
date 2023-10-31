import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getRandomIDTFJSON(): string {
  const resource = getTFResource("random_id", {
    byte_length: 1,
  });
  return getPrettyJSONString(resource);
}
