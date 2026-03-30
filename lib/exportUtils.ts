/**
 * Export Utils - Generazione file KML e GPX
 */

/**
 * Genera un file KML da un array di waypoint
 * @param waypoints - Array di waypoint {lat, lon, timestamp}
 * @returns Stringa XML KML
 */
export function generateKML(waypoints: { latitude: number; longitude: number; timestamp: number }[]): string {
  const pointElements = waypoints
    .map((wp) => {
      let timestampString = '';
      try {
        const date = new Date(wp.timestamp);
        // Check if the date is valid
        if (!isNaN(date.getTime())) {
          timestampString = date.toISOString().split('.')[0].replace(/-/g, '/');
        } else {
          // Fallback to current time if timestamp is invalid
          const now = new Date();
          timestampString = now.toISOString().split('.')[0].replace(/-/g, '/');
          console.warn('generateKML - Invalid timestamp:', wp.timestamp, 'using current time instead');
        }
      } catch (error) {
        // Fallback to current time if timestamp causes error
        const now = new Date();
        timestampString = now.toISOString().split('.')[0].replace(/-/g, '/');
        console.warn('generateKML - Timestamp error:', error, 'using current time instead');
      }
      return `  <Placemark>
    <name>Point at ${timestampString}</name>
    <Point>
      <coordinates>${wp.longitude},${wp.latitude},0</coordinates>
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
export function generateGPX(waypoints: { latitude: number; longitude: number; elevation?: number; timestamp: number }[]): string {
  const trkptElements = waypoints
    .map((wp) => {
      let timestampString = '';
      try {
        const date = new Date(wp.timestamp);
        // Check if the date is valid
        if (!isNaN(date.getTime())) {
          timestampString = date.toISOString();
        } else {
          // Fallback to current time if timestamp is invalid
          const now = new Date();
          timestampString = now.toISOString();
          console.warn('generateGPX - Invalid timestamp:', wp.timestamp, 'using current time instead');
        }
      } catch (error) {
        // Fallback to current time if timestamp causes error
        const now = new Date();
        timestampString = now.toISOString();
        console.warn('generateGPX - Timestamp error:', error, 'using current time instead');
      }
      const elevation = wp.elevation !== undefined ? wp.elevation : '';
      return `    <trkpt lat="${wp.latitude}" lon="${wp.longitude}">
      <ele>${elevation}</ele>
      <time>${timestampString}</time>
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
export async function exportToKML(waypoints: { latitude: number; longitude: number; timestamp: number }[], fileName: string = 'track.kml'): Promise<void> {
  try {
    const kmlContent = generateKML(waypoints);
    console.log('exportToKML - Generated KML content length:', kmlContent.length);

    // Copia il contenuto in un file temporaneo
    const fileSystem = require('expo-file-system/legacy');
    console.log('exportToKML - fileSystem:', fileSystem);
    const assetLibrary = fileSystem.documentDirectory ? fileSystem.documentDirectory + fileName : fileName;
    console.log('exportToKML - Writing to file:', assetLibrary);

    // Usa expo-sharing per salvare
    const { shareAsync } = require('expo-sharing');

    await fileSystem.writeAsStringAsync(assetLibrary, kmlContent, {
      encoding: fileSystem.EncodingType && fileSystem.EncodingType.UTF8 ? fileSystem.EncodingType.UTF8 : 'utf8',
    });
    console.log('exportToKML - File written successfully');

    // Avvia shareAsync per permettere all'utente di salvare il file
    await shareAsync(assetLibrary);
    console.log('exportToKML - Share completed');

    // Cancella file temporaneo
    await fileSystem.deleteAsync(assetLibrary);
    console.log('exportToKML - Temporary file deleted');
  } catch (error) {
    console.error('exportToKML - Error:', error);
    throw error;
  }
}

/**
 * Esporta la traccia come file GPX usando expo-sharing
 * @param waypoints - Array di waypoint
 * @param fileName - Nome del file da esportare
 * @returns Promise che risolve quando il file è stato salvato
 */
export async function exportToGPX(
  waypoints: { latitude: number; longitude: number; elevation?: number; timestamp: number }[],
  fileName: string = 'track.gpx'
): Promise<void> {
  try {
    const gpxContent = generateGPX(waypoints);
    console.log('exportToGPX - Generated GPX content length:', gpxContent.length);

    const fileSystem = require('expo-file-system/legacy');
    console.log('exportToGPX - fileSystem:', fileSystem);
    const assetLibrary = fileSystem.documentDirectory ? fileSystem.documentDirectory + fileName : fileName;
    const { shareAsync } = require('expo-sharing');
    console.log('exportToGPX - Writing to file:', assetLibrary);

    await fileSystem.writeAsStringAsync(assetLibrary, gpxContent, {
      encoding: fileSystem.EncodingType && fileSystem.EncodingType.UTF8 ? fileSystem.EncodingType.UTF8 : 'utf8',
    });
    console.log('exportToGPX - File written successfully');

    await shareAsync(assetLibrary);
    console.log('exportToGPX - Share completed');

    // Cancella file temporaneo
    await fileSystem.deleteAsync(assetLibrary);
    console.log('exportToGPX - Temporary file deleted');
  } catch (error) {
    console.error('exportToGPX - Error:', error);
    throw error;
  }
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
