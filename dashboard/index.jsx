import dashboardData from "./src/dashboard-data.js";
import { buildDashboardSnapshot } from "./src/model.js";
import { getPreset } from "./src/presets.js";

// Übersicht refreshes command-backed widgets reliably. The command's output is
// deliberately unimportant: each render derives a fresh snapshot from the
// local data and current time.
export const command = "date +%s";
export const refreshFrequency = 1000 * 60 * 30;

export const className = `
  position: fixed;
  top: 28px;
  right: 28px;
  width: min(500px, calc(100vw - 56px));
  pointer-events: none;
  user-select: none;
  color: #f6f0e5;
  font-family: "Avenir Next", "SF Pro Display", "Helvetica Neue", sans-serif;
  --dash-bg: rgba(13, 21, 28, 0.78);
  --dash-bg-strong: rgba(8, 13, 18, 0.88);
  --dash-border: rgba(255, 248, 232, 0.1);
  --dash-copy: rgba(246, 240, 229, 0.92);
  --dash-copy-muted: rgba(246, 240, 229, 0.64);
  --dash-good: #8fd6b5;
  --dash-warn: #f2c57c;
  --dash-alert: #f08a6b;
  --dash-accent: #6fc7c0;
  --dash-accent-strong: #bfe6a8;

  .dashboard-board {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 22px;
    border-radius: 24px;
    background:
      radial-gradient(circle at top left, rgba(111, 199, 192, 0.18), transparent 42%),
      radial-gradient(circle at bottom right, rgba(242, 197, 124, 0.14), transparent 38%),
      linear-gradient(180deg, rgba(18, 29, 39, 0.94) 0%, rgba(8, 14, 19, 0.9) 100%);
    border: 1px solid var(--dash-border);
    box-shadow:
      0 24px 48px rgba(0, 0, 0, 0.28),
      inset 0 1px 0 rgba(255, 255, 255, 0.04);
    -webkit-backdrop-filter: blur(26px);
    backdrop-filter: blur(26px);
    animation: dashboard-enter 420ms ease-out;
  }

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
  }

  .title-stack {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .eyebrow {
    font-size: 10px;
    line-height: 1;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--dash-copy-muted);
  }

  .dashboard-title {
    margin: 0;
    font-size: 28px;
    line-height: 1.05;
    letter-spacing: -0.03em;
    font-weight: 700;
    color: var(--dash-copy);
  }

  .dashboard-subtitle {
    margin: 0;
    font-size: 13px;
    line-height: 1.45;
    max-width: 26rem;
    color: var(--dash-copy-muted);
  }

  .preset-pill {
    align-self: stretch;
    padding: 10px 12px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    text-align: right;
  }

  .preset-label {
    display: block;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--dash-copy-muted);
  }

  .preset-value {
    display: block;
    margin-top: 4px;
    font-size: 15px;
    font-weight: 600;
    color: var(--dash-copy);
  }

  .summary-grid,
  .section-grid {
    display: grid;
    gap: 14px;
  }

  .summary-card,
  .section-card,
  .entry-card {
    border: 1px solid rgba(255, 255, 255, 0.07);
    background: rgba(255, 255, 255, 0.045);
  }

  .summary-card {
    padding: 14px 16px;
    border-radius: 18px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.025);
  }

  .summary-value {
    display: block;
    margin-top: 6px;
    font-size: 26px;
    line-height: 1;
    letter-spacing: -0.04em;
    font-weight: 700;
    color: var(--dash-copy);
  }

  .summary-copy {
    margin-top: 7px;
    font-size: 12px;
    line-height: 1.45;
    color: var(--dash-copy-muted);
  }

  .section-card {
    padding: 16px;
    border-radius: 22px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 14px;
  }

  .section-title {
    margin: 0;
    font-size: 16px;
    letter-spacing: -0.02em;
    font-weight: 600;
    color: var(--dash-copy);
  }

  .section-meta {
    font-size: 12px;
    color: var(--dash-copy-muted);
  }

  .entry-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .entry-card {
    padding: 14px;
    border-radius: 18px;
  }

  .entry-header {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    margin-bottom: 10px;
  }

  .status-pill {
    flex: 0 0 auto;
    padding: 5px 9px;
    border-radius: 999px;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    background: rgba(255, 255, 255, 0.06);
    color: var(--dash-copy-muted);
  }

  .entry-title {
    margin: 0;
    font-size: 17px;
    line-height: 1.25;
    letter-spacing: -0.02em;
    font-weight: 600;
    color: var(--dash-copy);
  }

  .entry-supporting {
    margin-top: 6px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--dash-copy-muted);
  }

  .progress-row,
  .metric-row,
  .countdown-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .progress-row {
    margin-top: 12px;
  }

  .progress-bar {
    position: relative;
    flex: 1;
    height: 8px;
    border-radius: 999px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.08);
  }

  .progress-fill {
    position: absolute;
    inset: 0 auto 0 0;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--dash-accent) 0%, var(--dash-accent-strong) 100%);
  }

  .progress-value,
  .metric-value,
  .countdown-value {
    flex: 0 0 auto;
    font-size: 12px;
    font-weight: 600;
    color: var(--dash-copy);
  }

  .metric-row {
    margin-top: 12px;
    justify-content: space-between;
  }

  .metric-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .metric-label {
    font-size: 11px;
    color: var(--dash-copy-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .metric-copy {
    font-size: 13px;
    color: var(--dash-copy);
    font-weight: 600;
  }

  .countdown-stack {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .countdown-subsection {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .countdown-subtitle {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--dash-copy-muted);
  }

  .countdown-row {
    justify-content: space-between;
  }

  .countdown-value {
    font-size: 28px;
    line-height: 1;
    letter-spacing: -0.04em;
  }

  .status-active .status-pill,
  .status-on-track .status-pill {
    color: var(--dash-good);
    background: rgba(143, 214, 181, 0.12);
  }

  .status-upcoming .status-pill {
    color: var(--dash-warn);
    background: rgba(242, 197, 124, 0.14);
  }

  .status-overdue .status-pill,
  .status-needs-check-in .status-pill {
    color: var(--dash-alert);
    background: rgba(240, 138, 107, 0.14);
  }

  .status-completed .status-pill {
    color: var(--dash-copy-muted);
    background: rgba(255, 255, 255, 0.08);
  }

  .empty-state {
    padding: 14px;
    border-radius: 18px;
    border: 1px dashed rgba(255, 255, 255, 0.12);
    color: var(--dash-copy-muted);
    font-size: 13px;
    line-height: 1.5;
  }

  @keyframes dashboard-enter {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const formatPresetName = (preset) =>
  preset.charAt(0).toUpperCase() + preset.slice(1);

const renderSummaryCard = (summary) => (
  <div className="summary-card" key={summary.label}>
    <span className="eyebrow">{summary.label}</span>
    <span className="summary-value">{summary.value}</span>
    <div className="summary-copy">{summary.copy}</div>
  </div>
);

const renderGoal = (goal) => (
  <div className={`entry-card status-${goal.status}`} key={goal.id}>
    <div className="entry-header">
      <span className="eyebrow">{goal.track}</span>
      <span className="status-pill">{goal.statusLabel}</span>
    </div>
    <h3 className="entry-title">{goal.title}</h3>
    <div className="entry-supporting">{goal.timelineLabel}</div>
    <div className="progress-row">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${goal.progressPercent}%` }}
        />
      </div>
      <div className="progress-value">{goal.progressPercent}%</div>
    </div>
  </div>
);

