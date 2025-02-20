// better to have a defined list of builtin templates than walk /templates directory

export const POLYSEAM_TEMPLATE_DIRECTORY_URL =
  "https://raw.githubusercontent.com/polyseam/cndi/main/templates/";

type KnownTemplate = {
  name: string;
  url: string; // URL to the template's YAML file
  aliases?: string[]; // other names that can be used to refer to this template with -t
  configurator_name?: string; // name to display in the configurator
  ga: boolean; // whether Template is Generally Available (ie: has /templates/:name page)
};

export const KNOWN_TEMPLATES: KnownTemplate[] = [
  {
    name: "basic",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/basic.yaml`,
    ga: true,
  },
  {
    name: "airflow",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/airflow.yaml`,
    ga: true,
  },
  {
    name: "cnpg",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/cnpg.yaml`,
    aliases: ["pg", "postgres", "postgresql"],
    configurator_name: "postgres",
    ga: true,
  },
  {
    name: "kafka",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/kafka.yaml`,
    aliases: ["strimzi"],
    ga: true,
  },
  {
    name: "wordpress",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/wordpress.yaml`,
    ga: true,
  },
  {
    name: "gpu-operator",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/gpu-operator.yaml`,
    ga: true,
  },
  {
    name: "vllm",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/vllm.yaml`,
    ga: false,
  },
  {
    name: "fns",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/fns.yaml`,
    aliases: ["functions"],
    ga: true,
  },
  {
    name: "neo4j",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/neo4j.yaml`,
    ga: true,
  },
  {
    name: "proxy",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/proxy.yaml`,
    ga: false,
  },
  {
    name: "mssqlserver",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/mssqlserver.yaml`,
    ga: true,
  },
  {
    name: "mongodb",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/mongodb.yaml`,
    ga: true,
  },
  {
    name: "redis",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/redis.yaml`,
    ga: true,
  },
  {
    name: "minio",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/minio.yaml`,
    ga: false,
  },
  {
    name: "superset",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/superset.yaml`,
    ga: true,
  },
] as const;
