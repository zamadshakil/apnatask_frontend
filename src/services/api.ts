// src/services/api.ts
import axios from 'axios';
import { Platform } from 'react-native';
import { supabase } from './supabaseClient';

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

// Interceptor to inject Supabase JWT token
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (error) {
    console.error('Error fetching session for API request:', error);
  }
  return config;
});

export default api;
