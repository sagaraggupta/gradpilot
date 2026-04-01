import React from 'react';

export default function ExpenseAlerts({ totalSpent, monthlyBudget, spentToday, dailyBudget }) {
  const alerts = [];
  const pct = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;

  // 1. Monthly Overspend Warning
  if (pct >= 100) {
    alerts.push({ id: 1, type: 'danger', icon: '🚨', message: `You have exceeded your monthly budget by ₹${(totalSpent - monthlyBudget).toLocaleString()}!` });
  } 
  // 2. 80% Danger Zone Warning
  else if (pct >= 80) {
    alerts.push({ id: 2, type: 'warning', icon: '⚠️', message: `Careful! You have used ${Math.round(pct)}% of your monthly budget. Slow down.` });
  }

  // 3. Daily Limit Warning
  if (spentToday > dailyBudget) {
    alerts.push({ id: 3, type: 'warning', icon: '📈', message: `You spent ₹${spentToday.toLocaleString()} today, exceeding your safe daily limit of ₹${dailyBudget.toLocaleString()}.` });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mb-5">
      {alerts.map(a => (
        <div key={a.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${a.type === 'danger' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
          <span className="text-xl">{a.icon}</span>
          <div className="text-[13px] font-medium leading-relaxed">{a.message}</div>
        </div>
      ))}
    </div>
  );
}