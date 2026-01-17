import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const getApiUrl = () => {
  if (Platform.OS === 'web') {
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
    return backendUrl ? `${backendUrl}/api` : '/api';
  }
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  return `${backendUrl}/api`;
};

const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

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