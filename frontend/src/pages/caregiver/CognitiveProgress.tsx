import { useState, useEffect, useCallback } from 'react';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import MBCard from '@/components/common/Card';
import { motion } from 'framer-motion';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import {
  Brain, TrendingUp, TrendingDown, Minus, MessageSquare, CheckCircle2,
  Gamepad2, Activity, Calendar, RefreshCw, ChevronDown,
} from 'lucide-react';
import { cognitiveApiService } from '@/services/cognitiveApiService';
import type { CognitiveScoreResponse, MoodTimelineEntry } from '@/services/cognitiveApiService';

const PERIOD_OPTIONS = [
  { label: '7 Days', value: 7 },
  { label: '14 Days', value: 14 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
];

const trendIcon = (trend: string) => {
  if (trend === 'improving') return <TrendingUp className="text-green-500" size={20} />;
  if (trend === 'declining') return <TrendingDown className="text-red-500" size={20} />;
  return <Minus className="text-yellow-500" size={20} />;
};

const trendColor = (trend: string) => {
  if (trend === 'improving') return 'text-green-500';
  if (trend === 'declining') return 'text-red-500';
  return 'text-yellow-500';
};

const scoreColor = (score: number) => {
  if (score >= 75) return 'text-green-500';
  if (score >= 50) return 'text-yellow-500';
  return 'text-red-500';
};

const scoreRingColor = (score: number) => {
  if (score >= 75) return '#22c55e';
  if (score >= 50) return '#eab308';
  return '#ef4444';
};

// ─── Game data from localStorage ───
interface LocalGameEntry {
  gameType: string;
  gameName: string;
  score: number;
  accuracy: number;
  mistakes: number;
  completionTime: number;
  reactionTime?: number;
  playedAt: string;
}

function getLocalGameHistory(): LocalGameEntry[] {
  try {
    const raw = localStorage.getItem('mindbridge_games');
    if (raw) {
      const data = JSON.parse(raw);
      return data.history || [];
    }
  } catch { /* ignore */ }
  return [];
}

// ─── Main Component ───
const CognitiveProgress = () => {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [scoreData, setScoreData] = useState<CognitiveScoreResponse | null>(null);
  const [moodData, setMoodData] = useState<MoodTimelineEntry[]>([]);
  const [localGames, setLocalGames] = useState<LocalGameEntry[]>([]);
  const [showPeriod, setShowPeriod] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [scoreRes, moodRes] = await Promise.all([
        cognitiveApiService.getScore(days),
        cognitiveApiService.getMoodTimeline(days),
      ]);
      setScoreData(scoreRes);
      setMoodData(moodRes.moodTimeline);
      setLocalGames(getLocalGameHistory());
    } catch (err) {
      console.error('Failed to load cognitive data:', err);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Compute game stats from localStorage ──
  const gameStats = (() => {
    if (localGames.length === 0) return null;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const filtered = localGames.filter(g => new Date(g.playedAt) >= cutoff);
    if (filtered.length === 0) return null;

    const avgScore = Math.round(filtered.reduce((s, g) => s + g.score, 0) / filtered.length);
    const avgAccuracy = Math.round(filtered.reduce((s, g) => s + g.accuracy, 0) / filtered.length);
    const totalGames = filtered.length;

    // By game type
    const byGame: Record<string, { scores: number[]; accuracies: number[] }> = {};
    for (const g of filtered) {
      const name = g.gameName || g.gameType;
      if (!byGame[name]) byGame[name] = { scores: [], accuracies: [] };
      byGame[name].scores.push(g.score);
      byGame[name].accuracies.push(g.accuracy);
    }

    const gameBreakdown = Object.entries(byGame).map(([name, data]) => ({
      game: name,
      avgScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
      avgAccuracy: Math.round(data.accuracies.reduce((a, b) => a + b, 0) / data.accuracies.length),
      played: data.scores.length,
    }));

    // Score over time (last 10 games)
    const recentGames = filtered.slice(0, 10).reverse().map((g, i) => ({
      game: i + 1,
      score: g.score,
      accuracy: g.accuracy,
      name: g.gameName || g.gameType,
    }));

    return { avgScore, avgAccuracy, totalGames, gameBreakdown, recentGames };
  })();

  // Radar chart data: combine all dimensions
  const radarData = scoreData ? (() => {
    const recent = scoreData.dailyScores.slice(-7);
    if (recent.length === 0) return [];
    const avg = (key: keyof typeof recent[0]) =>
      Math.round((recent as unknown as Record<string, number>[]).reduce((s, d) => s + (d[key] as number || 0), 0) / recent.length);
    return [
      { dimension: 'Mood', score: avg('moodScore'), fullMark: 100 },
      { dimension: 'Tasks', score: avg('taskScore'), fullMark: 100 },
      { dimension: 'Engagement', score: avg('engagementScore'), fullMark: 100 },
      { dimension: 'Games', score: gameStats?.avgScore ?? 50, fullMark: 100 },
      { dimension: 'Accuracy', score: gameStats?.avgAccuracy ?? 50, fullMark: 100 },
    ];
  })() : [];

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="animate-spin text-primary" size={32} />
            <span className="ml-3 text-muted-foreground">Loading cognitive data...</span>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  const score = scoreData?.currentScore ?? 0;
  const trend = scoreData?.trend ?? 'stable';
  const summary = scoreData?.summary;

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <Brain className="text-primary" size={32} />
              Cognitive Progress
            </h1>
            <p className="text-muted-foreground mt-1">
              Track mental wellness through conversations, tasks, and games
            </p>
          </motion.div>

          <div className="flex items-center gap-3">
            {/* Period selector */}
            <div className="relative">
              <button
                onClick={() => setShowPeriod(!showPeriod)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-sm font-medium hover:bg-accent transition-colors"
              >
                <Calendar size={16} />
                {PERIOD_OPTIONS.find(p => p.value === days)?.label}
                <ChevronDown size={14} />
              </button>
              {showPeriod && (
                <div className="absolute right-0 mt-2 w-36 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                  {PERIOD_OPTIONS.map(p => (
                    <button
                      key={p.value}
                      onClick={() => { setDays(p.value); setShowPeriod(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors
                        ${days === p.value ? 'bg-primary/10 text-primary font-semibold' : ''}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={fetchData} className="p-2 rounded-xl border border-border hover:bg-accent transition-colors">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* ── Row 1: Score Ring + Stats Cards ── */}
        <div className="grid md:grid-cols-4 gap-6 mb-6">
          {/* Big score ring */}
          <MBCard elevated className="md:col-span-1 flex flex-col items-center justify-center border-t-4 border-t-primary">
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke={scoreRingColor(score)}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${score * 2.64} 264`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${scoreColor(score)}`}>{score}</span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              {trendIcon(trend)}
              <span className={`text-sm font-medium capitalize ${trendColor(trend)}`}>{trend}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Overall Cognitive Score</p>
          </MBCard>

          {/* Stat cards */}
          <MBCard className="flex flex-col justify-between">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <MessageSquare size={18} />
              <span className="text-sm font-medium">Conversations</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{summary?.totalConversations ?? 0}</p>
            <p className="text-sm text-muted-foreground">{summary?.totalMessages ?? 0} messages total</p>
          </MBCard>

          <MBCard className="flex flex-col justify-between">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <CheckCircle2 size={18} />
              <span className="text-sm font-medium">Task Completion</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {summary?.totalTasks ? Math.round((summary.completedTasks / summary.totalTasks) * 100) : 0}%
            </p>
            <p className="text-sm text-muted-foreground">
              {summary?.completedTasks ?? 0} / {summary?.totalTasks ?? 0} tasks done
            </p>
          </MBCard>

          <MBCard className="flex flex-col justify-between">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Gamepad2 size={18} />
              <span className="text-sm font-medium">Games Played</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{gameStats?.totalGames ?? 0}</p>
            <p className="text-sm text-muted-foreground">
              Avg score: {gameStats?.avgScore ?? '—'} | Accuracy: {gameStats?.avgAccuracy ?? '—'}%
            </p>
          </MBCard>
        </div>

        {/* ── Row 2: Cognitive Score Trend + Radar ── */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <MBCard className="md:col-span-2">
            <h3 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity size={20} className="text-primary" />
              Cognitive Score Trend
            </h3>
            {scoreData && scoreData.dailyScores.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={scoreData.dailyScores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="dateLabel" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      color: 'hsl(var(--foreground))',
                    }}
                    formatter={(value: number, name: string) => [value, name === 'overallScore' ? 'Overall' : name]}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="overallScore" name="Overall" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="moodScore" name="Mood" stroke="#22c55e" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="taskScore" name="Tasks" stroke="#eab308" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="engagementScore" name="Engagement" stroke="#3b82f6" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data yet — chat, complete tasks, and play games to see your trends!
              </div>
            )}
          </MBCard>

          <MBCard>
            <h3 className="text-lg font-display font-semibold text-foreground mb-4">Cognitive Radar</h3>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                  <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                Interact with MindBridge to build your cognitive profile
              </div>
            )}
          </MBCard>
        </div>

        {/* ── Row 3: Mood Timeline ── */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <MBCard>
            <h3 className="text-lg font-display font-semibold text-foreground mb-4">Mood Over Time</h3>
            {moodData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={moodData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} domain={[0, 10]} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      color: 'hsl(var(--foreground))',
                    }}
                    formatter={(value: number) => [value.toFixed(1), 'Mood Score']}
                  />
                  <Area type="monotone" dataKey="mood" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No conversation mood data yet
              </div>
            )}
          </MBCard>

          <MBCard>
            <h3 className="text-lg font-display font-semibold text-foreground mb-4">Sentiment Breakdown</h3>
            {moodData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={moodData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="positive" name="Positive" fill="#22c55e" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="neutral" name="Neutral" fill="#eab308" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="negative" name="Negative" fill="#ef4444" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No sentiment data yet
              </div>
            )}
          </MBCard>
        </div>

        {/* ── Row 4: Game Performance ── */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <MBCard>
            <h3 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <Gamepad2 size={20} className="text-primary" />
              Game Score Trend
            </h3>
            {gameStats && gameStats.recentGames.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={gameStats.recentGames}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="game" stroke="hsl(var(--muted-foreground))" fontSize={11} label={{ value: 'Game #', position: 'insideBottom', offset: -5 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      color: 'hsl(var(--foreground))',
                    }}
                    labelFormatter={(label) => `Game #${label}`}
                    formatter={(value: number, name: string) => [value, name === 'score' ? 'Score' : 'Accuracy']}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="score" name="Score" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="accuracy" name="Accuracy" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                Play some games to see your progress!
              </div>
            )}
          </MBCard>

          <MBCard>
            <h3 className="text-lg font-display font-semibold text-foreground mb-4">Game Breakdown</h3>
            {gameStats && gameStats.gameBreakdown.length > 0 ? (
              <div className="space-y-4">
                {gameStats.gameBreakdown.map((g) => (
                  <div key={g.game} className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-foreground truncate">{g.game}</span>
                        <span className="text-xs text-muted-foreground">{g.played} plays</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${g.avgScore}%`,
                            background: `linear-gradient(90deg, ${g.avgScore >= 70 ? '#22c55e' : g.avgScore >= 40 ? '#eab308' : '#ef4444'}, ${g.avgScore >= 70 ? '#16a34a' : g.avgScore >= 40 ? '#ca8a04' : '#dc2626'})`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-muted-foreground">Score: {g.avgScore}</span>
                        <span className="text-xs text-muted-foreground">Accuracy: {g.avgAccuracy}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No game data available
              </div>
            )}
          </MBCard>
        </div>

        {/* ── Row 5: Recent Game History Table ── */}
        {localGames.length > 0 && (
          <MBCard className="mb-6">
            <h3 className="text-lg font-display font-semibold text-foreground mb-4">Recent Game History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Game</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Score</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Accuracy</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Mistakes</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Time</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Played</th>
                  </tr>
                </thead>
                <tbody>
                  {localGames.slice(0, 15).map((g, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                      <td className="py-2 px-3 font-medium text-foreground">{g.gameName || g.gameType}</td>
                      <td className={`py-2 px-3 text-right font-semibold ${g.score >= 70 ? 'text-green-500' : g.score >= 40 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {g.score}
                      </td>
                      <td className="py-2 px-3 text-right text-muted-foreground">{g.accuracy}%</td>
                      <td className="py-2 px-3 text-right text-muted-foreground">{g.mistakes}</td>
                      <td className="py-2 px-3 text-right text-muted-foreground">
                        {g.completionTime ? `${Math.round(g.completionTime / 1000)}s` : '—'}
                      </td>
                      <td className="py-2 px-3 text-right text-muted-foreground text-xs">
                        {new Date(g.playedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </MBCard>
        )}

        {/* ── Row 6: Daily Score Detail Table ── */}
        {scoreData && scoreData.dailyScores.length > 0 && (
          <MBCard>
            <h3 className="text-lg font-display font-semibold text-foreground mb-4">Daily Score Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Date</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Overall</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Mood</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Tasks</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Engagement</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Chats</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Messages</th>
                  </tr>
                </thead>
                <tbody>
                  {[...scoreData.dailyScores].reverse().map((d, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                      <td className="py-2 px-3 font-medium text-foreground">{d.dateLabel}</td>
                      <td className={`py-2 px-3 text-right font-bold ${scoreColor(d.overallScore)}`}>{d.overallScore}</td>
                      <td className="py-2 px-3 text-right text-muted-foreground">{d.moodScore}</td>
                      <td className="py-2 px-3 text-right text-muted-foreground">
                        {d.tasksTotal > 0 ? `${d.tasksCompleted}/${d.tasksTotal}` : '—'}
                      </td>
                      <td className="py-2 px-3 text-right text-muted-foreground">{d.engagementScore}</td>
                      <td className="py-2 px-3 text-right text-muted-foreground">{d.conversationsCount}</td>
                      <td className="py-2 px-3 text-right text-muted-foreground">{d.messagesCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </MBCard>
        )}
      </div>
    </AuthenticatedLayout>
  );
};

export default CognitiveProgress;
