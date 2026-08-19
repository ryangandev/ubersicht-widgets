// Keep the live widget self-contained. Übersicht loads this file directly and
// does not need to resolve local modules or restore callback-managed state.
export const command = "date +%s";
export const refreshFrequency = 1000 * 60 * 30;

const dashboard = {
  title: "Momentum Board",
  subtitle: "Goals, habits, and the next milestone.",
  goals: [
    { title: "Portable dashboard rollout", start: "2026-08-10", target: "2026-08-31" },
    { title: "Build Java backend", start: "2026-08-01", target: "2026-09-15" },
  ],
  habits: [
    { title: "Deep work block", detail: "Done today", streak: 5, tone: "good" },
    { title: "Gym", detail: "2/3 this week", streak: 2, tone: "active" },
    { title: "Mobility reset", detail: "Not checked in", streak: 0, tone: "quiet" },
  ],
  countdowns: [
    { title: "Next Dexa scan", category: "Health", target: "2026-09-24" },
    { title: "First Philly visit", category: "Travel", target: "2026-10-12" },
    { title: "Walmart contract ends", category: "Work", target: "2026-12-31" },
  ],
};

const dayMs = 24 * 60 * 60 * 1000;
const localDate = (value) => new Date(`${value}T12:00:00`);
const daysUntil = (value, now) => Math.max(0, Math.ceil((localDate(value) - now) / dayMs));
const goalProgress = (goal, now) => {
  const start = localDate(goal.start).getTime();
  const target = localDate(goal.target).getTime();
  return Math.max(0, Math.min(100, Math.round(((now - start) / (target - start)) * 100)));
};
const dayLabel = (days) => `${days} ${days === 1 ? "day" : "days"}`;

export const className = `
  position: fixed;
  top: 28px;
  right: 28px;
  width: min(420px, calc(100vw - 56px));
  pointer-events: none;
  user-select: none;
  color: rgba(248, 250, 252, 0.96);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  .board { padding: 18px; border: 1px solid rgba(255,255,255,.13); border-radius: 22px; background: linear-gradient(150deg,rgba(22,31,44,.94),rgba(10,15,23,.9)); box-shadow: 0 20px 52px rgba(0,0,0,.28), inset 0 1px rgba(255,255,255,.06); backdrop-filter: blur(20px); }
  .heading { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; margin-bottom:16px; }
  .eyebrow { display:block; color:rgba(226,232,240,.57); font-size:10px; letter-spacing:.14em; text-transform:uppercase; }
  h1 { margin:5px 0 4px; font-size:24px; line-height:1.05; letter-spacing:-.035em; }
  .subtitle { margin:0; color:rgba(226,232,240,.62); font-size:12px; line-height:1.4; }
  .today { flex:0 0 auto; padding:7px 9px; border:1px solid rgba(255,255,255,.1); border-radius:10px; color:rgba(226,232,240,.67); font-size:10px; text-align:right; }
  .section { margin-top:12px; padding:13px; border:1px solid rgba(255,255,255,.08); border-radius:15px; background:rgba(255,255,255,.035); }
  .section-top { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:10px; }
  h2 { margin:0; font-size:13px; letter-spacing:-.01em; }
  .meta { color:rgba(226,232,240,.53); font-size:10px; }
  .row { padding:9px 0; border-top:1px solid rgba(255,255,255,.065); }
  .row:first-of-type { padding-top:0; border-top:0; } .row:last-child { padding-bottom:0; }
  .row-top { display:flex; align-items:baseline; justify-content:space-between; gap:12px; }
  .name { font-size:12px; font-weight:600; line-height:1.25; } .label { color:rgba(226,232,240,.55); font-size:10px; white-space:nowrap; }
  .progress { height:4px; margin-top:7px; overflow:hidden; border-radius:999px; background:rgba(255,255,255,.1); }
  .progress > span { display:block; height:100%; border-radius:inherit; background:linear-gradient(90deg,#6ee7d0,#9ed7a6); }
  .habit-detail { margin-top:3px; color:rgba(226,232,240,.58); font-size:10px; } .tone-good .habit-detail { color:#8ce1bc; } .tone-active .habit-detail { color:#e9c978; }
  .countdown { display:flex; align-items:center; justify-content:space-between; gap:12px; } .days { color:#9ee4dd; font-size:18px; font-weight:700; letter-spacing:-.04em; }
`;

export const render = () => {
  const now = new Date();
  const date = now.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return <div className="board">
    <header className="heading"><div><span className="eyebrow">Desktop dashboard</span><h1>{dashboard.title}</h1><p className="subtitle">{dashboard.subtitle}</p></div><span className="today">{date}<br />Focus</span></header>
    <section className="section"><div className="section-top"><h2>Goals</h2><span className="meta">2 active</span></div>{dashboard.goals.map((goal) => { const progress = goalProgress(goal, now); const days = daysUntil(goal.target, now); return <div className="row" key={goal.title}><div className="row-top"><span className="name">{goal.title}</span><span className="label">{dayLabel(days)} left</span></div><div className="progress"><span style={{ width: `${progress}%` }} /></div></div>; })}</section>
    <section className="section"><div className="section-top"><h2>Habits</h2><span className="meta">today</span></div>{dashboard.habits.map((habit) => <div className={`row tone-${habit.tone}`} key={habit.title}><div className="row-top"><span className="name">{habit.title}</span><span className="label">{habit.streak ? `${habit.streak}d streak` : "Start today"}</span></div><div className="habit-detail">{habit.detail}</div></div>)}</section>
    <section className="section"><div className="section-top"><h2>Next up</h2><span className="meta">countdowns</span></div>{dashboard.countdowns.map((item) => { const days = daysUntil(item.target, now); return <div className="row countdown" key={item.title}><div><div className="name">{item.title}</div><div className="habit-detail">{item.category}</div></div><div><div className="days">{days}</div><div className="label">days</div></div></div>; })}</section>
  </div>;
};
