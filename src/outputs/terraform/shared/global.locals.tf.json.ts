import { getPrettyJSONString } from "src/utils.ts";

export default function getVariablesTFJSON(
  { cndi_project_name }: { cndi_project_name: string },
): string {
  return getPrettyJSONString({
    locals: [{
      cndi_project_name,
    }],
  });
}
