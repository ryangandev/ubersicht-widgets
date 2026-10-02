import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { snapshot, RuleError } from './model.js';
import { createStore } from './store.js';
import { buildWidgetPreview } from './widget-build.js';
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const assets = new Map([
  ['/', 'index.html'],
  ['/styles.css', 'styles.css'],
  ['/app.js', 'app.js'],
  ['/preview.css', 'preview.css'],
  ['/widget-preview', 'widget-preview.html'],
  ['/favicon.svg', 'favicon.svg'],
]);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};
let previewBuild;
async function widgetBundle() {
  if (!previewBuild)
    previewBuild = buildWidgetPreview().catch((e) => {
      previewBuild = null;
      throw e;
    });
  return previewBuild;
}
export async function startServer({
  port = 4317,
  directory = join(root, '..', '.data'),
  now = () => new Date(),
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  demo = false,
} = {}) {
  // Fail early for an invalid configured timezone rather than write misdated plans.
  new Intl.DateTimeFormat('en-US', { timeZone }).format(now());
  const store = await createStore(directory);
  let actualPort = port;
  const server = createServer(async (req, res) => {
    const origins = [`http://127.0.0.1:${actualPort}`, `http://localhost:${actualPort}`];
    const hosts = [`127.0.0.1:${actualPort}`, `localhost:${actualPort}`];
    const send = (status, body, type = 'application/json; charset=utf-8') => {
      res.writeHead(status, { 'Content-Type': type });
      res.end(typeof body === 'string' ? body : JSON.stringify(body));
    };
    try {
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Referrer-Policy', 'no-referrer');
      res.setHeader('X-Frame-Options', 'DENY');
      if (!hosts.includes(req.headers.host))
        return send(403, { error: '只能从本机打开 One Thing。' });
      const url = new URL(req.url, origins[0]);
      res.setHeader(
        'Content-Security-Policy',
        `default-src 'self'; script-src 'self'; style-src 'self'${url.pathname === '/widget-preview' ? " 'unsafe-inline'" : ''}; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`,
      );
      if (url.pathname.startsWith('/api/')) {
        if (req.headers.origin && !origins.includes(req.headers.origin))
          return send(403, { error: '请从 One Thing 本机页面操作。' });
        if (req.method === 'GET') {
          const data = store.read(),
            view = { ...snapshot(data, { now: now(), timeZone }), demo };
          if (url.pathname === '/api/state') return send(200, view);
          if (url.pathname === '/api/widget')
            return send(200, {
              revision: view.revision,
              today: view.today,
              primary: view.plan.primary,
              secondary: view.plan.secondary,
            });
          if (url.pathname === '/api/export') {
            res.setHeader('Content-Disposition', 'attachment; filename="one-thing-backup.json"');
            return send(200, JSON.stringify(data, null, 2) + '\n');
          }
          return send(404, { error: '找不到这个入口。' });
        }
        if (req.method === 'POST' && url.pathname === '/api/actions') {
          if (!req.headers['content-type']?.startsWith('application/json'))
            return send(415, { error: '请求格式不正确。' });
          let size = 0;
          const chunks = [];
          for await (const chunk of req) {
            size += chunk.length;
            if (size > 16384) throw new RuleError('提交内容过大。', 413);
            chunks.push(chunk);
          }
          const raw = Buffer.concat(chunks).toString('utf8');
          let action;
          try {
            action = JSON.parse(raw);
          } catch {
            throw new RuleError('请求格式不正确。');
          }
          const data = await store.mutate(action, { now: now(), timeZone });
          return send(200, { ...snapshot(data, { now: now(), timeZone }), demo });
        }
        return send(405, { error: '不支持这个请求方式。' });
      }
      if (req.method !== 'GET' && req.method !== 'HEAD')
        return send(405, 'Method not allowed', 'text/plain');
      if (url.pathname === '/widget-preview.js')
        return send(200, await widgetBundle(), 'text/javascript; charset=utf-8');
      const filename = assets.get(url.pathname);
      if (!filename) return send(404, 'Not found', 'text/plain');
      const body = await readFile(join(root, 'public', filename));
      const extension = '.' + filename.split('.').at(-1);
      res.writeHead(200, { 'Content-Type': mime[extension] });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch (error) {
      if (error instanceof RuleError)
        return send(error.status, { error: error.message, code: error.code });
      console.error(error);
      return send(500, { error: '暂时无法保存，请重试。原有记录仍然保留。' });
    }
  });
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, '127.0.0.1', resolve);
    });
    actualPort = server.address().port;
  } catch (error) {
    await store.close();
    throw error;
  }
  return {
    server,
    port: actualPort,
    url: `http://127.0.0.1:${actualPort}`,
    async close() {
      await new Promise((resolve) => server.close(resolve));
      await store.close();
    },
  };
}
