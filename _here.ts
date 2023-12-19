import { path } from "deps";

// https://stackoverflow.com/a/61829368
// returns the path which contains this file (root of the repo)
export default function getProjectRoot(): string {
  const directoryUrl = new URL(".", import.meta.url);
  return path.fromFileUrl(directoryUrl);
}
