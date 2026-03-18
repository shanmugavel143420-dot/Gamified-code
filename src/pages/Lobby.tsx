import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Swords, Settings, Play, X, UserPlus, Shield, Zap, Mic, MicOff, Crown, Search, Send, MessageSquare } from 'lucide-react';
import socket from '../socket';
import { Page } from '../App';
import VoiceChat from '../components/VoiceChat';

interface LobbyProps {
  user: any;
  userData: any;
  navigate: (page: Page, data?: any) => void;
  goBack: () => void;
}

const Lobby: React.FC<LobbyProps> = ({ user, userData, navigate, goBack }) => {
  const [mode, setMode] = useState<'ranked' | 'custom'>('ranked');
  const [selectedMode, setSelectedMode] = useState<'1v1' | '2v2' | '4v4'>('1v1');
  const [isSearching, setIsSearching] = useState(false);
  const [room, setRoom] = useState<any>(null);
  const [isMicOn, setIsMicOn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [lobbyMessages, setLobbyMessages] = useState<{ username: string; message: string }[]>([]);
  const [lobbyChatInput, setLobbyChatInput] = useState('');
  
  const [customConfig, setCustomConfig] = useState({
    name: `${userData?.username}'s Arena`,
    mode: '1v1',
    difficulty: 'medium',
    timePerRound: 300,
    totalRounds: 3
  });

  useEffect(() => {
    const handleRoomUpdate = (updatedRoom: any) => {
      setRoom(updatedRoom);
    };

    const handleMatchStarted = (matchData: any) => {
      navigate('match', matchData);
    };

    const handleMatchFound = (data: any) => {
      setIsSearching(false);
      navigate('match', data);
    };

    const handleKicked = () => {
      setRoom(null);
      alert("You have been kicked from the room.");
    };

    const handleIncomingInvite = (data: any) => {
      if (data.targetUserId === user.uid) {
        const accept = window.confirm(`${data.inviterName} invited you to join their Arena! Accept?`);
        if (accept) {
          joinRoom(data.roomId);
        }
      }
    };

    const handleNewLobbyMessage = (msg: any) => {
      setLobbyMessages(prev => [...prev, msg]);
    };

    socket.on('roomUpdate', handleRoomUpdate);
    socket.on('matchStarted', handleMatchStarted);
    socket.on('matchFound', handleMatchFound);
    socket.on('kicked', handleKicked);
    socket.on('incomingInvite', handleIncomingInvite);
    socket.on('newMessage', handleNewLobbyMessage);

    return () => {
      socket.off('roomUpdate');
      socket.off('matchStarted');
      socket.off('matchFound');
      socket.off('kicked');
      socket.off('incomingInvite');
      socket.off('newMessage');
    };
  }, [navigate, user.uid]);

  const startMatchmaking = () => {
    setIsSearching(true);
    socket.emit('joinQueue', { userId: user.uid, rank: userData?.rank || 'Bronze', mode: selectedMode });
  };

  const createRoom = () => {
    socket.emit('createCustomRoom', { userId: user.uid, username: userData?.username, config: customConfig });
  };

  const joinRoom = (id: string) => {
    socket.emit('joinCustomRoom', { roomId: id, userId: user.uid, username: userData?.username });
  };

  const toggleReady = () => {
    if (room) {
      socket.emit('toggleReady', { roomId: room.id, userId: user.uid });
    }
  };

  const startMatch = () => {
    if (room) {
      socket.emit('startMatch', { roomId: room.id });
    }
  };

  const kickPlayer = (targetUserId: string) => {
    if (room) {
      socket.emit('kickPlayer', { roomId: room.id, targetUserId });
    }
  };

  const sendLobbyMessage = () => {
    if (!lobbyChatInput.trim() || !room) return;
    socket.emit('chatMessage', { roomId: room.id, message: lobbyChatInput, username: userData?.username });
    setLobbyChatInput('');
  };

  const searchUsers = (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      // Simulated search
      setSearchResults([
        { uid: '1', username: 'ProCoder_99', rank: 'Platinum' },
        { uid: '2', username: 'CodeKing', rank: 'Gold' },
        { uid: '3', username: 'BugHunter', rank: 'Silver' }
      ].filter(u => u.username.toLowerCase().includes(query.toLowerCase())));
    } else {
      setSearchResults([]);
    }
  };

  const inviteUser = (targetUserId: string) => {
    if (room) {
      socket.emit('invitePlayer', { roomId: room.id, targetUserId, inviterName: userData?.username });
      alert("Invitation sent!");
    }
  };

  if (room) {
    return (
      <div className="min-h-screen bg-black/95 text-white p-8 pt-24">
        <VoiceChat roomId={room.id} userId={user.uid} isMicOn={isMicOn} peers={[]} />
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Room Info & Controls */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-xl">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">{room.mode} Battle Lobby</h1>
                  <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Room ID: {room.id}</p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsMicOn(!isMicOn)}
                    className={`p-4 rounded-2xl border transition-all ${isMicOn ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-white/5 border-white/10 text-white/50'}`}
                  >
                    {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                  </button>
                  <button onClick={() => setRoom(null)} className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                {/* Team 1 */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Team Alpha
                  </h3>
                  {room.players.filter((p: any) => p.team === 1).map((p: any) => (
                    <motion.div 
                      layout
                      key={p.userId}
                      className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-black text-xl">
                            {p.username[0]}
                          </div>
                          {room.hostId === p.userId && <Crown className="absolute -top-2 -right-2 w-5 h-5 text-yellow-500 fill-yellow-500" />}
                        </div>
                        <div>
                          <p className="font-bold">{p.username}</p>
                          <p className={`text-[10px] font-bold uppercase ${p.ready ? 'text-green-500' : 'text-zinc-500'}`}>
                            {p.ready ? 'READY' : 'PREPARING...'}
                          </p>
                        </div>
                      </div>
                      {room.hostId === user.uid && p.userId !== user.uid && (
                        <button onClick={() => kickPlayer(p.userId)} className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Team 2 */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Team Omega
                  </h3>
                  {room.players.filter((p: any) => p.team === 2).map((p: any) => (
                    <motion.div 
                      layout
                      key={p.userId}
                      className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center font-black text-xl">
                          {p.username[0]}
                        </div>
                        <div>
                          <p className="font-bold">{p.username}</p>
                          <p className={`text-[10px] font-bold uppercase ${p.ready ? 'text-green-500' : 'text-zinc-500'}`}>
                            {p.ready ? 'READY' : 'PREPARING...'}
                          </p>
                        </div>
                      </div>
                      {room.hostId === user.uid && p.userId !== user.uid && (
                        <button onClick={() => kickPlayer(p.userId)} className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                  {room.players.length < (parseInt(room.mode[0]) * 2) && (
                    <div className="border-2 border-dashed border-white/5 p-4 rounded-2xl flex items-center justify-center text-zinc-600 italic text-sm">
                      Waiting for opponent...
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={toggleReady}
                className={`flex-1 py-6 rounded-3xl font-black uppercase tracking-widest transition-all ${
                  room.players.find((p: any) => p.userId === user.uid)?.ready 
                  ? 'bg-zinc-800 text-zinc-500 border border-white/5' 
                  : 'bg-green-500 text-black hover:bg-green-400 shadow-[0_0_30px_rgba(34,197,94,0.3)]'
                }`}
              >
                {room.players.find((p: any) => p.userId === user.uid)?.ready ? 'UNREADY' : 'READY UP'}
              </button>
              {room.hostId === user.uid && (
                <button 
                  onClick={startMatch}
                  className="flex-1 py-6 bg-white text-black rounded-3xl font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                >
                  START COMBAT
                </button>
              )}
            </div>
          </div>

          {/* Sidebar: Config & Chat */}
          <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-white/10 p-6 rounded-[2.5rem] backdrop-blur-xl">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Invite Squad
              </h3>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={e => searchUsers(e.target.value)}
                    placeholder="Search username..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs outline-none focus:border-green-500"
                  />
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {searchResults.map(u => (
                    <div key={u.uid} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                      <div>
                        <p className="text-xs font-bold">{u.username}</p>
                        <p className="text-[8px] text-zinc-500 uppercase">{u.rank}</p>
                      </div>
                      <button onClick={() => inviteUser(u.uid)} className="p-2 bg-green-500 text-black rounded-lg hover:bg-green-400">
                        <UserPlus className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-white/10 p-6 rounded-[2.5rem] h-[400px] flex flex-col backdrop-blur-xl">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Lobby Chat
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2 custom-scrollbar">
                {lobbyMessages.map((m, i) => (
                  <div key={i} className="text-xs">
                    <span className="text-green-500 font-bold">{m.username}: </span>
                    <span className="text-zinc-300">{m.message}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={lobbyChatInput}
                  onChange={e => setLobbyChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendLobbyMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-green-500"
                />
                <button onClick={sendLobbyMessage} className="p-3 bg-green-500 text-black rounded-xl hover:bg-green-400">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8 pt-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-6xl font-black italic uppercase tracking-tighter mb-2">Battle Lobby</h1>
            <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Select your combat mode</p>
          </div>
          <div className="flex bg-zinc-900 p-1 rounded-2xl border border-white/5">
            <button 
              onClick={() => setMode('ranked')}
              className={`px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${mode === 'ranked' ? 'bg-green-500 text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              Ranked
            </button>
            <button 
              onClick={() => setMode('custom')}
              className={`px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${mode === 'custom' ? 'bg-green-500 text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              Custom
            </button>
          </div>
        </div>

        {mode === 'ranked' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['1v1', '2v2', '4v4'] as const).map((m) => (
              <motion.button
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                key={m}
                onClick={() => setSelectedMode(m)}
                className={`relative h-64 rounded-[2.5rem] border-2 transition-all p-8 text-left group overflow-hidden ${
                  selectedMode === m ? 'border-green-500 bg-green-500/10' : 'border-white/10 bg-zinc-900/50 hover:border-white/30'
                }`}
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all">
                  <Swords className="w-32 h-32" />
                </div>
                <h3 className="text-4xl font-black italic uppercase mb-2">{m}</h3>
                <p className="text-zinc-500 text-sm mb-8">
                  {m === '1v1' ? 'Pure skill duel.' : m === '2v2' ? 'Tactical teamwork.' : 'Squad chaos.'}
                </p>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-green-500">
                  <Users className="w-4 h-4" />
                  <span>{m === '1v1' ? '2' : m === '2v2' ? '4' : '8'} Players</span>
                </div>
              </motion.button>
            ))}
            <div className="md:col-span-3 mt-8">
              <button 
                onClick={startMatchmaking}
                disabled={isSearching}
                className={`w-full py-8 rounded-[2.5rem] font-black italic uppercase text-2xl tracking-widest transition-all ${
                  isSearching 
                  ? 'bg-yellow-500/10 text-yellow-500 border-2 border-yellow-500 animate-pulse' 
                  : 'bg-green-500 text-black hover:bg-green-400 shadow-[0_0_50px_rgba(34,197,94,0.3)]'
                }`}
              >
                {isSearching ? 'Searching for Combatants...' : 'Enter the Arena'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-[2.5rem] space-y-8">
              <h3 className="text-2xl font-black italic uppercase">Create Arena</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Arena Name</label>
                  <input 
                    type="text" 
                    value={customConfig.name}
                    onChange={e => setCustomConfig({...customConfig, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-green-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Mode</label>
                    <select 
                      value={customConfig.mode}
                      onChange={e => setCustomConfig({...customConfig, mode: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-green-500 appearance-none"
                    >
                      <option value="1v1">1v1</option>
                      <option value="2v2">2v2</option>
                      <option value="4v4">4v4</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Difficulty</label>
                    <select 
                      value={customConfig.difficulty}
                      onChange={e => setCustomConfig({...customConfig, difficulty: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-green-500 appearance-none"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>
                <button 
                  onClick={createRoom}
                  className="w-full py-6 bg-white text-black rounded-3xl font-black uppercase tracking-widest hover:bg-zinc-200 transition-all"
                >
                  Initialize Room
                </button>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-[2.5rem] space-y-8">
              <h3 className="text-2xl font-black italic uppercase">Join Arena</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Room Code</label>
                  <input 
                    type="text" 
                    placeholder="Enter 6-digit code..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-green-500 text-center font-mono text-2xl tracking-widest uppercase"
                    onChange={(e) => {
                      if (e.target.value.length === 6) joinRoom(e.target.value);
                    }}
                  />
                </div>
                <div className="p-8 border-2 border-dashed border-white/5 rounded-3xl text-center text-zinc-600 italic">
                  Enter a room code to join an existing battle.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;
