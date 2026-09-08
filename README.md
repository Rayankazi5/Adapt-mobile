# Adapt Mobile

React Native (Expo) port of the [Adapt](../Adapt) fitness tracker, for iOS and Android.

## Status: Core MVP

This is a from-scratch mobile build, not a 1:1 port. It covers:

- Onboarding (age/weight/height/goal/activity level → TDEE + macro targets)
- Manual meal logging with food search (~266 curated dishes)
- Daily dashboard (calories/macros vs. targets, recovery/fatigue score)
- Workout intensity logging
- Profile view + reset

**Not included yet** (deferred from the web app on purpose — see below):

- Barcode scanning (web app uses a 400MB+ SQLite lookup DB)
- TensorFlow.js food image classification
- Fasting timer, gamification, the full ~9,500-entry IFCT/USDA food set

## Architecture

Unlike the web app (which talks to a Vite-middleware backend backed by
SQLite), this app is **fully local-first / offline**: there is no server.

- `src/engines/` — `trackingEngine.ts` (TDEE, macro targets) and
  `fatigueEngine.ts` (recovery score) are ported verbatim/near-verbatim from
  `server/trackingEngine.ts` and `server/fatigueEngine.ts` in the web repo —
  they're pure functions with no Node/DB dependency, so they run as-is
  on-device.
- `src/services/dataService.ts` and `profileService.ts` — async port of the
  web app's `lib/dataService.ts`, using `@react-native-async-storage/async-storage`
  in place of `localStorage`. Every call is async (`localStorage` isn't).
- `src/data/foodNutritionData.ts` — the curated ~266-dish subset of the web
  app's food data module (the same file minus the 56MB `ifctData.json`
  merge, which isn't practical to bundle into a mobile JS bundle — see the
  note in that file for how to add it back via a bundled SQLite asset
  instead).
- `src/navigation/` — React Navigation (native-stack + bottom-tabs) replaces
  `react-router-dom`, which is web-only.
- `src/components/` + `src/theme/` — a small set of RN primitives
  (Card/Button/ProgressBar) and a light/dark color-token theme, since the
  web app's Radix/Shadcn components can't run in React Native.

## Running

```bash
npm install
npm start        # then press i (iOS) or a (Android)
npm run ios      # boot straight into the iOS Simulator
npm run android  # boot straight into an Android emulator
```

Requires Xcode (iOS Simulator) and/or Android Studio (Android emulator) set
up locally, or the Expo Go app on a physical device.

## Adding back barcode scanning / ML classification

Both are native-module-heavy and were intentionally left out of the MVP:

- **Barcode scanning**: add `expo-camera`, look up scanned codes against a
  bundled or remote food database (the current 400MB `food_facts.sqlite` is
  too large to ship in an app bundle — consider a trimmed subset or a small
  hosted lookup API).
- **Food image classification**: port `lib/foodClassifier.ts` using
  `@tensorflow/tfjs-react-native` in place of `@tensorflow/tfjs-node`, and
  bundle the MobileNet + custom model files as assets.
