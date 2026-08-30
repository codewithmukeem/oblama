# Oblama

**Private, local AI chat for your phone.**

Oblama is an Expo/React Native mobile app for discovering, downloading, and chatting with open AI models directly on-device. It keeps conversations and model files local, with no account or hosted chat backend required.

## What it includes

- Local model library with curated TinyLlama, Phi-3, Mistral, and SD Turbo entries
- Resumable model downloads with pause, resume, cancel, import, and delete controls
- Hugging Face model search with optional token support for gated repositories
- Private conversations with personas and custom system prompts
- Streaming local responses through the `OblamaLlama` native llama.cpp bridge
- Mobile-first chat actions: copy a response, copy code blocks, and regenerate the latest answer
- Conversation export, offline persistence, light/dark appearance, and device capability checks
- GitHub Actions workflow that generates a downloadable Android preview APK

## Preview the app

This repository is a pnpm workspace. From the repository root:

```bash
pnpm install
pnpm --filter @workspace/oblama run dev
```

The Replit preview uses the same Expo workflow. To run the checks:

```bash
pnpm --filter @workspace/oblama run typecheck
pnpm dlx expo-doctor@latest --dir artifacts/oblama
```

## Android APK

Every push to `main` and every `v*` tag can build an Android preview APK through [GitHub Actions](.github/workflows/android-apk.yml). The APK is uploaded to the workflow run; version tags also create a GitHub Release containing the file.

The workflow uses Expo prebuild and Gradle in GitHub-hosted infrastructure. It creates an unsigned debug APK suitable for sideloading and testing. A production release should be signed with an organization-owned Android keystore before distribution.

To build locally on a machine with Java and Android SDK installed:

```bash
cd artifacts/oblama
pnpm exec expo prebuild --platform android
cd android
./gradlew assembleDebug
```

## Native inference

The TypeScript app defines a small runtime boundary in `src/engines/llmEngine.ts`. Expo Go and the browser preview intentionally do not contain the native `OblamaLlama` module, so they show a clear native-build message when inference is attempted. The Android/iOS native build must provide a module implementing:

```ts
streamChat({
  modelUri,
  messages,
  onToken,
})
```

This keeps the UI and model management testable without pretending that browser JavaScript can run llama.cpp locally.

## Privacy

Oblama is designed for local-first use. Conversations, settings, and downloaded model metadata are persisted with AsyncStorage on the device. Hugging Face access is only used for model discovery/downloads when requested by the user. Do not add secrets to source control; use the app's secure token storage and GitHub Actions secrets for release signing.

## Project structure

```text
artifacts/oblama/
├── app/                 # Expo Router screens
├── components/          # reusable UI
├── src/config/          # catalog and personas
├── src/engines/         # native inference boundary
├── src/services/        # downloads, storage, search, notifications
└── src/store/           # persisted Zustand state
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, checks, and pull request expectations.

## License

Oblama is released under the [MIT License](LICENSE).