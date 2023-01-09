import airflowTlsTemplate from "./airflow-tls.ts";
import basicTemplate from "./basic.ts";
import neo4jTlsTemplate from "./neo4j-tls.ts";

const availableTemplates = [
  basicTemplate,
  airflowTlsTemplate,
  neo4jTlsTemplate,
];
export default availableTemplates;
