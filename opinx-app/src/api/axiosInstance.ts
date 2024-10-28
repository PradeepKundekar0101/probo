import axios from 'axios';
import { useAuthStore } from '../store/authStore';


const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState(); 
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    

    if (config.data instanceof FormData) {

      config.headers['Content-Type'] = 'multipart/form-data';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;