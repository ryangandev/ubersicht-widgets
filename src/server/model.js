import { randomUUID } from 'node:crypto';

export class RuleError extends Error {
  constructor(message, status = 400, code = 'INVALID_ACTION') {
    super(message);
    this.status = status;
    this.code = code;
  }
}
const fail = (message, status, code) => {
  throw new RuleError(message, status, code);
};
export const createState = () => ({ version: 1, revision: 0, tasks: [], days: {}, operations: [] });
export const localDay = (
  now = new Date(),
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
};
export const shiftDay = (key, offset) => {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
};
const text = (value, label, max, required = true) => {
  if (typeof value !== 'string' || (required && !value.trim()) || value.trim().length > max)
    fail(`${label}${required ? '不能为空，且' : ''}最多 ${max} 个字符。`);
  return value.trim();
};
const iso = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value));
const validDate = (key) =>
  /^\d{4}-\d{2}-\d{2}$/.test(key) &&
  Number.isFinite(Date.parse(`${key}T12:00:00Z`)) &&
  new Date(`${key}T12:00:00Z`).toISOString().slice(0, 10) === key;
export function validateState(state) {
  if (
    !state ||
    state.version !== 1 ||
    !Number.isSafeInteger(state.revision) ||
    state.revision < 0 ||
    !Array.isArray(state.tasks) ||
    !state.days ||
    typeof state.days !== 'object' ||
    Array.isArray(state.days) ||
    !Array.isArray(state.operations)
  )
    fail('数据文件格式不正确，请保留原文件并从备份恢复。', 500, 'INVALID_STORE');
  const ids = new Set();
  for (const task of state.tasks) {
    if (
      !task ||
      typeof task.id !== 'string' ||
      ids.has(task.id) ||
      !iso(task.createdAt) ||
      !iso(task.updatedAt) ||
      (task.completedAt && !iso(task.completedAt)) ||
      (task.archivedAt && !iso(task.archivedAt))
    )
      fail('任务数据不正确。', 500, 'INVALID_STORE');
    text(task.title, '任务', 160);
    text(task.definition, '完成标准', 500, false);
    ids.add(task.id);
  }
  const checkAssignment = (item) => {
    if (
      !item ||
      !ids.has(item.taskId) ||
      !iso(item.selectedAt) ||
      (item.completedAt && !iso(item.completedAt))
    )
      fail('每日任务引用不正确。', 500, 'INVALID_STORE');
    text(item.title, '任务', 160);
    text(item.definition, '完成标准', 500);
  };
  for (const [key, day] of Object.entries(state.days)) {
    if (!validDate(key) || !day || !Array.isArray(day.changes) || (day.secondary && !day.primary))
      fail('每日计划数据不正确。', 500, 'INVALID_STORE');
    if (day.primary) checkAssignment(day.primary);
    if (day.secondary) {
      checkAssignment(day.secondary);
      if (day.primary.taskId === day.secondary.taskId)
        fail('同一任务不能同时是主线和副项。', 500, 'INVALID_STORE');
    }
    for (const change of day.changes) {
      checkAssignment(change);
      if (!['primary', 'secondary'].includes(change.role) || !iso(change.endedAt))
        fail('计划变更记录不正确。', 500, 'INVALID_STORE');
    }
  }
  for (const op of state.operations)
    if (typeof op !== 'string') fail('操作记录不正确。', 500, 'INVALID_STORE');
  return state;
}
export function applyAction(previous, action, { now = new Date(), timeZone } = {}) {
  validateState(previous);
  if (!action || typeof action !== 'object' || typeof action.type !== 'string')
    fail('操作格式不正确。');
  const operationId = text(action.operationId, '操作标识', 80);
  if (previous.operations.includes(operationId)) return previous;
  if (action.revision !== previous.revision)
    fail('记录已在另一处更新。请查看最新状态后重试。', 409, 'STALE_REVISION');
  const state = structuredClone(previous),
    today = localDay(now, timeZone),
    at = now.toISOString();
  const taskById = (id) =>
    state.tasks.find((t) => t.id === id) || fail('找不到这项任务。', 404, 'TASK_NOT_FOUND');
  const currentDay = () => (state.days[today] ||= { primary: null, secondary: null, changes: [] });
  const roleName = (role) => {
    if (!['primary', 'secondary'].includes(role)) fail('任务角色不正确。');
    return role;
  };
  switch (action.type) {
    case 'queue.add': {
      state.tasks.push({
        id: randomUUID(),
        title: text(action.title, '任务', 160),
        definition: text(action.definition ?? '', '完成标准', 500, false),
        createdAt: at,
        updatedAt: at,
        completedAt: null,
        archivedAt: null,
      });
      break;
    }
    case 'queue.edit': {
      const task = taskById(action.taskId);
      if (task.completedAt || task.archivedAt) fail('已完成或已归档的任务不能修改。');
      task.title = text(action.title, '任务', 160);
      task.definition = text(action.definition ?? '', '完成标准', 500, false);
      task.updatedAt = at;
      const day = state.days[today];
      for (const role of ['primary', 'secondary'])
        if (day?.[role]?.taskId === task.id) {
          text(task.definition, '完成标准', 500);
          day[role].title = task.title;
          day[role].definition = task.definition;
        }
      break;
    }
    case 'queue.move': {
      if (![-1, 1].includes(action.direction)) fail('队列方向不正确。');
      const day = state.days[today],
        assigned = new Set([day?.primary?.taskId, day?.secondary?.taskId]);
      const queued = state.tasks.filter(
        (t) => !t.completedAt && !t.archivedAt && !assigned.has(t.id),
      );
      const index = queued.findIndex((t) => t.id === action.taskId),
        other = queued[index + action.direction];
      if (index < 0 || !other) fail('这项任务无法继续移动。');
      const a = state.tasks.findIndex((t) => t.id === action.taskId),
        b = state.tasks.findIndex((t) => t.id === other.id);
      [state.tasks[a], state.tasks[b]] = [state.tasks[b], state.tasks[a]];
      break;
    }
    case 'queue.archive':
    case 'queue.restore': {
      const task = taskById(action.taskId);
      if (action.type === 'queue.archive') {
        const day = state.days[today];
        if (day?.primary?.taskId === task.id || day?.secondary?.taskId === task.id)
          fail('先将任务从今日安排移回 Queue，再归档。');
        if (task.completedAt) fail('已完成的任务已保留在回顾中。');
        task.archivedAt = at;
      } else {
        if (!task.archivedAt) fail('这项任务未归档。');
        task.archivedAt = null;
      }
      task.updatedAt = at;
      break;
    }
    case 'focus.assign': {
      const role = roleName(action.role),
        task = taskById(action.taskId),
        day = currentDay();
      if (task.completedAt || task.archivedAt) fail('只能安排未完成且未归档的任务。');
      if (role === 'secondary' && !day.primary) fail('先选今天的主线，再安排一个可选副项。');
      const other = role === 'primary' ? 'secondary' : 'primary';
      if (day[other]?.taskId === task.id) fail('同一件事不能同时作为主线和副项。');
      if (day[role]?.taskId === task.id) fail('这件事已经在今日安排中。');
      if (day[role]?.completedAt) fail('这一项已经完成。今天可以保留这个完成结果。');
      if (day[role] && action.replace !== true)
        fail('今天已安排这一角色，请明确确认替换。', 409, 'REPLACE_REQUIRED');
      if (day[role]) day.changes.push({ ...day[role], role, endedAt: at, reason: 'replaced' });
      const definition = text(action.definition ?? task.definition, '完成标准', 500);
      task.definition = definition;
      task.updatedAt = at;
      day[role] = {
        taskId: task.id,
        title: task.title,
        definition,
        selectedAt: at,
        completedAt: null,
      };
      break;
    }
    case 'focus.complete': {
      const role = roleName(action.role),
        assignment = state.days[today]?.[role];
      if (!assignment) fail('今天还没有安排这一项。');
      if (typeof action.completed !== 'boolean') fail('完成状态不正确。');
      if (Boolean(assignment.completedAt) === action.completed) fail('完成状态没有改变。');
      const task = taskById(assignment.taskId);
      assignment.completedAt = action.completed ? at : null;
      task.completedAt = assignment.completedAt;
      task.updatedAt = at;
      break;
    }
    case 'focus.unassign': {
      const role = roleName(action.role),
        day = state.days[today];
      if (!day?.[role]) fail('今天还没有安排这一项。');
      if (day[role].completedAt) fail('已完成的任务保留在今日记录中，若要移回请先撤销完成。');
      if (role === 'primary' && day.secondary) fail('先移回副项，再移回主线。');
      day.changes.push({ ...day[role], role, endedAt: at, reason: 'returned' });
      day[role] = null;
      break;
    }
    default:
      fail('不支持的操作。');
  }
  state.revision++;
  state.operations.push(operationId);
  state.operations = state.operations.slice(-1000);
  return validateState(state);
}
export function snapshot(
  state,
  { now = new Date(), timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone } = {},
) {
  validateState(state);
  const today = localDay(now, timeZone),
    plan = state.days[today] || { primary: null, secondary: null, changes: [] };
  const assigned = new Set([plan.primary?.taskId, plan.secondary?.taskId]);
  const queue = state.tasks.filter((t) => !t.completedAt && !t.archivedAt && !assigned.has(t.id));
  const history = Object.entries(state.days)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, day]) => ({
      date,
      ...day,
      status: !day.primary
        ? 'unplanned'
        : day.primary.completedAt
          ? 'completed'
          : date === today
            ? 'in-progress'
            : 'missed',
    }));
  const calendar = Array.from({ length: 28 }, (_, i) => {
    const date = shiftDay(today, i - 27),
      record = history.find((d) => d.date === date);
    return { date, status: record?.status || 'unplanned' };
  });
  const recent = history.filter(
    (d) => d.date >= shiftDay(today, -27) && d.date <= today && d.primary,
  );
  return {
    revision: state.revision,
    today,
    timeZone,
    plan,
    queue,
    archived: state.tasks.filter((t) => t.archivedAt),
    history,
    calendar,
    stats: {
      planned: recent.length,
      completed: recent.filter((d) => d.primary.completedAt).length,
      secondaryCompleted: recent.filter((d) => d.secondary?.completedAt).length,
    },
    updatedAt: now.toISOString(),
  };
}
