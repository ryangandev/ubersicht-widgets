import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { request } from 'node:http';
import { startServer } from '../server/http.js';
async function app(t) {
  const directory = await mkdtemp(join(tmpdir(), 'one-thing-api-'));
  const app = await startServer({
    port: 0,
    directory,
    now: () => new Date('2026-10-01T17:00:00Z'),
    timeZone: 'America/Los_Angeles',
  });
  t.after(async () => {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  });
  return app;
}
const post = (app, action, headers = {}) =>
  fetch(`${app.url}/api/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(action),
  });
test('dashboard, widget and export share the same persisted daily record', async (t) => {
  const a = await app(t);
  let response = await post(a, {
    type: 'queue.add',
    title: '完成一个可验收的结果',
    definition: '检查后打开 PR',
    revision: 0,
    operationId: randomUUID(),
  });
  assert.equal(response.status, 200);
  let data = await response.json();
  response = await post(a, {
    type: 'focus.assign',
    taskId: data.queue[0].id,
    role: 'primary',
    revision: data.revision,
    operationId: randomUUID(),
  });
  data = await response.json();
  assert.equal(response.status, 200);
  const widget = await (await fetch(`${a.url}/api/widget`)).json();
  assert.deepEqual(widget.primary, data.plan.primary);
  assert.equal(widget.today, '2026-10-01');
  const backup = await fetch(`${a.url}/api/export`);
  assert.match(backup.headers.get('Content-Disposition'), /attachment/);
  assert.equal((await backup.json()).days['2026-10-01'].primary.title, widget.primary.title);
  assert.equal(
    (await fetch(`${a.url}/api/state`)).headers.get('Access-Control-Allow-Origin'),
    null,
  );
});
test('other websites and unexpected hosts cannot write local tasks', async (t) => {
  const a = await app(t),
    action = { type: 'queue.add', title: '拒绝保存', revision: 0, operationId: randomUUID() };
  assert.equal((await post(a, action, { Origin: 'https://other.example' })).status, 403);
  assert.equal((await post(a, action, { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await fetch(`${a.url}/api/actions`)).status, 404);
  const status = await new Promise((resolve, reject) => {
    const req = request(
      `${a.url}/api/state`,
      { headers: { Host: `other.example:${a.port}` } },
      (res) => {
        res.resume();
        resolve(res.statusCode);
      },
    );
    req.on('error', reject);
    req.end();
  });
  assert.equal(status, 403);
  assert.equal((await (await fetch(`${a.url}/api/state`)).json()).revision, 0);
});
test('UTF-8 split across network chunks remains intact and oversized input cannot mutate data', async (t) => {
  const a = await app(t),
    title = '把中文想法放入队列';
  const body = Buffer.from(
    JSON.stringify({ type: 'queue.add', title, revision: 0, operationId: randomUUID() }),
  );
  const split = body.indexOf(Buffer.from('中')) + 1;
  const result = await new Promise((resolve, reject) => {
    const req = request(
      `${a.url}/api/actions`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' } },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(raw) }));
      },
    );
    req.on('error', reject);
    req.write(body.subarray(0, split));
    setTimeout(() => req.end(body.subarray(split)), 5);
  });
  assert.equal(result.status, 200);
  assert.equal(result.data.queue[0].title, title);
  const response = await post(a, {
    type: 'queue.add',
    title: 'a'.repeat(17000),
    revision: 1,
    operationId: randomUUID(),
  });
  assert.equal(response.status, 413);
  assert.equal((await (await fetch(`${a.url}/api/state`)).json()).revision, 1);
});
test('the browser preview builds the actual widget JSX and all application assets load', async (t) => {
  const a = await app(t);
  for (const path of ['/', '/app.js', '/styles.css', '/widget-preview', '/widget-preview.js']) {
    const response = await fetch(a.url + path);
    assert.equal(response.status, 200, path);
    const content = await response.text();
    assert.ok(content.length > 100, path);
    if (path === '/widget-preview.js') {
      assert.match(content, /dashboard\/index.jsx/);
      assert.match(content, /今日主线/);
    }
  }
  assert.equal((await fetch(`${a.url}/server/store.js`)).status, 404);
});
