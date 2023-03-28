import { getPrettyJSONString } from "src/utils.ts";

type GetLocalsTFJSONArgs = {
  cndi_project_name: string;
  leader_node_name: string;
};

export default function getLocalsTFJSON(
  { cndi_project_name, leader_node_name }: GetLocalsTFJSONArgs,
): string {
  return getPrettyJSONString({
    locals: {
      cndi_project_name,
      leader_node_name,
    },
  });
}
