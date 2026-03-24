import React, { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Icon, Icons } from "../ui/Icon";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import Modal from "../ui/Modal";

export default function Topbar() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [walletXP, setWalletXP] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({ name: "", dailyGoal: 120, password: "" });

  // ─── NEW: LIVE SEARCH & NOTIFICATIONS STATES ───
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const getPageTitle = () => {
    const path = location.pathname.split("/")[1];
    if (!path) return "Dashboard";
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  useEffect(() => {
    const fetchRealData = async () => {
      const [ { data: hData }, { data: gData }, { data: sData }, { data: pData }, { data: tData } ] = await Promise.all([
        supabase.from('habits').select('streak').eq('user_id', user.id),
        supabase.from('goals').select('progress').eq('user_id', user.id),
        supabase.from('user_settings').select('xp_spent').eq('user_id', user.id).maybeSingle(),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('tasks').select('id, title, due, status').eq('user_id', user.id).neq('status', 'completed')
      ]);

      let earned = pData?.total_xp || 0; 
      if (hData) hData.forEach(h => earned += (h.streak * 50));
      if (gData) gData.forEach(g => { earned += (g.progress === 100 ? 500 : g.progress * 5); });
      
      const spent = sData?.xp_spent || 0;
      setWalletXP(earned - spent);

      if (pData) {
        setProfile(pData);
        setFormData({
          name: pData.full_name || user.user_metadata?.full_name || "",
          dailyGoal: pData.daily_focus_goal || 120,
          password: ""
        });
      }

      // ─── PROCESS LIVE NOTIFICATIONS ───
      if (tData) {
        const notifs = [];
        const now = new Date();
        tData.forEach(task => {
          if (task.due) {
            const dueDate = new Date(task.due);
            const diffHours = (dueDate - now) / (1000 * 60 * 60);
            if (diffHours < 0 && task.status !== 'overdue') {
              notifs.push({ id: task.id, type: 'urgent', title: 'Task Overdue!', desc: `"${task.title}" is overdue.`, icon: '⚠️', color: 'text-red-400' });
            } else if (diffHours > 0 && diffHours < 48) {
              notifs.push({ id: task.id, type: 'warning', title: 'Due Soon', desc: `"${task.title}" is due in less than 48h.`, icon: '⏰', color: 'text-amber-400' });
            }
          }
        });
        setNotifications(notifs);
      }
    };

    fetchRealData();
  }, [user, location.pathname]); 

  // ─── FIX: Debounced & Scoped Global Search ───
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    // 💡 UX FIX: The Debounce Timer (Waits 300ms after you stop typing)
    const delayDebounceFn = setTimeout(async () => {
      // 🔒 CRITICAL FIX: Added .eq('user_id', user.id) to both queries!
      const [ { data: tRes }, { data: gRes } ] = await Promise.all([
        supabase.from('tasks').select('id, title, type').eq('user_id', user.id).ilike('title', `%${searchQuery}%`).limit(5),
        supabase.from('goals').select('id, title').eq('user_id', user.id).ilike('title', `%${searchQuery}%`).limit(5)
      ]);

      const combined = [
        ...(tRes || []).map(t => ({ ...t, source: 'task' })),
        ...(gRes || []).map(g => ({ ...g, source: 'goal' }))
      ];
      setSearchResults(combined);
    }, 300); 

    // Cleanup function: If the user types again before 300ms, cancel the previous search!
    return () => clearTimeout(delayDebounceFn); 
  }, [searchQuery, user]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (formData.password) {
        if (formData.password.length < 6) throw new Error("Password must be at least 6 characters.");
        const { error: pwdError } = await supabase.auth.updateUser({ password: formData.password });
        if (pwdError) throw pwdError;
      }
      await supabase.auth.updateUser({ data: { full_name: formData.name } });
      const { error: profileError } = await supabase.from('profiles').update({
        full_name: formData.name, daily_focus_goal: parseInt(formData.dailyGoal)
      }).eq('id', user.id);

      if (profileError) throw profileError;
      showToast("Profile updated successfully!");
      setFormData(prev => ({ ...prev, password: "" })); 
      setTimeout(() => setIsProfileModalOpen(false), 1500);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ─── AVATAR RENDERER (Applies Shop Frames!) ───
  const renderAvatar = (sizeClass = "w-10 h-10", textClass = "text-sm") => {
    const initials = profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U";
    const frameId = profile?.equipped_frame || "none";
    let frameClass = "";
    let isGradient = false;

    if (frameId === 'bronze') frameClass = "border-2 border-orange-700 shadow-[0_0_10px_rgba(194,65,12,0.5)]";
    else if (frameId === 'gold') frameClass = "border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)]";
    else if (frameId === 'neon') frameClass = "border-2 border-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.9)] animate-pulse";
    else if (frameId === 'radiant') {
      frameClass = "p-[2px] bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 shadow-[0_0_20px_rgba(34,211,238,0.8)] animate-[spin_3s_linear_infinite]";
      isGradient = true;
    } else {
      frameClass = "bg-gradient-to-br from-indigo-500 to-purple-500 p-[2px]";
    }

    if (isGradient) {
      return (
        <div className={`relative rounded-full flex items-center justify-center ${sizeClass}`}>
          <div className={`absolute inset-0 rounded-full ${frameClass}`}></div>
          <div className={`absolute inset-[2px] rounded-full bg-[#0d0d14] flex items-center justify-center font-bold text-slate-200 z-10 ${textClass}`}>
            {initials}
          </div>
        </div>
      );
    }

    return (
      <div className={`rounded-full flex items-center justify-center font-bold text-slate-200 ${sizeClass} ${frameClass} ${!frameClass.includes('bg-') ? 'bg-[#0d0d14]' : ''} ${textClass}`}>
        {frameId === 'none' ? (
          <div className="w-full h-full bg-[#0d0d14] rounded-full flex items-center justify-center">{initials}</div>
        ) : initials}
      </div>
    );
  };

  return (
    <>
      <div className="h-20 border-b border-white/5 bg-[#0d0d14]/80 backdrop-blur-xl flex items-center justify-between px-6 lg:px-10 sticky top-0 z-40">
        
        <div className="hidden md:block">
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">{getPageTitle()}</h1>
          <p className="text-[11px] font-medium text-white/40 uppercase tracking-widest mt-0.5">Welcome back, {profile?.full_name?.split(" ")[0] || "Pilot"}</p>
        </div>

        <div className="flex items-center gap-4 ml-auto w-full md:w-auto justify-end">
          
          {/* ─── LIVE SEARCH BAR ─── */}
          <div className="relative w-full md:w-64">
            <div className={`flex items-center bg-[#13131a] border rounded-xl px-3 py-2 transition-colors ${isSearchOpen ? 'border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'border-white/5'}`}>
              <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" size={16} className="text-white/40" />
              <input 
                type="text" 
                placeholder="Search tasks..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-[13px] text-slate-200 ml-2 w-full outline-none placeholder:text-white/30"
                onFocus={() => setIsSearchOpen(true)}
                onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
              />
            </div>

            {isSearchOpen && (
              <div className="absolute top-full mt-2 w-full bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-2 z-50 animate-[fadeIn_0.1s_ease-out]">
                {searchResults.length > 0 ? (
                  <>
                    <div className="px-3 py-1.5 text-[10px] font-bold text-white/30 uppercase tracking-widest">Found Tasks</div>
                    {searchResults.map(res => (
                      <div key={res.id} onClick={() => navigate('/assignments')} className="flex flex-col px-4 py-2 hover:bg-white/5 cursor-pointer transition-colors">
                        <span className="text-[13px] font-bold text-indigo-300 truncate">{res.title}</span>
                        <span className="text-[10px] text-white/40">{res.subject} • {res.status}</span>
                      </div>
                    ))}
                  </>
                ) : searchQuery.trim().length > 1 ? (
                  <div className="px-4 py-3 text-[12px] text-white/40 text-center">No tasks found.</div>
                ) : (
                  <>
                    <div className="px-3 py-1.5 text-[10px] font-bold text-white/30 uppercase tracking-widest">Quick Actions</div>
                    <Link to="/timer" className="flex items-center gap-2 px-4 py-2 text-[13px] text-slate-300 hover:bg-white/5 hover:text-indigo-300 transition-colors"><span className="text-indigo-400">⏱️</span> Start Focus Timer</Link>
                    <Link to="/ai" className="flex items-center gap-2 px-4 py-2 text-[13px] text-slate-300 hover:bg-white/5 hover:text-indigo-300 transition-colors"><span className="text-purple-400">🤖</span> Ask AI Assistant</Link>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-white/10 hidden md:block"></div>

          <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
            <span className="text-amber-400 text-sm drop-shadow-md">⚡</span>
            <span className="text-[13px] font-extrabold text-amber-400">{walletXP.toLocaleString()} XP</span>
          </div>

          {/* ─── LIVE NOTIFICATIONS ─── */}
          <div className="relative">
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              title="Notifications"
              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors relative ${isNotifOpen ? 'bg-white/10 border-white/20 text-white' : 'bg-[#13131a] border-white/5 text-white/50 hover:bg-white/5 hover:text-white'}`}
            >
              <Icon d={Icons.bell} size={18} />
              {notifications.length > 0 && <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></span>}
            </button>

            {isNotifOpen && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-2 z-50 animate-[fadeIn_0.1s_ease-out]">
                <div className="flex justify-between items-center px-4 py-2 border-b border-white/5 mb-2">
                  <span className="text-[12px] font-bold text-slate-200">Notifications</span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">{notifications.length} New</span>
                </div>
                
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-[12px] text-white/40">You're all caught up! 🎉</div>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.map(n => (
                      <div key={n.id} onClick={() => { setIsNotifOpen(false); navigate('/assignments'); }} className="px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-0">
                        <div className="text-[12px] font-bold text-slate-200 flex items-center gap-1.5"><span className={n.color}>{n.icon}</span> {n.title}</div>
                        <div className="text-[11px] text-white/40 mt-1 leading-tight">{n.desc}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── DYNAMIC AVATAR ─── */}
          <div className="relative">
            <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} title="Settings" className="cursor-pointer hover:scale-105 transition-transform">
              {renderAvatar()}
            </div>

            {isDropdownOpen && (
              <div className="absolute right-0 top-12 w-56 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl py-2 z-50 animate-[fadeIn_0.2s_ease-out]">
                <div className="px-4 py-3 border-b border-white/5 mb-1">
                  <div className="text-[13px] font-bold text-slate-200 truncate">{profile?.full_name || user?.email}</div>
                  <div className="text-[11px] text-white/40 truncate">{user?.email}</div>
                </div>
                
                <button onClick={() => { setIsDropdownOpen(false); setIsProfileModalOpen(true); }} className="w-full text-left px-4 py-2 text-[13px] text-slate-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2">
                  <Icon d={Icons.settings} size={16} className="text-indigo-400" /> Profile Settings
                </button>
                <button onClick={async () => {await supabase.auth.signOut(); navigate("/"); }} className="w-full text-left px-4 py-2 text-[13px] text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2 mt-1">
                  <Icon d={Icons.logOut} size={16} /> Sign Out
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ─── MODAL ─── */}
      <Modal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} title="Profile & Settings">
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
          <div><label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Account Email</label><input type="email" value={user?.email || ""} disabled className="w-full bg-white/5 border border-transparent rounded-xl px-4 py-3 text-white/50 text-[13px] cursor-not-allowed" /></div>
          <div><label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Full Name</label><input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#0d0d14] border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-[13px] outline-none focus:border-indigo-500/50" /></div>
          <div>
            <label className="block text-[11px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5">Daily Focus Goal (Minutes)</label>
            <div className="flex items-center gap-3">
              <input type="number" min="10" required value={formData.dailyGoal} onChange={e => setFormData({...formData, dailyGoal: e.target.value})} className="w-32 bg-[#0d0d14] border border-indigo-500/30 rounded-xl px-4 py-3 text-indigo-300 text-[14px] font-bold outline-none focus:border-indigo-500" />
              <span className="text-[12px] text-white/40">Default is 120</span>
            </div>
          </div>
          <div className="pt-3 border-t border-white/5">
            <label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Change Password</label>
            <input type="password" placeholder="Leave blank to keep current" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-[#0d0d14] border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-[13px] outline-none focus:border-indigo-500/50" />
          </div>
          <button type="submit" disabled={loading} className="w-full mt-2 bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-[13px] py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </Modal>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-[fadeIn_0.3s_ease-out] border ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
          <span className="text-[13px] font-bold">{toast.msg}</span>
        </div>
      )}
    </>
  );
}