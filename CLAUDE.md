# CLAUDE.md

## Git Commit Rules

- Never mention Claude or "Co-Authored-By: Claude" in git commit messages.

## Subagent Usage

- Always use specialized subagents (frontend-engineer, backend-engineer, fullstack-engineer, etc.) for implementation work. Do NOT attempt to manually iterate on CSS, layout, or component issues yourself — delegate to the appropriate subagent with clear context about the problem and constraints.
- For CSS/layout/UI bugs: use `frontend-engineer`.
- For design work and .pen files: use `ui-ux-designer`.
- For backend logic: use `backend-engineer`.
- For cross-stack work: use `fullstack-engineer`.
