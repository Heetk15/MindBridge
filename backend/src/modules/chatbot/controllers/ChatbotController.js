const ChatbotService = require('../services/ChatbotService')

class ChatbotController {
  /**
   * Send text message to AI
   */
  static async sendMessage(req, res) {
    try {
      const { message, conversationId } = req.body

      // Validation
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' })
      }

      // Check if AI is configured
      if (!ChatbotService.isConfigured()) {
        return res.status(503).json({
          error: 'AI service not configured',
          message: 'Please configure API keys in server environment variables',
        })
      }

      const model = ChatbotService.getConfiguredModel()

      // Send to appropriate AI service
      let result

      if (model === 'gemini') {
        result = await ChatbotService.sendToGemini(message)
      } else if (model === 'groq') {
        result = await ChatbotService.sendToGroq(message)
      }

      // Return structured response
      res.json({
        success: true,
        conversationId,
        reply: result.reply,
        model: result.model,
        context: result.context || [],
        metadata: {
          timestamp: new Date(),
          tokens: result.tokens,
        },
      })
    } catch (error) {
      console.error('Chatbot error:', error)

      res.status(500).json({
        error: error.message || 'Failed to process message',
        details: process.env.NODE_ENV === 'development' ? error.toString() : undefined,
      })
    }
  }

  /**
   * Send voice message to AI
   */
  static async sendVoiceMessage(req, res) {
    try {
      const { audio, conversationId } = req.body

      if (!audio) {
        return res.status(400).json({ error: 'Audio data is required' })
      }

      // Check if AI is configured
      if (!ChatbotService.isConfigured()) {
        return res.status(503).json({
          error: 'AI service not configured',
          message: 'Please configure API keys in server environment variables',
        })
      }

      const model = ChatbotService.getConfiguredModel()

      // Transcribe audio
      const transcriptionResult = await ChatbotService.transcribeAudio(audio)

      // Send transcribed text to AI
      let result

      if (model === 'gemini') {
        result = await ChatbotService.sendToGemini(
          transcriptionResult.transcription
        )
      } else if (model === 'groq') {
        result = await ChatbotService.sendToGroq(
          transcriptionResult.transcription
        )
      }

      res.json({
        success: true,
        conversationId,
        transcription: transcriptionResult.transcription,
        reply: result.reply,
        model: result.model,
      })
    } catch (error) {
      console.error('Voice message error:', error)

      res.status(500).json({
        error: error.message || 'Failed to process voice message',
      })
    }
  }

  /**
   * Create new conversation
   */
  static async createConversation(req, res) {
    try {
      // Generate unique conversation ID
      const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`

      // Check if AI is properly configured
      if (!ChatbotService.isConfigured()) {
        return res.status(503).json({
          success: false,
          error: 'AI service not configured',
          message: 'Server admin must configure API keys',
        })
      }

      const model = ChatbotService.getConfiguredModel()

      res.json({
        success: true,
        conversationId,
        model,
        createdAt: new Date(),
      })
    } catch (error) {
      console.error('Conversation creation error:', error)

      res.status(500).json({
        error: 'Failed to create conversation',
      })
    }
  }

  /**
   * Get conversation history (placeholder)
   */
  static async getConversation(req, res) {
    try {
      const { conversationId } = req.params

      // In production, fetch from database
      res.json({
        success: true,
        conversationId,
        messages: [],
      })
    } catch (error) {
      console.error('Get conversation error:', error)

      res.status(500).json({
        error: 'Failed to retrieve conversation',
      })
    }
  }
}

module.exports = ChatbotController
