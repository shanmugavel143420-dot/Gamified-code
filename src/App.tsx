import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import ThreeBackground from './components/ThreeBackground';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Match from './pages/Match';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import Settings from './pages/Settings';
import Practice from './pages/Practice';
import Lobby from './pages/Lobby';
import AIGuide from './components/AIGuide';
import { motion, AnimatePresence } from 'motion/react';

export type Page = 'login' | 'dashboard' | 'match' | 'profile' | 'leaderboard' | 'settings' | 'practice' | 'lobby';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [history, setHistory] = useState<Page[]>([]);
  const [matchData, setMatchData] = useState<any>(null);

  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const userRef = doc(db, 'users', u.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          // Initialize new user
          await setDoc(userRef, {
            uid: u.uid,
            username: u.displayName || `Player_${u.uid.slice(0, 5)}`,
            uniqueId: u.uid.slice(0, 8).toLowerCase(),
            avatar: u.photoURL || '',
            banner: 'https://picsum.photos/seed/banner/1200/400',
            socialLinks: { github: '', linkedin: '' },
            likes: 0,
            xp: 0,
            level: 1,
            rank: 'Bronze',
            isVerified: false,
            skillTags: [],
            characterTags: [],
            stats: { wins: 0, losses: 0, accuracy: 0, avgSpeed: 0 }
          });
        }

        // Listen for real-time updates
        unsubscribeFirestore = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            setUserData(doc.data());
          }
        });

        setUser(u);
        setCurrentPage('dashboard');
        setHistory([]);
      } else {
        if (unsubscribeFirestore) unsubscribeFirestore();
        setUser(null);
        setUserData(null);
        setCurrentPage('login');
        setHistory([]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  const navigate = (page: Page, data?: any) => {
    if (data) setMatchData(data);
    setHistory(prev => [...prev, currentPage]);
    setCurrentPage(page);
  };

  const goBack = () => {
    if (history.length > 0) {
      const prevPage = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      setCurrentPage(prevPage);
    } else {
      setCurrentPage('dashboard');
    }
  };

  if (loading) return <div className="h-screen w-screen bg-black flex items-center justify-center text-green-500 font-mono text-2xl animate-pulse">INITIALIZING ARENA...</div>;

  return (
    <div className="min-h-screen text-white font-sans selection:bg-green-500 selection:text-black">
      <ThreeBackground />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentPage === 'login' && <Login />}
          {currentPage === 'dashboard' && <Dashboard user={user} userData={userData} navigate={navigate} />}
          {currentPage === 'match' && <Match user={user} matchData={matchData} navigate={navigate} goBack={goBack} />}
          {currentPage === 'profile' && <Profile user={user} userData={userData} navigate={navigate} goBack={goBack} />}
          {currentPage === 'leaderboard' && <Leaderboard navigate={navigate} goBack={goBack} />}
          {currentPage === 'settings' && <Settings user={user} navigate={navigate} goBack={goBack} />}
          {currentPage === 'practice' && <Practice user={user} userData={userData} navigate={navigate} goBack={goBack} />}
          {currentPage === 'lobby' && <Lobby user={user} userData={userData} navigate={navigate} goBack={goBack} />}
        </motion.div>
      </AnimatePresence>

      {user && <AIGuide />}

      {/* Global HUD Elements */}
      {user && userData && currentPage !== 'match' && (
        <div className="fixed top-4 right-4 flex items-center gap-4 bg-black/50 backdrop-blur-md border border-green-500/30 p-2 rounded-full px-4 z-[90]">
          <div className="text-right">
            <p className="text-xs text-green-500 font-mono">LVL {userData.level || 1}</p>
            <p className="text-sm font-bold">{userData.username}</p>
          </div>
          <img src={userData.avatar || undefined} className="w-10 h-10 rounded-full border-2 border-green-500 object-cover" alt="avatar" />
        </div>
      )}
    </div>
  );
}

