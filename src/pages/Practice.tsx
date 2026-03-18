import React, { useState, useEffect, useRef } from 'react';
import { Page } from '../App';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Play, Send, Clock, BookOpen, Code, Terminal, CheckCircle, XCircle, Zap, Trophy, ChevronRight, Lock } from 'lucide-react';
import axios from 'axios';

interface PracticeProps {
  user: any;
  userData: any;
  navigate: (page: Page) => void;
  goBack: () => void;
}

type Difficulty = 'easy' | 'medium' | 'hard';
type Language = 'c' | 'cpp' | 'python' | 'java' | 'javascript';

interface Problem {
  id: string;
  title: string;
  difficulty: Difficulty;
  timeLimit: number; // in seconds
  syntaxExplanation: {
    concept: string;
    description: string;
    snippet: string;
  }[];
  miniDemo: {
    code: string;
    output: string;
  };
  problemStatement: string;
  testCases: { input: string; expectedOutput: string }[];
  xpReward: number;
}

const LANGUAGES: { id: Language; label: string; monacoId: string; judge0Id: number; template: string }[] = [
  {
    id: 'c',
    label: 'C',
    monacoId: 'c',
    judge0Id: 50,
    template: '#include <stdio.h>\n\nint main() {\n    // your code here\n    return 0;\n}'
  },
  {
    id: 'cpp',
    label: 'C++',
    monacoId: 'cpp',
    judge0Id: 54,
    template: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // your code here\n    return 0;\n}'
  },
  {
    id: 'python',
    label: 'Python',
    monacoId: 'python',
    judge0Id: 71,
    template: '# your code here\n'
  },
  {
    id: 'java',
    label: 'Java',
    monacoId: 'java',
    judge0Id: 62,
    template: 'public class Main {\n    public static void main(String[] args) {\n        // your code here\n    }\n}'
  },
  {
    id: 'javascript',
    label: 'JavaScript',
    monacoId: 'javascript',
    judge0Id: 63,
    template: 'function main() {\n    // your code here\n}\n\nmain();'
  }
];

const PROBLEMS: Problem[] = [
  {
    id: 'p1',
    title: 'Print Numbers 1 to N',
    difficulty: 'easy',
    timeLimit: 300,
    syntaxExplanation: [
      {
        concept: 'Loops',
        description: 'A loop is used to repeat a block of code multiple times.',
        snippet: 'for (int i = 1; i <= n; i++) { ... }'
      }
    ],
    miniDemo: {
      code: 'for (let i = 1; i <= 3; i++) console.log(i);',
      output: '1\n2\n3'
    },
    problemStatement: 'Write a program that takes an integer N as input and prints numbers from 1 to N, each on a new line.',
    testCases: [
      { input: '5', expectedOutput: '1\n2\n3\n4\n5' }
    ],
    xpReward: 100
  },
  {
    id: 'p2',
    title: 'Factorial of a Number',
    difficulty: 'medium',
    timeLimit: 600,
    syntaxExplanation: [
      {
        concept: 'Recursion',
        description: 'A function that calls itself to solve smaller sub-problems.',
        snippet: 'int fact(int n) { if(n==0) return 1; return n * fact(n-1); }'
      }
    ],
    miniDemo: {
      code: 'const fact = (n) => n <= 1 ? 1 : n * fact(n-1);\nconsole.log(fact(4));',
      output: '24'
    },
    problemStatement: 'Write a program to calculate the factorial of a given number N.',
    testCases: [
      { input: '5', expectedOutput: '120' }
    ],
    xpReward: 250
  },
  {
    id: 'p3',
    title: 'Binary Search',
    difficulty: 'hard',
    timeLimit: 900,
    syntaxExplanation: [
      {
        concept: 'Divide and Conquer',
        description: 'Binary search works by repeatedly dividing the search interval in half.',
        snippet: 'while (low <= high) { mid = (low + high) / 2; ... }'
      }
    ],
    miniDemo: {
      code: 'const arr = [1, 3, 5, 7, 9];\n// Searching for 7...',
      output: 'Index: 3'
    },
    problemStatement: 'Implement a Binary Search algorithm to find the index of a target value in a sorted array.',
    testCases: [
      { input: '5 1 2 3 4 5 3', expectedOutput: '2' }
    ],
    xpReward: 500
  }
];

