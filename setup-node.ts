import { Client as SSHClient } from "https://esm.sh/ssh2-deno@2.0.1";

const sshConn = new SSHClient();

sshConn.on("ready", () => {
  console.log("SSH connection established");
}).connect({
  host: "ec2-3-238-82-109.compute-1.amazonaws.com",
  username: "ubuntu",
  privateKey: "./private.pem",
});
