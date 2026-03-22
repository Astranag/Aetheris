import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, GearSix, Brain, Palette, Bell, ShieldCheck, SignOut } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { Switch } from '../components/ui/switch';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Settings() {
  const { user, logout } = useAuth();
  const [preferences, setPreferences] = useState({
    theme: 'dark',
    ai_suggestions: true,
    density: 'comfortable',
    ai_personality: 'creative',
    notifications: true,
    auto_save: true
  });
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(user?.name || '');

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const res = await axios.get(`${API}/users/preferences`, { withCredentials: true });
      setPreferences(prev => ({ ...prev, ...res.data }));
    } catch (err) {
      console.error(err);
    }
  };

  const savePreferences = async (newPrefs) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    try {
      await axios.put(`${API}/users/preferences`, updated, { withCredentials: true });
      toast.success('Preferences updated');
    } catch (err) {
      toast.error('Failed to save preferences');
    }
  };

  const updateProfile = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/users/profile`, { name }, { withCredentials: true });
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const densityOptions = [
    { value: 'compact', label: 'Compact' },
    { value: 'comfortable', label: 'Comfortable' },
    { value: 'spacious', label: 'Spacious' },
  ];

  const personalityOptions = [
    { value: 'creative', label: 'Creative', desc: 'Imaginative & experimental suggestions' },
    { value: 'minimal', label: 'Minimal', desc: 'Clean, focused recommendations' },
    { value: 'technical', label: 'Technical', desc: 'Detailed specs & optimization' },
  ];

  return (
    <div className="min-h-screen pt-20 pb-12 px-6 md:px-12" style={{ background: '#030303' }} data-testid="settings-page">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <span className="text-xs font-['JetBrains_Mono'] tracking-[0.2em] uppercase text-[#00F0FF] block mb-3">
            Account
          </span>
          <h1 className="font-['Unbounded'] text-3xl md:text-4xl font-bold tracking-tighter text-white">
            Settings
          </h1>
        </motion.div>

        <div className="space-y-6">
          {/* Profile */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="liquid-glass rounded-2xl p-6 md:p-8"
            data-testid="profile-section"
          >
            <div className="flex items-center gap-3 mb-6">
              <User size={20} className="text-[#00F0FF]" />
              <h2 className="font-['Unbounded'] text-sm font-bold tracking-tight text-white">Profile</h2>
            </div>
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[#00F0FF] to-[#FF0055] flex items-center justify-center flex-shrink-0">
                {user?.picture ? (
                  <img src={user.picture} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={28} className="text-white" />
                )}
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <label className="text-[10px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#71717A] block mb-2">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    data-testid="profile-name-input"
                    className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-sm text-white font-['Outfit'] focus:outline-none focus:border-[#00F0FF]/50 transition-colors duration-300"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#71717A] block mb-2">Email</label>
                  <div className="px-4 py-2.5 bg-white/3 border border-white/5 rounded-xl text-sm text-[#A1A1AA] font-['Outfit']">
                    {user?.email}
                  </div>
                </div>
                <button
                  onClick={updateProfile}
                  disabled={saving}
                  data-testid="save-profile-btn"
                  className="px-5 py-2 rounded-full bg-[#00F0FF] text-black text-xs font-['Outfit'] font-semibold hover:bg-[#66F6FF] transition-all duration-300 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          </motion.div>

          {/* AI Personalization */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="liquid-glass rounded-2xl p-6 md:p-8"
            data-testid="ai-settings-section"
          >
            <div className="flex items-center gap-3 mb-6">
              <Brain size={20} className="text-[#FF0055]" />
              <h2 className="font-['Unbounded'] text-sm font-bold tracking-tight text-white">AI Personalization</h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white font-['Outfit'] font-medium">AI Suggestions</p>
                  <p className="text-xs text-[#71717A] font-['Outfit']">Enable AI-powered recommendations</p>
                </div>
                <Switch
                  checked={preferences.ai_suggestions}
                  onCheckedChange={(checked) => savePreferences({ ai_suggestions: checked })}
                  data-testid="ai-suggestions-toggle"
                />
              </div>

              <div>
                <label className="text-[10px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#71717A] block mb-3">
                  AI Personality
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {personalityOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => savePreferences({ ai_personality: opt.value })}
                      data-testid={`ai-personality-${opt.value}`}
                      className={`p-4 rounded-xl text-left transition-all duration-300 ${
                        preferences.ai_personality === opt.value
                          ? 'bg-[#FF0055]/10 border border-[#FF0055]/30'
                          : 'bg-white/3 border border-white/5 hover:bg-white/5'
                      }`}
                    >
                      <p className={`text-xs font-['Outfit'] font-bold mb-1 ${
                        preferences.ai_personality === opt.value ? 'text-[#FF0055]' : 'text-white'
                      }`}>{opt.label}</p>
                      <p className="text-[10px] text-[#71717A] font-['Outfit']">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="liquid-glass rounded-2xl p-6 md:p-8"
            data-testid="preferences-section"
          >
            <div className="flex items-center gap-3 mb-6">
              <Palette size={20} className="text-[#E0FF00]" />
              <h2 className="font-['Unbounded'] text-sm font-bold tracking-tight text-white">Preferences</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#71717A] block mb-3">
                  UI Density
                </label>
                <div className="flex gap-2">
                  {densityOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => savePreferences({ density: opt.value })}
                      data-testid={`density-${opt.value}`}
                      className={`px-4 py-2 rounded-lg text-xs font-['Outfit'] font-medium transition-all duration-300 ${
                        preferences.density === opt.value
                          ? 'bg-[#E0FF00]/10 text-[#E0FF00] border border-[#E0FF00]/30'
                          : 'bg-white/5 text-[#A1A1AA] border border-white/5 hover:bg-white/8 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white font-['Outfit'] font-medium">Notifications</p>
                  <p className="text-xs text-[#71717A] font-['Outfit']">Design update notifications</p>
                </div>
                <Switch
                  checked={preferences.notifications}
                  onCheckedChange={(checked) => savePreferences({ notifications: checked })}
                  data-testid="notifications-toggle"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white font-['Outfit'] font-medium">Auto-Save</p>
                  <p className="text-xs text-[#71717A] font-['Outfit']">Automatically save design changes</p>
                </div>
                <Switch
                  checked={preferences.auto_save}
                  onCheckedChange={(checked) => savePreferences({ auto_save: checked })}
                  data-testid="auto-save-toggle"
                />
              </div>
            </div>
          </motion.div>

          {/* Danger */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="liquid-glass rounded-2xl p-6 md:p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck size={20} className="text-[#71717A]" />
              <h2 className="font-['Unbounded'] text-sm font-bold tracking-tight text-white">Session</h2>
            </div>
            <button
              onClick={logout}
              data-testid="settings-logout-btn"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#FF0055]/20 text-[#FF0055] text-xs font-['Outfit'] font-medium hover:bg-[#FF0055]/10 transition-all duration-300"
            >
              <SignOut size={14} /> Sign Out
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
