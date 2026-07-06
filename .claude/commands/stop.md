---
description: Stop the Orbital Trash Surveyor dev server running on port 5173
allowed-tools: Bash
---

Stop the Vite dev server started by **/start** (fixed port **5173**).

Steps:

1. Find whatever is listening on TCP port 5173: `lsof -ti tcp:5173`.
2. If nothing is listening, report "Dev server is not running (port 5173 free)." and stop.
3. Otherwise terminate it:
   `lsof -ti tcp:5173 | xargs kill` — escalate to `kill -9` only if it survives.
   (The user also has a global `kill-port` helper: `kill-port 5173` works too.)
4. Confirm the port is now free (`lsof -ti tcp:5173` returns nothing).
5. Report: "Dev server stopped; port 5173 released."
