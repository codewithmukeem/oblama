# Contributing to Oblama

Thanks for helping make local AI more useful on mobile.

## Development setup

1. Install Node.js 24 and pnpm.
2. Run `pnpm install` from the repository root.
3. Start the Expo preview with `pnpm --filter @workspace/oblama run dev`.
4. Make changes inside `artifacts/oblama` unless the change is workspace-wide.

## Before opening a pull request

Run the same checks used by the project:

```bash
pnpm run typecheck
pnpm dlx expo-doctor@latest --dir artifacts/oblama
pnpm run build
```

If your change affects native configuration, also run the Android APK workflow or a local Expo prebuild. Do not commit generated `android/`, `ios/`, `static-build/`, model files, or environment files.

## Code guidelines

- Preserve the local-first behavior. Do not send prompts or conversation history to a server.
- Use the semantic colors from `hooks/useColors.ts` instead of hardcoded theme colors.
- Keep new UI accessible: add labels to icon-only controls, provide pressed/disabled states, and avoid emoji as icons.
- Keep model downloads resumable and fail explicitly when a file or runtime is unavailable.
- Keep Expo dependencies aligned with SDK 54.

## Pull requests

Please describe the user-facing change, include the checks you ran, and call out any native build or device limitations. Small, focused pull requests are easier to review.