import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_URL = 'https://c71a929c-259f-429a-8677-9be12cf992ec-00-11vr14qbni1fh.pike.replit.dev/api';

const getApiUrl = () => {
  if (Platform.OS === 'web') {
    return '/api';
  }
  return API_URL;
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
  (error) => {
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timed out. Please check your internet connection.';
    } else if (!error.response) {
      error.message = `Network error: ${error.message}. Server may be unreachable.`;
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