import { spawn } from 'node:child_process';
const url = 'http://127.0.0.1:4317';
const command =
  process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open';
const child = spawn(command, [url], { stdio: 'inherit' });
child.on('error', () => {
  console.log(`Open ${url} in your browser.`);
  process.exitCode = 1;
});
