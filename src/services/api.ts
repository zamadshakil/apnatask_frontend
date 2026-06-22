// src/services/api.ts
import axios from 'axios';
import { Platform } from 'react-native';

// In local development, Android emulator connects to host machine via 10.0.2.2, iOS uses localhost
const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api/v1';
  }
  return 'http://localhost:8000/api/v1';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
