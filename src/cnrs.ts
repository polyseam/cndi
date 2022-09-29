import { NodeSSH } from "npm:node-ssh@13.0.0";
import { CNDIContext, NodeEntry } from "./types.ts";
import * as path from "https://deno.land/std@0.157.0/path/mod.ts";

export interface CNRSNode {
  id: string;
  publicIpAddress: string;
  role: "working" | "controller";
}

// use a nodes public ip address to ssh in, copy the bootstrap script for the respective role and execute it
async function bootstrap(
  node: NodeEntry,
  { CNDI_WORKING_DIR, CNDI_SRC }: CNDIContext
) {
  const username = "ubuntu";
  console.log("CNDI_Woking_DIR", CNDI_WORKING_DIR);

  const ssh = new NodeSSH();
  console.log("sshing into", node.role, "at", node.publicIpAddress);
  const { role } = node;

  const dest = `/home/ubuntu/${role}`;
  const source = path.join(CNDI_SRC, "bootstrap", role);
  const privateKeyPath = path.join(CNDI_WORKING_DIR, "keys", "private.pem");

  console.log("privateKeyPath", privateKeyPath);
  console.log(Deno.readTextFileSync(privateKeyPath));

  // use keypair to connect
  await ssh.connect({
    host: node.publicIpAddress,
    username,
    privateKeyPath,
  });

  // copy the contents of local ../bootstrap/${role} to remote /home/ubuntu/${role}
  await ssh.putDirectory(source, dest);

  // remotely execute the bootstrap script we copied to the remote server
  const bootstrapResult = await ssh.execCommand(`. ${role}/bootstrap.sh`, {
    cwd: "/home/ubuntu",
  });

  console.log(`${node.id} stdout:`, bootstrapResult?.stdout);
  console.log(`${node.id} stderr:`, bootstrapResult?.stderr);

  // kill the ssh connection
  await ssh.dispose();
}

async function go(nodes: Array<NodeEntry>, context: CNDIContext) {
  // for loop that runs bootstrap for each node in the nodes array
  for (let i = 0; i < nodes.length; i++) {
    await bootstrap(nodes[i], context);
  }
}

export default go;
