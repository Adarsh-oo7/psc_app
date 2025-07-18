import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- IMPORTANT: CONFIGURE YOUR BACKEND ADDRESS ---
// Find your computer's local IP address (e.g., 192.168.1.5).
// Your phone and computer MUST be on the same Wi-Fi network.
// Do NOT use 'localhost' or '127.0.0.1' as your phone will not be able to find it.
const API_URL = 'http://192.168.1.2:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // Increased timeout for file uploads (30 seconds)
  headers: {
    'Content-Type': 'application/json',
  },
});

// This "interceptor" automatically adds the auth token to every API request
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Log the request for debugging
      console.log('API Request:', {
        method: config.method,
        url: config.url,
        headers: config.headers,
        data: config.data instanceof FormData ? 'FormData' : config.data,
      });
      
      return config;
    } catch (error) {
      console.error('Error in request interceptor:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      data: response.data,
      headers: response.headers,
    });
    return response;
  },
  async (error) => {
    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
    });

    // Handle token expiration
    if (error.response?.status === 401) {
      try {
        await AsyncStorage.removeItem('access_token');
        await AsyncStorage.removeItem('refresh_token');
        // You might want to redirect to login screen here
        console.log('Token expired, cleared from storage');
      } catch (storageError) {
        console.error('Error clearing tokens:', storageError);
      }
    }

    return Promise.reject(error);
  }
);

// Create a separate client for file uploads with longer timeout
export const fileUploadClient = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60 seconds for file uploads
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Add the same interceptors to file upload client
fileUploadClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      console.log('File Upload Request:', {
        method: config.method,
        url: config.url,
        headers: config.headers,
      });
      
      return config;
    } catch (error) {
      console.error('Error in file upload request interceptor:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('File upload request interceptor error:', error);
    return Promise.reject(error);
  }
);

fileUploadClient.interceptors.response.use(
  (response) => {
    console.log('File Upload Response:', {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  async (error) => {
    console.error('File Upload Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
    });

    // Handle token expiration
    if (error.response?.status === 401) {
      try {
        await AsyncStorage.removeItem('access_token');
        await AsyncStorage.removeItem('refresh_token');
        console.log('Token expired, cleared from storage');
      } catch (storageError) {
        console.error('Error clearing tokens:', storageError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;