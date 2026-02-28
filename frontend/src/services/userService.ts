import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:5004/api/v1`;

const userClient = axios.create({
  baseURL: `${API_BASE_URL}/users`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token to every request
userClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface MedicalData {
  name?: string;
  age?: number;
  bloodType?: string;
  medications?: Array<string | { name: string; dosage: string }>;
  medicalHistory?: string[];
  emergencyContacts?: Array<{
    name: string;
    relationship: string;
    phone: string;
  }>;
}

export const userService = {
  /**
   * Fetch the public health passport for a given user (no auth required).
   */
  getPublicPassport: async (userId: string): Promise<MedicalData> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/passport/${userId}`);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error fetching public passport:', error);
      throw error;
    }
  },

  /**
   * Update medical info for the current user.
   */
  updateMedicalInfo: async (data: Partial<MedicalData>): Promise<MedicalData> => {
    try {
      const response = await userClient.put('/medical-info', data);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error updating medical info:', error);
      throw error;
    }
  },
};
