const axios = require('axios')
const RAGService = require('../../rag/services/RAGService')

class ChatbotService {
  /**
   * Send message to Gemini API
   */
  static async sendToGemini(message) {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY in .env')
    }

    try {
      // Retrieve relevant context from knowledge base
      const relevantDocs = await RAGService.search(message, 3)

      let contextualPrompt = message
      if (relevantDocs && relevantDocs.length > 0) {
        const contextText = relevantDocs
          .map((doc) => `- ${doc.content.substring(0, 150)}...`)
          .join('\n')

        contextualPrompt = `Based on the following relevant information:\n${contextText}\n\nUser question: ${message}`
      }

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          contents: [
            {
              parts: [{ text: contextualPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        },
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text

      if (!reply) {
        throw new Error('No response from Gemini API. Response: ' + JSON.stringify(response.data))
      }

      return {
        reply,
        model: 'gemini',
        context: relevantDocs || [],
        tokens: response.data?.usageMetadata || {},
      }
    } catch (error) {
      console.error('Gemini API Full Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      })
      const errorMessage = error.response?.data?.error?.message || error.message
      throw new Error(`Gemini API Error: ${errorMessage}`)
    }
  }

  /**
   * Send message to Groq API
   */
  static async sendToGroq(message) {
    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
      throw new Error('Groq API key not configured. Please set GROQ_API_KEY in .env')
    }

    try {
      // Retrieve relevant context from knowledge base
      const relevantDocs = await RAGService.search(message, 3)

      let contextualPrompt = message
      if (relevantDocs && relevantDocs.length > 0) {
        const contextText = relevantDocs
          .map((doc) => `- ${doc.content.substring(0, 150)}...`)
          .join('\n')

        contextualPrompt = `Based on the following relevant information:\n${contextText}\n\nUser question: ${message}`
      }

      const systemPrompt = `You are a helpful, compassionate AI assistant for elderly users. You have access to a knowledge base with information about health, wellness, family relationships, and daily life guidance. Be kind, patient, and provide clear, easy-to-understand responses. Speak in a warm and friendly tone. When relevant, refer to specific information from the knowledge base to provide personalized and accurate advice.`

      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: contextualPrompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        },
        {
          timeout: 30000,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const reply = response.data?.choices?.[0]?.message?.content

      if (!reply) {
        throw new Error('No response from Groq API')
      }

      return {
        reply,
        model: 'groq',
        context: relevantDocs || [],
        tokens: response.data?.usage || {},
      }
    } catch (error) {
      const message = error.response?.data?.error?.message || error.message
      throw new Error(`Groq API Error: ${message}`)
    }
  }

  /**
   * Get configured AI model
   */
  static getConfiguredModel() {
    const model = process.env.AI_MODEL || 'gemini'
    return model
  }

  /**
   * Check if AI is properly configured
   */
  static isConfigured() {
    const model = this.getConfiguredModel()

    if (model === 'gemini' && !process.env.GEMINI_API_KEY) {
      return false
    }
    if (model === 'groq' && !process.env.GROQ_API_KEY) {
      return false
    }
    return true
  }
}

module.exports = ChatbotService
