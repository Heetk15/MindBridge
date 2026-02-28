export interface EmergencyAlert {
  id: string;
  type: 'panic' | 'fall' | 'phrase' | 'inactivity';
  message: string;
  timestamp: string;
  resolved: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/** Shape returned by GET /api/v1/alerts */
export interface DBAlert {
  id: string;
  alertType: 'panic_button' | 'fall_detected' | 'inactivity' | 'distress_phrase' | 'unusual_vitals' | 'medication_missed' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  keywords: string;
  status: 'triggered' | 'acknowledged' | 'in_progress' | 'resolved' | 'false_alarm';
  resolved: boolean;
  triggeredAt: string;
  resolvedAt?: string;
  emergencyServicesNotified: boolean;
  ambulanceRequested: boolean;
  location?: { latitude?: number; longitude?: number; address?: string } | null;
}
