import axios from 'axios';

const API = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5004/api`;
const BASE = `${API}/v1/cognitive`;

export interface DailyScore {
  date: string;
  dateLabel: string;
  overallScore: number;
  moodScore: number;
  taskScore: number;
  engagementScore: number;
  messagesCount: number;
  conversationsCount: number;
  tasksCompleted: number;
  tasksTotal: number;
}

export interface CognitiveSummary {
  totalConversations: number;
  totalMessages: number;
  totalTasks: number;
  completedTasks: number;
  averageMood: number;
  daysTracked: number;
}

export interface CognitiveScoreResponse {
  currentScore: number;
  trend: 'improving' | 'stable' | 'declining';
  dailyScores: DailyScore[];
  summary: CognitiveSummary;
}

export interface MoodTimelineEntry {
  date: string;
  mood: number;
  label: string;
  positive: number;
  neutral: number;
  negative: number;
  total: number;
}

export interface GameHistoryEntry {
  game: string;
  score: number;
  accuracy: number;
  reactionTime?: number;
  date: string;
  difficulty: string;
  timePlayed: number;
}

export const cognitiveApiService = {
  async getScore(days = 30): Promise<CognitiveScoreResponse> {
    const { data } = await axios.get(`${BASE}/score?days=${days}`);
    return data;
  },

  async getMoodTimeline(days = 30): Promise<{ moodTimeline: MoodTimelineEntry[] }> {
    const { data } = await axios.get(`${BASE}/mood-timeline?days=${days}`);
    return data;
  },

  async getGameHistory(days = 30): Promise<{ gameHistory: GameHistoryEntry[] }> {
    const { data } = await axios.get(`${BASE}/game-history?days=${days}`);
    return data;
  },

  async saveGameResult(result: {
    game: string;
    score: number;
    accuracy: number;
    reactionTime?: number;
    mistakes: number;
    completionTime: number;
  }): Promise<void> {
    await axios.post(`${BASE}/game-result`, result);
  },
};
