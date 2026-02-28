import { FiCheckCircle, FiCopy, FiThumbsUp, FiThumbsDown, FiVolume2, FiVolumeX } from 'react-icons/fi'
import { useState } from 'react'
import { ChatMessage as ChatMessageType } from '../../types/chat.types'

function ChatMessage({ message, onReaction }: { message: ChatMessageType; onReaction?: (id: string, reaction: string | null) => void }) {
  const [copied, setCopied] = useState(false)
  const [reaction, setReaction] = useState<string | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const isUser = message.sender === 'user'
  const timeString = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  const containerClasses = `flex w-full mb-8 group ${isUser ? 'justify-end' : 'justify-start'}`

  const bubbleClasses = `relative max-w-[85%] sm:max-w-[75%] p-5 rounded-3xl shadow-sm transition-all duration-300 ${isUser
      ? 'bg-primary text-primary-foreground rounded-tr-none shadow-primary/10'
      : 'bg-secondary text-foreground rounded-tl-none shadow-card/5 border border-border/30'
    }`

  const speak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }
    const newUtterance = new SpeechSynthesisUtterance(message.text)
    newUtterance.rate = 0.8 // Clearer for elderly users
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

  return (
    <div className={containerClasses}>
      {!isUser && (
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center mr-3 mt-1 shrink-0 shadow-sm border border-primary/10 font-bold text-primary text-xs tracking-tighter">
          MB
        </div>
      )}

      <div className={bubbleClasses}>
        {/* Actions - Context Menu Style */}
        <div className={`absolute top-0 ${isUser ? '-left-12' : '-right-12'} flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0`}>
          <button
            onClick={copyToClipboard}
            className="p-2.5 bg-card/80 backdrop-blur-md border border-border/50 rounded-xl hover:bg-secondary transition-colors text-muted-foreground shadow-sm"
            title="Copy message"
          >
            {copied ? <FiCheckCircle size={14} className="text-success" /> : <FiCopy size={14} />}
          </button>
          <button
            onClick={speak}
            className="p-2.5 bg-card/80 backdrop-blur-md border border-border/50 rounded-xl hover:bg-secondary transition-colors text-muted-foreground shadow-sm"
            title="Listen to message"
          >
            {isSpeaking ? <FiVolumeX size={14} className="text-primary animate-pulse" /> : <FiVolume2 size={14} />}
          </button>
          <div className="h-px bg-border/30 mx-1" />
          <button
            onClick={() => handleReaction('thumbs-up')}
            className={`p-2.5 bg-card/80 backdrop-blur-md border border-border/50 rounded-xl hover:bg-secondary transition-colors shadow-sm ${reaction === 'thumbs-up' ? 'text-success' : 'text-muted-foreground'}`}
          >
            <FiThumbsUp size={14} />
          </button>
        </div>

        {/* Message Content */}
        <div className="space-y-4">
          <p className="text-[16px] leading-[1.6] whitespace-pre-wrap break-words font-medium">
            {message.text}
          </p>

          {/* RAG Context / Sources */}
          {!isUser && message.context && message.context.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/40">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-3 bg-primary rounded-full group-hover:scale-y-125 transition-transform" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Knowledge Base Sources</p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {message.context.map((doc: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 text-[11px] text-muted-foreground bg-card/40 p-3 rounded-xl border border-border/30 hover:border-primary/20 transition-all group/source cursor-default">
                    <FiCheckCircle size={12} className="mt-1 text-success shrink-0 opacity-40 group-hover/source:opacity-100 transition-opacity" />
                    <div className="space-y-1">
                      <p className="font-bold text-foreground/70 uppercase tracking-tighter text-[9px]">{doc.metadata?.source || 'MindBridge Guide'}</p>
                      <p className="line-clamp-2 leading-relaxed italic opacity-80 group-hover/source:opacity-100 transition-opacity">
                        "{doc.content.substring(0, 80)}..."
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className={`flex items-center gap-2 mt-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-[10px] uppercase font-bold tracking-widest opacity-30 ${isUser ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
            {timeString}
          </span>
          {isUser && message.status === 'sending' && (
            <div className="flex gap-0.5">
              <span className="w-1 h-1 bg-primary-foreground/40 rounded-full animate-bounce" />
              <span className="w-1 h-1 bg-primary-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-1 bg-primary-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center ml-3 mt-1 shrink-0 shadow-lg shadow-primary/20 text-primary-foreground font-bold text-xs">
          ME
        </div>
      )}
    </div>
  )
}

export default ChatMessage