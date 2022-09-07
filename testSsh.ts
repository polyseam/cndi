// import { NodeSSH } from "npm:node-ssh";
// const ssh = new NodeSSH();

// try {
//   await ssh.connect({
//     host: "3.91.35.173",
//     privateKeyPath: "./private.pem",
//     username: "ubuntu",
//     debug: console.log,
//   });
//   console.log("connected");
// } catch (e) {
//   console.error(e);
// }

import { _format } from 'https://deno.land/std@0.152.0/path/_util.ts';
import { Client, utils } from 'npm:ssh2';
import NodeRSA from 'npm:node-rsa';

const privateKey = Deno.readFileSync("./private.pem");

// const key = new NodeRSA(privateKeyPKCS8);

// const privateKey = key.exportKey("pkcs1-private-pem");

// const parsed = utils.parseKey(privateKey);
// console.log('parsed', parsed)

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec('uptime', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: "54.157.192.229",
  port: 22,
  username: 'ubuntu',
  privateKey,
  debug: console.log,
  readyTimeout: 500000,
});
