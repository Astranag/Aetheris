import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Users, Cube, Brain, ChartBar, Clock, Eye, Vault,
  SignOut, CaretDown, CaretUp, ChatCircle, File, Lightning
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StatCard = ({ icon: Icon, label, value, color, testId }) => (
  <div className="liquid-glass rounded-xl p-5 relative overflow-hidden" data-testid={testId}>
    <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-[40px]" style={{ background: `${color}10` }} />
    <div className="relative z-10">
      <Icon size={20} className="mb-3" style={{ color }} aria-hidden="true" />
      <p className="font-['JetBrains_Mono'] text-2xl font-bold text-white">{value}</p>
      <p className="text-[10px] font-['Outfit'] text-[#71717A] mt-1">{label}</p>
    </div>
  </div>
);

const DataTable = ({ title, columns, rows, testId }) => {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="liquid-glass rounded-xl overflow-hidden" data-testid={testId}>
      <button onClick={() => setExpanded(!expanded)} className="w-full px-5 py-3 flex items-center justify-between border-b border-white/5 hover:bg-white/[0.02] transition-colors"
        aria-expanded={expanded} aria-label={`Toggle ${title}`}>
        <h3 className="text-xs font-['Unbounded'] font-bold text-white">{title}</h3>
        {expanded ? <CaretUp size={14} className="text-[#71717A]" /> : <CaretDown size={14} className="text-[#71717A]" />}
      </button>
      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-['Outfit']" role="table">
            <thead>
              <tr className="border-b border-white/5">
                {columns.map((col, i) => (
                  <th key={i} className="px-4 py-2.5 text-left text-[9px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#71717A] font-normal">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-2.5 text-[#A1A1AA] max-w-[200px] truncate">{cell}</td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-[#71717A]">No data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem('aetheris_admin_token'));
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [chats, setChats] = useState([]);
  const [activity, setActivity] = useState({ admin_actions: [], user_tracking: [] });
  const [ontology, setOntology] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const authHeaders = { Authorization: `Bearer ${token}` };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const res = await axios.post(`${API}/admin/login`, { email: loginEmail, password: loginPass });
      localStorage.setItem('aetheris_admin_token', res.data.token);
      setToken(res.data.token);
      toast.success('Admin authenticated');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('aetheris_admin_token');
    setToken(null);
    toast.success('Logged out');
  };

  const fetchAll = useCallback(async () => {
    if (!token) return;
    try {
      const [statsRes, usersRes, designsRes, chatsRes, activityRes, ontRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { headers: authHeaders }),
        axios.get(`${API}/admin/users`, { headers: authHeaders }),
        axios.get(`${API}/admin/designs`, { headers: authHeaders }),
        axios.get(`${API}/admin/chat-history`, { headers: authHeaders }),
        axios.get(`${API}/admin/activity`, { headers: authHeaders }),
        axios.get(`${API}/admin/ontology`, { headers: authHeaders }),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setDesigns(designsRes.data);
      setChats(chatsRes.data);
      setActivity(activityRes.data);
      setOntology(ontRes.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('aetheris_admin_token');
        setToken(null);
        toast.error('Session expired');
      }
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [token, fetchAll]);

  // LOGIN SCREEN
  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6" style={{ background: '#000' }} role="main" aria-label="Admin Login">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="text-center mb-8">
            <ShieldCheck size={40} className="text-[#FF0055] mx-auto mb-4" aria-hidden="true" />
            <h1 className="font-['Unbounded'] text-xl font-bold text-white mb-1">Admin Deck</h1>
            <p className="text-xs text-[#71717A] font-['Outfit']">Aetheris Spatial Intelligence</p>
          </div>
          <form onSubmit={handleLogin} className="liquid-glass rounded-2xl p-6 space-y-4" data-testid="admin-login-form">
            <div>
              <label htmlFor="admin-email" className="text-[9px] font-['JetBrains_Mono'] tracking-[0.2em] uppercase text-[#71717A] block mb-2">Email</label>
              <input id="admin-email" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required
                data-testid="admin-email-input"
                className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-sm text-white font-['Outfit'] focus:outline-none focus:border-[#FF0055]/50 transition-colors" />
            </div>
            <div>
              <label htmlFor="admin-pass" className="text-[9px] font-['JetBrains_Mono'] tracking-[0.2em] uppercase text-[#71717A] block mb-2">Password</label>
              <input id="admin-pass" type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} required
                data-testid="admin-password-input"
                className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-sm text-white font-['Outfit'] focus:outline-none focus:border-[#FF0055]/50 transition-colors" />
            </div>
            <button type="submit" disabled={loginLoading} data-testid="admin-login-btn"
              className="w-full py-3 rounded-xl font-['Outfit'] font-semibold text-sm bg-[#FF0055] text-white hover:bg-[#FF0055]/80 transition-colors disabled:opacity-50">
              {loginLoading ? 'Authenticating...' : 'Enter Admin Deck'}
            </button>
          </form>
        </motion.div>
      </main>
    );
  }

  // DASHBOARD
  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBar },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'designs', label: 'Designs', icon: Vault },
    { id: 'ai', label: 'AI Chats', icon: Brain },
    { id: 'activity', label: 'Activity', icon: Clock },
    { id: 'ontology', label: 'Ontology', icon: Cube },
  ];

  return (
    <main className="min-h-screen" style={{ background: '#000' }} role="main" aria-label="Admin Dashboard" data-testid="admin-dashboard">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 liquid-glass h-14 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <ShieldCheck size={20} className="text-[#FF0055]" aria-hidden="true" />
          <span className="font-['Unbounded'] text-xs font-bold text-white">ADMIN DECK</span>
          <span className="text-[8px] font-['JetBrains_Mono'] text-[#71717A] ml-2">
            {stats ? `${stats.timestamp?.slice(0, 19)}Z` : '...'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-['JetBrains_Mono'] text-[#A1A1AA]">{ADMIN_EMAIL_DISPLAY}</span>
          <button onClick={handleLogout} data-testid="admin-logout-btn" aria-label="Admin logout"
            className="p-2 rounded-lg text-[#71717A] hover:text-[#FF0055] hover:bg-[#FF0055]/10 transition-colors">
            <SignOut size={16} />
          </button>
        </div>
      </div>

      <div className="pt-14 flex">
        {/* Sidebar */}
        <nav className="w-48 min-h-[calc(100vh-56px)] border-r border-white/5 p-3 flex-shrink-0" style={{ background: '#020202' }} aria-label="Admin navigation">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} data-testid={`admin-tab-${tab.id}`}
              aria-pressed={activeTab === tab.id}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-['Outfit'] mb-1 transition-colors ${
                activeTab === tab.id ? 'bg-[#FF0055]/10 text-[#FF0055] font-medium' : 'text-[#71717A] hover:text-white hover:bg-white/5'
              }`}>
              <tab.icon size={14} aria-hidden="true" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 56px)' }}>
          {/* OVERVIEW */}
          {activeTab === 'overview' && stats && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h2 className="font-['Unbounded'] text-lg font-bold text-white">System Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard icon={Users} label="Total Users" value={stats.total_users} color="#00F0FF" testId="stat-users" />
                <StatCard icon={Vault} label="Designs" value={stats.total_designs} color="#E0FF00" testId="stat-designs" />
                <StatCard icon={Cube} label="Products" value={stats.total_products} color="#00F0FF" testId="stat-products" />
                <StatCard icon={Brain} label="AI Chats" value={stats.total_ai_chats} color="#FF0055" testId="stat-chats" />
                <StatCard icon={Lightning} label="Sessions" value={stats.active_sessions} color="#ffb347" testId="stat-sessions" />
                <StatCard icon={File} label="Files" value={stats.total_files} color="#2d5a27" testId="stat-files" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="liquid-glass rounded-xl p-4">
                  <p className="text-[9px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#71717A] mb-2">Ontology</p>
                  <div className="space-y-1 text-xs text-[#A1A1AA] font-['Outfit']">
                    <p>Shapes: <span className="text-[#00F0FF]">{stats.ontology_shapes}</span></p>
                    <p>Materials: <span className="text-[#E0FF00]">{stats.ontology_materials}</span></p>
                    <p>Colors: <span className="text-[#FF0055]">{stats.ontology_colors}</span></p>
                  </div>
                </div>
                <div className="liquid-glass rounded-xl p-4">
                  <p className="text-[9px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#71717A] mb-2">Categories</p>
                  <div className="flex flex-wrap gap-1">
                    {stats.categories?.map(c => (
                      <span key={c} className="px-2 py-0.5 rounded text-[9px] bg-white/5 text-[#A1A1AA] font-['JetBrains_Mono']">{c}</span>
                    ))}
                  </div>
                </div>
                <div className="liquid-glass rounded-xl p-4">
                  <p className="text-[9px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#71717A] mb-2">Dimensional Extensions</p>
                  <div className="space-y-1 text-[10px] text-[#A1A1AA] font-['Outfit']">
                    {['4D temporal', 'n-D parameter', 'topological', 'procedural'].map(d => (
                      <div key={d} className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]" /> {d}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Recent activity tables */}
              <DataTable title="Recent Designs" testId="recent-designs-table"
                columns={['Name', 'Product', 'Collection', 'Version', 'Date']}
                rows={stats.recent_designs?.map(d => [d.name, d.product_id, d.collection || 'Default', `v${d.version}`, d.created_at?.slice(0, 10)]) || []} />
              <DataTable title="Recent AI Conversations" testId="recent-chats-table"
                columns={['User', 'Product', 'Message', 'Date']}
                rows={stats.recent_chats?.map(c => [c.user_id?.slice(0, 12), c.product_id || '-', c.user_message?.slice(0, 60), c.created_at?.slice(0, 10)]) || []} />
            </motion.div>
          )}

          {/* USERS */}
          {activeTab === 'users' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h2 className="font-['Unbounded'] text-lg font-bold text-white">Users ({users.length})</h2>
              <DataTable title="All Users" testId="users-table"
                columns={['Name', 'Email', 'Designs', 'Chats', 'Joined']}
                rows={users.map(u => [u.name || '-', u.email, u.design_count, u.chat_count, u.created_at?.slice(0, 10)])} />
            </motion.div>
          )}

          {/* DESIGNS */}
          {activeTab === 'designs' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h2 className="font-['Unbounded'] text-lg font-bold text-white">Designs ({designs.length})</h2>
              <DataTable title="All Designs" testId="designs-table"
                columns={['Name', 'User', 'Product', 'Shape', 'Color', 'Material', 'Version', 'Date']}
                rows={designs.map(d => [d.name, d.user_id?.slice(0, 12), d.product_id, d.configuration?.shape || '-', d.configuration?.color || '-', d.configuration?.material || '-', `v${d.version}`, d.updated_at?.slice(0, 10)])} />
            </motion.div>
          )}

          {/* AI CHATS */}
          {activeTab === 'ai' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h2 className="font-['Unbounded'] text-lg font-bold text-white">AI Conversations ({chats.length})</h2>
              <div className="space-y-3">
                {chats.map((c, i) => (
                  <div key={c.chat_id || i} className="liquid-glass rounded-xl p-4" data-testid={`chat-entry-${i}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] font-['JetBrains_Mono'] text-[#71717A]">{c.user_id?.slice(0, 12)}</span>
                      <span className="text-[9px] text-[#71717A]">|</span>
                      <span className="text-[9px] font-['JetBrains_Mono'] text-[#00F0FF]">{c.product_id || 'general'}</span>
                      <span className="ml-auto text-[9px] font-['JetBrains_Mono'] text-[#71717A]">{c.created_at?.slice(0, 19)}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="px-3 py-2 rounded-lg bg-[#00F0FF]/5 border border-[#00F0FF]/10">
                        <span className="text-[8px] font-['JetBrains_Mono'] text-[#00F0FF]/60">USER</span>
                        <p className="text-xs text-[#e0e0e0] font-['Outfit']">{c.user_message}</p>
                      </div>
                      <div className="px-3 py-2 rounded-lg bg-[#FF0055]/5 border border-[#FF0055]/10">
                        <span className="text-[8px] font-['JetBrains_Mono'] text-[#FF0055]/60">AGENT</span>
                        <p className="text-xs text-[#A1A1AA] font-['Outfit'] line-clamp-4">{c.ai_response?.slice(0, 300)}{c.ai_response?.length > 300 ? '...' : ''}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {chats.length === 0 && <p className="text-center text-[#71717A] text-sm font-['Outfit'] py-12">No AI conversations yet</p>}
              </div>
            </motion.div>
          )}

          {/* ACTIVITY */}
          {activeTab === 'activity' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h2 className="font-['Unbounded'] text-lg font-bold text-white">Activity Log</h2>
              <DataTable title="Admin Actions" testId="admin-actions-table"
                columns={['Action', 'Email', 'Timestamp']}
                rows={activity.admin_actions?.map(a => [a.action, a.email || '-', a.timestamp?.slice(0, 19)]) || []} />
              <DataTable title="User Tracking" testId="user-tracking-table"
                columns={['Event', 'Product', 'User', 'Timestamp']}
                rows={activity.user_tracking?.map(t => [t.event, t.product_id || '-', t.user_id?.slice(0, 12) || 'anon', t.timestamp?.slice(0, 19)]) || []} />
            </motion.div>
          )}

          {/* ONTOLOGY */}
          {activeTab === 'ontology' && ontology && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h2 className="font-['Unbounded'] text-lg font-bold text-white">Aetheris Ontology</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="liquid-glass rounded-xl p-5">
                  <h3 className="text-[10px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#00F0FF] mb-3">Shapes</h3>
                  <div className="flex flex-wrap gap-2">
                    {ontology.shapes?.map(s => (
                      <span key={s} className="px-3 py-1.5 rounded-lg text-xs font-['Outfit'] bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="liquid-glass rounded-xl p-5">
                  <h3 className="text-[10px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#E0FF00] mb-3">Materials</h3>
                  <div className="flex flex-wrap gap-2">
                    {ontology.materials?.map(m => (
                      <span key={m} className="px-3 py-1.5 rounded-lg text-xs font-['Outfit'] bg-[#E0FF00]/10 text-[#E0FF00] border border-[#E0FF00]/20">{m}</span>
                    ))}
                  </div>
                </div>
                <div className="liquid-glass rounded-xl p-5">
                  <h3 className="text-[10px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#FF0055] mb-3">Colors</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(ontology.colors || {}).map(([name, hex]) => (
                      <div key={name} className="text-center">
                        <div className="w-10 h-10 rounded-lg mx-auto border border-white/10" style={{ background: hex }} />
                        <span className="text-[8px] text-[#71717A] font-['JetBrains_Mono'] mt-1 block">{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="liquid-glass rounded-xl p-5">
                  <h3 className="text-[10px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#71717A] mb-3">Dimensional Extensions</h3>
                  <div className="space-y-2">
                    {ontology.dimensional_extensions?.map(d => (
                      <div key={d} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5">
                        <div className="w-2 h-2 rounded-full bg-[#FF0055]" />
                        <span className="text-xs text-[#A1A1AA] font-['Outfit']">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="liquid-glass rounded-xl p-5 md:col-span-2">
                  <h3 className="text-[10px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#71717A] mb-3">Sustainability Vectors</h3>
                  <div className="grid grid-cols-5 gap-3">
                    {Object.entries(ontology.sustainability_vectors || {}).map(([key, val]) => (
                      <div key={key} className="text-center px-2 py-3 rounded-lg bg-white/[0.02] border border-white/5">
                        <span className="text-[#E0FF00] text-xs font-['JetBrains_Mono'] font-bold">{val}</span>
                        <span className="text-[8px] text-[#71717A] font-['Outfit'] block mt-1">{key.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}

const ADMIN_EMAIL_DISPLAY = "meta360d@gmail.com";
