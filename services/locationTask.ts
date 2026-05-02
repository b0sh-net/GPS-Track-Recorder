import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import useTrackStore from '../hooks/useTrackStore';
import { LocationData } from '../hooks/useLocation';

export const BACKGROUND_LOCATION_TASK = 'background-location-task';

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background Location Task Error:', error.message);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    if (locations && locations.length > 0) {
      const state = useTrackStore.getState();
      console.log(`Background Location - Received ${locations.length} points. Store isRecording: ${state.isRecording}`);
      
      // Procediamo solo se la registrazione è effettivamente attiva
      if (state.isRecording) {
        const waypoints: LocationData[] = locations.map(location => ({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy ?? 0,
          timestamp: location.timestamp,
          altitude: location.coords.altitude ?? undefined,
          heading: location.coords.heading ?? undefined,
          speed: location.coords.speed ?? undefined,
        }));
        
        // Aggiunge i punti allo store in batch e li invia al backend
        state.addWaypoints(waypoints);
      } else {
        console.log('Background Location - Received location but isRecording is false, stopping updates');
        // Se per qualche motivo il task gira ma non stiamo registrando, fermiamolo
        try {
          await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        } catch (e) {
          // Ignora errori se il task era già fermo
        }
      }
    }
  }
});
