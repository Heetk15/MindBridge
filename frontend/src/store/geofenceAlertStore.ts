import { create } from 'zustand';

export interface GeofenceAlertData {
  alertId: string;
  userId: string;
  patientName: string;
  distance: number;
  safeRadius: number;
  latitude: number;
  longitude: number;
  timestamp: string;
  /** Whether the caregiver has acted on this alert */
  resolved: boolean;
  resolvedAction?: 'acknowledged' | 'ignored';
}

interface GeofenceAlertState {
  /** Active (unresolved) alerts */
  alerts: GeofenceAlertData[];
  /** History of resolved alerts */
  history: GeofenceAlertData[];
  /** Add a new incoming alert */
  addAlert: (alert: Omit<GeofenceAlertData, 'resolved'>) => void;
  /** Acknowledge an alert (caregiver will check on patient) */
  acknowledgeAlert: (alertId: string) => void;
  /** Ignore an alert (false alarm / patient is fine) */
  ignoreAlert: (alertId: string) => void;
  /** Handle remote resolution (another caregiver resolved it) */
  resolveRemote: (alertId: string, action: 'acknowledged' | 'ignored') => void;
  /** Clear all resolved history */
  clearHistory: () => void;
}

export const useGeofenceAlertStore = create<GeofenceAlertState>((set) => ({
  alerts: [],
  history: [],

  addAlert: (alert) =>
    set((state) => {
      // Prevent duplicates
      if (state.alerts.some((a) => a.alertId === alert.alertId)) return state;
      return {
        alerts: [{ ...alert, resolved: false }, ...state.alerts],
      };
    }),

  acknowledgeAlert: (alertId) =>
    set((state) => {
      const target = state.alerts.find((a) => a.alertId === alertId);
      if (!target) return state;
      const resolved = { ...target, resolved: true, resolvedAction: 'acknowledged' as const };
      return {
        alerts: state.alerts.filter((a) => a.alertId !== alertId),
        history: [resolved, ...state.history].slice(0, 50),
      };
    }),

  ignoreAlert: (alertId) =>
    set((state) => {
      const target = state.alerts.find((a) => a.alertId === alertId);
      if (!target) return state;
      const resolved = { ...target, resolved: true, resolvedAction: 'ignored' as const };
      return {
        alerts: state.alerts.filter((a) => a.alertId !== alertId),
        history: [resolved, ...state.history].slice(0, 50),
      };
    }),

  resolveRemote: (alertId, action) =>
    set((state) => {
      const target = state.alerts.find((a) => a.alertId === alertId);
      if (!target) return state;
      const resolved = { ...target, resolved: true, resolvedAction: action };
      return {
        alerts: state.alerts.filter((a) => a.alertId !== alertId),
        history: [resolved, ...state.history].slice(0, 50),
      };
    }),

  clearHistory: () => set({ history: [] }),
}));
