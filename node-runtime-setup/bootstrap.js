const path = require("path");
const { NodeSSH } = require("node-ssh");

const username = "ubuntu";

// imagine these will come in as a parameter when this is a Deno module, for now we hand write them and it sucks
const n = [
  { host: "54.82.76.47", role: "controller" },
  { host:  "44.211.64.35", role: "worker" },
];

const privateKeyPath = path.join(__dirname, "../private.pem");

const ssh = new NodeSSH();

async function bootstrap(node) {
  const { role, host } = node;

  const source = path.join(__dirname, `../bootstrap/${role}`)
  const dest = `/home/ubuntu/${role}`;

  await ssh.connect({
    host,
    username,
    privateKeyPath,
  });

  await ssh.putDirectory(source, dest);

  // Command
  await ssh
    .execCommand(`. ${role}/bootstrap.sh`, { cwd: "/home/ubuntu" })
    .then(function (result) {
      console.log("STDOUT: " + result.stdout);
      console.log("STDERR: " + result.stderr);
      ssh.dispose();
    });

}

function go(nodes) {
  nodes.forEach(async (node) => {
    await bootstrap(node);
  });
}

go(n);
