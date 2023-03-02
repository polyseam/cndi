import { assert } from "https://deno.land/std@0.173.0/testing/asserts.ts";

function areSetsEqual(setA: Set<string>, setB: Set<string>) {
  if (setA.size !== setB.size) return false;
  for (const a of setA) if (!setB.has(a)) return false;
  return true;
}

const assertSetEquality = (setA: Set<string>, setB: Set<string>) =>
  assert(areSetsEqual(setA, setB));

export { assertSetEquality };
