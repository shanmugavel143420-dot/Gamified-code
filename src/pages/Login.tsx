import React from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { motion } from 'motion/react';
import { Terminal, Shield, Zap } from 'lucide-react';

const Login: React.FC = () => {
  const handleLogin = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full bg-black/80 backdrop-blur-xl border-2 border-green-500 p-8 rounded-3xl shadow-[0_0_50px_rgba(34,197,94,0.3)] text-center relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent" />
        
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-green-500/10 rounded-2xl border border-green-500/50">
            <Terminal className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <h1 className="text-4xl font-black tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-green-500">
          CODEX ARENA
        </h1>
        <p className="text-green-500/70 font-mono text-sm mb-8 uppercase tracking-widest">
          The Ultimate Coding Esports
        </p>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 text-left p-3 bg-white/5 rounded-xl border border-white/10">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="text-sm">Real-time 1v1 Matchmaking</span>
          </div>
          <div className="flex items-center gap-3 text-left p-3 bg-white/5 rounded-xl border border-white/10">
            <Shield className="w-5 h-5 text-blue-400" />
            <span className="text-sm">AI-Powered Skill Analysis</span>
          </div>
        </div>

        <button
          onClick={handleLogin}
          className="w-full py-4 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition-all active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.5)] flex items-center justify-center gap-3"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="google" />
          ENTER THE ARENA
        </button>

        <p className="mt-6 text-xs text-white/30 font-mono">
          BY ENTERING, YOU AGREE TO THE TERMS OF COMBAT
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
