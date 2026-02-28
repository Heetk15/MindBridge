import { Video, Wifi, WifiOff, User } from 'lucide-react';
import { useCallStore, OnlineUser } from '@/store/callStore';
import { callActions } from '@/hooks/useCallSignaling';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OnlineUsersCardProps {
  filterRole?: 'elderly' | 'caregiver';
  className?: string;
}

const OnlineUsersCard = ({ filterRole, className }: OnlineUsersCardProps) => {
  const { onlineUsers, callStatus } = useCallStore();

  const filteredUsers = filterRole
    ? onlineUsers.filter((u) => u.role === filterRole)
    : onlineUsers;

  const handleCall = (user: OnlineUser) => {
    if (callStatus !== 'idle') {
      alert('You are already in a call or a call is pending.');
      return;
    }
    callActions.initiateCall(user.userId);
  };

  return (
    <div className={cn('rounded-xl border bg-card p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-foreground text-lg flex items-center gap-2">
          <Wifi className="h-5 w-5 text-green-500" />
          Online Now
        </h3>
        <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded-full font-medium">
          {filteredUsers.length} online
        </span>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <WifiOff className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No {filterRole || 'users'} online right now</p>
          <p className="text-xs mt-1 opacity-60">They'll appear here when they open the app</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((usr) => (
            <div
              key={usr.userId}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">{usr.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{usr.role}</p>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => handleCall(usr)}
                disabled={callStatus !== 'idle'}
                className="bg-green-600 hover:bg-green-700 text-white gap-1.5 rounded-full px-4"
              >
                <Video className="h-4 w-4" />
                Call
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OnlineUsersCard;
