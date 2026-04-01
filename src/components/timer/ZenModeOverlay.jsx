import React, { useState, useEffect } from 'react';
import { Icon, Icons } from '../ui/Icon';

export default function ZenModeOverlay({
  isZenMode,
  toggleZenMode,
  mins,
  secs,
  running,
  toggleTimer,
  spotifyUrl,
  setSpotifyUrl
}) {
  // 🚀 THE NEW IDLE DETECTOR STATE
  const [isIdle, setIsIdle] = useState(false);

  // Listen for mouse movement to show/hide the UI
  useEffect(() => {
    if (!isZenMode) return;
    
    let timeout;
    const handleMouseMove = () => {
      setIsIdle(false);
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsIdle(true), 3000); // Hide after 3 seconds of no movement
    };

    window.addEventListener('mousemove', handleMouseMove);
    // Start the timer immediately
    timeout = setTimeout(() => setIsIdle(true), 3000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isZenMode]);

  if (!isZenMode) return null;

  // ─── HELPER: Safely convert Spotify links ───
  const getSpotifyEmbedUrl = (link) => {
    const defaultEmbed = "https://open.spotify.com/embed/playlist/37i9dQZF1DX8Uebhn9wzrS?theme=0"; // Fallback to Lofi Beats
    if (!link) return defaultEmbed;
    if (link.includes('/embed/')) return link; 
    
    try {
      const url = new URL(link);
      return `https://open.spotify.com/embed$${url.pathname}?theme=0`;
    } catch (e) {
      return defaultEmbed; 
    }
  };

  return (
    // 1. Hide cursor if idle
    <div className={`fixed inset-0 z-[100] bg-[#050508] flex flex-col items-center justify-center animate-[fadeIn_0.5s_ease-out] transition-all duration-700 ${isIdle ? 'cursor-none' : ''}`}>
      
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center">
        
        {/* 2. Fade out header if idle */}
        <div className={`text-[12px] font-bold text-indigo-400 tracking-[0.3em] uppercase mb-8 transition-opacity duration-700 ${isIdle ? 'opacity-0' : 'opacity-100'}`}>
          Deep Focus Mode
        </div>

        {/* TIMER NEVER FADES */}
        <div className="text-[150px] md:text-[200px] font-extrabold text-white leading-none tracking-tight mb-16 drop-shadow-2xl font-['Plus_Jakarta_Sans']">
          {mins}:{secs}
        </div>

        {/* 3. Fade out controls if idle */}
        <div className={`flex items-center gap-8 mb-16 transition-opacity duration-700 ${isIdle ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <button
            onClick={toggleTimer} 
            className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center text-4xl hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)]"
          >
            <Icon d={running ? Icons.pause : Icons.play} size={32} className={running ? "" : "ml-1"} />
          </button>

          <button
            onClick={toggleZenMode}
            className="px-6 py-4 rounded-full bg-white/5 text-white/50 font-bold text-[14px] hover:bg-white/10 hover:text-white transition-all border border-white/10"
          >
            Exit Zen Mode (Esc)
          </button>
        </div>

        {/* 4. Fade out Spotify if idle */}
        <div className={`w-full max-w-[400px] flex flex-col items-center transition-opacity duration-700 ${isIdle ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          
          {spotifyUrl ? (
            <div className="w-full h-[152px]">
              <iframe 
                style={{ borderRadius: '16px' }} 
                src={getSpotifyEmbedUrl(spotifyUrl)} 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                loading="lazy"
                className="shadow-2xl border border-white/10 bg-[#282828]"
              ></iframe>
            </div>
          ) : (
            <div className="w-full h-[152px] rounded-[16px] border border-dashed border-white/20 bg-white/[0.02] flex flex-col items-center justify-center text-center p-6 shadow-2xl">
              <span className="text-3xl mb-2 opacity-50">🎧</span>
              <div className="text-[13px] font-bold text-white/70">Connect Your Flow State</div>
              <div className="text-[11px] text-white/40 mt-1">Paste a Spotify playlist link below to enable the built-in player.</div>
            </div>
          )}
          
          {/* Custom Playlist Input */}
          <div className={`mt-6 w-full flex items-center gap-3 transition-opacity duration-300 ${spotifyUrl ? 'opacity-30 hover:opacity-100 focus-within:opacity-100' : 'opacity-100'}`}>
            <span className="text-[14px]">{spotifyUrl ? '🔗' : '✨'}</span>
            <input 
              type="text" 
              value={spotifyUrl}
              onChange={(e) => setSpotifyUrl(e.target.value)}
              placeholder="Paste Spotify playlist link here..."
              className="w-full bg-transparent border-b border-white/20 text-white text-[12px] pb-1.5 outline-none focus:border-indigo-400 placeholder:text-white/30 transition-colors"
            />
            {spotifyUrl && (
              <button onClick={() => setSpotifyUrl("")} className="text-[10px] text-white/40 hover:text-red-400 font-bold tracking-wider uppercase">Clear</button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}