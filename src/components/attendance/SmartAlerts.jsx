import React from 'react';

export default function SmartAlerts({ subjects }) {
  const alerts = subjects.map(a => {
    const pct = a.total > 0 ? Math.round((a.present / a.total) * 100) : 0;
    const isOk = a.total === 0 || pct >= a.required;
    
    // Calculate how many they need to attend continuously to recover
    const need = (!isOk && a.total > 0) ? Math.ceil((a.required * a.total - a.present * 100) / (100 - a.required)) : 0;
    
    // Proactive Risk: Will they fall below target if they miss JUST ONE class?
    const willFallIfMiss = isOk && a.total > 0 && Math.round((a.present / (a.total + 1)) * 100) < a.required;

    return { ...a, isOk, need, willFallIfMiss };
  }).filter(a => a.need > 0 || a.willFallIfMiss);

  if (alerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 my-4">
      {alerts.map(a => (
        <div key={a.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${a.need > 0 ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
           <span className="text-xl">{a.need > 0 ? '🚨' : '⚠️'}</span>
           <div className="text-[13px] font-medium leading-relaxed">
             <strong className="font-bold">{a.subject}: </strong>
             {a.need > 0 
               ? `You are currently at ${Math.round((a.present/a.total)*100)}%. You must attend the next ${a.need} classes to recover your ${a.required}% target.`
               : `You are exactly at the edge. If you miss the next class, you will fall below your ${a.required}% target!`}
           </div>
        </div>
      ))}
    </div>
  );
}