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
      let contextSection = ''
      
      if (relevantDocs && relevantDocs.length > 0) {
        // Use full content or up to 500 chars for better context
        contextSection = relevantDocs
          .map((doc, idx) => `[KNOWLEDGE BASE ${idx + 1}]:\n${doc.content.substring(0, 500)}\n---`)
          .join('\n\n')

        contextualPrompt = `CONTEXT FROM KNOWLEDGE BASE:\n${contextSection}\n\n[USER QUESTION]:\n${message}`
      }

      const systemPrompt = `You are a compassionate AI companion for elderly users named MindBridge. You MUST prioritize using the provided knowledge base information to answer questions. 

INSTRUCTIONS:
1. ALWAYS refer to the knowledge base information provided above when answering
2. Use specific details from the knowledge base to personalize your responses
3. If the knowledge base contains relevant information, cite it directly or reference it
4. Be warm, kind, and patient - speak in a friendly, easy-to-understand tone
5. Address the user by their name (Margaret) when relevant
6. Provide clear, actionable advice based on the knowledge base
7. Never ignore the provided context - use it to make responses personal and specific

KNOWLEDGE BASE COVERS: Family information, medical health conditions, nutrition, daily exercise routines, wellness tips, hobbies, and lifestyle guidance.`

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          contents: [
            {
              parts: [{ text: `${systemPrompt}\n\n${contextualPrompt}` }],
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
      let contextSection = ''
      
      if (relevantDocs && relevantDocs.length > 0) {
        // Use full content or up to 500 chars for better context
        contextSection = relevantDocs
          .map((doc, idx) => `[KNOWLEDGE BASE ${idx + 1}]:\n${doc.content.substring(0, 500)}\n---`)
          .join('\n\n')

        contextualPrompt = `CONTEXT FROM KNOWLEDGE BASE:\n${contextSection}\n\n[USER QUESTION]:\n${message}`
      }

      const systemPrompt = `You are a compassionate AI companion for elderly users named MindBridge. You MUST prioritize using the provided knowledge base information to answer questions. 

INSTRUCTIONS:
1. ALWAYS refer to the knowledge base information provided above when answering
2. Use specific details from the knowledge base to personalize your responses
3. If the knowledge base contains relevant information, cite it directly or reference it
4. Be warm, kind, and patient - speak in a friendly, easy-to-understand tone
5. Address the user by their name (Margaret) when relevant
6. Provide clear, actionable advice based on the knowledge base
7. Never ignore the provided context - use it to make responses personal and specific

KNOWLEDGE BASE COVERS: Family information, medical health conditions, nutrition, daily exercise routines, wellness tips, hobbies, and lifestyle guidance.`

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
