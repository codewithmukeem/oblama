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

## Latest release

**Oblama v1.0.1** is the current Android release.

- Android version code: `2`
- Release channel: unsigned debug APK for sideloading and testing
- Release notes: [v1.0.1](https://github.com/codewithmukeem/oblama/releases/tag/v1.0.1)

[**Download Latest APK**](https://github.com/codewithmukeem/oblama/releases/latest/download/Oblama.apk)

The button above always points to `Oblama.apk` on the latest published GitHub Release. It is the recommended public download; Actions artifacts are retained only for development and CI inspection.

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

## Android APK and releases

Every push to `main` builds an Android preview APK through [GitHub Actions](.github/workflows/android-apk.yml) and keeps a versioned CI artifact for development. Pushing a `v*` tag performs the same build and, only after a successful build, publishes `Oblama.apk` as a GitHub Release asset.

The workflow uses Expo prebuild and Gradle in GitHub-hosted infrastructure. Release tags provide the stable public download above. The APK is unsigned and suitable for sideloading and testing; a production release should be signed with an organization-owned Android keystore before distribution.

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