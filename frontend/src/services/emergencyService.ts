import type { EmergencyAlert } from '@/types/emergency.types';

export const mockAlerts: EmergencyAlert[] = [
  { id: '1', type: 'panic', message: 'Panic button pressed', timestamp: '2026-02-28 09:15', resolved: false, severity: 'critical' },
  { id: '2', type: 'fall', message: 'Possible fall detected', timestamp: '2026-02-27 14:30', resolved: true, severity: 'high' },
  { id: '3', type: 'phrase', message: 'Distress phrase detected: "I don\'t know where I am"', timestamp: '2026-02-26 11:00', resolved: true, severity: 'high' },
  { id: '4', type: 'inactivity', message: 'No activity for 4 hours', timestamp: '2026-02-25 16:45', resolved: true, severity: 'medium' },
];

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5004/api`;

export const triggerEmergency = async (elderlyName: string): Promise<any> => {
  try {
    const response = await axios.post(`${API_URL}/v1/alerts/sos`, {
      elderlyName,
    });
    return response.data;
  } catch (error: any) {
    throw {
      message: error.response?.data?.message || error.message,
      status: error.response?.status,
    };
  }
};
