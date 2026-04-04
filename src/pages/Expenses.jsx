import React, { useState, useEffect, useMemo } from "react";
import StatCard from "../components/ui/StatCard";
import ProgressBar from "../components/ui/ProgressBar";
import Modal from "../components/ui/Modal";
import { Icon, Icons } from "../components/ui/Icon";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { AddExpenseModal, BudgetSettingsModal } from "../components/expenses/ExpenseModals";
import ExpenseHistory from "../components/expenses/ExpenseHistory";
import ExpenseOverview from "../components/expenses/ExpenseOverview";

const CATEGORY_CONFIG = {
  "Food & Canteen": { icon: "🍱", color: "#f87171" },
  "Transport": { icon: "🚌", color: "#34d399" },
  "Books & Stationery": { icon: "📚", color: "#fbbf24" },
  "Entertainment": { icon: "🎮", color: "#818cf8" },
  "Shopping": { icon: "🛍️", color: "#f472b6" },
  "Health (Medicines)": { icon: "💊", color: "#2dd4bf" },
  "Miscellaneous": { icon: "🛒", color: "#c084fc" }
};

export default function Expenses() {
  const { user } = useAuth();
  const [allExpenses, setAllExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  const [view, setView] = useState("overview"); 
  const [monthlyBudget, setMonthlyBudget] = useState(7000);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newBudgetInput, setNewBudgetInput] = useState("");
  const [errors, setErrors] = useState({});

  const [currentPage, setCurrentPage] = useState(1);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [newExpense, setNewExpense] = useState({
    amount: "", category: "Food & Canteen", note: "", date: todayStr
  });

  useEffect(() => {
      document.title = "Expenses | GradPilot";
    }, []);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user?.id) return; // 🐛 Bug 1 Fix: CRITICAL Null guard
    
    setLoading(true);
    
    const { data: expData, error: expError } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
      
    // 🐛 Bug 2 Fix: Handle errors instead of ignoring them
    if (expError) {
      console.error("Fetch expenses error:", expError);
      showToast("Failed to load expenses. Please try again.", "error");
    } else if (expData) {
      setAllExpenses(expData);
    }

    const { data: profileData } = await supabase.from('profiles').select('monthly_budget').eq('id', user.id).single();
    
    if (profileData && profileData.monthly_budget) {
      setMonthlyBudget(profileData.monthly_budget);
      setNewBudgetInput(profileData.monthly_budget);
    } else {
      setMonthlyBudget(7000);
      setNewBudgetInput(7000);
    }
    
    setLoading(false);
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const val = Number(newBudgetInput);
    if (val > 0) {
      await supabase.from('profiles').update({ monthly_budget: val }).eq('id', user.id);
      setMonthlyBudget(val);
      setIsSettingsModalOpen(false);
      showToast("Budget updated!");
    }
    setIsSubmitting(false);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!newExpense.amount || Number(newExpense.amount) <= 0) newErrors.amount = "Enter a valid amount.";
    if (!newExpense.date) newErrors.date = "Date is required.";
    if (Object.keys(newErrors).length > 0) return setErrors(newErrors);

    setIsSubmitting(true);
    const expenseToInsert = {
      user_id: user.id,
      amount: Number(newExpense.amount),
      category: newExpense.category,
      note: newExpense.note,
      date: newExpense.date
    };

    const { data, error } = await supabase.from('expenses').insert([expenseToInsert]).select();
    
    if (error) {
      showToast("Failed to log expense.", "error");
    } else if (data) {
      // 🐛 Bug 4 Fix: Clean sorting insertion
      setAllExpenses(prev => {
        const updated = [data[0], ...prev];
        return updated.sort((a, b) => new Date(b.date) - new Date(a.date));
      });
      
      // 🐛 Bug 6 Fix: Reset pagination so they can see the new item
      setCurrentPage(1); 
      
      setIsModalOpen(false);
      setNewExpense({ amount: "", category: "Food & Canteen", note: "", date: todayStr });
      showToast("Expense logged!");
      setCurrentDate(new Date(newExpense.date)); 
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    
    // 🐛 Bug 3 Fix: Store old state for rollback
    const previousExpenses = [...allExpenses];
    
    setAllExpenses(prev => prev.filter(e => e.id !== id)); // Optimistic UI update
    
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    
    if (error) {
      setAllExpenses(previousExpenses); // Rollback!
      showToast("Failed to delete transaction. Try again.", "error");
    } else {
      showToast("Transaction deleted.");
    }
  };

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthlyExpenses = useMemo(() => {
    return allExpenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [allExpenses, currentDate]);

  const totalSpentThisMonth = monthlyExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
  // 🐛 Bug 5 Fix: Safe division to prevent Infinity/NaN crashes
  const safeMonthlyBudget = monthlyBudget > 0 ? monthlyBudget : 1; 
  const budgetUsedPct = Math.min(100, (totalSpentThisMonth / safeMonthlyBudget) * 100);
  const isOverBudget = totalSpentThisMonth > monthlyBudget;

  // 🔥 Improvement 2: Daily Spending Limit Logic
  const dailyBudget = Math.round(safeMonthlyBudget / 30);
  const spentToday = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return allExpenses
      .filter(e => new Date(e.date) >= startOfToday)
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
  }, [allExpenses]);
  const isOverDailyBudget = spentToday > dailyBudget;

  const categoryTotals = monthlyExpenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount);
    return acc;
  }, {});

  const recentTwoDaysExpenses = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const twoDaysAgo = new Date(startOfToday);
    twoDaysAgo.setDate(startOfToday.getDate() - 2);
    
    return allExpenses.filter(e => {
      const d = new Date(e.date);
      return d >= twoDaysAgo && d <= new Date();
    });
  }, [allExpenses]);

  const allTimeSpent = allExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
  
  const allTimeSavings = useMemo(() => {
    if (allExpenses.length === 0) return 0;
    
    const oldestDate = new Date(allExpenses[allExpenses.length - 1].date);
    const newestDate = new Date();
    
    const monthsElapsed = (newestDate.getFullYear() - oldestDate.getFullYear()) * 12 + 
                          (newestDate.getMonth() - oldestDate.getMonth()) + 1; 

    const activeMonths = Math.max(1, monthsElapsed);
    return (activeMonths * monthlyBudget) - allTimeSpent;
  }, [allExpenses, monthlyBudget, allTimeSpent]);


  return (
    <div className="flex flex-col gap-5 relative pb-10">
      
      <div className="flex justify-between items-center flex-wrap gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl">
        <div>
          <h2 className="text-slate-100 font-bold text-[20px] font-['Sora']">Expense Tracker</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-white/40 text-[12px]">All-Time Savings:</span>
            <span className={`text-[13px] font-bold ${allTimeSavings >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {allTimeSavings >= 0 ? "+" : "-"}₹{Math.abs(allTimeSavings).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex bg-[#0d0d14] border border-white/10 rounded-xl p-1 shadow-inner">
          <button onClick={() => setView("overview")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${view === "overview" ? 'bg-indigo-500/20 text-indigo-400' : 'text-white/40 hover:text-white/70'}`}>Overview</button>
          <button onClick={() => setView("history")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${view === "history" ? 'bg-indigo-500/20 text-indigo-400' : 'text-white/40 hover:text-white/70'}`}>History</button>
        </div>

        {view === "overview" && (
          <div className="flex items-center bg-[#0d0d14] border border-white/10 rounded-xl p-1 shadow-inner">
            <button onClick={() => changeMonth(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors">
              <Icon d="M15 18l-6-6 6-6" size={16} />
            </button>
            <div className="w-32 text-center text-[13px] font-bold text-slate-200">{monthName}</div>
            <button onClick={() => changeMonth(1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors" disabled={currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear()}>
              <Icon d="M9 18l6-6-6-6" size={16} />
            </button>
          </div>
        )}

        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 text-white text-xs font-bold hover:opacity-90 transition-opacity shadow-lg shadow-orange-500/20 ml-auto md:ml-0">
          <Icon d={Icons.plus} size={14} /> Add Expense
        </button>
      </div>

      {/* 📊 MODULAR OVERVIEW TAB */}
      {view === "overview" && (
        <ExpenseOverview 
          totalSpentThisMonth={totalSpentThisMonth}
          monthlyBudget={monthlyBudget}
          spentToday={spentToday}
          dailyBudget={dailyBudget}
          isOverBudget={isOverBudget}
          monthName={monthName}
          budgetUsedPct={budgetUsedPct}
          categoryTotals={categoryTotals}
          recentTwoDaysExpenses={recentTwoDaysExpenses}
          monthlyExpensesCount={monthlyExpenses.length}
          monthlyExpenses={monthlyExpenses}
          loading={loading}
          handleDelete={handleDelete}
          CATEGORY_CONFIG={CATEGORY_CONFIG}
          setIsSettingsModalOpen={setIsSettingsModalOpen}
        />
      )}

      {/* 📜 MODULAR HISTORY TAB */}
      {view === "history" && (
        <ExpenseHistory 
          allExpenses={allExpenses} 
          handleDelete={handleDelete} 
          CATEGORY_CONFIG={CATEGORY_CONFIG} 
        />
      )}

      {/* 🗔 MODULAR MODALS */}
      <AddExpenseModal 
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        handleAddExpense={handleAddExpense} isSubmitting={isSubmitting}
        newExpense={newExpense} setNewExpense={setNewExpense}
        errors={errors} setErrors={setErrors} CATEGORY_CONFIG={CATEGORY_CONFIG}
      />

      <BudgetSettingsModal 
        isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)}
        handleUpdateBudget={handleUpdateBudget} isSubmitting={isSubmitting}
        newBudgetInput={newBudgetInput} setNewBudgetInput={setNewBudgetInput}
      />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-500/10 border border-green-500/30 text-green-400 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-[fadeIn_0.3s_ease-out]">
          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">✓</div>
          <span className="text-[13px] font-bold">{toast}</span>
        </div>
      )}

    </div>
  );
}