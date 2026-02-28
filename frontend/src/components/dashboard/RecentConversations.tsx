import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MBCard from '@/components/common/Card';
import { MessageSquare, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import chatService from '@/services/chatService';

interface ConvSummary {
  id: string;
  title: string;
  status: string;
  messageCount: number;
  startedAt: string;
  lastMessage: string | null;
}

const RecentConversations = () => {
  const [conversations, setConversations] = useState<ConvSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await chatService.getConversations();
      setConversations((data.conversations || []).slice(0, 5));
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <MBCard>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-display font-semibold text-foreground">Recent Conversations</h3>
        <div className="flex items-center gap-2">
          <button onClick={load} className="text-muted-foreground hover:text-primary transition-colors" title="Refresh">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link to="/caregiver/conversations" className="text-xs text-primary hover:underline font-medium">
            View all
          </Link>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Loading conversations…</span>
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-6">
          <p className="text-sm text-destructive mb-2">{error}</p>
          <Button size="sm" variant="outline" onClick={load}>Retry</Button>
        </div>
      )}

      {!loading && !error && conversations.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">No conversations yet.</p>
      )}

      {!loading && !error && conversations.length > 0 && (
        <div className="space-y-2">
          {conversations.map((c) => (
            <Link key={c.id} to={`/caregiver/conversations`} className="block">
              <div className="p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer group">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare size={14} className="text-primary flex-shrink-0" />
                  <span className="font-medium text-foreground text-sm truncate flex-1">{c.title}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {new Date(c.startedAt).toLocaleDateString()}
                  </span>
                  <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground line-clamp-1 flex-1">
                    {c.lastMessage || 'No messages yet'}
                  </p>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex-shrink-0">
                    {c.messageCount} msgs
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </MBCard>
  );
};

export default RecentConversations;

