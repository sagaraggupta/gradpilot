import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

export default function AttendanceTrends({ subjects }) {
  if (!subjects || subjects.length === 0) return null;

  // Format data for Recharts
  const data = subjects.map(s => {
    const pct = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0;
    return {
      name: s.subject.length > 8 ? s.subject.substring(0, 8) + '...' : s.subject, // Shorten long names
      fullSubject: s.subject,
      Attendance: pct,
      Target: s.required,
      isRisk: pct < s.required
    };
  });

  // Custom hover tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1a1a24] border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="text-[12px] font-bold text-slate-200 mb-1">{data.fullSubject}</p>
          <p className={`text-[11px] font-bold ${data.isRisk ? 'text-red-400' : 'text-indigo-400'}`}>
            Current: {data.Attendance}%
          </p>
          <p className="text-[10px] text-white/40 mt-0.5">Target: {data.Target}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-full min-h-[300px] flex flex-col">
      <h3 className="text-slate-100 font-bold text-[16px] mb-6 flex items-center gap-2">
        📈 Subject Performance
      </h3>
      <div className="flex-1 w-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            
            {/* The 75% Danger Line */}
            <ReferenceLine y={75} stroke="rgba(248,113,113,0.3)" strokeDasharray="4 4" />
            
            <Bar dataKey="Attendance" radius={[6, 6, 0, 0]} maxBarSize={45}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.isRisk ? '#f87171' : '#6366f1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}