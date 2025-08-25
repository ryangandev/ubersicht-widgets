# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a collection of Übersicht widgets for macOS desktop customization. Übersicht is a tool that allows you to create desktop widgets using web technologies (HTML, CSS, JavaScript).

## Widget Architecture

Each widget is structured as either:

1. A single `.jsx` file in the root directory
2. A directory with `index.jsx` or `index.coffee`, optional `widget.json` metadata, and supporting files

### Widget Structure

- **JSX widgets**: Export `command`, `refreshFrequency`, `className`, and `render` functions
- **CoffeeScript widgets**: Define `command`, `refreshFrequency`, `render`, and `style` properties
- **Metadata**: `widget.json` files contain name, description, author, version, and preview image

## Widget Types Present

1. **countdown-timer/**: JSX countdown widget that reads JSON data to display multiple countdowns
2. **habit-goal/**: JSX widget that reads JSON data to display goals and habits

## Data Handling

The habit-goal widget demonstrates reading external JSON data:

- Uses shell `cat` command to read `data.json`
- Parses JSON in the render function
- Handles dates and calculates progress/streaks

## Styling Approaches

- **JSX widgets**: Use Emotion CSS-in-JS via `className` export
- **CoffeeScript widgets**: Use `style` property with CSS strings
- Common patterns: Absolute positioning, semi-transparent backgrounds, system fonts

## Development Notes

- No build system or package management - widgets run directly in Übersicht
- Testing requires installing widgets in Übersicht and observing desktop output
- Shell commands in `command` export are executed by Übersicht runtime
- Widgets can be refreshed manually or automatically via `refreshFrequency`

## Widget Development Best Practices

### Required Exports

- `command`: Shell command to execute (string)
- `refreshFrequency`: Update interval in milliseconds or `false` for manual refresh only
  - Use `false` for static data (habits, goals) to preserve battery
  - Use timer intervals (e.g., `60000` for 1 minute) only for dynamic data (countdown timers)
- `className`: CSS styles using Emotion syntax (template string)
- `render`: Function that receives `{ output }` parameter containing command output

### CSS Styling Tips

- Use Emotion CSS-in-JS for JSX widgets via `className` export (template string or object)
- External CSS files are NOT supported - all styling must be inline via className
- Backdrop filters: `-webkit-backdrop-filter: blur(20px)` for glassmorphism effects
- Common positioning: `position: absolute` with `top`, `left` coordinates
- Semi-transparent backgrounds: `rgba(0, 0, 0, 0.7)` for overlay effects
- System fonts: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- Nested CSS selectors work within className template strings
- For complex styling, use Emotion's `css` and `styled` functions via `import { css } from "uebersicht"`

### Error Handling

- Always wrap JSON.parse() in try-catch blocks
- Provide fallback UI for loading states and errors
- Use `style={{ color: "red" }}` for inline error styling

### Data Processing

- Command output is passed as string to render function
- Date calculations: Use `new Date()` constructor with ISO date strings
- Progress calculations: `Math.min(100, Math.floor(percentage))` to cap at 100%
- Time differences: `(endDate - startDate) / (1000 * 60 * 60 * 24)` for days

### Widget Organization

- Prefer directory structure: `widget-name/index.jsx` + `data.json`
- Keep data files in same directory as widget for relative path access
- Use descriptive, kebab-case naming for widget directories
- Avoid `.widget` suffix in directory names for cleaner organization
- Note: countdown-timer still uses `.widget` suffix - should be updated to match new standard
