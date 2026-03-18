import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Page } from '../App';
import { motion } from 'motion/react';
import { ArrowLeft, Save, User as UserIcon, Bell, Shield, Volume2 } from 'lucide-react';

interface SettingsProps {
  user: User | null;
  userData: any;
  navigate: (page: Page) => void;
  goBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, userData, navigate, goBack }) => {
  const [username, setUsername] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userData) {
      setUsername(userData.username || '');
      setPhotoURL(userData.avatar || '');
    }
  }, [userData]);

  const handleSave = async () => {
    if (!user || !username.trim()) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { 
        username,
        avatar: photoURL
      });
      alert('Settings saved successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 pt-24">
      <button onClick={goBack} className="flex items-center gap-2 text-white/50 hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-widest">Back</span>
      </button>

      <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-8">System Settings</h1>

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-6">
            <UserIcon className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-bold uppercase tracking-widest">Profile Identity</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <img src={photoURL || 'https://via.placeholder.com/150'} className="w-16 h-16 rounded-xl border-2 border-green-500 object-cover" alt="preview" />
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-white/50 uppercase mb-2">Profile Photo URL</label>
                <input
                  type="text"
                  value={photoURL}
                  onChange={e => setPhotoURL(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-green-500 transition-colors"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-white/50 uppercase mb-2">Display Name</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-green-500 transition-colors"
                placeholder="Enter new username..."
              />
            </div>
          </div>
        </div>

        {/* Audio Section */}
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-6">
            <Volume2 className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold uppercase tracking-widest">Audio & Effects</h2>
          </div>
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
            <span className="text-sm">Master Volume</span>
            <input type="range" className="accent-green-500" />
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold uppercase tracking-widest">Privacy & Security</h2>
          </div>
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
            <span className="text-sm">Public Profile</span>
            <div className="w-12 h-6 bg-green-500 rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-4 bg-green-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-green-400 transition-all flex items-center justify-center gap-3"
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'SAVING...' : 'SAVE CONFIGURATION'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
