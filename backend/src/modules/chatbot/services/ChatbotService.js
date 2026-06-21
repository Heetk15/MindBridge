const axios = require('axios')

class ChatbotService {
  /**
   * Send message to Gemini API
   */
  static async sendToGemini(contextualPrompt, language = 'auto') {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY in .env')
    }

    try {

      const multilingualInstruction = `\n\nMULTILINGUAL SUPPORT:\n${language && language !== 'auto' ? `IMPORTANT: The user has selected "${language}" as their preferred language. You MUST respond ENTIRELY in ${language}.` : 'If the user writes in a non-English language, reply entirely in that language.'}`;
      
      const finalPrompt = contextualPrompt + multilingualInstruction;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          contents: [
            {
              parts: [{ text: finalPrompt }],
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
  static async sendToGroq(contextualPrompt, language = 'auto') {
    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
      throw new Error('Groq API key not configured. Please set GROQ_API_KEY in .env')
    }

    try {

      const multilingualInstruction = `\n\nMULTILINGUAL SUPPORT:\n${language && language !== 'auto' ? `IMPORTANT: The user has selected "${language}" as their preferred language. You MUST respond ENTIRELY in ${language}.` : 'If the user writes in a non-English language, reply entirely in that language.'}`;
      
      const finalPrompt = contextualPrompt + multilingualInstruction;

      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'user',
              content: finalPrompt,
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
