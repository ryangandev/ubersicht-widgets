import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createState, applyAction, snapshot, localDay, validateState } from '../server/model.js';

const options = { now: new Date('2026-10-01T17:00:00Z'), timeZone: 'America/Los_Angeles' };
function session() {
  let state = createState();
  return {
    get state() {
      return state;
    },
    act(action, at = options) {
      state = applyAction(
        state,
        { revision: state.revision, operationId: randomUUID(), ...action },
        at,
      );
      return state;
    },
    add(title = '完成可验收的第一版', definition = '通过验收并打开 PR') {
      this.act({ type: 'queue.add', title, definition });
      return state.tasks.at(-1).id;
    },
  };
}
test('one primary, one optional secondary, both with concrete outcomes', () => {
  const s = session(),
    a = s.add(),
    b = s.add('核对说明');
  assert.throws(() => s.act({ type: 'focus.assign', role: 'secondary', taskId: b }), /先选/);
  assert.throws(
    () => s.act({ type: 'focus.assign', role: 'primary', taskId: a, definition: ' ' }),
    /不能为空/,
  );
  s.act({ type: 'focus.assign', role: 'primary', taskId: a });
  assert.throws(() => s.act({ type: 'focus.assign', role: 'secondary', taskId: a }), /不能同时/);
  s.act({ type: 'focus.assign', role: 'secondary', taskId: b });
  assert.equal(snapshot(s.state, options).queue.length, 0);
  assert.throws(() => s.act({ type: 'focus.unassign', role: 'primary' }), /先移回副项/);
  s.act({ type: 'focus.unassign', role: 'secondary' });
  s.act({ type: 'focus.unassign', role: 'primary' });
  assert.equal(snapshot(s.state, options).queue.length, 2);
});
test('replacing a plan requires explicit confirmation and preserves the earlier plan', () => {
  const s = session(),
    a = s.add(),
    b = s.add('第二件事');
  s.act({ type: 'focus.assign', role: 'primary', taskId: a });
  assert.throws(
    () => s.act({ type: 'focus.assign', role: 'primary', taskId: b }),
    (e) => e.code === 'REPLACE_REQUIRED',
  );
  s.act({ type: 'focus.assign', role: 'primary', taskId: b, replace: true });
  const view = snapshot(s.state, options);
  assert.equal(view.plan.primary.taskId, b);
  assert.equal(view.plan.changes[0].taskId, a);
  assert.equal(view.plan.changes[0].reason, 'replaced');
  assert.equal(view.queue[0].id, a);
});
test('completion stays visible and cannot be replaced by another primary until undone', () => {
  const s = session(),
    a = s.add(),
    b = s.add('下一个想法');
  s.act({ type: 'focus.assign', role: 'primary', taskId: a });
  s.act({ type: 'focus.complete', role: 'primary', completed: true });
  const view = snapshot(s.state, options);
  assert.equal(view.history[0].status, 'completed');
  assert.deepEqual(view.stats, { planned: 1, completed: 1, secondaryCompleted: 0 });
  assert.equal(view.queue[0].id, b);
  assert.throws(
    () => s.act({ type: 'focus.assign', role: 'primary', taskId: b, replace: true }),
    /已经完成/,
  );
  s.act({ type: 'focus.complete', role: 'primary', completed: false });
  assert.equal(snapshot(s.state, options).history[0].status, 'in-progress');
});
test('unfinished tasks return to the queue tomorrow without automatic promotion or changing history', () => {
  const s = session(),
    a = s.add(),
    b = s.add('一个副项');
  s.act({ type: 'focus.assign', role: 'primary', taskId: a });
  s.act({ type: 'focus.assign', role: 'secondary', taskId: b });
  const tomorrow = { ...options, now: new Date('2026-10-02T17:00:00Z') };
  let view = snapshot(s.state, tomorrow);
  assert.equal(view.today, '2026-10-02');
  assert.equal(view.plan.primary, null);
  assert.equal(view.queue.length, 2);
  assert.equal(view.history[0].status, 'missed');
  s.act(
    { type: 'queue.edit', taskId: a, title: '更具体的任务', definition: '新的验收标准' },
    tomorrow,
  );
  s.act({ type: 'focus.assign', role: 'primary', taskId: a }, tomorrow);
  s.act({ type: 'focus.complete', role: 'primary', completed: true }, tomorrow);
  view = snapshot(s.state, tomorrow);
  assert.equal(view.history[1].primary.title, '完成可验收的第一版');
  assert.equal(view.history[1].primary.completedAt, null);
  assert.equal(view.history[1].status, 'missed');
  assert.equal(view.history[0].status, 'completed');
  assert.equal(view.calendar.filter((d) => d.status === 'unplanned').length, 26);
  assert.deepEqual(view.stats, { planned: 2, completed: 1, secondaryCompleted: 0 });
});
test('queue ordering and reversible archiving exclude today assignments', () => {
  const s = session(),
    a = s.add('A'),
    b = s.add('B'),
    c = s.add('C');
  s.act({ type: 'focus.assign', role: 'primary', taskId: b });
  s.act({ type: 'queue.move', taskId: c, direction: -1 });
  assert.deepEqual(
    snapshot(s.state, options).queue.map((t) => t.id),
    [c, a],
  );
  assert.throws(() => s.act({ type: 'queue.archive', taskId: b }), /先将任务/);
  s.act({ type: 'queue.archive', taskId: c });
  assert.equal(snapshot(s.state, options).archived[0].id, c);
  s.act({ type: 'queue.restore', taskId: c });
  assert.deepEqual(
    snapshot(s.state, options).queue.map((t) => t.id),
    [c, a],
  );
});
test('stale writes are rejected but retrying the same operation is idempotent', () => {
  const action = { type: 'queue.add', title: '只保存一次', revision: 0, operationId: randomUUID() };
  const state = applyAction(createState(), action, options);
  assert.equal(applyAction(state, action, options), state);
  assert.throws(
    () => applyAction(state, { ...action, operationId: randomUUID() }, options),
    (e) => e.code === 'STALE_REVISION',
  );
  assert.equal(state.tasks.length, 1);
});
test('local dates follow timezone across midnight and daylight saving transitions', () => {
  assert.equal(localDay(new Date('2026-10-02T06:59:59Z'), 'America/Los_Angeles'), '2026-10-01');
  assert.equal(localDay(new Date('2026-10-02T07:00:00Z'), 'America/Los_Angeles'), '2026-10-02');
  assert.equal(localDay(new Date('2026-11-01T08:59:59Z'), 'America/Los_Angeles'), '2026-11-01');
  assert.equal(localDay(new Date('2026-11-01T09:00:00Z'), 'America/Los_Angeles'), '2026-11-01');
});
test('invalid titles, outcomes and corrupted saved dates are rejected without changing prior state', () => {
  const s = session();
  assert.throws(() => s.add(' '), /不能为空/);
  assert.throws(() => s.add('x'.repeat(161)), /最多/);
  const a = s.add();
  s.act({ type: 'focus.assign', taskId: a, role: 'primary' });
  const before = structuredClone(s.state);
  assert.throws(
    () => s.act({ type: 'queue.edit', taskId: a, title: '新任务', definition: '' }),
    /不能为空/,
  );
  assert.deepEqual(s.state, before);
  const bad = structuredClone(s.state);
  bad.days['2026-99-99'] = bad.days['2026-10-01'];
  assert.throws(
    () => validateState(bad),
    (e) => e.code === 'INVALID_STORE',
  );
});
