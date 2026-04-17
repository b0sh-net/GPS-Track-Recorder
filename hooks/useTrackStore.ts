import { create } from 'zustand';
import { LocationData } from '../hooks/useLocation';
import { calculateTotalDistance } from '../lib/gpsUtils';
import { startTrack, addWaypoint as sendWaypointToBackend, completeTrack } from '../services/backendApi';

type RecordingState = {
  isRecording: boolean;
  waypoints: LocationData[];
  startTime: number | null;
  finalDuration: number | null;
  finalAverageSpeed: number | null;
  trackUuid: string | null; // UUID from backend
  waypointSequence: number; // Sequence counter for backend
  syncWithBackend: boolean; // Whether to sync with backend
};

type Action = {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
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
  finalDuration: null,
  finalAverageSpeed: null,
  trackUuid: null,
  waypointSequence: 0,
  syncWithBackend: true, // Enable by default

  startRecording: async () => {
    console.log('useTrackStore - startRecording called');
    
    // Start track on backend
    let trackUuid = null;
    if (get().syncWithBackend) {
      try {
        const result = await startTrack();
        if (result.success) {
          trackUuid = result.trackUuid || null;
          console.log('Backend track started:', trackUuid);
        }
      } catch (error) {
        console.error('Failed to start backend track:', error);
      }
    }

    set({
      isRecording: true,
      waypoints: [],
      startTime: Date.now(),
      finalDuration: null,
      finalAverageSpeed: null,
      trackUuid,
      waypointSequence: 0,
    });
  },

  stopRecording: async () => {
    console.log('useTrackStore - stopRecording called');
    const { waypoints, startTime, trackUuid, syncWithBackend } = get();

    // Calcola e salva durata e velocità media finali
    const duration = startTime ? Date.now() - startTime : 0;
    let avgSpeed = 0;
    let maxSpeed = 0;
    let totalDistance = 0;
    
    if (waypoints.length >= 2 && startTime && duration > 0) {
      totalDistance = calculateTotalDistance(
        waypoints.map(wp => ({ lat: wp.latitude, lon: wp.longitude }))
      );
      avgSpeed = (totalDistance / duration) * 3600000;
      
      // Calculate max speed
      const speeds = waypoints
        .map(wp => wp.speed)
        .filter((s): s is number => s !== undefined && s !== null);
      
      if (speeds.length > 0) {
        maxSpeed = Math.max(...speeds) * 3.6; // Convert m/s to km/h
      }
    }

    console.log('useTrackStore - stopRecording final values:', { duration, avgSpeed, totalDistance, maxSpeed });

    // Complete track on backend
    if (syncWithBackend && trackUuid) {
      try {
        await completeTrack(trackUuid, {
          durationSeconds: Math.floor(duration / 1000),
          totalDistanceKm: totalDistance,
          averageSpeedKmh: avgSpeed,
          maxSpeedKmh: maxSpeed,
        });
        console.log('Backend track completed');
      } catch (error) {
        console.error('Failed to complete backend track:', error);
      }
    }

    set({
      isRecording: false,
      finalDuration: duration,
      finalAverageSpeed: avgSpeed,
    });
  },

  reset: () => {
    console.log('useTrackStore - reset called');
    set({
      isRecording: false,
      waypoints: [],
      startTime: null,
      finalDuration: null,
      finalAverageSpeed: null,
    });
  },

  addWaypoint: async (waypoint) => {
    console.log('useTrackStore - addWaypoint called', waypoint);
    const { waypoints, trackUuid, waypointSequence, syncWithBackend } = get();
    
    // Cap array to prevent memory issues on long recordings
    const newWaypoints = waypoints.length > 10000
      ? [...waypoints.slice(-8000), waypoint]
      : [...waypoints, waypoint];
    
    // Send waypoint to backend
    if (syncWithBackend && trackUuid) {
      try {
        await sendWaypointToBackend(trackUuid, waypoint, waypointSequence);
      } catch (error) {
        console.error('Failed to send waypoint to backend:', error);
      }
    }

    set({ 
      waypoints: newWaypoints,
      waypointSequence: waypointSequence + 1,
    });
  },

  clearWaypoints: () => {
    console.log('useTrackStore - clearWaypoints called');
    const { waypoints } = get();
    // Mantieni solo i punti più recenti (ultimo 50)
    set({ waypoints: waypoints.slice(-50) });
  },

  getRecordingDuration: () => {
    const { startTime, isRecording, finalDuration } = get();
    
    // Se la registrazione è ferma, usa il valore finale salvato
    if (!isRecording && finalDuration !== null) {
      console.log('useTrackStore - getRecordingDuration using final value:', finalDuration);
      return finalDuration;
    }
    
    // Altrimenti calcola in tempo reale
    const result = startTime ? Date.now() - startTime : 0;
    console.log('useTrackStore - getRecordingDuration calculated:', result);
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
    const { startTime, waypoints, isRecording, finalAverageSpeed } = get();

    // Se la registrazione è ferma, usa il valore finale salvato
    if (!isRecording && finalAverageSpeed !== null) {
      console.log('useTrackStore - getAverageSpeed using final value:', finalAverageSpeed);
      return finalAverageSpeed;
    }

    // Need at least 2 waypoints to calculate distance
    if (waypoints.length < 2 || !startTime) {
      console.log('useTrackStore - getAverageSpeed: insufficient data, returning 0');
      return 0;
    }

    const duration = Date.now() - startTime; // milliseconds
    const distance = calculateTotalDistance(
      waypoints.map(wp => ({ lat: wp.latitude, lon: wp.longitude }))
    );

    // Avoid division by zero
    if (duration <= 0) {
      console.log('useTrackStore - getAverageSpeed: duration is 0, returning 0');
      return 0;
    }

    // Convert to km/h: (distance in km / duration in ms) * 3600000 ms/h
    const result = (distance / duration) * 3600000;
    console.log('useTrackStore - getAverageSpeed result:', result, 'distance:', distance, 'duration:', duration);
    return result;
  },
}));

export default useTrackStore;
