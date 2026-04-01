import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { supabase } from '../../lib/supabase';

export default function AddGoalModal({
  isOpen, onClose, handleAddGoal, newGoal, setNewGoal, isSubmitting, EMOJI_LIST
}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const generateBreakdown = async () => {
    if (!newGoal.title) {
      alert("Please type a Goal Title first!");
      return;
    }
    
    setIsAnalyzing(true);
    try {
      const prompt = `Break down the goal "${newGoal.title}" into exactly 3 short, highly actionable tasks. Return ONLY a comma-separated list of the 3 tasks. No markdown, no numbers. Example: Read chapter 1, Complete practice set, Take quiz`;
      
      const { data, error } = await supabase.functions.invoke('ai-chat', { body: { prompt } });
      if (error) throw error;
      
      const tasks = data.reply.split(',').map(t => t.trim());
      setNewGoal({ ...newGoal, generatedTasks: tasks });
    } catch (error) {
      console.error("AI Breakdown Error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Set a Smart Goal">
      <form onSubmit={handleAddGoal} className="flex flex-col gap-5">
        <div>
          <div className="flex justify-between items-end mb-1.5">
            <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider">Goal Title *</label>
            {!newGoal.generatedTasks && !isAnalyzing && (
              <button type="button" onClick={generateBreakdown} className="text-[10px] text-indigo-400 font-bold hover:text-indigo-300 transition-colors flex items-center gap-1">
                ✨ Generate AI Action Plan
              </button>
            )}
            {isAnalyzing && <span className="text-[10px] text-indigo-400 font-bold animate-pulse">Analyzing...</span>}
          </div>
          <input required type="text" placeholder="e.g. Master Data Structures" value={newGoal.title} onChange={e => setNewGoal({...newGoal, title: e.target.value})} className="w-full bg-[#0d0d14] border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-[13px] outline-none focus:border-indigo-500/50" />
        </div>

        {/* 🚀 THE AI TASKS PREVIEW */}
        {newGoal.generatedTasks && newGoal.generatedTasks.length > 0 && (
          <div className="bg-indigo-500/10 border border-indigo-500/30 p-3.5 rounded-xl mt-[-10px] animate-[fadeIn_0.5s_ease-out]">
            <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">AI Generated Action Plan</h4>
            <ul className="text-[12px] text-slate-300 list-disc pl-4 space-y-1.5">
              {newGoal.generatedTasks.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
            <p className="text-[10px] text-indigo-300/50 mt-3 italic">*These steps will be automatically added to your Assignments Kanban board!</p>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Target Deadline *</label>
          <input required type="date" value={newGoal.deadline} onChange={e => setNewGoal({...newGoal, deadline: e.target.value})} className="w-full bg-[#0d0d14] border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-[13px] outline-none focus:border-indigo-500/50 [color-scheme:dark]" />
        </div>
        
        <div>
          <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2">Choose Emoji</label>
          <div className="flex flex-wrap gap-2">{EMOJI_LIST.map(emoji => (<button key={emoji} type="button" onClick={() => setNewGoal({...newGoal, emoji: emoji})} className={`w-11 h-11 shrink-0 rounded-xl text-xl transition-all ${newGoal.emoji === emoji ? 'bg-indigo-500/20 border border-indigo-500/50 scale-110 shadow-md' : 'bg-[#0d0d14] border border-white/5 hover:bg-white/5 hover:scale-105'}`}>{emoji}</button>))}</div>
        </div>
        
        <button type="submit" disabled={isSubmitting} className="w-full mt-2 bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-[13px] py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">Save Goal & Tasks</button>
      </form>
    </Modal>
  );
}