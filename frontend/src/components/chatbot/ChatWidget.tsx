import { useState } from 'react'
import { FiMessageCircle, FiSend } from 'react-icons/fi'

function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hello! How can I help you today?',
      time: new Date(Date.now() - 5004),
    },
  ])
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (input.trim()) {
      setMessages([
        ...messages,
        {
          id: messages.length + 1,
          sender: 'user',
          text: input,
          time: new Date(),
        },
      ])
      setInput('')
      // Here you would send to backend
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center z-40"
        title="Open chat"
      >
        <FiMessageCircle size={24} />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[32rem] bg-card/95 backdrop-blur-xl rounded-3xl shadow-elevated border border-border/50 flex flex-col z-40 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="gradient-primary text-primary-foreground p-5 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-xs">MB</div>
          <div>
            <h3 className="font-bold text-sm leading-none">MindBridge Assistant</h3>
            <p className="text-[10px] text-primary-foreground/70 mt-1 uppercase tracking-wider font-medium">Online & Ready</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1.5 hover:bg-black/10 rounded-lg transition-colors text-2xl leading-none font-light"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-6 space-y-4 bg-background/50 scrollbar-thin">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-2xl shadow-sm text-sm font-medium ${msg.sender === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-none'
                  : 'bg-secondary text-foreground rounded-bl-none border border-border/30'
                }`}
            >
              <p className="leading-relaxed">{msg.text}</p>
              <div className={`mt-1.5 flex items-center gap-1.5 opacity-40 text-[9px] uppercase font-bold tracking-tighter ${msg.sender === 'user' ? 'text-primary-foreground' : 'text-muted-foreground'
                }`}>
                {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 bg-card/80 backdrop-blur-md border-t border-border/30">
        <div className="flex gap-2 bg-secondary/50 p-2 rounded-2xl border border-border/30 group focus-within:border-primary/30 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-transparent outline-none text-sm placeholder:text-muted-foreground/50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="gradient-primary text-primary-foreground p-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md disabled:grayscale disabled:opacity-30 disabled:scale-100"
          >
            <FiSend size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatWidget