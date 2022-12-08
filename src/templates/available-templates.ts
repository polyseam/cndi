import airflowTlsTemplate from "./airflow-tls.ts";
import basicTemplate from "./basic.ts";
import  mastadonTlsTemplate from "./mastodon-tls.ts";

const availableTemplates = [basicTemplate, airflowTlsTemplate, mastadonTlsTemplate];
export default availableTemplates;
