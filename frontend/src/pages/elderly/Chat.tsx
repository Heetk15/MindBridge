import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Send,
  ArrowLeft,
  Database,
  Volume2,
  VolumeX,
  Globe,
  Trash2,
  Sparkles,
  Heart,
  Brain,
  MessageCircle,
  Bot,
  Mic,
  X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '../../store/chatStore'
import ChatMessage from '../../components/Chatbot/ChatMessage'
import VoiceRecorder from '../../components/Chatbot/VoiceRecorder'
import KnowledgeBaseModal from '../../components/Chatbot/KnowledgeBaseModal'
import EmergencyBanner from '../../components/emergency/EmergencyBanner'
import AuthenticatedLayout from '../../components/layout/AuthenticatedLayout'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5004/api'

const LANGUAGES = [
  { code: 'auto', label: 'Auto-detect', flag: '🌐', ttsLang: '' },
  { code: 'English', label: 'English', flag: '🇬🇧', ttsLang: 'en-US' },
  { code: 'Hindi', label: 'हिंदी', flag: '🇮🇳', ttsLang: 'hi-IN' },
  { code: 'Tamil', label: 'தமிழ்', flag: '🇮🇳', ttsLang: 'ta-IN' },
  { code: 'Telugu', label: 'తెలుగు', flag: '🇮🇳', ttsLang: 'te-IN' },
  { code: 'Bengali', label: 'বাংলা', flag: '🇮🇳', ttsLang: 'bn-IN' },
  { code: 'Kannada', label: 'ಕನ್ನಡ', flag: '🇮🇳', ttsLang: 'kn-IN' },
  { code: 'Malayalam', label: 'മലയാളം', flag: '🇮🇳', ttsLang: 'ml-IN' },
  { code: 'Marathi', label: 'मराठी', flag: '🇮🇳', ttsLang: 'mr-IN' },
  { code: 'Gujarati', label: 'ગુજરાતી', flag: '🇮🇳', ttsLang: 'gu-IN' },
  { code: 'Spanish', label: 'Español', flag: '🇪🇸', ttsLang: 'es-ES' },
  { code: 'French', label: 'Français', flag: '🇫🇷', ttsLang: 'fr-FR' },
  { code: 'German', label: 'Deutsch', flag: '🇩🇪', ttsLang: 'de-DE' },
  { code: 'Portuguese', label: 'Português', flag: '🇧🇷', ttsLang: 'pt-BR' },
  { code: 'Arabic', label: 'العربية', flag: '🇸🇦', ttsLang: 'ar-SA' },
  { code: 'Japanese', label: '日本語', flag: '🇯🇵', ttsLang: 'ja-JP' },
  { code: 'Chinese', label: '中文', flag: '🇨🇳', ttsLang: 'zh-CN' },
  { code: 'Korean', label: '한국어', flag: '🇰🇷', ttsLang: 'ko-KR' },
]

const QUICK_PROMPTS = [
  { icon: Heart, label: 'How can I sleep better tonight?', color: 'from-rose-500/20 to-pink-500/20 text-rose-600 dark:text-rose-400' },
  { icon: Brain, label: 'Tell me about my family', color: 'from-violet-500/20 to-purple-500/20 text-violet-600 dark:text-violet-400' },
  { icon: Sparkles, label: 'What health tips do you have?', color: 'from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400' },
  { icon: MessageCircle, label: 'Tell me a nice story', color: 'from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400' },
]

