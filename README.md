# GPS Track Recorder

A React Native mobile application built with Expo for recording real-time GPS tracks during activities like sports, hiking, or excursions. Export recorded tracks in standard KML (Google Earth/Maps) and GPX (GPS Exchange Format) formats.

## Features

- **🎯 GPS Recording** – Start/stop GPS track recording with a single tap
- **🔄 Background Tracking** – Continues recording even when the app is in the background or the screen is locked
- **📊 Real-time Monitoring** – Displays distance, elapsed time, and average speed during recording
- **🗺️ Route Map** – Visual map of the recorded track with start/end markers
- **📤 Export** – Export tracks to KML or GPX formats via `expo-sharing`
- **🔄 Reset** – Clear recorded track and start fresh

## Architecture

```
GPS-Track-Recorder/
├── App.tsx                 # Root component; manages screen state & navigation
├── index.ts                # Entry point; registers background tasks
├── app.json                # Expo configuration (permissions, background modes)
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript config (strict mode)
├── screens/
│   ├── HomeScreen.tsx      # Main screen with "Start Recording" button
│   ├── RecordingScreen.tsx # Live tracking display + "Stop" button
│   └── SummaryScreen.tsx   # Track summary with map, export/reset options
├── hooks/
│   ├── useLocation.ts      # Foreground position monitoring
│   └── useTrackStore.ts    # Zustand store; manages background task lifecycle
├── services/
│   ├── locationTask.ts     # TaskManager definition for background GPS updates
│   └── backendApi.ts       # REST API client for Laravel backend
├── lib/
│   ├── gpsUtils.ts         # Haversine distance, speed, duration formatting
│   └── exportUtils.ts      # KML/GPX generation & export via expo-sharing
├── types/
│   └── index.ts            # TypeScript type definitions
└── assets/                 # Icons, splash screen, and other static assets
```

## Key Technologies

| Category       | Technology                  |
|----------------|-----------------------------|
| Framework      | Expo SDK 54                 |
| Language       | TypeScript (strict mode)    |
| UI             | React Native + StyleSheet   |
| State Mgmt     | Zustand 5                   |
| Location       | expo-location + TaskManager |
| Background     | expo-task-manager           |
| Maps           | react-native-maps           |
| File System    | expo-file-system            |
| Sharing        | expo-sharing                |
| Navigation     | State-based (no router lib) |

## Getting Started

### Prerequisites

- Node.js & npm installed
- Expo Go app on a physical device (recommended for GPS testing)

### Installation

```bash
# Navigate to the project directory
cd GPS-Track-Recorder

# Install dependencies
npm install
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

## State Management

The app uses **Zustand** (`useTrackStore`) as the centralized state manager.

| State              | Description                                      |
|--------------------|--------------------------------------------------|
| `isRecording`      | Boolean – whether recording is active            |
| `waypoints`        | Array of recorded GPS points                     |
| `startTime`        | Timestamp when recording began                   |
| `finalDuration`    | Frozen duration when recording stopped           |
| `finalAverageSpeed`| Frozen avg speed when recording stopped          |

Key actions: `startRecording()`, `stopRecording()`, `reset()`, `addWaypoint()`, `clearWaypoints()`

## Permissions

Configured in `app.json`:

- **Android**: `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `ACCESS_BACKGROUND_LOCATION`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_TYPE_LOCATION`
- **iOS**: `NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysUsageDescription`, `NSLocationAlwaysAndWhenInUseUsageDescription`, `UIBackgroundModes: ["location", "fetch"]`

## Development Conventions

- TypeScript strict mode enabled
- All source files are `.ts` / `.tsx`
- Styling uses React Native `StyleSheet.create()`
- Extensive `console.log` statements for debugging
- **Background Task**: Defined in `services/locationTask.ts` and registered in `index.ts`.

---

Built with ❤️ using Expo, React Native, and TypeScript
