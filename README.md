# Portable Übersicht Dashboard

This repository now ships a single self-contained widget: `dashboard/`. It replaces the legacy `habit-goal/` and `countdown-timer/` widgets with one click-through desktop surface built around structured presets instead of freeform drag-and-drop placement.

## Legacy Audit

- `habit-goal/` read data via an absolute repository path and treated a habit streak as "days since start", not real check-ins.
- `countdown-timer/` also read data via an absolute path and never split milestones into active vs completed states.
- Both widgets owned their own fixed screen position and styling, so the repo behaved like two unrelated overlays rather than one portable dashboard.

## What Changed

- `dashboard/index.jsx` is now the only widget entrypoint.
- The widget is fully click-through via `pointer-events: none`.
- Dashboard data lives in `dashboard/src/dashboard-data.js` and is imported directly, so there are no hardcoded shell paths.
- Habit streaks are derived from real `checkIns` arrays.
- Countdowns automatically separate into `active` and `completed`.
- Layout is preset-driven with `focus`, `balanced`, and `compact`.
- The separate HabitGoalEditor macOS project is intentionally untouched.

## Layout Presets

Set `dashboard.preset` inside `dashboard/src/dashboard-data.js` to one of:

- `focus`: single-column, fewer cards, hides completed countdowns.
- `balanced`: two-column default, shows all major sections.
- `compact`: narrower dense layout for smaller desktop footprints.

## Data Model

The widget exports a single object with four top-level sections:

```js
{
  version: 1,
  dashboard: { title, subtitle, preset },
  goals: [{ id, title, track, startDate, targetDate, completedAt? }],
  habits: [{ id, title, cadence, targetCount, checkIns: [] }],
  countdowns: [{ id, title, category, targetDate, completedAt? }]
}
```

Notes:

- Dates use local `YYYY-MM-DD`.
- Daily habits require `targetCount: 1`.
- Weekly habits use `targetCount` as the required number of check-ins per week.
- Countdowns move to `completed` automatically once their target date is in the past, or immediately if `completedAt` is present.

## Validation

Run:

```bash
npm run validate
```

That imports the live dashboard data, validates the schema, and prints a compact derived-state summary using the same model code as the widget.
