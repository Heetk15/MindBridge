import { create } from 'zustand';
import type { ChatMessage } from '@/types/chat.types';
import chatService from '@/services/chatService';

export interface EmergencyData {
  detected: boolean;
  severity: 'LEVEL_0' | 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3';
  severityLevel: number;
  score: number;
  matchedKeywords: string[];
  action: string;
  confirmationMessage: string | null;
  telegramSent: boolean;
  userMessage: string | null;
}

interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  conversationId: string | null;
  error: string | null;
  emergency: EmergencyData | null;
  setConversationId: (id: string) => void;
  sendMessage: (text: string) => Promise<void>;
  sendVoiceMessage: (audioBase64: string) => Promise<void>;
  clearMessages: () => void;
  clearEmergency: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [
    { id: '1', sender: 'ai', text: "Good morning, Margaret! ðŸŒž How are you feeling today?", timestamp: new Date(), mood: 'happy' },
  ],
  isTyping: false,
  conversationId: null,
  error: null,
  emergency: null,

  setConversationId: (id) => set({ conversationId: id }),

  clearEmergency: () => set({ emergency: null }),

  sendMessage: async (text) => {
    let { conversationId } = get();

    // Auto-create a conversation in MongoDB on the first message
    if (!conversationId) {
      try {
        conversationId = await chatService.createConversation();
        set({ conversationId });
      } catch (e) {
        console.warn('Could not create conversation in DB, continuing without persistence:', e);
      }
    }

    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text, timestamp: new Date() };
    set((s) => ({ messages: [...s.messages, userMsg], isTyping: true, error: null }));

    try {
      const response = await chatService.sendMessage(text, conversationId);
      const aiText = response.reply || response.text || response.message || 'Received response';
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiText,
        timestamp: new Date(),
        mood: response.mood || 'caring',
        context: response.context || [],
      };
      set((s) => ({
        messages: [...s.messages, aiMsg],
        isTyping: false,
        emergency: response.emergency ?? null,
      }));
    } catch (err: any) {
      console.error('Chat error:', err);
      set({ error: err.message, isTyping: false });
    }
  },

  sendVoiceMessage: async (audioBase64) => {
    let { conversationId } = get();

    // Auto-create a conversation in MongoDB on the first voice message
    if (!conversationId) {
      try {
        conversationId = await chatService.createConversation();
        set({ conversationId });
      } catch (e) {
        console.warn('Could not create conversation in DB, continuing without persistence:', e);
      }
    }

    set({ isTyping: true, error: null });

    try {
      const response = await chatService.sendVoiceMessage(audioBase64, conversationId);

      const userText = response.transcript || response.transcription || 'Voice message sent';
      const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: userText, timestamp: new Date() };

      const aiText = response.reply || response.text || response.message || 'Received voice response';
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiText,
        timestamp: new Date(),
        mood: response.mood || 'caring',
        context: response.context || [],
      };

      set((s) => ({
        messages: [...s.messages, userMsg, aiMsg],
        isTyping: false,
        emergency: response.emergency ?? null,
      }));
    } catch (err: any) {
      console.error('Voice Chat error:', err);
      set({ error: err.message, isTyping: false });
    }
  },

  clearMessages: () => set({ messages: [], emergency: null, conversationId: null }),
}));
