export type ReminderType = 'medication' | 'appointment' | 'exercise' | 'meal' | 'activity' | 'health_check' | 'custom';
export type ReminderPriority = 'low' | 'medium' | 'high';
export type ReminderRecurrence = 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface Reminder {
  id: string;
  userId: string;
  type: ReminderType;
  title: string;
  description: string;
  scheduledTime: string | null;
  recurrence: ReminderRecurrence;
  priority: ReminderPriority;
  isActive: boolean;
  isCompleted: boolean;
  completedAt: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderPayload {
  userId: string;
  type: ReminderType;
  title: string;
  description?: string;
  scheduledTime?: string;
  recurrence?: ReminderRecurrence;
  priority?: ReminderPriority;
  notes?: string;
}
