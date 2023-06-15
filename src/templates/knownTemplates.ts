export const POLYSEAM_TEMPLATE_DIRECTORY =
  "https://raw.githubusercontent.com/polyseam/cndi/main/src/templates/";

export default function getKnownTemplates() {
  const knownTemplates = [
    // ec2
    {
      name: "ec2/basic",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/ec2/basic.jsonc`,
    },
    {
      name: "ec2/airflow-cnpg",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/ec2/airflow-cnpg.jsonc`,
    },
    {
      name: "ec2/hop",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/ec2/hop.jsonc`,
    },
    {
      name: "ec2/cnpg",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/ec2/cnpg.jsonc`,
    },
    // eks
    {
      name: "eks/basic",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/eks/basic.jsonc`,
    },
    {
      name: "eks/airflow-cnpg",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/eks/airflow-cnpg.jsonc`,
    },
    {
      name: "eks/hop",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/eks/hop.jsonc`,
    },
    // gcp
    {
      name: "gcp/basic",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gcp/basic.jsonc`,
    },
    {
      name: "gcp/airflow-cnpg",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gcp/airflow-cnpg.jsonc`,
    },
    {
      name: "gcp/cnpg",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gcp/cnpg.jsonc`,
    },
    {
      name: "gcp/hop",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gcp/hop.jsonc`,
    },
    // azure
    {
      name: "azure/basic",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/azure/basic.jsonc`,
    },
    {
      name: "azure/airflow-cnpg",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/azure/airflow-cnpg.jsonc`,
    },
    {
      name: "azure/cnpg",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/azure/cnpg.jsonc`,
    },
    {
      name: "azure/hop",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/azure/hop.jsonc`,
    },
  ];
  return knownTemplates;
}
