import { run } from 'uebersicht';

// The desktop and web dashboard share the local service's persisted daily plan.
// Keep this file self-contained so copying dashboard/ is sufficient for Übersicht.
const service = 'http://127.0.0.1:4317';
export const command = `curl --silent --show-error --fail --max-time 3 ${service}/api/widget`;
export const refreshFrequency = 10000;
export const initialState = { output: '', error: null };
export const className = `
  position: fixed;
  left: 32px;
  bottom: 104px;
  width: min(410px, calc(100vw - 64px));
  pointer-events: none;
  user-select: none;
  color: #f5f7ee;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif;
  .focus-surface { padding: 22px; border-radius: 18px; background: linear-gradient(115deg,rgba(17,30,31,.72),rgba(17,30,31,.36)); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); box-shadow: 0 8px 32px rgba(0,0,0,.08); }
  .eyebrow { display:flex; align-items:center; gap:8px; color:#bdcfb4; font-size:10px; letter-spacing:.12em; }
  .signal { width:5px; height:5px; border-radius:50%; background:#bad9a7; }
  h1 { font-family:"Iowan Old Style","Songti SC",Georgia,serif; font-size:30px; font-weight:500; line-height:1.25; letter-spacing:-.035em; margin:13px 0 10px; overflow-wrap:anywhere; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
  .criterion { font-size:12px; color:#d0dacb; line-height:1.7; margin:0; overflow-wrap:anywhere; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .completed { color:#c6e4b4; }
  .secondary { display:flex; gap:10px; align-items:baseline; margin-top:15px; padding-top:12px; border-top:1px solid rgba(232,244,221,.14); font-size:12px; color:#d0dacb; }
  .secondary span { flex:0 0 auto; font-size:10px; color:#9fae96; }
  .secondary strong { font-weight:450; overflow-wrap:anywhere; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .entries { display:flex; flex-wrap:wrap; gap:9px; align-items:center; margin-top:19px; }
  .entry { pointer-events:auto; cursor:pointer; padding:7px 10px; border:1px solid rgba(224,239,215,.2); border-radius:20px; background:rgba(216,233,204,.07); color:#e0ecd8; font:10px -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif; }
  .entry:hover { background:rgba(216,233,204,.16); }
  .entry:focus-visible { outline:2px solid #c5dfb1; outline-offset:3px; }
  .quiet-entry { border-color:transparent; background:transparent; color:#becab4; }
  .connection { font-size:10px; color:#d7c89b; margin:12px 0 0; }
`;
const open = (path) => run(`open '${service}/${path}'`).catch(() => {});
export const render = ({ output = '', error = null }) => {
  let data = null;
  try {
    const parsed = JSON.parse(output);
    if (typeof parsed.today === 'string' && 'primary' in parsed) data = parsed;
  } catch {}
  const primary = data?.primary,
    secondary = data?.secondary;
  return (
    <div className="focus-surface">
      <div className="eyebrow">
        <span className="signal" />
        {primary?.completedAt ? '今日主线 · 已完成' : '今日主线'}
        {data ? ` · ${data.today.slice(5).replace('-', ' / ')}` : ''}
      </div>
      <h1 className={primary?.completedAt ? 'completed' : ''} title={primary?.title || ''}>
        {primary ? primary.title : '给今天留一条主线。'}
      </h1>
      <p className="criterion" title={primary?.definition || ''}>
        {primary
          ? primary.completedAt
            ? '这件事已经完成了。今天的进展，值得留下。'
            : `做到这一步：${primary.definition}`
          : '从 Queue 里选一件具体的事，让今天有一个清楚的完成结果。'}
      </p>
      {secondary && (
        <div className="secondary">
          <span>{secondary.completedAt ? '副项 ✓' : '可选副项'}</span>
          <strong title={secondary.title}>{secondary.title}</strong>
        </div>
      )}
      <div className="entries">
        <button className="entry" onClick={() => open('?capture=1#queue')}>
          ＋ 新想法入 Queue
        </button>
        <button className="entry quiet-entry" onClick={() => open('#today')}>
          今日 / 回顾 ↗
        </button>
      </div>
      {(!data || error) && <p className="connection">暂时无法读取安排 · 请确认 One Thing 已启动</p>}
    </div>
  );
};
