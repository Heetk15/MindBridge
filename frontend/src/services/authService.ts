import axios from 'axios';
import type { AuthResponse, PhoneAuthPayload } from '@/types/user.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const authClient = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authService = {
  /**
   * Sign up - Create new user account
   */
  signup: async (name: string, email: string, password: string, role: string, phoneNumber?: string) => {
    try {
      const response = await authClient.post('/signup', {
        name,
        email,
        password,
        role,
        phoneNumber: phoneNumber || undefined,
      });
      return response.data;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  },

  /**
   * Send OTP to phone number
   */
  sendOTP: async (phoneNumber: string) => {
    try {
      const response = await authClient.post('/send-otp', {
        phoneNumber,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  },

  /**
   * Verify OTP and authenticate user
   */
  verifyOTP: async (payload: PhoneAuthPayload): Promise<AuthResponse> => {
    try {
      const response = await authClient.post<AuthResponse>('/verify-otp', payload);
      return response.data;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  },

  /**
   * Get stored auth token
   */
  getToken: (): string | null => {
    return localStorage.getItem('authToken');
  },

  /**
   * Set auth token
   */
  setToken: (token: string) => {
    localStorage.setItem('authToken', token);
    authClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  /**
   * Clear auth token
   */
  clearToken: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    delete authClient.defaults.headers.common['Authorization'];
  },

  /**
   * Setup auth header with token
   */
  setupAuthHeader: (token: string) => {
    authClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },
};

export default authService;
