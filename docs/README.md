# Documentation routes

Start with the question below and read only the linked section.

| Question                                              | Route                                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| What is implemented and verified?                     | [Status: Current state](status.md#current-state)                               |
| What needs Ryan's input?                              | [Status: Needs Ryan](status.md#needs-ryan)                                     |
| How do I compare the ten desktop designs?             | [Design review: Review entrypoint](design-review.md#review-entrypoint)         |
| Which style was chosen for daily focus?               | [Design review: Daily focus direction](design-review.md#daily-focus-direction) |
| What design constraints and references apply?         | [Design review: Design brief](design-review.md#design-brief)                   |
| What should happen next?                              | [Status: Next steps](status.md#next-steps)                                     |
| What is still undecided?                              | [Status: Open decisions](status.md#open-decisions)                             |
| What is deliberately outside scope?                   | [Status: Intentional exclusions](status.md#intentional-exclusions)             |
| Which files own which behavior?                       | [Architecture: Code map](architecture.md#code-map)                             |
| How does Übersicht run and refresh the widget?        | [Architecture: Runtime](architecture.md#runtime)                               |
| Where do I edit data, and what does validation cover? | [Architecture: Data and validation](architecture.md#data-and-validation)       |
| How do I install and check the desktop result?        | [Architecture: Verification](architecture.md#verification)                     |
| How do I refresh the status accurately?               | [Status: Status check procedure](status.md#status-check-procedure)             |

## Ownership and maintenance

- `AGENTS.md` owns short repository instructions and links to explanations.
- `CLAUDE.md` imports `AGENTS.md`; do not maintain a second instruction set.
- Root `README.md` owns the public introduction and quick start.
- `docs/status.md` owns the dated project snapshot, blockers, open decisions, and next actions.
- `docs/architecture.md` owns the code map, implementation rationale, and verification procedure.
- `docs/design-review.md` owns the desktop design brief, references, and review criteria.
- This file owns question routing and documentation maintenance rules.

Keep each detailed fact in one owning document and link to it elsewhere.
Update the owning document in the same commit as a behavior change.
Remove resolved status items instead of building a history log; Git commits and PRs hold the history.
Keep headings stable so routes remain valid.
Record whether evidence comes from code inspection, local validation, a remote check, or desktop observation.
An old snapshot is a starting point, not proof of current behavior.

This structure follows the shared Agent Wiki decision `wiki/decisions/repo-agent-docs.md` dated 2026-09-28.