const renderHabit = (habit) => (
  <div className={`entry-card status-${habit.status}`} key={habit.id}>
    <div className="entry-header">
      <span className="eyebrow">{habit.cadenceLabel}</span>
      <span className="status-pill">{habit.statusLabel}</span>
    </div>
    <h3 className="entry-title">{habit.title}</h3>
    <div className="entry-supporting">{habit.checkInLabel}</div>
    <div className="metric-row">
      <div className="metric-group">
        <span className="metric-label">Current streak</span>
        <span className="metric-copy">{habit.streakLabel}</span>
      </div>
      <div className="metric-group">
        <span className="metric-label">Current period</span>
        <span className="metric-copy">{habit.periodProgressLabel}</span>
      </div>
      <div className="metric-value">{habit.lastCheckInLabel}</div>
    </div>
  </div>
);

const renderCountdown = (countdown) => (
  <div className={`entry-card status-${countdown.status}`} key={countdown.id}>
    <div className="entry-header">
      <span className="eyebrow">{countdown.category}</span>
      <span className="status-pill">{countdown.statusLabel}</span>
    </div>
    <div className="countdown-row">
      <div>
        <h3 className="entry-title">{countdown.title}</h3>
        <div className="entry-supporting">{countdown.dateLabel}</div>
      </div>
      <div className="countdown-value">{countdown.valueLabel}</div>
    </div>
    <div className="entry-supporting">{countdown.supportingLabel}</div>
  </div>
);

