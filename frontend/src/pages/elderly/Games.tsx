import { useState, useEffect, useCallback, useRef } from "react";
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { motion, AnimatePresence } from "framer-motion";
import * as Icons from "lucide-react";

// ─── Game Analytics Logger (sends to backend) ────────────────────
function submitGameResult(result: {
  game: string;
  score: number;
  accuracy: number;
  reactionTime?: number;
  mistakes: number;
  completionTime: number;
}) {
  console.log("📊 MindBridge Game Result:", result);
  // Also POST to backend for cognitive tracking
  const API = (import.meta as any).env?.VITE_API_URL || `http://${window.location.hostname}:5004/api`;
  fetch(`${API}/v1/cognitive/game-result`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gameName: result.game,
      score: result.score,
      accuracy: result.accuracy,
      reactionTime: result.reactionTime,
      mistakes: result.mistakes,
      completionTime: result.completionTime,
    }),
  }).catch(err => console.warn('Failed to save game result to backend:', err));
}

// ─── Types ────────────────────────────────────────────────────────
type GameId = "memory" | "simon" | "wordrecall" | "reaction" | "family";
type GamePhase = "menu" | "playing" | "result" | "history";

interface GameResult {
  score: number;
  accuracy: number;
  reactionTime?: number;
  mistakes: number;
  completionTime: number;
}

interface HistoryEntry {
  gameType: GameId;
  gameName: string;
  score: number;
  accuracy: number;
  mistakes: number;
  completionTime: number;
  reactionTime?: number;
  playedAt: string;
}

interface GameProgressData {
  [key: string]: unknown;
}

interface StoredData {
  activeGame: GameId | null;
  activePhase: GamePhase;
  inProgress: Partial<Record<GameId, GameProgressData>>;
  history: HistoryEntry[];
  gameKey: number;
  lastResult: (GameResult & { gameName?: string }) | null;
}

// ─── LocalStorage Helpers ─────────────────────────────────────────
const STORAGE_KEY = "mindbridge_games";

function loadGameData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StoredData;
  } catch { /* fail silently */ }
  return { activeGame: null, activePhase: "menu", inProgress: {}, history: [], gameKey: 0, lastResult: null };
}

function saveGameData(data: StoredData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* fail silently */ }
}

function saveGameProgress(gameType: GameId, progress: GameProgressData) {
  const data = loadGameData();
  data.inProgress[gameType] = progress;
  data.activeGame = gameType;
  data.activePhase = "playing";
  saveGameData(data);
}

function completeGame(gameType: GameId, gameName: string, result: GameResult) {
  const data = loadGameData();
  delete data.inProgress[gameType];
  data.history.unshift({
    gameType,
    gameName,
    score: result.score,
    accuracy: result.accuracy,
    mistakes: result.mistakes,
    completionTime: result.completionTime,
    reactionTime: result.reactionTime,
    playedAt: new Date().toISOString(),
  });
  if (data.history.length > 50) data.history = data.history.slice(0, 50);
  data.activePhase = "result";
  data.lastResult = { ...result, gameName };
  saveGameData(data);
}

function clearGameProgress(gameType: GameId) {
  const data = loadGameData();
  delete data.inProgress[gameType];
  saveGameData(data);
}

function clearActiveState() {
  const data = loadGameData();
  data.activeGame = null;
  data.activePhase = "menu";
  data.lastResult = null;
  saveGameData(data);
}

// ─── Game Metadata with Icons ─────────────────────────────────────
const GAMES: { 
  id: GameId; 
  icon: keyof typeof Icons;
  title: string; 
  description: string; 
  gradient: string;
  bgPattern: string;
  stats: { label: string; value: string }[];
}[] = [
  { 
    id: "family", 
    icon: "Users",
    title: "Family Recognition", 
    description: "Recognize and connect with your loved ones through engaging memory exercises",
    gradient: "from-amber-500 to-orange-500",
    bgPattern: "radial-gradient(circle at 20% 30%, rgba(245,158,11,0.1) 0%, transparent 50%)",
    stats: [
      { label: "Family Members", value: "6" },
      { label: "Avg. Score", value: "85%" }
    ]
  },
  { 
    id: "memory", 
    icon: "Brain",
    title: "Memory Match", 
    description: "Flip cards and match pairs to strengthen your visual memory and concentration",
    gradient: "from-blue-500 to-indigo-500",
    bgPattern: "radial-gradient(circle at 80% 70%, rgba(59,130,246,0.1) 0%, transparent 50%)",
    stats: [
      { label: "Pairs", value: "6" },
      { label: "Best Time", value: "45s" }
    ]
  },
  { 
    id: "simon", 
    icon: "Music",
    title: "Simon Recall", 
    description: "Test your auditory and visual memory by repeating increasingly complex sequences",
    gradient: "from-purple-500 to-pink-500",
    bgPattern: "radial-gradient(circle at 30% 80%, rgba(168,85,247,0.1) 0%, transparent 50%)",
    stats: [
      { label: "Levels", value: "7" },
      { label: "High Score", value: "98%" }
    ]
  },
  { 
    id: "wordrecall", 
    icon: "BookOpen",
    title: "Word Recall", 
    description: "Enhance your verbal memory by remembering and recalling words from lists",
    gradient: "from-emerald-500 to-teal-500",
    bgPattern: "radial-gradient(circle at 70% 20%, rgba(16,185,129,0.1) 0%, transparent 50%)",
    stats: [
      { label: "Words", value: "5" },
      { label: "Categories", value: "3" }
    ]
  },
  { 
    id: "reaction", 
    icon: "Zap",
    title: "Reaction Speed", 
    description: "Improve your cognitive processing speed with quick-response challenges",
    gradient: "from-red-500 to-rose-500",
    bgPattern: "radial-gradient(circle at 40% 40%, rgba(239,68,68,0.1) 0%, transparent 50%)",
    stats: [
      { label: "Rounds", value: "5" },
      { label: "Avg. Time", value: "250ms" }
    ]
  },
];

