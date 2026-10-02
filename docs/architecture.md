# Architecture

## Code map

| File                                                                       | Responsibility                                                                                          |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `dashboard/index.jsx`                                                      | Self-contained live Übersicht renderer, CSS, service polling, and two dashboard entry buttons.          |
| `dashboard/widget.json`                                                    | Widget metadata.                                                                                        |
| `server/model.js`                                                          | The single task and daily-plan model, date boundaries, action rules, snapshots, and historical metrics. |
| `server/store.js`                                                          | Serialized writes, revision checks, operation deduplication, process lock, and atomic JSON persistence. |
| `server/http.js`                                                           | Local HTTP API, application assets, host/origin checks, and preview endpoint.                           |
| `server/index.js`                                                          | Normal service entrypoint and shutdown.                                                                 |
| `server/widget-build.js`                                                   | Browser compilation of the actual widget JSX.                                                           |
| `public/index.html`, `public/app.js`, `public/styles.css`                  | Today, Queue, and daily-history pages with responsive layouts.                                          |
| `public/widget-preview-*`, `public/jsx-dom.js`, `public/widget-runtime.js` | Browser desktop simulation and native `run()` substitution for preview entry clicks.                    |
| `scripts/demo.js`                                                          | Clearly labeled sample records in a disposable directory on port 4318.                                  |
| `scripts/validate.js`                                                      | Syntax checks and real widget JSX compilation.                                                          |
| `tests/`                                                                   | Domain, disk persistence, and local HTTP integration checks.                                            |
| `designs/desktop-study/`                                                   | The original ten design concepts and comparison gallery.                                                |
| `.github/workflows/check.yml`                                              | Node 24 CI running `npm ci` and `npm run check`.                                                        |

The previous disconnected `dashboard/src/` goal/habit/countdown model and its validation script were removed with the daily-focus replacement.
There is one data/model source for both the web dashboard and the live widget.

## Runtime

The Node service binds to `127.0.0.1:4317` by default.
It serves the dashboard and these JSON endpoints:

| Endpoint            | Result                                                                        |
| ------------------- | ----------------------------------------------------------------------------- |
| `GET /api/state`    | Today, Queue, archives, daily history, and four-week metrics.                 |
| `GET /api/widget`   | Today's primary and secondary snapshots, local date, and revision.            |
| `POST /api/actions` | An explicit action with a revision and operation ID; returns the saved state. |
| `GET /api/export`   | Downloadable versioned source data for backup.                                |

Übersicht directly loads `dashboard/index.jsx`.
Its `curl` command reads `/api/widget` every ten seconds with a three-second timeout.
The installed widget needs the service running but has no repository-relative imports or machine-specific shell paths.
The local dashboard polls every five seconds while visible, except during a confirmation dialog or save.
Both displays derive today's plan from the same stored data.

The desktop reminder sits 32 pixels from the left edge and 104 pixels above the bottom.
Its width is `min(410px, calc(100vw - 64px))`.
Titles clamp to three lines, the completion criterion to two, and the optional secondary title to two.
The translucent sage and charcoal surface extends the small bottom-left typography of concept 10.
Queue contents, charts, habit streaks, and countdowns stay off the desktop.

