import { getPrettyJSONString, getTFResource } from "src/utils.ts";

export default function getAWSTLSPrivateKeyTFJSON(): string {
  const resource = getTFResource("tls_private_key", {
    algorithm: "RSA",
  });
  return getPrettyJSONString(resource);
}
