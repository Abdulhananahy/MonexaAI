import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// For native (iOS/Android) builds, EXPO_PUBLIC_BACKEND_URL must point at the real
// production API domain once this app is published. It is baked in at build time,
// so it must be set before running `eas build`.
const DEV_FALLBACK_URL = 'https://c71a929c-259f-429a-8677-9be12cf992ec-00-11vr14qbni1fh.pike.replit.dev/api';

const getApiUrl = () => {
  if (Platform.OS === 'web') {
    return '/api';
  }

  const configuredUrl =
    process.env.EXPO_PUBLIC_BACKEND_URL || Constants.expoConfig?.extra?.backendUrl;

  if (configuredUrl) {
    return configuredUrl.endsWith('/api') ? configuredUrl : `${configuredUrl}/api`;
  }

  if (__DEV__) {
    console.warn(
      'EXPO_PUBLIC_BACKEND_URL is not set — falling back to the Replit dev domain. ' +
      'Set EXPO_PUBLIC_BACKEND_URL to your production API URL before building for release.'
    );
  }
  return DEV_FALLBACK_URL;
};

const api = axios.create({
  baseURL: getApiUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    if (error.response?.status === 503 && !config._retry) {
      config._retry = true;
      config._retryCount = (config._retryCount || 0) + 1;
      
      if (config._retryCount <= 3) {
        await new Promise(resolve => setTimeout(resolve, 1000 * config._retryCount));
        return api(config);
      }
    }
    
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timed out. Please check your internet connection.';
    } else if (!error.response) {
      error.message = `Network error: ${error.message}. Server may be unreachable.`;
    } else if (error.response?.status === 503) {
      error.message = 'Server is waking up. Please try again in a moment.';
    }
    return Promise.reject(error);
  }
);

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;