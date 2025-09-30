import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// export const BaseURL = 'http://192.168.1.14:8000';
export const BaseURL = 'https://erp-motogarage-worldwide-2.up.railway.app';
// export const BaseURL = 'https://admin-redline-motogarage.up.railway.app';

// Create a ref to store the modal visibility state
let showSessionExpiredModal = () => {};

// Function to set the modal visibility handler
export const setSessionExpiredModalHandler = (handler) => {
  showSessionExpiredModal = handler;
};

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: 'https://erp-motogarage-worldwide-2.up.railway.app/api',
    // baseURL: 'https://admin-redline-motogarage.up.railway.app/api',

  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor to handle token
axiosInstance.interceptors.request.use(
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

// Add a response interceptor to handle common errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response) {
      // Check for token expiration error
      if (error.response.data?.messages?.[0]?.message === "Token is invalid or expired") {
        // Show session expired modal
        showSessionExpiredModal();
        return Promise.reject(error);
      }
      
      if (error.response.status === 401) {
        // Check if we're not on login or index page
        const currentPath = router.currentRoute?.path;
        if (currentPath && !['/login', '/'].includes(currentPath)) {
          // Show session expired modal
          showSessionExpiredModal();
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;


export const fetchStoreProductsAll = async () => {
  const response = await axiosInstance.get("/products/?page_size=1000000");
  return response.data;
};

export const fetchAccounts = async () => {
  const response = await axiosInstance.get("/accounts/");
  return response.data;
};

export const fetchAccountGroups = async () => {
  const response = await axiosInstance.get("/account-groups/");
  return response.data;
};