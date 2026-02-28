import { useState } from 'react'
import { Copy, Check, ThumbsUp, ThumbsDown, Volume2, VolumeX, Bot, User, FileText } from 'lucide-react'
import { ChatMessage as ChatMessageType } from '../../types/chat.types'

function ChatMessage({ message, ttsEnabled = true, onReaction }: {
  message: ChatMessageType
  ttsEnabled?: boolean
  onReaction?: (id: string, reaction: string | null) => void
}) {
  const [copied, setCopied] = useState(false)
  const [reaction, setReaction] = useState<string | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [showSources, setShowSources] = useState(false)

  const isUser = message.sender === 'user'
  const timeString = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  const speak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }
    const newUtterance = new SpeechSynthesisUtterance(message.text)
    newUtterance.rate = 0.8
    newUtterance.onend = () => setIsSpeaking(false)
    window.speechSynthesis.speak(newUtterance)
    setIsSpeaking(true)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReaction = (type: string) => {
    const newReaction = reaction === type ? null : type
    setReaction(newReaction)
    onReaction?.(message.id, newReaction)
  }

  const hasSources = !isUser && message.context && message.context.length > 0

  return (
    <div className={`flex w-full mb-4 group ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* AI Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mr-2 mt-1 shrink-0 shadow-md shadow-primary/10">
          <Bot size={14} className="text-primary-foreground" />
        </div>
      )}

      <div className={`max-w-[80%] sm:max-w-[72%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Message Bubble */}
        <div
          className={`relative px-4 py-3 rounded-2xl transition-all duration-200 ${
            isUser
              ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-tr-md shadow-md shadow-primary/15'
              : 'bg-secondary/70 text-foreground rounded-tl-md border border-border/40 shadow-sm'
          }`}
        >
          {/* Message text */}
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
            {message.text}
          </p>

          {/* Sending indicator */}
          {isUser && message.status === 'sending' && (
            <div className="flex gap-0.5 mt-1 justify-end">
              <span className="w-1 h-1 bg-primary-foreground/40 rounded-full animate-bounce" />
              <span className="w-1 h-1 bg-primary-foreground/40 rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-1 h-1 bg-primary-foreground/40 rounded-full animate-bounce [animation-delay:0.3s]" />
            </div>
          )}
        </div>

        {/* Footer: time + actions */}
        <div className={`flex items-center gap-1 mt-1 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[10px] text-muted-foreground/50 font-medium tabular-nums">
            {timeString}
          </span>

          {/* Action buttons — visible on hover */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
            {/* Copy */}
            <button
              onClick={copyToClipboard}
              className="p-1 rounded-md hover:bg-secondary/80 transition-colors text-muted-foreground/60 hover:text-muted-foreground"
              title="Copy"
            >
              {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            </button>

            {/* TTS */}
            {!isUser && (
              <button
                onClick={speak}
                className={`p-1 rounded-md hover:bg-secondary/80 transition-colors ${
                  isSpeaking ? 'text-primary' : 'text-muted-foreground/60 hover:text-muted-foreground'
                }`}
                title={isSpeaking ? 'Stop' : 'Listen'}
              >
                {isSpeaking ? <VolumeX size={12} className="animate-pulse" /> : <Volume2 size={12} />}
              </button>
            )}

            {/* Thumbs up */}
            {!isUser && (
              <button
                onClick={() => handleReaction('thumbs-up')}
                className={`p-1 rounded-md hover:bg-secondary/80 transition-colors ${
                  reaction === 'thumbs-up' ? 'text-emerald-500' : 'text-muted-foreground/60 hover:text-muted-foreground'
                }`}
                title="Helpful"
              >
                <ThumbsUp size={12} />
              </button>
            )}

            {/* Thumbs down */}
            {!isUser && (
              <button
                onClick={() => handleReaction('thumbs-down')}
                className={`p-1 rounded-md hover:bg-secondary/80 transition-colors ${
                  reaction === 'thumbs-down' ? 'text-rose-500' : 'text-muted-foreground/60 hover:text-muted-foreground'
                }`}
                title="Not helpful"
              >
                <ThumbsDown size={12} />
              </button>
            )}

            {/* Sources toggle */}
            {hasSources && (
              <button
                onClick={() => setShowSources(!showSources)}
                className={`p-1 rounded-md hover:bg-secondary/80 transition-colors flex items-center gap-0.5 ${
                  showSources ? 'text-primary' : 'text-muted-foreground/60 hover:text-muted-foreground'
                }`}
                title="View sources"
              >
                <FileText size={12} />
                <span className="text-[9px] font-semibold">{message.context!.length}</span>
              </button>
            )}
          </div>
        </div>

        {/* RAG Sources — collapsible */}
        {hasSources && showSources && (
          <div className="mt-1.5 w-full space-y-1 animate-in slide-in-from-top-2 duration-200">
            <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider px-1 mb-1">
              Knowledge Base Sources
            </p>
            {message.context!.map((doc: any, idx: number) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-[11px] text-muted-foreground bg-secondary/50 p-2.5 rounded-xl border border-border/30 hover:border-primary/20 transition-all"
              >
                <div className="w-4 h-4 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText size={10} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground/70 text-[10px] truncate">
                    {doc.metadata?.source || 'MindBridge Knowledge'}
                  </p>
                  <p className="line-clamp-2 leading-relaxed opacity-70 text-[10px] mt-0.5">
                    {doc.content.substring(0, 100)}...
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center ml-2 mt-1 shrink-0 shadow-md shadow-violet-500/15">
          <User size={14} className="text-white" />
        </div>
      )}
    </div>
  )
}

export default ChatMessage