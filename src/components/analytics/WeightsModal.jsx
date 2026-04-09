import React from 'react';
import Modal from '../ui/Modal';

export default function WeightsModal({ isOpen, onClose, weights, setWeights }) {
  const handleSlider = (category, value) => {
    setWeights(prev => ({ ...prev, [category]: Number(value) }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Engine Weights">
      <div className="flex flex-col gap-4">
        <p className="text-[12px] text-white/50 mb-4 leading-relaxed">
          As an engineering student, your priorities shift. Adjust these sliders to define how your 
          <strong> Master Score</strong> is calculated. 
          <span className="text-indigo-400 block mt-1 font-bold">
            Higher weights in Productivity and Consistency will help you rank up faster in the Pilot Leagues.
          </span>
        </p>
        
        {Object.entries(weights).map(([category, weight]) => (
          <div key={category} className="bg-[#0d0d14] border border-white/10 p-4 rounded-xl group hover:border-indigo-500/30 transition-colors">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[13px] font-bold text-slate-200 uppercase tracking-wider">{category}</span>
              <span className="text-[14px] font-extrabold text-indigo-400">{weight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={weight}
              onChange={(e) => handleSlider(category, e.target.value)}
              className="w-full accent-indigo-500 bg-white/10 rounded-lg appearance-none h-2 cursor-pointer"
            />
          </div>
        ))}
        
        <button onClick={onClose} className="w-full mt-2 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:scale-[1.02] text-white text-[13px] font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20">
          Lock Configuration & Sync Ranks
        </button>
      </div>
    </Modal>
  );
}