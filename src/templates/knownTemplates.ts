export const POLYSEAM_TEMPLATE_DIRECTORY =
  "https://raw.githubusercontent.com/polyseam/cndi/main/src/templates/";

export default function getKnownTemplates() {
  const knownTemplates = [
    // ec2
    {
      name: "ec2/basic",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/ec2/basic.json`,
    },
    {
      name: "ec2/airflow-cnpg",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/ec2/airflow-cnpg.json`,
    },
    {
      name: "ec2/hop",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/ec2/hop.json`,
    },
    {
      name: "ec2/cnpg",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/ec2/cnpg.json`,
    },
    {
      name: "ec2/neo4j",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/ec2/neo4j.json`,
    },
    // eks
    {
      name: "eks/basic",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/eks/basic.json`,
    },
    {
      name: "eks/airflow-cnpg",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/eks/airflow-cnpg.json`,
    },
    {
      name: "eks/hop",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/eks/hop.json`,
    },
    // gcp
    {
      name: "gcp/basic",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gcp/basic.json`,
    },
    {
      name: "gcp/airflow-cnpg",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gcp/airflow-cnpg.json`,
    },
    {
      name: "gcp/cnpg",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gcp/cnpg.json`,
    },
    {
      name: "gcp/hop",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gcp/hop.json`,
    },
    {
      name: "gcp/neo4j",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gcp/neo4j.json`,
    },
    // azure
    {
      name: "azure/basic",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/azure/basic.json`,
    },
    {
      name: "azure/airflow-cnpg",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/azure/airflow-cnpg.json`,
    },
    {
      name: "azure/cnpg",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/azure/cnpg.json`,
    },
    {
      name: "azure/hop",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/azure/hop.json`,
    },
    {
      name: "azure/neo4j",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/azure/neo4j.json`,
    },
  ];
  return knownTemplates;
}
