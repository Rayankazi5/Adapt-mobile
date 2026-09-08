# Adapt Mobile

React Native (Expo) port of the [Adapt](../Adapt) fitness tracker, for iOS and Android.

## Status: Core MVP

This is a from-scratch mobile build, not a 1:1 port. It covers:

- Onboarding (age/weight/height/goal/activity level → TDEE + macro targets)
- **Calories tab — full port of the web `CalorieTracking` page:** Today /
  Absorption Analysis tabs, Fasting Tracker (adaptive plan engine), Hydration
  Tracker (live weather via expo-location + open-meteo), Macro Tracker
  pillars + settings, Micronutrients & Vitamins, per-meal Food Log cards, live
  Fatigue card, and the Add Food sheet with **Manual / AI Track / Barcode**
- Daily dashboard (calories/macros vs. targets, recovery/fatigue score)
- **Workouts tab — full port of the web `WorkoutTracking` page:** Programs
  (suggested-workout generator, PPL / Full Body / Bro Split / Custom),
  Exercise Library (search, filters, custom exercises), Analytics (device
  sync + Bluetooth simulation, muscle-group status, radar / bar / line
  charts, recovery guidance), and the Active Workout session with timer,
  per-exercise weight, XP popups and completion summary
- Editable profile + personalized target tiles

**Not included yet:**

- The XP / level / streak *display* (nav bar pill, Dashboard banner). The
  underlying `gamification` service is ported and Active Workout awards
  XP/streak into the same storage keys as the web, so the UI can be added on top.
- Smart Recommendations card, dietary preference
- The full ~9,500-entry IFCT/USDA food set (see `src/data/foodNutritionData.ts`)

### AI Track and Barcode on mobile

- **AI Track** is `src/ml/foodClassifier.ts`, a port of the web's
  `lib/foodClassifier.ts` (same ImageNet→food mapping, HSL/texture
  heuristics, portion profiles, on-device fine-tuning via `teachModel`).
  MobileNet is fetched from the same Google Storage URL at runtime, so the
  fallback path works out of the box. The **custom model isn't bundled** —
  `Adapt/public/models/` is gitignored and absent on this machine. Drop the
  files into `assets/models/food-classifier/` and flip
  `src/ml/modelAssets.ts` (one edit) to enable it; the AI tab shows a notice
  until then. User-taught weights persist via tfjs-react-native's
  `asyncStorageIO` (web: IndexedDB).
- **Barcode** scans EAN/UPC with `expo-camera` and looks codes up in the
  **Open Food Facts public API** (`src/services/openFoodFacts.ts`) — the same
  upstream dataset the web app's 400MB `food_facts.sqlite` was built from,
  which is too large to ship in an app. Needs internet for the lookup.

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
  `react-router-dom`, which is web-only. Tab icons are the same lucide set
  as `components/Navigation.tsx` (via `lucide-react-native`).
- **Styling: NativeWind (Tailwind for RN)** — same utility-class syntax and
  `cn()` helper as the web app. `global.css` + `tailwind.config.js` mirror
  the web app's `globals.css` / `tailwind.config.js` design tokens
  (`bg-background`, `text-muted-foreground`, `rounded-lg`, …) so styling
  code reads the same in both repos.
  - Tokens are hex equivalents of the web app's `oklch()` values (computed
    by Lightning CSS from the same source) — NativeWind can't parse
    `oklch()` in values applied at runtime.
  - Dark mode: `src/theme/ThemeProvider.tsx` swaps the `--variables` via
    NativeWind's `vars()` driven by the OS color scheme. A `.dark` class or
    `prefers-color-scheme` media query in CSS did **not** re-resolve
    custom-property colors reactively on native, so this is the reliable
    path. `src/theme/colors.ts` holds the same hex values for the few RN
    APIs that need a literal color (tab bar tint, ActivityIndicator).
- `src/components/` — ports of the web app's UI: `Card` (+ Header/Title/
  Content/Description, matching `components/ui/card.tsx`), `Button`
  (shadcn variants/sizes), `FoodLogCard`, `FatigueCard` (SVG ring gauge),
  `StatCard` (Dashboard tinted stat cards), `MacroBar`, `AddFoodModal`
  (the "Manual" tab of `AddFoodDialog`).

## Web ↔ mobile screen mapping

| Web page | Mobile tab | Notes |
|---|---|---|
| `pages/Dashboard.tsx` | Dashboard | Calories + Workouts stat cards, Today's Macros, Fatigue & Recovery. Hydration/Fasting cards, XP/streak, Recommendations omitted (features not in MVP). |
| `pages/CalorieTracking.tsx` | Calories | Full port — every tracker, both tabs, and all three Add Food modes (`src/components/calories/`). recharts → `src/components/charts/SimpleCharts.tsx`; `sonner` → `src/components/Toast.tsx`. |
| `pages/WorkoutTracking.tsx` | Workouts | Full port (`src/components/workout/`). Program/exercise data copied verbatim; recharts radar → `SimpleRadarChart`; `lib/gamification.ts` → `src/services/gamification.ts`. Finished sessions land in the same workout log the Dashboard/Hydration read. |
| `pages/Profile.tsx` | Profile | Editable Personal Information form + Personalized Targets tiles. Dietary/fasting preferences omitted. |

Gradient stat-card backgrounds and the CSS keyframe animations from
`globals.css` are approximated with solid tints / a Reanimated ring fill —
NativeWind's gradient utilities need extra native wiring.

## Running

```bash
npm install
npm start        # then press i (iOS) or a (Android)
npm run ios      # boot straight into the iOS Simulator
npm run android  # boot straight into an Android emulator
```

Requires Xcode (iOS Simulator) and/or Android Studio (Android emulator) set
up locally, or the Expo Go app on a physical device.

## Dependency notes

- `.npmrc` sets `legacy-peer-deps=true`: `@tensorflow/tfjs-react-native@1.0.0`
  declares stale peer ranges (async-storage ^1, expo-gl ^13) that conflict
  with Expo SDK 57 even though the APIs it uses are unchanged.
- `react-native-worklets` is a direct dependency on purpose — Reanimated 4
  needs its babel plugin, and a peer-only install gets pruned.
- `metro.config.js` resolves `react-native-fs` to an empty module:
  tfjs-react-native `require()`s it on a non-Expo code path that never runs.
- Camera / photo-library / location permissions work in Expo Go as-is. For a
  dev/production build add the `expo-camera`, `expo-image-picker` and
  `expo-location` config plugins with usage strings to `app.json`.
