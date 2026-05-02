import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocation, LocationData } from '../hooks/useLocation';
import useTrackStore from '../hooks/useTrackStore';
import { formatDuration } from '../lib/gpsUtils';

type RecordingScreenProps = {
  onStopRecording?: () => void;
};

export default function RecordingScreen({ onStopRecording = () => {} }: RecordingScreenProps) {
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

  const [pulseOn, setPulseOn] = useState(true);

  // Pulsing animation for recording indicator
  useEffect(() => {
    const interval = setInterval(() => setPulseOn(prev => !prev), 1000);
    return () => clearInterval(interval);
  }, []);

  // Log per debug
  useEffect(() => {
    console.log('RecordingScreen - Values:', {
      duration: getRecordingDuration(),
      distance: getTotalDistance(),
      speed: getAverageSpeed(),
      waypointsLength: waypoints.length,
      isRecording,
      location: location ? { lat: location.latitude, lon: location.longitude } : null
    });
  }, [waypoints, isRecording, location]);

  const duration = getRecordingDuration();
  const distance = getTotalDistance();
  const speed = getAverageSpeed();

  const handleStopRecording = () => {
    console.log('Handle stop recording called in screen');
    // Just notify App to handle the stop logic
    onStopRecording();
  };

  const handleClear = () => {
    Alert.alert(
      'Conferma cancellazione',
      'Vuoi davvero cancellare la traccia corrente?',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Cancella', onPress: () => clearWaypoints() },
      ]
    );
  };

  // La posizione viene aggiornata tramite BACKGROUND_LOCATION_TASK definito in locationTask.ts
  // che interagisce direttamente con useTrackStore.
  // Non è più necessario aggiungere waypoint manualmente qui.

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header with gradient */}
      <LinearGradient
        colors={['#0f3460', '#16213e', '#1a1a2e']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Recording indicator */}
        <View style={styles.recordingIndicator}>
          <View style={[styles.pulseDot, pulseOn ? styles.pulseOn : styles.pulseOff]} />
          <Text style={styles.recordingText}>IN REGISTRAZIONE</Text>
        </View>

        {/* GPS status badge */}
        <View style={styles.gpsBadge}>
          <Text style={styles.gpsBadgeIcon}>📡</Text>
          <Text style={styles.gpsBadgeText}>
            {location ? 'GPS Connesso' : 'Ricerca GPS...'}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {/* Distance */}
          <View style={[styles.statCard, styles.statCardLarge]}>
            <Text style={styles.statIcon}>📏</Text>
            <Text style={styles.statValue}>{(distance ?? 0).toFixed(2)}</Text>
            <Text style={styles.statUnit}>km</Text>
            <Text style={styles.statLabel}>Distanza</Text>
          </View>

          {/* Duration */}
          <View style={[styles.statCard, styles.statCardSmall]}>
            <Text style={styles.statIcon}>⏱️</Text>
            <Text style={[styles.statValue, styles.statValueSmall]}>{formatDuration(duration)}</Text>
            <Text style={styles.statLabel}>Tempo</Text>
          </View>

          {/* Speed */}
          <View style={[styles.statCard, styles.statCardSmall]}>
            <Text style={styles.statIcon}>💨</Text>
            <Text style={[styles.statValue, styles.statValueSmall]}>{(speed ?? 0).toFixed(1)}</Text>
            <Text style={styles.statUnit}>km/h</Text>
            <Text style={styles.statLabel}>Velocità</Text>
          </View>

          {/* Waypoints */}
          <View style={[styles.statCard, styles.statCardSmall]}>
            <Text style={styles.statIcon}>📍</Text>
            <Text style={[styles.statValue, styles.statValueSmall]}>{waypoints.length}</Text>
            <Text style={styles.statLabel}>Waypoint</Text>
          </View>

          {/* GPS Accuracy */}
          <View style={[styles.statCard, styles.statCardSmall]}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={[styles.statValue, styles.statValueSmall]}>
              {location ? `±${location.accuracy.toFixed(0)}` : '--'}
            </Text>
            <Text style={styles.statUnit}>m</Text>
            <Text style={styles.statLabel}>Precisione</Text>
          </View>
        </View>

        {/* Location details */}
        {location && (
          <View style={styles.locationCard}>
            <Text style={styles.locationCardTitle}>Coordinate GPS</Text>
            <View style={styles.locationRow}>
              <Text style={styles.locationLabel}>Lat:</Text>
              <Text style={styles.locationValue}>{location.latitude.toFixed(6)}</Text>
            </View>
            <View style={styles.locationRow}>
              <Text style={styles.locationLabel}>Lon:</Text>
              <Text style={styles.locationValue}>{location.longitude.toFixed(6)}</Text>
            </View>
            {(location.speed ?? 0) > 0 && (
              <View style={styles.locationRow}>
                <Text style={styles.locationLabel}>Vel. istantanea:</Text>
                <Text style={styles.locationValue}>{((location.speed ?? 0) * 3.6).toFixed(1)} km/h</Text>
              </View>
            )}
          </View>
        )}

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.stopButton}
          onPress={handleStopRecording}
          activeOpacity={0.85}
          accessibilityLabel="Ferma registrazione"
        >
          <LinearGradient
            colors={['#e74c3c', '#c0392b']}
            style={styles.stopButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.stopButtonIcon}>⏹</Text>
            <Text style={styles.stopButtonText}>FERMA REGISTRAZIONE</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClear}
          activeOpacity={0.7}
          accessibilityLabel="Cancella traccia"
        >
          <Text style={styles.clearButtonIcon}>🗑️</Text>
          <Text style={styles.clearButtonText}>Cancella traccia</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#0f3460',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  pulseOn: {
    backgroundColor: '#e74c3c',
    opacity: 1,
  },
  pulseOff: {
    backgroundColor: '#e74c3c',
    opacity: 0.3,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignSelf: 'center',
  },
  gpsBadgeIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  gpsBadgeText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statCardLarge: {
    width: '100%',
  },
  statCardSmall: {
    flex: 1,
    minWidth: '30%',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1a1a2e',
    lineHeight: 42,
  },
  statValueSmall: {
    fontSize: 22,
    lineHeight: 28,
  },
  statUnit: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
    marginTop: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  locationCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  locationLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  locationValue: {
    fontSize: 14,
    color: '#1a1a2e',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3f3',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  errorIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#c62828',
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#f0f2f5',
  },
  stopButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#e74c3c',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  stopButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  stopButtonIcon: {
    fontSize: 20,
    color: '#fff',
  },
  stopButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1.5,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 12,
    backgroundColor: 'transparent',
  },
  clearButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
});
