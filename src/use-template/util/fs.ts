import { PxResult } from "src/utils.ts";
import { ccolors, path } from "deps";
import { ErrOut } from "errout";

const label = "@cndi/use-template/util/fs.ts";

// Function to make a user-defined path absolute
export function makeAbsolutePath(userPath: string): PxResult<string> {
  // Check if the path starts with `~/` (home directory)
  if (userPath.startsWith("~/")) {
    const homeDir = Deno.env.get("HOME");
    if (!homeDir) {
      return [
        new ErrOut([ccolors.error("Failed to get the user's home directory")], {
          code: 100,
          label,
          id: "makeAbsolutePath/!env.HOME",
        }),
      ];
    }
    // Replace `~` with the user's home directory and return
    return [undefined, path.join(homeDir, userPath.slice(2))];
  } else {
    // Resolve the path against the current working directory
    return [undefined, path.resolve(Deno.cwd(), userPath)];
  }
}

export function sanitizeFilePath(inputPath: string): PxResult<string> {
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
    return [
      new ErrOut(
        [ccolors.error("Invalid path: Path cannot contain '..' segments")],
        {
          label,
          code: 100,
          id: "sanitizeFilePath/parts.includes('..')",
        },
      ),
    ];
  }

  // Ensure the path does not start with a separator (indicating an absolute path)
  if (path.isAbsolute(normalizedPath)) {
    return [
      new ErrOut(
        [ccolors.error("Invalid path: Absolute paths are not allowed")],
        {
          label,
          code: 100,
          id: "sanitizeFilePath/path.isAbsolute",
        },
      ),
    ];
  }

  return [undefined, normalizedPath];
}
