/**
 * GPS Utility Functions
 * Calcoli: distanza, velocità, distanza totale
 */

/**
 * Costante di conversione gradi in radianti
 */
const RADIANS_PER_DEGREE = Math.PI / 180;

/**
 * Costante del raggio della Terra in km
 */
const EARTH_RADIUS_KM = 6371;

/**
 * Calcola la distanza tra due punti GPS usando la formula di Haversine
 * @param lat1 - Latitudine del primo punto (gradi)
 * @param lon1 - Longitudine del primo punto (gradi)
 * @param lat2 - Latitudine del secondo punto (gradi)
 * @param lon2 - Longitudine del secondo punto (gradi)
 * @returns Distanza in chilometri
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * RADIANS_PER_DEGREE;
  const dLon = (lon2 - lon1) * RADIANS_PER_DEGREE;
  const lat1Rad = lat1 * RADIANS_PER_DEGREE;
  const lat2Rad = lat2 * RADIANS_PER_DEGREE;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) *
    Math.cos(lat2Rad) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Calcola la velocità in km/h
 * @param distance - Distanza percorsa in km
 * @param timeSeconds - Tempo trascorso in secondi
 * @returns Velocità in km/h
 */
export function calculateSpeed(distanceKm: number, timeSeconds: number): number {
  if (timeSeconds <= 0) return 0;
  return (distanceKm / timeSeconds) * 3600;
}

/**
 * Calcola la distanza totale percorrendo tutti i segmenti tra waypoint consecutivi
 * @param waypoints - Array di waypoint {lat, lon}
 * @returns Distanza totale in km
 */
export function calculateTotalDistance(waypoints: { lat: number; lon: number }[]): number {
  if (waypoints.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const waypoint1 = waypoints[i];
    const waypoint2 = waypoints[i + 1];
    const distance = calculateDistance(waypoint1.lat, waypoint1.lon, waypoint2.lat, waypoint2.lon);
    totalDistance += distance;
  }

  return totalDistance;
}

/**
 * Ottiene il timestamp corrente
 * @returns Timestamp in millisecondi
 */
export function getCurrentTimestamp(): number {
  return Date.now();
}

/**
 * Formatta una data/hora
 * @param timestamp - Timestamp in millisecondi
 * @returns Stringa formattata
 */
export function formatTimestamp(timestamp: number = Date.now()): string {
  return new Date(timestamp).toLocaleString('it-IT');
}

/**
 * Formatta i millisecondi in stringa leggibile
 * @param ms - Millisecondi
 * @returns Stringa formattata (es. "1:23:45")
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number): string => (n < 10 ? `0${n}` : `${n}`);
  return `${hours}:${pad(minutes)}:${pad(seconds)}`;
}
