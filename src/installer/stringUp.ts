import { walkSync } from "https://deno.land/std@0.157.0/fs/mod.ts?s=walk";

interface FileContentsDictionary {
  [filepath: string]: string;
}

interface StringUpInputArg {
  filePaths: string[];
  directoryPaths: string[];
}

// takes in a list of directories and a list of files
// walks through all files and maps filepaths to contents
// runs on `deno task build`
// cndi install consumes the output of this function
export default function stringUp(input: StringUpInputArg, outputPath: string) {
  const fileContents: FileContentsDictionary = {};

  input.directoryPaths.forEach((directoryPath) => {
    for (const entry of walkSync(directoryPath)) {
      if (entry.isFile) {
        const file = Deno.readTextFileSync(entry.path);
        fileContents[entry.path] = file;
      }
    }
  });

  input.filePaths.forEach((filePath) => {
    fileContents[filePath] = Deno.readTextFileSync(filePath);
  });

  const embeddedFiles = `// This file is generated automatically, do not edit!
export const embeddedFiles = ${JSON.stringify(fileContents)}`;

  Deno.writeTextFileSync(outputPath, embeddedFiles);
}
