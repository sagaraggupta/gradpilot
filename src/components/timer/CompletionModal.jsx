import React from 'react';
import Modal from '../ui/Modal';
import { Icon, Icons } from '../ui/Icon';

export default function CompletionModal({
  isOpen, onClose, sessionMood, setSessionMood, activeTask, submitSession
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Focus Session Complete!">
      <div className="flex flex-col items-center text-center gap-5 py-2">
        
        <div className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl">
          <h3 className="text-[14px] font-bold text-slate-100 mb-3">How did this session feel?</h3>
          <div className="flex gap-3 justify-center">
            {[
              { id: 'great', emoji: '🟢', label: 'Felt Great' },
              { id: 'okay', emoji: '🟡', label: 'Okay' },
              { id: 'struggled', emoji: '🔴', label: 'Struggled' }
            ].map(mood => (
              <button 
                key={mood.id}
                onClick={() => setSessionMood(mood.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all flex-1
                  ${sessionMood === mood.id ? 'bg-indigo-500/20 border-indigo-500/50 shadow-md scale-105' : 'bg-[#0d0d14] border-white/5 opacity-60 hover:opacity-100'}`}
              >
                <span className="text-2xl">{mood.emoji}</span>
                <span className={`text-[11px] font-bold ${sessionMood === mood.id ? 'text-indigo-300' : 'text-white/50'}`}>{mood.label}</span>
              </button>
            ))}
          </div>
        </div>

        {activeTask ? (
          <div className="w-full mt-2">
            <p className="text-[13px] text-white/60 mb-4">
              You were focusing on <strong className="text-indigo-400">"{activeTask.title}"</strong>. Cross it off your list?
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
              <button onClick={() => submitSession(false)} className="py-3 px-4 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 font-semibold text-[13px] transition-colors">
                Need more time
              </button>
              <button onClick={() => submitSession(true)} className="py-3 px-4 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 font-bold text-[13px] flex items-center justify-center gap-2 transition-colors">
                <Icon d={Icons.check} size={16} /> Mark Completed
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => submitSession(false)} 
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-[14px] hover:opacity-90 transition-opacity"
          >
            Save & Take a Break (+20 XP)
          </button>
        )}

      </div>
    </Modal>
  );
}