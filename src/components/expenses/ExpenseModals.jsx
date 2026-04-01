import React from 'react';
import Modal from '../ui/Modal';

export function AddExpenseModal({
  isOpen, onClose, handleAddExpense, isSubmitting, newExpense, 
  setNewExpense, errors, setErrors, CATEGORY_CONFIG
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log New Expense">
      <form onSubmit={handleAddExpense} className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Amount (₹) *</label>
            <input type="number" min="1" step="any" placeholder="e.g. 150" value={newExpense.amount} onChange={e => { setNewExpense({...newExpense, amount: e.target.value}); setErrors({...errors, amount: null}); }} className={`w-full bg-[#0d0d14] border rounded-xl px-4 py-3 text-slate-200 text-[13px] outline-none transition-colors font-bold ${errors.amount ? 'border-red-500/50 focus:border-red-500/50' : 'border-white/10 focus:border-orange-500/50'}`} />
            {errors.amount && <span className="text-[11px] text-red-400 mt-1 block">{errors.amount}</span>}
          </div>
          <div>
            <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Date *</label>
            <input type="date" value={newExpense.date} onChange={e => { setNewExpense({...newExpense, date: e.target.value}); setErrors({...errors, date: null}); }} className={`w-full bg-[#0d0d14] border rounded-xl px-4 py-3 text-slate-200 text-[13px] outline-none transition-colors [color-scheme:dark] ${errors.date ? 'border-red-500/50 focus:border-red-500/50' : 'border-white/10 focus:border-orange-500/50'}`} />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2">Category *</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <button key={key} type="button" onClick={() => setNewExpense({...newExpense, category: key})} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[12px] font-medium transition-all duration-200 ${newExpense.category === key ? 'bg-orange-500/20 border-orange-500/50 text-orange-400 shadow-md' : 'bg-[#0d0d14] border-white/10 text-white/40 hover:bg-white/5 hover:text-white/70'}`}>
                <span className="text-sm">{config.icon}</span> <span className="truncate">{key}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Note (Optional)</label>
          <input type="text" placeholder="e.g. Lunch at canteen" value={newExpense.note} onChange={e => setNewExpense({...newExpense, note: e.target.value})} className="w-full bg-[#0d0d14] border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-[13px] outline-none focus:border-orange-500/50 transition-colors" />
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full mt-2 bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold text-[13px] py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-orange-500/20">
          {isSubmitting ? "Logging..." : "Log Expense"}
        </button>
      </form>
    </Modal>
  );
}

export function BudgetSettingsModal({
  isOpen, onClose, handleUpdateBudget, isSubmitting, newBudgetInput, setNewBudgetInput
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Budget Settings">
      <form onSubmit={handleUpdateBudget} className="flex flex-col gap-5">
        <div>
          <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Monthly Budget Limit (₹)</label>
          <input autoFocus type="number" min="1" value={newBudgetInput} onChange={e => setNewBudgetInput(e.target.value)} className="w-full bg-[#0d0d14] border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-[15px] font-bold outline-none focus:border-indigo-500/50 transition-colors" />
          <p className="text-[11px] text-white/40 mt-2">This limit will apply to your dashboard calculations.</p>
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full mt-2 bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-[13px] py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-indigo-500/20">
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </Modal>
  );
}