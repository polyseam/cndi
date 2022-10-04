import { walkSync } from "https://deno.land/std@0.157.0/fs/mod.ts?s=walk";

interface FileContentsDictionary {
  [filepath: string]: string;
}

// takes in a list of directories
// walks through all files and maps filepaths to contents
// runs on `deno task build`
// cndi install consumes the output of this function
export default function stringUp(directories: Array<string>, out: string) {
  const fileContents: FileContentsDictionary = {};
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
