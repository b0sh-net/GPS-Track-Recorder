import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

type HomeScreenProps = {
  onStartRecording: () => void;
};

export default function HomeScreen({ onStartRecording }: HomeScreenProps) {

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>GPS Track Recorder</Text>
        <Text style={styles.subtitle}>Registra il tuo percorso</Text>
      </View>

      <View style={styles.mainContent}>
        <Text style={styles.instruction}>Premi il pulsante per iniziare la registrazione</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={onStartRecording}
          accessibilityLabel="Avvia registrazione GPS"
        >
          <Image
            source={require('../assets/start-recording.png')}
            style={styles.buttonImage}
            resizeMode="contain"
          />
          <Text style={styles.buttonText}>AVVIA REGISTRAZIONE</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          L'app registrerà la tua posizione GPS in tempo reale
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instruction: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    paddingVertical: 20,
    paddingHorizontal: 30,
    alignItems: 'center',
    width: '80%',
    borderWidth: 2,
    borderColor: '#388E3C',
  },
  buttonImage: {
    width: 64,
    height: 64,
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoContainer: {
    paddingHorizontal: 20,
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});
