import React, { useState, useEffect, useMemo } from "react";
import StatCard from "../components/ui/StatCard";
import ProgressBar from "../components/ui/ProgressBar";
import Modal from "../components/ui/Modal";
import { Icon, Icons } from "../components/ui/Icon";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

const CATEGORY_CONFIG = {
  "Food & Canteen": { icon: "🍱", color: "#f87171" },
  "Transport": { icon: "🚌", color: "#34d399" },
  "Books & Stationery": { icon: "📚", color: "#fbbf24" },
  "Entertainment": { icon: "🎮", color: "#818cf8" },
  "Shopping": { icon: "🛍️", color: "#f472b6" },
  "Health (Medicines)": { icon: "💊", color: "#2dd4bf" },
  "Miscellaneous": { icon: "🛒", color: "#c084fc" }
};

const TIME_FILTERS = {
  "1m": "Last 1 Month",
  "3m": "Last 3 Months",
  "6m": "Last 6 Months",
  "9m": "Last 9 Months",
  "1y": "Last 1 Year",
  "all": "All Time"
};

export default function Expenses() {
  const { user } = useAuth();
  const [allExpenses, setAllExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  const [view, setView] = useState("overview"); 
  const [monthlyBudget, setMonthlyBudget] = useState(7000);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [timeFilter, setTimeFilter] = useState("1m");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newBudgetInput, setNewBudgetInput] = useState("");
  const [errors, setErrors] = useState({});

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [newExpense, setNewExpense] = useState({
    amount: "", category: "Food & Canteen", note: "", date: todayStr
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    
    const { data: expData } = await supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: false }).order('created_at', { ascending: false });
    if (expData) setAllExpenses(expData);

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
    if (!error && data) {
      setAllExpenses(prev => [data[0], ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)));
      setIsModalOpen(false);
      setNewExpense({ amount: "", category: "Food & Canteen", note: "", date: todayStr });
      showToast("Expense logged!");
      setCurrentDate(new Date(newExpense.date)); 
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    setAllExpenses(prev => prev.filter(e => e.id !== id));
    await supabase.from('expenses').delete().eq('id', id);
    showToast("Transaction deleted.");
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
  const budgetUsedPct = Math.min(100, (totalSpentThisMonth / monthlyBudget) * 100);
  const isOverBudget = totalSpentThisMonth > monthlyBudget;

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

  // ─── BUG FIX: CORRECTED HISTORY MATH ───
  const filteredHistory = useMemo(() => {
    let filtered = allExpenses;

    const now = new Date();
    const cutoff = new Date();
    if (timeFilter !== "all") {
      // Corrected logic: safely parses 1m vs 1y 
      const monthsToSubtract = timeFilter.endsWith('y') 
        ? parseInt(timeFilter) * 12 
        : parseInt(timeFilter);
        
      cutoff.setMonth(now.getMonth() - monthsToSubtract);
      filtered = filtered.filter(e => new Date(e.date) >= cutoff);
    }

    if (categoryFilter !== "All Categories") {
      filtered = filtered.filter(e => e.category === categoryFilter);
    }
    return filtered;
  }, [allExpenses, timeFilter, categoryFilter]);

  const historyTotalSpent = filteredHistory.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage) || 1;
  const currentHistoryItems = filteredHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [timeFilter, categoryFilter]);

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

      {view === "overview" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Spent This Month" value={`₹${totalSpentThisMonth.toLocaleString()}`} sub="In selected month" icon="expenses" color={isOverBudget ? "#f87171" : "#fb923c"} />
            <StatCard label="Monthly Budget" value={`₹${monthlyBudget.toLocaleString()}`} sub="Target limit" icon="check" color="#4ade80" />
            <StatCard label={isOverBudget ? "Overspent By" : "Remaining"} value={`₹${Math.abs(monthlyBudget - totalSpentThisMonth).toLocaleString()}`} sub={isOverBudget ? "Danger zone!" : "Available to spend"} icon="coins" color={isOverBudget ? "#f87171" : "#818cf8"} />
            <StatCard label="Transactions" value={monthlyExpenses.length} sub="Logged this month" icon="chart" color="#f472b6" />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-end mb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-slate-100 font-semibold text-[15px]">Budget Utilization ({monthName})</h3>
                <button 
                  onClick={() => setIsSettingsModalOpen(true)} 
                  className="w-7 h-7 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors" 
                  title="Edit Budget"
                >
                  <Icon d={Icons.settings} size={14} />
                </button>
              </div>
              <span className={`text-[13px] font-bold ${isOverBudget ? 'text-red-400' : 'text-green-400'}`}>{Math.round(budgetUsedPct)}% used</span>
            </div>
            <div className="relative">
              <ProgressBar value={budgetUsedPct} color={isOverBudget ? "#f87171" : "#4ade80"} height={12} />
              <div className="absolute top-[-2px] bottom-[-2px] w-[2px] bg-amber-400 rounded-sm z-10 opacity-70" style={{ left: '80%' }} title="80% Warning Limit" />
            </div>
            <div className="flex justify-between mt-2 text-[11px] font-medium text-white/40">
              <span>₹{totalSpentThisMonth.toLocaleString()} spent</span>
              <span>80% Warning</span>
              <span>₹{monthlyBudget.toLocaleString()} limit</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-slate-100 font-semibold mb-6 text-[15px]">Spend by Category</h3>
              {totalSpentThisMonth === 0 ? (
                <div className="text-center text-white/30 text-[13px] py-10">No spend data for this month.</div>
              ) : (
                Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
                  const amount = categoryTotals[category] || 0;
                  const pct = totalSpentThisMonth > 0 ? (amount / totalSpentThisMonth) * 100 : 0;
                  if (amount === 0) return null;
                  return (
                    <div key={category} className="mb-4 last:mb-0">
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex gap-2.5 items-center text-[13px] text-white/70">
                          <span className="text-base">{config.icon}</span><span>{category}</span>
                        </div>
                        <span className="text-[13px] text-slate-200 font-bold">₹{amount.toLocaleString()}</span>
                      </div>
                      <ProgressBar value={pct} color={config.color} height={6} />
                    </div>
                  );
                })
              )}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col h-full">
              <h3 className="text-slate-100 font-semibold text-[15px] mb-4">Recent (Last 48 Hours)</h3>
              <div className="flex-1 overflow-y-auto pr-2 -mr-2" style={{ maxHeight: "300px" }}>
                {loading ? (
                  <div className="text-white/40 text-[13px] py-4 text-center">Loading transactions...</div>
                ) : recentTwoDaysExpenses.length === 0 ? (
                  <div className="text-white/30 text-[13px] py-8 text-center border border-dashed border-white/10 rounded-xl">
                    No recent expenses in the last 2 days.
                  </div>
                ) : (
                  recentTwoDaysExpenses.map((e) => {
                    const conf = CATEGORY_CONFIG[e.category] || CATEGORY_CONFIG["Miscellaneous"];
                    return (
                      <div key={e.id} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0 group">
                        <div className="flex gap-3 items-center">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm" style={{ backgroundColor: `${conf.color}20` }}>{conf.icon}</div>
                          <div>
                            <div className="text-[13px] text-slate-200 font-medium">{e.category}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-white/40">{new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                              {e.note && <><span className="text-white/20">•</span><span className="text-[11px] text-white/50 truncate max-w-[120px]">{e.note}</span></>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] font-bold text-slate-200">-₹{Number(e.amount).toLocaleString()}</span>
                          <button onClick={() => handleDelete(e.id)} className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all hover:bg-red-500/20" title="Delete">
                            <Icon d={Icons.x} size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {view === "history" && (
        <div className="flex flex-col gap-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <div className="text-white/40 text-[11px] uppercase tracking-wider font-bold mb-1">Total Spent (Filtered)</div>
              <div className="text-[28px] font-extrabold text-orange-400 font-['Sora'] leading-none">₹{historyTotalSpent.toLocaleString()}</div>
              <div className="text-[11px] text-white/30 mt-1">{filteredHistory.length} transactions found</div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-40">
                <button 
                  onFocus={() => setShowTimeDropdown(true)} 
                  onBlur={() => setTimeout(() => setShowTimeDropdown(false), 200)}
                  className="w-full bg-[#0d0d14] border border-white/10 rounded-xl px-4 py-2.5 text-left text-[12px] font-bold text-slate-200 flex justify-between items-center focus:border-indigo-500/50 outline-none"
                >
                  {TIME_FILTERS[timeFilter]}
                  <span className="text-white/40 text-[10px]">▼</span>
                </button>
                {showTimeDropdown && (
                  <div className="absolute z-20 w-full mt-1 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1">
                    {Object.entries(TIME_FILTERS).map(([key, label]) => (
                      <div key={key} onClick={() => setTimeFilter(key)} className={`px-4 py-2 text-[12px] cursor-pointer transition-colors ${timeFilter === key ? 'bg-indigo-500/20 text-indigo-300 font-bold' : 'text-slate-300 hover:bg-white/5'}`}>
                        {label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative w-full sm:w-48">
                <button 
                  onFocus={() => setShowCategoryDropdown(true)} 
                  onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                  className="w-full bg-[#0d0d14] border border-white/10 rounded-xl px-4 py-2.5 text-left text-[12px] font-bold text-slate-200 flex justify-between items-center focus:border-indigo-500/50 outline-none truncate"
                >
                  {categoryFilter}
                  <span className="text-white/40 text-[10px] ml-2">▼</span>
                </button>
                {showCategoryDropdown && (
                  <div className="absolute z-20 w-full mt-1 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 max-h-60 overflow-y-auto">
                    <div onClick={() => setCategoryFilter("All Categories")} className={`px-4 py-2 text-[12px] cursor-pointer transition-colors ${categoryFilter === "All Categories" ? 'bg-indigo-500/20 text-indigo-300 font-bold' : 'text-slate-300 hover:bg-white/5'}`}>
                      All Categories
                    </div>
                    {Object.keys(CATEGORY_CONFIG).map(cat => (
                      <div key={cat} onClick={() => setCategoryFilter(cat)} className={`px-4 py-2 text-[12px] cursor-pointer transition-colors ${categoryFilter === cat ? 'bg-indigo-500/20 text-indigo-300 font-bold' : 'text-slate-300 hover:bg-white/5'}`}>
                        {cat}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-2 min-h-[400px] flex flex-col">
            {currentHistoryItems.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-white/30 text-[13px]">No transactions match your filters.</div>
            ) : (
              <div className="flex-1">
                {currentHistoryItems.map((e) => {
                  const conf = CATEGORY_CONFIG[e.category] || CATEGORY_CONFIG["Miscellaneous"];
                  return (
                    <div key={e.id} className="flex justify-between items-center py-3.5 px-4 border-b border-white/5 last:border-0 group hover:bg-white/[0.02] rounded-xl transition-colors">
                      <div className="flex gap-4 items-center">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-sm" style={{ backgroundColor: `${conf.color}15` }}>{conf.icon}</div>
                        <div>
                          <div className="text-[14px] text-slate-200 font-bold">{e.category}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-bold text-white/30 bg-black/20 px-2 py-0.5 rounded border border-white/5">{new Date(e.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            {e.note && <span className="text-[12px] text-white/50 truncate max-w-[150px] md:max-w-[300px]">{e.note}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[15px] font-extrabold text-slate-200 tracking-tight">-₹{Number(e.amount).toLocaleString()}</span>
                        <button onClick={() => handleDelete(e.id)} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all hover:bg-red-500/20" title="Delete">
                          <Icon d={Icons.x} size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-between items-center p-4 border-t border-white/5 mt-auto">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[11px] font-bold text-slate-300 disabled:opacity-30 hover:bg-white/10 transition-colors">
                  Previous
                </button>
                <div className="text-[11px] font-bold text-white/40">Page <span className="text-white">{currentPage}</span> of {totalPages}</div>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[11px] font-bold text-slate-300 disabled:opacity-30 hover:bg-white/10 transition-colors">
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log New Expense">
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
                <button key={key} type="button" onClick={() => setNewExpense({...newExpense, category: key})} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[12px] font-medium transition-all duration-200 ${newExpense.category === key ? `bg-orange-500/20 border-orange-500/50 text-orange-400 shadow-md` : 'bg-[#0d0d14] border-white/10 text-white/40 hover:bg-white/5 hover:text-white/70'}`}>
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

      <Modal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} title="Budget Settings">
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

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-500/10 border border-green-500/30 text-green-400 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-[fadeIn_0.3s_ease-out]">
          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">✓</div>
          <span className="text-[13px] font-bold">{toast}</span>
        </div>
      )}

    </div>
  );
}