import React, { useState } from 'react';
import { Page } from '../App';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trophy, Medal, ShieldCheck, Zap, Clock, Swords, Target, Play } from 'lucide-react';

interface LeaderboardProps {
  navigate: (page: Page) => void;
  goBack: () => void;
}

type TimeRange = 'daily' | 'weekly' | 'monthly' | 'all-time';
type GameMode = 'ranked' | 'practice' | 'custom';

const Leaderboard: React.FC<LeaderboardProps> = ({ navigate, goBack }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('all-time');
  const [gameMode, setGameMode] = useState<GameMode>('ranked');

  const topPlayers = [
    { rank: 1, name: 'LogicMaster', xp: 15400, winRate: '92%', verified: true },
    { rank: 2, name: 'CodeNinja', xp: 14200, winRate: '88%', verified: true },
    { rank: 3, name: 'ByteBurner', xp: 13800, winRate: '85%', verified: true },
    { rank: 4, name: 'AlgoWizard', xp: 12100, winRate: '82%', verified: false },
    { rank: 5, name: 'DevOpsKing', xp: 11500, winRate: '80%', verified: false },
    { rank: 6, name: 'StackOverlord', xp: 10900, winRate: '78%', verified: false },
    { rank: 7, name: 'NullPointer', xp: 10200, winRate: '75%', verified: false },
    { rank: 8, name: 'GitGud', xp: 9800, winRate: '72%', verified: false },
    { rank: 9, name: 'Pythonista', xp: 9400, winRate: '70%', verified: false },
    { rank: 10, name: 'JavaJedi', xp: 8900, winRate: '68%', verified: false },
  ];

  const timeRanges: { id: TimeRange; label: string }[] = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'all-time', label: 'All Time' },
  ];

  const gameModes: { id: GameMode; label: string; icon: React.ReactNode }[] = [
    { id: 'ranked', label: 'Ranked', icon: <Swords className="w-3 h-3" /> },
    { id: 'practice', label: 'Practice', icon: <Target className="w-3 h-3" /> },
    { id: 'custom', label: 'Custom', icon: <Play className="w-3 h-3" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto p-8 pt-24 pb-20">
      <button onClick={goBack} className="flex items-center gap-2 text-white/50 hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-widest">Back</span>
      </button>

      <div className="text-center mb-12">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Global Hall of Fame</h1>
        <p className="text-green-500 font-mono text-sm uppercase tracking-widest">The Top 10 Combatants Worldwide</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        {/* Game Mode Filter */}
        <div className="flex-1">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
            <Swords className="w-3 h-3" /> Combat Mode
          </p>
          <div className="flex gap-2 bg-black/40 p-1 rounded-2xl border border-white/5">
            {gameModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setGameMode(mode.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-[10px] font-bold uppercase transition-all ${
                  gameMode === mode.id
                    ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {mode.icon}
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time Range Filter */}
        <div className="flex-1">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
            <Clock className="w-3 h-3" /> Time Horizon
          </p>
          <div className="flex gap-2 bg-black/40 p-1 rounded-2xl border border-white/5">
            {timeRanges.map((range) => (
              <button
                key={range.id}
                onClick={() => setTimeRange(range.id)}
                className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-bold uppercase transition-all ${
                  timeRange === range.id
                    ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden">
        <div className="grid grid-cols-12 p-6 border-b border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/30">
          <div className="col-span-1">Rank</div>
          <div className="col-span-6">Player</div>
          <div className="col-span-3">XP Points</div>
          <div className="col-span-2 text-right">Win Rate</div>
        </div>

        <div className="divide-y divide-white/5">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${timeRange}-${gameMode}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {topPlayers.map((player) => (
                <div key={player.rank} className={`grid grid-cols-12 p-6 items-center transition-colors hover:bg-white/5 ${player.rank <= 3 ? 'bg-white/5' : ''}`}>
                  <div className="col-span-1 font-black italic text-xl">
                    {player.rank === 1 && <Medal className="w-6 h-6 text-yellow-500" />}
                    {player.rank === 2 && <Medal className="w-6 h-6 text-gray-400" />}
                    {player.rank === 3 && <Medal className="w-6 h-6 text-amber-600" />}
                    {player.rank > 3 && <span className="text-white/20">#{player.rank}</span>}
                  </div>
                  <div className="col-span-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 overflow-hidden">
                      <img src={`https://picsum.photos/seed/${player.name}/40/40`} alt="" className="w-full h-full object-cover opacity-50" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold uppercase tracking-widest ${player.rank <= 3 ? 'text-lg' : 'text-sm'}`}>{player.name}</span>
                      {player.verified && <ShieldCheck className="w-4 h-4 text-blue-400" />}
                    </div>
                  </div>
                  <div className="col-span-3">
                    <div className="flex items-center gap-2 text-green-500 font-mono">
                      <Zap className="w-3 h-3" />
                      <span className="font-bold">{player.xp.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="col-span-2 text-right font-mono font-bold text-white/50">
                    {player.winRate}
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
