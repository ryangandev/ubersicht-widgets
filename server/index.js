import { startServer } from './http.js';
const port = Number(process.env.PORT || 4317);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('PORT must be between 1 and 65535.');
const app = await startServer({
  port,
  directory: process.env.FOCUS_DATA_DIR,
  timeZone: process.env.FOCUS_TIME_ZONE,
});
console.log(`One Thing is ready: ${app.url}`);
let closing = false;
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, async () => {
    if (closing) return;
    closing = true;
    await app.close();
    process.exit(0);
  });
