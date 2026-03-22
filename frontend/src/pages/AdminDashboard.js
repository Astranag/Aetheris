import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ShieldCheck, Users, Cube, Brain, ChartBar, Clock, Eye,
  SignOut, CaretDown, CaretUp, Lightning, File, Lock,
  Pulse, Database, Cpu, HardDrive, Globe, Fingerprint,
  Terminal, X, Plus, Minus, ArrowClockwise
} from '@phosphor-icons/react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/* ─── Reusable Components ─── */
const StatCard = ({ icon: Icon, label, value, color, testId }) => (
  <div className="liquid-glass rounded-xl p-5 relative overflow-hidden group hover:border-white/15 transition-all duration-300" data-testid={testId}>
    <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity" style={{ background: color }} />
    <div className="relative z-10">
      <Icon size={18} className="mb-3 opacity-70" style={{ color }} weight="bold" />
      <p className="font-['JetBrains_Mono'] text-2xl font-bold text-white tracking-tight">{value ?? '—'}</p>
      <p className="text-[10px] font-['Outfit'] text-[#71717A] mt-1.5 uppercase tracking-wider">{label}</p>
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

const StatusDot = ({ status }) => {
  const colors = { operational: '#22c55e', degraded: '#eab308', down: '#ef4444' };
  return <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: colors[status] || colors.operational, boxShadow: `0 0 6px ${colors[status] || colors.operational}` }} />;
};

const CHART_COLORS = ['#00F0FF', '#FF0055', '#E0FF00', '#ffb347', '#0066FF', '#2d5a27'];

