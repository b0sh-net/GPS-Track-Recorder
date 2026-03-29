import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useLocation } from '../hooks/useLocation';
import useTrackStore from '../hooks/useTrackStore';
import { formatDuration } from '../lib/gpsUtils';

export default function RecordingScreen() {
  const [startTime] = useState(Date.now());
  const { location, status, error } = useLocation();
  const {
    waypoints,
    isRecording,
    addWaypoint,
    getRecordingDuration,
    getTotalDistance,
    getAverageSpeed,
    clearWaypoints,
  } = useTrackStore();

  const duration = getRecordingDuration();
  const distance = getTotalDistance();
  const speed = getAverageSpeed();

  const handleStopRecording = () => {
    // Navigazione verso SummaryScreen (gestita dal parent)
  };

  const handleClear = () => {
    if (confirm('Vuoi davvero cancellare la traccia corrente?')) {
      clearWaypoints();
    }
  };

  // Aggiorna waypoint quando riceve nuova posizione
  useEffect(() => {
    if (location && isRecording) {
      const waypoint: { lat: number; lon: number; timestamp: number } = {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: Date.now(),
      };
      addWaypoint(waypoint);
    }
  }, [location, isRecording, addWaypoint]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerText}>Registrazione...</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Distanza</Text>
          <Text style={styles.statValue}>{(distance ?? 0).toFixed(2)} km</Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Tempo</Text>
          <Text style={styles.statValue}>{formatDuration(duration)}</Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Velocità</Text>
          <Text style={styles.statValue}>
            {((speed ?? 0) as number).toFixed(1)} km/h
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Waypoint</Text>
          <Text style={styles.statValue}>{waypoints.length}</Text>
        </View>
      </View>

      {location ? (
        <View style={styles.locationInfo}>
          <Text style={styles.locationLabel}>Posizione:</Text>
          <Text style={styles.locationValue}>
            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </Text>
          {location.speed !== undefined && (
            <Text style={styles.locationSubValue}>
              {location.speed.toFixed(1)} km/h
            </Text>
          )}
        </View>
      ) : null}

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.stopButton}
          onPress={handleStopRecording}
          accessibilityLabel="Ferma registrazione"
        >
          <Text style={styles.stopButtonText}>FERMA REGISTRAZIONE</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.clearButton}
        onPress={handleClear}
        accessibilityLabel="Cancella traccia"
      >
        <Text style={styles.clearButtonText}>Cancella traccia</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#16213e',
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  locationInfo: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  locationLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  locationSubValue: {
    fontSize: 12,
    color: '#666',
  },
  errorText: {
    fontSize: 12,
    color: '#ff4444',
    textAlign: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  buttonContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  stopButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#cc0000',
  },
  stopButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  clearButton: {
    backgroundColor: 'transparent',
    padding: 10,
    marginTop: 12,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#666',
  },
});
