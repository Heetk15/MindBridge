import axios from 'axios'
import type { Conversation, ChatMessage } from '@/types/chat.types'

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5004/api`

const chatService = {
  /**
   * Send a message to the chatbot
   * @param {string} message - User message
   * @param {string | null} conversationId - Conversation ID
   * @returns {Promise<any>} - Response from AI
   */
  sendMessage: async (message: string, conversationId?: string | null, language?: string): Promise<any> => {
    try {
      const payload: any = {
        message,
        conversationId,
      }
      if (language && language !== 'auto') payload.language = language

      const response = await axios.post(`${API_URL}/chatbot/send`, payload, {
        timeout: 30000,
      })

      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.error || error.message,
        status: error.response?.status,
        details: error.response?.data,
      }
    }
  },

  /**
   * Send voice input (audio)
   * @param {string} audioBase64 - Base64 encoded audio
   * @param {string | null} conversationId - Conversation ID
   * @returns {Promise<any>} - Response with transcription and AI reply
   */
  sendVoiceMessage: async (audioBase64: string, conversationId?: string | null): Promise<any> => {
    try {
      const response = await axios.post(
        `${API_URL}/chatbot/voice`,
        {
          audio: audioBase64,
          conversationId,
        },
        { timeout: 30000 }
      )

      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.error || error.message,
        status: error.response?.status,
        details: error.response?.data,
      }
    }
  },

  /**
   * Get conversation history
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<any[]>} - Array of messages
   */
  getConversation: async (conversationId: string): Promise<any> => {
    try {
      const response = await axios.get(`${API_URL}/chatbot/conversation/${conversationId}`)
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.error || error.message,
        status: error.response?.status,
      }
    }
  },

  getConversations: async (): Promise<any> => {
    try {
      const response = await axios.get(`${API_URL}/chatbot/conversations`)
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.error || error.message,
        status: error.response?.status,
      }
    }
  },

  /**
   * Create new conversation
   * @returns {Promise<string>} - New conversation ID
   */
  createConversation: async (): Promise<string> => {
    try {
      const response = await axios.post(`${API_URL}/chatbot/conversation`)
      return response.data.conversationId as string
    } catch (error: any) {
      throw {
        message: error.response?.data?.error || error.message,
        status: error.response?.status,
      }
    }
  },
}

export default chatService
