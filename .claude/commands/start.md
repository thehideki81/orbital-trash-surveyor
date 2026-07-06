---
description: Start the Orbital Trash Surveyor dev server (Vite) and print the accessible URL
allowed-tools: Bash
---

Start the app's Vite dev server in the background on the fixed port **5173** and report the URL.

Fixed port keeps the URL deterministic and lets `/stop` reliably kill the right process.

Steps:

1. Work from the project root (`~/code/orbital-trash-surveyor`).
2. **Guard — is the app scaffolded?** If `package.json` is missing or has no `dev` script, stop and tell
   the user: "The app isn't scaffolded yet — run the plan in `.claude/plans/orbital-trash-surveyor.md`
   first." Do not proceed.
3. **Deps:** if `node_modules/` is missing, run `npm install` first.
4. **Already running?** If port 5173 is already listening (`lsof -ti tcp:5173`), don't start a second
   server — just report the existing URL and note it was already up.
5. **Start (background):** run the dev server detached on the fixed port:
   `npm run dev -- --port 5173 --strictPort --host`
   Use a backgrounded Bash call so it keeps running after the command returns. `--strictPort` makes it
   fail loudly instead of drifting to another port; `--host` also exposes a LAN URL.
6. **Wait for ready:** poll until `http://localhost:5173/` responds (curl loop, a few seconds max).
   If the server exits or the port never opens, report the failure and the last lines of its output.
7. **Report the accessible URL clearly**, e.g.:
   - Local:   **http://localhost:5173/**
   - Network: `http://<lan-ip>:5173/` (only if `--host` printed one)
8. Remind the user they can stop it with **/stop**.
