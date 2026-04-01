import React, { useState, useEffect, useMemo } from 'react';
import { Icon, Icons } from '../ui/Icon';

const TIME_FILTERS = {
  "1m": "Last 1 Month",
  "3m": "Last 3 Months",
  "6m": "Last 6 Months",
  "9m": "Last 9 Months",
  "1y": "Last 1 Year",
  "all": "All Time"
};

export default function ExpenseHistory({ allExpenses, handleDelete, CATEGORY_CONFIG }) {
  // ─── HISTORY STATES ───
  const [timeFilter, setTimeFilter] = useState("1m");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [searchQuery, setSearchQuery] = useState(""); // 🚀 NEW: Search State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // ─── HISTORY MATH & FILTERING ───
  const filteredHistory = useMemo(() => {
    let filtered = allExpenses;
    const now = new Date();
    const cutoff = new Date();
    
    // 1. Time Filter
    if (timeFilter !== "all") {
      const monthsToSubtract = timeFilter.endsWith('y') ? parseInt(timeFilter) * 12 : parseInt(timeFilter);
      cutoff.setMonth(now.getMonth() - monthsToSubtract);
      filtered = filtered.filter(e => new Date(e.date) >= cutoff);
    }

    // 2. Category Filter
    if (categoryFilter !== "All Categories") {
      filtered = filtered.filter(e => e.category === categoryFilter);
    }

    // 3. 🚀 NEW: Text Search Filter (Matches Note or Category)
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        (e.note && e.note.toLowerCase().includes(query)) || 
        (e.category && e.category.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [allExpenses, timeFilter, categoryFilter, searchQuery]);

  const historyTotalSpent = filteredHistory.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage) || 1;
  const currentHistoryItems = filteredHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [timeFilter, categoryFilter, searchQuery]);

  // ─── 🚀 NEW: CSV EXPORT ENGINE ───
  const handleExportCSV = () => {
    if (filteredHistory.length === 0) return alert("No data to export!");

    // 1. Create CSV Headers
    let csvContent = "Date,Category,Amount,Note\n";

    // 2. Format Data Rows
    filteredHistory.forEach(e => {
      const date = new Date(e.date).toLocaleDateString('en-US');
      const category = `"${e.category}"`; // Wrap in quotes in case of commas
      const amount = e.amount;
      const note = `"${e.note || ""}"`; 
      csvContent += `${date},${category},${amount},${note}\n`;
    });

    // 3. Trigger Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `GradPilot_Expenses_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-4 animate-[fadeIn_0.2s_ease-out]">
      {/* ─── FILTERS HEADER ─── */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5">
        
        {/* Left Stats & Export */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-8 w-full xl:w-auto justify-between">
          <div>
            <div className="text-white/40 text-[11px] uppercase tracking-wider font-bold mb-1">Total Spent (Filtered)</div>
            <div className="text-[28px] font-extrabold text-orange-400 font-['Sora'] leading-none">₹{historyTotalSpent.toLocaleString()}</div>
            <div className="text-[11px] text-white/30 mt-1">{filteredHistory.length} transactions found</div>
          </div>
          
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 text-[12px] font-bold transition-colors shrink-0"
          >
            <span>📥</span> Export CSV
          </button>
        </div>

        {/* Right Controls (Search & Dropdowns) */}
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          
          {/* 🚀 NEW: Search Bar */}
          <div className="relative w-full sm:w-48">
            <input 
              type="text" 
              placeholder="Search notes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0d0d14] border border-white/10 rounded-xl px-4 py-2.5 pl-9 text-[12px] font-bold text-slate-200 focus:border-indigo-500/50 outline-none placeholder:text-white/20 placeholder:font-normal"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-sm">🔍</span>
          </div>

          {/* Time Filter */}
          <div className="relative w-full sm:w-36">
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

          {/* Category Filter */}
          <div className="relative w-full sm:w-44">
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

      {/* ─── TRANSACTION LIST ─── */}
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

        {/* ─── PAGINATION ─── */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center p-4 border-t border-white/5 mt-auto">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[11px] font-bold text-slate-300 disabled:opacity-30 hover:bg-white/10 transition-colors">Previous</button>
            <div className="text-[11px] font-bold text-white/40">Page <span className="text-white">{currentPage}</span> of {totalPages}</div>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[11px] font-bold text-slate-300 disabled:opacity-30 hover:bg-white/10 transition-colors">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}