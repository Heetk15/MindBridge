import { Brain, LayoutDashboard, MessageCircle, Gamepad2, Activity, Heart, MessageSquare, AlertTriangle, UserCog, MapPin, LogOut, ClipboardList, BarChart3 } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import ThemeToggle from '@/components/common/ThemeToggle';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';

const elderlyLinks = [
  { to: '/elderly/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/elderly/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/elderly/games', icon: Gamepad2, label: 'Games' },
  { to: '/elderly/health-passport', icon: Heart, label: 'Health' },
];

const caregiverLinks = [
  { to: '/caregiver/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/caregiver/conversations', icon: MessageSquare, label: 'Conversations' },
  { to: '/caregiver/alerts', icon: AlertTriangle, label: 'Alerts' },
  { to: '/caregiver/location', icon: MapPin, label: 'Location Monitor' },
  { to: '/caregiver/tasks', icon: ClipboardList, label: 'Tasks' },
  { to: '/caregiver/cognitive', icon: BarChart3, label: 'Cognitive' },
  { to: '/caregiver/manage-profile', icon: UserCog, label: 'Profile' },
];

const AppSidebar = () => {
  const { user, logout } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const navigate = useNavigate();
  const location = useLocation();
  const links = user?.role === 'elderly' ? elderlyLinks : caregiverLinks;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Brain className="text-primary shrink-0" size={24} />
          {!collapsed && <span className="font-display font-bold text-foreground text-lg">MindBridge</span>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {links.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.to}
                    tooltip={item.label}
                  >
                    <NavLink
                      to={item.to}
                      end
                      className="hover:bg-muted/50"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-3">
        <div className="flex items-center justify-center">
          <ThemeToggle />
        </div>
        {!collapsed && user && (
          <p className="text-xs text-muted-foreground text-center truncate">{user.name}</p>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
              <LogOut className="h-5 w-5 shrink-0" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
