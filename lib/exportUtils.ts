/**
 * Export Utils - Generazione file KML e GPX
 */

/**
 * Genera un file KML da un array di waypoint
 * @param waypoints - Array di waypoint {lat, lon, timestamp}
 * @returns Stringa XML KML
 */
export function generateKML(waypoints: { lat: number; lon: number; timestamp: number }[]): string {
  const pointElements = waypoints
    .map((wp) => {
      const timestamp = new Date(wp.timestamp).toISOString().split('.')[0].replace(/-/g, '/');
      return `  <Placemark>
    <name>Point at ${timestamp}</name>
    <Point>
      <coordinates>${wp.lon},${wp.lat},0</coordinates>
    </Point>
  </Placemark>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>GPS Track</name>
    <description>Track recorded by GPS Track Recorder</description>
${pointElements}
  </Document>
</kml>`;
}

/**
 * Genera un file GPX da un array di waypoint
 * @param waypoints - Array di waypoint {lat, lon, elevation?, timestamp}
 * @returns Stringa XML GPX
 */
export function generateGPX(waypoints: { lat: number; lon: number; elevation?: number; timestamp: number }[]): string {
  const trkptElements = waypoints
    .map((wp) => {
      const timestamp = new Date(wp.timestamp).toISOString();
      const elevation = wp.elevation !== undefined ? wp.elevation : '';
      return `    <trkpt lat="${wp.lat}" lon="${wp.lon}">
      <ele>${elevation}</ele>
      <time>${timestamp}</time>
    </trkpt>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GPS Track Recorder" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>GPS Track</name>
    <desc>Track recorded by GPS Track Recorder</desc>
${trkptElements}
  </trk>
</gpx>`;
}

/**
 * Esporta la traccia come file KML usando expo-sharing
 * @param waypoints - Array di waypoint
 * @param fileName - Nome del file da esportare
 * @returns Promise che risolve quando il file è stato salvato
 */
export async function exportToKML(waypoints: { lat: number; lon: number; timestamp: number }[], fileName: string = 'track.kml'): Promise<void> {
  const kmlContent = generateKML(waypoints);

  // Copia il contenuto in un file temporaneo
  const fileSystem = require('expo-file-system');
  const assetLibrary = fileSystem.documentDirectory + fileName;

  // Usa expo-sharing per salvare
  const { shareAsync } = require('expo-sharing');

  await fileSystem.writeAsStringAsync(assetLibrary, kmlContent, {
    encoding: fileSystem.EncodingType.UTF8,
  });

  // Avvia shareAsync per permettere all'utente di salvare il file
  await shareAsync(assetLibrary, fileName);

  // Cancella file temporaneo
  await fileSystem.deleteAsync(assetLibrary);
}

/**
 * Esporta la traccia come file GPX usando expo-sharing
 * @param waypoints - Array di waypoint
 * @param fileName - Nome del file da esportare
 * @returns Promise che risolve quando il file è stato salvato
 */
export async function exportToGPX(
  waypoints: { lat: number; lon: number; elevation?: number; timestamp: number }[],
  fileName: string = 'track.gpx'
): Promise<void> {
  const gpxContent = generateGPX(waypoints);

  const fileSystem = require('expo-file-system');
  const assetLibrary = fileSystem.documentDirectory + fileName;
  const { shareAsync } = require('expo-sharing');

  await fileSystem.writeAsStringAsync(assetLibrary, gpxContent, {
    encoding: fileSystem.EncodingType.UTF8,
  });

  await shareAsync(assetLibrary, fileName);

  // Cancella file temporaneo
  await fileSystem.deleteAsync(assetLibrary);
}

/**
 * Ottiene una data per il nome file basato sul timestamp
 * @param timestamp - Timestamp in millisecondi
 * @returns Nome file con data e ora
 */
export function getFileNameFromTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `track_${year}${month}${day}_${hours}${minutes}.kml`;
}
