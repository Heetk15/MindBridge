import { motion } from 'framer-motion';
import CognitiveScoreRing from '@/components/dashboard/CognitiveScoreRing';
import MoodIndicator from '@/components/chatbot/MoodIndicator';
import ReminderCard from '@/components/chatbot/ReminderCard';
import HealthMetrics from '@/components/dashboard/HealthMetrics';
import PanicButton from '@/components/emergency/PanicButton';
import MBCard from '@/components/common/Card';
import { useCognitiveStore } from '@/store/cognitiveStore';
import { Link } from 'react-router-dom';
import { Gamepad2, MessageCircle, Activity, Heart, Video } from 'lucide-react';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

const quickLinks = [
  { to: '/elderly/chat', icon: MessageCircle, label: 'Chat', color: 'bg-primary/10 text-primary' },
  { to: '/elderly/video-call/current', icon: Video, label: 'Video Call', color: 'bg-indigo-500/10 text-indigo-500' },
  { to: '/elderly/games', icon: Gamepad2, label: 'Games', color: 'bg-success/10 text-success' },
  { to: '/elderly/activity', icon: Activity, label: 'Activity', color: 'bg-accent/10 text-accent' },
  // { to: '/elderly/health-passport', icon: Heart, label: 'Health', color: 'bg-warning/10 text-warning' },
];

const ElderlyDashboard = () => {
  const { currentScore } = useCognitiveStore();

  return (
    <AuthenticatedLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-display font-bold text-foreground mb-8">
          Good Morning, Margaret 🌞
        </motion.h1>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <MBCard elevated className="flex flex-col items-center py-8">
            <CognitiveScoreRing score={currentScore} />
          </MBCard>
          <div className="space-y-6">
            <MBCard className="flex items-center gap-4">
              <span className="text-lg font-medium text-foreground">Current Mood:</span>
              <MoodIndicator mood="happy" />
            </MBCard>
            <ReminderCard title="Medication Due" time="10:00 AM" description="Take Donepezil 10mg with water" />
            <ReminderCard title="Game Time" time="2:00 PM" description="Daily memory exercise" />
          </div>
        </div>

        <h2 className="text-xl font-display font-semibold text-foreground mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {quickLinks.map((l) => (
            <Link key={l.to} to={l.to}>
              <MBCard className="flex flex-col items-center gap-3 py-6 hover:scale-105 transition-transform">
                <div className={`p-3 rounded-xl ${l.color}`}>
                  <l.icon size={28} />
                </div>
                <span className="font-medium text-foreground text-lg">{l.label}</span>
              </MBCard>
            </Link>
          ))}
        </div>

        <HealthMetrics />
      </div>
      <PanicButton />
    </AuthenticatedLayout>
  );
};

export default ElderlyDashboard;
