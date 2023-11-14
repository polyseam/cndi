import { getPrettyJSONString } from "src/utils.ts";

export default function (project_name?: string): string {
  return getPrettyJSONString({
    app: "echo 'cdktf synth called'",
    output: ".",
    language: "typescript",
    projectId: project_name || "my-cndi-project",
  });
}
