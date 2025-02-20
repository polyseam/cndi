import { ComponentChildren } from "preact";

export const FormPanel = ({ children }: { children: ComponentChildren }) => { //bg-[var(--softgrey)]
  return (
    <div class="my-4 p-4 bg-softgrey rounded text-purple-200">{children}</div>
  );
};
