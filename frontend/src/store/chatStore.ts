import { create } from 'zustand';
import type { ChatMessage } from '@/types/chat.types';
import chatService from '@/services/chatService';

interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  conversationId: string | null;
  error: string | null;
  setConversationId: (id: string) => void;
  sendMessage: (text: string) => Promise<void>;
  sendVoiceMessage: (audioBase64: string) => Promise<void>;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [
    { id: '1', sender: 'ai', text: "Good morning, Margaret! 🌞 How are you feeling today?", timestamp: new Date(), mood: 'happy' },
  ],
  isTyping: false,
  conversationId: null,
  error: null,

  setConversationId: (id) => set({ conversationId: id }),

  sendMessage: async (text) => {
    const { conversationId } = get();
    // Add user message to state
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
      set((s) => ({ messages: [...s.messages, aiMsg], isTyping: false }));
    } catch (err: any) {
      console.error('Chat error:', err);
      set({ error: err.message, isTyping: false });
    }
  },

  sendVoiceMessage: async (audioBase64) => {
    const { conversationId } = get();
    set({ isTyping: true, error: null });

    try {
      const response = await chatService.sendVoiceMessage(audioBase64, conversationId);

      const userText = response.transcript || response.transcription || "Voice message sent"; // fallback
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

      set((s) => ({ messages: [...s.messages, userMsg, aiMsg], isTyping: false }));
    } catch (err: any) {
      console.error('Voice Chat error:', err);
      set({ error: err.message, isTyping: false });
    }
  },

  clearMessages: () => set({ messages: [] }),
}));
