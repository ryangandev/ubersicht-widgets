# Project status

As of: 2026-10-02, America/Los_Angeles.
Implementation branch: `codex/daily-focus-queue`, based on `main` at `b499474d4c9f240cffcf03245ed83954ff0be1cc`.
Review PR: [#2 - One Thing daily focus, idea queue and daily review](https://github.com/ryangandev/ubersicht-widgets/pull/2).
The implementation and design study are committed and pushed; the PR is open for acceptance and has not been merged.

## Current state

Concept 10 One Thing has been expanded into a functioning daily-focus widget and local dashboard at Ryan's request.
The desktop shows one concrete main task, one optional quieter secondary task, and Queue/dashboard entry buttons.
The dashboard handles capture, deliberate daily selection, completion, and historical review.

| Area                        | Status                       | Evidence or limit                                                                                                                                                                                              |
| --------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop widget              | Implemented, engine checked  | Actual installed Übersicht 1.6 compiler and React/Emotion renderer load only `dashboard/index.jsx`, with no widget compilation errors.                                                                         |
| Today and Queue             | Implemented, browser checked | Capture from desktop entry, required criteria, daily roles, completion/undo, search, reorder, archive/restore, and conflict feedback.                                                                          |
| Daily history               | Implemented                  | Preserved role snapshots, distinct completion states, four-week calendar and metrics, and adjustment records.                                                                                                  |
| Persistence and API         | Implemented, tested          | Serialized atomic saves, revision conflict protection, deduplication, restart persistence, corrupt-file preservation, and local-only API.                                                                      |
| Automated checks            | 17 tests passed              | `npm run check` on 2026-10-01; includes regression protection against discovering backend scripts as widgets.                                                                                                  |
| Sample review               | Available                    | `npm run demo`; clearly labeled disposable records, separate from real data.                                                                                                                                   |
| Native Übersicht acceptance | Window rendering verified    | The actual foreground WebKit window displays the empty normal state after repairing the local directory preference; second-Space observation, interaction shortcut, click-through, and refresh remain pending. |
| Agent documentation         | Implemented                  | Shared `AGENTS.md`, `CLAUDE.md` import, documentation routes, status, architecture, and updated design contract.                                                                                               |
| Ten design concepts         | Retained as review material  | The selected direction is 10; the original gallery remains available for comparison.                                                                                                                           |

The old disconnected modular data path has been replaced by one server model consumed by the dashboard and widget.
Example dates and completion records are confined to the demo and tests; normal usage starts empty.
The desktop widget is the main interface; the website is its Queue planning and daily-review companion.
The installed engine initially discovered backend, test, and gallery scripts as widgets when the entire repository was its Widgets Folder.
Moving non-widget JavaScript under ignored `src/` paths resolved the reproduced errors.

Review images: [today](previews/today.jpg), [Queue](previews/queue.jpg), [daily history](previews/history.jpg), and [desktop preview](previews/desktop.jpg).
These show labeled sample records and a simulated desktop, not Ryan's actual progress or an observed native widget.
The separate [installed-engine render](previews/widget-engine.jpg) shows the real empty state through Übersicht's renderer in a browser, rather than the macOS desktop window.
The separate [native window capture](previews/native-widget.jpg) shows the actual Übersicht foreground WebKit window after its launch configuration was repaired.
The capture isolates the app window; its white transparent backdrop is not the desktop wallpaper.
The [review evidence](previews/verification.md) records the browser workflows, dimensions, and native inspection limitation.

## Needs Ryan

Review the PR's daily-focus workflow and visual direction.
The native widget is running, but interaction and second-desktop acceptance remain; follow [Desktop check](architecture.md#desktop-check).
Ryan asked to see it on the second desktop.
Übersicht's window joins all Spaces; automated global switching did not leave desktop 1, so observation on desktop 2 remains pending.
Choose your real daily main task and criterion in the normal dashboard when beginning personal use.

## Open decisions

No product decision blocks this initial implementation.
Optional future choices include automatic startup at login, richer scheduling, and multi-device sync after the daily-focus workflow has been accepted.
These are not part of the current implementation.

## Next steps

1. Ryan reviews the desktop widget in the PR; the labeled demo supports companion workflow review.
2. Switch to desktop 2 and verify the already-running Übersicht widget against the normal service on port 4317.
   Record click-through, entry buttons, and ten-second refresh separately from the established native window render.
3. Address acceptance feedback within the one-primary/one-secondary, quiet-desktop contract.
4. After acceptance, begin actual daily records through Queue and Today.

## Intentional exclusions

- No cloud service, account, external messaging, or multi-device sync.
- No automatic promotion, task rotation, second primary after completion, or full backlog on the desktop.
- No automatic login installation, native application installation, or changes to the separate HabitGoalEditor.
- No permanent-delete control, automatic task migration from old illustrative goals, or guessed personal completion data.
- No PR merge or desktop installation is performed as part of preparing this PR.

## Status check procedure

1. Read this section and [Next steps](#next-steps), then check `git status --short --branch`, `git log -5 --oneline`, and `git branch -vv`.
2. Refresh GitHub branch/PR state when needed; a cached `origin/main` is not proof of current remote state.
3. Follow [Code map](architecture.md#code-map) and confirm both displays still consume the same model.
4. Run `npm run check` after behavior changes and the affected browser or desktop acceptance scenario.
5. Update the date, evidence, unresolved acceptance items, and next actions here with the implementation change.
   Keep local checks, commit/push, PR, installation, and native acceptance distinct.
