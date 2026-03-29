import { create } from 'zustand';
import { LocationData } from '../hooks/useLocation';

type RecordingState = {
  isRecording: boolean;
  waypoints: LocationData[];
  startTime: number | null;
};

type Action = {
  startRecording: () => void;
  stopRecording: () => void;
  reset: () => void;
  addWaypoint: (waypoint: LocationData) => void;
  getRecordingDuration: () => number;
  getTotalDistance: () => number;
  getAverageSpeed: () => number;
  clearWaypoints: () => void;
};

const useTrackStore = create<RecordingState & Action>((set, get) => ({
  isRecording: false,
  waypoints: [],
  startTime: null,

  startRecording: () =>
    set({
      isRecording: true,
      waypoints: [],
      startTime: Date.now(),
    }),

  stopRecording: () => {
    const { waypoints, startTime } = get();
    return set({ isRecording: false });
  },

  reset: () =>
    set({
      isRecording: false,
      waypoints: [],
      startTime: null,
    }),

  addWaypoint: (waypoint) => {
    const { waypoints } = get();
    return set({ waypoints: [...waypoints, waypoint] });
  },

  clearWaypoints: () => {
    const { waypoints } = get();
    // Mantieni solo i punti più recenti (ultimo 50)
    return set({ waypoints: waypoints.slice(-50) });
  },

  getRecordingDuration: () => {
    const { startTime } = get();
    return startTime ? Date.now() - startTime : 0;
  },

  getTotalDistance: () => {
    const { waypoints } = get();
    if (waypoints.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const wp1 = waypoints[i];
      const wp2 = waypoints[i + 1];
      const dLat = wp2.latitude - wp1.latitude;
      const dLon = wp2.longitude - wp1.longitude;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(wp1.latitude * Math.PI / 180) *
        Math.cos(wp2.latitude * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDistance += c * 6371;
    }
    return totalDistance;
  },

  getAverageSpeed: () => {
    const { startTime, waypoints } = get();
    const distance = get().getTotalDistance();
    const duration = get().getRecordingDuration();
    return duration > 0 ? (distance / duration) * 3600 : 0; // km/h
  },
}));

export default useTrackStore;
