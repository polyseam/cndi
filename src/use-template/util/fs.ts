import type { Result } from "../types.ts";
import { path } from "deps";
// Function to make a user-defined path absolute
export function makeAbsolutePath(userPath: string): Result<string> {
  // Check if the path starts with `~/` (home directory)
  if (userPath.startsWith("~/")) {
    const homeDir = Deno.env.get("HOME");
    if (!homeDir) {
      return { error: new Error("Failed to get the user's home directory") };
    }
    // Replace `~` with the user's home directory and return
    return { value: path.join(homeDir, userPath.slice(2)) };
  } else {
    // Resolve the path against the current working directory
    return { value: path.resolve(Deno.cwd(), userPath) };
  }
}
