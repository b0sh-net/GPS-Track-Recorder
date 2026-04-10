import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  exportToKML,
  exportToGPX,
  getFileNameFromTimestamp,
} from '../lib/exportUtils';
import useTrackStore from '../hooks/useTrackStore';
import { formatDuration } from '../lib/gpsUtils';

type SummaryScreenProps = {
  onReset?: () => void;
};

export default function SummaryScreen({ onReset = () => {} }: SummaryScreenProps) {
  const { waypoints, getRecordingDuration, getTotalDistance, getAverageSpeed } =
    useTrackStore();

  const distance = getTotalDistance();
  const duration = getRecordingDuration();
  const speed = getAverageSpeed();
  const waypointCount = waypoints.length;

  const handleExportKML = async () => {
    if (waypointCount === 0) {
      Alert.alert('Nessuna traccia', 'La traccia è vuota.');
      return;
    }

    try {
      const baseFileName = getFileNameFromTimestamp(Date.now()).replace('.kml', '');
      await exportToKML(waypoints, `${baseFileName}.kml`);
      Alert.alert('Esportazione completata', `KML salvato come ${baseFileName}.kml`);
    } catch (err) {
      console.error('Export KML error:', err);
      const errorMessage = err instanceof Error ? err.message : typeof err === 'string' ? err : 'Errore sconosciuto';
      Alert.alert('Errore', `Esportazione fallita: ${errorMessage}`);
    }
  };

  const handleExportGPX = async () => {
    if (waypointCount === 0) {
      Alert.alert('Nessuna traccia', 'La traccia è vuota.');
      return;
    }

    try {
      const baseFileName = getFileNameFromTimestamp(Date.now()).replace('.kml', '');
      await exportToGPX(waypoints, `${baseFileName}.gpx`);
      Alert.alert('Esportazione completata', `GPX salvato come ${baseFileName}.gpx`);
    } catch (err) {
      console.error('Export GPX error:', err);
      const errorMessage = err instanceof Error ? err.message : typeof err === 'string' ? err : 'Errore sconosciuto';
      Alert.alert('Errore', `Esportazione fallita: ${errorMessage}`);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Conferma reset',
      'Vuoi davvero cancellare la traccia?',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Reset', onPress: () => onReset() },
      ]
    );
  };

  if (waypointCount === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>La traccia è vuota</Text>
          <Text style={styles.emptySubText}>
            Premi "Avvia Registrazione" e poi "Ferma Registrazione"
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Hero header with gradient */}
      <LinearGradient
        colors={['#4CAF50', '#2E7D32']}
        style={styles.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.heroIcon}>✅</Text>
        <Text style={styles.heroTitle}>Registrazione Completata</Text>
        <Text style={styles.heroSubtitle}>Ecco il riepilogo della tua traccia</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero stats */}
        <View style={styles.heroStats}>
          <View style={[styles.heroStatCard, styles.heroStatCardLarge]}>
            <Text style={styles.heroStatIcon}>📏</Text>
            <Text style={styles.heroStatValue}>{(distance ?? 0).toFixed(2)}</Text>
            <Text style={styles.heroStatUnit}>km</Text>
            <Text style={styles.heroStatLabel}>Distanza</Text>
          </View>

          <View style={styles.heroStatRow}>
            <View style={[styles.heroStatCard, styles.heroStatCardSmall]}>
              <Text style={styles.heroStatIcon}>⏱️</Text>
              <Text style={styles.heroStatValueSmall}>{formatDuration(duration)}</Text>
              <Text style={styles.heroStatLabel}>Durata</Text>
            </View>

            <View style={[styles.heroStatCard, styles.heroStatCardSmall]}>
              <Text style={styles.heroStatIcon}>💨</Text>
              <Text style={styles.heroStatValueSmall}>{(speed ?? 0).toFixed(1)}</Text>
              <Text style={styles.heroStatUnitSmall}>km/h</Text>
              <Text style={styles.heroStatLabel}>Vel. media</Text>
            </View>
          </View>

          <View style={styles.heroStatCard}>
            <Text style={styles.heroStatIcon}>📍</Text>
            <Text style={styles.heroStatValue}>{waypointCount}</Text>
            <Text style={styles.heroStatLabel}>Waypoint registrati</Text>
          </View>
        </View>

        {/* Export section */}
        <View style={styles.exportSection}>
          <Text style={styles.exportTitle}>Esporta Traccia</Text>

          <TouchableOpacity
            style={styles.exportCard}
            onPress={handleExportKML}
            activeOpacity={0.85}
            accessibilityLabel="Esporta KML"
          >
            <View style={[styles.exportIcon, { backgroundColor: '#e8f5e9' }]}>
              <Text style={styles.exportIconText}>🌍</Text>
            </View>
            <View style={styles.exportInfo}>
              <Text style={styles.exportName}>Google Earth / Maps</Text>
              <Text style={styles.exportFormat}>Formato KML</Text>
            </View>
            <Text style={styles.exportArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exportCard}
            onPress={handleExportGPX}
            activeOpacity={0.85}
            accessibilityLabel="Esporta GPX"
          >
            <View style={[styles.exportIcon, { backgroundColor: '#e3f2fd' }]}>
              <Text style={styles.exportIconText}>🗺️</Text>
            </View>
            <View style={styles.exportInfo}>
              <Text style={styles.exportName}>Strava, Garmin, GPS</Text>
              <Text style={styles.exportFormat}>Formato GPX</Text>
            </View>
            <Text style={styles.exportArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Reset button */}
        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleReset}
          activeOpacity={0.7}
          accessibilityLabel="Reset"
        >
          <Text style={styles.resetIcon}>🗑️</Text>
          <Text style={styles.resetText}>Cancella e Ricomincia</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  hero: {
    paddingTop: 28,
    paddingBottom: 36,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...Platform.select({
      ios: {
        shadowColor: '#2E7D32',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  heroIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    flex: 1,
  },
  heroStats: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  heroStatCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  heroStatCardLarge: {
    marginBottom: 12,
  },
  heroStatRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  heroStatCardSmall: {
    flex: 1,
  },
  heroStatIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  heroStatValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1a1a2e',
    lineHeight: 42,
  },
  heroStatValueSmall: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    lineHeight: 24,
  },
  heroStatUnit: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
    marginTop: 2,
  },
  heroStatUnitSmall: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
    marginTop: 2,
  },
  heroStatLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 6,
  },
  exportSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 14,
  },
  exportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  exportIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  exportIconText: {
    fontSize: 26,
  },
  exportInfo: {
    flex: 1,
  },
  exportName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 3,
  },
  exportFormat: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  exportArrow: {
    fontSize: 22,
    color: '#ccc',
    marginLeft: 8,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#ffcdd2',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  resetIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  resetText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#c62828',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
});
