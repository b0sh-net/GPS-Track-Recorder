import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, AppState, AppStateStatus } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HomeScreen from './screens/HomeScreen';
import RecordingScreen from './screens/RecordingScreen';
import SummaryScreen from './screens/SummaryScreen';
import { useLocation } from './hooks/useLocation';
import useTrackStore from './hooks/useTrackStore';
import { registerDevice } from './services/backendApi';

export default function App() {
  const [screen, setScreen] = useState<'home' | 'recording' | 'summary'>('home');
  const { isRecording } = useTrackStore();
  const { error } = useLocation();

  // Registrazione dispositivo all'avvio e recupero dello stato persistito
  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('App - Initializing device registration...');
        const result = await registerDevice();
        if (result.success) {
          console.log('App - Device registered successfully');
        } else {
          console.warn('App - Device registration failed (check backend)');
        }
      } catch (err) {
        console.error('App - Error during initialization:', err);
      }

      try {
        console.log('App - Loading persisted state on launch...');
        await useTrackStore.getState().loadPersistedState();
        const state = useTrackStore.getState();
        if (state.isRecording) {
          console.log('App - Restored recording screen from persisted state');
          setScreen('recording');
        }
      } catch (err) {
        console.error('App - Error loading persisted state:', err);
      }
    };
    
    initApp();
  }, []);

  // Ascolta i cambiamenti di stato dell'app per sincronizzare lo store con i waypoint registrati in background
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      console.log('App - AppState changed to:', nextAppState);
      if (nextAppState === 'active') {
        const { isRecording, loadPersistedState } = useTrackStore.getState();
        if (isRecording) {
          console.log('App - App became active, reloading persisted state');
          await loadPersistedState();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  // Log per debug
  useEffect(() => {
    console.log('App - Screen changed:', screen, 'isRecording:', isRecording);
  }, [screen, isRecording]);

  // Avvia registrazione
  const handleStartRecording = async () => {
    console.log('App - handleStartRecording called');
    await useTrackStore.getState().startRecording();
    setScreen('recording');
  };

  // Ferma registrazione
  const handleStopRecording = async () => {
    console.log('App - handleStopRecording called');
    try {
      const { isRecording } = useTrackStore.getState();
      if (isRecording) {
        await useTrackStore.getState().stopRecording();
      }
      
      // Aggiungi un piccolo delay di sicurezza prima di cambiare schermata
      // Questo previene crash dovuti a transizioni troppo rapide su certi dispositivi Android
      setTimeout(() => {
        setScreen('summary');
      }, 500);
    } catch (err) {
      console.error('App - Error during stop recording:', err);
      setScreen('summary'); // Tenta comunque di mostrare il riepilogo
    }
  };

  // Reset
  const handleReset = () => {
    console.log('App - handleReset called');
    useTrackStore.getState().reset();
    setScreen('home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {screen === 'home' && <HomeScreen onStartRecording={handleStartRecording} />}
        {screen === 'recording' && (
          <RecordingScreen onStopRecording={handleStopRecording} />
        )}
        {screen === 'summary' && (
          <SummaryScreen onReset={handleReset} />
        )}
      </View>

      {/* Error display */}
      {error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  errorText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
