const path = require("path");
const { NodeSSH } = require("node-ssh");
const fs = require("fs");

const username = "ubuntu";

const privateKeyPath = path.join(__dirname, "../private.pem");
const nodesPath = path.join(__dirname, "./nodes.json");
const nodes = JSON.parse(fs.readFileSync(nodesPath, "utf8"));

if(!Array.isArray(nodes)){
  throw new Error("bootstrap.js: unable to parse ./nodes.json");
}else{
  console.log('bootstrap.js: nodes.json parsed successfully');
  console.log('bootstrap.js: nodes.json:', nodes);
}

const ssh = new NodeSSH();

async function bootstrap(node) {
  // TODO: this uses the first ssh connection for every iteration instead of creating a new one for each node, so it doesn't work.
  console.log('sshing into', node.role,'at',node.publicIpAddress);
  const { role } = node;

  const source = path.join(__dirname, `../bootstrap/${role}`);
  const dest = `/home/ubuntu/${role}`;

  await ssh.connect({
    host: node.publicIpAddress,
    username,
    privateKeyPath,
  });

  await ssh.putDirectory(source, dest);

  // Command
  const bootstrapResult = await ssh.execCommand(`. ${role}/bootstrap.sh`, {
    cwd: "/home/ubuntu",
  });
  console.log(`${node.id} stdout:`, bootstrapResult?.stdout);
  console.log(`${node.id} stderr:`, bootstrapResult?.stderr);
  await ssh.dispose();
}

async function go(nodes) {
  // for loop that runs bootstrap for each node in the nodes array
  for (let i = 0; i < nodes.length; i++) {
    await bootstrap(nodes[i]);
  }
}

go(nodes);
