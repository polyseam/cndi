import { assert, walk } from "test-deps";
import { path } from "deps";

function areSetsEqual(setA: Set<string>, setB: Set<string>) {
  if (setA.size !== setB.size) return false;
  for (const a of setA) if (!setB.has(a)) return false;
  return true;
}

function getModuleDir(importMeta: ImportMeta): string {
  return path.resolve(path.dirname(path.fromFileUrl(importMeta.url)));
}

const assertSetEquality = (setA: Set<string>, setB: Set<string>) =>
  assert(areSetsEqual(setA, setB));

const hasSameFilesAfter = async (
  operationFn: () => void,
  dir = ".",
) => {
  const originalContents = new Set<string>();
  // read the current directory entries (files, symlinks, and directories)
  for await (const dirEntry of Deno.readDir(dir)) {
    originalContents.add(dirEntry.name);
  }

  await operationFn();

  const afterContents = new Set<string>();
  // read the current directory entries after "cndi init" has ran
  for await (const afterDirEntry of Deno.readDir(dir)) {
    afterContents.add(afterDirEntry.name);
  }

  return areSetsEqual(originalContents, afterContents);
};

// Function to list all file paths in the current directory including subfolders
export async function listAllFilePaths(directory: string): Promise<string[]> {
  const filePaths: string[] = [];

  for await (const entry of walk(directory)) {
    if (entry.isFile) {
      filePaths.push(entry.path);
    }
  }

  return filePaths;
}

type FilePathsBeforeAndAfter = {
  before: string[];
  after: string[];
};

export async function listFilepathsBeforeAndAfter(
  operationFn: () => Promise<void>,
  dir: string,
): Promise<FilePathsBeforeAndAfter> {
  const before = await listAllFilePaths(dir);
  await operationFn();
  const after = await listAllFilePaths(dir);
  return { before, after };
}

export async function listChangedFilePaths(
  operationFn: () => Promise<void>,
  dir: string,
): Promise<Array<string>> {
  const originalContents = await listAllFilePaths(dir);
  await operationFn();
  const afterContents = await listAllFilePaths(dir);
  return afterContents.filter((path) => !originalContents.includes(path));
}

export const setsAreEquivalent = <T>(
  a: Set<T>,
  b: Set<T>,
): boolean => (a.isSubsetOf(b) && b.isSubsetOf(a));

export { assertSetEquality, getModuleDir, hasSameFilesAfter };