// ─── Family Mock Data ─────────────────────────────────────────────
const FAMILY_MEMBERS = [
  { name: "Margaret", relation: "Wife", img: "https://i.pravatar.cc/300?img=47" },
  { name: "James", relation: "Son", img: "https://i.pravatar.cc/300?img=11" },
  { name: "Sarah", relation: "Daughter", img: "https://i.pravatar.cc/300?img=5" },
  { name: "Michael", relation: "Grandson", img: "https://i.pravatar.cc/300?img=59" },
  { name: "Emily", relation: "Granddaughter", img: "https://i.pravatar.cc/300?img=9" },
  { name: "Robert", relation: "Brother", img: "https://i.pravatar.cc/300?img=60" },
];

// ─── Memory Match Symbols ─────────────────────────────────────────
const MATCH_SYMBOLS = ["🌸", "🌻", "🍎", "🦋", "🌈", "⭐", "🎵", "🏡"];

// ─── Word Recall Words ────────────────────────────────────────────
const WORD_SETS = [
  ["garden", "sunshine", "family", "peace", "morning"],
  ["kitchen", "blanket", "window", "gentle", "breeze"],
  ["flower", "melody", "comfort", "warmth", "smile"],
];

// ─── Helper ───────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getFeedback(score: number): { message: string; icon: keyof typeof Icons; color: string } {
  if (score >= 90) return { message: "Outstanding! Your mind is sharp today.", icon: "Star", color: "from-yellow-400 to-amber-500" };
  if (score >= 70) return { message: "Great work! Keep exercising your brain.", icon: "ThumbsUp", color: "from-green-400 to-emerald-500" };
  if (score >= 50) return { message: "Good effort! Every session helps.", icon: "TrendingUp", color: "from-blue-400 to-indigo-500" };
  return { message: "Well done for trying! Practice makes progress.", icon: "Smile", color: "from-purple-400 to-pink-500" };
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

// ─── Animated Components ──────────────────────────────────────────
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 }
};

