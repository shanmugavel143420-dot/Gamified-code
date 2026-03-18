import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Page } from '../App';
import socket from '../socket';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Trophy, User as UserIcon, Settings, Swords, Target, Cpu } from 'lucide-react';
import { generateProblem } from '../services/aiService';

interface DashboardProps {
  user: User | null;
  userData: any;
  navigate: (page: Page, data?: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, userData, navigate }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');

  const codingLanguages = [
    { id: 'javascript', name: 'JavaScript', color: 'text-yellow-400' },
    { id: 'python', name: 'Python', color: 'text-blue-400' },
    { id: 'java', name: 'Java', color: 'text-red-400' },
    { id: 'cpp', name: 'C++', color: 'text-blue-500' },
    { id: 'c', name: 'C', color: 'text-gray-400' },
    { id: 'php', name: 'PHP', color: 'text-indigo-400' },
  ];

  useEffect(() => {
    const handleRoomCreated = (id: string) => {
      setRoomCode(id);
      setShowRoomModal(true);
    };

    const handleMatchFound = (data: any) => {
      setIsSearching(false);
      navigate('match', { ...data, language: selectedLanguage });
    };

    const handleError = (msg: string) => {
      alert(msg);
      setIsSearching(false);
    };

    socket.on('roomCreated', handleRoomCreated);
    socket.on('matchFound', handleMatchFound);
    socket.on('error', handleError);

    return () => {
      socket.off('roomCreated', handleRoomCreated);
      socket.off('matchFound', handleMatchFound);
      socket.off('error', handleError);
    };
  }, [navigate, selectedLanguage]);

  const startMatchmaking = () => {
    if (!user) return;
    setIsSearching(true);
    socket.emit('joinQueue', { userId: user.uid, rank: userData?.rank || 'Bronze', language: selectedLanguage });
  };

