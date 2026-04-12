import React, { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Icon, Icons } from "../ui/Icon";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import Modal from "../ui/Modal";
import NotificationBell from "../ui/NotificationBell";
import { generateFCMToken } from "../../lib/firebase"; // 🚀 Imported Firebase!

export default function Topbar() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRequestingPush, setIsRequestingPush] = useState(false); // 🚀 Added state for push request

  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({ name: "", dailyGoal: 120, budget: 7000, isPublic: true });

  const getPageTitle = () => {
    const path = location.pathname.split("/")[1];
    if (!path) return "Dashboard";
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  // ─── 🛡️ CENTRALIZED DATA FETCHING ───
  useEffect(() => {
    let isMounted = true;

    const fetchRealData = async () => {
      if (!user?.id) return;
      
      try {
        const { data: pData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (isMounted && pData) {
          setProfile(pData);
          setFormData({
            name: pData.full_name || user.user_metadata?.full_name || "",
            dailyGoal: pData.daily_focus_goal || 120,
            budget: pData.monthly_budget || 7000,
            isPublic: pData.is_public ?? true
          });
        }
      } catch (err) {
        console.error("Topbar Data Error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRealData();
    return () => { isMounted = false; };
  }, [user, location.pathname]); 

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 🚀 NEW: Fallback function to generate and save FCM Token
  const handleEnablePush = async () => {
    setIsRequestingPush(true);
    try {
      const token = await generateFCMToken();
      if (token) {
        const { error } = await supabase
          .from('profiles')
          .update({ push_subscription: token })
          .eq('id', user.id);

        if (error) throw error;

        setProfile(prev => ({ ...prev, push_subscription: token }));
        showToast("Smart Assistant Alerts enabled! 🔔", "success");
      } else {
        showToast("Notifications blocked. Please enable them in browser settings.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to setup notifications.", "error");
    } finally {
      setIsRequestingPush(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { error: profileError } = await supabase.from('profiles').update({
        full_name: formData.name, 
        daily_focus_goal: parseInt(formData.dailyGoal),
        monthly_budget: parseInt(formData.budget),
        is_public: formData.isPublic
      }).eq('id', user.id);

      if (profileError) throw profileError;
      
      await supabase.auth.updateUser({ data: { full_name: formData.name } });
      
      showToast("Dossier updated successfully!");
      setTimeout(() => setIsProfileModalOpen(false), 1500);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const renderAvatar = (sizeClass = "w-10 h-10", textClass = "text-sm") => {
    const initials = profile?.full_name?.charAt(0).toUpperCase() || "U";
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
        {frameId === 'none' ? <div className="w-full h-full bg-[#0d0d14] rounded-full flex items-center justify-center">{initials}</div> : initials}
      </div>
    );
  };

  return (
    <>
      <div className="h-20 border-b border-white/5 bg-[#0d0d14]/80 backdrop-blur-xl flex items-center justify-between px-6 lg:px-10 sticky top-0 z-40">
        
        <div className="hidden md:block">
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">{getPageTitle()}</h1>
          <p className="text-[11px] font-medium text-white/40 uppercase tracking-widest mt-0.5">
            {loading ? "Loading..." : `Welcome back, ${profile?.full_name?.split(" ")[0] || "Pilot"}`}
          </p>
        </div>

        <div className="flex items-center gap-4 ml-auto w-full md:w-auto justify-end">

          <div className="w-px h-6 bg-white/10 hidden md:block"></div>

          <div className="hidden sm:flex items-center gap-3 bg-[#0d0d14] border border-white/10 px-4 py-2 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 border-r border-white/10 pr-3" title="Spendable Credits">
              <span className="text-[14px]">🪙</span>
              <span className="text-[13px] font-bold text-slate-200">Credits: {profile?.credits_balance || 0}</span>
            </div>
            <div className="flex items-center gap-2 pl-1" title="Global Rank & Score">
              <span className="text-indigo-400 text-[14px]">🎖️</span>
              <span className="text-[13px] font-bold text-slate-200">Rank: {profile?.rank_title || 'Cadet'}</span>
              <span className="text-[11px] text-white/40 font-medium">(Score: {profile?.pilot_score || 0})</span>
            </div>
          </div>

          <NotificationBell userId={user?.id} />

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
                  <Icon d={Icons.settings} size={16} className="text-indigo-400" /> Pilot Settings
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      <Modal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} title="Pilot Dossier">
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
          
          <div>
            <label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Account Email</label>
            <input type="email" value={user?.email || ""} disabled className="w-full bg-white/5 border border-transparent rounded-xl px-4 py-3 text-white/50 text-[13px] cursor-not-allowed" />
          </div>
          
          <div>
            <label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Pilot Callsign (Name)</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#0d0d14] border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-[13px] outline-none focus:border-indigo-500/50" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5">Focus Goal (Mins)</label>
              <input type="number" min="10" required value={formData.dailyGoal} onChange={e => setFormData({...formData, dailyGoal: e.target.value})} className="w-full bg-[#0d0d14] border border-indigo-500/30 rounded-xl px-4 py-3 text-indigo-300 text-[14px] font-bold outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-1.5">Monthly Budget</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/50 font-bold">₹</span>
                <input type="number" min="0" required value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} className="w-full bg-[#0d0d14] border border-emerald-500/30 rounded-xl pl-7 pr-4 py-3 text-emerald-300 text-[14px] font-bold outline-none focus:border-emerald-500" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            <div>
              <label className="block text-[13px] font-bold text-slate-200 mb-0.5">Public Campus Profile</label>
              <p className="text-[11px] text-white/40">Allow classmates to see your rank on the leaderboard.</p>
            </div>
            <button 
              type="button"
              onClick={() => setFormData(prev => ({...prev, isPublic: !prev.isPublic}))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.isPublic ? 'bg-indigo-500' : 'bg-slate-700'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* 🚀 NEW: Smart Assistant Toggle Section */}
          <div className="pt-2 pb-2 flex items-center justify-between border-t border-white/5">
            <div>
              <label className="block text-[13px] font-bold text-slate-200 mb-0.5">Smart Assistant Alerts</label>
              <p className="text-[11px] text-white/40">Get notified when your streak is at risk.</p>
            </div>
            
            {profile?.push_subscription ? (
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Active
              </span>
            ) : (
              <button 
                type="button" 
                onClick={handleEnablePush}
                disabled={isRequestingPush}
                className="px-4 py-1.5 bg-indigo-500/10 text-indigo-400 font-bold text-[11px] rounded-lg border border-indigo-500/30 hover:bg-indigo-500/20 transition-colors disabled:opacity-50"
              >
                {isRequestingPush ? "Connecting..." : "Enable Alerts"}
              </button>
            )}
          </div>

          <button type="submit" disabled={loading} className="w-full mt-2 bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-[14px] py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-indigo-500/20">
            {loading ? "Saving secure data..." : "Update Dossier"}
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