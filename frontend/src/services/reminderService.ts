import axios from 'axios';
import type { Reminder, CreateReminderPayload } from '@/types/reminder.types';

const API = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5004/api`;
const BASE = `${API}/v1/reminders`;

export const reminderService = {
  /** Create a new reminder / task */
  async create(payload: CreateReminderPayload): Promise<Reminder> {
    const { data } = await axios.post(BASE, payload);
    return data.reminder;
  },

  /** List reminders with optional filters */
  async list(params?: {
    userId?: string;
    completed?: boolean;
    active?: boolean;
    type?: string;
  }): Promise<Reminder[]> {
    const query = new URLSearchParams();
    if (params?.userId) query.set('userId', params.userId);
    if (params?.completed !== undefined) query.set('completed', String(params.completed));
    if (params?.active !== undefined) query.set('active', String(params.active));
    if (params?.type) query.set('type', params.type);

    const { data } = await axios.get(`${BASE}?${query.toString()}`);
    return data.reminders;
  },

  /** Update a reminder */
  async update(id: string, updates: Partial<Reminder>): Promise<Reminder> {
    const { data } = await axios.patch(`${BASE}/${id}`, updates);
    return data.reminder;
  },

  /** Delete a reminder */
  async remove(id: string): Promise<void> {
    await axios.delete(`${BASE}/${id}`);
  },

  /** Toggle complete */
  async toggleComplete(id: string): Promise<Reminder> {
    const { data } = await axios.patch(`${BASE}/${id}/complete`);
    return data.reminder;
  },
};
