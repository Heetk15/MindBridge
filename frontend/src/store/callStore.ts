import { create } from 'zustand';

export interface OnlineUser {
  userId: string;
  name: string;
  role: 'elderly' | 'caregiver';
}

export interface IncomingCall {
  callId: string;
  roomName: string;
  callerName: string;
  callerRole: string;
  callerId: string;
}

interface CallState {
  // Online users
  onlineUsers: OnlineUser[];
  setOnlineUsers: (users: OnlineUser[]) => void;

  // Incoming call
  incomingCall: IncomingCall | null;
  setIncomingCall: (call: IncomingCall | null) => void;

  // Active call
  activeCallId: string | null;
  activeRoomName: string | null;
  callStatus: 'idle' | 'ringing' | 'outgoing-ringing' | 'accepted' | 'in-call' | 'ended' | 'rejected';
  calleeId: string | null;

  // Actions
  setOutgoingCall: (callId: string, roomName: string, calleeId: string) => void;
  setCallAccepted: (callId: string, roomName: string) => void;
  setCallRejected: () => void;
  setCallEnded: () => void;
  setCallCancelled: () => void;
  resetCall: () => void;
}

export const useCallStore = create<CallState>((set) => ({
  onlineUsers: [],
  setOnlineUsers: (users) => set({ onlineUsers: users }),

  incomingCall: null,
  setIncomingCall: (call) => set({ incomingCall: call }),

  activeCallId: null,
  activeRoomName: null,
  callStatus: 'idle',
  calleeId: null,

  setOutgoingCall: (callId, roomName, calleeId) =>
    set({
      activeCallId: callId,
      activeRoomName: roomName,
      callStatus: 'outgoing-ringing',
      calleeId,
    }),

  setCallAccepted: (callId, roomName) =>
    set({
      activeCallId: callId,
      activeRoomName: roomName,
      callStatus: 'accepted',
      incomingCall: null,
    }),

  setCallRejected: () =>
    set({
      callStatus: 'rejected',
      activeCallId: null,
      activeRoomName: null,
      calleeId: null,
    }),

  setCallEnded: () =>
    set({
      callStatus: 'ended',
      activeCallId: null,
      activeRoomName: null,
      calleeId: null,
      incomingCall: null,
    }),

  setCallCancelled: () =>
    set({
      callStatus: 'idle',
      activeCallId: null,
      activeRoomName: null,
      calleeId: null,
      incomingCall: null,
    }),

  resetCall: () =>
    set({
      activeCallId: null,
      activeRoomName: null,
      callStatus: 'idle',
      calleeId: null,
      incomingCall: null,
    }),
}));
