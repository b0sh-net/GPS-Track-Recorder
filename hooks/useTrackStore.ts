import { create } from 'zustand';
import { LocationData } from '../hooks/useLocation';
import { calculateTotalDistance } from '../lib/gpsUtils';

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

  startRecording: () => {
    console.log('useTrackStore - startRecording called');
    set({
      isRecording: true,
      waypoints: [],
      startTime: Date.now(),
    });
  },

  stopRecording: () => {
    console.log('useTrackStore - stopRecording called');
    const { waypoints, startTime } = get();
    return set({ isRecording: false });
  },

  reset: () => {
    console.log('useTrackStore - reset called');
    set({
      isRecording: false,
      waypoints: [],
      startTime: null,
    });
  },

  addWaypoint: (waypoint) => {
    console.log('useTrackStore - addWaypoint called', waypoint);
    const { waypoints } = get();
    // Cap array to prevent memory issues on long recordings
    const newWaypoints = waypoints.length > 10000
      ? [...waypoints.slice(-8000), waypoint]
      : [...waypoints, waypoint];
    return set({ waypoints: newWaypoints });
  },

  clearWaypoints: () => {
    console.log('useTrackStore - clearWaypoints called');
    const { waypoints } = get();
    // Mantieni solo i punti più recenti (ultimo 50)
    return set({ waypoints: waypoints.slice(-50) });
  },

  getRecordingDuration: () => {
    const { startTime } = get();
    const result = startTime ? Date.now() - startTime : 0;
    console.log('useTrackStore - getRecordingDuration called:', result);
    return result;
  },

  getTotalDistance: () => {
    const { waypoints } = get();
    if (waypoints.length < 2) {
      console.log('useTrackStore - getTotalDistance called: < 2 waypoints, returning 0');
      return 0;
    }
    const result = calculateTotalDistance(
      waypoints.map(wp => ({ lat: wp.latitude, lon: wp.longitude }))
    );
    console.log('useTrackStore - getTotalDistance called:', result, 'waypoints:', waypoints.length);
    return result;
  },

  getAverageSpeed: () => {
    console.log('useTrackStore - getAverageSpeed called');
    const { startTime, waypoints } = get();
    const duration = startTime ? Date.now() - startTime : 0;
    const distance = waypoints.length < 2
      ? 0
      : calculateTotalDistance(waypoints.map(wp => ({ lat: wp.latitude, lon: wp.longitude })));
    const result = duration > 0 ? (distance / duration) * 3600 : 0; // km/h
    console.log('useTrackStore - getAverageSpeed result:', result, 'distance:', distance, 'duration:', duration);
    return result;
  },
}));

export default useTrackStore;
