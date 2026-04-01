import React, { useState, useRef, useEffect } from 'react';

const SOUNDS = [
  { id: 'rain', name: 'Rain', icon: '🌧️', file: '/sounds/rain.mp3' },
  { id: 'library', name: 'Library', icon: '📚', file: '/sounds/library.mp3' },
  { id: 'whiteNoise', name: 'White Noise', icon: '📻', file: '/sounds/noise.mp3' },
  { id: 'cafe', name: 'Cafe', icon: '☕', file: '/sounds/cafe.mp3' }
];

export default function AmbientSounds() {
  const [activeSound, setActiveSound] = useState(null);
  const [volume, setVolume] = useState(0.5);
  const audioRefs = useRef({});

  // Handle Play/Pause routing
  const toggleSound = (id) => {
    if (activeSound === id) {
      // Turn off current sound
      audioRefs.current[id].pause();
      setActiveSound(null);
    } else {
      // Turn off previous sound, turn on new one
      if (activeSound && audioRefs.current[activeSound]) {
        audioRefs.current[activeSound].pause();
      }
      setActiveSound(id);
      audioRefs.current[id].currentTime = 0;
      audioRefs.current[id].play().catch(e => console.warn("Audio file missing or blocked:", e));
    }
  };

  // Live Volume Adjustment
  useEffect(() => {
    if (activeSound && audioRefs.current[activeSound]) {
      audioRefs.current[activeSound].volume = volume;
    }
  }, [volume, activeSound]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) audio.pause();
      });
    };
  }, []);

  return (
    <div className="w-full max-w-[650px] mt-2 bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <h3 className="text-[14px] font-bold text-slate-200 flex items-center gap-2">
          <span className="text-lg">🎧</span> Ambient Soundscapes
        </h3>
        
        {/* Volume Slider (Only shows if a sound is playing) */}
        <div className={`flex items-center gap-2 transition-opacity duration-300 ${activeSound ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <span className="text-[10px] text-white/40">🔉</span>
          <input 
            type="range" min="0" max="1" step="0.05" 
            value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <span className="text-[10px] text-white/40">🔊</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SOUNDS.map(sound => (
          <button
            key={sound.id}
            onClick={() => toggleSound(sound.id)}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-[13px] font-bold transition-all
              ${activeSound === sound.id 
                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                : 'bg-[#0d0d14] border-white/10 text-white/40 hover:bg-white/10 hover:text-white/80'}`}
          >
            <span className="text-base">{sound.icon}</span>
            {sound.name}
            
            {/* Hidden Audio Elements */}
            <audio 
              ref={el => audioRefs.current[sound.id] = el} 
              src={sound.file} 
              loop 
              preload="none" 
            />
          </button>
        ))}
      </div>
    </div>
  );
}