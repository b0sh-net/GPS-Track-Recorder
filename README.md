# GPS Track Recorder

A React Native mobile application built with Expo for recording real-time GPS tracks during activities like sports, hiking, or excursions. Export recorded tracks in standard KML (Google Earth/Maps) and GPX (GPS Exchange Format) formats.

## Features

- **🎯 GPS Recording** – Start/stop GPS track recording with a single tap
- **📊 Real-time Monitoring** – Displays distance, elapsed time, and average speed during recording
- **🗺️ Route Map** – Visual map of the recorded track with start/end markers
- **📤 Export** – Export tracks to KML or GPX formats via `expo-sharing`
- **🔄 Reset** – Clear recorded track and start fresh

## Architecture

```
GPS-Track-Recorder/
├── App.tsx                 # Root component; manages screen state & navigation
├── index.ts                # Entry point
├── app.json                # Expo configuration (permissions, icons, etc.)
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript config (strict mode)
├── screens/
│   ├── HomeScreen.tsx      # Main screen with "Start Recording" button
│   ├── RecordingScreen.tsx # Live tracking display + "Stop" button
│   └── SummaryScreen.tsx   # Track summary with map, export/reset options
├── hooks/
│   ├── useLocation.ts      # GPS permission & position tracking (watchPositionAsync)
│   └── useTrackStore.ts    # Zustand store for recording state & waypoints
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
| Location       | expo-location               |
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

# Run on web browser
npm run web        # or: expo start --web
```

> **Note:** GPS functionality requires a **physical device** (GPS not available in simulators)

## Building Production APK

```bash
# Build Android APK with EAS
eas build --platform android --profile production
```

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

Computed values: `getRecordingDuration()`, `getTotalDistance()` (Haversine), `getAverageSpeed()`

## Navigation

Navigation is **state-based** (not using react-navigation library). `App.tsx` maintains a `screen` state (`'home' | 'recording' | 'summary'`) and conditionally renders the appropriate screen component.

## Export Formats

### KML
XML format developed by Google, compatible with Google Earth, Google Maps and various GIS applications.

### GPX
GPS Exchange Format, open standard compatible with most GPS devices, fitness apps (Strava, Garmin Connect, etc.) and mapping software.

## Technical Details

- **GPS Updates** – Configured every 3-5 seconds with 10-meter distance interval
- **Distance Calculation** – Haversine formula with Earth radius = 6371 km
- **Waypoint Limit** – Last 50 entries retained for memory optimization
- **TypeScript** – Strict mode enabled
- **Permissions** – Location access required for GPS tracking

## Permissions

Configured in `app.json`:

- **Android**: `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_TYPE_LOCATION`
- **iOS**: `NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysUsageDescription`

## Project Structure

```
GPS-Track-Recorder/
├── screens/          # UI components for each app screen
├── hooks/            # Custom hooks for GPS and state management
├── lib/              # Utility functions (GPS calculations, export)
├── types/            # TypeScript type definitions
└── assets/           # Static assets (icons, images)
```

## Development Conventions

- TypeScript strict mode enabled
- All source files are `.ts` / `.tsx`
- Styling uses React Native `StyleSheet.create()`
- Italian language used for user-facing strings
- Extensive `console.log` statements for debugging

## License

Private project - All rights reserved

---

Built with ❤️ using Expo, React Native, and TypeScript
