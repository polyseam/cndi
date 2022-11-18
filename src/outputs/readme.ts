import coreReadmeBlock from "../doc/core.ts";
import basicReadmeBlock from "../doc/basic.ts";
import airflowTlsReadmeBlock from "../doc/airflow-tls.ts";

import { Template } from "../types.ts";

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

const getREADME = (template?: Template): string => {
  const templateBlock = templateBlocks[template as Template];

  // returns a readme which is the core readme block, and any template specific blocks
  return `
${coreReadmeBlock}

${template ? `## ${template} template instructions` : ""}

${templateBlock || ""}
`.trim();
};

export default getREADME;
