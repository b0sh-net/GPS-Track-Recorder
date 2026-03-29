import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HomeScreen from './screens/HomeScreen';
import RecordingScreen from './screens/RecordingScreen';
import SummaryScreen from './screens/SummaryScreen';
import { useLocation } from './hooks/useLocation';
import useTrackStore from './hooks/useTrackStore';

export default function App() {
  const [screen, setScreen] = useState<'home' | 'recording' | 'summary'>('home');
  const { isRecording } = useTrackStore();
  const { error } = useLocation();

  // Log per debug
  useEffect(() => {
    console.log('App - Screen changed:', screen, 'isRecording:', isRecording);
  }, [screen, isRecording]);

  // Avvia registrazione
  const handleStartRecording = () => {
    console.log('App - handleStartRecording called');
    useTrackStore.getState().startRecording();
    setScreen('recording');
  };

  // Ferma registrazione
  const handleStopRecording = () => {
    console.log('App - handleStopRecording called');
    useTrackStore.getState().stopRecording();
    setScreen('summary');
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
          <RecordingScreen />
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
