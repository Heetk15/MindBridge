export type UserRole = 'elderly' | 'caregiver';

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  avatar?: string;
  age?: number;
  emergencyContacts?: EmergencyContact[];
  medicalHistory?: string[];
  medications?: string[];
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface PhoneAuthPayload {
  phoneNumber: string;
  code: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
  message: string;
}
