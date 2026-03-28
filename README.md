# Simple Tracker

A no-nonsense, offline-first nutrition and fitness tracking app for Android. Track your daily calories, protein, and weight — no accounts, no cloud, no bullshit. Everything lives on your device.

---

## What We're Building

Simple Tracker is a personal health logging app with four core pillars:

- **Daily Tracking** — Log food from your personal inventory or quick-add custom entries. A progress ring shows calories and protein consumed vs. your goals at a glance.
- **Food Inventory** — Build a library of your go-to foods with macros (calories, protein, fat). Reuse them every day without re-entering data.
- **Weight Tracking** — Log your weight daily and watch the trend over time.
- **Insights** — Visualise your streaks, average calorie/protein intake, weight trend, and BMI trend across 1 week, 1 month, or all time.

Everything is stored locally using SQLite. There's no backend, no login, no subscription.

---

## Repo Structure

```
dumb-protein-tracker/
├── alabaster-pulse/       # The app — all source code lives here
├── designs/               # Reference design assets (PNG mockups)
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo 55 (React Native 0.83, React 19) |
| Language | TypeScript 5.9 (strict) |
| Navigation | Expo Router (file-based, nested stacks) |
| Database | expo-sqlite — local SQLite, no server |
| State | Zustand — lightweight global store |
| Charts | react-native-svg — custom bezier SVG charts |
| Animations | react-native-reanimated |
| Icons | @expo/vector-icons — Ionicons |
| Fonts | Plus Jakarta Sans + Space Grotesk (Google Fonts) |
| Haptics | expo-haptics |
| Backup | expo-file-system + expo-sharing |

---

## App Structure

```
alabaster-pulse/
├── app/                         # All screens (file-based routing via Expo Router)
│   ├── _layout.tsx              # Root layout — font loading, DB init, gesture handler
│   ├── index.tsx                # Onboarding screen
│   ├── log-food.tsx             # Log food modal (presented as a native bottom sheet)
│   ├── restore.tsx              # Restore backup on first launch
│   └── (tabs)/                  # Bottom tab navigator
│       ├── _layout.tsx          # 4-tab bar (Today, Inventory, Insights, Settings)
│       ├── home/
│       │   └── index.tsx        # Today's dashboard — progress rings + food log + FAB
│       ├── inventory/
│       │   ├── _layout.tsx      # Nested stack so back button works correctly
│       │   ├── index.tsx        # Inventory list with search + filter + red FAB
│       │   ├── add.tsx          # Add a new food item
│       │   └── [id].tsx         # Edit an existing food item
│       ├── insights/
│       │   └── index.tsx        # Charts: calories, protein, weight, BMI
│       └── settings/
│           ├── _layout.tsx      # Nested stack so back button works correctly
│           ├── index.tsx        # Settings home — profile hero + settings tiles
│           ├── edit-profile.tsx # Edit name, height/weight (sliders), goal type, avatar
│           ├── edit-calories.tsx# Adjust daily calorie goal
│           ├── edit-protein.tsx # Adjust daily protein goal
│           ├── backup.tsx       # Export DB as a .db file and share
│           └── restore.tsx      # Import a .db backup file
│
├── components/
│   ├── ProgressRings.tsx        # Animated concentric SVG rings (calorie + protein)
│   ├── FoodLogItem.tsx          # Food log entry row with swipe-to-delete
│   ├── InventoryCard.tsx        # Food item card with coloured macro badges
│   ├── InsightsChart.tsx        # Bar (calories) or line (protein) chart
│   ├── WeightChart.tsx          # Smooth bezier line chart for weight
│   └── BMIChart.tsx             # BMI trend line with normal range band
│
├── constants/
│   └── theme.ts                 # Colours, typography, spacing, radii, shadows
│
├── db/
│   ├── schema.ts                # CREATE TABLE statements for all 4 tables
│   ├── queries.ts               # All TypeScript-typed query functions
│   └── seed.ts                  # seedDemoData() — 14 days of realistic dummy data
│
├── hooks/
│   └── useDatabase.ts           # Opens SQLite DB, runs migrations, returns singleton
│
├── store/
│   └── useAppStore.ts           # Zustand store: settings + todayLog
│
├── assets/                      # App icons, splash screen
├── app.json                     # Expo project config (name: "Simple Tracker")
├── eas.json                     # EAS Build profiles
└── package.json
```

---

## Database Schema

```sql
CREATE TABLE user_settings (
  id                  INTEGER PRIMARY KEY DEFAULT 1,
  name                TEXT,
  height_cm           REAL,
  weight_kg           REAL,
  goal_type           TEXT CHECK(goal_type IN ('shred','maintain','bulk')) DEFAULT 'maintain',
  calorie_goal        INTEGER DEFAULT 2150,
  protein_goal        INTEGER DEFAULT 165,
  onboarding_complete INTEGER DEFAULT 0,
  avatar_uri          TEXT
);