/* ─── Main Dashboard ─── */
export default function AdminDashboard() {
  const [token, setToken] = useState(localStorage.getItem('aetheris_admin_token'));
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showConsole, setShowConsole] = useState(false);

  // Data stores
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [chats, setChats] = useState([]);
  const [activity, setActivity] = useState({ admin_actions: [], user_tracking: [] });
  const [ontology, setOntology] = useState(null);
  const [securityLogs, setSecurityLogs] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);

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
      const results = await Promise.allSettled([
        axios.get(`${API}/admin/stats`, { headers: authHeaders }),
        axios.get(`${API}/admin/users`, { headers: authHeaders }),
        axios.get(`${API}/admin/designs`, { headers: authHeaders }),
        axios.get(`${API}/admin/chat-history`, { headers: authHeaders }),
        axios.get(`${API}/admin/activity`, { headers: authHeaders }),
        axios.get(`${API}/admin/ontology`, { headers: authHeaders }),
        axios.get(`${API}/admin/security-logs`, { headers: authHeaders }),
        axios.get(`${API}/admin/system-health`, { headers: authHeaders }),
      ]);
      if (results[0].status === 'fulfilled') setStats(results[0].value.data);
      if (results[1].status === 'fulfilled') setUsers(results[1].value.data);
      if (results[2].status === 'fulfilled') setDesigns(results[2].value.data);
      if (results[3].status === 'fulfilled') setChats(results[3].value.data);
      if (results[4].status === 'fulfilled') setActivity(results[4].value.data);
      if (results[5].status === 'fulfilled') setOntology(results[5].value.data);
      if (results[6].status === 'fulfilled') setSecurityLogs(results[6].value.data);
      if (results[7].status === 'fulfilled') setSystemHealth(results[7].value.data);
      // Check for auth failures
      const authFailed = results.some(r => r.status === 'rejected' && r.reason?.response?.status === 401);
      if (authFailed) {
        localStorage.removeItem('aetheris_admin_token');
        setToken(null);
        toast.error('Session expired');
      }
    } catch {
      // silent
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [token, fetchAll]);

  // Secret key combo for Dimensional Console: Ctrl+Shift+D
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowConsole(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  /* ═══ LOGIN SCREEN ═══ */
  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6" style={{ background: '#000' }} role="main" aria-label="Admin Login">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="text-center mb-8">
            <ShieldCheck size={40} className="text-[#FF0055] mx-auto mb-4" />
            <h1 className="font-['Unbounded'] text-xl font-bold text-white mb-1">Admin Control Nexus</h1>
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
              {loginLoading ? 'Authenticating...' : 'Enter Control Nexus'}
            </button>
          </form>
        </motion.div>
      </main>
    );
  }

  /* ═══ TAB DEFINITIONS ═══ */
  const tabs = [
    { id: 'overview', label: 'System Overview', icon: ChartBar },
    { id: 'users', label: 'User Intelligence', icon: Users },
    { id: 'designs', label: 'Design & Products', icon: Cube },
    { id: 'ai', label: 'AI Agent Control', icon: Brain },
    { id: 'spatial', label: 'Spatial Analytics', icon: Pulse },
    { id: 'security', label: 'Security & Compliance', icon: Lock },
  ];

  /* ═══ CHART DATA TRANSFORMS ═══ */
  const userActivityChart = users.slice(0, 10).map(u => ({
    name: (u.name || u.email || '').slice(0, 12),
    designs: u.design_count || 0,
    chats: u.chat_count || 0,
  }));

  const categoryDistribution = stats?.categories?.map((cat, i) => ({ name: cat, value: 1, fill: CHART_COLORS[i % CHART_COLORS.length] })) || [];

  const chatTimeline = chats.slice(0, 20).reverse().map((c, i) => ({
    idx: i + 1,
    msgLen: c.user_message?.length || 0,
    resLen: (c.ai_response?.length || 0) / 10,
  }));

  /* ═══ DASHBOARD ═══ */
  return (
    <main className="min-h-screen" style={{ background: '#000' }} role="main" aria-label="Admin Dashboard" data-testid="admin-dashboard">
      {/* ── Top Bar ── */}
      <div className="fixed top-0 left-0 right-0 z-50 liquid-glass h-14 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <ShieldCheck size={20} className="text-[#FF0055]" />
          <span className="font-['Unbounded'] text-xs font-bold text-white">ADMIN NEXUS</span>
          <span className="text-[8px] font-['JetBrains_Mono'] text-[#71717A] ml-2">
            {systemHealth ? <><StatusDot status={systemHealth.uptime_status} />{systemHealth.uptime_status}</> : '...'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => fetchAll()} className="p-2 rounded-lg text-[#71717A] hover:text-[#00F0FF] hover:bg-[#00F0FF]/10 transition-colors" aria-label="Refresh" data-testid="admin-refresh-btn">
            <ArrowClockwise size={14} />
          </button>
          <span className="text-[10px] font-['JetBrains_Mono'] text-[#A1A1AA]">meta360d@gmail.com</span>
          <button onClick={handleLogout} data-testid="admin-logout-btn" aria-label="Admin logout"
            className="p-2 rounded-lg text-[#71717A] hover:text-[#FF0055] hover:bg-[#FF0055]/10 transition-colors">
            <SignOut size={16} />
          </button>
        </div>
      </div>

      <div className="pt-14 flex">
        {/* ── Sidebar ── */}
        <nav className="w-52 min-h-[calc(100vh-56px)] border-r border-white/5 p-3 flex-shrink-0" style={{ background: '#020202' }} aria-label="Admin navigation">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} data-testid={`admin-tab-${tab.id}`}
              aria-pressed={activeTab === tab.id}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-['Outfit'] mb-1 transition-all duration-200 ${
                activeTab === tab.id ? 'bg-[#FF0055]/10 text-[#FF0055] font-medium border border-[#FF0055]/20' : 'text-[#71717A] hover:text-white hover:bg-white/5'
              }`}>
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
          {/* Dimensional Console hint */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <button onClick={() => setShowConsole(true)} data-testid="admin-console-btn"
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[10px] font-['JetBrains_Mono'] text-[#71717A]/40 hover:text-[#FF0055]/60 hover:bg-[#FF0055]/5 transition-all">
              <Terminal size={12} />
              <span>Ctrl+Shift+D</span>
            </button>
          </div>
        </nav>

        {/* ── Content Area ── */}
        <div className="flex-1 p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 56px)' }}>
          <AnimatePresence mode="wait">

            {/* ════ PANEL 1: SYSTEM OVERVIEW ════ */}
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-['Unbounded'] text-lg font-bold text-white">System Overview & Health</h2>
                  <span className="text-[9px] font-['JetBrains_Mono'] text-[#71717A]">{stats?.timestamp?.slice(0, 19)}Z</span>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <StatCard icon={Users} label="Total Users" value={stats?.total_users} color="#00F0FF" testId="stat-users" />
                  <StatCard icon={Cube} label="Designs" value={stats?.total_designs} color="#E0FF00" testId="stat-designs" />
                  <StatCard icon={Database} label="Products" value={stats?.total_products} color="#00F0FF" testId="stat-products" />
                  <StatCard icon={Brain} label="AI Chats" value={stats?.total_ai_chats} color="#FF0055" testId="stat-chats" />
                  <StatCard icon={Lightning} label="Sessions" value={stats?.active_sessions} color="#ffb347" testId="stat-sessions" />
                  <StatCard icon={File} label="Files" value={stats?.total_files} color="#2d5a27" testId="stat-files" />
                </div>

                {/* System Health Metrics */}
                {systemHealth && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="liquid-glass rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Cpu size={14} className="text-[#00F0FF]" />
                        <span className="text-[9px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#71717A]">CPU</span>
                      </div>
                      <p className="text-xl font-['JetBrains_Mono'] font-bold text-white">{systemHealth.cpu_percent}%</p>
                      <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${systemHealth.cpu_percent}%`, background: systemHealth.cpu_percent > 80 ? '#ef4444' : '#00F0FF' }} />
                      </div>
                    </div>
                    <div className="liquid-glass rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Pulse size={14} className="text-[#E0FF00]" />
                        <span className="text-[9px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#71717A]">Memory</span>
                      </div>
                      <p className="text-xl font-['JetBrains_Mono'] font-bold text-white">{systemHealth.memory_percent}%</p>
                      <p className="text-[9px] text-[#71717A] font-['JetBrains_Mono'] mt-1">{systemHealth.memory_used_mb}MB / {systemHealth.memory_total_mb}MB</p>
                      <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${systemHealth.memory_percent}%`, background: systemHealth.memory_percent > 80 ? '#ef4444' : '#E0FF00' }} />
                      </div>
                    </div>
                    <div className="liquid-glass rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <HardDrive size={14} className="text-[#ffb347]" />
                        <span className="text-[9px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#71717A]">Disk</span>
                      </div>
                      <p className="text-xl font-['JetBrains_Mono'] font-bold text-white">{systemHealth.disk_percent}%</p>
                      <p className="text-[9px] text-[#71717A] font-['JetBrains_Mono'] mt-1">{systemHealth.disk_used_gb}GB / {systemHealth.disk_total_gb}GB</p>
                      <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${systemHealth.disk_percent}%`, background: systemHealth.disk_percent > 80 ? '#ef4444' : '#ffb347' }} />
                      </div>
                    </div>
                    <div className="liquid-glass rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Database size={14} className="text-[#FF0055]" />
                        <span className="text-[9px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#71717A]">Database</span>
                      </div>
                      <p className="text-xl font-['JetBrains_Mono'] font-bold text-white">{systemHealth.db_size_mb}MB</p>
                      <p className="text-[9px] text-[#71717A] font-['JetBrains_Mono'] mt-1">{systemHealth.db_collections} collections / {systemHealth.db_objects} objects</p>
                    </div>
                  </div>
                )}

                {/* Ontology Summary + Categories */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="liquid-glass rounded-xl p-4">
                    <p className="text-[9px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#71717A] mb-2">Ontology</p>
                    <div className="space-y-1 text-xs text-[#A1A1AA] font-['Outfit']">
                      <p>Shapes: <span className="text-[#00F0FF]">{stats?.ontology_shapes}</span></p>
                      <p>Materials: <span className="text-[#E0FF00]">{stats?.ontology_materials}</span></p>
                      <p>Colors: <span className="text-[#FF0055]">{stats?.ontology_colors}</span></p>
                    </div>
                  </div>
                  <div className="liquid-glass rounded-xl p-4">
                    <p className="text-[9px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#71717A] mb-2">Categories</p>
                    <div className="flex flex-wrap gap-1">
                      {stats?.categories?.map(c => (
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

                {/* Recent Tables */}
                <DataTable title="Recent Designs" testId="recent-designs-table"
                  columns={['Name', 'Product', 'Collection', 'Version', 'Date']}
                  rows={stats?.recent_designs?.map(d => [d.name, d.product_id, d.collection || 'Default', `v${d.version}`, d.created_at?.slice(0, 10)]) || []} />
                <DataTable title="Recent AI Conversations" testId="recent-chats-table"
                  columns={['User', 'Product', 'Message', 'Date']}
                  rows={stats?.recent_chats?.map(c => [c.user_id?.slice(0, 12), c.product_id || '-', c.user_message?.slice(0, 60), c.created_at?.slice(0, 10)]) || []} />
              </motion.div>
            )}

            {/* ════ PANEL 2: USER INTELLIGENCE MATRIX ════ */}
            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-['Unbounded'] text-lg font-bold text-white">User Intelligence Matrix</h2>
                  <span className="text-xs text-[#71717A] font-['Outfit']">{users.length} registered users</span>
                </div>

                {/* User Activity Chart */}
                {userActivityChart.length > 0 && (
                  <div className="liquid-glass rounded-xl p-5">
                    <h3 className="text-[10px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#71717A] mb-4">User Engagement</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={userActivityChart}>
                        <XAxis dataKey="name" tick={{ fill: '#71717A', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#71717A', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontFamily: 'Outfit', fontSize: 11 }} />
                        <Bar dataKey="designs" fill="#00F0FF" radius={[4, 4, 0, 0]} name="Designs" />
                        <Bar dataKey="chats" fill="#FF0055" radius={[4, 4, 0, 0]} name="AI Chats" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <DataTable title="All Users" testId="users-table"
                  columns={['Name', 'Email', 'Designs', 'AI Chats', 'Joined']}
                  rows={users.map(u => [u.name || '-', u.email, u.design_count, u.chat_count, u.created_at?.slice(0, 10)])} />
              </motion.div>
            )}

            {/* ════ PANEL 3: DESIGN & PRODUCT MANAGEMENT ════ */}
            {activeTab === 'designs' && (
              <motion.div key="designs" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-['Unbounded'] text-lg font-bold text-white">Design & Product Management</h2>
                  <span className="text-xs text-[#71717A] font-['Outfit']">{designs.length} designs / {stats?.total_products || 0} products</span>
                </div>

                {/* Category Distribution */}
                {categoryDistribution.length > 0 && (
                  <div className="liquid-glass rounded-xl p-5">
                    <h3 className="text-[10px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#71717A] mb-4">Product Categories</h3>
                    <div className="flex items-center gap-8">
                      <ResponsiveContainer width={160} height={160}>
                        <PieChart>
                          <Pie data={categoryDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value" stroke="none">
                            {categoryDistribution.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2">
                        {categoryDistribution.map((c, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c.fill }} />
                            <span className="text-xs text-[#A1A1AA] font-['Outfit']">{c.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <DataTable title="All Designs" testId="designs-table"
                  columns={['Name', 'User', 'Product', 'Shape', 'Color', 'Material', 'Ver', 'Date']}
                  rows={designs.map(d => [d.name, d.user_id?.slice(0, 12), d.product_id, d.configuration?.shape || '-', d.configuration?.color || '-', d.configuration?.material || '-', `v${d.version}`, d.updated_at?.slice(0, 10)])} />
              </motion.div>
            )}

            {/* ════ PANEL 4: AI AGENT CONTROL CENTER ════ */}
            {activeTab === 'ai' && (
              <motion.div key="ai" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-['Unbounded'] text-lg font-bold text-white">AI Agent Control Center</h2>
                  <span className="text-xs text-[#71717A] font-['Outfit']">{chats.length} conversations</span>
                </div>

                {/* Agent Modes Readout */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {['Design Agent', 'Material Agent', 'Style Agent', 'Spatial Agent', 'Generative Agent'].map((mode, i) => (
                    <div key={mode} className="liquid-glass rounded-xl p-4 text-center">
                      <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: `${CHART_COLORS[i]}15`, border: `1px solid ${CHART_COLORS[i]}30` }}>
                        <Brain size={14} style={{ color: CHART_COLORS[i] }} />
                      </div>
                      <p className="text-[9px] font-['JetBrains_Mono'] text-[#A1A1AA]">{mode}</p>
                      <StatusDot status="operational" />
                      <span className="text-[8px] text-[#71717A]">Active</span>
                    </div>
                  ))}
                </div>

                {/* Chat Volume Timeline */}
                {chatTimeline.length > 0 && (
                  <div className="liquid-glass rounded-xl p-5">
                    <h3 className="text-[10px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#71717A] mb-4">Conversation Flow</h3>
                    <ResponsiveContainer width="100%" height={140}>
                      <AreaChart data={chatTimeline}>
                        <XAxis dataKey="idx" tick={{ fill: '#71717A', fontSize: 8 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 10 }} />
                        <Area type="monotone" dataKey="msgLen" stroke="#00F0FF" fill="#00F0FF" fillOpacity={0.1} name="User Msg Length" />
                        <Area type="monotone" dataKey="resLen" stroke="#FF0055" fill="#FF0055" fillOpacity={0.1} name="AI Response (x10)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Chat Log */}
                <div className="space-y-3">
                  <h3 className="text-xs font-['Unbounded'] font-bold text-white">Recent Conversations</h3>
                  {chats.slice(0, 10).map((c, i) => (
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
                        {c.action_payload && (
                          <div className="px-3 py-2 rounded-lg bg-[#E0FF00]/5 border border-[#E0FF00]/10">
                            <span className="text-[8px] font-['JetBrains_Mono'] text-[#E0FF00]/60">ACTION PAYLOAD</span>
                            <pre className="text-[10px] text-[#A1A1AA] font-['JetBrains_Mono'] mt-1 overflow-x-auto">{JSON.stringify(c.action_payload, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {chats.length === 0 && <p className="text-center text-[#71717A] text-sm font-['Outfit'] py-12">No AI conversations yet</p>}
                </div>
              </motion.div>
            )}

            {/* ════ PANEL 5: SPATIAL INTELLIGENCE ANALYTICS ════ */}
            {activeTab === 'spatial' && ontology && (
              <motion.div key="spatial" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="font-['Unbounded'] text-lg font-bold text-white">Spatial Intelligence Analytics</h2>

                {/* Ontology Visualization */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="liquid-glass rounded-xl p-5">
                    <h3 className="text-[10px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#00F0FF] mb-3">Shape Primitives</h3>
                    <div className="flex flex-wrap gap-2">
                      {ontology.shapes?.map(s => (
                        <span key={s} className="px-3 py-1.5 rounded-lg text-xs font-['Outfit'] bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="liquid-glass rounded-xl p-5">
                    <h3 className="text-[10px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#E0FF00] mb-3">Material Library</h3>
                    <div className="flex flex-wrap gap-2">
                      {ontology.materials?.map(m => (
                        <span key={m} className="px-3 py-1.5 rounded-lg text-xs font-['Outfit'] bg-[#E0FF00]/10 text-[#E0FF00] border border-[#E0FF00]/20">{m}</span>
                      ))}
                    </div>
                  </div>
                  <div className="liquid-glass rounded-xl p-5">
                    <h3 className="text-[10px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#FF0055] mb-3">Color Palette</h3>
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
                </div>

                {/* Sustainability Vectors */}
                <div className="liquid-glass rounded-xl p-5">
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

                {/* Constraint Framework */}
                {ontology.constraints && (
                  <div className="liquid-glass rounded-xl p-5">
                    <h3 className="text-[10px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#71717A] mb-3">Constraint Framework</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(ontology.constraints).map(([category, items]) => (
                        <div key={category}>
                          <p className="text-[9px] font-['JetBrains_Mono'] text-[#00F0FF] mb-2 uppercase">{category}</p>
                          <div className="space-y-1">
                            {items.map(item => (
                              <div key={item} className="text-[10px] text-[#A1A1AA] font-['Outfit'] flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-[#71717A]" /> {item}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* User Tracking Events */}
                <DataTable title="Spatial Interaction Events" testId="tracking-table"
                  columns={['Event', 'Product', 'User', 'Timestamp']}
                  rows={activity.user_tracking?.map(t => [t.event, t.product_id || '-', t.user_id?.slice(0, 12) || 'anon', t.timestamp?.slice(0, 19)]) || []} />
              </motion.div>
            )}

            {/* ════ PANEL 6: SECURITY & COMPLIANCE ════ */}
            {activeTab === 'security' && (
              <motion.div key="security" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="font-['Unbounded'] text-lg font-bold text-white">Security & Compliance</h2>

                {/* Compliance Status */}
                {securityLogs?.compliance && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(securityLogs.compliance).map(([key, val]) => (
                      <div key={key} className="liquid-glass rounded-xl p-4 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${val ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                          {val ? <ShieldCheck size={16} className="text-green-400" /> : <Lock size={16} className="text-red-400" />}
                        </div>
                        <div>
                          <p className="text-xs font-['Outfit'] text-white font-medium uppercase">{key.replace(/_/g, ' ')}</p>
                          <p className="text-[9px] font-['JetBrains_Mono'] text-[#71717A]">{val ? 'Compliant' : 'Non-compliant'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Security Headers */}
                {securityLogs?.security_headers && (
                  <div className="liquid-glass rounded-xl p-5">
                    <h3 className="text-[10px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#71717A] mb-3">Active Security Headers</h3>
                    <div className="flex flex-wrap gap-2">
                      {securityLogs.security_headers.map(h => (
                        <span key={h} className="px-3 py-1.5 rounded-lg text-[10px] font-['JetBrains_Mono'] bg-green-500/10 text-green-400 border border-green-500/20">{h}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rate Limit Config */}
                {securityLogs?.rate_limit_config && (
                  <div className="liquid-glass rounded-xl p-5">
                    <h3 className="text-[10px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#71717A] mb-3">Rate Limiting</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 rounded-lg bg-white/[0.02]">
                        <p className="text-lg font-['JetBrains_Mono'] font-bold text-[#00F0FF]">{securityLogs.rate_limit_config.window_seconds}s</p>
                        <p className="text-[9px] text-[#71717A]">Window</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-white/[0.02]">
                        <p className="text-lg font-['JetBrains_Mono'] font-bold text-[#E0FF00]">{securityLogs.rate_limit_config.max_general}</p>
                        <p className="text-[9px] text-[#71717A]">General Limit</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-white/[0.02]">
                        <p className="text-lg font-['JetBrains_Mono'] font-bold text-[#FF0055]">{securityLogs.rate_limit_config.max_ai}</p>
                        <p className="text-[9px] text-[#71717A]">AI Limit</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Login Log */}
                <DataTable title="Admin Login History" testId="admin-login-history"
                  columns={['Action', 'Email', 'Timestamp']}
                  rows={securityLogs?.admin_logins?.map(a => [a.action, a.email || '-', a.timestamp?.slice(0, 19)]) || []} />

                {/* Active Sessions */}
                <DataTable title="Active User Sessions" testId="active-sessions-table"
                  columns={['User ID', 'Created', 'Expires']}
                  rows={securityLogs?.active_sessions?.map(s => [s.user_id?.slice(0, 16), s.created_at?.slice(0, 19), s.expires_at?.slice(0, 19)]) || []} />

                {/* Admin Activity Full Log */}
                <DataTable title="Admin Actions" testId="admin-actions-table"
                  columns={['Action', 'Email', 'Timestamp']}
                  rows={activity.admin_actions?.map(a => [a.action, a.email || '-', a.timestamp?.slice(0, 19)]) || []} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ════ DIMENSIONAL CONSOLE (HIDDEN SUPER-ADMIN) ════ */}
      <AnimatePresence>
        {showConsole && (
          <DimensionalConsole
            ontology={ontology}
            token={token}
            onClose={() => setShowConsole(false)}
            onRefresh={fetchAll}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

/* ═══ DIMENSIONAL CONSOLE COMPONENT ═══ */
function DimensionalConsole({ ontology, token, onClose, onRefresh }) {
  const [cmdField, setCmdField] = useState('shapes');
  const [cmdAction, setCmdAction] = useState('add');
  const [cmdValue, setCmdValue] = useState('');
  const [cmdColorHex, setCmdColorHex] = useState('#00F0FF');
  const [cmdLog, setCmdLog] = useState([]);
  const [executing, setExecuting] = useState(false);

  const executeCmd = async () => {
    if (!cmdValue.trim()) return;
    setExecuting(true);
    try {
      let value = cmdValue.trim();
      if (cmdField === 'colors' && cmdAction === 'add') {
        value = { [cmdValue.trim()]: cmdColorHex };
      }
      const res = await axios.post(`${API}/admin/ontology/update`, {
        field: cmdField,
        action: cmdAction,
        value,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setCmdLog(prev => [...prev, { time: new Date().toISOString().slice(11, 19), cmd: `${cmdAction} ${cmdField}: ${JSON.stringify(value)}`, status: 'ok' }]);
      toast.success(`Ontology ${cmdAction}: ${cmdValue}`);
      onRefresh();
      setCmdValue('');
    } catch (err) {
      setCmdLog(prev => [...prev, { time: new Date().toISOString().slice(11, 19), cmd: `${cmdAction} ${cmdField}: ${cmdValue}`, status: 'err', detail: err.response?.data?.detail || err.message }]);
      toast.error(err.response?.data?.detail || 'Command failed');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      data-testid="dimensional-console"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-3xl rounded-2xl overflow-hidden"
        style={{ background: '#0A0A0A', border: '1px solid rgba(255,0,85,0.3)', boxShadow: '0 0 60px rgba(255,0,85,0.15)' }}
      >
        {/* Console Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#FF0055]/20" style={{ background: 'rgba(255,0,85,0.05)' }}>
          <div className="flex items-center gap-3">
            <Terminal size={16} className="text-[#FF0055]" />
            <span className="font-['Unbounded'] text-xs font-bold text-[#FF0055]">DIMENSIONAL CONSOLE</span>
            <span className="text-[8px] font-['JetBrains_Mono'] text-[#71717A] ml-2">SUPER-ADMIN</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#71717A] hover:text-[#FF0055] hover:bg-[#FF0055]/10 transition-colors" data-testid="console-close-btn">
            <X size={14} />
          </button>
        </div>

        {/* Current Ontology State */}
        <div className="p-5 border-b border-white/5">
          <p className="text-[9px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#71717A] mb-3">Live Ontology State</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <p className="text-[#00F0FF] font-['JetBrains_Mono'] text-[9px] mb-1">SHAPES ({ontology?.shapes?.length || 0})</p>
              <div className="flex flex-wrap gap-1">
                {ontology?.shapes?.map(s => <span key={s} className="px-2 py-0.5 rounded bg-[#00F0FF]/10 text-[#00F0FF] text-[9px] font-['JetBrains_Mono']">{s}</span>)}
              </div>
            </div>
            <div>
              <p className="text-[#E0FF00] font-['JetBrains_Mono'] text-[9px] mb-1">MATERIALS ({ontology?.materials?.length || 0})</p>
              <div className="flex flex-wrap gap-1">
                {ontology?.materials?.map(m => <span key={m} className="px-2 py-0.5 rounded bg-[#E0FF00]/10 text-[#E0FF00] text-[9px] font-['JetBrains_Mono']">{m}</span>)}
              </div>
            </div>
            <div>
              <p className="text-[#FF0055] font-['JetBrains_Mono'] text-[9px] mb-1">COLORS ({Object.keys(ontology?.colors || {}).length})</p>
              <div className="flex flex-wrap gap-1">
                {Object.entries(ontology?.colors || {}).map(([n, h]) => (
                  <div key={n} className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5">
                    <div className="w-2 h-2 rounded-sm" style={{ background: h }} />
                    <span className="text-[8px] text-[#A1A1AA] font-['JetBrains_Mono']">{n}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[#71717A] font-['JetBrains_Mono'] text-[9px] mb-1">EXTENSIONS ({ontology?.dimensional_extensions?.length || 0})</p>
              <div className="flex flex-wrap gap-1">
                {ontology?.dimensional_extensions?.map(d => <span key={d} className="px-2 py-0.5 rounded bg-white/5 text-[#A1A1AA] text-[8px] font-['JetBrains_Mono']">{d}</span>)}
              </div>
            </div>
          </div>
        </div>

        {/* Command Input */}
        <div className="p-5 border-b border-white/5">
          <p className="text-[9px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#FF0055] mb-3">Execute Command</p>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-[8px] font-['JetBrains_Mono'] text-[#71717A] block mb-1">Field</label>
              <select value={cmdField} onChange={e => setCmdField(e.target.value)} data-testid="console-field-select"
                className="px-3 py-2 bg-black border border-white/10 rounded-lg text-xs text-white font-['JetBrains_Mono'] focus:outline-none focus:border-[#FF0055]/50">
                <option value="shapes">shapes</option>
                <option value="materials">materials</option>
                <option value="colors">colors</option>
                <option value="dimensional_extensions">dimensional_extensions</option>
              </select>
            </div>
            <div>
              <label className="text-[8px] font-['JetBrains_Mono'] text-[#71717A] block mb-1">Action</label>
              <select value={cmdAction} onChange={e => setCmdAction(e.target.value)} data-testid="console-action-select"
                className="px-3 py-2 bg-black border border-white/10 rounded-lg text-xs text-white font-['JetBrains_Mono'] focus:outline-none focus:border-[#FF0055]/50">
                <option value="add">add</option>
                <option value="remove">remove</option>
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="text-[8px] font-['JetBrains_Mono'] text-[#71717A] block mb-1">Value</label>
              <input value={cmdValue} onChange={e => setCmdValue(e.target.value)} placeholder={cmdField === 'colors' ? 'Color Name' : 'Value...'} data-testid="console-value-input"
                className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-xs text-white font-['JetBrains_Mono'] focus:outline-none focus:border-[#FF0055]/50"
                onKeyDown={e => e.key === 'Enter' && executeCmd()} />
            </div>
            {cmdField === 'colors' && cmdAction === 'add' && (
              <div>
                <label className="text-[8px] font-['JetBrains_Mono'] text-[#71717A] block mb-1">Hex</label>
                <input type="color" value={cmdColorHex} onChange={e => setCmdColorHex(e.target.value)}
                  className="w-10 h-[34px] bg-black border border-white/10 rounded-lg cursor-pointer" />
              </div>
            )}
            <button onClick={executeCmd} disabled={executing} data-testid="console-execute-btn"
              className="px-4 py-2 rounded-lg text-xs font-['JetBrains_Mono'] bg-[#FF0055] text-white hover:bg-[#FF0055]/80 transition-colors disabled:opacity-50 flex items-center gap-2">
              {cmdAction === 'add' ? <Plus size={12} /> : <Minus size={12} />}
              {executing ? 'Executing...' : 'Execute'}
            </button>
          </div>
        </div>

        {/* Command Log */}
        <div className="p-5 max-h-[200px] overflow-y-auto" data-testid="console-log">
          <p className="text-[9px] font-['JetBrains_Mono'] tracking-[0.15em] uppercase text-[#71717A] mb-2">Command Log</p>
          {cmdLog.length === 0 && <p className="text-[10px] text-[#71717A] font-['JetBrains_Mono']">No commands executed this session.</p>}
          {cmdLog.map((log, i) => (
            <div key={i} className="flex items-start gap-2 py-1">
              <span className="text-[9px] font-['JetBrains_Mono'] text-[#71717A]">[{log.time}]</span>
              <span className={`text-[9px] font-['JetBrains_Mono'] ${log.status === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
                {log.status === 'ok' ? 'OK' : 'ERR'}
              </span>
              <span className="text-[9px] font-['JetBrains_Mono'] text-[#A1A1AA]">{log.cmd}</span>
              {log.detail && <span className="text-[8px] text-red-400 font-['JetBrains_Mono']">({log.detail})</span>}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