function ChatbotPage() {
  const navigate = useNavigate()
  const {
    messages,
    isTyping,
    error,
    conversationId,
    emergency,
    sendMessage,
    sendVoiceMessage,
    clearMessages,
    clearEmergency,
    language,
    setLanguage,
  } = useChatStore()

  const [inputText, setInputText] = useState('')
  const [useVoice, setUseVoice] = useState(false)
  const [showKBModal, setShowKBModal] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const prevIsTypingRef = useRef(false)
  const langMenuRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Emergency confirmation ──────────────────────────────────
  const handleEmergencyConfirm = async () => {
    try {
      const userId = conversationId || 'anonymous'
      const res = await fetch(`${API_URL}/v1/alerts/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reply: 'yes', userMeta: { name: 'User' } }),
      })
      const data = await res.json()
      if (data.message) await sendMessage(data.message)
    } catch (err) {
      console.error('Emergency confirm error:', err)
    } finally {
      clearEmergency()
    }
  }

  const handleEmergencyCancel = async () => {
    try {
      const userId = conversationId || 'anonymous'
      await fetch(`${API_URL}/v1/alerts/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reply: 'no' }),
      })
    } catch (err) {
      console.error('Emergency cancel error:', err)
    } finally {
      clearEmergency()
    }
  }

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  useEffect(() => { scrollToBottom() }, [messages])

  // Auto-TTS on AI reply
  useEffect(() => {
    if (prevIsTypingRef.current && !isTyping && ttsEnabled && messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.sender !== 'user') {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(lastMsg.text)
        utterance.rate = 0.8
        const langEntry = LANGUAGES.find((l) => l.code === language)
        if (langEntry?.ttsLang) {
          utterance.lang = langEntry.ttsLang
          const voices = window.speechSynthesis.getVoices()
          const match = voices.find((v) => v.lang.startsWith(langEntry.ttsLang.split('-')[0]))
          if (match) utterance.voice = match
        }
        window.speechSynthesis.speak(utterance)
      }
    }
    prevIsTypingRef.current = isTyping
  }, [isTyping]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close language menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) setShowLangMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSendMessage = async (text = inputText) => {
    if (!text.trim()) return
    setInputText('')
    await sendMessage(text)
    inputRef.current?.focus()
  }

  const handleVoiceTranscript = (transcript: string) => {
    setInputText(transcript)
    setUseVoice(false)
  }
  const handleVoiceSend = (transcript: string) => {
    handleSendMessage(transcript)
    setUseVoice(false)
  }
  const handleVoiceAudio = async (audioBase64: string) => {
    setUseVoice(false)
    await sendVoiceMessage(audioBase64)
  }

  const selectedLang = LANGUAGES.find((l) => l.code === language)

  return (
    <AuthenticatedLayout>
    <div className="flex h-[calc(100vh-3rem)] bg-gradient-to-br from-background via-background to-primary/5">
      <div className="flex-1 flex flex-col h-full max-w-4xl mx-auto w-full">

        {/* ─── Header ─── */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="px-4 sm:px-6 py-3 flex items-center justify-between border-b border-border/40 bg-card/60 backdrop-blur-xl sticky top-0 z-20"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-secondary rounded-xl transition-all text-muted-foreground hover:text-foreground"
              title="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
                  <Bot size={20} className="text-primary-foreground" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-bold text-foreground leading-tight">MindBridge AI</h1>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Online &bull; Ready to help</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language selector */}
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className={`px-3 py-2 rounded-xl transition-all text-sm flex items-center gap-2 ${
                  showLangMenu ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                }`}
                title="Change language"
              >
                <Globe size={18} />
                <span className="text-xs font-semibold">
                  {selectedLang?.flag} {language === 'auto' ? 'Language' : language}
                </span>
              </button>
              <AnimatePresence>
                {showLangMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 max-h-64 overflow-y-auto bg-card border border-border/60 rounded-2xl shadow-2xl z-50 py-1"
                  >
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => { setLanguage(l.code); setShowLangMenu(false) }}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 hover:bg-secondary/80 transition-colors ${
                          language === l.code ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground'
                        }`}
                      >
                        <span className="text-base">{l.flag}</span>
                        <span className="text-xs">{l.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* TTS toggle */}
            <button
              onClick={() => {
                const next = !ttsEnabled
                setTtsEnabled(next)
                if (!next) window.speechSynthesis.cancel()
              }}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-2 ${
                ttsEnabled
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
              }`}
              title={ttsEnabled ? 'Disable auto-speech' : 'Enable auto-speech'}
            >
              {ttsEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              <span className="text-xs font-semibold hidden sm:inline">{ttsEnabled ? 'Read Aloud' : 'Muted'}</span>
            </button>

            {/* Knowledge Base */}
            <button
              onClick={() => setShowKBModal(true)}
              className="px-3 py-2 rounded-xl hover:bg-secondary transition-all text-muted-foreground hover:text-foreground flex items-center gap-2"
              title="Knowledge Base"
            >
              <Database size={18} />
              <span className="text-xs font-semibold hidden sm:inline">My Info</span>
            </button>

            {/* Clear chat */}
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="px-3 py-2 rounded-xl hover:bg-destructive/10 transition-all text-muted-foreground hover:text-destructive flex items-center gap-2"
                title="Clear conversation"
              >
                <Trash2 size={18} />
                <span className="text-xs font-semibold hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </motion.header>

        {/* ─── Emergency Banner ─── */}
        <AnimatePresence>
          {emergency?.detected && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pt-3"
            >
              <EmergencyBanner
                emergency={emergency}
                onDismiss={clearEmergency}
                onConfirm={handleEmergencyConfirm}
                onCancel={handleEmergencyCancel}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Messages Area ─── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-1 scrollbar-thin scrollbar-thumb-border/50 hover:scrollbar-thumb-border transition-all">
          <AnimatePresence mode="popLayout">
            {messages.length === 0 ? (
              /* ─── Welcome Screen ─── */
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="flex flex-col items-center justify-center h-full text-center px-4"
              >
                {/* Avatar */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="relative mb-6"
                >
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary via-primary/80 to-violet-500 flex items-center justify-center shadow-2xl shadow-primary/30">
                    <Bot size={36} className="text-primary-foreground" />
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-[3px] border-background flex items-center justify-center"
                  >
                    <span className="w-2 h-2 bg-white rounded-full" />
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                    Hello! I'm here for you
                  </h2>
                  <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
                    Your personal AI companion. Ask me about your health, family, daily routines, or just have a friendly chat.
                  </p>
                </motion.div>

                {/* Quick prompts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                  {QUICK_PROMPTS.map((prompt, i) => (
                    <motion.button
                      key={prompt.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      onClick={() => handleSendMessage(prompt.label)}
                      className={`group flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r ${prompt.color} border border-border/30 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 text-left active:scale-[0.98]`}
                    >
                      <div className="p-2 rounded-xl bg-white/60 dark:bg-white/10 group-hover:scale-110 transition-transform">
                        <prompt.icon size={18} />
                      </div>
                      <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors leading-snug">
                        {prompt.label}
                      </span>
                    </motion.button>
                  ))}
                </div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="text-xs text-muted-foreground/50 mt-8 flex items-center gap-1.5"
                >
                  <Sparkles size={12} />
                  Powered by MindBridge RAG & AI
                </motion.p>
              </motion.div>
            ) : (
              /* ─── Message list ─── */
              messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index > messages.length - 3 ? 0.05 : 0 }}
                >
                  <ChatMessage
                    message={msg}
                    ttsEnabled={ttsEnabled}
                    onReaction={(id: string, reaction: string | null) => {
                      console.log('Reaction:', id, reaction)
                    }}
                  />
                </motion.div>
              ))
            )}

            {/* Typing indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-end gap-2.5 pl-1"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md shadow-primary/10">
                  <Bot size={14} className="text-primary-foreground" />
                </div>
                <div className="bg-secondary/80 backdrop-blur-sm rounded-2xl rounded-bl-md px-4 py-3 border border-border/30">
                  <div className="flex items-center gap-1.5">
                    <motion.span
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                      className="w-2 h-2 bg-primary/50 rounded-full"
                    />
                    <motion.span
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
                      className="w-2 h-2 bg-primary/50 rounded-full"
                    />
                    <motion.span
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
                      className="w-2 h-2 bg-primary/50 rounded-full"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground/60 mb-1">Thinking...</span>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* ─── Error ─── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mx-4 mb-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center justify-between"
            >
              <p className="text-xs font-medium text-destructive">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Input Area ─── */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="p-3 sm:p-4 border-t border-border/40 bg-card/60 backdrop-blur-xl"
        >
          {useVoice ? (
            <div className="relative">
              <VoiceRecorder
                onTranscript={handleVoiceTranscript}
                onAudioData={handleVoiceAudio}
                onSendMessage={handleVoiceSend}
                disabled={isTyping}
              />
              <button
                onClick={() => setUseVoice(false)}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-secondary hover:bg-destructive/10 hover:text-destructive transition-all"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-end gap-2">
              {/* Voice button */}
              <button
                onClick={() => setUseVoice(true)}
                disabled={isTyping}
                className="shrink-0 px-4 py-3 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 flex items-center gap-2"
                title="Voice input"
              >
                <Mic size={22} />
                <span className="text-sm font-semibold hidden sm:inline">Voice</span>
              </button>

              {/* Text input */}
              <div className="flex-1 flex items-end bg-secondary/50 rounded-2xl border border-border/40 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Type your message..."
                  disabled={isTyping}
                  className="flex-1 px-4 py-3 bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground/50 text-base disabled:opacity-50 min-w-0"
                />
              </div>

              {/* Send button */}
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isTyping}
                className={`shrink-0 px-4 py-3 rounded-2xl transition-all duration-200 shadow-lg active:scale-95 disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2 ${
                  inputText.trim()
                    ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-primary/20 hover:shadow-primary/30 hover:scale-105'
                    : 'bg-secondary text-muted-foreground shadow-none'
                }`}
              >
                <Send size={22} />
                <span className="text-sm font-semibold hidden sm:inline">Send</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Knowledge Base Modal */}
      <KnowledgeBaseModal isOpen={showKBModal} onClose={() => setShowKBModal(false)} />
    </div>
    </AuthenticatedLayout>
  )
}

export default ChatbotPage