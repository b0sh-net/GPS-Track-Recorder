// Type definitions for GPS Track Recorder
export type LocationData = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  altitude?: number;
  heading?: number;
  speed?: number;
};

export type Waypoint = LocationData & {
  elevation?: number;
};

export type TrackSummary = {
  distanceKm: number;
  durationMs: number;
  speedKmh: number;
  waypointCount: number;
};

export type AppScreen = 'home' | 'recording' | 'summary';
