import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Icon, Icons } from "../components/ui/Icon";
import Modal from "../components/ui/Modal";

export default function Leaderboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState("global"); 
  const [globalLeaders, setGlobalLeaders] = useState([]);
  const [squadLeaders, setSquadLeaders] = useState([]);
  const [myRank, setMyRank] = useState(null);

  const [pendingRequests, setPendingRequests] = useState([]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchLeaderboardData();
  }, [user]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchLeaderboardData = async () => {
    setLoading(true);
    
<<<<<<< HEAD
    // 💥 SCALABILITY FIX: Limit to Top 50 Global Users
=======
    // FETCHING EQUIPPED FRAMES FOR THE LEADERBOARD
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
    const { data: globalData } = await supabase
      .from('profiles')
      .select('id, full_name, total_xp, current_streak, is_public, equipped_frame')
      .eq('is_public', true)
      .order('total_xp', { ascending: false })
<<<<<<< HEAD
      .limit(50);

    if (globalData) setGlobalLeaders(globalData);

    // 🧠 LOGIC FIX: True Rank - Calculate exact rank securely using the database!
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('total_xp')
      .eq('id', user.id)
      .single();

    if (myProfile) {
      // Ask the database: How many public users have strictly more XP than me?
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_public', true)
        .gt('total_xp', myProfile.total_xp);
      
      // My rank is that count + 1!
      setMyRank((count || 0) + 1);
    }

    // ─── SQUAD & FRIEND LOGIC ───
=======
      .limit(100);

>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
    const { data: friendships } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

<<<<<<< HEAD
    if (friendships) {
      const acceptedFriendsIds = friendships
        .filter(f => f.status === 'accepted')
        .map(f => f.requester_id === user.id ? f.receiver_id : f.requester_id);
      
      acceptedFriendsIds.push(user.id); // Add yourself to the squad
      
      // 💥 BUG FIX: Fetch Squad Data Explicitly
      // (If we just filtered the Top 50 global list, lower-ranked friends would vanish!)
      const { data: squadData } = await supabase
        .from('profiles')
        .select('id, full_name, total_xp, current_streak, is_public, equipped_frame')
        .in('id', acceptedFriendsIds)
        .order('total_xp', { ascending: false });
        
      if (squadData) setSquadLeaders(squadData);

      const pending = friendships
        .filter(f => f.status === 'pending' && f.receiver_id === user.id)
        .map(f => f.requester_id);
      
      if (pending.length > 0) {
        const { data: requestsData } = await supabase
          .from('profiles')
          .select('id, full_name, total_xp, current_streak, is_public, equipped_frame')
          .in('id', pending);
        setPendingRequests(requestsData || []);
      } else {
        setPendingRequests([]);
      }
    }
    
=======
    if (globalData) {
      setGlobalLeaders(globalData);
      const rankIndex = globalData.findIndex(p => p.id === user.id);
      if (rankIndex !== -1) setMyRank(rankIndex + 1);

      if (friendships) {
        const acceptedFriendsIds = friendships
          .filter(f => f.status === 'accepted')
          .map(f => f.requester_id === user.id ? f.receiver_id : f.requester_id);
        
        acceptedFriendsIds.push(user.id);
        const squadData = globalData.filter(p => acceptedFriendsIds.includes(p.id));
        setSquadLeaders(squadData.sort((a, b) => b.total_xp - a.total_xp));

        const pending = friendships
          .filter(f => f.status === 'pending' && f.receiver_id === user.id)
          .map(f => f.requester_id);
        
        const requestsData = globalData.filter(p => pending.includes(p.id));
        setPendingRequests(requestsData);
      }
    }
>>>>>>> d5c8fd0b23f1e1f126f3ab7cb66827dd5d3393e6
    setLoading(false);
  };

  const handleSearchUsers = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);

    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, total_xp, equipped_frame')
      .eq('is_public', true)
      .ilike('full_name', `%${searchQuery}%`)
      .neq('id', user.id)
      .limit(5);

    setSearchResults(data || []);
    setIsSearching(false);
  };

  const handleSendRequest = async (receiverId) => {
    const { error } = await supabase.from('friendships').insert([{ requester_id: user.id, receiver_id: receiverId, status: 'pending' }]);
    if (error) {
      if (error.code === '23505') showToast("Request already sent!");
      else showToast("Error sending request.");
    } else {
      showToast("Squad invite sent! 🚀");
      setSearchResults(prev => prev.filter(p => p.id !== receiverId));
    }
  };

  const handleAcceptRequest = async (requesterId) => {
    await supabase.from('friendships').update({ status: 'accepted' }).match({ requester_id: requesterId, receiver_id: user.id });
    showToast("Friend added to Squad! 🤝");
    fetchLeaderboardData(); 
  };

  // ─── MASTER AVATAR & FRAME RENDERER ───
  const renderAvatar = (name, frameId, sizeClass = "w-10 h-10", textClass = "text-sm", rankFallbackClass = null, isMe = false) => {
    const initials = name ? name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "?";
    
    let frameClass = rankFallbackClass; 
    let isGradient = false;

    if (frameId === 'bronze') frameClass = "border-4 border-orange-700 shadow-[0_0_15px_rgba(194,65,12,0.5)]";
    else if (frameId === 'gold') frameClass = "border-4 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.8)]";
    else if (frameId === 'neon') frameClass = "border-4 border-fuchsia-500 shadow-[0_0_25px_rgba(217,70,239,0.9)] animate-pulse";
    else if (frameId === 'radiant') {
      frameClass = "p-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 shadow-[0_0_30px_rgba(34,211,238,0.8)] animate-[spin_3s_linear_infinite]";
      isGradient = true;
    } else if (!rankFallbackClass) {
      frameClass = isMe ? "bg-indigo-500 text-white" : "bg-white/10 text-slate-300";
    }

    if (isGradient) {
      return (
        <div className={`relative rounded-full flex items-center justify-center ${sizeClass}`}>
          <div className={`absolute inset-0 rounded-full ${frameClass}`}></div>
          <div className={`absolute inset-[3px] rounded-full bg-slate-900 flex items-center justify-center font-bold text-slate-200 z-10 ${textClass}`}>
            {initials}
          </div>
        </div>
      );
    }

    return (
      <div className={`rounded-full flex items-center justify-center font-bold text-slate-200 ${sizeClass} ${frameClass} ${!frameClass?.includes('bg-') ? 'bg-slate-800' : ''} ${textClass}`}>
        {initials}
      </div>
    );
  };

  if (loading) return <div className="flex h-[80vh] items-center justify-center text-white/40"><div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mr-3" /> Loading Campus Data...</div>;

  const displayData = activeTab === "global" ? globalLeaders : squadLeaders;
  const top3 = displayData.slice(0, 3);
  const theRest = displayData.slice(3);

  return (
    <div className="flex flex-col gap-8 relative pb-10 max-w-5xl mx-auto">
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 p-6 rounded-3xl">
        <div className="text-center md:text-left">
          <h2 className="text-slate-100 font-extrabold text-[28px] font-['Plus_Jakarta_Sans'] tracking-tight">Leaderboard</h2>
          <p className="text-indigo-300/60 text-[14px] mt-1">Compete with the campus or battle your squad.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex bg-[#0d0d14] border border-white/10 rounded-xl p-1 shadow-inner">
            <button onClick={() => setActiveTab("global")} className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${activeTab === 'global' ? 'bg-indigo-500/20 text-indigo-400 shadow-md' : 'text-white/40 hover:text-white/80'}`}>🌍 Global Campus</button>
            <button onClick={() => setActiveTab("squad")} className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-all flex items-center gap-2 ${activeTab === 'squad' ? 'bg-indigo-500/20 text-indigo-400 shadow-md' : 'text-white/40 hover:text-white/80'}`}>
              🛡️ My Squad
              {pendingRequests.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingRequests.length}</span>}
            </button>
          </div>
          <button onClick={() => setIsSearchModalOpen(true)} className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all"><Icon d={Icons.plus} size={16} /> Add Friend</button>
        </div>
      </div>

      {activeTab === "squad" && pendingRequests.length > 0 && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4 animate-[fadeIn_0.3s_ease-out]">
          <h3 className="text-[13px] font-bold text-indigo-300 mb-3 flex items-center gap-2"><span>👋</span> Pending Squad Invites</h3>
          <div className="flex flex-col gap-2">
            {pendingRequests.map(req => (
              <div key={req.id} className="flex justify-between items-center bg-[#0d0d14] border border-white/5 p-3 rounded-xl">
                <div className="flex items-center gap-3">
                  {renderAvatar(req.full_name, req.equipped_frame, "w-8 h-8", "text-[11px]")}
                  <div>
                    <div className="text-[13px] font-bold text-slate-200">{req.full_name}</div>
                    <div className="text-[11px] text-white/40">{req.total_xp.toLocaleString()} XP</div>
                  </div>
                </div>
                <button onClick={() => handleAcceptRequest(req.id)} className="bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg text-[11px] font-bold hover:bg-green-500/30 transition-colors">Accept Invite</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "squad" && squadLeaders.length === 1 && pendingRequests.length === 0 && (
        <div className="text-center py-12 bg-white/5 border border-white/10 border-dashed rounded-3xl flex flex-col items-center">
          <div className="text-4xl mb-3">👻</div>
          <h3 className="text-slate-200 font-bold text-[16px] mb-1">Your squad is empty!</h3>
          <p className="text-white/40 text-[13px] mb-4">Click "Add Friend" to invite classmates to your private leaderboard.</p>
          <button onClick={() => setIsSearchModalOpen(true)} className="bg-indigo-500 text-white px-5 py-2 rounded-xl text-[13px] font-bold hover:bg-indigo-400 transition-colors">Find Friends</button>
        </div>
      )}

      {/* ─── THE PODIUM (TOP 3) ─── */}
      {top3.length > 0 && (displayData.length > 1 || activeTab === "global") && (
        <div className="flex justify-center items-end gap-2 md:gap-6 mt-6 mb-8 h-[250px]">
          
          {/* Silver */}
          {top3[1] && (
            <div className="flex flex-col items-center animate-[slideUp_0.6s_ease-out]">
              <div className="relative mb-4">
                <div className="absolute -top-3 -right-3 text-2xl drop-shadow-lg z-10">🥈</div>
                {renderAvatar(top3[1].full_name, top3[1].equipped_frame, "w-16 h-16", "text-xl", "border-4 border-slate-300 shadow-[0_0_20px_rgba(203,213,225,0.3)]")}
              </div>
              <div className="text-[14px] font-bold text-slate-200 mb-1 truncate max-w-[80px] text-center">{top3[1].full_name?.split(" ")[0]}</div>
              <div className="text-[12px] font-extrabold text-slate-400 mb-3">{top3[1].total_xp.toLocaleString()} XP</div>
              <div className="w-24 md:w-32 h-32 bg-gradient-to-t from-slate-400/20 to-slate-400/5 border border-slate-400/20 rounded-t-2xl flex justify-center"><span className="text-slate-400/50 font-black text-4xl mt-4">2</span></div>
            </div>
          )}

          {/* Gold */}
          {top3[0] && (
            <div className="flex flex-col items-center animate-[slideUp_0.4s_ease-out] z-10">
              <div className="relative mb-4">
                <div className="absolute -top-5 -right-4 text-4xl drop-shadow-[0_0_15px_rgba(251,191,36,0.6)] z-10">👑</div>
                {renderAvatar(top3[0].full_name, top3[0].equipped_frame, "w-20 h-20", "text-2xl", "border-4 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.4)]")}
              </div>
              <div className="text-[16px] font-black text-amber-400 mb-1 drop-shadow-md truncate max-w-[100px] text-center">{top3[0].full_name?.split(" ")[0]}</div>
              <div className="text-[13px] font-extrabold text-amber-200/70 mb-3">{top3[0].total_xp.toLocaleString()} XP</div>
              <div className="w-28 md:w-36 h-40 bg-gradient-to-t from-amber-500/20 to-amber-500/5 border border-amber-500/30 rounded-t-2xl shadow-[0_0_30px_rgba(251,191,36,0.1)] flex justify-center"><span className="text-amber-500/40 font-black text-6xl mt-4">1</span></div>
            </div>
          )}

          {/* Bronze */}
          {top3[2] && (
            <div className="flex flex-col items-center animate-[slideUp_0.8s_ease-out]">
              <div className="relative mb-4">
                <div className="absolute -top-3 -right-3 text-2xl drop-shadow-lg z-10">🥉</div>
                {renderAvatar(top3[2].full_name, top3[2].equipped_frame, "w-16 h-16", "text-xl", "border-4 border-orange-700 shadow-[0_0_20px_rgba(194,65,12,0.3)]")}
              </div>
              <div className="text-[14px] font-bold text-slate-200 mb-1 truncate max-w-[80px] text-center">{top3[2].full_name?.split(" ")[0]}</div>
              <div className="text-[12px] font-extrabold text-orange-400 mb-3">{top3[2].total_xp.toLocaleString()} XP</div>
              <div className="w-24 md:w-32 h-24 bg-gradient-to-t from-orange-700/20 to-orange-700/5 border border-orange-700/20 rounded-t-2xl flex justify-center"><span className="text-orange-700/50 font-black text-4xl mt-4">3</span></div>
            </div>
          )}

        </div>
      )}

      {/* ─── THE LIST (RANK 4+) ─── */}
      {(theRest.length > 0 || top3.length > 0) && (
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex flex-col">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 bg-[#0d0d14]/50 text-[11px] font-bold text-white/40 uppercase tracking-widest">
            <div className="col-span-2 md:col-span-1 text-center">Rank</div>
            <div className="col-span-6 md:col-span-5 pl-2">Pilot</div>
            <div className="col-span-4 md:col-span-3 text-right md:text-left">Total XP</div>
            <div className="col-span-3 hidden md:block text-right pr-4">Active Streak</div>
          </div>

          <div className="flex flex-col">
            {theRest.map((pilot, index) => {
              const actualRank = index + 4; 
              const isMe = pilot.id === user.id;

              return (
                <div key={pilot.id} className={`grid grid-cols-12 gap-4 p-4 items-center border-b border-white/5 transition-colors hover:bg-white/[0.03] ${isMe ? 'bg-indigo-500/10 border-l-4 border-l-indigo-500' : ''}`}>
                  <div className="col-span-2 md:col-span-1 text-center font-bold text-white/30 text-[14px]">#{actualRank}</div>
                  <div className="col-span-6 md:col-span-5 flex items-center gap-3 pl-2">
                    
                    {/* Render Small Avatar */}
                    {renderAvatar(pilot.full_name, pilot.equipped_frame, "w-8 h-8", "text-[11px]", null, isMe)}
                    
                    <div className={`text-[14px] font-bold truncate ${isMe ? 'text-indigo-300' : 'text-slate-200'}`}>
                      {pilot.full_name} {isMe && <span className="text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded ml-2 text-indigo-200">YOU</span>}
                    </div>
                  </div>
                  <div className="col-span-4 md:col-span-3 font-extrabold text-[14px] text-slate-200 text-right md:text-left">
                    {pilot.total_xp.toLocaleString()} <span className="text-[10px] text-amber-400 ml-1">XP</span>
                  </div>
                  <div className="col-span-3 hidden md:flex justify-end pr-4">
                    {pilot.current_streak > 0 ? (
                      <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-full text-orange-400 text-[12px] font-bold">🔥 {pilot.current_streak}</div>
                    ) : (<span className="text-white/20 text-[12px]">-</span>)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── SEARCH & ADD FRIENDS MODAL ─── */}
      <Modal isOpen={isSearchModalOpen} onClose={() => { setIsSearchModalOpen(false); setSearchResults([]); setSearchQuery(""); }} title="Find Squad Members">
        <form onSubmit={handleSearchUsers} className="flex flex-col gap-4">
          <div className="relative">
            <input type="text" placeholder="Search by name (e.g., Alex)" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-[#0d0d14] border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-[13px] outline-none focus:border-indigo-500/50 transition-colors" />
            <button type="submit" className="absolute right-2 top-2 bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-lg text-[11px] font-bold hover:bg-indigo-500/30">Search</button>
          </div>
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
            {isSearching ? (
              <div className="text-center text-white/40 text-[12px] py-4">Searching database...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map(result => (
                <div key={result.id} className="flex justify-between items-center bg-white/5 border border-white/10 p-3 rounded-xl">
                  <div className="flex items-center gap-3">
                    {/* Render Avatar in Search List */}
                    {renderAvatar(result.full_name, result.equipped_frame, "w-8 h-8", "text-[11px]")}
                    <div>
                      <div className="text-[13px] font-bold text-slate-200">{result.full_name}</div>
                      <div className="text-[11px] text-white/40">{result.total_xp.toLocaleString()} XP</div>
                    </div>
                  </div>
                  <button onClick={() => handleSendRequest(result.id)} type="button" className="bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold hover:bg-indigo-400 transition-colors">Add</button>
                </div>
              ))
            ) : searchQuery && (
              <div className="text-center text-white/40 text-[12px] py-4">No public pilots found with that name.</div>
            )}
          </div>
        </form>
      </Modal>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-[fadeIn_0.3s_ease-out]">
          <span className="text-[13px] font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}