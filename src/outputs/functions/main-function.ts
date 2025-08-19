import { context, propagation } from "npm:@opentelemetry/api";

const MAX_MEMORY_LIMIT_MB = 150;
const WORKER_TIMEOUT_MS = 30000;
const NO_MODULE_CACHE = false;
const CPU_TIME_SOFT_LIMIT_MS = 10000;
const CPU_TIME_HARD_LIMIT_MS = 20000;

function mainContent() {
  console.log("main function started");
  console.log(Deno.version);

  addEventListener("beforeunload", () => {
    console.log("main worker exiting");
  });

  addEventListener("unhandledrejection", (ev) => {
    console.log(ev);
    ev.preventDefault();
  });

  Deno.serve(async (req: Request) => {
    const ctx = propagation.extract(context.active(), req.headers, {
      get(carrier, key) {
        return carrier.get(key) ?? void 0;
      },
      keys(carrier) {
        return [...carrier.keys()];
      },
    });

    const baggage = propagation.getBaggage(ctx);
    const requestId = baggage?.getEntry("cndi-request-id")?.value ?? null;

    const headers = new Headers({
      "Content-Type": "application/json",
    });

    const url = new URL(req.url);
    const { pathname } = url;

    // handle health checks
    if (pathname === "/_internal/health") {
      return new Response(
        JSON.stringify({ "message": "ok" }),
        {
          status: 200,
          headers,
        },
      );
    }

    if (pathname === "/_internal/metric") {
      // @ts-ignore - EdgeRuntime defined downstream
      const metric = await EdgeRuntime.getRuntimeMetrics();
      return Response.json(metric);
    }

    let servicePath = pathname;
    const path_parts = pathname.split("/");
    const service_name = path_parts[1];

    if (!service_name || service_name === "") {
      const error = { msg: "missing function name in request" };
      return new Response(
        JSON.stringify(error),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    servicePath = `./${service_name}`;

    const createWorker = async (otelAttributes?: { [_: string]: string }) => {
      const memoryLimitMb = MAX_MEMORY_LIMIT_MB;
      const workerTimeoutMs = WORKER_TIMEOUT_MS;
      const noModuleCache = NO_MODULE_CACHE;
      const cpuTimeSoftLimitMs = CPU_TIME_SOFT_LIMIT_MS;
      const cpuTimeHardLimitMs = CPU_TIME_HARD_LIMIT_MS;
      const forceCreate = false;

      const envVarsObj = Deno.env.toObject();
      const envVars = Object.keys(envVarsObj).map((k) => [k, envVarsObj[k]]);

      // @ts-ignore - EdgeRuntime patched
      return await EdgeRuntime.userWorkers.create({
        servicePath,
        memoryLimitMb,
        workerTimeoutMs,
        noModuleCache,
        envVars,
        forceCreate,
        cpuTimeSoftLimitMs,
        cpuTimeHardLimitMs,
        staticPatterns: [],
        context: {
          useReadSyncFileAPI: true,
          otel: otelAttributes,
        },
        otelConfig: {
          tracing_enabled: true,
          propagators: ["TraceContext", "Baggage"],
        },
      });
    };

    const callWorker = async () => {
      try {
        // If a worker for the given service path already exists
        // it will be reused by default.
        // Update forceCreate option in createWorker to force create a new worker for each request.
        const worker = await createWorker(
          requestId
            ? {
              "cndi-request-id": requestId,
            }
            : void 0,
        );

        const controller = new AbortController();

        const signal = controller.signal;
        // hard abort: setTimeout(() => controller.abort(), 2 * 60 * 1000);

        return await worker.fetch(req, { signal });
      } catch (e) {
        // @ts-ignore - Patched by Runtime
        if (e instanceof Deno.errors.WorkerAlreadyRetired) {
          return await callWorker();
        }
        // @ts-ignore - Patched by Runtime
        if (e instanceof Deno.errors.WorkerRequestCancelled) {
          headers.append("Connection", "close");
        }

        const error = { msg: (e as Error).toString() };
        return new Response(
          JSON.stringify(error),
          {
            status: 500,
            headers,
          },
        );
      }
    };

    return callWorker();
  });
}

type getFunctionsMainContentOptions = {
  noModuleCache?: boolean;
  maxMemoryLimitMb?: number;
  workerTimeoutMs?: number;
  cpuTimeSoftLimitMs?: number;
  cpuTimeHardLimitMs?: number;
};

export function getFunctionsMainContent(
  {
    maxMemoryLimitMb = MAX_MEMORY_LIMIT_MB,
    noModuleCache = NO_MODULE_CACHE,
    workerTimeoutMs = WORKER_TIMEOUT_MS,
    cpuTimeHardLimitMs = CPU_TIME_HARD_LIMIT_MS,
    cpuTimeSoftLimitMs = CPU_TIME_SOFT_LIMIT_MS,
  }: getFunctionsMainContentOptions,
) {
  // divide typescript code into headings, imports and content
  const headings = [
    "// https://github.com/polyseam/cndi/blob/main/src/outputs/functions/main-function.ts",
  ];

  const imports = [
    'import { context, propagation } from "npm:@opentelemetry/api";',
  ];

  const constants = [
    `const NO_MODULE_CACHE = ${noModuleCache};`,
    `const MAX_MEMORY_LIMIT_MB = ${maxMemoryLimitMb};`,
    `const WORKER_TIMEOUT_MS = ${workerTimeoutMs};`,
    `const CPU_TIME_SOFT_LIMIT_MS = ${cpuTimeSoftLimitMs};`,
    `const CPU_TIME_HARD_LIMIT_MS = ${cpuTimeHardLimitMs};`,
  ];

  // get the content of the main function excluding: function signature, curly braces, and indentation
  const content = mainContent.toString()
    .split("\n") // split the function into lines
    .map((fnBody) => fnBody.slice(2)) // remove the first two characters of each line
    .slice(1, -1) // remove the first and last line
    .join("\n"); // join the lines

  return `${headings.join("\n")}\n\n${constants.join("\n")}\n\n${
    imports.join("\n")
  }\n\n${content}\n`;
}
