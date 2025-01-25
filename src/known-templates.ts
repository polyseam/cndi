// better to have a defined list of builtin templates than walk /templates directory

export const POLYSEAM_TEMPLATE_DIRECTORY_URL =
  "https://raw.githubusercontent.com/polyseam/cndi/main/templates/";

type KnownTemplate = {
  name: string;
  url: string;
  aliases?: string[];
};

export const KNOWN_TEMPLATES: KnownTemplate[] = [
  {
    name: "basic",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/basic.yaml`,
  },
  {
    name: "airflow",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/airflow.yaml`,
  },
  {
    name: "cnpg",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/cnpg.yaml`,
    aliases: ["postgres"],
  },
  {
    name: "kafka",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/kafka.yaml`,
    aliases: ["strimzi"],
  },
  {
    name: "wordpress",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/wordpress.yaml`,
  },
  {
    name: "gpu-operator",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/gpu-operator.yaml`,
  },
  {
    name: "vllm",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/vllm.yaml`,
  },
  {
    name: "fns",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/fns.yaml`,
    aliases: ["functions"],
  },
  {
    name: "neo4j",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/neo4j.yaml`,
  },
  {
    name: "proxy",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/proxy.yaml`,
  },
  {
    name: "mssqlserver",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/mssqlserver.yaml`,
  },
  {
    name: "mongodb",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/mongodb.yaml`,
  },
  {
    name: "redis",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/redis.yaml`,
  },
  {
    name: "minio",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/minio.yaml`,
  },
  {
    name: "superset",
    url: `${POLYSEAM_TEMPLATE_DIRECTORY_URL}/superset.yaml`,
  },
] as const;
