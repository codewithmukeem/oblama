# Oblama

Oblama is a privacy-first Expo mobile app for downloading and chatting with open local AI models on Android and iOS.

## Run & Operate

- `pnpm install` — install the workspace dependencies
- `pnpm --filter @workspace/oblama run dev` — start the Expo preview
- `pnpm --filter @workspace/oblama run typecheck` — check the mobile app
- `pnpm run typecheck` — check every workspace package
- `pnpm run build` — check and build every workspace package

The Expo preview uses the configured `artifacts/oblama: expo` workflow. The app does not require a backend or database.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Expo SDK 54, Expo Router, React Native 0.81
- Zustand + AsyncStorage for local state
- llama.cpp native bridge (`OblamaLlama`) for on-device chat
- Hugging Face Hub for optional model discovery and downloads

## Where things live

- `artifacts/oblama/app/` — Expo Router screens
- `artifacts/oblama/components/` — reusable mobile UI
- `artifacts/oblama/src/store/appStore.ts` — persisted local state
- `artifacts/oblama/src/services/` — model storage, downloads, Hugging Face access, and notifications
- `artifacts/oblama/src/engines/llmEngine.ts` — native runtime boundary
- `artifacts/oblama/src/config/modelsCatalog.ts` — curated starter model catalog

## Architecture decisions

- Model files and conversations stay on-device; there is no application server in the chat path.
- Expo Go/web preview can inspect the UI, but native local inference requires a development or release build containing `OblamaLlama`.
- Downloads are resumable and can be paused, resumed, cancelled, or imported from device storage.
- The app uses the same persisted store for model selection, conversation settings, themes, and onboarding.

## Product

- Private local chat with streaming responses, personas, system prompts, export, copy, and regenerate actions.
- Curated GGUF/ONNX model library with device-memory checks and Hugging Face search.
- Offline-first conversation history and appearance settings.
- Image-model catalog support ready for the native generation engine.

## Gotchas

- Do not treat a web preview error about the native llama module as a UI failure; the native bridge is intentionally absent from Expo Go.
- Keep Expo package versions aligned with SDK 54 (`pnpm dlx expo-doctor@latest` is the compatibility check).
- Do not commit `android/`, `ios/`, model files, static builds, or local secrets.

## Pointers

- Android APK automation lives in `.github/workflows/android-apk.yml`.
- Public project documentation lives in `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, and `LICENSE`.
