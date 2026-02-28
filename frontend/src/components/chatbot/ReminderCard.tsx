import { Bell, Clock, CheckCircle2, Circle, Pill, Calendar, Dumbbell, UtensilsCrossed, Activity, Heart, AlertTriangle } from 'lucide-react';
import MBCard from '@/components/common/Card';

type ReminderType = 'medication' | 'appointment' | 'exercise' | 'meal' | 'activity' | 'health_check' | 'custom';

interface ReminderCardProps {
  title: string;
  time: string;
  description: string;
  type?: ReminderType;
  priority?: 'low' | 'medium' | 'high';
  isCompleted?: boolean;
  onToggle?: () => void;
}

const TYPE_ICONS: Record<ReminderType, typeof Bell> = {
  medication: Pill,
  appointment: Calendar,
  exercise: Dumbbell,
  meal: UtensilsCrossed,
  activity: Activity,
  health_check: Heart,
  custom: AlertTriangle,
};

const TYPE_COLORS: Record<ReminderType, string> = {
  medication: 'bg-rose-50 text-rose-500 dark:bg-rose-500/10',
  appointment: 'bg-blue-50 text-blue-500 dark:bg-blue-500/10',
  exercise: 'bg-green-50 text-green-500 dark:bg-green-500/10',
  meal: 'bg-amber-50 text-amber-500 dark:bg-amber-500/10',
  activity: 'bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10',
  health_check: 'bg-pink-50 text-pink-500 dark:bg-pink-500/10',
  custom: 'bg-gray-50 text-gray-500 dark:bg-gray-500/10',
};

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-green-500',
};

const ReminderCard = ({ title, time, description, type = 'custom', priority, isCompleted, onToggle }: ReminderCardProps) => {
  const Icon = TYPE_ICONS[type] || Bell;
  const colorCls = TYPE_COLORS[type] || 'bg-primary/10 text-primary';

  return (
    <MBCard className={`flex items-start gap-4 ${isCompleted ? 'opacity-60' : ''}`}>
      {onToggle && (
        <button onClick={onToggle} className="mt-1 shrink-0" title={isCompleted ? 'Mark incomplete' : 'Mark complete'}>
          {isCompleted
            ? <CheckCircle2 size={22} className="text-green-500" />
            : <Circle size={22} className="text-muted-foreground hover:text-primary" />}
        </button>
      )}
      <div className={`p-3 rounded-xl ${colorCls}`}>
        <Icon size={24} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className={`font-semibold text-foreground text-lg ${isCompleted ? 'line-through' : ''}`}>{title}</h4>
          {priority && <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[priority] || ''}`} title={priority} />}
        </div>
        <p className="text-muted-foreground">{description}</p>
        <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
          <Clock size={14} />
          <span>{time}</span>
        </div>
      </div>
    </MBCard>
  );
};

export default ReminderCard;
