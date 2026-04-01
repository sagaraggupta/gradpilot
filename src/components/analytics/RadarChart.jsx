import React from 'react';
import ProgressBar from '../ui/ProgressBar';

export default function RadarChart({ scores, trends, onCardClick }) {
  const getRadarPoint = (value, angle, maxRadius = 80, center = 100) => {
    const rad = (angle - 90) * (Math.PI / 180); 
    const r = (Math.max(10, value) / 100) * maxRadius; 
    return `${center + r * Math.cos(rad)},${center + r * Math.sin(rad)}`;
  };

  const radarPoints = [
    getRadarPoint(scores.Academics, 0), getRadarPoint(scores.Productivity, 72),
    getRadarPoint(scores.Consistency, 144), getRadarPoint(scores.Finance, 216),
    getRadarPoint(scores.Attendance, 288),
  ].join(" ");

  return (
    <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-8">
      <div className="relative w-[220px] h-[220px] shrink-0">
        <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
          {[20, 40, 60, 80].map(radius => (
            <polygon key={radius} points={[getRadarPoint(radius, 0, 80), getRadarPoint(radius, 72, 80), getRadarPoint(radius, 144, 80), getRadarPoint(radius, 216, 80), getRadarPoint(radius, 288, 80)].join(" ")} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          ))}
          {[0, 72, 144, 216, 288].map(angle => (
            <line key={angle} x1="100" y1="100" x2={getRadarPoint(100, angle, 80).split(',')[0]} y2={getRadarPoint(100, angle, 80).split(',')[1]} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          ))}
          <polygon points={radarPoints} fill="rgba(129, 140, 248, 0.3)" stroke="#818cf8" strokeWidth="2" strokeLinejoin="round" className="drop-shadow-[0_0_15px_rgba(129,140,248,0.5)] transition-all duration-1000" />
          <text x="100" y="10" fill="#a1a1aa" fontSize="9" fontWeight="bold" textAnchor="middle">ACADEMICS</text>
          <text x="195" y="75" fill="#a1a1aa" fontSize="9" fontWeight="bold" textAnchor="end">PRODUCTIVITY</text>
          <text x="175" y="185" fill="#a1a1aa" fontSize="9" fontWeight="bold" textAnchor="middle">CONSISTENCY</text>
          <text x="25" y="185" fill="#a1a1aa" fontSize="9" fontWeight="bold" textAnchor="middle">FINANCE</text>
          <text x="5" y="75" fill="#a1a1aa" fontSize="9" fontWeight="bold" textAnchor="start">ATTENDANCE</text>
        </svg>
      </div>
      <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(scores).map(([label, score]) => {
          const trend = trends[label] || 0;
          const isPositive = trend > 0;
          const isNegative = trend < 0;
          
          return (
            <div 
              key={label} 
              onClick={() => onCardClick(label)}
              className="bg-[#0d0d14] border border-white/5 rounded-xl p-4 cursor-pointer hover:border-indigo-500/50 hover:bg-white/5 transition-all group"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-white/50 group-hover:text-indigo-300 transition-colors">
                  {label} <span className="text-[9px] opacity-0 group-hover:opacity-100 transition-opacity">(Click to view)</span>
                </span>
                <span className="text-[13px] font-extrabold text-indigo-400">{Math.round(score)}/100</span>
              </div>
              <ProgressBar value={score} color="#818cf8" height={4} />
              
              {/* TREND BADGE */}
              {trend !== 0 && (
                <div className={`mt-2 text-[10px] font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'} flex items-center gap-1`}>
                  {isPositive ? '↑' : '↓'} {Math.abs(trend)}% vs last week
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}