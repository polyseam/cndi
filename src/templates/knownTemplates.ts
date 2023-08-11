export const POLYSEAM_TEMPLATE_DIRECTORY =
  "https://raw.githubusercontent.com/polyseam/cndi/yaml/src/templates/";

export default function getKnownTemplates() {
  const knownTemplates = [
    // ec2
    {
      name: "ec2/basic",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/ec2/basic.yaml`,
    },
    {
      name: "ec2/airflow",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/ec2/airflow.yaml`,
    },
    {
      name: "ec2/hop",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/ec2/hop.yaml`,
    },
    {
      name: "ec2/cnpg",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/ec2/cnpg.yaml`,
    },
    {
      name: "ec2/neo4j",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/ec2/neo4j.yaml`,
    },
    {
      name: "ec2/mysql",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/ec2/mysql.yaml`,
    },
    // eks
    {
      name: "eks/basic",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/eks/basic.yaml`,
    },
    {
      name: "eks/airflow",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/eks/airflow.yaml`,
    },
    {
      name: "eks/hop",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/eks/hop.yaml`,
    },
    {
      name: "eks/neo4j",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/eks/neo4j.yaml`,
    },
    {
      name: "eks/mysql",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/eks/mysql.yaml`,
    },
    // gcp
    {
      name: "gcp/basic",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gcp/basic.yaml`,
    },
    {
      name: "gcp/airflow",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gcp/airflow.yaml`,
    },
    {
      name: "gcp/cnpg",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gcp/cnpg.yaml`,
    },
    {
      name: "gcp/hop",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gcp/hop.yaml`,
    },
    {
      name: "gcp/neo4j",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gcp/neo4j.yaml`,
    },
    {
      name: "gcp/mysql",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gcp/mysql.yaml`,
    },
    // azure
    {
      name: "azure/basic",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/azure/basic.yaml`,
    },
    {
      name: "azure/airflow",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/azure/airflow.yaml`,
    },
    {
      name: "azure/cnpg",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/azure/cnpg.yaml`,
    },
    {
      name: "azure/hop",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/azure/hop.yaml`,
    },
    {
      name: "azure/neo4j",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/azure/neo4j.yaml`,
    },
    {
      name: "azure/mysql",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/azure/mysql.yaml`,
    },
    // dev
    {
      name: "dev/basic",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/dev/basic.yaml`,
    },
    {
      name: "dev/airflow",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/dev/airflow.yaml`,
    },
    {
      name: "dev/cnpg",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/dev/cnpg.yaml`,
    },
    {
      name: "dev/hop",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/dev/hop.yaml`,
    },
    {
      name: "dev/neo4j",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/dev/neo4j.yaml`,
    },
    {
      name: "dev/mysql",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/dev/mysql.yaml`,
    },
  ];
  return knownTemplates;
}
