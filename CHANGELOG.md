# Changelog

All notable changes to Oblama are documented here.

## [Unreleased]

### Added

- Mobile-first local model library with curated chat and image model entries.
- Resumable model download management, Hugging Face search, import, and deletion.
- Private conversations with personas, custom system prompts, export, copy, and regeneration.
- GitHub Actions automation for downloadable Android preview APKs.

### Fixed

- Streamed assistant messages now render the complete response instead of only the first token.
- System prompts are passed to the native runtime with the correct `system` role.
- Onboarding waits for the root navigation state before replacing the route.
- Root workspace builds no longer require workflow-only Vite environment variables.

## [1.0.1] - 2026-08-30

- Published the Android debug APK as a GitHub Release asset with a stable latest-download URL.
- Updated the Android build workflow to Node 24-compatible GitHub Actions.
- Added release metadata and an app-version check for tagged builds.

## [1.0.0] - 2026-08-29

- Initial public Oblama mobile application release.