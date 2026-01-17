import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const getApiUrl = () => {
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (backendUrl) {
    return `${backendUrl}/api`;
  }
  if (Platform.OS === 'web') {
    return '/api';
  }
  return 'https://c71a929c-259f-429a-8677-9be12cf992ec-00-11vr14qbni1fh.pike.replit.dev/api';
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