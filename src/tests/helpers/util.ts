import { assert } from "https://deno.land/std@0.173.0/testing/asserts.ts";

function areSetsEqual(setA: Set<string>, setB: Set<string>) {
  if (setA.size !== setB.size) return false;
  for (const a of setA) if (!setB.has(a)) return false;
  return true;
}

const assertSetEquality = (setA: Set<string>, setB: Set<string>) =>
  assert(areSetsEqual(setA, setB));

const hasSameFilesAfter = async (
  operationFn: () => void,
) => {
  const originalContents = new Set<string>();
  // read the current directory entries (files, symlinks, and directories)
  for await (const dirEntry of Deno.readDir(".")) {
    originalContents.add(dirEntry.name);
  }

  await operationFn();

  const afterContents = new Set<string>();
  // read the current directory entries after "cndi init" has ran
  for await (const afterDirEntry of Deno.readDir(".")) {
    afterContents.add(afterDirEntry.name);
  }

  return areSetsEqual(originalContents, afterContents);
};

export { assertSetEquality, hasSameFilesAfter };
