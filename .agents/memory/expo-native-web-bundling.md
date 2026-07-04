---
name: Expo web bundling of native-only packages
description: Metro tries to resolve native-only packages even behind runtime Platform.OS checks, breaking the web bundle.
---

Wrapping a native-only import in `if (Platform.OS !== 'web') { require('some-native-pkg') }` does NOT
prevent Metro from resolving that module when bundling for web. Metro resolves `require()`/`import`
targets statically at bundle time regardless of runtime conditionals, so if the native package
references native-only APIs at module load time, the web bundle build fails (observed as a 500 from
the dev server / "MIME type application/json is not executable" in the browser, since Metro serves
an error JSON instead of a JS bundle).

**Why:** Runtime platform checks only guard *execution*, not *bundling*. Metro's module graph is built
before any JS runs.

**How to apply:** Split the platform-specific logic into separate files using Metro's platform
extensions: `foo.native.ts` (or `.ios.ts`/`.android.ts`) for native code, `foo.web.ts` for the web
stub/shim, and optionally a plain `foo.ts` fallback purely so TypeScript's module resolution (which
doesn't understand Metro's platform extension convention) can find type info. Metro will pick the
platform-specific file at bundle time and never touch the native-only package when building for web.
Example: used for `@stripe/stripe-react-native` in the Monexa project (`frontend/utils/stripeNative.*`).
