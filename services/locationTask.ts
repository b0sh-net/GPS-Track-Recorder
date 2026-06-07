import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import useTrackStore from '../hooks/useTrackStore';
import { LocationData } from '../hooks/useLocation';
import { loadRecordingState, saveRecordingState } from '../lib/storageUtils';
import { batchWaypoints } from '../services/backendApi';

export const BACKGROUND_LOCATION_TASK = 'background-location-task';

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background Location Task Error:', error.message);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    if (locations && locations.length > 0) {
      // Carichiamo lo stato persistito per verificare se stiamo registrando
      const persistedState = await loadRecordingState();
      
      console.log(`Background Location - Received ${locations.length} points. Persisted isRecording: ${persistedState?.isRecording}`);

      if (persistedState && persistedState.isRecording) {
        const newWaypoints: LocationData[] = locations.map(location => ({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy ?? 0,
          timestamp: location.timestamp,
          altitude: location.coords.altitude ?? undefined,
          heading: location.coords.heading ?? undefined,
          speed: location.coords.speed ?? undefined,
        }));

        // Aggiorna lo stato persistito
        const updatedWaypoints = [...persistedState.waypoints, ...newWaypoints];
        const updatedSequence = persistedState.waypointSequence + newWaypoints.length;
        
        await saveRecordingState({
          ...persistedState,
          waypoints: updatedWaypoints,
          waypointSequence: updatedSequence,
        });

        // Sincronizza anche lo store in-memory (se il JS context è lo stesso, si aggiorna)
        const memoryStore = useTrackStore.getState();
        if (memoryStore.isRecording) {
          await memoryStore.addWaypoints(newWaypoints);
        }

        // Se la sincronizzazione con il backend è attiva, invia i punti
        if (persistedState.trackUuid) {
          const waypointsWithSequence = newWaypoints.map((wp, index) => ({
            location: wp,
            sequence: persistedState.waypointSequence + index,
          }));

          batchWaypoints(persistedState.trackUuid, waypointsWithSequence).catch(err => {
            console.error('Background Location - Failed to sync batch waypoints:', err);
          });
        }
      } else {
        console.log('Background Location - Received location but isRecording is false or state not found, stopping updates');
        try {
          await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        } catch (e) {
          // Ignora errori se il task era già fermo
        }
      }
    }
  }
});
