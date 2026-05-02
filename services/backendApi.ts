/**
 * Backend API Service
 * Handles communication between the mobile app and the Laravel backend
 */

import { API_ENDPOINTS, getDeviceId, BACKEND_URL } from '../config/backend';
import { LocationData } from '../hooks/useLocation';

// Check if backend is configured
const isBackendConfigured = (): boolean => {
  return BACKEND_URL && !BACKEND_URL.includes('CHANGE THIS');
};

/**
 * Helper to safely parse JSON response
 */
const safeJsonParse = async (response: Response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse JSON response:', text.substring(0, 100));
    return { success: false, message: 'Invalid server response' };
  }
};

/**
 * Register the device with the backend
 */
export const registerDevice = async (deviceName?: string): Promise<{ success: boolean; deviceId?: string }> => {
  if (!isBackendConfigured()) {
    console.log('Backend not configured, skipping device registration');
    return { success: false };
  }

  try {
    const deviceId = await getDeviceId();
    const { Platform } = require('react-native');

    const response = await fetch(API_ENDPOINTS.REGISTER_DEVICE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_id: deviceId,
        device_name: deviceName || `${Platform.OS} Device`,
        platform: Platform.OS,
      }),
    });

    const data = await safeJsonParse(response);
    console.log('Device registered:', data);
    
    return {
      success: data.success,
      deviceId: data.device_id,
    };
  } catch (error) {
    console.error('Error registering device:', error);
    return { success: false };
  }
};

/**
 * Get the current association status of the device
 */
export const getDeviceStatus = async (): Promise<{
  success: boolean;
  isRegistered: boolean;
  isClaimed: boolean;
  ownerName?: string | null;
  claimUrl?: string;
}> => {
  if (!isBackendConfigured()) {
    return { success: false, isRegistered: false, isClaimed: false };
  }

  try {
    const deviceId = await getDeviceId();
    const response = await fetch(API_ENDPOINTS.GET_DEVICE_STATUS(deviceId));
    const data = await safeJsonParse(response);

    return {
      success: data.success,
      isRegistered: data.is_registered,
      isClaimed: data.is_claimed,
      ownerName: data.owner_name,
      claimUrl: data.claim_url,
    };
  } catch (error) {
    console.error('Error getting device status:', error);
    return { success: false, isRegistered: false, isClaimed: false };
  }
};

/**
 * Start a new track on the backend
 */
export const startTrack = async (): Promise<{ success: boolean; trackUuid?: string; trackId?: number }> => {
  if (!isBackendConfigured()) {
    console.log('Backend not configured, skipping track start');
    return { success: false };
  }

  try {
    const deviceId = await getDeviceId();

    const response = await fetch(API_ENDPOINTS.START_TRACK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_id: deviceId,
      }),
    });

    const data = await safeJsonParse(response);
    console.log('Track started:', data);
    
    return {
      success: data.success,
      trackUuid: data.track_uuid,
      trackId: data.track_id,
    };
  } catch (error) {
    console.error('Error starting track:', error);
    return { success: false };
  }
};

/**
 * Add a waypoint to the current track
 */
export const addWaypoint = async (
  trackUuid: string,
  location: LocationData,
  sequence: number
): Promise<{ success: boolean; waypointId?: number }> => {
  if (!isBackendConfigured()) {
    return { success: false };
  }

  try {
    const response = await fetch(API_ENDPOINTS.ADD_WAYPOINT(trackUuid), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        latitude: location.latitude,
        longitude: location.longitude,
        altitude: location.altitude,
        speed_ms: location.speed,
        speed_kmh: location.speed ? location.speed * 3.6 : undefined,
        accuracy: location.accuracy,
        heading: location.heading,
        timestamp: location.timestamp,
        sequence: sequence,
      }),
    });

    const data = await safeJsonParse(response);
    console.log('Waypoint added:', data);
    
    return {
      success: data.success,
      waypointId: data.waypoint_id,
    };
  } catch (error) {
    console.error('Error adding waypoint:', error);
    return { success: false };
  }
};

/**
 * Add multiple waypoints to the current track in a single request
 */
export const batchWaypoints = async (
  trackUuid: string,
  waypoints: Array<{ location: LocationData; sequence: number }>
): Promise<{ success: boolean }> => {
  if (!isBackendConfigured() || waypoints.length === 0) {
    return { success: false };
  }

  try {
    const response = await fetch(API_ENDPOINTS.BATCH_WAYPOINTS(trackUuid), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        waypoints: waypoints.map(wp => ({
          latitude: wp.location.latitude,
          longitude: wp.location.longitude,
          altitude: wp.location.altitude,
          speed_ms: wp.location.speed,
          speed_kmh: wp.location.speed ? wp.location.speed * 3.6 : undefined,
          accuracy: wp.location.accuracy,
          heading: wp.location.heading,
          timestamp: wp.location.timestamp,
          sequence: wp.sequence,
        })),
      }),
    });

    const data = await safeJsonParse(response);
    console.log('Batch waypoints added:', data);
    
    return {
      success: data.success,
    };
  } catch (error) {
    console.error('Error batching waypoints:', error);
    return { success: false };
  }
};

/**
 * Complete the track on the backend
 */
export const completeTrack = async (
  trackUuid: string,
  stats: {
    durationSeconds: number;
    totalDistanceKm: number;
    averageSpeedKmh: number;
    maxSpeedKmh: number;
  }
): Promise<{ success: boolean }> => {
  if (!isBackendConfigured()) {
    return { success: false };
  }

  try {
    const response = await fetch(API_ENDPOINTS.COMPLETE_TRACK(trackUuid), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        duration_seconds: stats.durationSeconds,
        total_distance_km: stats.totalDistanceKm,
        average_speed_kmh: stats.averageSpeedKmh,
        max_speed_kmh: stats.maxSpeedKmh,
      }),
    });

    const data = await safeJsonParse(response);
    console.log('Track completed:', data);
    
    return {
      success: data.success,
    };
  } catch (error) {
    console.error('Error completing track:', error);
    return { success: false };
  }
};

/**
 * Add a comment to a track
 */
export const addComment = async (
  trackUuid: string,
  comment: string
): Promise<{ success: boolean }> => {
  if (!isBackendConfigured()) {
    return { success: false };
  }

  try {
    const response = await fetch(API_ENDPOINTS.ADD_COMMENT(trackUuid), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment: comment,
      }),
    });

    const data = await safeJsonParse(response);
    console.log('Comment added:', data);
    
    return {
      success: data.success,
    };
  } catch (error) {
    console.error('Error adding comment:', error);
    return { success: false };
  }
};

export { isBackendConfigured };
