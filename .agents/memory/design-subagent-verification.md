---
name: DESIGN subagent verification gap
description: Why DESIGN subagents can claim success/screenshot-verified while still shipping broken code, and how to catch it.
---

When dispatching parallel DESIGN subagents (via `startAsyncSubagent`) to each build a canvas mockup screen, each subagent may independently screenshot its own output and report success — but their generated JSX can still contain syntax errors that only surface after all of them finish (e.g. literal escaped backticks/dollar-signs like `\`` or `\$` inside template literals, likely an artifact of how the subagent's code-writing tool serialized string content).

**Why:** A subagent's own screenshot check can pass if it captured a stale/cached preview, or if the error only manifests when Vite/Babel re-parses the file after the dev server restarts or another file in the same directory triggers a shared re-bundle. Success self-reports are not proof the file is syntactically valid.

**How to apply:** After any batch of parallel subagents finishes writing mockup/component files, always run `refresh_all_logs` (or equivalent build/log check) before presenting or trusting the result — even if every subagent claims it verified its own screenshot. Grep the new files for stray `\`` or `\$` sequences outside of intentional escaping as a quick sanity check. Consider running a TypeScript/tsc noEmit pass across the sandbox to catch prop-type mismatches subagents introduce (e.g. inventing component props that don't exist, like a `Mascot` component's `expression` prop or an invalid `mood` enum value) — these don't break the dev server but indicate spec drift from the shared component contract.
