const $ = (selector) => document.querySelector(selector);
const escape = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const labels = {
  completed: '主线完成',
  'in-progress': '今日进行中',
  missed: '主线未完成',
  unplanned: '未安排主线',
};
let state,
  busy = false,
  modal = null,
  toastTimer,
  requestVersion = 0,
  uncertainRequest;
const dialog = $('#task-dialog');
const dateLabel = (date) =>
  new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    $('#toast').hidden = true;
  }, 4000);
}
function error(message) {
  $('#error-message').textContent = message;
  $('#error-banner').hidden = Boolean(!message);
  $('#connection-status').textContent = message ? '连接或保存失败' : '记录已保存在本机';
}
function setBusy(value) {
  busy = value;
  document.querySelectorAll('button').forEach((button) => {
    if (value) {
      button.dataset.wasDisabled = String(button.disabled);
      button.disabled = true;
    } else if (button.dataset.wasDisabled !== undefined) {
      button.disabled = button.dataset.wasDisabled === 'true';
      delete button.dataset.wasDisabled;
    }
  });
}
async function refresh(force = false) {
  const version = ++requestVersion;
  try {
    const response = await fetch('/api/state', { cache: 'no-store' });
    if (!response.ok) throw new Error('无法读取本机记录，请确认服务仍在运行。');
    const next = await response.json();
    if (version !== requestVersion) return;
    const changed = !state || next.revision !== state.revision || next.today !== state.today;
    state = next;
    error('');
    if (changed || force) render();
  } catch (cause) {
    if (version === requestVersion) error(cause.message);
  }
}
async function mutate(action) {
  if (busy || !state) return false;
  setBusy(true);
  ++requestVersion;
  try {
    const signature = JSON.stringify(action);
    const body =
      uncertainRequest?.signature === signature
        ? uncertainRequest.body
        : JSON.stringify({ revision: state.revision, ...action, operationId: crypto.randomUUID() });
    uncertainRequest = { signature, body };
    const send = () =>
      fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
    // One transport retry uses the same operation ID, so a lost reply cannot add a duplicate.
    const response = await send().catch(() => send());
    const data = await response.json();
    uncertainRequest = null;
    if (!response.ok) {
      if (response.status === 409) {
        await refresh(true);
        if (modal) modal.stale = true;
      }
      throw new Error(data.error || '保存失败，请重试。');
    }
    ++requestVersion;
    state = data;
    error('');
    return true;
  } catch (cause) {
    if (dialog.open) {
      $('#dialog-error').textContent = cause.message;
      $('#dialog-error').hidden = false;
    } else error(cause.message);
    return false;
  } finally {
    setBusy(false);
    if (state) render();
    if (modal?.stale) {
      $('#dialog-submit').disabled = true;
      $('#dialog-error').textContent += ' 请关闭窗口，查看最新安排后重新选择。';
    }
  }
}
function route() {
  const view = ['today', 'queue', 'history'].includes(location.hash.slice(1))
    ? location.hash.slice(1)
    : 'today';
  document.querySelectorAll('.view').forEach((section) => {
    section.hidden = section.id !== `view-${view}`;
  });
  document.querySelectorAll('[data-nav]').forEach((link) => {
    if (link.dataset.nav === view) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  document.title = `One Thing · ${{ today: '今日主线', queue: 'Queue', history: '每日回顾' }[view]}`;
}
function openDialog(mode, task = null, role = null) {
  if (!state || busy) return;
  const existing = role && state.plan[role];
  modal = { mode, taskId: task?.id, role, replace: Boolean(existing), revision: state.revision };
  $('#dialog-submit').disabled = false;
  $('#task-form').reset();
  $('#dialog-error').hidden = true;
  $('#task-title').value = task?.title ?? '';
  $('#task-definition').value = task?.definition ?? '';
  $('#task-title').readOnly = mode === 'assign';
  $('#task-definition').required =
    mode === 'assign' ||
    (mode === 'edit' &&
      [state.plan.primary?.taskId, state.plan.secondary?.taskId].includes(task?.id));
  $('#definition-optional').hidden = $('#task-definition').required;
  $('#dialog-kicker').textContent =
    mode === 'assign' ? 'ONE CLEAR OUTCOME' : 'A PLACE FOR YOUR NEXT IDEA';
  const name = role === 'primary' ? '主线' : '副项';
  $('#dialog-title').textContent =
    mode === 'add'
      ? '先记下来。'
      : mode === 'edit'
        ? '把任务写清楚。'
        : existing
          ? `替换今日${name}？`
          : `选为今日${name}。`;
  $('#dialog-description').textContent =
    mode === 'assign'
      ? existing
        ? `当前${name}「${existing.title}」将回到 Queue，今天会保留替换记录。请确认新任务的完成标准。`
        : '把完成标准写清楚，今天就围绕这个具体结果推进。'
      : mode === 'edit'
        ? '修改今天的安排时，过去的每日记录会保留原来的内容。'
        : '放进 Queue，稍后再决定什么时候做。';
  $('#dialog-submit').textContent =
    mode === 'add'
      ? '放入 Queue'
      : mode === 'edit'
        ? '保存修改'
        : existing
          ? `确认替换${name}`
          : `确认今日${name}`;
  dialog.showModal();
  (mode === 'assign' ? $('#task-definition') : $('#task-title')).focus();
}
function closeDialog() {
  if (!busy) {
    dialog.close();
    modal = null;
  }
}
function roleCard(role) {
  const task = state.plan[role],
    primary = role === 'primary',
    name = primary ? '主线' : '副项';
  if (!task)
    return primary
      ? `<article class="main-task empty"><div class="task-role"><i></i>今日主线 / ONE THING</div><h2>今天，最想做成什么？</h2><p>从 Queue 选一件具体的事，再写下做到什么算完成。</p><div class="task-actions"><a class="button primary" href="#queue">从 Queue 选一条主线 ↗</a><button class="button text" data-action="add">先记一个新想法</button></div></article>`
      : `<article class="side-task"><div class="task-role">可选副项 / IF THERE IS ROOM</div><div class="secondary-empty"><b>有余力，再多做一点。</b><p>最多安排一个副项。<br>它不会抢走主线的位置。</p></div><footer>${state.plan.primary ? '<a class="button secondary small" href="#queue">从 Queue 选一个副项 ↗</a>' : '<span class="button text">先选主线，再考虑副项</span>'}</footer></article>`;
  const complete = Boolean(task.completedAt);
  return `<article class="${primary ? 'main-task' : 'side-task'}${complete ? ' done' : ''}"><div class="task-top"><div class="task-role">${primary ? '<i></i>' : ''}今日${name} / ${primary ? 'ONE THING' : 'OPTIONAL'}</div><span class="status-tag">${complete ? '已完成 ✓' : '进行中'}</span></div><${primary ? 'h2' : 'h3'}>${escape(task.title)}</${primary ? 'h2' : 'h3'}><div class="criterion-block"><span>做到这里，算完成</span><p>${escape(task.definition)}</p></div><${primary ? 'div class="task-actions"' : 'footer'}><button class="button ${complete ? 'secondary' : 'primary'}${primary ? '' : ' small'}" data-action="complete" data-role="${role}">${complete ? '撤销完成' : `✓ 完成今日${name}`}</button><div class="other-actions">${complete ? '' : `<button class="button text" data-action="edit" data-id="${task.taskId}">编辑</button><button class="button text" data-action="unassign" data-role="${role}" ${primary && state.plan.secondary ? 'disabled title="先将副项移回 Queue，再移回主线"' : ''}>移回 Queue</button>`}</div></${primary ? 'div' : 'footer'}></article>`;
}
function renderQueue() {
  if (!state) return;
  const query = $('#queue-search').value.trim().toLocaleLowerCase();
  const visible = state.queue.filter((task) =>
    `${task.title} ${task.definition}`.toLocaleLowerCase().includes(query),
  );
  $('#queue-summary').textContent = query
    ? `找到 ${visible.length} 项 / 全部 ${state.queue.length} 项`
    : `${state.queue.length} 项在等你选择`;
  $('#queue-list').innerHTML = visible.length
    ? visible
        .map((task) => {
          const index = state.queue.findIndex((item) => item.id === task.id);
          const parts = Object.fromEntries(
            new Intl.DateTimeFormat('en-US', {
              timeZone: state.timeZone,
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            })
              .formatToParts(new Date(task.createdAt))
              .map((p) => [p.type, p.value]),
          );
          const created = `${parts.year}-${parts.month}-${parts.day}`;
          return `<article class="queue-card"><div class="queue-order"><button data-action="move" data-id="${task.id}" data-direction="-1" aria-label="上移 ${escape(task.title)}" ${index === 0 ? 'disabled' : ''}>↑</button><small>${String(index + 1).padStart(2, '0')}</small><button data-action="move" data-id="${task.id}" data-direction="1" aria-label="下移 ${escape(task.title)}" ${index === state.queue.length - 1 ? 'disabled' : ''}>↓</button></div><div class="queue-content"><h3>${escape(task.title)}</h3>${task.definition ? `<p>${escape(task.definition)}</p>` : ''}<div class="queue-meta"><span>${escape(dateLabel(created))} 记下</span>${!task.definition ? '<span>选择时再补完成标准</span>' : ''}</div></div><div class="queue-tools"><button class="button secondary small" data-action="assign" data-role="primary" data-id="${task.id}" ${state.plan.primary?.completedAt ? 'disabled title="今日主线已经完成"' : ''}>${state.plan.primary ? '替换' : '选为'}主线</button><button class="button secondary small" data-action="assign" data-role="secondary" data-id="${task.id}" ${!state.plan.primary || state.plan.secondary?.completedAt ? 'disabled title="先选择主线；完成的副项会保留到明天"' : ''}>${state.plan.secondary ? '替换' : '选为'}副项</button><div class="text-actions"><button class="button text" data-action="edit" data-id="${task.id}">编辑</button><button class="button text danger" data-action="archive" data-id="${task.id}">归档</button></div></div></article>`;
        })
        .join('')
    : `<div class="empty-state"><b>${query ? '没有找到这项任务。' : 'Queue 留空，也很好。'}</b>${query ? '试试其他关键词。' : '想法来了，随时在上面记下来。'}</div>`;
  $('#archive-count').textContent = state.archived.length;
  $('#archive-list').innerHTML =
    state.archived
      .map(
        (task) =>
          `<div class="archive-item"><span>${escape(task.title)}</span><button class="button text" data-action="restore" data-id="${task.id}">恢复到 Queue</button></div>`,
      )
      .join('') || '<p>没有已归档的任务。</p>';
}
function historyTask(task, name) {
  return task
    ? `<div class="history-task"><span>${name}</span><div><b>${escape(task.title)} ${task.completedAt ? '✓' : '· 未完成'}</b><p>${escape(task.definition)}</p></div></div>`
    : '';
}
function renderHistory() {
  if (!state) return;
  const { planned, completed, secondaryCompleted } = state.stats;
  $('#history-stats').innerHTML =
    `<article class="stat"><span>主线完成 / 最近四周</span><strong>${completed}<small>/ ${planned}</small></strong><p>${planned ? '只统计安排过主线的日子' : '还没有安排过主线'}</p></article><article class="stat"><span>完成比例</span><strong>${planned ? Math.round((completed / planned) * 100) : 0}<small>%</small></strong><p>${planned ? '主线完成日 / 主线安排日' : '从今天的一件事开始'}</p></article><article class="stat"><span>副项完成 / 最近四周</span><strong>${secondaryCompleted}</strong><p>主线之外，多完成的小事</p></article>`;
  $('#calendar').innerHTML = state.calendar
    .map(
      (day) =>
        `<button class="day-cell ${day.status}" data-action="day" data-date="${day.date}" aria-label="${day.date} ${labels[day.status]}" title="${day.date} · ${labels[day.status]}">${Number(day.date.slice(8))}</button>`,
    )
    .join('');
  const filter = $('#history-filter').value;
  const rows = state.history.filter((day) => filter === 'all' || day.status === filter);
  $('#history-list').innerHTML =
    rows
      .map(
        (day) =>
          `<article class="history-day" id="day-${day.date}"><header><h3>${escape(dateLabel(day.date))}${day.date === state.today ? ' / 今天' : ''}<small class="history-year">${day.date.slice(0, 4)}</small></h3><span class="day-status ${day.status}">${labels[day.status]}</span></header>${historyTask(day.primary, '主线')}${historyTask(day.secondary, '副项')}${!day.primary ? '<div class="history-task"><p>这一天没有保留主线安排。</p></div>' : ''}${day.changes.length ? `<details><summary>查看 ${day.changes.length} 次安排调整</summary>${day.changes.map((change) => `<p>${change.role === 'primary' ? '主线' : '副项'}「${escape(change.title)}」${change.reason === 'returned' ? '移回了 Queue' : '被替换'}。</p>`).join('')}</details>` : ''}</article>`,
      )
      .join('') ||
    '<div class="empty-state"><b>完成的事，会留在这里。</b>今天的安排与完成结果会自动记录。</div>';
}
function render() {
  $('#demo-banner').hidden = !state.demo;
  $('#today-label').textContent =
    `${state.today.replaceAll('-', ' / ')} · ${dateLabel(state.today)}`;
  $('#timezone-label').textContent = state.timeZone;
  $('#queue-count').textContent = state.queue.length;
  $('#today-plan').innerHTML = roleCard('primary') + roleCard('secondary');
  renderQueue();
  renderHistory();
  route();
  if (busy)
    document.querySelectorAll('[data-action]').forEach((button) => {
      button.disabled = true;
    });
}
$('#capture-open').addEventListener('click', () => openDialog('add'));
$('#dialog-close').addEventListener('click', closeDialog);
$('#dialog-cancel').addEventListener('click', closeDialog);
dialog.addEventListener('cancel', (event) => {
  if (busy) event.preventDefault();
  else modal = null;
});
$('#task-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!modal || busy) return;
  const action =
    modal.mode === 'assign'
      ? {
          type: 'focus.assign',
          taskId: modal.taskId,
          role: modal.role,
          replace: modal.replace,
          definition: $('#task-definition').value,
        }
      : {
          type: modal.mode === 'add' ? 'queue.add' : 'queue.edit',
          taskId: modal.taskId,
          title: $('#task-title').value,
          definition: $('#task-definition').value,
        };
  if (await mutate({ ...action, revision: modal.revision })) {
    closeDialog();
    toast(
      action.type === 'queue.add'
        ? '已放入 Queue'
        : action.type === 'focus.assign'
          ? '今日安排已保存'
          : '修改已保存',
    );
  }
});
$('#quick-capture').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (busy) return;
  if (await mutate({ type: 'queue.add', title: $('#queue-title').value })) {
    $('#queue-title').value = '';
    $('#queue-title').focus();
    toast('已放入 Queue，继续今天的主线。');
  }
});
document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button || busy || !state) return;
  const { action, id, role, date, direction } = button.dataset;
  const task =
    [...state.queue, ...state.archived].find((item) => item.id === id) ||
    (() => {
      const item = [state.plan.primary, state.plan.secondary].find((item) => item?.taskId === id);
      return item && { id: item.taskId, title: item.title, definition: item.definition };
    })();
  if (action === 'add') return openDialog('add');
  if (action === 'assign' || action === 'edit') return openDialog(action, task, role);
  if (action === 'day') {
    $('#history-filter').value = 'all';
    renderHistory();
    const day = $(`#day-${date}`);
    if (day) {
      day.scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        block: 'center',
      });
      day.setAttribute('tabindex', '-1');
      day.focus({ preventScroll: true });
    } else toast('这一天没有安排主线。');
    return;
  }
  const request =
    action === 'complete'
      ? { type: 'focus.complete', role, completed: !state.plan[role].completedAt }
      : action === 'unassign'
        ? { type: 'focus.unassign', role }
        : action === 'move'
          ? { type: 'queue.move', taskId: id, direction: Number(direction) }
          : { type: `queue.${action}`, taskId: id };
  if (await mutate(request))
    toast(
      action === 'complete'
        ? request.completed
          ? '做成了。今天的结果已留下。'
          : '已撤销完成'
        : action === 'unassign'
          ? '已移回 Queue'
          : action === 'archive'
            ? '已归档，可以随时恢复'
            : action === 'restore'
              ? '已恢复到 Queue'
              : 'Queue 顺序已保存',
    );
});
$('#queue-search').addEventListener('input', renderQueue);
$('#history-filter').addEventListener('change', renderHistory);
$('#retry').addEventListener('click', () => refresh(true));
window.addEventListener('hashchange', route);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && !busy && !dialog.open) refresh();
});
route();
await refresh(true);
if (new URL(location.href).searchParams.get('capture') === '1' && state) {
  openDialog('add');
  history.replaceState(null, '', location.pathname + location.hash);
}
setInterval(() => {
  if (!document.hidden && !busy && !dialog.open) refresh();
}, 5000);
