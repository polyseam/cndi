import { CNDIContext } from "../types.ts";

import coreReadmeBlock from "../doc/core.ts";

import basicReadmeBlock from "../doc/basic.ts";
import airflowTlsReadmeBlock from "../doc/airflow-tls.ts";

const enum Template {
  "airflow-tls" = "airflow-tls",
  "basic" = "basic",
}

type TemplateBlock = {
  [key in Template]: string;
};

const templateBlocks: TemplateBlock = {
  "airflow-tls": `
${basicReadmeBlock}

${airflowTlsReadmeBlock}
`,
  basic: basicReadmeBlock,
};

const getREADME = (context: CNDIContext): string => {
  const { template } = context;
  const templateBlock = templateBlocks[template as Template];

  // returns a readme which is the core readme block, and any template specific blocks
  return `
${coreReadmeBlock}

${template ? `## ${template} template instructions` : ""}

${templateBlock || ""}
`.trim();
};

export default getREADME;
