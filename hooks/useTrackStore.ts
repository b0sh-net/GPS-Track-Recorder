import { create } from 'zustand';
import * as Location from 'expo-location';
import { LocationData } from '../hooks/useLocation';
import { calculateTotalDistance } from '../lib/gpsUtils';
import { startTrack, addWaypoint as sendWaypointToBackend, batchWaypoints, completeTrack } from '../services/backendApi';
import { saveRecordingState, loadRecordingState, clearRecordingState } from '../lib/storageUtils';

const BACKGROUND_LOCATION_TASK = 'background-location-task';

type RecordingState = {
  isRecording: boolean;
  waypoints: LocationData[];
  startTime: number | null;
  finalDuration: number | null;
  finalAverageSpeed: number | null;
  trackUuid: string | null; // Unique UUID from backend for identification and web links
  trackId: number | null; // Numeric ID from backend (internal use)
  waypointSequence: number; // Sequence counter for backend
  syncWithBackend: boolean; // Whether to sync with backend
};

type Action = {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  reset: () => void;
  addWaypoint: (waypoint: LocationData) => void;
  addWaypoints: (waypoints: LocationData[]) => Promise<void>;
  loadPersistedState: () => Promise<void>;
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
  trackId: null,
  waypointSequence: 0,
  syncWithBackend: true, // Enable by default

  startRecording: async () => {
    console.log('useTrackStore - startRecording called');
    
    // Richiesta permessi prima di iniziare
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        console.warn('Foreground location permission denied');
        return;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.warn('Background location permission denied');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }

    // Start track on backend
    let trackUuid = null;
    let trackId = null;
    if (get().syncWithBackend) {
      try {
        const result = await startTrack();
        if (result.success) {
          trackUuid = result.trackUuid || null;
          trackId = result.trackId || null;
          console.log('Backend track started:', { trackUuid, trackId });
        }
      } catch (error) {
        console.error('Failed to start backend track:', error);
      }
    }

    const now = Date.now();
    set({
      isRecording: true,
      waypoints: [],
      startTime: now,
      finalDuration: null,
      finalAverageSpeed: null,
      trackUuid,
      trackId,
      waypointSequence: 0,
    });

    // Salva lo stato iniziale persistito su disco
    await saveRecordingState({
      isRecording: true,
      trackUuid,
      trackId,
      startTime: now,
      waypointSequence: 0,
      waypoints: [],
    });

    // Avvia il tracking in background
    try {
      console.log('useTrackStore - Starting background location updates');
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.Highest, // Massima precisione per evitare sospensioni
        timeInterval: 2000,
        distanceInterval: 5, // Ridotto per essere più sensibile al movimento
        // Android specific options
        foregroundService: {
          notificationTitle: 'Registrazione GPS attiva',
          notificationBody: 'L\'app sta registrando il tuo percorso.',
          notificationColor: '#4CAF50',
          killServiceOnDestroy: false, // Mantieni il servizio vivo se l'app viene chiusa
        },
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true, // Importante per iOS
        deferredUpdatesInterval: 0,
        deferredUpdatesDistance: 0,
      });
    } catch (error) {
      console.error('Failed to start background location updates:', error);
    }
  },

  stopRecording: async () => {
    console.log('useTrackStore - stopRecording called');
    const { waypoints, startTime, trackUuid, syncWithBackend } = get();

    // Imposta immediatamente lo stato di registrazione a false per evitare race condition
    // con il background task che potrebbe aggiungere waypoint mentre stiamo chiudendo
    set({ isRecording: false });

    // Cancella lo stato persistito su disco
    await clearRecordingState();

    // Ferma il tracking in background
    try {
      console.log('useTrackStore - Stopping background location updates');
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    } catch (error) {
      console.error('Failed to stop background location updates:', error);
    }

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
      
      // Calculate max speed safely without spread operator
      maxSpeed = waypoints.reduce((max, wp) => {
        const speed = (wp.speed ?? 0) * 3.6;
        return speed > max ? speed : max;
      }, 0);
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
      finalDuration: duration,
      finalAverageSpeed: avgSpeed,
    });
  },

  reset: () => {
    console.log('useTrackStore - reset called');
    clearRecordingState().catch(err => console.error('Failed to clear persisted state on reset:', err));
    set({
      isRecording: false,
      waypoints: [],
      startTime: null,
      finalDuration: null,
      finalAverageSpeed: null,
      trackUuid: null,
      trackId: null,
      waypointSequence: 0,
    });
  },

  addWaypoint: (waypoint: LocationData) => {
    const { isRecording, waypoints, trackUuid, waypointSequence, syncWithBackend } = get();
    
    if (!isRecording) return;

    // Aggiornamento locale immediato per reattività UI
    const newWaypoints = waypoints.length > 10000
      ? [...waypoints.slice(-8000), waypoint]
      : [...waypoints, waypoint];
    
    const nextSequence = waypointSequence + 1;
    set({ 
      waypoints: newWaypoints,
      waypointSequence: nextSequence,
    });

    // Persisti lo stato aggiornato su disco in modo asincrono
    saveRecordingState({
      isRecording: true,
      trackUuid,
      trackId: get().trackId,
      startTime: get().startTime,
      waypointSequence: nextSequence,
      waypoints: newWaypoints,
    }).catch(err => console.error('Failed to persist waypoint:', err));

    // Sincronizzazione backend non bloccante
    if (syncWithBackend && trackUuid) {
      sendWaypointToBackend(trackUuid, waypoint, waypointSequence).catch(err => {
        console.error('Failed to sync waypoint (non-blocking):', err);
      });
    }
  },

  addWaypoints: async (newWaypointsBatch: LocationData[]) => {
    const { isRecording, waypoints, trackUuid, waypointSequence, syncWithBackend } = get();

    if (!isRecording || newWaypointsBatch.length === 0) {
      return;
    }

    console.log(`useTrackStore - Adding ${newWaypointsBatch.length} waypoints`);

    // Prepariamo i dati per il backend
    const waypointsWithSequence = newWaypointsBatch.map((wp: LocationData, index: number) => ({
      location: wp,
      sequence: waypointSequence + index
    }));

    // Aggiornamento locale immediato
    const combinedWaypoints = waypoints.length + newWaypointsBatch.length > 10000
      ? [...waypoints.slice(-(8000 - newWaypointsBatch.length)), ...newWaypointsBatch]
      : [...waypoints, ...newWaypointsBatch];

    const nextSequence = waypointSequence + newWaypointsBatch.length;
    set({
      waypoints: combinedWaypoints,
      waypointSequence: nextSequence,
    });

    // Persisti lo stato aggiornato su disco
    await saveRecordingState({
      isRecording: true,
      trackUuid,
      trackId: get().trackId,
      startTime: get().startTime,
      waypointSequence: nextSequence,
      waypoints: combinedWaypoints,
    }).catch(err => console.error('Failed to persist batch waypoints:', err));

    // Sincronizzazione backend in batch (non bloccante per lo store)
    if (syncWithBackend && trackUuid) {
      batchWaypoints(trackUuid, waypointsWithSequence).catch(err => {
        console.error('Failed to sync batch waypoints (non-blocking):', err);
      });
    }
  },

  loadPersistedState: async () => {
    console.log('useTrackStore - loadPersistedState called');
    const persisted = await loadRecordingState();
    if (persisted && persisted.isRecording) {
      console.log('useTrackStore - Restoring persisted recording state', {
        trackUuid: persisted.trackUuid,
        waypointsCount: persisted.waypoints.length
      });
      set({
        isRecording: persisted.isRecording,
        trackUuid: persisted.trackUuid,
        trackId: persisted.trackId,
        startTime: persisted.startTime,
        waypointSequence: persisted.waypointSequence,
        waypoints: persisted.waypoints,
      });
    }
  },

  clearWaypoints: () => {
    console.log('useTrackStore - clearWaypoints called');
    // Cancella realmente tutti i waypoint
    set({ waypoints: [] });
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