const Practice: React.FC<PracticeProps> = ({ user, userData, navigate, goBack }) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [language, setLanguage] = useState<Language>('javascript');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [unlockedDifficulties, setUnlockedDifficulties] = useState<Difficulty[]>(['easy']);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (currentProblem && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentProblem, timeLeft]);

  const handleDifficultySelect = (diff: Difficulty) => {
    if (!unlockedDifficulties.includes(diff)) return;
    setSelectedDifficulty(diff);
    const problem = PROBLEMS.find(p => p.difficulty === diff);
    if (problem) {
      setCurrentProblem(problem);
      setTimeLeft(problem.timeLimit);
      const langConfig = LANGUAGES.find(l => l.id === language);
      setCode(langConfig?.template || '');
    }
  };

  const handleLanguageChange = (langId: Language) => {
    setLanguage(langId);
    const langConfig = LANGUAGES.find(l => l.id === langId);
    setCode(langConfig?.template || '');
  };

  const handleRun = async () => {
    setIsExecuting(true);
    setOutput('Compiling and running...');
    
    try {
      const langConfig = LANGUAGES.find(l => l.id === language);
      const response = await axios.post('/api/execute', {
        source_code: code,
        language_id: langConfig?.judge0Id,
        stdin: currentProblem?.testCases[0].input || ''
      });

      const result = response.data;
      if (result.stdout) {
        setOutput(result.stdout);
      } else if (result.stderr || result.compile_output) {
        setOutput(result.stderr || result.compile_output);
      } else {
        setOutput('No output');
      }
    } catch (error) {
      setOutput('Error connecting to execution engine.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSubmit = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsExecuting(true);
    
    try {
      const langConfig = LANGUAGES.find(l => l.id === language);
      const results = [];
      let allPassed = true;

      for (const testCase of currentProblem?.testCases || []) {
        const response = await axios.post('/api/execute', {
          source_code: code,
          language_id: langConfig?.judge0Id,
          stdin: testCase.input
        });
        
        const result = response.data;
        const passed = result.stdout?.trim() === testCase.expectedOutput.trim();
        results.push({ passed, actual: result.stdout, expected: testCase.expectedOutput });
        if (!passed) allPassed = false;
      }

      let feedback = "Needs Improvement";
      if (allPassed) {
        if (timeLeft > currentProblem!.timeLimit * 0.8) feedback = "Excellent";
        else if (timeLeft > currentProblem!.timeLimit * 0.5) feedback = "Super";
        else feedback = "Good";

        // Unlock next difficulty
        if (selectedDifficulty === 'easy' && !unlockedDifficulties.includes('medium')) {
          setUnlockedDifficulties(prev => [...prev, 'medium']);
        } else if (selectedDifficulty === 'medium' && !unlockedDifficulties.includes('hard')) {
          setUnlockedDifficulties(prev => [...prev, 'hard']);
        }
      }

      setEvaluation({ allPassed, results, feedback, xpAwarded: allPassed ? currentProblem?.xpReward : 0 });
      setShowResult(true);
    } catch (error) {
      setOutput('Submission failed.');
    } finally {
      setIsExecuting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!selectedDifficulty) {
    return (
      <div className="max-w-4xl mx-auto p-8 pt-24">
        <button onClick={goBack} className="flex items-center gap-2 text-white/50 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Back to Arena</span>
        </button>

        <div className="text-center mb-12">
          <Zap className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Practice Mode</h1>
          <p className="text-green-500 font-mono text-sm uppercase tracking-widest">Master the Syntax. Conquer the Logic.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => {
            const isUnlocked = unlockedDifficulties.includes(diff);
            return (
              <button
                key={diff}
                onClick={() => handleDifficultySelect(diff)}
                disabled={!isUnlocked}
                className={`relative group p-8 rounded-[2rem] border transition-all text-left overflow-hidden ${
                  isUnlocked 
                    ? 'bg-black/40 border-white/10 hover:border-green-500/50 hover:bg-green-500/5' 
                    : 'bg-black/20 border-white/5 opacity-50 cursor-not-allowed'
                }`}
              >
                {!isUnlocked && <Lock className="absolute top-4 right-4 w-5 h-5 text-white/20" />}
                <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${
                  diff === 'easy' ? 'text-green-500' : diff === 'medium' ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {diff}
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">
                  {diff === 'easy' ? 'The Initiate' : diff === 'medium' ? 'The Adept' : 'The Grandmaster'}
                </h3>
                <p className="text-sm text-white/50 leading-relaxed mb-6">
                  {diff === 'easy' ? 'Basic syntax and simple logic flows.' : diff === 'medium' ? 'Advanced algorithms and data structures.' : 'Complex problem solving and optimization.'}
                </p>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-green-500">
                  <span>Start Training</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-black overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedDifficulty(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-black uppercase tracking-tighter">{currentProblem?.title}</h2>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${
                selectedDifficulty === 'easy' ? 'text-green-500' : selectedDifficulty === 'medium' ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {selectedDifficulty}
              </span>
              <span className="text-white/20 text-[10px]">•</span>
              <span className="text-white/40 text-[10px] uppercase tracking-widest">{currentProblem?.xpReward} XP REWARD</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-red-500/10 px-4 py-2 rounded-full border border-red-500/30">
            <Clock className="w-4 h-4 text-red-500" />
            <span className="font-mono font-bold text-red-500">{formatTime(timeLeft)}</span>
          </div>
          
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                onClick={() => handleLanguageChange(lang.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                  language === lang.id ? 'bg-green-500 text-black' : 'text-white/50 hover:text-white'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Description & Syntax */}
        <div className="w-1/3 border-r border-white/10 overflow-y-auto p-6 space-y-8 bg-black/20">
          <section>
            <div className="flex items-center gap-2 text-green-500 mb-4">
              <BookOpen className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Syntax Explanation</h3>
            </div>
            <div className="space-y-6">
              {currentProblem?.syntaxExplanation.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <h4 className="text-sm font-bold text-white/80">{item.concept}</h4>
                  <p className="text-xs text-white/50 leading-relaxed">{item.description}</p>
                  <pre className="bg-black/60 p-3 rounded-lg border border-white/5 text-[10px] font-mono text-green-400 overflow-x-auto">
                    {item.snippet}
                  </pre>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 text-blue-500 mb-4">
              <Zap className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Mini Demo</h3>
            </div>
            <div className="bg-black/60 rounded-xl border border-white/5 overflow-hidden">
              <div className="p-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Example Code</span>
              </div>
              <pre className="p-4 text-[10px] font-mono text-blue-400">
                {currentProblem?.miniDemo.code}
              </pre>
              <div className="p-3 bg-black/40 border-t border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 block mb-2">Output Preview</span>
                <pre className="text-[10px] font-mono text-white/50">{currentProblem?.miniDemo.output}</pre>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 text-yellow-500 mb-4">
              <Code className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Problem Statement</h3>
            </div>
            <p className="text-sm text-white/80 leading-relaxed font-medium">
              {currentProblem?.problemStatement}
            </p>
          </section>
        </div>

        {/* Right Panel: Editor & Console */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative">
            <Editor
              height="100%"
              theme="vs-dark"
              language={LANGUAGES.find(l => l.id === language)?.monacoId}
              value={code}
              onChange={(v) => setCode(v || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: 'JetBrains Mono',
                padding: { top: 20 },
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
            
            <div className="absolute bottom-6 right-6 flex gap-3">
              <button
                onClick={handleRun}
                disabled={isExecuting}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all text-xs font-bold uppercase tracking-widest disabled:opacity-50"
              >
                <Play className={`w-4 h-4 ${isExecuting ? 'animate-pulse' : ''}`} />
                Run Code
              </button>
              <button
                onClick={handleSubmit}
                disabled={isExecuting}
                className="flex items-center gap-2 px-8 py-3 bg-green-500 hover:bg-green-400 text-black rounded-xl transition-all text-xs font-bold uppercase tracking-widest disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                Submit Solution
              </button>
            </div>
          </div>

          {/* Console */}
          <div className="h-1/3 bg-black border-t border-white/10 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-2">
                <Terminal className="w-3 h-3 text-white/30" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Output Console</span>
              </div>
              <button onClick={() => setOutput('')} className="text-[10px] font-bold uppercase tracking-widest text-white/20 hover:text-white transition-colors">Clear</button>
            </div>
            <div className="flex-1 p-4 font-mono text-xs overflow-y-auto whitespace-pre-wrap">
              {output || <span className="text-white/20 italic">Run your code to see the output here...</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Result Modal */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-md w-full bg-black border border-white/10 rounded-[2.5rem] p-10 text-center"
            >
              <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${
                evaluation?.allPassed ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
              }`}>
                {evaluation?.allPassed ? <Trophy className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
              </div>

              <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">
                {evaluation?.allPassed ? 'Mission Accomplished' : 'System Failure'}
              </h2>
              <p className={`text-sm font-bold uppercase tracking-widest mb-8 ${
                evaluation?.allPassed ? 'text-green-500' : 'text-red-500'
              }`}>
                AI Feedback: {evaluation?.feedback}
              </p>

              <div className="space-y-4 mb-8">
                {evaluation?.results.map((res: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      {res.passed ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                      <span className="text-xs font-bold uppercase tracking-widest">Test Case #{idx + 1}</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                      res.passed ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                    }`}>
                      {res.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                ))}
              </div>

              {evaluation?.allPassed && (
                <div className="bg-green-500/10 p-6 rounded-3xl border border-green-500/20 mb-8">
                  <div className="flex items-center justify-center gap-2 text-green-500 mb-1">
                    <Zap className="w-5 h-5" />
                    <span className="text-2xl font-black">+{evaluation?.xpAwarded} XP</span>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-green-500/50">Experience Gained</p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setShowResult(false)}
                  className="flex-1 py-4 rounded-2xl border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all"
                >
                  Review Code
                </button>
                <button
                  onClick={() => {
                    setShowResult(false);
                    setSelectedDifficulty(null);
                  }}
                  className="flex-1 py-4 bg-green-500 text-black rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-green-400 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Practice;
