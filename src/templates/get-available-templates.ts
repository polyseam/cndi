import airflowTlsTemplate from "./airflow-tls.ts";
import basicTemplate from "./basic.ts";

const getAvailableTemplates = (): Array<string> => {
  const baseTemplates = [airflowTlsTemplate, basicTemplate];
  const deploymentTargets = ["aws", "gcp"];

  const templates: string[] = [];

  baseTemplates.forEach((baseTemplate) => {
    deploymentTargets.forEach((target) => {
      templates.push(`${target}/${baseTemplate.name}`);
    });
  });

  return templates;
};

export default getAvailableTemplates;
