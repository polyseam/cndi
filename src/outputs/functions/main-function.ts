// import { STATUS_CODE } from "https://deno.land/std@0.224.0/http/status.ts";

function mainContent() {
  Deno.serve(async (req: Request) => {
    const headers = new Headers({
      "Content-Type": "application/json",
    });
    const url = new URL(req.url);
    const { pathname } = url;
    // handle health checks
    if (pathname === "/_internal/health") {
      return new Response(
        JSON.stringify({
          "message": "ok",
        }),
        {
          // @ts-ignore - downstream import provides STATUS_CODE
          status: STATUS_CODE.OK,
          headers,
        },
      );
    }
    if (pathname === "/_internal/metric") {
      // @ts-ignore - EdgeRuntime global is provided downstream
      const metric = await EdgeRuntime.getRuntimeMetrics();
      return Response.json(metric);
    }

    // NOTE: You can test WebSocket in the main worker by uncommenting below.
    // if (pathname === '/_internal/ws') {
    // 	const upgrade = req.headers.get("upgrade") || "";
    // 	if (upgrade.toLowerCase() != "websocket") {
    // 		return new Response("request isn't trying to upgrade to websocket.");
    // 	}
    // 	const { socket, response } = Deno.upgradeWebSocket(req);
    // 	socket.onopen = () => console.log("socket opened");
    // 	socket.onmessage = (e) => {
    // 		console.log("socket message:", e.data);
    // 		socket.send(new Date().toString());
    // 	};
    // 	socket.onerror = e => console.log("socket errored:", e.message);
    // 	socket.onclose = () => console.log("socket closed");
    // 	return response; // 101 (Switching Protocols)
    // }

    const path_parts = pathname.split("/");
    const service_name = path_parts[1];
    if (!service_name || service_name === "") {
      const error = {
        msg: "missing function name in request",
      };
      return new Response(JSON.stringify(error), {
        // @ts-ignore - downstream import provides STATUS_CODE
        status: STATUS_CODE.BadRequest,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    const servicePath = `./${service_name}`;
    // console.error(`serving the request with ${servicePath}`);
    const createWorker = async () => {
      const memoryLimitMb = 150;
      const workerTimeoutMs = 5 * 60 * 1000;
      const noModuleCache = false;
      // you can provide an import map inline
      // const inlineImportMap = {
      //   imports: {
      //     "std/": "https://deno.land/std@0.131.0/",
      //     "cors": "./examples/_shared/cors.ts"
      //   }
      // }
      // const importMapPath = `data:${encodeURIComponent(JSON.stringify(importMap))}?${encodeURIComponent('/home/deno/functions/test')}`;
      const importMapPath = null;
      const envVarsObj = Deno.env.toObject();
      const envVars = Object.keys(envVarsObj).map((k) => [
        k,
        envVarsObj[k],
      ]);
      const forceCreate = false;
      const netAccessDisabled = false;
      // load source from an eszip
      // const maybeEszip = await Deno.readFile('./bin.eszip');
      // const maybeEntrypoint = 'file:///src/index.ts';
      // const maybeEntrypoint = 'file:///src/index.ts';
      // or load module source from an inline module
      // const maybeModuleCode = 'Deno.serve((req) => new Response("Hello from Module Code"));';
      //
      const cpuTimeSoftLimitMs = 10000;
      const cpuTimeHardLimitMs = 20000;

      // @ts-ignore - EdgeRuntime global is provided downstream
      return await EdgeRuntime.userWorkers.create({
        servicePath,
        memoryLimitMb,
        workerTimeoutMs,
        noModuleCache,
        importMapPath,
        envVars,
        forceCreate,
        netAccessDisabled,
        cpuTimeSoftLimitMs,
        cpuTimeHardLimitMs,
      });
    };

    const callWorker = async () => {
      try {
        // If a worker for the given service path already exists,
        // it will be reused by default.
        // Update forceCreate option in createWorker to force create a new worker for each request.
        const worker = await createWorker();
        const controller = new AbortController();
        const signal = controller.signal;
        // Optional: abort the request after a timeout
        // setTimeout(() => controller.abort(), 2 * 60 * 1000);
        return await worker.fetch(req, {
          signal,
        });
      } catch (err) {
        const e = err as Error;
        console.error(e);
        // @ts-ignore - EdgeRuntime seems to patch Deno.errors
        if (e instanceof Deno.errors.WorkerRequestCancelled) {
          headers.append("Connection", "close");
          // XXX(Nyannyacha): I can't think right now how to re-poll
          // inside the worker pool without exposing the error to the
          // surface.
          // It is satisfied when the supervisor that handled the original
          // request terminated due to reaches such as CPU time limit or
          // Wall-clock limit.
          //
          // The current request to the worker has been canceled due to
          // some internal reasons. We should repoll the worker and call
          // `fetch` again.
          // return await callWorker();
        }
        const error = {
          msg: e.toString(),
        };
        return new Response(JSON.stringify(error), {
          // @ts-ignore - downstream import provides STATUS_CODE
          status: STATUS_CODE.InternalServerError,
          headers,
        });
      }
    };
    return callWorker();
  });
}

// it's possible that this is all silly, and we should instead just fetch this from a URL
export function getFunctionsMainContent() {
  // divide typescript code into headings, imports and content
  const headings = [
    "// https://github.com/supabase/edge-runtime/blob/main/examples/main/index.ts",
  ];

  const imports = [
    `import { STATUS_CODE } from "https://deno.land/std@0.224.0/http/status.ts";`,
  ];

  // get the content of the main function excluding: function signature, curly braces, and indentation
  const content = mainContent.toString()
    .split("\n") // split the function into lines
    .map((fnBody) => fnBody.slice(2)) // remove the first two characters of each line
    .slice(1, -1) // remove the first and last line
    .join("\n"); // join the lines

  return `${headings.join("\n")}\n\n${imports.join("\n")}\n\n${content}\n`;
}
