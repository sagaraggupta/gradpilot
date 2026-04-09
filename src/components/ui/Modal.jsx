import React, { useEffect } from "react";
import { createPortal } from "react-dom"; // 👈 1. Import createPortal
import { Icon, Icons } from "./Icon";

export default function Modal({ isOpen, onClose, title, children }) {
  // Prevent scrolling on the background when the modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen) return null;

  // 👈 2. Wrap the entire return inside createPortal()
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      
      {/* The dark overlay that blocks all background clicks */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" 
        onClick={onClose}
      />
      
      {/* The actual Modal Content Box */}
      <div className="relative w-full max-w-md bg-[#13131a] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-[slideUp_0.2s_ease-out]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <h3 className="text-[16px] font-bold text-slate-100 tracking-tight">{title}</h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white flex items-center justify-center transition-colors"
          >
            <Icon d={Icons.x} size={18} />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>

      </div>
    </div>,
    document.body // 👈 3. Teleport it directly to the document body!
  );
}