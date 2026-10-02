# Desktop design review

Review date: 2026-10-01.
Status: at Ryan's request, the agent chose 10 One Thing as the daily-focus direction on 2026-10-01.
Ryan subsequently authorized the expanded workflow and implementation, followed by a PR for acceptance.
The HTML concepts remain review artifacts; the main implementation is `dashboard/index.jsx` in Übersicht, with a web companion for planning and history.
Use `npm run demo` and the [current review images](status.md#current-state) to review sample workflows separately from desktop acceptance.

## Review entrypoint

Open [the design gallery](../designs/desktop-study/index.html).
For browser preview, run `python3 -m http.server 8765 --bind 127.0.0.1` from the repository root and visit `http://127.0.0.1:8765/designs/desktop-study/`.
Each direction also has its own HTML page beside the gallery.
All layout assets are local; source links are optional external references.

Use the gallery to switch wallpaper, desktop icons, work-window visibility, and simulated screen dimensions.
The three simulated screen sizes are 1280 × 800, 1440 × 900, and 1728 × 1117.
The independent preview opens at the browser's actual viewport size.
Favorites and notes remain in local browser storage, with a copy action for sharing review results in chat.

## Design brief

Ryan requested ten HTML design ideas before choosing a direction for the Übersicht desktop dashboard.
The central requirement is to avoid filling the desktop.
The original ten-concept exploration was a review checkpoint.
The later daily-focus request authorized replacing the widget and adding a planning and history dashboard.

The daily-focus requirements and chosen direction are owned by [Daily focus direction](#daily-focus-direction).
Each concept limits visible information and reserves space for the menu bar, centered Dock, and right-side desktop icons.
The content is fictional sample data for comparing design, not a current personal status report.
The wallpapers, window, Dock, and desktop icons are authored simulations, not a capture of Ryan's desktop.

## Concepts

Occupancy is the sum of the widget rectangles divided by a 1440 × 900 desktop, excluding shadows.
It is a geometric comparison, not a measurement of opaque pixels or obstruction by actual application windows.

| Direction                                                          | Layout                            | Approximate occupancy | Main tradeoff                                           |
| ------------------------------------------------------------------ | --------------------------------- | --------------------- | ------------------------------------------------------- |
| [01 Quiet Rail](../designs/desktop-study/01-quiet-rail.html)       | Bottom-left horizontal strip      | 3.8%                  | All three summaries, but a wider footprint.             |
| [02 Margin Notes](../designs/desktop-study/02-margin-notes.html)   | Upper-left text without a card    | 5.2%                  | Gentle appearance; wallpaper contrast matters.          |
| [03 Focus Tile](../designs/desktop-study/03-focus-tile.html)       | One bottom-left card              | 4.8%                  | Balanced summary, limited to one lead goal.             |
| [04 Horizon Strip](../designs/desktop-study/04-horizon-strip.html) | Thin strip below the menu bar     | 3.1%                  | Minimal height; easily covered by work windows.         |
| [05 Twin Islands](../designs/desktop-study/05-twin-islands.html)   | Two small blocks in lower corners | 5.5%                  | Clear center, but attention splits between corners.     |
| [06 Habit Orbit](../designs/desktop-study/06-habit-orbit.html)     | Small upper-left habit rings      | 4.6%                  | Habit signal prioritized over goal detail.              |
| [07 Agenda Slip](../designs/desktop-study/07-agenda-slip.html)     | Narrow upper-right agenda         | 6.3%                  | Most chronological detail and the tallest footprint.    |
| [08 Status Chips](../designs/desktop-study/08-status-chips.html)   | Three bottom-left pills           | 1.9%                  | Very small footprint; short labels only.                |
| [09 Mono Console](../designs/desktop-study/09-mono-console.html)   | Small upper-left text panel       | 4.4%                  | Compact and precise, with a technical visual character. |
| [10 One Thing](../designs/desktop-study/10-one-thing.html)         | One bottom-left text reminder     | 2.9%                  | Least visual weight, with only one primary signal.      |

The earlier shortlist was 03, 08, and 10.
Ryan's clarified daily-focus purpose led to choosing 10; see [Daily focus direction](#daily-focus-direction).

## Daily focus direction

On 2026-10-01 Ryan clarified the purpose: many parallel activities were leaving little sense of completion, so the desktop should help focus on one or two daily main tasks.
Other tasks should stay organized in a queue or todo list without becoming persistent desktop noise.
Ryan asked the agent to choose the most suitable style.

Chosen direction: **10 One Thing**, adapted into a daily-focus reminder.
The user delegated the style choice; this records the agent's choice without implying approval of an unseen implementation.
Its restrained typography and small footprint keep the current main task visually dominant.
The broader summaries in 03 and 08 give several categories simultaneous prominence, which is less aligned with the clarified purpose.

Confirmed requirements:

- Show one concrete daily primary task and at most one quieter optional secondary task.
- Keep the Übersicht desktop widget as the main interface, with the web dashboard as its planning and history companion.
- Keep all other tasks in a queue or todo list without exposing a full backlog on the desktop.
- Preserve a small desktop footprint and click-through on the task surface, with explicit interactive Queue and dashboard entry buttons.
- Capture new ideas in Queue and deliberately choose the daily roles in the dashboard.
- Track each day's main completion and arranged secondary task in a separate history view.

Implemented adaptation:

- Render one large primary task, one short completion criterion, and an optional quieter second task.
- Express the primary task as a concrete result achievable today rather than an ongoing project title.
- Replace the prototype's illustrative percentage bar with an explicit completion criterion or real completion state.
- Keep habits, countdowns, backlog counts, and other summary metrics out of the daily-focus surface.
- Open a focused capture dialog from the desktop Queue entry, with Today, Queue, and daily-history pages behind it.
- Use muted sage, warm paper, and restrained serif headings in the dashboard, with the primary task visually dominant.
- Expand the desktop typography with a translucent surface for legibility, bounded title/criterion lines, and two small entry buttons.
- Do not silently promote queue items or unfinished tasks into today's main task.
- Preserve each day's title and completion criterion; unfinished tasks return to Queue the next day while the past day remains unfinished.
- Keep a completed primary visible for the rest of the day rather than automatically filling another primary slot.

The sample content in the original 10 HTML page predates this clarified brief.
The choice is of its visual style; its generic title and percentage are not the final daily-task content model.

## Übersicht feasibility

Übersicht supports JavaScript/React JSX widgets, CSS positioning, command refresh, and state updates.
Its [official site](https://tracesof.net/uebersicht/) explicitly describes screen-responsive layouts.
Its [widget documentation](https://github.com/felixhageloh/uebersicht#writing-widgets) describes absolute positioning relative to the desktop below the menu bar.
The ten concepts use CSS, text, and compact graphics that fit this rendering model; actual runtime acceptance still needs testing after selection.

The original desktop concepts preserve the repository's click-through behavior.
The expanded implementation opts only the two entry buttons into pointer events at Ryan's request.
The [official interaction documentation](https://github.com/felixhageloh/uebersicht#running-shell-commands) calls for an interaction shortcut and accessibility access to receive clicks.
The Horizon Strip is a desktop widget below the menu bar, not a native menu bar accessory.
No proposal assumes automatic native macOS widget fading or awareness of active application windows.

The implementation resolves the previous data/model split with the shared local service described in [Data and validation](architecture.md#data-and-validation).
A HTML preview establishes the visual direction, not the Übersicht runtime or live data behavior.

## References

- [Apple: macOS Sonoma desktop widgets](https://www.apple.com/newsroom/2023/06/macos-sonoma-brings-new-capabilities-for-elevating-productivity-and-creativity/): inspiration for low visual contrast and giving work windows priority.
  Apple's native widget fading is a visual reference, not an assumed Übersicht capability.
- [Chronolog, Arsanda Maulana / Keffi Studio](https://dribbble.com/shots/25038317-Chronolog-Time-tracker-widget-macOS): inspiration for compact hierarchy with one primary metric and secondary details.
- [Ngetrek, Rayfan Tio Saputro / Keitoto](https://dribbble.com/shots/20064326-Ngetrek-Time-Tracking-Widget-macOS): inspiration for small containers and short status labels.
  Its native menu bar treatment is adapted here into desktop-positioned strips and pills.
- [Minimal Pixel, Ben Miles](https://github.com/ben-miles/Minimal-Pixel): inspiration for restrained typography and a small visual footprint.
  It is a Rainmeter reference, not a macOS dependency.

These are original reinterpretations of layout principles, not copies of the reference artwork.

## Verification

The ten directions were visually reviewed in the browser at a 1280 × 720 viewport.
All ten were also checked at each of the three simulated desktop dimensions, for 30 layout scenarios in total.
No widget content overflow or out-of-bounds rectangle was found.
The wallpaper, work-window, and desktop-icon controls were exercised through the gallery.
A temporary favorite and note survived a page reload and were then removed.

[Verification data](../designs/desktop-study/previews/verification.json) records the layout measurements.
[Focus Tile preview](../designs/desktop-study/previews/03-focus-tile.jpg), [Status Chips preview](../designs/desktop-study/previews/08-status-chips.jpg), and [One Thing preview](../designs/desktop-study/previews/10-one-thing.jpg) show the recommended candidates.
These are browser checks of the original HTML prototypes.
The expanded app and actual widget browser checks are tracked separately in [status](status.md#current-state).

## Acceptance and next action

Ryan reviews the implemented direction in the PR and demo, then verifies the native widget using the [desktop checklist](architecture.md#desktop-check).
The accepted interaction is explicit Queue capture and dashboard entry, with role selection and completion in the dashboard.
Automatic rotation, hover expansion, and backlog display remain outside the daily-focus contract.

## Ownership

This document owns the current design brief, reference sources, and review criteria.
`designs/desktop-study/` owns the HTML concepts and review gallery.
Update this document when the selected direction or accepted interaction model changes; project progress belongs in [status.md](status.md#current-state).
