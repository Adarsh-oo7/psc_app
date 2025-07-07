import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- IMPORTANT: CONFIGURE YOUR BACKEND ADDRESS ---
// Find your computer's local IP address (e.g., 192.168.1.5).
// Your phone and computer MUST be on the same Wi-Fi network.
// Do NOT use 'localhost' or '127.0.0.1' as your phone will not be able to find it.
const API_URL = 'http://192.168.1.5:8000/api';
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000, // Set a timeout for requests
});

// This "interceptor" automatically adds the auth token to every API request
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
