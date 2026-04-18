import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Linking, RefreshControl, AppState } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getDeviceStatus } from '../services/backendApi';

type HomeScreenProps = {
  onStartRecording?: () => void;
};

export default function HomeScreen({ onStartRecording = () => {} }: HomeScreenProps) {
  const [deviceStatus, setDeviceStatus] = useState<{
    isClaimed: boolean;
    ownerName?: string | null;
    claimUrl?: string;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const appState = useRef(AppState.currentState);

  const checkStatus = useCallback(async () => {
    console.log('HomeScreen - Checking device status...');
    const status = await getDeviceStatus();
    if (status.success) {
      console.log('HomeScreen - Device status received:', status);
      setDeviceStatus({
        isClaimed: status.isClaimed,
        ownerName: status.ownerName,
        claimUrl: status.claimUrl,
      });
    } else {
      console.warn('HomeScreen - Failed to get device status from backend');
    }
  }, []);

  useEffect(() => {
    checkStatus();

    // Listen for app state changes (to refresh when coming back from browser)
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('HomeScreen - App has come to the foreground, refreshing status...');
        checkStatus();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [checkStatus]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await checkStatus();
    setRefreshing(false);
  }, [checkStatus]);

  const handleClaimDevice = async () => {
    console.log('HomeScreen - handleClaimDevice called', deviceStatus);
    
    if (deviceStatus?.claimUrl) {
      try {
        const url = deviceStatus.claimUrl;
        console.log('HomeScreen - Attempting to open URL:', url);
        
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          console.warn('HomeScreen - Cannot open URL:', url);
          // Fallback: try opening anyway as canOpenURL can sometimes fail on Android
          await Linking.openURL(url);
        }
      } catch (error) {
        console.error('HomeScreen - Error opening claim URL:', error);
      }
    } else {
      console.warn('HomeScreen - No claimUrl available in deviceStatus');
    }
  };
  return (
    <View style={styles.container}>
      {/* Header with gradient */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>📍</Text>
            <Text style={styles.title}>GPS Track Recorder</Text>
          </View>
          <Text style={styles.subtitle}>Registra le tue avventure e condividile con il mondo</Text>
        </View>
      </LinearGradient>

      {/* Main content */}
      <ScrollView 
        style={styles.mainContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Device Association Alert */}
        {deviceStatus && !deviceStatus.isClaimed && (
          <View style={styles.alertContainer}>
            <LinearGradient
              colors={['#FFF9C4', '#FFF59D']}
              style={styles.alert}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.alertContent}>
                <Text style={styles.alertIcon}>⚠️</Text>
                <View style={styles.alertTextContainer}>
                  <Text style={styles.alertTitle}>Dispositivo non associato</Text>
                  <Text style={styles.alertDesc}>
                    Associa questo dispositivo al tuo account per salvare le tracce permanentemente.
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.alertButton} onPress={handleClaimDevice}>
                <Text style={styles.alertButtonText}>ASSOCIA ORA</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {deviceStatus && deviceStatus.isClaimed && (
          <View style={styles.ownerContainer}>
            <Text style={styles.ownerText}>
              👤 Associato a: <Text style={styles.ownerName}>{deviceStatus.ownerName || 'Utente'}</Text>
            </Text>
          </View>
        )}

        {/* Features cards */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Funzionalità</Text>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: '#4CAF50' }]}>
              <Text style={styles.featureIconText}>🎯</Text>
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Tracking in tempo reale</Text>
              <Text style={styles.featureDesc}>Distanza, tempo e velocità aggiornati istantaneamente</Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: '#2196F3' }]}>
              <Text style={styles.featureIconText}>📤</Text>
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Esporta KML & GPX</Text>
              <Text style={styles.featureDesc}>Compatibile con Google Earth, Strava e Garmin</Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: '#FF9800' }]}>
              <Text style={styles.featureIconText}>🔋</Text>
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Ottimizzato per la batteria</Text>
              <Text style={styles.featureDesc}>Aggiornamenti GPS intelligenti ogni 10 metri</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Start button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={onStartRecording}
          activeOpacity={0.85}
          accessibilityLabel="Avvia registrazione GPS"
        >
          <LinearGradient
            colors={['#4CAF50', '#45a049']}
            style={styles.startButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.startButtonIcon}>▶</Text>
            <Text style={styles.startButtonText}>AVVIA REGISTRAZIONE</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...Platform.select({
      ios: {
        shadowColor: '#0f3460',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  headerContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoIcon: {
    fontSize: 36,
    marginRight: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 22,
  },
  mainContent: {
    flex: 1,
  },
  featuresContainer: {
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 16,
  },
  alertContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  alert: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FBC02D',
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  alertDesc: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
  },
  alertButton: {
    backgroundColor: '#1a1a2e',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  alertButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  ownerContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  ownerText: {
    fontSize: 13,
    color: '#666',
  },
  ownerName: {
    fontWeight: '700',
    color: '#1a1a2e',
  },
  featureCard: {
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
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureIconText: {
    fontSize: 24,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 3,
  },
  featureDesc: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#f8f9fa',
  },
  startButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  startButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  startButtonIcon: {
    fontSize: 20,
    color: '#fff',
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1.5,
  },
});