CREATE TABLE food_items (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL,
  serving_label  TEXT NOT NULL,
  weight_grams   REAL NOT NULL,
  protein_grams  REAL NOT NULL,
  calories       INTEGER NOT NULL,
  fat_grams      REAL DEFAULT 0,
  category       TEXT DEFAULT 'Other',
  created_at     TEXT DEFAULT (datetime('now'))
);

CREATE TABLE food_log (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  food_item_id   INTEGER NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  log_date       TEXT NOT NULL,
  servings       REAL DEFAULT 1.0,
  calories_total INTEGER NOT NULL,
  protein_total  REAL NOT NULL,
  logged_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE weight_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  log_date    TEXT NOT NULL,
  weight_kg   REAL NOT NULL,
  logged_at   TEXT DEFAULT (datetime('now'))
);
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo Go app on your phone **or** Android Studio with an emulator

### Install dependencies

```bash
cd alabaster-pulse
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` is required because some Expo canary packages have peer dependency conflicts.

### Run the dev server

```bash
npx expo start
```

- **Physical phone** — scan the QR code with Expo Go
- **Android emulator** — press `a` in the terminal
- **iOS simulator** — press `i` (macOS + Xcode only)

### Load demo data

Go to **Settings → Load Demo Data**. Seeds 14 days of food logs, weight entries, and a user profile so every screen has real data immediately.

---

## Building a Local APK

> **Requirements:** Android Studio installed, Java 17.

### One-time environment setup

Add to your `~/.zshrc` and run `source ~/.zshrc`:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
export PATH=$JAVA_HOME/bin:$PATH
```

Install Java 17 if needed:

```bash
brew install openjdk@17
```

### Build a standalone release APK

```bash
cd alabaster-pulse/android
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
./gradlew app:assembleRelease -x lint -x test
```

Output:
```
alabaster-pulse/android/app/build/outputs/apk/release/app-release.apk
```

Transfer to your phone, enable **Install unknown apps**, install. No computer connection needed after install.

> **Do not use the debug APK** (`assembleDebug`) for device testing — it requires Metro running on your computer to load the JS bundle and will show "Unable to load script" otherwise.

### Smaller APK (single architecture)

Most physical phones are `arm64-v8a`. Targeting only that cuts the APK roughly in half:

```bash
./gradlew app:assembleRelease -x lint -x test -PreactNativeArchitectures=arm64-v8a
```

### Install directly via USB

With USB debugging enabled on your phone:

```bash
cd alabaster-pulse
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
export ANDROID_HOME=$HOME/Library/Android/sdk
npx expo run:android
```

Builds and installs to the connected device in one step.

### Play Store build (AAB)

```bash
cd alabaster-pulse/android
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
./gradlew app:bundleRelease -x lint -x test
```

Output: `alabaster-pulse/android/app/build/outputs/bundle/release/app-release.aab`

Upload this to the Google Play Console. You'll need a production keystore (not the debug one) before publishing publicly.

---

## Cloud Build via EAS (no Android Studio needed)

```bash
npm install -g eas-cli
eas login
cd alabaster-pulse
eas build --platform android --profile preview   # produces .apk
eas build --platform android --profile production # produces .aab for Play Store
```

Builds run on Expo's servers (~10–15 min) and produce a download link.

---

## Key Decisions & Notes

- **No backend** — SQLite only. All data lives on-device. Backup/restore works via file export.
- **Nested stacks inside tabs** — `settings/_layout.tsx` and `inventory/_layout.tsx` each contain a `Stack` so back navigation works correctly instead of jumping to the home tab.
- **Java 17 required** — Java 21+ breaks the Gradle foojay toolchain plugin bundled with React Native. Always set `JAVA_HOME` to Java 17 before building.
- **`--legacy-peer-deps`** — Required for npm install due to Expo canary peer dep declarations. Safe to use.
- **DB migrations** — Run on every app launch via `ALTER TABLE ... ADD COLUMN` wrapped in try/catch (no-op if column already exists).
- **Release APK uses debug keystore** — Fine for personal use. For Play Store, generate a production keystore and store it safely — losing it means you can never push updates to your app.
