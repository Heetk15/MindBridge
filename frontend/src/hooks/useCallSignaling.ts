import { useEffect } from 'react';
import { getSocket } from '@/services/socketService';
import { useCallStore } from '@/store/callStore';
import { useAuthStore } from '@/store/authStore';
import { useGeofenceAlertStore } from '@/store/geofenceAlertStore';

// ── Standalone action functions (safe to call from any component) ──

export const callActions = {
  initiateCall: (calleeId: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    // Store calleeId immediately so cancel works
    useCallStore.setState({ calleeId });
    // Store peer info from online users list
    const peer = useCallStore.getState().onlineUsers.find((u) => u.userId === calleeId);
    if (peer) {
      useCallStore.getState().setPeerInfo({ userId: peer.userId, name: peer.name, role: peer.role });
    }
    const socket = getSocket();
    socket.emit('call:initiate', {
      calleeId,
      callerId: user.id,
      callerName: user.name,
      callerRole: user.role,
    });
  },

  acceptCall: (callId: string, roomName: string, callerId: string) => {
    // Store the caller as peer info before accepting
    const incoming = useCallStore.getState().incomingCall;
    if (incoming) {
      useCallStore.getState().setPeerInfo({
        userId: incoming.callerId,
        name: incoming.callerName,
        role: incoming.callerRole as 'elderly' | 'caregiver',
      });
    }
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

  sendChatMessage: (toUserId: string, text: string) => {
    const user = useAuthStore.getState().user;
    if (!user || !text.trim()) return;
    const socket = getSocket();
    const msg = {
      toUserId,
      text: text.trim(),
      senderName: user.name,
      senderRole: user.role,
    };
    socket.emit('chat:send', msg);
    // Add to local store immediately
    useCallStore.getState().addChatMessage({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      senderName: user.name,
      senderRole: user.role,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMine: true,
    });
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

    const onChatReceive = (data: any) => {
      useCallStore.getState().addChatMessage({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        senderName: data.senderName,
        senderRole: data.senderRole,
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMine: false,
      });
    };

    // ── Geofence alert handlers ──
    const onGeofenceAlert = (data: any) => {
      console.log('🚨 Geofence breach alert:', data.patientName, data.distance, 'm');
      useGeofenceAlertStore.getState().addAlert({
        alertId: data.alertId,
        userId: data.userId,
        patientName: data.patientName,
        distance: data.distance,
        safeRadius: data.safeRadius,
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: data.timestamp,
      });
    };

    const onGeofenceResolved = (data: any) => {
      console.log(`✅ Geofence alert resolved [${data.action}] by ${data.resolvedBy}`);
      useGeofenceAlertStore.getState().resolveRemote(data.alertId, data.action);
    };

    socket.on('users:online', onOnlineUsers);
    socket.on('call:incoming', onIncoming);
    socket.on('call:ringing', onRinging);
    socket.on('call:accepted', onAccepted);
    socket.on('call:rejected', onRejected);
    socket.on('call:ended', onEnded);
    socket.on('call:cancelled', onCancelled);
    socket.on('call:error', onError);
    socket.on('chat:receive', onChatReceive);
    socket.on('geofence:alert', onGeofenceAlert);
    socket.on('geofence:resolved', onGeofenceResolved);

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
      socket.off('chat:receive', onChatReceive);
      socket.off('geofence:alert', onGeofenceAlert);
      socket.off('geofence:resolved', onGeofenceResolved);
    };
  }, [user]);

  // Return actions for convenience (AppShell doesn't use them but keeps API compatible)
  return callActions;
};
