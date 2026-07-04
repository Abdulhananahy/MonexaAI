---
name: Python pip/uv install failures on NixOS Replit
description: Why uv/pip install can fail with "immutable /nix/store" permission errors even though the project has a valid PYTHONUSERBASE, and the working fix.
---

## The problem
On some Replit Python repls, `installLanguagePackages` (which calls `uv add`) and plain `pip install` can fail with:
- `error: The interpreter at /nix/store/... is externally managed`
- `Caused by: failed to create directory .../nix/store/.../site-packages/<pkg>: Permission denied`

This happens even when `UV_PROJECT_ENVIRONMENT` and `PYTHONUSERBASE` env vars correctly point at `/home/runner/workspace/.pythonlibs` (where existing packages already live). The root cause: `.pythonlibs` is a `PYTHONUSERBASE` directory, not a real virtualenv (no `pyvenv.cfg`). `uv` doesn't recognize it as a valid environment and falls back to targeting the system interpreter's site-packages inside the read-only `/nix/store`.

**Why:** This is a NixOS-specific setup quirk of certain repl templates — not a bug in the requested package or a transient network issue. Retrying the same `uv add`/`installLanguagePackages` call again will not help.

## How to apply
When `installLanguagePackages`/`uv add` fails with this exact "immutable /nix/store" or "Permission denied" pattern:
1. Don't retry the same uv-based tool call.
2. Use pip directly instead: `PYTHONUSERBASE=/home/runner/workspace/.pythonlibs python3 -m pip install --user --break-system-packages <package>`.
3. Verify with `python3 -c "import <package>"` and manually add the pinned version to `requirements.txt`/`pyproject.toml` since this path bypasses the normal dependency-tracking tool.
