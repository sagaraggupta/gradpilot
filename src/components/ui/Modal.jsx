import React from "react";
import { Icon, Icons } from "./Icon";

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-[#0d0d14] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-lg font-bold text-slate-100 font-['Sora']">{title}</h3>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Icon d={Icons.x} size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {children}
        </div>
        
      </div>
    </div>
  );
}