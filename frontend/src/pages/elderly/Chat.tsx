import { useState, useEffect, useRef } from 'react'
import {
  FiSend,
} from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '../../store/chatStore'
import ChatMessage from '../../components/Chatbot/ChatMessage'
import VoiceRecorder from '../../components/Chatbot/VoiceRecorder'

function ChatbotPage() {
  const {
    messages,
    isTyping,
    error,
    conversationId,
    sendMessage,
    sendVoiceMessage,
    clearMessages,
  } = useChatStore()

  const [inputText, setInputText] = useState('')
  const [useVoice, setUseVoice] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle sending text message
  const handleSendMessage = async (text = inputText) => {
    if (!text.trim()) return
    setInputText('')
    await sendMessage(text)
    inputRef.current?.focus()
  }

  // Handle voice input
  const handleVoiceTranscript = (transcript: string) => {
    setInputText(transcript)
    setUseVoice(false)
  }

  // Handle voice message sent directly
  const handleVoiceSend = (transcript: string) => {
    handleSendMessage(transcript)
    setUseVoice(false)
  }

  const handleVoiceAudio = async (audioBase64: string) => {
    setUseVoice(false)
    await sendVoiceMessage(audioBase64)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Main Chatbot Area */}
      <div className="flex-1 flex flex-col h-full max-w-5xl mx-auto border-x border-border/50 bg-card/30 backdrop-blur-sm">
        {/* Header */}
        <header className="bg-card/50 backdrop-blur-md border-b border-border/50 px-8 py-6 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display flex items-center gap-2">
              <span className="w-2 h-8 bg-primary rounded-full" />
              MindBridge Chat
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {messages.length} messages in this session
            </p>
          </div>
          <div className="flex items-center gap-3">
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="p-3 hover:bg-secondary rounded-xl transition-all font-medium text-destructive flex items-center gap-2"
                title="Clear conversation"
              >
                <span className="text-lg">🗑</span>
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6 scrollbar-thin scrollbar-thumb-primary/10 hover:scrollbar-thumb-primary/20 transition-all">
          <AnimatePresence mode="popLayout">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto"
              >
                <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center text-5xl mb-8 animate-float">
                  💬
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-4 font-display">
                  Welcome to MindBridge
                </h2>
                <p className="text-muted-foreground mb-12 text-lg">
                  I'm your AI companion, specialized in health and daily guidance for senior citizens.
                  How can I help you today?
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  {[
                    "How can I improve my sleep tonight?",
                    "What health tips do you have for me?",
                    "Tell me a story about a happy memory.",
                    "How are you feeling today?"
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSendMessage(suggestion)}
                      className="p-5 bg-card border border-border/50 rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all text-left text-sm font-medium group flex items-center justify-between"
                    >
                      <span className="text-foreground/80 group-hover:text-primary transition-colors">{suggestion}</span>
                      <span className="text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">→</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              messages.map((msg) => (
                <motion.div key={msg.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <ChatMessage
                    message={msg}
                    onReaction={(id: string, reaction: string | null) => {
                      console.log('Reaction:', id, reaction)
                    }}
                  />
                </motion.div>
              ))
            )}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 px-2"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-xl animate-pulse flex items-center justify-center text-primary text-xs font-bold">AI</div>
                <div className="flex gap-1.5 p-4 bg-secondary rounded-2xl rounded-bl-none">
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mx-8 mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center justify-between"
            >
              <p className="text-sm font-medium text-destructive">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="p-8 pt-2">
          <div className="glass-card-elevated p-3 relative overflow-hidden group/input border-border/40">
            {useVoice ? (
              <VoiceRecorder
                onTranscript={handleVoiceTranscript}
                onAudioData={handleVoiceAudio}
                onSendMessage={handleVoiceSend}
                disabled={isTyping}
              />
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setUseVoice(true)}
                  className="p-4 bg-destructive text-destructive-foreground rounded-xl hover:opacity-90 transition-all font-semibold flex items-center justify-center shadow-lg hover:shadow-destructive/20 active:scale-95 disabled:opacity-50"
                  disabled={isTyping}
                  title="Speak message"
                >
                  <span className="text-xl">🎤</span>
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything..."
                  disabled={isTyping}
                  className="flex-1 px-5 py-4 bg-transparent rounded-xl focus:outline-none text-foreground placeholder:text-muted-foreground/60 text-lg disabled:opacity-50"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || isTyping}
                  className="px-8 py-4 gradient-primary text-primary-foreground rounded-xl hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:grayscale disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed font-bold flex items-center gap-3 shadow-lg hover:shadow-primary/30"
                >
                  <FiSend size={20} className={inputText.trim() ? "animate-bounce" : ""} />
                  <span>Send</span>
                </button>
              </div>
            )}
          </div>
          <p className="text-center text-[10px] text-muted-foreground mt-3 uppercase tracking-widest font-bold opacity-40">
            Powered by MindBridge RAG & AI
          </p>
        </div>
      </div>
    </div>
  )
}

export default ChatbotPage