# Review evidence

Checked on 2026-10-01 in America/Los_Angeles.
The Today, Queue, history, and desktop simulation screenshots use labeled fictional demo records.
The separate `widget-engine.jpg` uses the normal service's empty state in the installed Übersicht renderer.
None is a capture of the macOS desktop window or personal progress.

## Automated

A clean `npm ci` completed with no vulnerabilities or install warnings.
`npm run check` passed all 17 domain, persistence, HTTP integration, and widget-discovery tests, then JavaScript syntax and actual widget JSX compilation.
The test suite creates isolated data directories and ephemeral local ports.

## Browser workflow

The application was exercised through its visible browser controls.

- Desktop **新想法入 Queue** opened the dashboard with a focused capture dialog.
- Capturing a task with a title and criterion saved it into Queue.
- Selecting a primary opened an explicit criterion confirmation.
- Selecting a secondary without a criterion stayed in the dialog with required-field validation.
- A primary and secondary appeared on Today and the actual JSX desktop preview.
- Quick capture added other ideas without changing either daily role.
- Queue up/down controls changed order; archiving and restoring returned the item to its retained position.
- Search filtered Queue while keeping the full Queue count available.
- A title containing `<`, `>`, `&`, and quotes appeared as literal text.
- In two browser pages, a Queue mutation made the other page's open confirmation stale.
  The old replacement was rejected, the draft remained visible, and the confirmation button was disabled until reconsidered.
- Marking the primary complete left it on Today and produced a completed daily record with its original criterion and the secondary's pending status.
- The sample history showed completed, unfinished, and unplanned days separately.
  The unfinished filter returned the two sample unfinished days.
- The desktop dashboard entry returned to Today.
- Editing the main task through the dashboard was reflected in the actual widget preview.

## Layout

Default browser viewport: 1280 × 720.
The sample widget rectangle was 410 × 290.3, positioned at x = 32, y = 325.7.
Its root had `pointer-events: none`; the two entry buttons had `pointer-events: auto`.
This checks browser CSS, not native click-through.

At 390 × 844, the widget stayed within x = 32 through 358, with its bottom at 740.
The Queue page had a document width of 390 and no horizontal overflow.
A 160-character task and 500-character criterion remained inside the widget's bounds at this narrow viewport.
The original sample title and criterion were restored afterward, and the viewport override was reset.

## Installed Übersicht engine

The installed Übersicht 1.6 server was launched with the repository as its Widgets Folder and isolated diagnostic settings.
Its browser surface reproduced 18 compilation errors from discovering backend, test, and gallery JavaScript as widgets.
After those files moved under ignored `src/` directories, its state API listed only `dashboard-index-jsx` and no compilation errors.
Its actual React/Emotion renderer displayed the empty normal state from port 4317 and executed the widget's polling command.
The translucent background was also darkened after inspecting its readability on a light background.
[Installed-engine render](widget-engine.jpg) records this check.
This uses the installed engine rather than the demo's JSX substitution, but still does not establish macOS window behavior.
The diagnostic engine was stopped after verification to avoid competing with the app's normal ports.

## Native window limitation

The installed application is Übersicht 1.6, build 82.
Native UI inspection timed out when addressed by both the application path and `tracesOf.Uebersicht` bundle ID.
The macOS desktop window, interaction shortcut behavior, click-through, desktop polling, and disconnected recovery were not established.
Use the [desktop acceptance checklist](../architecture.md#desktop-check) before marking native acceptance complete.
