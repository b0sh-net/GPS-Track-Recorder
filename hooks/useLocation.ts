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
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          setError('Posizione non autorizzata. Abilita i permessi nelle impostazioni.');
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          allowBackgroundLocationUpdates: true,
          timeInterval: 3000, // Richiedi nuova posizione ogni 3 secondi
          distanceInterval: 10, // Richiedi nuova posizione ogni 10 metri
        });

        if (isMounted) {
          setLocation(currentLocation.coords);
          setStatus(status);
        }

        // Ascolta aggiornamenti in tempo reale dopo aver ottenuto i permessi
        subscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 3000,
            distanceInterval: 10,
          },
          (location) => {
            if (isMounted) {
              setLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy,
                timestamp: location.timestamp,
                altitude: location.coords.altitude,
                heading: location.coords.heading,
                speed: location.coords.speed,
              });
            }
          }
        );
      } catch (err) {
        if (isMounted) {
          setError('Errore durante l\'acquisizione della posizione: ' + (err as Error).message);
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
            setLocation(currentLocation);
          }
        }
      } catch (err) {
        // Ignora errori
      }
    }, 5000); // Richiedi posizione ogni 5 secondi

    return () => {
      isMounted = false;
      timerRef.current && clearInterval(timerRef.current);
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
    };
  }, []);

  return { location, status, error };
}
