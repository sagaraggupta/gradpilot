import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';

export default function FlashcardModal({
  isOpen, onClose, isGenerating, activeStudyTask, 
  studyMode, studyData, generateStudyMaterial, completeStudySession
}) {
  // Local state for interactive modes
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  // Reset local state whenever the modal opens or the mode changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSelectedAnswers({});
    setShowQuizResults(false);
  }, [isOpen, studyMode]);

  const handleQuizSelect = (option) => {
    if (showQuizResults) return;
    setSelectedAnswers({ ...selectedAnswers, [currentIndex]: option });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Tutor Dashboard">
      
      {/* ─── STATE 1: LOADING ─── */}
      {isGenerating && (
        <div className="py-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 border-4 border-fuchsia-500/20 border-t-fuchsia-500 rounded-full animate-spin mb-6"></div>
          <h3 className="text-[16px] font-bold text-slate-200">AI is analyzing the material...</h3>
          <p className="text-white/40 text-[13px] mt-2">Preparing custom content for "{activeStudyTask?.title}"</p>
        </div>
      )}

      {/* ─── STATE 2: MODE SELECTION ─── */}
      {!isGenerating && studyMode === null && (
        <div className="flex flex-col gap-4 py-4">
          <p className="text-[13px] text-white/60 text-center mb-2">How would you like to study this assignment?</p>
          
          <button onClick={() => generateStudyMaterial('summary')} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all group text-left">
            <div className="text-3xl bg-blue-500/20 p-3 rounded-xl group-hover:scale-110 transition-transform">📄</div>
            <div>
              <div className="text-[14px] font-bold text-slate-200">Executive Summary</div>
              <div className="text-[11px] text-white/40 mt-1">A quick, high-yield overview of the core concepts.</div>
            </div>
          </button>

          <button onClick={() => generateStudyMaterial('flashcards')} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-fuchsia-500/50 hover:bg-fuchsia-500/10 transition-all group text-left">
            <div className="text-3xl bg-fuchsia-500/20 p-3 rounded-xl group-hover:scale-110 transition-transform">🗂️</div>
            <div>
              <div className="text-[14px] font-bold text-slate-200">Smart Flashcards</div>
              <div className="text-[11px] text-white/40 mt-1">Memorize facts with active recall and spaced repetition.</div>
            </div>
          </button>

          <button onClick={() => generateStudyMaterial('quiz')} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-green-500/50 hover:bg-green-500/10 transition-all group text-left">
            <div className="text-3xl bg-green-500/20 p-3 rounded-xl group-hover:scale-110 transition-transform">🎯</div>
            <div>
              <div className="text-[14px] font-bold text-slate-200">Mock Quiz</div>
              <div className="text-[11px] text-white/40 mt-1">Test your knowledge with AI-generated multiple choice questions.</div>
            </div>
          </button>
        </div>
      )}

      {/* ─── STATE 3: SUMMARY MODE ─── */}
      {!isGenerating && studyMode === 'summary' && studyData?.summary && (
        <div className="flex flex-col h-full max-h-[60vh]">
          <div className="flex-1 overflow-y-auto pr-2 text-slate-300 text-[14px] leading-relaxed whitespace-pre-wrap">
            {studyData.summary}
          </div>
          <button onClick={completeStudySession} className="w-full mt-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-[13px] rounded-xl shadow-lg hover:opacity-90">
            Finish Reading (+40 XP)
          </button>
        </div>
      )}

      {/* ─── STATE 4: FLASHCARD MODE ─── */}
      {!isGenerating && studyMode === 'flashcards' && Array.isArray(studyData) && (
        <div className="flex flex-col items-center py-4">
          <div className="text-[12px] font-bold text-white/40 uppercase tracking-widest mb-6">Card {currentIndex + 1} of {studyData.length}</div>
          <div className="relative w-full max-w-sm h-64 [perspective:1000px] mb-8">
            <div className={`w-full h-full transition-all duration-500 [transform-style:preserve-3d] cursor-pointer shadow-2xl rounded-2xl ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
              <div className="absolute inset-0 [backface-visibility:hidden] bg-gradient-to-br from-[#1a1a24] to-[#0d0d14] border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                <div className="text-3xl mb-4 opacity-50">🤔</div>
                <h3 className="text-[16px] font-bold text-slate-200">{studyData[currentIndex].front}</h3>
              </div>
              <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gradient-to-br from-fuchsia-500/20 to-indigo-500/10 border border-fuchsia-500/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                <div className="text-3xl mb-4 opacity-80">💡</div>
                <h3 className="text-[15px] font-bold text-fuchsia-200">{studyData[currentIndex].back}</h3>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full max-w-sm">
            <button onClick={() => { setIsFlipped(false); setTimeout(() => setCurrentIndex(p => p - 1), 150); }} disabled={currentIndex === 0} className="flex-1 py-3 bg-white/5 text-white font-bold text-[13px] rounded-xl disabled:opacity-30">← Prev</button>
            {currentIndex === studyData.length - 1 ? (
              <button onClick={completeStudySession} className="flex-1 py-3 bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white font-bold text-[13px] rounded-xl">Finish</button>
            ) : (
              <button onClick={() => { setIsFlipped(false); setTimeout(() => setCurrentIndex(p => p + 1), 150); }} className="flex-1 py-3 bg-indigo-500 text-white font-bold text-[13px] rounded-xl">Next →</button>
            )}
          </div>
        </div>
      )}

      {/* ─── STATE 5: QUIZ MODE ─── */}
      {!isGenerating && studyMode === 'quiz' && Array.isArray(studyData) && (
        <div className="flex flex-col py-2">
          <div className="flex justify-between items-center mb-6">
            <div className="text-[12px] font-bold text-white/40 uppercase tracking-widest">Question {currentIndex + 1} of {studyData.length}</div>
            {showQuizResults && <div className="text-[12px] font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-md">Review Mode</div>}
          </div>
          
          <h3 className="text-[16px] font-bold text-slate-200 mb-6 leading-relaxed">{studyData[currentIndex].question}</h3>
          
          <div className="flex flex-col gap-3 mb-8">
            {studyData[currentIndex].options.map((opt, i) => {
              const isSelected = selectedAnswers[currentIndex] === opt;
              const isCorrect = opt === studyData[currentIndex].correctAnswer;
              
              let btnClass = "bg-white/5 border-white/10 hover:bg-white/10 text-slate-300";
              if (showQuizResults) {
                if (isCorrect) btnClass = "bg-green-500/20 border-green-500/50 text-green-400";
                else if (isSelected && !isCorrect) btnClass = "bg-red-500/20 border-red-500/50 text-red-400 opacity-50";
                else btnClass = "bg-white/5 border-white/10 opacity-30 text-white/30";
              } else if (isSelected) {
                btnClass = "bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-inner";
              }

              return (
                <button key={i} onClick={() => handleQuizSelect(opt)} disabled={showQuizResults} className={`p-4 rounded-xl border text-left text-[14px] font-medium transition-all ${btnClass}`}>
                  {opt}
                </button>
              );
            })}
          </div>

          {showQuizResults && (
            <div className="mb-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <span className="text-[11px] font-bold text-indigo-400 uppercase block mb-1">AI Explanation</span>
              <p className="text-[13px] text-slate-300">{studyData[currentIndex].explanation}</p>
            </div>
          )}

          <div className="mt-auto">
            {!showQuizResults ? (
              currentIndex === studyData.length - 1 ? (
                <button onClick={() => setShowQuizResults(true)} disabled={!selectedAnswers[currentIndex]} className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl disabled:opacity-30">Submit Quiz</button>
              ) : (
                <button onClick={() => setCurrentIndex(p => p + 1)} disabled={!selectedAnswers[currentIndex]} className="w-full py-3 bg-indigo-500 text-white font-bold rounded-xl disabled:opacity-30">Next Question</button>
              )
            ) : (
              <div className="flex gap-3">
                <button onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0} className="flex-1 py-3 bg-white/5 text-white font-bold rounded-xl disabled:opacity-30">← Review</button>
                {currentIndex === studyData.length - 1 ? (
                  <button onClick={completeStudySession} className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl">Finish (+40 XP)</button>
                ) : (
                  <button onClick={() => setCurrentIndex(p => p + 1)} className="flex-1 py-3 bg-white/10 text-white font-bold rounded-xl">Next →</button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}