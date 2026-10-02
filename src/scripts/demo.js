import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createStore } from '../server/store.js';
import { localDay, shiftDay } from '../server/model.js';
import { startServer } from '../server/http.js';

// A disposable, explicitly labeled preview. Real user data always starts empty.
const directory = await mkdtemp(join(tmpdir(), 'one-thing-demo-'));
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const today = localDay(new Date(), timeZone);
const store = await createStore(directory);
const atDay = (date) => new Date(`${date}T12:00:00`);
const act = (action, now) =>
  store.mutate(
    { ...action, revision: store.read().revision, operationId: randomUUID() },
    { now, timeZone },
  );
async function add(title, definition, now) {
  await act({ type: 'queue.add', title, definition }, now);
  return store.read().tasks.at(-1).id;
}
const past = [
  [-12, '把项目的验收标准写清楚', '写下三个可检查的完成条件。', true],
  [-10, '完成第一轮设计比较', '选出最贴近日常使用的布局。', true],
  [-9, '走通核心交互', '完整体验一次入队、安排和完成。', false],
  [-7, '整理本周项目状态', '每个项目写下当前状态与下一步。', true],
  [-5, '修复最影响体验的问题', '复现问题，并验证修改后的行为。', true],
  [-3, '把回顾页面做完', '能区分未安排、未完成和已完成。', false],
  [-1, '完成一次完整验收', '检查空状态、长标题和窄屏显示。', true],
];
for (const [offset, title, definition, complete] of past) {
  const now = atDay(shiftDay(today, offset)),
    taskId = await add(title, definition, now);
  await act({ type: 'focus.assign', role: 'primary', taskId }, now);
  if (complete) await act({ type: 'focus.complete', role: 'primary', completed: true }, now);
  if (offset === -7 || offset === -1) {
    const secondary = await add('整理当天的项目笔记', '把确认的决定和下一步写下来。', now);
    await act({ type: 'focus.assign', role: 'secondary', taskId: secondary }, now);
    await act({ type: 'focus.complete', role: 'secondary', completed: true }, now);
  }
}
const now = new Date();
const main = await add(
  '完成 One Thing 第一版并打开验收 PR',
  '走通入队、选择主线、标记完成和每日回顾，并附上页面预览。',
  now,
);
const secondary = await add('整理本周的项目笔记', '把已确认的状态和下一步写入项目文档。', now);
await act({ type: 'focus.assign', role: 'primary', taskId: main }, now);
await act({ type: 'focus.assign', role: 'secondary', taskId: secondary }, now);
await add('下周再研究一个新产品方向', '先整理三个值得验证的问题。', now);
await add('读完桌面组件的设计参考', '写下三条可以采用的设计原则。', now);
await store.close();
let app;
try {
  app = await startServer({ port: 4318, directory, timeZone, demo: true });
} catch (error) {
  await rm(directory, { recursive: true, force: true });
  throw error;
}
console.log(
  `One Thing sample preview: ${app.url}\nDisposable example records, separate from your actual data. Press Ctrl+C to stop.`,
);
let closing = false;
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, async () => {
    if (closing) return;
    closing = true;
    await app.close();
    await rm(directory, { recursive: true, force: true });
    process.exit(0);
  });
