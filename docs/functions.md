# cndi functions 🪄

CNDI has support for so-called serverless functions, which enable writing code
that responds to an HTTP
[Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) and return
an HTTP [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response).

Unlike traditional serverless functions, CNDI functions are not limited to a
single cloud provider, instead they run in your CNDI cluster, wherever that may
be. Of course all Serverless functions rely on a server existing somewhere, but
you shouldn't need to think about it when using CNDI.

Functions are written in Typescript and deployed to your cluster using the
[Supabase Edge Runtime](https://github.com/supabase/edge-runtime). All you need
to do is write your function, call `cndi ow` and push your code up, the same way
you would with any other CNDI resource.

## writing a function ✍️

To write a function, create a new Typescript file at
`./functions/my-function/index.ts`. The function should look like this:

```typescript
// ./functions/greet/index.ts
import { STATUS_CODE } from "https://deno.land/std@0.224.0/http/status.ts";
const greeting = Deno.env.get("MY_GREETING") || "Hello";
Deno.serve((req: Request) => {
  const { pathname } = new URL(req.url);
  // eg. /greet/user -> Hello, user!
  const who = pathname.split("/")?.[2] || "world";
  return new Response(`${greeting}, ${who}!`, {
    status: STATUS_CODE.OK,
  });
});
```

## configuring ingress 🌐

To expose your function to the internet, you need to add the following to your
`cndi_config.yaml`:

```yaml
infrastructure:
  cndi:
    functions:
        hostname: "myfunctions.example.com"
```

This will create an Ingress resource that routes traffic from
`myfunctions.example.com` to your functions.

## configuring environment variables 🗝

It️'s often useful to have environment variables in your functions. You can add
them by using the typical Secrets workflow in CNDI:

```yaml
cluster_manifests:
  fns-env-secret:
    apiVersion: v1
    kind: Secret
    metadata:
      name: fns-env-secret
      namespace: fns
    stringData:
      MY_GREETING: $cndi_on_ow.seal_secret_from_env_var(MY_GREETING)
```

This value must be included in your `.env` file, and will be available in your
function as `Deno.env.get("MY_GREETING")`.

Note: The name of the Secret must be `fns-env-secret` and the namespace must be
`fns`. All functions are deployed to the `fns` namespace, and are configured to
use the `fns-env-secret` Secret.

## examples 🛒

You can find examples of functions in the
[examples section of the Supabase Edge Functions Repo](https://github.com/supabase/edge-runtime/tree/main/examples).

## issues 🐛

If you are having issues with your function, you may need to log into ArgoCD and
delete the `fns` Deployment. This will force the functions to be pulled from the
GitHub container registry again.
