import MBCard from '@/components/common/Card';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { motion } from 'framer-motion';
import { MessageSquare, TrendingUp, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import type { Conversation } from '@/types/chat.types';

const mockConversations: Conversation[] = [
  {
    id: '1', userId: '1', userName: 'Margaret Johnson',
    date: '2026-02-28',
    summary: 'Margaret discussed her morning routine and mentioned feeling slightly confused about her medication schedule.',
    emotionalTrend: 'Mostly positive with brief anxiety',
    messages: [],
  },
  {
    id: '2', userId: '1', userName: 'Margaret Johnson',
    date: '2026-02-27',
    summary: 'Pleasant conversation about family memories. Margaret recalled her granddaughter\'s birthday.',
    emotionalTrend: 'Happy and nostalgic',
    messages: [],
  },
];

const Conversations = () => (
  <AuthenticatedLayout>
    <div className="max-w-5xl mx-auto px-4 py-8">
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-display font-bold text-foreground mb-8">
        Conversation History
      </motion.h1>
      <div className="space-y-4">
        {mockConversations.map((c) => (
          <MBCard key={c.id} elevated>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <MessageSquare className="text-primary" size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display font-semibold text-foreground">{c.userName}</h3>
                  <div className="flex items-center gap-3">
                    <Link to={`/caregiver/video-call/${c.userId}`}>
                      <Button size="sm" variant="ghost" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                        <Video size={16} className="mr-2" />
                        Call
                      </Button>
                    </Link>
                    <span className="text-sm text-muted-foreground">{c.date}</span>
                  </div>
                </div>
                <p className="text-muted-foreground mb-3">{c.summary}</p>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp size={14} className="text-primary" />
                  <span className="text-primary font-medium">{c.emotionalTrend}</span>
                </div>
              </div>
            </div>
          </MBCard>
        ))}
      </div>
    </div>
  </AuthenticatedLayout>
);

export default Conversations;
