import { getPrettyJSONString } from "src/utils.ts";
type GHCRDockerConfigJSON = {
    auths: {
        "ghcr.io": {
            username: string;
            password: string;
            auth: string;
            email?: string;
        };
    };
};

export function getFunctionsPullSecretManifest() {
    const username = Deno.env.get("GIT_USERNAME")!;
    const password = Deno.env.get("GIT_TOKEN")!;
    
    
    if (!username) {
        console.error(`'GIT_USERNAME' must be set when using CNDI Functions`);
    }

    if (!password) {
        console.error(`'GIT_TOKEN' must be set when using CNDI`);
    }

    const auth = btoa(`${username}:${password}`);

    const data: GHCRDockerConfigJSON = {
        auths: {
            "ghcr.io": {
                username,
                password,
                auth,
            },
        },
    };

    const SECRET_ENV_NAME = "FNS_PULL_SECRET";

    const plaintext = getPrettyJSONString(data);
    console.log('plaintext');
    console.log(plaintext);

    Deno.env.set(SECRET_ENV_NAME, plaintext);


    const manifest = {
        apiVersion: "v1",
        kind: "Secret",
        metadata: {
            name: "fns-pull-secret",
            namespace: "fns"
        },
        type: "kubernetes.io/dockerconfigjson",
        stringData: {
            ".dockerconfigjson": `$cndi_on_ow.seal_secret_from_env_var(${SECRET_ENV_NAME})`,
        },
    };

    return manifest;
}
