import { useState } from "preact/hooks";
import { abbreviateTemplateIdentifier } from "islands/Configurator/shared.ts";
type CNDICreateConfiguratorCLISnippetProps = {
  templateIdentifier: string;
  project_name: string;
  deployment_target_distribution?: string;
  deployment_target_provider?: string;
};

declare global {
  interface Window {
    analytics?: {
      // deno-lint-ignore no-explicit-any
      track: (event: string, properties?: Record<string, any>) => void;
    };
  }
}

export function CNDICreateConfiguratorCLISnippet(
  props: CNDICreateConfiguratorCLISnippetProps,
) {
  const templateIdentifier = abbreviateTemplateIdentifier(
    props.templateIdentifier,
  );

  const {
    deployment_target_distribution,
    deployment_target_provider,
    project_name,
  } = props;

  const filepath = `~/Downloads/${project_name}.responses.yaml`;

  // The full command string that will be copied.
  const command = `cndi create -r ${filepath} -t ${templateIdentifier}`;

  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      // Reset "copied" after 1 second

      const data = {
        templateIdentifier,
        configurator: true,
        deployment_target_provider,
        deployment_target_distribution,
        project_name,
      };

      // deno-lint-ignore no-window
      window?.analytics?.track("CLI Snippet Copied", data);
      setTimeout(() => setCopied(false), 1000);
    } catch (error) {
      console.error("Failed to copy text: ", error);
    }
  };

  // If the command was just copied, display a simple "copied!" message.
  if (copied) {
    return (
      <code
        class="p-2 my-2 ml-0 sm:ml-2 rounded-md monospace bg-[#161b22] hover:bg-[#1f2937] cursor-pointer text-center"
        onClick={copyToClipboard}
      >
        <span class="verb text-purple-200">copied!</span>
      </code>
    );
  }

  return (
    <code
      class="p-2 my-2 ml-0 sm:ml-2 rounded-md monospace bg-[#161b22] hover:bg-[#1f2937] cursor-pointer"
      onClick={copyToClipboard}
    >
      {
        /*
        Each part of the command is wrapped in a <span> that is
        a block element on small screens (causing a line break)
        but inline on larger screens. Adjust the breakpoints as needed.
      */
      }
      <span class="verb text-purple-200 block sm:inline">cndi&nbsp;</span>
      <span class="verb text-purple-200 block sm:inline">create&nbsp;</span>
      <span class="option-name text-green-600 block sm:inline">-r&nbsp;</span>
      <span class="option-val text-purple-200 block sm:inline">
        {filepath}&nbsp;
      </span>
      <span class="option-name text-green-600 block sm:inline">-t&nbsp;</span>
      <span class="option-val text-purple-200 block sm:inline">
        {templateIdentifier}&nbsp;
      </span>
      <span class="text-purple-200 block sm:inline">&#x2398;</span>
    </code>
  );
}