// ═══════════════════════════════════════════════════════════════════
//  RESULT SCREEN
// ═══════════════════════════════════════════════════════════════════
function ResultScreen({
  result,
  gameName,
  onRestart,
  onBack,
}: {
  result: GameResult;
  gameName: string;
  onRestart: () => void;
  onBack: () => void;
}) {
  const feedback = getFeedback(result.score);
  const FeedbackIcon = Icons[feedback.icon];
  
  return (
    <motion.div 
      variants={scaleIn}
      initial="initial"
      animate="animate"
      className="flex flex-col items-center gap-8 py-8"
    >
      <motion.div 
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className={`w-24 h-24 rounded-full bg-gradient-to-br ${feedback.color} flex items-center justify-center shadow-glow`}
      >
        <FeedbackIcon className="w-12 h-12 text-white" />
      </motion.div>
      
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">{gameName} Complete!</h2>
        <p className="text-lg text-muted-foreground max-w-md">{feedback.message}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-4">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="glass-card-strong rounded-2xl p-5 text-center ring-2 ring-primary/30"
        >
          <Icons.Trophy className="w-6 h-6 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold text-gradient-primary">{result.score}</div>
          <div className="text-xs text-muted-foreground">Cognitive Score</div>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="glass-card-strong rounded-2xl p-5 text-center"
        >
          <Icons.Target className="w-6 h-6 mx-auto mb-2 text-mindbridge-teal" />
          <div className="text-2xl font-bold text-foreground">{result.accuracy}%</div>
          <div className="text-xs text-muted-foreground">Accuracy</div>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="glass-card-strong rounded-2xl p-5 text-center"
        >
          <Icons.XCircle className="w-6 h-6 mx-auto mb-2 text-mindbridge-rose" />
          <div className="text-2xl font-bold text-foreground">{result.mistakes}</div>
          <div className="text-xs text-muted-foreground">Mistakes</div>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="glass-card-strong rounded-2xl p-5 text-center"
        >
          <Icons.Clock className="w-6 h-6 mx-auto mb-2 text-mindbridge-warm" />
          <div className="text-2xl font-bold text-foreground">{(result.completionTime / 1000).toFixed(1)}s</div>
          <div className="text-xs text-muted-foreground">Time</div>
        </motion.div>
        
        {result.reactionTime !== undefined && (
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="col-span-2 glass-card-strong rounded-2xl p-5 text-center"
          >
            <Icons.Gauge className="w-6 h-6 mx-auto mb-2 text-mindbridge-sky" />
            <div className="text-2xl font-bold text-foreground">{result.reactionTime}ms</div>
            <div className="text-xs text-muted-foreground">Avg Reaction Time</div>
          </motion.div>
        )}
      </div>

      <div className="flex gap-4 mt-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRestart}
          className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-lg shadow-glow hover:opacity-90 transition-all flex items-center gap-2"
        >
          <Icons.RefreshCw className="w-5 h-5" />
          Play Again
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="px-8 py-4 rounded-2xl bg-secondary text-secondary-foreground font-semibold text-lg hover:bg-secondary/80 transition-all flex items-center gap-2"
        >
          <Icons.LayoutGrid className="w-5 h-5" />
          All Games
        </motion.button>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  HISTORY PANEL
// ═══════════════════════════════════════════════════════════════════
function HistoryPanel({ history, onBack }: { history: HistoryEntry[]; onBack: () => void }) {
  return (
    <motion.div 
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4"
        >
          <Icons.BarChart3 className="w-8 h-8 text-white" />
        </motion.div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Past Results</h2>
        <p className="text-muted-foreground text-lg">Your cognitive training history</p>
      </div>
      
      {history.length === 0 ? (
        <motion.div 
          variants={scaleIn}
          className="glass-card-strong rounded-3xl p-16 text-center"
        >
          <Icons.History className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-xl text-muted-foreground">No results yet. Complete a game to see your history!</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {history.map((entry, i) => {
              const gameMeta = GAMES.find((g) => g.id === entry.gameType);
              const feedback = getFeedback(entry.score);
              const GameIcon = gameMeta ? Icons[gameMeta.icon] : Icons.Gamepad2;
              
              return (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.02, x: 10 }}
                  className="glass-card-strong rounded-2xl p-5 flex items-center gap-4 cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gameMeta?.gradient} flex items-center justify-center shrink-0`}>
                    <GameIcon className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-foreground">{entry.gameName}</h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Icons.Calendar className="w-3 h-3" />
                      {formatDate(entry.playedAt)}
                    </p>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold text-gradient-primary">{entry.score}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                      <Icons.CheckCircle className="w-3 h-3 text-green-500" />
                      {entry.accuracy}% accuracy
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
      
      <div className="text-center mt-8">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="px-8 py-4 rounded-2xl bg-secondary text-secondary-foreground font-semibold text-lg hover:bg-secondary/80 transition-all inline-flex items-center gap-2"
        >
          <Icons.ArrowLeft className="w-5 h-5" />
          Back to Games
        </motion.button>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  MEMORY MATCH GAME
// ═══════════════════════════════════════════════════════════════════
function MemoryMatchGame({ onComplete, savedProgress }: { onComplete: (r: GameResult) => void; savedProgress?: GameProgressData }) {
  const [cards, setCards] = useState<{ id: number; symbol: string; flipped: boolean; matched: boolean }[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [matches, setMatches] = useState(0);
  const [startTime] = useState(Date.now());
  const [locked, setLocked] = useState(false);
  const total = 6;
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (savedProgress?.cards) {
      setCards(savedProgress.cards as typeof cards);
      setMatches((savedProgress.matches as number) ?? 0);
      setMistakes((savedProgress.mistakes as number) ?? 0);
    } else {
      const symbols = shuffle(MATCH_SYMBOLS).slice(0, total);
      const deck = shuffle([...symbols, ...symbols].map((s, i) => ({ id: i, symbol: s, flipped: false, matched: false })));
      setCards(deck);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save
  useEffect(() => {
    if (cards.length === 0) return;
    const safeCards = cards.map((c) => ({ ...c, flipped: c.matched ? true : false }));
    saveGameProgress("memory", { cards: safeCards, matches, mistakes });
  }, [cards, matches, mistakes]);

  const handleFlip = (idx: number) => {
    if (locked || cards[idx].flipped || cards[idx].matched) return;
    const next = cards.map((c, i) => (i === idx ? { ...c, flipped: true } : c));
    setCards(next);
    const sel = [...selected, idx];
    setSelected(sel);

    if (sel.length === 2) {
      setLocked(true);
      const [a, b] = sel;
      if (next[a].symbol === next[b].symbol) {
        setTimeout(() => {
          setCards((prev) => prev.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c)));
          const newMatches = matches + 1;
          setMatches(newMatches);
          if (newMatches === total) {
            const time = Date.now() - startTime;
            const accuracy = Math.round((total / (total + mistakes)) * 100);
            const score = Math.min(100, Math.round(accuracy * (30000 / Math.max(time, 5000))));
            onComplete({ score: Math.min(score, 100), accuracy, mistakes, completionTime: time });
          }
          setSelected([]);
          setLocked(false);
        }, 400);
      } else {
        setMistakes((m) => m + 1);
        setTimeout(() => {
          setCards((prev) => prev.map((c, i) => (i === a || i === b ? { ...c, flipped: false } : c)));
          setSelected([]);
          setLocked(false);
        }, 800);
      }
    }
  };

  return (
    <motion.div variants={fadeInUp} initial="initial" animate="animate" className="space-y-6">
      <div className="flex justify-between items-center text-muted-foreground">
        <div className="flex items-center gap-2">
          <Icons.CheckCircle className="w-4 h-4 text-green-500" />
          <span>Matches: {matches}/{total}</span>
        </div>
        <div className="flex items-center gap-2">
          <Icons.XCircle className="w-4 h-4 text-red-500" />
          <span>Mistakes: {mistakes}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
        {cards.map((card, i) => (
          <motion.button
            key={card.id}
            whileHover={{ scale: card.flipped || card.matched ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleFlip(i)}
            className={`aspect-square rounded-2xl text-3xl flex items-center justify-center transition-all duration-300 ${
              card.flipped || card.matched
                ? "glass-card-strong scale-95"
                : "bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-soft hover:shadow-glow"
            } ${card.matched ? "opacity-60" : ""}`}
          >
            {card.flipped || card.matched ? card.symbol : "?"}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  SIMON RECALL GAME
// ═══════════════════════════════════════════════════════════════════
const SIMON_COLORS = [
  { name: "blue", bg: "bg-blue-500", active: "bg-blue-300", icon: "Circle" },
  { name: "teal", bg: "bg-teal-500", active: "bg-teal-300", icon: "Square" },
  { name: "warm", bg: "bg-orange-500", active: "bg-orange-300", icon: "Triangle" },
  { name: "sky", bg: "bg-sky-500", active: "bg-sky-300", icon: "Diamond" },
];

function SimonRecallGame({ onComplete, savedProgress }: { onComplete: (r: GameResult) => void; savedProgress?: GameProgressData }) {
  const [sequence, setSequence] = useState<number[]>((savedProgress?.sequence as number[]) ?? []);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [activeColor, setActiveColor] = useState<number | null>(null);
  const [phase, setPhase] = useState<"showing" | "input" | "adding">("adding");
  const [round, setRound] = useState((savedProgress?.round as number) ?? 0);
  const [mistakes, setMistakes] = useState((savedProgress?.mistakes as number) ?? 0);
  const [startTime] = useState(Date.now());
  const maxRounds = 7;

  // Auto-save
  useEffect(() => {
    if (round > 0) {
      saveGameProgress("simon", { round, mistakes, sequence });
    }
  }, [round, mistakes, sequence]);

  const playSequence = useCallback((seq: number[]) => {
    setPhase("showing");
    seq.forEach((color, i) => {
      setTimeout(() => setActiveColor(color), i * 700);
      setTimeout(() => setActiveColor(null), i * 700 + 400);
    });
    setTimeout(() => {
      setPhase("input");
      setPlayerInput([]);
    }, seq.length * 700 + 200);
  }, []);

  useEffect(() => {
    if (phase === "adding") {
      const next = [...sequence, Math.floor(Math.random() * 4)];
      setSequence(next);
      setRound((r) => r + 1);
      setTimeout(() => playSequence(next), 600);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePress = (idx: number) => {
    if (phase !== "input") return;
    setActiveColor(idx);
    setTimeout(() => setActiveColor(null), 200);
    const next = [...playerInput, idx];
    setPlayerInput(next);
    const pos = next.length - 1;
    if (next[pos] !== sequence[pos]) {
      setMistakes((m) => m + 1);
      const time = Date.now() - startTime;
      const accuracy = Math.round(((round - 1) / round) * 100);
      const score = Math.min(100, Math.round((round / maxRounds) * 90));
      onComplete({ score, accuracy, mistakes: mistakes + 1, completionTime: time });
      return;
    }
    if (next.length === sequence.length) {
      if (round >= maxRounds) {
        const time = Date.now() - startTime;
        onComplete({ score: 100, accuracy: 100, mistakes, completionTime: time });
      } else {
        setTimeout(() => setPhase("adding"), 500);
      }
    }
  };

  return (
    <motion.div variants={fadeInUp} initial="initial" animate="animate" className="space-y-6">
      <div className="text-center">
        <p className="text-lg text-muted-foreground">
          {phase === "showing" ? (
            <span className="flex items-center justify-center gap-2">
              <Icons.Eye className="w-5 h-5" />
              Watch the sequence...
            </span>
          ) : phase === "input" ? (
            <span className="flex items-center justify-center gap-2">
              <Icons.Hand className="w-5 h-5" />
              Your turn! Repeat it.
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Icons.Loader className="w-5 h-5 animate-spin" />
              Get ready...
            </span>
          )}
        </p>
        <p className="text-sm text-muted-foreground mt-2">Round {round} of {maxRounds}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
        {SIMON_COLORS.map((c, i) => {
          const IconComponent = Icons[c.icon as keyof typeof Icons];
          return (
            <motion.button
              key={c.name}
              whileHover={{ scale: phase === "input" ? 1.1 : 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePress(i)}
              disabled={phase !== "input"}
              className={`aspect-square rounded-3xl transition-all duration-200 flex items-center justify-center ${
                activeColor === i 
                  ? `${c.active} scale-110 shadow-glow` 
                  : `${c.bg} opacity-70 hover:opacity-100`
              } ${phase !== "input" ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              <IconComponent className="w-8 h-8 text-white opacity-50" />
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  WORD RECALL GAME
// ═══════════════════════════════════════════════════════════════════
function WordRecallGame({ onComplete, savedProgress }: { onComplete: (r: GameResult) => void; savedProgress?: GameProgressData }) {
  const [words] = useState<string[]>(() => (savedProgress?.words as string[]) ?? WORD_SETS[Math.floor(Math.random() * WORD_SETS.length)]);
  const [phase, setPhase] = useState<"memorize" | "recall">((savedProgress?.phase as "memorize" | "recall") ?? "memorize");
  const [timer, setTimer] = useState((savedProgress?.timer as number) ?? 8);
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState<string[]>((savedProgress?.submitted as string[]) ?? []);
  const [startTime] = useState(Date.now());

  // Auto-save
  useEffect(() => {
    saveGameProgress("wordrecall", { words, phase, timer, submitted });
  }, [words, phase, timer, submitted]);

  useEffect(() => {
    if (phase !== "memorize") return;
    if (timer <= 0) {
      setPhase("recall");
      return;
    }
    const t = setTimeout(() => setTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, phase]);

  const handleSubmitWord = () => {
    const word = input.trim().toLowerCase();
    if (word && !submitted.includes(word)) {
      setSubmitted([...submitted, word]);
    }
    setInput("");
  };

  const handleFinish = () => {
    const correct = submitted.filter((w) => words.includes(w)).length;
    const accuracy = Math.round((correct / words.length) * 100);
    const score = Math.min(100, accuracy);
    const time = Date.now() - startTime;
    onComplete({ score, accuracy, mistakes: words.length - correct, completionTime: time });
  };

  if (phase === "memorize") {
    return (
      <motion.div variants={fadeInUp} initial="initial" animate="animate" className="text-center space-y-6">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Icons.Clock className="w-5 h-5" />
          <p className="text-lg">Memorize these words ({timer}s remaining)</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-3">
          {words.map((w, i) => (
            <motion.span
              key={w}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="px-6 py-4 glass-card-strong rounded-2xl text-xl font-semibold text-foreground shadow-soft"
            >
              {w}
            </motion.span>
          ))}
        </div>
        
        <div className="w-full max-w-xs mx-auto bg-secondary rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: `${(timer / 8) * 100}%` }}
            transition={{ duration: 1, ease: "linear" }}
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
          />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={fadeInUp} initial="initial" animate="animate" className="text-center space-y-6">
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <Icons.Pencil className="w-5 h-5" />
        <p className="text-lg">Type the words you remember</p>
      </div>
      
      <div className="flex gap-2 max-w-sm mx-auto">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmitWord()}
          placeholder="Type a word..."
          className="flex-1 px-4 py-3 rounded-2xl bg-secondary text-foreground text-lg border border-border focus:ring-2 focus:ring-primary/40 outline-none"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmitWord}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold"
        >
          <Icons.Plus className="w-5 h-5" />
        </motion.button>
      </div>
      
      <div className="flex flex-wrap justify-center gap-2">
        <AnimatePresence>
          {submitted.map((w, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-xl text-base flex items-center gap-1"
            >
              <Icons.Check className="w-3 h-3 text-green-500" />
              {w}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleFinish}
        className="px-8 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold text-lg shadow-soft hover:opacity-90 transition-all inline-flex items-center gap-2"
      >
        <Icons.CheckCircle className="w-5 h-5" />
        Done — Check Results
      </motion.button>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  REACTION SPEED GAME
// ═══════════════════════════════════════════════════════════════════
function ReactionSpeedGame({ onComplete, savedProgress }: { onComplete: (r: GameResult) => void; savedProgress?: GameProgressData }) {
  const [phase, setPhase] = useState<"waiting" | "ready" | "go" | "done">("waiting");
  const [times, setTimes] = useState<number[]>((savedProgress?.times as number[]) ?? []);
  const [goTime, setGoTime] = useState(0);
  const [round, setRound] = useState((savedProgress?.round as number) ?? 0);
  const [tooEarly, setTooEarly] = useState((savedProgress?.tooEarly as number) ?? 0);
  const [startTime] = useState(Date.now());
  const totalRounds = 5;

  // Auto-save
  useEffect(() => {
    saveGameProgress("reaction", { round, times, tooEarly });
  }, [round, times, tooEarly]);

  const startRound = useCallback(() => {
    setPhase("ready");
    const delay = 1500 + Math.random() * 3000;
    const timeout = setTimeout(() => {
      setGoTime(Date.now());
      setPhase("go");
    }, delay);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (phase === "waiting") {
      const t = setTimeout(() => startRound(), 1000);
      return () => clearTimeout(t);
    }
  }, [phase, startRound]);

  const handleTap = () => {
    if (phase === "ready") {
      setTooEarly((e) => e + 1);
      setPhase("waiting");
      return;
    }
    if (phase === "go") {
      const rt = Date.now() - goTime;
      const newTimes = [...times, rt];
      setTimes(newTimes);
      const r = round + 1;
      setRound(r);
      if (r >= totalRounds) {
        setPhase("done");
        const avg = Math.round(newTimes.reduce((a, b) => a + b, 0) / newTimes.length);
        const score = Math.min(100, Math.max(0, Math.round(100 - (avg - 200) / 5)));
        const accuracy = Math.round(((totalRounds - tooEarly) / totalRounds) * 100);
        onComplete({ score, accuracy, reactionTime: avg, mistakes: tooEarly, completionTime: Date.now() - startTime });
      } else {
        setPhase("waiting");
      }
    }
  };

  const bgClass =
    phase === "go"
      ? "bg-gradient-to-br from-green-500 to-emerald-500 cursor-pointer"
      : phase === "ready"
        ? "bg-gradient-to-br from-orange-500 to-amber-500 cursor-pointer"
        : "bg-gradient-to-br from-gray-500 to-gray-600";

  return (
    <motion.div variants={fadeInUp} initial="initial" animate="animate" className="text-center space-y-6">
      <div className="flex items-center justify-center gap-4 text-muted-foreground">
        <span className="flex items-center gap-1">
          <Icons.Target className="w-4 h-4" />
          Round {Math.min(round + 1, totalRounds)}/{totalRounds}
        </span>
        {tooEarly > 0 && (
          <span className="flex items-center gap-1 text-mindbridge-rose">
            <Icons.AlertCircle className="w-4 h-4" />
            Too early: {tooEarly}
          </span>
        )}
      </div>

      <motion.button
        onClick={handleTap}
        disabled={phase === "waiting" || phase === "done"}
        whileHover={{ scale: phase === "go" || phase === "ready" ? 1.05 : 1 }}
        whileTap={{ scale: phase === "go" ? 0.95 : 1 }}
        className={`w-64 h-64 mx-auto rounded-3xl flex flex-col items-center justify-center text-2xl font-bold text-white transition-all duration-300 shadow-soft ${bgClass}`}
      >
        {phase === "waiting" && (
          <>
            <Icons.Hourglass className="w-12 h-12 mb-4 animate-pulse" />
            <span>Get ready...</span>
          </>
        )}
        {phase === "ready" && (
          <>
            <Icons.AlertTriangle className="w-12 h-12 mb-4 animate-bounce" />
            <span>Wait for green...</span>
          </>
        )}
        {phase === "go" && (
          <>
            <Icons.Zap className="w-12 h-12 mb-4" />
            <span>TAP NOW!</span>
          </>
        )}
        {phase === "done" && (
          <>
            <Icons.CheckCircle className="w-12 h-12 mb-4" />
            <span>Done!</span>
          </>
        )}
      </motion.button>

      {times.length > 0 && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-muted-foreground"
        >
          Last reaction: <span className="font-bold text-foreground">{times[times.length - 1]}ms</span>
        </motion.p>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  FAMILY RECOGNITION GAME
// ═══════════════════════════════════════════════════════════════════
function FamilyRecognitionGame({ onComplete, savedProgress }: { onComplete: (r: GameResult) => void; savedProgress?: GameProgressData }) {
  const [questions, setQuestions] = useState<
    { member: (typeof FAMILY_MEMBERS)[0]; options: string[] }[]
  >([]);
  const [current, setCurrent] = useState((savedProgress?.current as number) ?? 0);
  const [correct, setCorrect] = useState((savedProgress?.correct as number) ?? 0);
  const [mistakes, setMistakes] = useState((savedProgress?.mistakes as number) ?? 0);
  const [answered, setAnswered] = useState<string | null>(null);
  const [startTime] = useState(Date.now());
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (savedProgress?.questions) {
      setQuestions(savedProgress.questions as typeof questions);
    } else {
      const shuffled = shuffle(FAMILY_MEMBERS);
      const qs = shuffled.map((member) => {
        const others = shuffle(FAMILY_MEMBERS.filter((m) => m.name !== member.name))
          .slice(0, 3)
          .map((m) => m.name);
        const options = shuffle([member.name, ...others]);
        return { member, options };
      });
      setQuestions(qs);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save
  useEffect(() => {
    if (questions.length > 0) {
      saveGameProgress("family", { questions, current, correct, mistakes });
    }
  }, [questions, current, correct, mistakes]);

  const handleAnswer = (name: string) => {
    if (answered) return;
    setAnswered(name);
    const isCorrect = name === questions[current].member.name;
    if (isCorrect) setCorrect((c) => c + 1);
    else setMistakes((m) => m + 1);

    setTimeout(() => {
      setAnswered(null);
      const next = current + 1;
      if (next >= questions.length) {
        const time = Date.now() - startTime;
        const finalCorrect = isCorrect ? correct + 1 : correct;
        const accuracy = Math.round((finalCorrect / questions.length) * 100);
        onComplete({ score: accuracy, accuracy, mistakes: isCorrect ? mistakes : mistakes + 1, completionTime: time });
      } else {
        setCurrent(next);
      }
    }, 1200);
  };

  if (questions.length === 0) return null;
  const q = questions[current];

  return (
    <motion.div variants={fadeInUp} initial="initial" animate="animate" className="space-y-6">
      <div className="flex justify-between items-center text-muted-foreground">
        <span className="flex items-center gap-1">
          <Icons.List className="w-4 h-4" />
          {current + 1} of {questions.length}
        </span>
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <Icons.CheckCircle className="w-4 h-4 text-green-500" />
            {correct}
          </span>
          <span className="flex items-center gap-1">
            <Icons.XCircle className="w-4 h-4 text-red-500" />
            {mistakes}
          </span>
        </div>
      </div>

      <div className="w-full max-w-xs mx-auto bg-secondary rounded-full h-1.5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${((current + 1) / questions.length) * 100}%` }}
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
        />
      </div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        key={current}
        className="relative w-48 h-48 mx-auto rounded-2xl overflow-hidden ring-4 ring-primary/20 shadow-glow"
      >
        <img
          src={q.member.img}
          alt="Family member"
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <p className="text-white text-sm">{q.member.relation}</p>
        </div>
      </motion.div>

      <h3 className="text-2xl font-bold text-foreground text-center">Who is this?</h3>

      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
        {q.options.map((opt, index) => {
          let bgClass = "glass-card-strong hover:shadow-glow hover:scale-105";
          let icon = null;
          
          if (answered) {
            if (opt === q.member.name) {
              bgClass = "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-glow";
              icon = <Icons.Check className="w-5 h-5" />;
            } else if (opt === answered) {
              bgClass = "bg-gradient-to-r from-red-500 to-rose-500 text-white";
              icon = <Icons.X className="w-5 h-5" />;
            } else {
              bgClass = "glass-card opacity-50";
            }
          }

          return (
            <motion.button
              key={opt}
              whileHover={{ scale: answered ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAnswer(opt)}
              className={`px-4 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${bgClass}`}
            >
              {icon}
              {opt}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  MAIN GAMES PAGE
// ═══════════════════════════════════════════════════════════════════
const GamesPage = () => {
  const [loaded, setLoaded] = useState(false);
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [result, setResult] = useState<GameResult | null>(null);
  const [gameKey, setGameKey] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [restored, setRestored] = useState(false);
  const [savedProgressMap, setSavedProgressMap] = useState<Partial<Record<GameId, GameProgressData>>>({});

  // Load from localStorage on mount
  useEffect(() => {
    const data = loadGameData();
    setHistory(data.history);
    setSavedProgressMap(data.inProgress);
    if (data.activeGame && data.activePhase === "playing" && data.inProgress[data.activeGame]) {
      setActiveGame(data.activeGame);
      setPhase("playing");
      setGameKey(data.gameKey);
      setRestored(true);
      setTimeout(() => setRestored(false), 3000);
    } else if (data.activePhase === "result" && data.lastResult) {
      setActiveGame(data.activeGame);
      setResult(data.lastResult);
      setPhase("result");
    }
    setLoaded(true);
  }, []);

  // Save active state changes
  useEffect(() => {
    if (!loaded) return;
    const data = loadGameData();
    data.activeGame = activeGame;
    data.activePhase = phase;
    data.gameKey = gameKey;
    saveGameData(data);
  }, [activeGame, phase, gameKey, loaded]);

  const handleComplete = (gameName: string) => (r: GameResult) => {
    submitGameResult({ game: gameName, ...r });
    if (activeGame) {
      completeGame(activeGame, gameName, r);
      clearGameProgress(activeGame);
      setHistory(loadGameData().history);
      setSavedProgressMap((prev) => { const n = { ...prev }; delete n[activeGame]; return n; });
    }
    setResult(r);
    setPhase("result");
  };

  const handleRestart = () => {
    if (activeGame) clearGameProgress(activeGame);
    setSavedProgressMap((prev) => { if (!activeGame) return prev; const n = { ...prev }; delete n[activeGame]; return n; });
    setResult(null);
    setPhase("playing");
    setGameKey((k) => k + 1);
  };

  const handleBack = () => {
    if (activeGame) clearGameProgress(activeGame);
    clearActiveState();
    setSavedProgressMap((prev) => { if (!activeGame) return prev; const n = { ...prev }; delete n[activeGame]; return n; });
    setActiveGame(null);
    setResult(null);
    setPhase("menu");
  };

  const startGame = (id: GameId) => {
    setActiveGame(id);
    setPhase("playing");
    // If there's saved progress, don't increment key to reuse it
    if (!savedProgressMap[id]) {
      setGameKey((k) => k + 1);
    }
  };

  const activeGameMeta = GAMES.find((g) => g.id === activeGame);

  if (!loaded) return null;

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Restored toast */}
        <AnimatePresence>
          {restored && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-[100]"
            >
              <div className="glass-card-strong rounded-2xl px-6 py-4 shadow-glow flex items-center gap-3">
                <Icons.RefreshCw className="w-5 h-5 text-primary animate-spin" />
                <span className="text-foreground font-medium">Welcome back! Continuing where you left off.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <header className="glass-card-strong border-b border-border/50 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
            {(activeGame || phase === "history") && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBack}
                className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground"
              >
                <Icons.ArrowLeft className="w-5 h-5" />
              </motion.button>
            )}
            
            <div className="flex items-center gap-3 flex-1">
              <motion.div
                whileHover={{ rotate: 10 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold"
              >
                <Icons.Brain className="w-5 h-5" />
              </motion.div>
              <div>
                <h1 className="text-lg font-bold text-foreground leading-tight">MindBridge</h1>
                <p className="text-xs text-muted-foreground leading-none">Cognitive Assessment</p>
              </div>
            </div>

            {phase === "menu" && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPhase("history")}
                className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-all flex items-center gap-2"
              >
                <Icons.BarChart3 className="w-4 h-4" />
                Past Results
              </motion.button>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          <AnimatePresence mode="wait">
            {phase === "menu" && (
              <motion.div
                key="menu"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-8"
              >
                <div className="text-center mb-12">
                  <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-bold text-foreground mb-3"
                  >
                    Your Daily Brain Training
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-muted-foreground text-lg"
                  >
                    Choose an exercise to strengthen your mind
                  </motion.p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {GAMES.map((game, i) => {
                    const hasProgress = !!savedProgressMap[game.id];
                    const GameIcon = Icons[game.icon];
                    
                    return (
                      <motion.button
                        key={game.id}
                        variants={fadeInUp}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => startGame(game.id)}
                        className="relative group"
                      >
                        <div 
                          className="absolute inset-0 rounded-3xl bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
                          style={{ background: `linear-gradient(to right, ${game.gradient.split(' ')[1]}, ${game.gradient.split(' ')[3]})` }}
                        />
                        
                        <div className="relative glass-card-strong rounded-3xl p-6 overflow-hidden">
                          {/* Background Pattern */}
                          <div 
                            className="absolute inset-0 opacity-10"
                            style={{ backgroundImage: game.bgPattern }}
                          />
                          
                          <div className="relative z-10">
                            <div className="flex items-start justify-between mb-4">
                              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.gradient} flex items-center justify-center shadow-lg`}>
                                <GameIcon className="w-7 h-7 text-white" />
                              </div>
                              
                              {hasProgress && (
                                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center gap-1">
                                  <Icons.Play className="w-3 h-3" />
                                  In Progress
                                </span>
                              )}
                            </div>
                            
                            <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                              {game.title}
                            </h3>
                            
                            <p className="text-muted-foreground text-sm mb-4">
                              {game.description}
                            </p>
                            
                            <div className="flex gap-3 pt-2 border-t border-border/50">
                              {game.stats.map((stat, idx) => (
                                <div key={idx} className="flex-1">
                                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                                  <div className="text-sm font-semibold text-foreground">{stat.value}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Hover Indicator */}
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {phase === "history" && (
              <motion.div
                key="history"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <HistoryPanel history={history} onBack={() => setPhase("menu")} />
              </motion.div>
            )}

            {phase === "playing" && activeGame && (
              <motion.div
                key={`playing-${activeGame}`}
                variants={scaleIn}
                initial="initial"
                animate="animate"
                exit="exit"
                className="max-w-3xl mx-auto"
              >
                <div className="glass-card-strong rounded-3xl p-8 shadow-soft">
                  <div className="flex items-center gap-3 mb-8">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${activeGameMeta?.gradient} flex items-center justify-center`}>
                      {activeGameMeta && (() => {
                        const Icon = Icons[activeGameMeta.icon];
                        return <Icon className="w-6 h-6 text-white" />;
                      })()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">
                        {activeGameMeta?.title}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {activeGameMeta?.description}
                      </p>
                    </div>
                  </div>
                  
                  {activeGame === "memory" && <MemoryMatchGame key={gameKey} onComplete={handleComplete("Memory Match")} savedProgress={savedProgressMap.memory} />}
                  {activeGame === "simon" && <SimonRecallGame key={gameKey} onComplete={handleComplete("Simon Recall")} savedProgress={savedProgressMap.simon} />}
                  {activeGame === "wordrecall" && <WordRecallGame key={gameKey} onComplete={handleComplete("Word Recall")} savedProgress={savedProgressMap.wordrecall} />}
                  {activeGame === "reaction" && <ReactionSpeedGame key={gameKey} onComplete={handleComplete("Reaction Speed")} savedProgress={savedProgressMap.reaction} />}
                  {activeGame === "family" && <FamilyRecognitionGame key={gameKey} onComplete={handleComplete("Family Recognition")} savedProgress={savedProgressMap.family} />}
                </div>
              </motion.div>
            )}

            {phase === "result" && result && activeGameMeta && (
              <motion.div
                key="result"
                variants={scaleIn}
                initial="initial"
                animate="animate"
                exit="exit"
                className="max-w-3xl mx-auto"
              >
                <div className="glass-card-strong rounded-3xl p-8 shadow-soft">
                  <ResultScreen
                    result={result}
                    gameName={activeGameMeta.title}
                    onRestart={handleRestart}
                    onBack={handleBack}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </AuthenticatedLayout>
  );
};

export default GamesPage;