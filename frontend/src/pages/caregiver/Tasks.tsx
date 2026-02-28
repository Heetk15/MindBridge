import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import MBCard from '@/components/common/Card';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { Button } from '@/components/ui/button';
import { reminderService } from '@/services/reminderService';
import type { Reminder, ReminderType, ReminderPriority, ReminderRecurrence } from '@/types/reminder.types';
import {
  Plus, Trash2, CheckCircle2, Circle, Clock, AlertTriangle,
  Pill, Calendar, Dumbbell, UtensilsCrossed, Activity, Heart, Edit2, X,
} from 'lucide-react';

/* ── helpers ─────────────────────────────────────────────────────────── */

const TYPE_META: Record<ReminderType, { label: string; icon: typeof Pill; color: string }> = {
  medication:    { label: 'Medication',    icon: Pill,              color: 'text-rose-500   bg-rose-50   dark:bg-rose-500/10' },
  appointment:   { label: 'Appointment',   icon: Calendar,          color: 'text-blue-500   bg-blue-50   dark:bg-blue-500/10' },
  exercise:      { label: 'Exercise',      icon: Dumbbell,          color: 'text-green-500  bg-green-50  dark:bg-green-500/10' },
  meal:          { label: 'Meal',          icon: UtensilsCrossed,   color: 'text-amber-500  bg-amber-50  dark:bg-amber-500/10' },
  activity:      { label: 'Activity',      icon: Activity,          color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' },
  health_check:  { label: 'Health Check',  icon: Heart,             color: 'text-pink-500   bg-pink-50   dark:bg-pink-500/10' },
  custom:        { label: 'Custom',        icon: AlertTriangle,     color: 'text-gray-500   bg-gray-50   dark:bg-gray-500/10' },
};

const PRIORITY_BADGE: Record<ReminderPriority, string> = {
  low:    'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  high:   'bg-red-100   text-red-700   dark:bg-red-500/20   dark:text-red-300',
};

const fmtTime = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

/* ── main page ───────────────────────────────────────────────────────── */

const CaregiverTasks = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ReminderType>('custom');
  const [priority, setPriority] = useState<ReminderPriority>('medium');
  const [scheduledTime, setScheduledTime] = useState('');
  const [recurrence, setRecurrence] = useState<ReminderRecurrence>('once');
  const [notes, setNotes] = useState('');

  /* ── fetch ──────────────────────────────────────────────────────────── */

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = {};
      if (filter === 'active') { params.completed = false; params.active = true; }
      if (filter === 'completed') { params.completed = true; }
      const data = await reminderService.list(params as never);
      setReminders(data);
    } catch (err) {
      console.error('Failed to fetch reminders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReminders(); }, [filter]);

  /* ── form helpers ──────────────────────────────────────────────────── */

  const resetForm = () => {
    setTitle(''); setDescription(''); setType('custom');
    setPriority('medium'); setScheduledTime(''); setRecurrence('once');
    setNotes(''); setEditId(null); setShowForm(false);
  };

  const startEdit = (r: Reminder) => {
    setEditId(r.id);
    setTitle(r.title);
    setDescription(r.description);
    setType(r.type);
    setPriority(r.priority);
    setScheduledTime(r.scheduledTime ? new Date(r.scheduledTime).toISOString().slice(0, 16) : '');
    setRecurrence(r.recurrence);
    setNotes(r.notes);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      if (editId) {
        await reminderService.update(editId, {
          title, description, type, priority, notes, recurrence,
          scheduledTime: scheduledTime || null,
        } as never);
      } else {
        // For now, use a placeholder userId — in production, pick an assigned elderly user
        const storedUser = localStorage.getItem('user');
        const userId = storedUser ? JSON.parse(storedUser).id : 'default';
        await reminderService.create({
          userId, title, description, type, priority, notes, recurrence,
          scheduledTime: scheduledTime || undefined,
        });
      }
      resetForm();
      fetchReminders();
    } catch (err) {
      console.error('Failed to save reminder', err);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await reminderService.toggleComplete(id);
      fetchReminders();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    try {
      await reminderService.remove(id);
      fetchReminders();
    } catch (err) { console.error(err); }
  };

  /* ── counts ─────────────────────────────────────────────────────────── */
  const activeCount    = reminders.filter(r => !r.isCompleted).length;
  const completedCount = reminders.filter(r => r.isCompleted).length;

  /* ── JSX ────────────────────────────────────────────────────────────── */

  return (
    <AuthenticatedLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Tasks &amp; Reminders</h1>
            <p className="text-muted-foreground mt-1">Create and manage tasks for the elderly person</p>
          </div>
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Plus size={18} /> New Task
          </Button>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total', val: reminders.length, cls: 'border-t-primary' },
            { label: 'Active', val: activeCount, cls: 'border-t-amber-500' },
            { label: 'Completed', val: completedCount, cls: 'border-t-green-500' },
          ].map(s => (
            <MBCard key={s.label} className={`text-center border-t-4 ${s.cls}`}>
              <p className="text-3xl font-bold text-foreground">{s.val}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </MBCard>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'active', 'completed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Create / Edit form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <MBCard elevated className="mb-6 border-l-4 border-l-primary">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">{editId ? 'Edit Task' : 'New Task'}</h2>
                <button onClick={resetForm} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Title */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Title *</label>
                    <input
                      value={title} onChange={e => setTitle(e.target.value)} required
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:ring-2 focus:ring-primary/30 outline-none"
                      placeholder="e.g. Take morning medication"
                    />
                  </div>
                  {/* Type */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Type</label>
                    <select value={type} onChange={e => setType(e.target.value as ReminderType)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none">
                      {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  {/* Scheduled time */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Scheduled Time</label>
                    <input type="datetime-local" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none" />
                  </div>
                  {/* Recurrence */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Recurrence</label>
                    <select value={recurrence} onChange={e => setRecurrence(e.target.value as ReminderRecurrence)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none">
                      {['once','daily','weekly','monthly'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
                    </select>
                  </div>
                  {/* Priority */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Priority</label>
                    <select value={priority} onChange={e => setPriority(e.target.value as ReminderPriority)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none">
                      {['low','medium','high'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none resize-none"
                    placeholder="Additional details..." />
                </div>
                {/* Notes */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Notes</label>
                  <input value={notes} onChange={e => setNotes(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none"
                    placeholder="Internal caregiver notes" />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">{editId ? 'Update' : 'Create Task'}</Button>
                  <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                </div>
              </form>
            </MBCard>
          </motion.div>
        )}

        {/* Reminders list */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading tasks…</div>
        ) : reminders.length === 0 ? (
          <MBCard className="text-center py-12">
            <p className="text-muted-foreground text-lg">No tasks yet. Click "New Task" to create one.</p>
          </MBCard>
        ) : (
          <div className="space-y-3">
            {reminders.map((r, i) => {
              const meta = TYPE_META[r.type] || TYPE_META.custom;
              const Icon = meta.icon;
              return (
                <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <MBCard className={`flex items-start gap-4 ${r.isCompleted ? 'opacity-60' : ''}`}>
                    {/* Complete toggle */}
                    <button onClick={() => handleToggle(r.id)} className="mt-1 shrink-0" title={r.isCompleted ? 'Mark incomplete' : 'Mark complete'}>
                      {r.isCompleted
                        ? <CheckCircle2 size={22} className="text-green-500" />
                        : <Circle size={22} className="text-muted-foreground hover:text-primary" />}
                    </button>

                    {/* Type icon */}
                    <div className={`p-2.5 rounded-xl shrink-0 ${meta.color}`}>
                      <Icon size={20} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-semibold text-foreground ${r.isCompleted ? 'line-through' : ''}`}>{r.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_BADGE[r.priority]}`}>{r.priority}</span>
                        <span className="text-xs text-muted-foreground capitalize">{r.recurrence}</span>
                      </div>
                      {r.description && <p className="text-sm text-muted-foreground mt-0.5">{r.description}</p>}
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock size={12} /> {fmtTime(r.scheduledTime)}</span>
                        <span>{meta.label}</span>
                        {r.isCompleted && r.completedAt && <span className="text-green-600">✓ {fmtTime(r.completedAt)}</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => startEdit(r)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-500/10 text-muted-foreground hover:text-red-500" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </MBCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
};

export default CaregiverTasks;
