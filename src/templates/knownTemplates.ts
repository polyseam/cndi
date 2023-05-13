export const POLYSEAM_TEMPLATE_DIRECTORY =
  "https://raw.githubusercontent.com/polyseam/cndi/main/src/templates/two/";

export default function getKnownTemplates() {
  const knownTemplates = [];
  const templateNames = ["basic", "airflow-tls"];
  const deploymentTargets = ["aws", "eks", "gcp", "azure"];
  for (const templateName of templateNames) {
    for (const deploymentTarget of deploymentTargets) {
      const template = {
        name: `${deploymentTarget}/${templateName}`,
        url:
          `${POLYSEAM_TEMPLATE_DIRECTORY}/${deploymentTarget}/${templateName}.json`,
      };
      knownTemplates.push(template);
    }
  }
  return knownTemplates;
}
