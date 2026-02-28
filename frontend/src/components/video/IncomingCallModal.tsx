import { Phone, PhoneOff, User } from 'lucide-react';
import { useCallStore } from '@/store/callStore';
import { callActions } from '@/hooks/useCallSignaling';
import { cn } from '@/lib/utils';

const IncomingCallModal = () => {
  const { incomingCall } = useCallStore();

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4 text-center border border-gray-200 dark:border-gray-700">
        {/* Animated avatar */}
        <div className="relative mx-auto mb-6">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto animate-pulse">
            <User className="h-12 w-12 text-primary" />
          </div>
          {/* Ripple rings */}
          <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-2 border-primary/30 animate-ping" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          Incoming Video Call
        </h2>
        <p className="text-lg font-semibold text-primary mb-1">
          {incomingCall.callerName}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 capitalize">
          {incomingCall.callerRole}
        </p>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-8">
          <button
            onClick={() => callActions.rejectCall(incomingCall.callId, incomingCall.callerId)}
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center',
              'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30',
              'transition-all hover:scale-110 active:scale-95'
            )}
          >
            <PhoneOff className="h-7 w-7" />
          </button>

          <button
            onClick={() => callActions.acceptCall(incomingCall.callId, incomingCall.roomName, incomingCall.callerId)}
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center',
              'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30',
              'transition-all hover:scale-110 active:scale-95 animate-bounce'
            )}
          >
            <Phone className="h-7 w-7" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
