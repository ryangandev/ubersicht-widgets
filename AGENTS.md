# Agent instructions

This repository contains One Thing, a quiet Übersicht daily-focus widget and a local planning/history dashboard for macOS.

## Start here

Read [docs/README.md](docs/README.md), then only the section routed to your task.
For status or the next task, read [Current state](docs/status.md#current-state) and [Next steps](docs/status.md#next-steps).
Before changing the widget, read [Runtime](docs/architecture.md#runtime) and [Data and validation](docs/architecture.md#data-and-validation).

## Commands

- `npm run check`: domain, persistence, HTTP integration, JavaScript syntax, and actual widget JSX compilation.
- `npm start`: real empty-by-default dashboard on `http://127.0.0.1:4317`.
- `npm run demo`: labeled disposable example records on port 4318.
- `git status --short --branch`: check local changes and branch tracking before work.
- For desktop installation and manual checks, see [Verification](docs/architecture.md#verification).

## Rules that prevent silent errors

- The live widget is self-contained in `dashboard/index.jsx` and reads the local service; `src/server/model.js` owns both displays' data rules.
  See [Data and validation](docs/architecture.md#data-and-validation).
- Preserve desktop click-through except for the two explicit entry buttons, and preserve portability; avoid machine-specific absolute paths.
- Never commit `.data/`, populate real personal progress from demo records, or silently promote queued tasks into a daily role.
  See [Runtime](docs/architecture.md#runtime).
- Keep non-widget JavaScript under `src/`; Übersicht recursively treats other `.js` files as widgets when the repo is its Widgets Folder.
- Keep the separate HabitGoalEditor project outside this repository's scope.
  See [Scope](docs/architecture.md#scope).
- Reproduce native runtime bugs in Übersicht before fixing them; browser preview and automated checks do not establish native acceptance.
  See [Verification](docs/architecture.md#verification).
- Update facts in their owning documents with the code change; remove resolved status items and preserve stable headings.
  See [Ownership and maintenance](docs/README.md#ownership-and-maintenance).
- Never manually edit generated files or `CHANGELOG.md`, add an agent co-author to commits, or use an em dash in authored text.
