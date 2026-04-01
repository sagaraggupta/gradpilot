import React from 'react';
import StatCard from '../ui/StatCard';
import ProgressBar from '../ui/ProgressBar';
import { Icon, Icons } from '../ui/Icon';
import { CategoryPieChart, SpendingTrendChart } from "./ExpenseCharts";
import ExpenseAlerts from "./ExpenseAlerts";
import AIFinancialCoach from "./AIFinancialCoach";

export default function ExpenseOverview({
  totalSpentThisMonth,
  monthlyBudget,
  spentToday,
  dailyBudget,
  isOverBudget,
  monthName,
  budgetUsedPct,
  categoryTotals,
  recentTwoDaysExpenses,
  monthlyExpensesCount,
  monthlyExpenses,
  loading,
  handleDelete,
  CATEGORY_CONFIG,
  setIsSettingsModalOpen
}) {
  return (
    <>

      {/* 🚀 THE SMART ALERTS ENGINE */}
      <ExpenseAlerts 
        totalSpent={totalSpentThisMonth} 
        monthlyBudget={monthlyBudget} 
        spentToday={spentToday} 
        dailyBudget={dailyBudget} 
      />

      {/* ─── STAT CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Spent This Month" value={`₹${totalSpentThisMonth.toLocaleString()}`} sub="In selected month" icon="expenses" color={isOverBudget ? "#f87171" : "#fb923c"} />
        <StatCard label="Monthly Budget" value={`₹${monthlyBudget.toLocaleString()}`} sub="Target limit" icon="check" color="#4ade80" />
        <StatCard label={isOverBudget ? "Overspent By" : "Remaining"} value={`₹${Math.abs(monthlyBudget - totalSpentThisMonth).toLocaleString()}`} sub={isOverBudget ? "Danger zone!" : "Available to spend"} icon="coins" color={isOverBudget ? "#f87171" : "#818cf8"} />
        <StatCard label="Transactions" value={monthlyExpensesCount} sub="Logged this month" icon="chart" color="#f472b6" />
      </div>

      {/* ─── BUDGET UTILIZATION BAR ─── */}
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
          <ProgressBar value={budgetUsedPct} color={budgetUsedPct > 100 ? "#f87171" : (budgetUsedPct >= 80 ? "#fbbf24" : "#4ade80")} height={12} />
          <div className="absolute top-[-2px] bottom-[-2px] w-[2px] bg-amber-400 rounded-sm z-10 opacity-70" style={{ left: '80%' }} title="80% Warning Limit" />
        </div>
        <div className="flex justify-between mt-2 text-[11px] font-medium text-white/40">
          <span>₹{totalSpentThisMonth.toLocaleString()} spent</span>
          <span>80% Warning</span>
          <span>₹{monthlyBudget.toLocaleString()} limit</span>
        </div>
      </div>

      {/* ─── CATEGORIES & RECENT SPLIT ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* PIE CHART WRAPPER */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center">
          <h3 className="text-slate-100 font-semibold mb-2 text-[15px] w-full">Spend by Category</h3>
          
          {/* 🚀 THE NEW PREMIUM PIE CHART */}
          <CategoryPieChart 
            categoryTotals={categoryTotals} 
            CATEGORY_CONFIG={CATEGORY_CONFIG} 
          />
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
      {/* 🚀 THE NEW PREMIUM SPENDING TREND GRAPH */}
      <SpendingTrendChart monthlyExpenses={monthlyExpenses} />
      
      {/* 🚀 THE AI FINANCIAL COACH */}
      <AIFinancialCoach 
        categoryTotals={categoryTotals} 
        monthlyBudget={monthlyBudget} 
        totalSpent={totalSpentThisMonth} 
      />
    </>
  );
}