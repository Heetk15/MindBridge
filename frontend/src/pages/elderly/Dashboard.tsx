import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import ReminderCard from '@/components/chatbot/ReminderCard';
import PanicButton from '@/components/emergency/PanicButton';
import MBCard from '@/components/common/Card';
import { Link } from 'react-router-dom';
import {
  Gamepad2, MessageCircle, Heart, Bell, Sun, Moon, CloudSun, Sparkles,
  CalendarCheck, Quote, Phone,
} from 'lucide-react';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import OnlineUsersCard from '@/components/video/OnlineUsersCard';
import LocationTracker from '@/components/tracking/LocationTracker';
import { reminderService } from '@/services/reminderService';
import { useAuthStore } from '@/store/authStore';
import type { Reminder } from '@/types/reminder.types';

/* ── helpers ── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning', icon: Sun, emoji: '🌞' };
  if (h < 17) return { text: 'Good Afternoon', icon: CloudSun, emoji: '☀️' };
  return { text: 'Good Evening', icon: Moon, emoji: '🌙' };
};

const TIPS = [
  "A short walk today can brighten your whole week!",
  "Staying hydrated keeps your mind sharp — grab a glass of water.",
  "Call a friend or family member today — connection is medicine.",
  "Try a brain game — even 5 minutes helps keep your mind active.",
  "Deep breathing for 1 minute can reduce stress instantly.",
  "Listen to your favourite song — music lifts the spirit!",
  "Write down one thing you're grateful for today.",
  "Stretch your arms and legs — your body will thank you.",
  "Smile at yourself in the mirror — it really works!",
  "A good laugh is sunshine in the house.",
];

const getDailyTip = () => TIPS[Math.floor(new Date().getDate() % TIPS.length)];

const quickLinks = [
  { to: '/elderly/chat', icon: MessageCircle, label: 'Chat with MindBridge', desc: 'Talk, ask, or just share your day', color: 'bg-primary/10 text-primary' },
  { to: '/elderly/games', icon: Gamepad2, label: 'Play Games', desc: 'Fun brain exercises', color: 'bg-green-500/10 text-green-600' },
  { to: '/elderly/health-passport', icon: Heart, label: 'Health Passport', desc: 'View your health info', color: 'bg-rose-500/10 text-rose-500' },
];

const fmtTime = (iso: string | null) => {
  if (!iso) return 'No time set';
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

const dateLabel = () =>
  new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

/* ── component ── */
const ElderlyDashboard = () => {
  const { user } = useAuthStore();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(true);

  const greeting = useMemo(getGreeting, []);
  const tip = useMemo(getDailyTip, []);
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const data = await reminderService.list({ completed: false, active: true });
        setReminders(data);
      } catch (err) {
        console.error('Failed to fetch reminders', err);
      } finally {
        setLoadingReminders(false);
      }
    };
    fetchReminders();
    const interval = setInterval(fetchReminders, 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = async (id: string) => {
    try {
      await reminderService.toggleComplete(id);
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Failed to toggle reminder', err);
    }
  };

  const sortedReminders = [...reminders].sort((a, b) => {
    const pOrder = { high: 0, medium: 1, low: 2 };
    const pa = pOrder[a.priority] ?? 1;
    const pb = pOrder[b.priority] ?? 1;
    if (pa !== pb) return pa - pb;
    if (a.scheduledTime && b.scheduledTime)
      return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
    return 0;
  });

  const completedToday = reminders.filter(r => r.isCompleted).length;

  return (
    <AuthenticatedLayout>
      {/* Silent background GPS tracking — sends coords to backend */}
      <LocationTracker userId={String(user?.id || '1')} />
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Greeting Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <greeting.icon className="text-primary" size={30} />
            {greeting.text}, {firstName} {greeting.emoji}
          </h1>
          <p className="text-muted-foreground mt-1">{dateLabel()}</p>
        </motion.div>

        {/* ── Row 1 : Daily Tip + Task Summary ── */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Daily Wellness Tip */}
          <MBCard elevated className="border-l-4 border-l-primary">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground mb-1">Daily Wellness Tip</h3>
                <p className="text-muted-foreground leading-relaxed">{tip}</p>
              </div>
            </div>
          </MBCard>

          {/* Today's task overview */}
          <MBCard elevated className="border-l-4 border-l-green-500">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-green-500/10 text-green-600 shrink-0">
                <CalendarCheck size={24} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground mb-1">Today's Tasks</h3>
                {loadingReminders ? (
                  <p className="text-muted-foreground">Loading…</p>
                ) : sortedReminders.length === 0 ? (
                  <p className="text-green-600 font-medium">All caught up — nothing pending!</p>
                ) : (
                  <p className="text-muted-foreground">
                    <span className="text-foreground font-bold text-xl">{sortedReminders.length}</span> pending
                    {completedToday > 0 && <> · <span className="text-green-600 font-medium">{completedToday} done</span></>}
                  </p>
                )}
              </div>
            </div>
          </MBCard>
        </div>

        {/* ── Row 2 : Quick Access ── */}
        <h2 className="text-xl font-display font-semibold text-foreground mb-4">What would you like to do?</h2>
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {quickLinks.map((l) => (
            <Link key={l.to} to={l.to}>
              <MBCard className="flex items-center gap-4 py-5 hover:scale-[1.02] hover:shadow-md transition-all">
                <div className={`p-3 rounded-xl ${l.color} shrink-0`}>
                  <l.icon size={28} />
                </div>
                <div>
                  <span className="font-semibold text-foreground text-lg block">{l.label}</span>
                  <span className="text-sm text-muted-foreground">{l.desc}</span>
                </div>
              </MBCard>
            </Link>
          ))}
        </div>

        {/* ── Row 3 : Upcoming Reminders ── */}
        <h2 className="text-xl font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Bell size={20} className="text-primary" /> Upcoming Reminders
        </h2>
        <div className="space-y-4 mb-8">
          {loadingReminders ? (
            <MBCard className="text-center py-6 text-muted-foreground">Loading reminders…</MBCard>
          ) : sortedReminders.length === 0 ? (
            <MBCard className="flex items-center gap-3 py-6 text-muted-foreground">
              <Bell size={20} />
              <span>No pending reminders — enjoy your free time!</span>
            </MBCard>
          ) : (
            sortedReminders.slice(0, 6).map(r => (
              <ReminderCard
                key={r.id}
                title={r.title}
                time={fmtTime(r.scheduledTime)}
                description={r.description || ''}
                type={r.type}
                priority={r.priority}
                isCompleted={r.isCompleted}
                onToggle={() => handleToggle(r.id)}
              />
            ))
          )}
        </div>

        {/* ── Row 4 : Video Call ── */}
        <h2 className="text-xl font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Phone size={20} className="text-primary" /> Call Your Caregiver
        </h2>
        <OnlineUsersCard filterRole="caregiver" className="mb-8" />

        {/* ── Inspirational Quote Footer ── */}
        <MBCard className="text-center py-6 border-t-4 border-t-primary/30">
          <Quote size={24} className="mx-auto text-primary/40 mb-2" />
          <p className="text-muted-foreground italic text-sm max-w-md mx-auto">
            "Every day may not be good, but there is something good in every day."
          </p>
        </MBCard>
      </div>
      <PanicButton />
    </AuthenticatedLayout>
  );
};

export default ElderlyDashboard;
