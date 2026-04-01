import React from 'react';
import Modal from '../ui/Modal';

export default function DrillDownModal({ isOpen, onClose, category, data }) {
  if (!category || !data) return null;

  const renderContent = () => {
    switch (category) {
      case 'Productivity':
        const pendingTasks = data.tasks?.filter(t => t.status !== 'completed') || [];
        return (
          <div>
            <p className="text-[12px] text-white/50 mb-3">Tasks dragging down your score:</p>
            {pendingTasks.length === 0 ? <p className="text-emerald-400 text-sm">All caught up! 🌟</p> : (
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2">
                {pendingTasks.map(t => (
                  <div key={t.id} className="p-3 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center">
                    <span className="text-[13px] text-slate-200 font-bold">{t.title}</span>
                    <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded-md uppercase">Pending</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'Consistency':
        const brokenHabits = data.habits?.filter(h => h.streak === 0) || [];
        return (
          <div>
            <p className="text-[12px] text-white/50 mb-3">Habits that need attention:</p>
            {brokenHabits.length === 0 ? <p className="text-emerald-400 text-sm">Perfect streaks! 🔥</p> : (
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2">
                {brokenHabits.map(h => (
                  <div key={h.id} className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
                    <span className="text-xl bg-[#0d0d14] p-2 rounded-lg">{h.icon}</span>
                    <div>
                      <span className="text-[13px] text-slate-200 font-bold block">{h.name}</span>
                      <span className="text-[10px] text-orange-400 font-bold">0 Day Streak</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'Attendance':
        const atRisk = data.attendance?.filter(a => a.total > 0 && (a.present / a.total * 100) < a.required) || [];
        return (
          <div>
            <p className="text-[12px] text-white/50 mb-3">Classes below required threshold:</p>
            {atRisk.length === 0 ? <p className="text-emerald-400 text-sm">Attendance is safe! 🎓</p> : (
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2">
                {atRisk.map(a => (
                  <div key={a.id} className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl flex justify-between items-center">
                    <span className="text-[13px] text-slate-200 font-bold">{a.subject}</span>
                    <span className="text-[12px] font-extrabold text-red-400">{Math.round((a.present / a.total) * 100)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'Finance':
        const currentMonth = new Date().getMonth();
        const expenses = data.expenses?.filter(e => new Date(e.date).getMonth() === currentMonth)
          .sort((a,b) => b.amount - a.amount).slice(0, 5) || [];
        return (
          <div>
            <p className="text-[12px] text-white/50 mb-3">Top 5 expenses this month:</p>
            {expenses.length === 0 ? <p className="text-emerald-400 text-sm">No expenses yet! 💰</p> : (
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2">
                {expenses.map(e => (
                  <div key={e.id} className="p-3 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center">
                    <span className="text-[13px] text-slate-200 font-bold">{e.title}</span>
                    <span className="text-[13px] font-extrabold text-orange-400">₹{e.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return <p className="text-white/40 text-sm">Drill down data not available for this category.</p>;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${category} Breakdown`}>
      {renderContent()}
    </Modal>
  );
}