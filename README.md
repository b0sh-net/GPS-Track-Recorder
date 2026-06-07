# GPS Track Recorder

A React Native mobile application built with Expo SDK 54 for recording real-time GPS tracks during activities like sports, hiking, or excursions. Export recorded tracks in standard KML (Google Earth/Maps) and GPX (GPS Exchange Format) formats. Optional backend sync with a Laravel web dashboard for cloud visualization.

## Features

- **🎯 GPS Recording** – Start/stop GPS track recording with a single tap
- **🔄 Background Tracking** – Continues recording even when the app is in the background or the screen is locked (Foreground Service on Android, UIBackgroundModes on iOS)
- **💾 State Persistence** – Recording state survives app restarts and crashes; automatically resumes on relaunch
- **📊 Real-time Monitoring** – Displays distance, elapsed time, average speed, waypoint count, GPS accuracy, and live coordinates during recording
- **📡 Batch Backend Sync** – Waypoints are synced in batches to the Laravel backend (foreground + background)
- **🌐 Web Dashboard** – View your track on an interactive color-coded map at gps.b0sh.net
- **💬 Comments** – Add text comments to tracks from the summary screen (synced to backend)
- **📤 Export** – Export tracks to KML or GPX formats via `expo-sharing`
- **🔄 Clear During Recording** – Reset waypoints mid-recording without stopping
- **🔄 Reset** – Clear recorded track and start fresh
- **🔗 Device Claim** – Associate your device with a backend account for permanent track storage

## Architecture

```
GPS-Track-Recorder/
├── App.tsx                 # Root component; manages screen state & navigation
├── index.ts                # Entry point; registers background tasks
├── app.json                # Expo configuration (permissions, background modes)
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript config (strict mode)
├── config/
│   └── backend.ts          # BACKEND_URL configuration & API endpoints
├── screens/
│   ├── HomeScreen.tsx      # Main screen with "Start Recording" button + device claim
│   ├── RecordingScreen.tsx # Live tracking display + "Stop" + "Clear" buttons
│   └── SummaryScreen.tsx   # Track summary with stats, comments, export/reset + web link
├── hooks/
│   ├── useLocation.ts      # Foreground position monitoring (watchPositionAsync)
│   └── useTrackStore.ts    # Zustand store; core logic + backend sync + persistence
├── services/
│   ├── locationTask.ts     # TaskManager definition for background GPS updates
│   └── backendApi.ts       # REST API client for Laravel backend
├── lib/
│   ├── storageUtils.ts     # Recording state persistence (save/load/clear to disk)
│   ├── gpsUtils.ts         # Haversine distance, speed, duration formatting
│   └── exportUtils.ts      # KML/GPX generation & export via expo-sharing
├── types/
│   └── index.ts            # TypeScript type definitions
└── assets/                 # Icons, splash screen, and other static assets
```

## Key Technologies

| Category       | Technology                      |
|----------------|---------------------------------|
| Framework      | Expo SDK 54                     |
| Language       | TypeScript (strict mode)        |
| UI             | React Native + StyleSheet       |
| State Mgmt     | Zustand 5                       |
| Location       | expo-location + TaskManager     |
| Background     | expo-task-manager               |
| UI Gradient    | expo-linear-gradient            |
| Safe Area      | react-native-safe-area-context  |
| Device ID      | expo-application                |
| File System    | expo-file-system (legacy)       |
| Sharing        | expo-sharing                    |
| Navigation     | State-based (no router lib)     |
| Backend        | Laravel 10 + MySQL (optional)   |

## Getting Started

### Prerequisites

- Node.js & npm installed
- Expo Go app on a physical device (required for GPS testing)

### Installation

```bash
# Navigate to the project directory
cd GPS-Track-Recorder

# Install dependencies
npm install
```

### Configure Backend URL

Edit `config/backend.ts` to set your backend URL:

