import { type Signal, useSignal } from "@preact/signals";
type Props = {
  source: string;
  name?: string;
};
export default function SourceShower({ source, name = "Source" }: Props) {
  const showSource: Signal<boolean> = useSignal(false);
  const label = showSource.value ? `Hide ${name} △` : `View ${name} ▼`;
  return (
    <>
      <div class={`my-4 p-4 bg-[#333] text-purple-200 rounded`}>
        <button
          type="button"
          class="text-purple-200 border-gray-300 rounded focus:ring-blue-400 hover:cursor-pointer"
          id="show-source-button"
          onClick={() => {
            showSource.value = !showSource.value;
          }}
        >
          {label}
        </button>
        {showSource.value && (
          <div class="border-gray-300 rounded p-4 m-4 bg-[#333] text-purple-200">
            <pre>
              <code>{source}</code>
            </pre>
          </div>
        )}
      </div>
    </>
  );
}
