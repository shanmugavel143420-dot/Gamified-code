import React, { useEffect, useState, useCallback } from 'react';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, increment } from 'firebase/firestore';
import { Page } from '../App';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Edit2, Share2, Award, Zap, Target, Clock, ShieldCheck, Save, X, Camera, Image as ImageIcon, Loader2, Github, Linkedin, Heart, Sparkles, User as UserIcon, Hash } from 'lucide-react';
import { generateAITags } from '../services/aiTagsService';

interface ProfileProps {
  user: User | null;
  userData: any;
  navigate: (page: Page) => void;
  goBack: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, userData, navigate, goBack }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    uniqueId: '',
    avatar: '',
    banner: '',
    socialLinks: { github: '', linkedin: '' },
    stats: { wins: 0, accuracy: 0, avgSpeed: 0 }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [uploadingType, setUploadingType] = useState<'avatar' | 'banner' | null>(null);
  const [idAvailable, setIdAvailable] = useState<boolean | null>(null);
  const [isCheckingId, setIsCheckingId] = useState(false);
  const [liked, setLiked] = useState(false);

  const checkIdAvailability = useCallback(async (id: string) => {
    if (!id || id === userData?.uniqueId) {
      setIdAvailable(true);
      return;
    }
    setIsCheckingId(true);
    try {
      const q = query(collection(db, 'users'), where('uniqueId', '==', id.toLowerCase()));
      const querySnapshot = await getDocs(q);
      setIdAvailable(querySnapshot.empty);
    } catch (error) {
      console.error("Error checking ID:", error);
    } finally {
      setIsCheckingId(false);
    }
  }, [userData?.uniqueId]);

  useEffect(() => {
    if (formData.uniqueId && isEditing) {
      const timeoutId = setTimeout(() => checkIdAvailability(formData.uniqueId), 500);
      return () => clearTimeout(timeoutId);
    }
  }, [formData.uniqueId, isEditing, checkIdAvailability]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert("File is too large. Please select an image under 1MB.");
      return;
    }

    setUploadingType(type);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData(prev => ({ ...prev, [type]: base64String }));
      setUploadingType(null);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (userData) {
      setFormData({
        username: userData.username || '',
        uniqueId: userData.uniqueId || '',
        avatar: userData.avatar || '',
        banner: userData.banner || '',
        socialLinks: userData.socialLinks || { github: '', linkedin: '' },
        stats: {
          wins: userData.stats?.wins || 0,
          accuracy: userData.stats?.accuracy || 0,
          avgSpeed: userData.stats?.avgSpeed || 0
        }
      });
    }
  }, [userData]);

  const handleSave = async () => {
    if (!user || !idAvailable) return;
    if (!formData.username.trim() || !formData.uniqueId.trim()) {
      alert("Username and Unique ID cannot be empty.");
      return;
    }
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        username: formData.username,
        uniqueId: formData.uniqueId.toLowerCase(),
        avatar: formData.avatar,
        banner: formData.banner,
        socialLinks: formData.socialLinks,
        stats: {
          ...userData.stats,
          wins: Number(formData.stats.wins),
          accuracy: Number(formData.stats.accuracy),
          avgSpeed: Number(formData.stats.avgSpeed)
        }
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateTags = async () => {
    if (!user) return;
    setIsGeneratingTags(true);
    try {
      const tags = await generateAITags({
        wins: formData.stats.wins,
        accuracy: formData.stats.accuracy,
        avgSpeed: formData.stats.avgSpeed
      });
      
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        skillTags: tags.skillTags,
        characterTags: tags.characterTags
      });
    } catch (error) {
      console.error("Error generating tags:", error);
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const handleLike = async () => {
    if (!user || liked) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        likes: increment(1)
      });
      setLiked(true);
    } catch (error) {
      console.error("Error liking profile:", error);
    }
  };

  if (!userData) return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-8 pt-24 pb-20">
      <div className="flex justify-between items-center mb-8">
        <button onClick={goBack} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Back</span>
        </button>
        
        {isEditing ? (
          <div className="flex gap-2">
            <button 
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-2 text-xs font-bold uppercase"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving || idAvailable === false}
              className="px-4 py-2 bg-green-500 text-black rounded-xl hover:bg-green-400 transition-colors flex items-center gap-2 text-xs font-bold uppercase disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={handleLike}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-xs font-bold uppercase ${liked ? 'bg-red-500 text-white' : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'}`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} /> {userData.likes || 0} Likes
            </button>
            <button 
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-green-500 text-black rounded-xl hover:bg-green-400 transition-colors flex items-center gap-2 text-xs font-bold uppercase"
            >
              <Edit2 className="w-4 h-4" /> Edit Profile
            </button>
          </div>
        )}
      </div>

      {/* Header Card */}
      <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden mb-8 relative">
        <div className="h-48 bg-gradient-to-r from-green-900/50 to-blue-900/50 relative group">
          <img src={(isEditing ? formData.banner : userData.banner) || undefined} className="w-full h-full object-cover opacity-50 transition-opacity group-hover:opacity-40" alt="banner" />
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
          
          {isEditing && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black/80 backdrop-blur-md border border-white/20 p-4 rounded-2xl w-full max-w-xs space-y-4">
                <label className="w-full bg-green-500 text-black rounded-lg px-3 py-2 text-xs font-bold uppercase text-center cursor-pointer hover:bg-green-400 transition-colors block">
                  {uploadingType === 'banner' ? 'Uploading...' : 'Upload Banner'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'banner')} />
                </label>
                <input 
                  type="text"
                  value={formData.banner}
                  onChange={(e) => setFormData({...formData, banner: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-green-500"
                  placeholder="Or Banner URL"
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="px-8 pb-8 -mt-12 relative">
          <div className="flex flex-col md:flex-row items-end gap-6 mb-6">
            <div className="relative group">
              <img 
                src={(isEditing ? formData.avatar : userData.avatar) || undefined} 
                className="w-32 h-32 rounded-3xl border-4 border-black shadow-[0_0_30px_rgba(34,197,94,0.3)] object-cover" 
                alt="avatar" 
              />
              {isEditing && (
                <div className="absolute inset-0 bg-black/60 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-8 h-8 text-white" />
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatar')} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              )}
            </div>
            
            <div className="flex-1 pb-2 w-full">
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-white/50 mb-1 block">Username</label>
                    <input 
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-lg font-bold outline-none focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-white/50 mb-1 block flex justify-between">
                      Unique ID
                      {isCheckingId ? <Loader2 className="w-3 h-3 animate-spin" /> : (
                        idAvailable === true ? <span className="text-green-500">Available</span> : 
                        idAvailable === false ? <span className="text-red-500">Taken</span> : null
                      )}
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input 
                        type="text"
                        value={formData.uniqueId}
                        onChange={(e) => setFormData({...formData, uniqueId: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')})}
                        className={`w-full bg-white/5 border rounded-xl pl-9 pr-4 py-2 text-lg font-bold outline-none transition-colors ${idAvailable === false ? 'border-red-500' : 'border-white/20 focus:border-green-500'}`}
                        placeholder="unique-id"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter">{userData.username}</h1>
                    {userData.isVerified && <ShieldCheck className="w-6 h-6 text-blue-400" />}
                  </div>
                  <div className="flex items-center gap-2 text-white/50 font-mono text-xs uppercase tracking-widest">
                    <span>#{userData.uniqueId}</span>
                    <span>•</span>
                    <span className="text-green-500">Level {userData.level}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Social Links */}
          <div className="flex gap-4 mb-8">
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div className="relative">
                  <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input 
                    type="text"
                    value={formData.socialLinks.github}
                    onChange={(e) => setFormData({...formData, socialLinks: {...formData.socialLinks, github: e.target.value}})}
                    className="w-full bg-white/5 border border-white/20 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-green-500"
                    placeholder="GitHub URL"
                  />
                </div>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input 
                    type="text"
                    value={formData.socialLinks.linkedin}
                    onChange={(e) => setFormData({...formData, socialLinks: {...formData.socialLinks, linkedin: e.target.value}})}
                    className="w-full bg-white/5 border border-white/20 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-green-500"
                    placeholder="LinkedIn URL"
                  />
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                {userData.socialLinks?.github && (
                  <a href={userData.socialLinks.github} target="_blank" rel="noreferrer" className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
                    <Github className="w-5 h-5" />
                  </a>
                )}
                {userData.socialLinks?.linkedin && (
                  <a href={userData.socialLinks.linkedin} target="_blank" rel="noreferrer" className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* AI Tags Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">AI Generated Tags</h3>
              </div>
              {!isEditing && (
                <button 
                  onClick={handleGenerateTags}
                  disabled={isGeneratingTags}
                  className="text-[10px] font-bold uppercase tracking-widest text-green-500 hover:text-green-400 transition-colors flex items-center gap-1"
                >
                  {isGeneratingTags ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Regenerate Tags
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase text-white/30 mb-2">Skill Badges</p>
                <div className="flex flex-wrap gap-2">
                  {userData.skillTags?.map((tag: string) => (
                    <span key={tag} className="px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-500 text-[10px] font-bold uppercase tracking-widest rounded-full">
                      {tag}
                    </span>
                  ))}
                  {(!userData.skillTags || userData.skillTags.length === 0) && <span className="text-xs text-white/20 italic">No skill tags generated yet...</span>}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-white/30 mb-2">Character Traits</p>
                <div className="flex flex-wrap gap-2">
                  {userData.characterTags?.map((tag: string) => (
                    <span key={tag} className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-500 text-[10px] font-bold uppercase tracking-widest rounded-full">
                      {tag}
                    </span>
                  ))}
                  {(!userData.characterTags || userData.characterTags.length === 0) && <span className="text-xs text-white/20 italic">No character tags generated yet...</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2 text-white/50 mb-1">
                <Award className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase">Rank</span>
              </div>
              <p className="text-xl font-black text-green-500 italic">{userData.rank}</p>
            </div>
            
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2 text-white/50 mb-1">
                <Zap className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase">Wins</span>
              </div>
              {isEditing ? (
                <input 
                  type="number"
                  value={formData.stats.wins}
                  onChange={(e) => setFormData({...formData, stats: {...formData.stats, wins: parseInt(e.target.value)}})}
                  className="w-full bg-transparent text-xl font-black italic outline-none text-white"
                />
              ) : (
                <p className="text-xl font-black italic">{userData.stats?.wins || 0}</p>
              )}
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2 text-white/50 mb-1">
                <Target className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase">Accuracy</span>
              </div>
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <input 
                    type="number"
                    value={formData.stats.accuracy}
                    onChange={(e) => setFormData({...formData, stats: {...formData.stats, accuracy: parseInt(e.target.value)}})}
                    className="w-full bg-transparent text-xl font-black italic outline-none text-white"
                  />
                  <span className="text-xl font-black italic">%</span>
                </div>
              ) : (
                <p className="text-xl font-black italic">{userData.stats?.accuracy || 0}%</p>
              )}
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2 text-white/50 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase">Avg Speed</span>
              </div>
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <input 
                    type="number"
                    value={formData.stats.avgSpeed}
                    onChange={(e) => setFormData({...formData, stats: {...formData.stats, avgSpeed: parseInt(e.target.value)}})}
                    className="w-full bg-transparent text-xl font-black italic outline-none text-white"
                  />
                  <span className="text-xl font-black italic">s</span>
                </div>
              ) : (
                <p className="text-xl font-black italic">{userData.stats?.avgSpeed || 0}s</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Matches */}
      <h3 className="text-xl font-black italic uppercase tracking-tighter mb-4">Recent Combat History</h3>
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-black/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-500 font-bold">W</div>
              <div>
                <p className="font-bold text-sm uppercase tracking-widest">Ranked 1v1 Victory</p>
                <p className="text-[10px] text-white/30 font-mono uppercase">2 hours ago • vs Player_X92</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-green-500 font-bold">+24 RP</p>
              <p className="text-[10px] text-white/30 uppercase font-mono">Accuracy: 98%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Profile;
