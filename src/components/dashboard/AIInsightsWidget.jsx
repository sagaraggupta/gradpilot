import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function AIInsightsWidget() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    const generateInsights = async () => {
      if (!user?.id) return;
      setLoading(true);

      const [ { data: tasks }, { data: habits }, { data: expenses }, { data: profile } ] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', user.id).eq('status', 'pending'),
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('expenses').select('*').eq('user_id', user.id),
        supabase.from('profiles').select('monthly_budget').eq('id', user.id).single()
      ]);

      const newInsights = [];
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // 1. HABIT ANALYSIS (The Dopamine Loop)
      if (habits) {
        const missedHabits = habits.filter(h => h.last_completed !== todayStr);
        if (missedHabits.length > 0) {
          newInsights.push({
            id: 'habits',
            type: 'warning',
            icon: '🔥',
            title: 'Streak at Risk',
            message: `You have ${missedHabits.length} uncompleted habits today (${missedHabits[0].name}). Don't break the chain!`
          });
        } else if (habits.length > 0) {
          newInsights.push({
            id: 'habits',
            type: 'success',
            icon: '⭐',
            title: 'Perfect Day',
            message: 'All daily habits completed. You are building serious momentum.'
          });
        }
      }

      // 2. TASK ANALYSIS (The Urgency Driver)
      if (tasks) {
        const dueTodayOrOverdue = tasks.filter(t => new Date(t.due) <= today);
        if (dueTodayOrOverdue.length > 0) {
          newInsights.push({
            id: 'tasks',
            type: 'danger',
            icon: '⚠️',
            title: 'Action Required',
            message: `You have ${dueTodayOrOverdue.length} assignments due today or overdue. Open your Kanban board immediately.`
          });
        }
      }

      // 3. FINANCE ANALYSIS (The Reality Check)
      if (expenses && profile) {
        const currentMonthExp = expenses.filter(exp => new Date(exp.date).getMonth() === today.getMonth());
        const spentThisMonth = currentMonthExp.reduce((acc, exp) => acc + Number(exp.amount), 0);
        const budget = profile.monthly_budget || 7000;
        
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const safeBurnToDate = (budget / daysInMonth) * today.getDate();

        if (spentThisMonth > budget) {
          newInsights.push({
            id: 'finance',
            type: 'danger',
            icon: '💸',
            title: 'Budget Exceeded',
            message: `You have blown past your ₹${budget} monthly limit. Halt all non-essential spending.`
          });
        } else if (spentThisMonth > safeBurnToDate) {
          newInsights.push({
            id: 'finance',
            type: 'warning',
            icon: '📉',
            title: 'Burning Cash Too Fast',
            message: `You've spent ₹${spentThisMonth}, which is higher than your safe target for this time of the month. Slow down.`
          });
        } else {
          newInsights.push({
            id: 'finance',
            type: 'success',
            icon: '📈',
            title: 'Finances Healthy',
            message: 'You are currently spending below your daily limit. Great job managing your budget!'
          });
        }
      }

      // Keep only the top 3 most critical insights to avoid overwhelming the user
      setInsights(newInsights.slice(0, 3));
      setLoading(false);
    };

    generateInsights();
  }, [user]);

  if (loading) return (
    <div className="flex gap-4 animate-[pulse_1.5s_ease-in-out_infinite] w-full overflow-x-auto pb-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="min-w-[280px] h-[100px] bg-white/5 border border-white/10 rounded-2xl shrink-0" />
      ))}
    </div>
  );

  if (insights.length === 0) return null;

  return (
    <div className="w-full mb-8">
      <h2 className="text-[14px] font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
        <span>🤖</span> AI Daily Briefing
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar">
        {insights.map(insight => {
          const colors = {
            danger: 'bg-red-500/10 border-red-500/30 text-red-400',
            warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
            success: 'bg-green-500/10 border-green-500/30 text-green-400'
          };

          return (
            <div key={insight.id} className={`snap-start min-w-[280px] max-w-[320px] p-4 rounded-2xl border ${colors[insight.type]} flex-1 shadow-lg`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{insight.icon}</span>
                <span className="text-[13px] font-bold tracking-wide">{insight.title}</span>
              </div>
              <p className="text-[12px] opacity-80 leading-relaxed font-medium">
                {insight.message}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}