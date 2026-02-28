import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Brain, MessageCircle, Gamepad2, Activity, Heart, LayoutDashboard, MessageSquare, AlertTriangle, UserCog, Video } from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();

  const elderlyLinks = [
    { to: '/elderly/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/elderly/chat', icon: MessageCircle, label: 'Chat' },
    { to: '/elderly/video-call/current', icon: Video, label: 'Video Call' },
    { to: '/elderly/games', icon: Gamepad2, label: 'Games' },
    { to: '/elderly/activity', icon: Activity, label: 'Activity' },
    { to: '/elderly/health-passport', icon: Heart, label: 'Health' },
  ];

  const caregiverLinks = [
    { to: '/caregiver/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/caregiver/conversations', icon: MessageSquare, label: 'Conversations' },
    { to: '/caregiver/video-call/new', icon: Video, label: 'Video Call' },
    { to: '/caregiver/alerts', icon: AlertTriangle, label: 'Alerts' },
    { to: '/caregiver/manage-profile', icon: UserCog, label: 'Profile' },
  ];

  const links = user?.role === 'elderly' ? elderlyLinks : caregiverLinks;

  return (
    <aside className="hidden lg:flex flex-col w-64 glass-card rounded-none border-y-0 border-l-0 min-h-[calc(100vh-4rem)] p-4">
      <div className="flex items-center gap-2 mb-8 px-3">
        <Brain className="text-primary" size={24} />
        <span className="font-display font-bold text-foreground">MindBridge</span>
      </div>
      <nav className="flex flex-col gap-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`
            }
          >
            <l.icon size={20} />
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
