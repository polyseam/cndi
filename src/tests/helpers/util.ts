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
  console.log("originalContents", originalContents);

  await operationFn();

  const afterContents = new Set<string>();
  // read the current directory entries after "cndi init" has ran
  for await (const afterDirEntry of Deno.readDir(dir)) {
    afterContents.add(afterDirEntry.name);
  }
  console.log("afterContents", afterContents);

  return areSetsEqual(originalContents, afterContents);
};

// Function to list all file paths in the current directory including subfolders
async function listAllFilePaths(directory: string): Promise<string[]> {
  const filePaths: string[] = [];

  for await (const entry of walk(directory)) {
    if (entry.isFile) {
      filePaths.push(entry.path);
    }
  }

  return filePaths;
}

export async function listChangedFilePaths(
  operationFn: () => void,
  dir = ".",
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

async function ensureResourceNamesMatchFileNames() {
  //assert(status.success);
  for await (
    const afterDirEntry of (Deno.readDir(
      path.join(".", "cndi", "terraform"),
    ))
  ) {
    if (!afterDirEntry.name.endsWith(".tf.json")) continue;
    const fileObj = JSON.parse(
      await Deno.readTextFile(
        path.join(".", "cndi", "terraform", afterDirEntry.name),
      ),
    );
    if (fileObj?.resource) {
      const resourceType = Object.keys(fileObj.resource)[0];
      const resourceName = Object.keys(fileObj.resource[resourceType])[0];
      const resourceNameMatches =
        afterDirEntry.name === `${resourceName}.tf.json`;
      if (!resourceNameMatches) {
        console.log("resourceName", resourceName, "DOES NOT MATCH");
        console.log("afterDirEntry.name", afterDirEntry.name);
      }
      assert(resourceNameMatches);
    }
  }
}

export {
  assertSetEquality,
  ensureResourceNamesMatchFileNames,
  getModuleDir,
  hasSameFilesAfter,
};
