const path = require("path");
const { NodeSSH } = require("node-ssh");
const fs = require("fs");
const arg = require("arg");

const args = arg({
  '--path-to-nodes': String,
  '-n': String,
  '--path-to-private-key': String,
  '-k': String,
  '--path-to-bootstrap-directory': String,
  '-b': String
});

const nodesPath = args["--path-to-nodes"] || args["-n"];
const privateKeyPath = args["--path-to-private-key"] || args["-k"];
const pathToBootstrapDirectory = args["--path-to-bootstrap-directory"] || args["-b"];

const username = "ubuntu";

const nodes = JSON.parse(fs.readFileSync(nodesPath, "utf8"));

if (!Array.isArray(nodes)) {
  throw new Error("bootstrap.js: unable to parse ./nodes.json");
} else {
  console.log("bootstrap.js: nodes.json parsed successfully");
  console.log("bootstrap.js: nodes.json:", nodes);
}

const ssh = new NodeSSH();

// use a nodes public ip address to ssh in, copy the bootstrap script for the respective role and execute it
async function bootstrap(node) {
  console.log("sshing into", node.role, "at", node.publicIpAddress);
  const { role } = node;

  const source = path.join(pathToBootstrapDirectory, role);
  const dest = `/home/ubuntu/${role}`;

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

  if (bootstrapResult.stderr) {
    console.log(`${node.id} stderr:`, bootstrapResult?.stderr);
  }

  console.log(`${node.id}:\n`, bootstrapResult?.stdout);
  // kill the ssh connection
  await ssh.dispose();
}

async function go(nodes) {
  // for loop that runs bootstrap for each node in the nodes array
  for (let i = 0; i < nodes.length; i++) {
    await bootstrap(nodes[i]);
  }
}

go(nodes);