```typescript
export const BACKEND_URL = 'https://gps.b0sh.net'; // Production
// For local testing:
// export const BACKEND_URL = 'http://192.168.1.XXX:8000'; // Physical device
// export const BACKEND_URL = 'http://10.0.2.2:8000';     // Android emulator
// export const BACKEND_URL = 'http://localhost:8000';     // iOS simulator
```

### Running the App

```bash
# Start the development server
npm start          # or: expo start

# Run on Android device/emulator
npm run android    # or: expo start --android

# Run on iOS simulator
npm run ios        # or: expo start --ios
```

> **Note:** GPS functionality requires a **physical device**. On Android 11+ and iOS, you must grant **"Always"** location permission for background recording to work reliably.

## Background Recording

The app uses `expo-location` and `expo-task-manager` to record waypoints when the app is not in the foreground.
- **Android**: Uses a Foreground Service with a persistent notification to ensure the system doesn't kill the app.
- **iOS**: Uses `UIBackgroundModes` with the `location` key.

The background task (`services/locationTask.ts`) persists waypoints directly to disk via `storageUtils.ts`. When the app returns to the foreground, `App.tsx` reloads the persisted state to ensure no data is lost.

### GPS Configuration (Background)

```typescript
accuracy: Location.Accuracy.Highest
timeInterval: 2000       // 2 seconds
distanceInterval: 5      // 5 meters
pausesUpdatesAutomatically: false
```

## State Persistence

Recording state is persisted to the device filesystem via `expo-file-system/legacy` (`lib/storageUtils.ts`). On app launch, `App.tsx` calls `loadPersistedState()` to restore any in-progress recording, allowing the app to survive crashes, restarts, and background eviction.

## State Management

The app uses **Zustand** (`useTrackStore`) as the centralized state manager.

| State              | Description                                      |
|--------------------|--------------------------------------------------|
| `isRecording`      | Boolean – whether recording is active            |
| `waypoints`        | Array of recorded GPS points                     |
| `startTime`        | Timestamp when recording began                   |
| `finalDuration`    | Frozen duration when recording stopped           |
| `finalAverageSpeed`| Frozen avg speed when recording stopped          |
| `trackUuid`        | Backend UUID for the current track               |
| `trackId`          | Numeric backend track ID (internal use)          |
| `waypointSequence` | Incremental counter for backend waypoint ordering|
| `syncWithBackend`  | Boolean – enable/disable backend sync            |

Key actions: `startRecording()`, `stopRecording()`, `reset()`, `addWaypoint()`, `addWaypoints()` (batch), `loadPersistedState()`, `clearWaypoints()`

## Backend Sync (Optional)

The app can sync with a Laravel backend at `https://gps.b0sh.net`:

1. **Device Registration** – Auto-registers on first launch
2. **Device Claim** – Associate your device with an account via the HomeScreen alert
3. **Track Start/Complete** – Creates and finalizes tracks on the backend
4. **Batch Waypoints** – Waypoints are sent in batches (both foreground and background)
5. **Comments** – Add text comments from the summary screen

The backend dashboard shows all tracks with a color-coded map and statistics.

## Permissions

Configured in `app.json`:

- **Android**: `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `ACCESS_BACKGROUND_LOCATION`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_LOCATION`
- **iOS**: `NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysUsageDescription`, `NSLocationAlwaysAndWhenInUseUsageDescription`, `UIBackgroundModes: ["location"]`

## EAS Build (Production APK)

```bash
eas build --platform android --profile preview
```

## Development Conventions

- TypeScript strict mode enabled
- All source files are `.ts` / `.tsx`
- Styling uses React Native `StyleSheet.create()`
- Extensive `console.log` statements for debugging
- **Background Task**: Defined in `services/locationTask.ts` and registered via `import './services/locationTask'` in `index.ts`
- **State Persistence**: Recording state persisted to disk via `lib/storageUtils.ts`
- **Gradient UI**: Uses `expo-linear-gradient` for consistent visual design
- **No MapView**: Native map replaced with web dashboard link to avoid Google Maps API key dependency
- **User-facing strings**: Italian language

---

Built with ❤️ using Expo, React Native, and TypeScript
