import { useEffect, useState } from 'react';
import MBCard from '@/components/common/Card';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, ChevronDown, ChevronRight, User, Bot,
  Loader2, RefreshCw, Calendar, Hash, AlertCircle, Smile,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import chatService from '@/services/chatService';

interface Message {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  mood?: string;
}

interface ConvDetail {
  id: string;
  title: string;
  status: string;
  messageCount: number;
  startedAt: string;
  lastMessage: string | null;
  mood?: string;
  moodColor?: string;
  summary?: string;
  messages?: Message[];
  _expanded?: boolean;
  _loading?: boolean;
}

const moodStyles: Record<string, string> = {
  green:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  blue:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  red:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  gray:   'bg-secondary text-muted-foreground',
}

const MsgBubble = ({ msg }: { msg: Message }) => {
  const isUser = msg.sender === 'user';
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center
        ${isUser ? 'bg-primary/20' : 'bg-secondary'}`}>
        {isUser
          ? <User size={14} className="text-primary" />
          : <Bot size={14} className="text-muted-foreground" />}
      </div>
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`rounded-2xl px-3 py-2 text-sm leading-relaxed
          ${isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-secondary text-foreground rounded-tl-sm'}`}>
          {msg.text}
        </div>
        <span className="text-[10px] text-muted-foreground px-1">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {msg.mood && <span className="ml-1 opacity-70">· {msg.mood}</span>}
        </span>
      </div>
    </div>
  );
};

const Conversations = () => {
  const [conversations, setConversations] = useState<ConvDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await chatService.getConversations();
      setConversations((data.conversations || []).map((c: any) => ({ ...c, _expanded: false, _loading: false })));
    } catch (e: any) {
      setError(e.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleExpand = async (id: string) => {
    setConversations((prev) =>
      prev.map((c) => c.id === id ? { ...c, _expanded: !c._expanded } : c)
    );

    const conv = conversations.find((c) => c.id === id);
    if (!conv || conv.messages || conv._loading) return;

    setConversations((prev) =>
      prev.map((c) => c.id === id ? { ...c, _loading: true } : c)
    );
    try {
      const detail = await chatService.getConversation(id);
      setConversations((prev) =>
        prev.map((c) => c.id === id ? { ...c, messages: detail.messages || [], _loading: false } : c)
      );
    } catch {
      setConversations((prev) =>
        prev.map((c) => c.id === id ? { ...c, _loading: false, messages: [] } : c)
      );
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-3xl font-display font-bold text-foreground">
            Conversation History
          </motion.h1>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-3">
            <Loader2 size={20} className="animate-spin" />
            <span>Loading conversations from database…</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <MBCard className="text-center py-10">
            <AlertCircle size={40} className="text-destructive mx-auto mb-3" />
            <p className="text-destructive font-medium mb-1">Failed to load conversations</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={load} variant="outline">Try Again</Button>
          </MBCard>
        )}

        {/* Empty */}
        {!loading && !error && conversations.length === 0 && (
          <MBCard className="text-center py-14">
            <MessageSquare size={48} className="text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No conversations yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Conversations will appear here once the elderly user starts chatting.
            </p>
          </MBCard>
        )}

        {/* List */}
        {!loading && !error && conversations.length > 0 && (
          <div className="space-y-3">
            {conversations.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <MBCard elevated className="overflow-hidden">
                  {/* Header row */}
                  <button
                    className="w-full text-left"
                    onClick={() => toggleExpand(c.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-xl bg-primary/10 flex-shrink-0 mt-0.5">
                        <MessageSquare className="text-primary" size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <h3 className="font-display font-semibold text-foreground truncate">
                            {c.title}
                          </h3>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {c.mood && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                                moodStyles[c.moodColor || 'gray']
                              }`}>
                                <Smile size={11} />
                                {c.mood}
                              </span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                              ${c.status === 'active'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-secondary text-muted-foreground'}`}>
                              {c.status}
                            </span>
                            {c._expanded
                              ? <ChevronDown size={16} className="text-muted-foreground" />
                              : <ChevronRight size={16} className="text-muted-foreground" />
                            }
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {new Date(c.startedAt).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Hash size={11} />
                            {c.messageCount} messages
                          </span>
                        </div>
                        {c.summary && (
                          <p className="text-xs text-muted-foreground mt-1.5 italic">
                            {c.summary}
                          </p>
                        )}
                        {c.lastMessage && !c._expanded && !c.summary && (
                          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-1">
                            {c.lastMessage}…
                          </p>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded messages */}
                  <AnimatePresence>
                    {c._expanded && (
                      <motion.div
                        key="messages"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-border">
                          {c._loading && (
                            <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                              <Loader2 size={14} className="animate-spin" />
                              <span className="text-sm">Loading messages…</span>
                            </div>
                          )}
                          {!c._loading && (!c.messages || c.messages.length === 0) && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No messages in this conversation.
                            </p>
                          )}
                          {!c._loading && c.messages && c.messages.length > 0 && (
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-1 scrollbar-thin">
                              {c.messages.map((msg, mi) => (
                                <MsgBubble key={mi} msg={msg} />
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </MBCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
};

export default Conversations;

