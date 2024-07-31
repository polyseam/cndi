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

export function sanitizeFilePath(inputPath: string): Result<string> {
  // Normalize the input path to resolve any '..' or '.' segments
  const normalizedPath = path.normalize(inputPath);

  // Ensure the normalized path does not start with '..' (indicating an attempt to go outside the current directory)
  if (normalizedPath.startsWith("..")) {
    throw new Error(
      "Invalid path: Path cannot point outside of the current directory",
    );
  }

  // Ensure the normalized path does not contain '..' segments
  const parts = normalizedPath.split(path.SEPARATOR);
  if (parts.includes("..")) {
    return {
      error: new Error('Invalid path: Path cannot contain ".." segments'),
    };
  }

  // Ensure the path does not start with a separator (indicating an absolute path)
  if (path.isAbsolute(normalizedPath)) {
    return { error: new Error("Invalid path: Absolute paths are not allowed") };
  }

  return { value: normalizedPath };
}
