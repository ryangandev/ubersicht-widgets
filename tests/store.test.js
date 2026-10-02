import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, mkdir, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createStore } from '../server/store.js';
const add = (revision) => ({
  type: 'queue.add',
  title: '保存下来的任务',
  revision,
  operationId: randomUUID(),
});
async function directory(t) {
  const path = await mkdtemp(join(tmpdir(), 'one-thing-test-'));
  t.after(() => rm(path, { recursive: true, force: true }));
  return path;
}
test('saved tasks survive a service restart; another process cannot open the same data', async (t) => {
  const path = await directory(t),
    first = await createStore(path);
  await assert.rejects(createStore(path), /already open/);
  await first.mutate(add(0));
  await first.close();
  const second = await createStore(path);
  assert.equal(second.read().tasks[0].title, '保存下来的任务');
  assert.equal(second.read().revision, 1);
  await second.close();
});
test('corrupt data is preserved byte-for-byte and does not leave an active lock', async (t) => {
  const path = await directory(t),
    original = '{"version":1, broken';
  await writeFile(join(path, 'focus.json'), original);
  await assert.rejects(createStore(path), /original data preserved/);
  assert.equal(await readFile(join(path, 'focus.json'), 'utf8'), original);
  assert.deepEqual(await readdir(path), ['focus.json']);
});
test('disk failure never acknowledges a saved task, and later valid writes can proceed', async (t) => {
  const path = await directory(t),
    store = await createStore(path);
  await mkdir(join(path, 'focus.json'));
  await assert.rejects(store.mutate(add(0)));
  assert.equal(store.read().revision, 0);
  assert.equal(store.read().tasks.length, 0);
  assert.equal(
    (await readdir(path)).some((name) => name.endsWith('.tmp')),
    false,
  );
  await rm(join(path, 'focus.json'), { recursive: true });
  await store.mutate(add(0));
  await store.close();
  assert.equal(JSON.parse(await readFile(join(path, 'focus.json'), 'utf8')).tasks.length, 1);
});
test('concurrent writes are serialized and cannot silently overwrite each other', async (t) => {
  const path = await directory(t),
    store = await createStore(path);
  const result = await Promise.allSettled([store.mutate(add(0)), store.mutate(add(0))]);
  assert.deepEqual(
    result.map((r) => r.status),
    ['fulfilled', 'rejected'],
  );
  assert.equal(result[1].reason.code, 'STALE_REVISION');
  assert.equal(store.read().tasks.length, 1);
  await store.close();
});
