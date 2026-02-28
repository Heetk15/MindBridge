import { Phone, X, User } from 'lucide-react';
import { useCallStore } from '@/store/callStore';
import { callActions } from '@/hooks/useCallSignaling';
import { cn } from '@/lib/utils';

const OutgoingCallModal = () => {
  const { callStatus, activeCallId, calleeId } = useCallStore();

  if (callStatus !== 'outgoing-ringing') return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4 text-center border border-gray-200 dark:border-gray-700">
        <div className="relative mx-auto mb-6">
          <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
            <User className="h-12 w-12 text-green-500" />
          </div>
          <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-2 border-green-500/30 animate-ping" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Calling...
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Waiting for the other person to answer
        </p>

        {/* Animated dots */}
        <div className="flex justify-center gap-2 mb-8">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-3 h-3 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-3 h-3 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>

        <button
          onClick={() => {
            if (activeCallId && calleeId) {
              callActions.cancelCall(activeCallId, calleeId);
            }
          }}
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center mx-auto',
            'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30',
            'transition-all hover:scale-110 active:scale-95'
          )}
        >
          <X className="h-7 w-7" />
        </button>
        <p className="text-xs text-gray-400 mt-3">Tap to cancel</p>
      </div>
    </div>
  );
};

export default OutgoingCallModal;
