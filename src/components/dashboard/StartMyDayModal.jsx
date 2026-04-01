import React from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';
import { Icon, Icons } from '../ui/Icon';

export default function StartMyDayModal({ isOpen, onClose, stats }) {
  const navigate = useNavigate();

  if (!stats) return null;

  // 🧠 THE SCHEDULING ALGORITHM
  // We dynamically generate a timeline based on their actual workload
  const timeline = [];

  // 1. First Priority: Classes (Fixed Time Commitments)
  if (stats.classesToday?.length > 0) {
    timeline.push({
      time: "Morning / Daytime",
      title: "Attend Scheduled Classes",
      desc: `${stats.classesToday.map(c => c.subject).join(', ')}. Keep that attendance above target!`,
      icon: "🎓",
      color: "blue"
    });
  }

  // 2. Second Priority: Quick Wins (Habits)
  if (stats.habitsLeft > 0) {
    timeline.push({
      time: "In Between Classes",
      title: "Knock out Quick Habits",
      desc: `You have ${stats.habitsLeft} habits left today. Don't lose those streaks.`,
      icon: "🔥",
      color: "amber"
    });
  }

  // 3. Third Priority: Deep Work (Top 2 Urgent Tasks)
  if (stats.urgentTasks?.length > 0) {
    const topTasks = stats.urgentTasks.slice(0, 2);
    timeline.push({
      time: "Focus Block (2 Hours)",
      title: "Deep Work Execution",
      desc: `Crush your top priorities: ${topTasks.map(t => t.title).join(' & ')}.`,
      icon: "🧠",
      color: "indigo"
    });
  }

  // 4. Fallback if they are completely free
  if (timeline.length === 0) {
    timeline.push({
      time: "All Day",
      title: "Free Time / Recovery",
      desc: "No classes, no urgent tasks, habits are done. Rest up, Pilot.",
      icon: "🌟",
      color: "emerald"
    });
  }

  const handleLaunch = () => {
    onClose();
    // Auto-redirect them to the timer to start their Deep Work block!
    navigate('/timer'); 
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Your Daily Flight Plan">
      <div className="flex flex-col gap-6 relative">
        <p className="text-[13px] text-white/60 mb-2">
          We have analyzed your deadlines, attendance, and habits. Here is your optimal order of operations for today.
        </p>

        {/* TIMELINE UI */}
        <div className="flex flex-col gap-4 relative">
          {/* Vertical tracking line */}
          <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-white/10 z-0" />
          
          {timeline.map((item, index) => (
            <div key={index} className="flex gap-4 relative z-10">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg text-2xl
                ${item.color === 'blue' ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400' : 
                  item.color === 'amber' ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' : 
                  item.color === 'indigo' ? 'bg-indigo-500/20 border border-indigo-500/50 text-indigo-400' : 
                  'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'}`}
              >
                {item.icon}
              </div>
              <div className="bg-[#0d0d14] border border-white/5 p-4 rounded-2xl flex-1 hover:border-white/10 transition-colors">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">{item.time}</div>
                <div className="text-[14px] font-bold text-slate-200">{item.title}</div>
                <div className="text-[12px] text-white/50 mt-1 leading-relaxed">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ONE-CLICK LAUNCH BUTTON */}
        <button 
          onClick={handleLaunch}
          className="w-full mt-4 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:scale-[1.02] active:scale-95 text-white text-[15px] font-extrabold rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] flex justify-center items-center gap-2"
        >
          <span>🚀</span> Execute Flight Plan
        </button>
      </div>
    </Modal>
  );
}