function mainContent() {
  console.log("main function started");

  const JWT_SECRET = Deno.env.get("JWT_SECRET");
  const VERIFY_JWT = Deno.env.get("VERIFY_JWT") === "true";

  function getAuthToken(req: Request) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }
    const [bearer, token] = authHeader.split(" ");
    if (bearer !== "Bearer") {
      throw new Error(`Auth header is not 'Bearer {token}'`);
    }
    return token;
  }

  async function verifyJWT(jwt: string): Promise<boolean> {
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(JWT_SECRET);
    try {
      // @ts-ignore: jose is imported downstream
      await jose.jwtVerify(jwt, secretKey);
    } catch (err) {
      console.error(err);
      return false;
    }
    return true;
  }

  Deno.serve(async (req: Request) => {
    if (req.method !== "OPTIONS" && VERIFY_JWT) {
      try {
        const token = getAuthToken(req);
        const isValidJWT = await verifyJWT(token);

        if (!isValidJWT) {
          return new Response(
            JSON.stringify({ msg: "Invalid JWT" }),
            { status: 401, headers: { "Content-Type": "application/json" } },
          );
        }
      } catch (e) {
        console.error(e);
        return new Response(
          JSON.stringify({ msg: e.toString() }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    const url = new URL(req.url);
    const { pathname } = url;
    const path_parts = pathname.split("/");
    const service_name = path_parts[1];

    if (!service_name || service_name === "") {
      const error = { msg: "missing function name in request" };
      return new Response(
        JSON.stringify(error),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const servicePath = `/home/deno/functions/${service_name}`;
    console.error(`serving the request with ${servicePath}`);

    const memoryLimitMb = 150;
    const workerTimeoutMs = 1 * 60 * 1000;
    const noModuleCache = false;
    const importMapPath = null;
    const envVarsObj = Deno.env.toObject();
    const envVars = Object.keys(envVarsObj).map((k) => [k, envVarsObj[k]]);

    try {
      // @ts-ignore: EdgeRuntime is provided downstream
      const worker = await EdgeRuntime.userWorkers.create({
        servicePath,
        memoryLimitMb,
        workerTimeoutMs,
        noModuleCache,
        importMapPath,
        envVars,
      });
      return await worker.fetch(req);
    } catch (e) {
      const error = { msg: e.toString() };
      return new Response(
        JSON.stringify(error),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  });
}

// it's possible that this is all silly, and we should instead just fetch this from a URL
export function getFunctionsMainContent() {
  // divide typescript code into imports and content
  const imports = [
    `import * as jose from "https://deno.land/x/jose@v5.6.3/index.ts";`,
  ];

  // get the content of the main function excluding: function signature, curly braces, and indentation
  const content = mainContent.toString()
    .split("\n") // split the function into lines
    .map((fnBody) => fnBody.slice(2)) // remove the first two characters of each line
    .slice(1, -1) // remove the first and last line
    .join("\n"); // join the lines

  return `${imports.join("\n")}\n${content}`;
}
