import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User } from 'firebase/auth';
import { Page } from '../App';
import socket from '../socket';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare, Smile, Zap, Trophy, XCircle, Cpu, ArrowLeft, Target, Bot, Mic, MicOff, Clock, Shield, Users, ChevronRight, Code2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Howl } from 'howler';
import axios from 'axios';
import VoiceChat from '../components/VoiceChat';

interface MatchProps {
  user: User | null;
  matchData: any;
  navigate: (page: Page) => void;
  goBack: () => void;
}

const PROBLEMS = [
  {
    title: "Maximum Subarray Sum",
    description: "Write a function that calculates the maximum sum of a contiguous subarray within a one-dimensional array of numbers.",
    starterCode: "function maxSubArray(nums) {\n  // Your code here\n}",
    language: "javascript"
  },
  {
    title: "Longest Palindromic Substring",
    description: "Given a string s, return the longest palindromic substring in s.",
    starterCode: "function longestPalindrome(s) {\n  // Your code here\n}",
    language: "javascript"
  },
  {
    title: "Merge K Sorted Lists",
    description: "You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.",
    starterCode: "function mergeKLists(lists) {\n  // Your code here\n}",
    language: "javascript"
  }
];

const Match: React.FC<MatchProps> = ({ user, matchData, navigate, goBack }) => {
  const [room, setRoom] = useState(matchData);
  const [currentProblem, setCurrentProblem] = useState(PROBLEMS[0]);
  const [code, setCode] = useState(currentProblem.starterCode);
  const [opponentsData, setOpponentsData] = useState<any>({});
  const [messages, setMessages] = useState<{ username: string; message: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [timeLeft, setTimeLeft] = useState(matchData.timePerRound || 300);
  const [isFinished, setIsFinished] = useState(false);
  const [winner, setWinner] = useState<any>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [roundTransition, setRoundTransition] = useState(false);
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');

  const winSound = useRef(new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'] }));
  const roundSound = useRef(new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3'] }));
  const chatSound = useRef(new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2015/2015-preview.mp3'] }));

  useEffect(() => {
    socket.on('opponentCode', ({ userId, code }) => {
      setOpponentsData(prev => ({ ...prev, [userId]: { ...prev[userId], code } }));
    });

    socket.on('newMessage', (msg) => {
      setMessages(prev => [...prev, msg]);
      chatSound.current.play();
    });

    socket.on('opponentReaction', ({ userId, emoji }) => {
      setOpponentsData(prev => ({ ...prev, [userId]: { ...prev[userId], reaction: emoji } }));
      setTimeout(() => {
        setOpponentsData(prev => ({ ...prev, [userId]: { ...prev[userId], reaction: null } }));
      }, 2000);
    });

    socket.on('roomUpdate', (updatedRoom) => {
      setRoom(updatedRoom);
      if (updatedRoom.round !== room.round) {
        handleRoundTransition(updatedRoom.round);
      }
    });

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          handleRoundEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // AI Hints Simulation
    const hints = [
      "Excellent Performance",
      "Good Speed",
      "Best Strike 🔥",
      "Only 2 minutes left ⏳",
      "Improve accuracy",
      "Try Kadane's Algorithm",
      "Think about edge cases"
    ];
    const hintInterval = setInterval(() => {
      setAiHint(hints[Math.floor(Math.random() * hints.length)]);
      setTimeout(() => setAiHint(null), 5000);
    }, 45000);

    return () => {
      clearInterval(timer);
      clearInterval(hintInterval);
      socket.off('opponentCode');
      socket.off('newMessage');
      socket.off('opponentReaction');
      socket.off('roomUpdate');
    };
  }, [room.round]);

  const handleRoundTransition = (newRound: number) => {
    setRoundTransition(true);
    roundSound.current.play();
    setTimeout(() => {
      setRoundTransition(false);
      setCurrentProblem(PROBLEMS[(newRound - 1) % PROBLEMS.length]);
      setCode(PROBLEMS[(newRound - 1) % PROBLEMS.length].starterCode);
      setTimeLeft(room.timePerRound || 300);
    }, 3000);
  };

  const handleRoundEnd = () => {
    if (room.round < room.totalRounds) {
      // In a real app, the server would emit roomUpdate
      // For demo, we simulate it if it's a custom room host
      if (room.hostId === user?.uid) {
        socket.emit('nextRound', { roomId: room.id });
      }
    } else {
      submitCode();
    }
  };

  const handleCodeChange = (newCode: string | undefined) => {
    if (!newCode) return;
    setCode(newCode);
    socket.emit('codeUpdate', { roomId: room.id, code: newCode, userId: user?.uid });
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    socket.emit('chatMessage', { roomId: room.id, message: chatInput, username: user?.displayName });
    setChatInput('');
  };

  const sendReaction = (emoji: string) => {
    socket.emit('reaction', { roomId: room.id, emoji, userId: user?.uid });
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput(null);
    try {
      const response = await axios.post('/api/execute', {
        source_code: code,
        language_id: 63, // Defaulting to JS for demo
        stdin: ''
      });
      const result = response.data;
      setOutput(result.stdout || result.stderr || result.compile_output || 'No output');
    } catch (e: any) {
      setOutput('Error: ' + e.message);
    } finally {
      setIsRunning(false);
    }
  };

  const submitCode = async () => {
    setIsFinished(true);
    setWinner({ team: 1, mvp: user?.displayName });
    winSound.current.play();
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22c55e', '#ffffff', '#16a34a']
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen flex flex-col bg-black text-white font-sans overflow-hidden">
      {/* Voice Chat Component */}
      <VoiceChat roomId={room.id} userId={user?.uid || ''} isMicOn={isMicOn} peers={[]} />

      {/* HUD Header */}
      <div className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-zinc-900/50 backdrop-blur-xl z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <button onClick={goBack} className="p-2 hover:bg-white/5 rounded-xl transition-all">
              <ArrowLeft className="w-5 h-5 text-zinc-500" />
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Match Mode</span>
              <span className="text-sm font-black italic uppercase text-green-500">{room.mode} Ranked</span>
            </div>
          </div>

          <div className="h-10 w-px bg-white/10" />

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Round</span>
              <span className="text-xl font-black italic text-white">{room.round} / {room.totalRounds}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Time Left</span>
              <div className="flex items-center gap-2 text-red-500">
                <Clock className="w-4 h-4" />
                <span className="text-xl font-black italic">{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scoreboard */}
        <div className="flex items-center gap-4 bg-black/40 px-6 py-2 rounded-2xl border border-white/5">
          <div className="text-right">
            <p className="text-[10px] font-bold text-blue-500 uppercase">Alpha</p>
            <p className="text-2xl font-black italic">{room.scores?.team1 || 0}</p>
          </div>
          <div className="text-zinc-700 font-black italic text-2xl">:</div>
          <div className="text-left">
            <p className="text-[10px] font-bold text-red-500 uppercase">Omega</p>
            <p className="text-2xl font-black italic">{room.scores?.team2 || 0}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => setIsMicOn(!isMicOn)} className={`p-3 rounded-xl border transition-all ${isMicOn ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-white/5 border-white/10 text-zinc-500'}`}>
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          <button onClick={runCode} disabled={isRunning} className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-black uppercase tracking-widest transition-all text-xs disabled:opacity-50">
            {isRunning ? 'Executing...' : 'Run Code'}
          </button>
          <button onClick={submitCode} className="px-6 py-3 bg-green-500 hover:bg-green-400 text-black rounded-xl font-black uppercase tracking-widest transition-all text-xs">
            Submit
          </button>
        </div>
      </div>

      {/* Main Battleground */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Problem & AI Hints */}
        <div className="w-80 border-r border-white/10 bg-zinc-900/30 p-6 overflow-y-auto space-y-8">
          <section>
            <h3 className="text-xs font-black uppercase tracking-widest text-green-500 mb-4 flex items-center gap-2">
              <Code2 className="w-4 h-4" /> {currentProblem.title}
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed font-medium">
              {currentProblem.description}
            </p>
          </section>

          <section>
            <h3 className="text-xs font-black uppercase tracking-widest text-blue-500 mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4" /> AI Insight
            </h3>
            <AnimatePresence mode="wait">
              {aiHint && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl text-xs text-blue-400 italic font-medium"
                >
                  "{aiHint}"
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <section>
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">Console</h3>
            <div className="bg-black/60 rounded-xl p-4 font-mono text-[10px] h-48 overflow-y-auto border border-white/5">
              {output ? <pre className="text-green-400">{output}</pre> : <span className="text-zinc-700 italic">Awaiting execution...</span>}
            </div>
          </section>
        </div>

        {/* Center: Editor */}
        <div className="flex-1 flex flex-col relative">
          <div className="flex-1">
            <Editor
              height="100%"
              theme="vs-dark"
              language="javascript"
              value={code}
              onChange={handleCodeChange}
              options={{
                minimap: { enabled: false },
                fontSize: 16,
                fontFamily: 'JetBrains Mono',
                padding: { top: 20 },
                automaticLayout: true,
              }}
            />
          </div>

          {/* Chat Overlay */}
          <div className={`absolute bottom-0 left-0 w-full transition-all ${showChat ? 'h-64' : 'h-12'} bg-zinc-900/90 backdrop-blur-xl border-t border-white/10 flex flex-col z-40`}>
            <button onClick={() => setShowChat(!showChat)} className="h-12 flex items-center px-6 gap-2 text-zinc-500 hover:text-white transition-all">
              <MessageSquare className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Squad Comms</span>
            </button>
            {showChat && (
              <div className="flex-1 flex flex-col p-4 overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                  {messages.map((m, i) => (
                    <div key={i} className="text-xs">
                      <span className="text-green-500 font-bold">{m.username}: </span>
                      <span className="text-zinc-300">{m.message}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input 
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-green-500"
                    placeholder="Type message..."
                  />
                  <button onClick={sendMessage} className="p-2 bg-green-500 text-black rounded-xl"><Send className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Squad & Opponents */}
        <div className="w-80 border-l border-white/10 bg-zinc-900/30 flex flex-col">
          <div className="p-4 border-b border-white/10 bg-white/5">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Live Status</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {room.players.map((p: any) => (
              <div key={p.userId} className={`p-4 rounded-2xl border transition-all ${p.userId === user?.uid ? 'bg-green-500/5 border-green-500/20' : 'bg-white/5 border-white/10'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${p.team === 1 ? 'bg-blue-500' : 'bg-red-500'}`}>
                      {p.username[0]}
                    </div>
                    <div>
                      <p className="text-xs font-bold">{p.username}</p>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Team {p.team === 1 ? 'Alpha' : 'Omega'}</p>
                    </div>
                  </div>
                  {opponentsData[p.userId]?.reaction && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1.5 }} className="text-xl">
                      {opponentsData[p.userId].reaction}
                    </motion.span>
                  )}
                </div>
                <div className="h-20 bg-black/40 rounded-xl p-2 overflow-hidden opacity-30">
                  <pre className="text-[8px] font-mono text-zinc-500">
                    {opponentsData[p.userId]?.code || '// Typing...'}
                  </pre>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Reactions */}
          <div className="p-4 border-t border-white/10 grid grid-cols-4 gap-2">
            {['🔥', '😎', '💻', '🚀'].map(e => (
              <button key={e} onClick={() => sendReaction(e)} className="p-2 hover:bg-white/5 rounded-xl transition-all text-xl grayscale hover:grayscale-0">
                {e}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Round Transition Overlay */}
      <AnimatePresence>
        {roundTransition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.5, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                className="text-6xl font-black italic uppercase tracking-tighter text-green-500 mb-4"
              >
                Next Round Starting...
              </motion.div>
              <div className="flex justify-center gap-2">
                {[1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, delay: i * 0.2 }}
                    className="w-3 h-3 bg-green-500 rounded-full"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Win Screen */}
      <AnimatePresence>
        {isFinished && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-8"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-4xl w-full bg-zinc-900 border-2 border-green-500 rounded-[3rem] p-12 text-center relative overflow-hidden shadow-[0_0_100px_rgba(34,197,94,0.3)]"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-green-500" />
              
              <Trophy className="w-32 h-32 text-yellow-500 mx-auto mb-8 animate-bounce" />
              <h2 className="text-7xl font-black italic uppercase tracking-tighter text-green-500 mb-4">Code Cracked</h2>
              <p className="text-2xl font-black uppercase tracking-widest text-white mb-12">Team Alpha Victory</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
                  <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-4" />
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mb-2">XP Gained</p>
                  <p className="text-4xl font-black italic text-white">+1,250</p>
                </div>
                <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
                  <Shield className="w-8 h-8 text-blue-500 mx-auto mb-4" />
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Rank Progress</p>
                  <p className="text-4xl font-black italic text-white">Gold II</p>
                </div>
                <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
                  <Target className="w-8 h-8 text-red-500 mx-auto mb-4" />
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mb-2">MVP</p>
                  <p className="text-2xl font-black italic text-white uppercase">{winner.mvp}</p>
                </div>
              </div>

              <div className="flex gap-6">
                <button onClick={() => navigate('dashboard')} className="flex-1 py-6 bg-white text-black rounded-3xl font-black uppercase tracking-widest hover:bg-zinc-200 transition-all">
                  Return to Base
                </button>
                <button onClick={() => navigate('lobby')} className="flex-1 py-6 bg-green-500 text-black rounded-3xl font-black uppercase tracking-widest hover:bg-green-400 transition-all">
                  Next Battle
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Match;
