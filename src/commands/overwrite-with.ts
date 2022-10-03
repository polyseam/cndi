import * as path from "https://deno.land/std@0.157.0/path/mod.ts";
import { copy } from "https://deno.land/std@0.157.0/fs/copy.ts";
import { checkInitialized, loadJSONC } from "../utils.ts";
import { CNDIConfig, CNDIContext } from "../types.ts";
import getApplicationManifest from "../templates/application-manifest.ts";
import RootChartYaml from "../templates/root-chart.ts";
import getDotEnv from "../templates/env.ts";

/**
 * COMMAND fn: cndi overwrite-with
 * Overwrites ./cndi directory with the specified config file
 */
const overwriteWithFn = async (context: CNDIContext, initializing = false) => {
  const {
    pathToConfig,
    githubDirectory,
    noGitHub,
    CNDI_SRC,
    outputDirectory,
    pathToNodes,
    noDotEnv,
    dotEnvPath,
  } = context;
  if (!initializing) {
    console.log(`cndi overwrite-with -f "${pathToConfig}"`);
  } else {
    const directoryContainsCNDIFiles = await checkInitialized(context);

    const shouldContinue = directoryContainsCNDIFiles
      ? confirm(
        "It looks like you have already initialized a cndi project in this directory. Overwrite existing artifacts?",
      )
      : true;

    if (!shouldContinue) {
      Deno.exit(0);
    }

    if (!noGitHub) {
      try {
        // overwrite the github workflows and readme, do not clobber other files
        await copy(path.join(CNDI_SRC, "github"), githubDirectory, {
          overwrite: true,
        });
      } catch (githubCopyError) {
        console.log("failed to copy github integration files");
        console.error(githubCopyError);
      }
    }
    if (!noDotEnv) {
      const gitignorePath = path.join(dotEnvPath, "..", ".gitignore");
      try {
        const gitignoreContents = await Deno.readTextFile(gitignorePath);
        if (!gitignoreContents.includes(".env")) {
          await Deno.writeTextFile(
            gitignorePath,
            gitignoreContents + "\n.env\n",
          );
        }
      } catch {
        await Deno.writeTextFile(gitignorePath, "\n.env\n");
      }
      await Deno.writeTextFile(dotEnvPath, getDotEnv());
    }
  }

  const config = (await loadJSONC(pathToConfig)) as unknown as CNDIConfig;

  const cluster = config?.cluster || {};

  try {
    // remove cndi/nodes.json
    await Deno.remove(path.join(outputDirectory, "nodes.json"));
  } catch {
    // file did not exist
  }

  try {
    // remove all files in cndi/cluster
    await Deno.remove(path.join(outputDirectory, "cluster"), {
      recursive: true,
    });
  } catch {
    // folder did not exist
  }

  // create 'cndi/' 'cndi/cluster' and 'cndi/cluster/applications'
  await Deno.mkdir(path.join(outputDirectory, "cluster", "applications"), {
    recursive: true,
  });

  // write each manifest in the "cluster" section of the config to `cndi/cluster`
  Object.keys(cluster).forEach(async (key) => {
    await Deno.writeTextFile(
      path.join(outputDirectory, "cluster", `${key}.json`),
      JSON.stringify(cluster[key], null, 2),
    );
  });

  // write the cndi/nodes.json file
  await Deno.writeTextFile(
    pathToNodes,
    JSON.stringify(config?.nodes ?? {}, null, 2),
  );

  // write the cndi/cluster/Chart.yaml file
  await Deno.writeTextFile(
    path.join(outputDirectory, "cluster", "Chart.yaml"),
    RootChartYaml,
  );

  const { applications } = config;

  // write the `cndi/cluster/applications/${applicationName}.application.json` file for each application
  Object.keys(applications).forEach(async (releaseName) => {
    const applicationSpec = applications[releaseName];
    const [manifestContent, filename] = getApplicationManifest(
      releaseName,
      applicationSpec,
    );
    await Deno.writeTextFile(
      path.join(outputDirectory, "cluster", "applications", filename),
      manifestContent,
      { create: true, append: false },
    );
    console.log("created application manifest:", filename);
  });

  const completionMessage = initializing
    ? "initialized your cndi project in the ./cndi directory!"
    : "overwrote your cndi project in the ./cndi directory!";

  console.log(completionMessage);
};

export default overwriteWithFn;
