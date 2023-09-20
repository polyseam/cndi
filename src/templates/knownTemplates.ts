export const POLYSEAM_TEMPLATE_DIRECTORY =
  "https://raw.githubusercontent.com/polyseam/cndi/main/src/templates/";

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
    // gce
    {
      name: "gce/basic",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gce/basic.yaml`,
    },
    {
      name: "gce/airflow",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gce/airflow.yaml`,
    },
    {
      name: "gce/cnpg",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gce/cnpg.yaml`,
    },
    {
      name: "gce/hop",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gce/hop.yaml`,
    },
    {
      name: "gce/neo4j",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gce/neo4j.yaml`,
    },
    {
      name: "gce/mysql",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gce/mysql.yaml`,
    },
    // aks
    {
      name: "aks/basic",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/aks/basic.yaml`,
    },
    {
      name: "aks/airflow",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/aks/airflow.yaml`,
    },
    {
      name: "aks/cnpg",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/aks/cnpg.yaml`,
    },
    {
      name: "aks/hop",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/aks/hop.yaml`,
    },
    {
      name: "aks/neo4j",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/aks/neo4j.yaml`,
    },
    {
      name: "aks/mysql",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/aks/mysql.yaml`,
    },
    // azure
    {
      name: "avm/basic",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/avm/basic.yaml`,
    },
    {
      name: "avm/airflow",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/avm/airflow.yaml`,
    },
    {
      name: "avm/cnpg",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/avm/cnpg.yaml`,
    },
    {
      name: "avm/hop",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/avm/hop.yaml`,
    },
    {
      name: "avm/neo4j",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/avm/neo4j.yaml`,
    },
    {
      name: "avm/mysql",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/avm/mysql.yaml`,
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
    // gke
    {
      name: "gke/basic",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gke/basic.yaml`,
    },
    {
      name: "gke/airflow",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gke/airflow.yaml`,
    },
    {
      name: "gke/cnpg",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gke/cnpg.yaml`,
    },
    {
      name: "gke/hop",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gke/hop.yaml`,
    },
    {
      name: "gke/neo4j",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gke/neo4j.yaml`,
    },
    {
      name: "gke/mysql",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/gke/mysql.yaml`,
    },
  ];
  return knownTemplates;
}
