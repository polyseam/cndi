import { walkSync } from "https://deno.land/std@0.157.0/fs/mod.ts?s=walk";

export default function stringUp(directories: Array<string>, out: string) {
  const fileContents = {};
  directories.forEach((directory) => {
    for (const entry of walkSync(directory)) {
      if (entry.isFile) {
        const file = Deno.readTextFileSync(entry.path);
        fileContents[entry.path] = file;
      }
    }
  });

  const embeddedFiles = `export const embeddedFiles = ${
    JSON.stringify(fileContents)
  }`;
  Deno.writeTextFileSync(out, embeddedFiles);
}
