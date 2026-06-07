import { LocationData } from '../hooks/useLocation';

// Utilizza expo-file-system/legacy per compatibilità con l'API legacy delle stringhe
const FileSystem = require('expo-file-system/legacy');

const STATE_FILE_PATH = `${FileSystem.documentDirectory}recording_state.json`;

export interface PersistedState {
  isRecording: boolean;
  trackUuid: string | null;
  trackId: number | null;
  startTime: number | null;
  waypointSequence: number;
  waypoints: LocationData[];
}

/**
 * Salva lo stato corrente della registrazione su disco.
 */
export async function saveRecordingState(state: PersistedState): Promise<void> {
  try {
    const jsonString = JSON.stringify(state);
    await FileSystem.writeAsStringAsync(STATE_FILE_PATH, jsonString, {
      encoding: FileSystem.EncodingType && FileSystem.EncodingType.UTF8 ? FileSystem.EncodingType.UTF8 : 'utf8',
    });
    console.log('storageUtils - State saved successfully');
  } catch (error) {
    console.error('storageUtils - Error saving state:', error);
  }
}

/**
 * Carica lo stato della registrazione da disco.
 */
export async function loadRecordingState(): Promise<PersistedState | null> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(STATE_FILE_PATH);
    if (!fileInfo.exists) {
      console.log('storageUtils - No persisted state file found');
      return null;
    }

    const jsonString = await FileSystem.readAsStringAsync(STATE_FILE_PATH, {
      encoding: FileSystem.EncodingType && FileSystem.EncodingType.UTF8 ? FileSystem.EncodingType.UTF8 : 'utf8',
    });
    
    if (!jsonString) {
      return null;
    }

    const state = JSON.parse(jsonString) as PersistedState;
    console.log('storageUtils - State loaded successfully, isRecording:', state.isRecording);
    return state;
  } catch (error) {
    console.error('storageUtils - Error loading state:', error);
    return null;
  }
}

/**
 * Cancella lo stato persistito su disco.
 */
export async function clearRecordingState(): Promise<void> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(STATE_FILE_PATH);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(STATE_FILE_PATH);
      console.log('storageUtils - Persisted state cleared');
    }
  } catch (error) {
    console.error('storageUtils - Error clearing state:', error);
  }
}
