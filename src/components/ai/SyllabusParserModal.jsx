import React from 'react';
import Modal from "../ui/Modal";

export default function SyllabusParserModal({
  isOpen,
  onClose,
  syllabusText,
  setSyllabusText,
  handleParseSyllabus,
  isParsing
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Syllabus Auto-Parser">
      <form onSubmit={handleParseSyllabus} className="flex flex-col gap-4">
        <div>
          <p className="text-[13px] text-white/60 mb-4 leading-relaxed">
            Paste the text from your course syllabus below. AI Agent will scan it, extract all assignment names and due dates, and magically add them to your Kanban board!
          </p>
          <textarea 
            value={syllabusText} 
            onChange={(e) => setSyllabusText(e.target.value)}
            placeholder="Paste syllabus text here (e.g., 'Midterm Exam is on Oct 14th. Final Essay due Nov 2nd...')"
            className="w-full h-48 bg-[#0d0d14] border border-white/10 rounded-xl p-4 text-slate-200 text-[13px] outline-none focus:border-indigo-500/50 resize-none transition-colors leading-relaxed"
          />
        </div>
        <button 
          type="submit" 
          disabled={isParsing || !syllabusText.trim()}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold text-[13px] py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-green-500/20"
        >
          {isParsing ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing Syllabus...</>
          ) : (
            <>✨ Extract & Add Tasks</>
          )}
        </button>
      </form>
    </Modal>
  );
}