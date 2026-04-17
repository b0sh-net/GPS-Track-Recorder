export const BACKEND_URL = 'https://gps.b0sh.net';

export const API_ENDPOINTS = {
  REGISTER_DEVICE: `${BACKEND_URL}/api/device/register`,
  START_TRACK: `${BACKEND_URL}/api/track/start`,
  ADD_WAYPOINT: (trackUuid: string) => `${BACKEND_URL}/api/track/${trackUuid}/waypoint`,
  COMPLETE_TRACK: (trackUuid: string) => `${BACKEND_URL}/api/track/${trackUuid}/complete`,
  ADD_COMMENT: (trackUuid: string) => `${BACKEND_URL}/api/track/${trackUuid}/comment`,
};

let cachedDeviceId: string | null = null;

/**
 * Get a unique identifier for this device
 * Falls back to a session-based ID if expo-application is not available
 */
export const getDeviceId = async (): Promise<string> => {
  if (cachedDeviceId) return cachedDeviceId;

  try {
    const { Platform } = require('react-native');
    
    // Try to use expo-application for a persistent ID
    try {
      const Application = require('expo-application');
      if (Platform.OS === 'android') {
        cachedDeviceId = Application.androidId;
      } else if (Platform.OS === 'ios') {
        cachedDeviceId = await Application.getIosIdForVendorAsync();
      }
    } catch (e) {
      // expo-application not installed or not available in this environment
    }

    // Fallback if expo-application failed or didn't provide an ID
    if (!cachedDeviceId) {
      // For development, we use a random ID that persists during the app session
      cachedDeviceId = `dev-${Platform.OS}-${Math.random().toString(36).substring(2, 10)}`;
      console.log('Using generated device ID for session:', cachedDeviceId);
    }

    return cachedDeviceId!;
  } catch (error) {
    console.error('Error in getDeviceId:', error);
    return 'unknown-device-id';
  }
};
