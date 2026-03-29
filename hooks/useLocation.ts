import { useEffect, useState, useRef } from 'react';
import * as Location from 'expo-location';

export type LocationData = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  altitude?: number;
  heading?: number;
  speed?: number;
};

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [status, setStatus] = useState<Location.PermissionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<Location.Subscription | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Richiedi permessi e inizia il monitoraggio
    (async () => {
      try {
        console.log('useLocation - Requesting foreground permissions');
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          setError('Posizione non autorizzata. Abilita i permessi nelle impostazioni.');
          console.log('useLocation - Permissions denied:', status);
          return;
        }

        console.log('useLocation - Permissions granted:', status);
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          allowBackgroundLocationUpdates: true,
          timeInterval: 3000, // Richiedi nuova posizione ogni 3 secondi
          distanceInterval: 10, // Richiedi nuova posizione ogni 10 metri
        });

        if (isMounted) {
          console.log('useLocation - Initial location:', currentLocation.coords);
          setLocation(currentLocation.coords);
          setStatus(status);
        }

        // Ascolta aggiornamenti in tempo reale dopo aver ottenuto i permessi
        console.log('useLocation - Setting up watchPositionAsync');
        subscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 3000,
            distanceInterval: 10,
          },
          (location) => {
            if (isMounted) {
              const locationData = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy,
                timestamp: location.timestamp,
                altitude: location.coords.altitude,
                heading: location.coords.heading,
                speed: location.coords.speed,
              };
              console.log('useLocation - New location update:', locationData);
              setLocation(locationData);
            }
          }
        );
      } catch (err) {
        if (isMounted) {
          const errorMsg = 'Errore durante l\'acquisizione della posizione: ' + (err as Error).message;
          setError(errorMsg);
          console.log('useLocation - Error:', errorMsg);
        }
      }
    })();

    // Timer per aggiornamenti periodici anche senza movimento significativo
    timerRef.current = setInterval(async () => {
      if (error) return;

      try {
        const currentLocation = await Location.getLastKnownPositionAsync();
        if (currentLocation) {
          if (isMounted) {
            console.log('useLocation - Timer update:', currentLocation);
            setLocation(currentLocation);
          }
        }
      } catch (err) {
        // Ignora errori
      }
    }, 5000); // Richiedi posizione ogni 5 secondi

    return () => {
      console.log('useLocation - Cleanup effect');
      isMounted = false;
      timerRef.current && clearInterval(timerRef.current);
      if (subscriptionRef.current) {
        console.log('useLocation - Removing subscription');
        subscriptionRef.current.remove();
      }
    };
  }, []);

  // Log when location changes
  useEffect(() => {
    if (location) {
      console.log('useLocation - Location state changed:', location);
    }
  }, [location]);

  return { location, status, error };
}
