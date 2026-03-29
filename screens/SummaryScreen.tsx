import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import {
  exportToKML,
  exportToGPX,
  getFileNameFromTimestamp,
} from '../lib/exportUtils';
import useTrackStore from '../hooks/useTrackStore';
import { formatDuration } from '../lib/gpsUtils';

type SummaryScreenProps = {
  onReset: () => void;
};

export default function SummaryScreen({ onReset }: SummaryScreenProps) {
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
      const fileName = getFileNameFromTimestamp(Date.now());
      await exportToKML(waypoints, fileName);
      Alert.alert('Esportazione completata', `KML salvato come ${fileName}`);
    } catch (err) {
      Alert.alert('Errore', 'Non è stato possibile esportare il file.');
    }
  };

  const handleExportGPX = async () => {
    if (waypointCount === 0) {
      Alert.alert('Nessuna traccia', 'La traccia è vuota.');
      return;
    }

    try {
      const fileName = getFileNameFromTimestamp(Date.now()) + '.gpx';
      await exportToGPX(waypoints, fileName);
      Alert.alert('Esportazione completata', `GPX salvato come ${fileName}`);
    } catch (err) {
      Alert.alert('Errore', 'Non è stato possibile esportare il file.');
    }
  };

  const handleReset = () => {
    onReset();
    Alert.alert('Reset', 'La traccia è stata cancellata.');
  };

  if (waypointCount === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
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
      <ScrollView style={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Riepilogo Traccia</Text>

          <View style={styles.statContainer}>
            <Text style={styles.statLabel}>Distanza totale</Text>
            <Text style={styles.statValue}>
              {(distance ?? 0).toFixed(2)} km
            </Text>
          </View>

          <View style={styles.statContainer}>
            <Text style={styles.statLabel}>Tempo di registrazione</Text>
            <Text style={styles.statValue}>{formatDuration(duration)}</Text>
          </View>

          <View style={styles.statContainer}>
            <Text style={styles.statLabel}>Velocità media</Text>
            <Text style={styles.statValue}>
              {(speed ?? 0).toFixed(1)} km/h
            </Text>
          </View>

          <View style={styles.statContainer}>
            <Text style={styles.statLabel}>Waypoint</Text>
            <Text style={styles.statValue}>{waypointCount}</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.kmlButton]}
            onPress={handleExportKML}
            accessibilityLabel="Esporta KML"
          >
            <Text style={styles.actionButtonText}>ESPORTA KML</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.gpxButton]}
            onPress={handleExportGPX}
            accessibilityLabel="Esporta GPX"
          >
            <Text style={styles.actionButtonText}>ESPORTA GPX</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.resetButton]}
            onPress={handleReset}
            accessibilityLabel="Reset"
          >
            <Text style={styles.actionButtonText}>RESET</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  statContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  actionsContainer: {
    paddingHorizontal: 16,
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  kmlButton: {
    backgroundColor: '#4CAF50',
  },
  gpxButton: {
    backgroundColor: '#2196F3',
  },
  resetButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