const renderList = (items, renderer, emptyCopy) =>
  items.length > 0 ? (
    <div className="entry-list">{items.map(renderer)}</div>
  ) : (
    <div className="empty-state">{emptyCopy}</div>
  );

const renderError = (message) => (
  <div className="dashboard-board">
      <div className="section-card status-overdue">
        <div className="section-header">
          <h2 className="section-title">Dashboard data error</h2>
        </div>
        <div className="empty-state">{message}</div>
      </div>
  </div>
);
export const render = () => {
  let snapshot;
  try {
    snapshot = buildDashboardSnapshot(dashboardData, new Date());
  } catch (error) {
    return renderError(error.message);
  }

  const preset = getPreset(snapshot.dashboard.preset);

  const activeGoals = snapshot.goals.active.slice(0, preset.limits.goals);
  const habitCards = snapshot.habits.slice(0, preset.limits.habits);
  const activeCountdowns = snapshot.countdowns.active.slice(
    0,
    preset.limits.activeCountdowns
  );
  const completedCountdowns = preset.showCompletedCountdowns
    ? snapshot.countdowns.completed.slice(0, preset.limits.completedCountdowns)
    : [];

  const summaryCards = [
    {
      label: "Active goals",
      value: snapshot.summary.activeGoals,
      copy: snapshot.summary.goalCopy,
    },
    {
      label: "Habit streaks",
      value: snapshot.summary.habitsOnStreak,
      copy: snapshot.summary.habitCopy,
    },
    {
      label: "Countdowns",
      value: snapshot.summary.activeCountdowns,
      copy: snapshot.summary.countdownCopy,
    },
  ];

  return (
      <div className="dashboard-board" style={{ width: preset.width }}>
        <div className="dashboard-header">
          <div className="title-stack">
            <span className="eyebrow">{snapshot.generatedAtLabel}</span>
            <h1 className="dashboard-title">{snapshot.dashboard.title}</h1>
            <p className="dashboard-subtitle">{snapshot.dashboard.subtitle}</p>
          </div>
          <div className="preset-pill">
            <span className="preset-label">Preset</span>
            <span className="preset-value">
              {formatPresetName(snapshot.dashboard.preset)}
            </span>
          </div>
        </div>

        <div
          className="summary-grid"
          style={{ gridTemplateColumns: preset.summaryColumns }}
        >
          {summaryCards.map(renderSummaryCard)}
        </div>

        <div
          className="section-grid"
          style={{ gridTemplateColumns: preset.sectionColumns }}
        >
          <section className="section-card goals">
            <div className="section-header">
              <h2 className="section-title">Goals</h2>
              <span className="section-meta">
                {snapshot.goals.completed.length} completed
              </span>
            </div>
            {renderList(
              activeGoals,
              renderGoal,
              "No active goals queued. Add a target date to surface the next push."
            )}
          </section>

          <section className="section-card habits">
            <div className="section-header">
              <h2 className="section-title">Habits</h2>
              <span className="section-meta">
                longest streak {snapshot.summary.longestHabitStreak}
              </span>
            </div>
            {renderList(
              habitCards,
              renderHabit,
              "No habits configured. Add daily or weekly check-ins to light this section up."
            )}
          </section>

          <section
            className="section-card countdowns"
            style={{
              gridColumn:
                snapshot.dashboard.preset === "balanced" ? "1 / -1" : undefined,
            }}
          >
            <div className="section-header">
              <h2 className="section-title">Countdowns</h2>
              <span className="section-meta">
                next up {snapshot.summary.nextCountdownLabel}
              </span>
            </div>
            <div className="countdown-stack">
              <div className="countdown-subsection">
                <span className="countdown-subtitle">Active</span>
                {renderList(
                  activeCountdowns,
                  renderCountdown,
                  "No active countdowns. Future milestones will appear here automatically."
                )}
              </div>
              {completedCountdowns.length > 0 ? (
                <div className="countdown-subsection">
                  <span className="countdown-subtitle">Completed</span>
                  {renderList(
                    completedCountdowns,
                    renderCountdown,
                    "Completed countdowns are hidden for this preset."
                  )}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
  );
};
