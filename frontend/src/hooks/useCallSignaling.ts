import { useEffect } from 'react';
import { getSocket } from '@/services/socketService';
import { useCallStore } from '@/store/callStore';
import { useAuthStore } from '@/store/authStore';

// ── Standalone action functions (safe to call from any component) ──

export const callActions = {
  initiateCall: (calleeId: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    // Store calleeId immediately so cancel works
    useCallStore.setState({ calleeId });
    const socket = getSocket();
    socket.emit('call:initiate', {
      calleeId,
      callerId: user.id,
      callerName: user.name,
      callerRole: user.role,
    });
  },

  acceptCall: (callId: string, roomName: string, callerId: string) => {
    const socket = getSocket();
    socket.emit('call:accept', { callId, roomName, callerId });
  },

  rejectCall: (callId: string, callerId: string) => {
    const socket = getSocket();
    socket.emit('call:reject', { callId, callerId });
    useCallStore.setState({ incomingCall: null });
  },

  cancelCall: (callId: string, calleeId: string) => {
    const socket = getSocket();
    socket.emit('call:cancel', { callId, calleeId });
    useCallStore.getState().resetCall();
  },

  endCall: (callId: string, otherUserId: string) => {
    const socket = getSocket();
    socket.emit('call:end', { callId, otherUserId });
    useCallStore.getState().setCallEnded();
  },
};

/**
 * Hook that manages the socket connection and call signaling.
 * ⚠️  Must be used ONLY ONCE at the app level (AppShell in App.tsx).
 * Other components should import `callActions` instead.
 */
export const useCallSignaling = () => {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    const socket = getSocket();

    // Register user as online
    socket.emit('user:online', {
      userId: user.id,
      name: user.name,
      role: user.role,
    });

    // -- Handlers (use store.getState / setState so no stale closures) --

    const onOnlineUsers = (users: any[]) => {
      const others = users.filter((u: any) => u.userId !== user.id);
      useCallStore.getState().setOnlineUsers(others);
    };

    const onIncoming = (data: any) => {
      console.log('📞 Incoming call from', data.callerName);
      useCallStore.getState().setIncomingCall({
        callId: data.callId,
        roomName: data.roomName,
        callerName: data.callerName,
        callerRole: data.callerRole,
        callerId: data.callerId,
      });
    };

    const onRinging = (data: any) => {
      console.log('🔔 Call ringing...', data.roomName);
      useCallStore.getState().setOutgoingCall(data.callId, data.roomName, data.calleeId || '');
    };

    const onAccepted = (data: any) => {
      console.log('✅ Call accepted, room:', data.roomName);
      useCallStore.getState().setCallAccepted(data.callId, data.roomName);
    };

    const onRejected = () => {
      console.log('❌ Call rejected');
      useCallStore.getState().setCallRejected();
      setTimeout(() => useCallStore.getState().resetCall(), 3000);
    };

    const onEnded = () => {
      console.log('📴 Call ended');
      useCallStore.getState().setCallEnded();
    };

    const onCancelled = () => {
      console.log('🚫 Call cancelled');
      useCallStore.getState().setCallCancelled();
    };

    const onError = (data: any) => {
      console.error('Call error:', data.message);
      alert(data.message);
      useCallStore.getState().resetCall();
    };

    socket.on('users:online', onOnlineUsers);
    socket.on('call:incoming', onIncoming);
    socket.on('call:ringing', onRinging);
    socket.on('call:accepted', onAccepted);
    socket.on('call:rejected', onRejected);
    socket.on('call:ended', onEnded);
    socket.on('call:cancelled', onCancelled);
    socket.on('call:error', onError);

    // Request initial online users
    socket.emit('users:getOnline');

    return () => {
      // Remove only OUR specific handler references (not all handlers)
      socket.off('users:online', onOnlineUsers);
      socket.off('call:incoming', onIncoming);
      socket.off('call:ringing', onRinging);
      socket.off('call:accepted', onAccepted);
      socket.off('call:rejected', onRejected);
      socket.off('call:ended', onEnded);
      socket.off('call:cancelled', onCancelled);
      socket.off('call:error', onError);
    };
  }, [user]);

  // Return actions for convenience (AppShell doesn't use them but keeps API compatible)
  return callActions;
};
