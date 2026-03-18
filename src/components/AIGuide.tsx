import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Cpu, Send, ChevronRight } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const AIGuide: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: 'Welcome to CODEX ARENA! I am your AI Guide. How can I help you navigate the battlefield today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      
      const prompt = `You are the AI Guide for CODEX ARENA, a gamified competitive coding platform.
      Features:
      - Ranked 1v1: Competitive matchmaking.
      - Practice: AI-generated coding problems.
      - Self vs Self: Beat your own records.
      - Custom Room: Play with friends using a code.
      - Leaderboard: See top players.
      - Profile/Settings: Customize your identity (username, photo).
      
      User says: ${userMsg}
      Keep your response short, helpful, and in character (tech-focused, encouraging).`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      setMessages(prev => [...prev, { role: 'ai', text: result.text || "I'm processing..." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting to the neural link. Try again later!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-80 h-96 bg-black/90 backdrop-blur-2xl border border-green-500/30 rounded-3xl shadow-[0_0_50px_rgba(34,197,94,0.2)] flex flex-col overflow-hidden"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-green-500/10">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-green-500" />
                <span className="font-black italic uppercase tracking-widest text-xs">Arena Guide</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-xs ${m.role === 'user' ? 'bg-green-500 text-black font-bold' : 'bg-white/5 border border-white/10 text-white/80'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex gap-1">
                    <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce" />
                    <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/10 bg-black/50">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Ask for guidance..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-green-500"
                />
                <button onClick={handleSend} className="p-2 bg-green-500 text-black rounded-xl hover:bg-green-400 transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${isOpen ? 'bg-red-500 rotate-90' : 'bg-green-500 shadow-[0_0_30px_rgba(34,197,94,0.5)]'}`}
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageSquare className="w-6 h-6 text-black" />}
      </motion.button>
    </div>
  );
};

export default AIGuide;
