# Evolution Proposal: Dynamic Imports for SSR-Heavy Packages

**Signature:** `dynamic-import-ssr-build`

## What happened
Adding `@ai-sdk/google` and `ai` (Vercel AI SDK) to a TanStack Start project caused `vite build` to silently hang/fail during the SSR build phase (after client build succeeded). The SSR build cannot resolve Node.js-specific dependencies in these packages.

## Root cause
Static top-level `import { google } from "@ai-sdk/google"` causes Vite's SSR bundler to try to resolve and bundle the entire package tree during SSR transformation. Packages like `@ai-sdk/google` → `@google/generative-ai` pull in Node.js internals that fail SSR analysis.

## Fix applied
Replace static imports with dynamic `await import()` inside the handler function:

```ts
// ❌ Static import — breaks SSR build
import { streamText } from "ai";
import { google } from "@ai-sdk/google";

// ✅ Dynamic import — SSR build skips these
const { streamText } = await import("ai");
const { google } = await import("@ai-sdk/google");
```

## Also learned
- Windows git commits files with case-insensitive names. `aichat.tsx` committed on Windows will cause `ENOENT` on Linux/Vercel. Verify with `git ls-files` and fix with `git mv` via temp name.
- TanStack Start `createServerFn` with `await import()` for heavy packages is a clean pattern that works in both dev and production builds.

## Affected files
- `src/lib/chat.functions.ts` — uses dynamic imports