The widget root has `pointer-events: none`; only its two entry buttons opt into pointer events.
They invoke Übersicht's `run()` to open fixed localhost URLs through macOS `open`.
User-entered text is never interpolated into a shell command.
Clicks require Übersicht's configured interaction shortcut and accessibility permission as described in its [official documentation](https://github.com/felixhageloh/uebersicht#running-shell-commands).
The preview substitutes URL navigation for `run()` and injects a DOM JSX factory with [esbuild](https://esbuild.github.io/api/#inject).
It compiles the actual renderer and style, while the wallpaper, Dock, and menu bar are simulations.
Native event handling and Emotion's CSS remain separate acceptance items.

## Data and validation

### Daily contract

- Queue holds uncompleted, unarchived tasks that are not assigned today.
  Ideas need only a title; choosing a daily role also requires a completion criterion.
- A day has one primary task and at most one optional secondary task.
  The secondary requires a primary and cannot be the same task.
- Replacing an occupied role requires explicit confirmation.
  The old task returns to Queue and its previous assignment remains in that day's adjustment history.
- Completed roles remain visible and cannot be replaced until completion is explicitly undone.
  There is no automatic second primary after the first is completed.
- Midnight is determined in the configured timezone.
  Unfinished assignments reappear in Queue; a new day starts without a selected primary.
- Day records preserve title, criterion, selection time, and completion time.
  Editing or completing a task on a later day does not rewrite earlier snapshots.
- The four-week completion proportion uses days with a primary as its denominator.
  Unplanned days and planned-but-unfinished days have different states.
  The daily list keeps the full saved history, not only four weeks.
- Queue order can be changed with up/down controls.
  Archiving is reversible; there is no permanent-delete control.

### Persistence and concurrent use

Normal data lives at `.data/focus.json` beside the repository's server.
The file has a version, revision, task collection, day snapshots, and recent operation IDs.
The directory, dependencies, logs, and review data are ignored by Git.
Normal startup creates an empty state when no file exists; it does not populate example personal progress.

Each action validates against the latest revision and is written through a private temporary file, file sync, and atomic rename before success is acknowledged.
A failed disk write leaves the previous in-memory and on-disk state intact.
A corrupt existing file stops startup and is preserved rather than replaced with an empty file.
A process lock prevents a second service from opening the same directory.
After an abnormal exit, a lock whose PID no longer exists is recovered on startup.
A malformed lock requires investigation; it is not automatically removed.

Writes are serialized, and stale revisions return 409 instead of overwriting another page's changes.
The browser keeps confirmation tied to the revision at which the dialog opened.
On conflict it preserves the draft, refreshes the state, and asks the user to close and reconsider the confirmation.
Transport retries reuse the same operation ID, so a lost response does not create another task.
The last 1,000 operation IDs are retained for deduplication.

API requests reject unexpected hosts and cross-origin browser requests.
Writes require JSON, capped at 16 KiB; split UTF-8 request chunks are decoded together.
Static routes expose an explicit asset list, not the repository or data directory.
Task text is escaped in the web UI and rendered as text by the widget.

### Configuration and backup

| Environment variable | Default             | Meaning                                                                                                 |
| -------------------- | ------------------- | ------------------------------------------------------------------------------------------------------- |
| `PORT`               | `4317`              | Local service port; the installed widget and open helper use 4317, so keep the default for desktop use. |
| `FOCUS_DATA_DIR`     | Repository `.data/` | Use an absolute path to store records elsewhere.                                                        |
| `FOCUS_TIME_ZONE`    | Computer timezone   | IANA timezone used for day boundaries; for example `America/Los_Angeles`.                               |

Use **导出记录** to save a JSON backup.
For restoration, stop the service, preserve the current `focus.json` separately, and place the exported JSON at the configured `focus.json` path before restarting.
Startup validates the backup; preserve any rejected source file for investigation.
There is no cloud sync, authentication account, database service, or automatic login startup in this version.
The demo uses a separate temporary directory and removes it on graceful shutdown.

## Verification

### Automated checks

```sh
npm ci
npm run check
```

`npm test` verifies daily-role limits, confirmation, completion and undo, midnight rollover, historical snapshots, timezone/DST dates, queue ordering and archive restoration, stale and duplicate writes, persistence after restart, disk failure, corrupt-data preservation, process locking, HTTP restrictions, UTF-8 input, exports, and application assets.
`npm run validate` checks JavaScript syntax and compiles the actual widget JSX.
Tests inject dates and use isolated temporary directories and ephemeral ports.
The normal service has no client-controlled clock or test mutation endpoint.

### Browser acceptance

```sh
npm run demo
```

Open `http://127.0.0.1:4318` and `/widget-preview`.
The example banner distinguishes sample records from actual personal progress.

1. Use the desktop Queue entry and confirm that it opens a focused capture dialog.
2. Add a title, choose it as a role, and supply the required completion criterion.
3. Check replacement confirmation, one-primary/one-secondary limits, completion, and undo.
4. Check Queue reordering, search, editing, archiving, and restoration.
5. Review calendar statuses, day details, role criteria, and four-week metrics.
6. Refresh the page and restart a normal service against the same isolated directory to verify saved records remain.
7. Open two pages, change one while the other has a confirmation dialog open, and confirm the old save is rejected.
8. Inspect desktop and narrow layouts for clipping, long-title bounds, and readable supporting text.

Screenshots and the actual observed checks are recorded in [status](status.md#current-state).
Browser checks establish the app workflow and simulated widget output, not native desktop acceptance.

### Desktop check

1. Run the normal service on port 4317 and use its empty record to choose a main task.
2. Use Übersicht's **Open Widgets Folder** and copy `dashboard/` into it.
   Confirm the installed `index.jsx` matches the version being tested.
3. Refresh Übersicht and check its error console and the visible reminder.
4. Configure its interaction shortcut and accessibility permission.
   Use both entry buttons and check that Queue capture and the dashboard open correctly.
5. Click through task text and surrounding empty space to the desktop beneath it.
6. Select, edit, complete, and undo a main task in the dashboard.
   Check that the desktop updates within the ten-second polling interval.
7. Check long titles, light and dark backgrounds, narrow displays, desktop icons, and the Dock.
8. Stop the service and check the disconnected hint, then restart it and confirm recovery.

Reproduce native runtime bugs in Übersicht before fixing them.
If desktop access is unavailable, record the limitation explicitly.

## Scope

This repository owns the daily-focus service, web dashboard, portable Übersicht widget, and design study.
The separate HabitGoalEditor macOS project remains outside scope.
The daily-focus experience replaces the former goal/habit/countdown desktop dashboard.