  const startPractice = async (difficulty: string) => {
    try {
      setIsSearching(true);
      const problem = await generateProblem(difficulty, 'practice', selectedLanguage);
      navigate('match', { roomId: 'practice_' + Date.now(), isPractice: true, problem, language: selectedLanguage });
    } catch (e) {
      console.error('Practice generation failed:', e);
      alert('Failed to generate practice problem. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const startSelfVsSelf = async () => {
    try {
      setIsSearching(true);
      const problem = await generateProblem('hard', 'self', selectedLanguage);
      navigate('match', { roomId: 'self_' + Date.now(), isSelf: true, problem, language: selectedLanguage });
    } catch (e) {
      console.error('Self-match generation failed:', e);
      alert('Failed to generate self-match problem. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const createCustomRoom = () => {
    if (!user) return;
    socket.emit('createRoom', { userId: user.uid, language: selectedLanguage });
  };

  const joinCustomRoom = (id: string) => {
    if (!user) return;
    socket.emit('joinCustomRoom', { roomId: id, userId: user.uid });
  };

  return (
    <div className="max-w-6xl mx-auto p-8 pt-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Player Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
            <div className="relative mb-4">
              <img src={userData?.avatar || undefined} className="w-24 h-24 rounded-2xl border-2 border-green-500 mx-auto object-cover" alt="avatar" />
              <div className="absolute -bottom-2 -right-2 bg-green-500 text-black text-[10px] font-bold px-2 py-1 rounded-md">PRO</div>
            </div>
            <h2 className="text-xl font-bold text-center mb-1">{userData?.username}</h2>
            <p className="text-green-500 text-center font-mono text-xs mb-4 uppercase tracking-tighter">Rank: {userData?.rank || 'Bronze'} Tier III</p>
            
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                <p className="text-[10px] text-white/50 uppercase">Wins</p>
                <p className="text-lg font-bold">{userData?.stats?.wins || 0}</p>
              </div>
              <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                <p className="text-[10px] text-white/50 uppercase">Accuracy</p>
                <p className="text-lg font-bold">{userData?.stats?.accuracy || 0}%</p>
              </div>
            </div>
          </div>

          <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-3xl space-y-2">
            <button onClick={() => navigate('profile')} className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors text-left">
              <UserIcon className="w-5 h-5 text-green-500" />
              <span>Profile</span>
            </button>
            <button onClick={() => navigate('leaderboard')} className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors text-left">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span>Leaderboard</span>
            </button>
            <button onClick={() => navigate('practice')} className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors text-left">
              <Target className="w-5 h-5 text-orange-500" />
              <span>Practice Mode</span>
            </button>
            <button onClick={() => navigate('settings')} className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors text-left">
              <Settings className="w-5 h-5 text-blue-500" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Right: Game Modes */}
        <div className="md:col-span-2 space-y-8">
          {/* Language Selector */}
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
            <h3 className="text-xs font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Select Combat Language</h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {codingLanguages.map(lang => (
                <button
                  key={lang.id}
                  onClick={() => setSelectedLanguage(lang.id)}
                  className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                    selectedLanguage === lang.id 
                    ? 'bg-green-500/10 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]' 
                    : 'bg-white/5 border-white/10 hover:border-white/30'
                  }`}
                >
                  <span className={`text-xs font-bold ${lang.color}`}>{lang.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('lobby')}
              disabled={isSearching}
              className={`relative h-48 rounded-3xl overflow-hidden border-2 transition-all ${isSearching ? 'border-yellow-500 bg-yellow-500/10' : 'border-green-500 bg-green-500/10 hover:shadow-[0_0_30px_rgba(34,197,94,0.2)]'}`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-6 left-6 text-left">
                <Swords className={`w-10 h-10 mb-2 ${isSearching ? 'text-yellow-500 animate-spin' : 'text-green-500'}`} />
                <h3 className="text-2xl font-black italic uppercase">Play Ranked</h3>
                <p className="text-xs text-white/60">Compete for Rank Points</p>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('practice')}
              className="relative h-48 rounded-3xl overflow-hidden border-2 border-blue-500 bg-blue-500/10 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-6 left-6 text-left">
                <Target className="w-10 h-10 text-blue-500 mb-2" />
                <h3 className="text-2xl font-black italic uppercase">Practice</h3>
                <p className="text-xs text-white/60">Sharpen your skills</p>
              </div>
              <div className="absolute top-4 right-4 bg-blue-500 text-black text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">Training</div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startSelfVsSelf}
              className="relative h-48 rounded-3xl overflow-hidden border-2 border-purple-500 bg-purple-500/10 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-6 left-6 text-left">
                <Cpu className="w-10 h-10 text-purple-500 mb-2" />
                <h3 className="text-2xl font-black italic uppercase">Self vs Self</h3>
                <p className="text-xs text-white/60">Beat your past record</p>
              </div>
              <div className="absolute top-4 right-4 bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">Shadow Combat</div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('lobby')}
              className="relative h-48 rounded-3xl overflow-hidden border-2 border-red-500 bg-red-500/10 hover:shadow-[0_0_30px_rgba(239,68,68,0.2)]"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-6 left-6 text-left">
                <Play className="w-10 h-10 text-red-500 mb-2" />
                <h3 className="text-2xl font-black italic uppercase">Custom Room</h3>
                <p className="text-xs text-white/60">Invite your friends</p>
              </div>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Custom Room Modal */}
      <AnimatePresence>
        {showRoomModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
          >
            <div className="max-w-md w-full bg-black border border-white/10 p-8 rounded-3xl text-center">
              <h2 className="text-2xl font-black italic mb-4 uppercase">Custom Room Created</h2>
              <p className="text-white/50 mb-6">Share this code with your friend to start combat:</p>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-3xl font-mono font-bold mb-8 tracking-widest text-green-500">
                {roomCode}
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowRoomModal(false)} className="flex-1 py-3 bg-white/5 rounded-xl font-bold">CANCEL</button>
                <button onClick={() => {
                  const id = prompt('Enter Room Code:');
                  if (id) joinCustomRoom(id);
                }} className="flex-1 py-3 bg-green-500 text-black rounded-xl font-bold">JOIN ROOM</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
