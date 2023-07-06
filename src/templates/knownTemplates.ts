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
      name: "ec2/airflow",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/ec2/airflow.jsonc`,
    },
    {
      name: "ec2/hop",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/ec2/hop.jsonc`,
    },
    {
      name: "ec2/cnpg",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/ec2/cnpg.jsonc`,
    },
    {
      name: "ec2/neo4j",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/ec2/neo4j.jsonc`,
    },
    {
      name: "ec2/mysql",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/ec2/mysql.jsonc`,
    },
    // eks
    {
      name: "eks/basic",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/eks/basic.jsonc`,
    },
    {
      name: "eks/airflow",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/eks/airflow.jsonc`,
    },
    {
      name: "eks/hop",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/eks/hop.jsonc`,
    },
    {
      name: "eks/neo4j",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/eks/neo4j.jsonc`,
    },
    {
      name: "eks/mysql",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/eks/mysql.jsonc`,
    },
    {
      name: "eks/jupyterhub",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/eks/jupyterhub.jsonc`,
    },
    // gcp
    {
      name: "gcp/basic",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gcp/basic.jsonc`,
    },
    {
      name: "gcp/airflow",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gcp/airflow.jsonc`,
    },
    {
      name: "gcp/cnpg",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gcp/cnpg.jsonc`,
    },
    {
      name: "gcp/hop",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gcp/hop.jsonc`,
    },
    {
      name: "gcp/neo4j",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gcp/neo4j.jsonc`,
    },
    {
      name: "gcp/mysql",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gcp/mysql.jsonc`,
    },
    // azure
    {
      name: "azure/basic",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/azure/basic.jsonc`,
    },
    {
      name: "azure/airflow",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/azure/airflow.jsonc`,
    },
    {
      name: "azure/cnpg",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/azure/cnpg.jsonc`,
    },
    {
      name: "azure/hop",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/azure/hop.jsonc`,
    },
    {
      name: "azure/neo4j",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/azure/neo4j.jsonc`,
    },
    {
      name: "azure/mysql",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/azure/mysql.jsonc`,
    },
  ];
  return knownTemplates;
}
