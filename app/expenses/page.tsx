"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, Edit2, Save, Wallet, Receipt, CreditCard, TrendingDown, AlertTriangle, Info, Sparkles, Check, PieChart as PieChartIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ToastContext";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

// 1. ADDED NEW CATEGORIES
type Category = "Food" | "Transport" | "Academic" | "Entertainment" | "Health" | "Shopping" | "Bills" | "Other";

type Expense = {
  id: number;
  title: string;
  amount: number;
  category: Category;
  date: string;
};

// 2. UPDATED COLORS FOR NEW CATEGORIES
const CATEGORY_COLORS: Record<Category, string> = {
  Food: "#3b82f6",         // Blue
  Transport: "#8b5cf6",    // Purple
  Academic: "#10b981",     // Emerald
  Entertainment: "#f59e0b",// Amber
  Health: "#ec4899",       // Pink
  Shopping: "#06b6d4",     // Cyan
  Bills: "#ef4444",        // Red
  Other: "#71717a",        // Zinc
};

export default function ExpenseTracker() {
  const { addToast } = useToast();

  // STATE: Budget & Rollover
  const [baseBudget, setBaseBudget] = useState<number>(10000); // Changed to typical Rupee amount
  const [rollover, setRollover] = useState<number>(0); // For next month's savings
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(baseBudget.toString());

  const totalBudget = baseBudget + rollover;

  const [expenses, setExpenses] = useState<Expense[]>([
    { id: 1, title: "Textbooks", amount: 1500, category: "Academic", date: new Date().toISOString().split('T')[0] },
    { id: 2, title: "Movie Ticket", amount: 1200, category: "Entertainment", date: new Date().toISOString().split('T')[0] },
    { id: 3, title: "Pharmacy", amount: 450, category: "Health", date: new Date().toISOString().split('T')[0] },
  ]);

  const [newTitle, setNewTitle] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("Food");
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  // --- MATH & CALCULATIONS ---
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remainingBudget = totalBudget - totalSpent;
  const percentageSpent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  
  // 3. SMART METRICS
  const isOverBudget = remainingBudget < 0;
  const isNearLimit = percentageSpent >= 80 && percentageSpent < 100;
  const currentDay = new Date().getDate();
  const dailyAverage = totalSpent / currentDay;

  // Pie Chart Data & Highest Category Check
  const chartData = useMemo(() => {
    const grouped: Partial<Record<Category, number>> = {};
    expenses.forEach(exp => { grouped[exp.category] = (grouped[exp.category] || 0) + exp.amount; });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  // Find if any category is > 40% of total spending
  const highestCategory = chartData.length > 0 ? chartData.sort((a, b) => b.value - a.value)[0] : null;
  const isCategoryWarning = highestCategory && totalSpent > 0 && (highestCategory.value / totalSpent) * 100 > 40;

  // Formatter for Indian Rupees (₹)
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const saveBudget = () => {
    const val = parseFloat(budgetInput);
    if (isNaN(val) || val <= 0) { addToast("Please enter a valid budget amount.", "error"); return; }
    setBaseBudget(val);
    setIsEditingBudget(false);
    addToast("Monthly budget updated!", "success");
  };

  const addExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAmount || isNaN(parseFloat(newAmount))) { addToast("Please enter a valid title and amount.", "error"); return; }
    
    const expenseVal = parseFloat(newAmount);
    if (!isOverBudget && (totalSpent + expenseVal) > totalBudget) {
      addToast("Warning: This purchase puts you over budget!", "error");
    }

    const newExpense: Expense = { id: Date.now(), title: newTitle, amount: expenseVal, category: newCategory, date: newDate };
    setExpenses([newExpense, ...expenses]);
    setNewTitle(""); setNewAmount("");
    addToast("Expense logged successfully.", "success");
  };

  const deleteExpense = (id: number) => {
    setExpenses(expenses.filter(exp => exp.id !== id));
    addToast("Expense removed.", "info");
  };

  // 4. RESET MONTH / ROLLOVER FUNCTION (Mocks what our database will do later)
  const closeMonth = () => {
    if (remainingBudget > 0) {
      setRollover(remainingBudget);
      addToast(`₹${remainingBudget} rolled over to next month's savings!`, "success");
    } else {
      setRollover(0);
      addToast("New month started. Clean slate!", "info");
    }
    setExpenses([]); // Clear current expenses
  };

  return (
    <main className="max-w-6xl mx-auto pb-24 md:pb-12">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Expenses</h1>
          <p className="text-zinc-400">Track spending, build savings, and get smart insights.</p>
        </div>
        <button onClick={closeMonth} className="bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <Sparkles size={16} className="text-amber-400"/> End Month & Rollover
        </button>
      </header>

      {/* NEW: SMART INSIGHTS DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Daily Average Alert */}
        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3">
          <Info size={20} className="text-blue-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-blue-400 font-semibold text-sm">Daily Average</h4>
            <p className="text-zinc-300 text-xs mt-1">You are spending {formatINR(dailyAverage)}/day on average this month.</p>
          </div>
        </div>

        {/* 80% Budget Warning */}
        {isNearLimit ? (
          <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-start gap-3 animate-pulse">
            <AlertTriangle size={20} className="text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-yellow-500 font-semibold text-sm">Approaching Limit</h4>
              <p className="text-zinc-300 text-xs mt-1">You’ve used {Math.round(percentageSpent)}% of your budget. Slow down!</p>
            </div>
          </div>
        ) : isOverBudget ? (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle size={20} className="text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-rose-500 font-semibold text-sm">Budget Exceeded</h4>
              <p className="text-zinc-300 text-xs mt-1">You are {formatINR(Math.abs(remainingBudget))} over your limit!</p>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-3">
             <Check size={20} className="text-emerald-500 shrink-0 mt-0.5" />
             <div>
               <h4 className="text-emerald-500 font-semibold text-sm">Budget Healthy</h4>
               <p className="text-zinc-300 text-xs mt-1">You have {Math.round(100 - percentageSpent)}% of your budget left.</p>
             </div>
          </div>
        )}

        {/* Smart Category Warning */}
        {isCategoryWarning ? (
           <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl flex items-start gap-3">
             <TrendingDown size={20} className="text-purple-400 shrink-0 mt-0.5" />
             <div>
               <h4 className="text-purple-400 font-semibold text-sm">Spending Spike</h4>
               <p className="text-zinc-300 text-xs mt-1"><strong>{highestCategory?.name}</strong> spending is unusually high this month.</p>
             </div>
           </div>
        ) : (
           <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-start gap-3">
             <TrendingDown size={20} className="text-zinc-500 shrink-0 mt-0.5" />
             <div>
               <h4 className="text-zinc-400 font-semibold text-sm">Category Spending</h4>
               <p className="text-zinc-500 text-xs mt-1">Spending is evenly distributed across categories.</p>
             </div>
           </div>
        )}
      </div>

      {/* TOP ROW: STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-zinc-400 font-medium">Monthly Target</h3>
            <div className="text-blue-500 bg-blue-500/10 p-2 rounded-lg"><Wallet size={20} /></div>
          </div>
          {isEditingBudget ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl text-zinc-500">₹</span>
              <input type="number" value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)} autoFocus className="bg-zinc-950 border border-zinc-700 text-white text-2xl font-bold w-full rounded px-2 py-1 outline-none" />
              <button onClick={saveBudget} className="text-emerald-500 p-2 hover:bg-emerald-500/10 rounded-lg transition-colors"><Save size={20} /></button>
            </div>
          ) : (
            <div>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-white">{formatINR(totalBudget)}</p>
                <button onClick={() => setIsEditingBudget(true)} className="text-zinc-500 hover:text-blue-400 mb-1"><Edit2 size={16} /></button>
              </div>
              {rollover > 0 && <p className="text-xs text-emerald-400 mt-1">Includes {formatINR(rollover)} savings from last month</p>}
            </div>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-zinc-400 font-medium">Total Spent</h3>
            <div className="text-rose-500 bg-rose-500/10 p-2 rounded-lg"><TrendingDown size={20} /></div>
          </div>
          <p className="text-3xl font-bold text-white">{formatINR(totalSpent)}</p>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-4">
            <div className={`h-1.5 rounded-full ${isOverBudget ? 'bg-rose-500' : isNearLimit ? 'bg-yellow-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(percentageSpent, 100)}%` }}></div>
          </div>
        </div>

        <div className={`border p-6 rounded-2xl flex flex-col justify-between transition-colors ${isOverBudget ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-medium ${isOverBudget ? 'text-rose-400' : 'text-emerald-400'}`}>Remaining Balance</h3>
            <div className={`${isOverBudget ? 'text-rose-500 bg-rose-500/20' : 'text-emerald-500 bg-emerald-500/20'} p-2 rounded-lg`}>
              <span className="font-bold text-xl leading-none">₹</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className={`text-3xl font-bold ${isOverBudget ? 'text-rose-500' : 'text-emerald-500'}`}>{formatINR(Math.abs(remainingBudget))}</p>
            {isOverBudget && <span className="text-xs font-bold uppercase tracking-wider bg-rose-500 text-white px-2 py-0.5 rounded">Over</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <form onSubmit={addExpense} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
              <Receipt size={18} className="text-zinc-400"/> Log New Expense
            </h2>
            <div className="flex flex-col md:flex-row gap-3">
              <input type="text" placeholder="What did you buy?" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="flex-[2] bg-zinc-950 border border-zinc-800 text-white p-3 rounded-xl focus:outline-none focus:border-blue-500" />
              <div className="relative flex-1">
                <span className="absolute left-4 top-3.5 text-zinc-500 font-medium">₹</span>
                <input type="number" placeholder="0" step="1" min="0" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 text-white py-3 pl-8 pr-4 rounded-xl focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as Category)} className="flex-[2] bg-zinc-950 border border-zinc-800 text-white p-3 rounded-xl focus:outline-none focus:border-blue-500 appearance-none">
                {Object.keys(CATEGORY_COLORS).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} style={{ colorScheme: "dark" }} className="flex-[2] bg-zinc-950 border border-zinc-800 text-zinc-400 p-3 rounded-xl focus:outline-none focus:border-blue-500 focus:text-white" />
              <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"><Plus size={18} /> Add</button>
            </div>
          </form>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2"><CreditCard size={18} className="text-zinc-400"/> Recent Transactions</h2>
            </div>
            <div className="p-2 flex flex-col gap-1 max-h-[400px] overflow-y-auto">
              <AnimatePresence>
                {expenses.length === 0 ? ( <p className="text-zinc-500 text-center py-8">No expenses logged yet.</p> ) : (
                  expenses.map((expense) => (
                    <motion.div layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} key={expense.id} className="flex items-center justify-between p-4 hover:bg-zinc-800/50 rounded-xl transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${CATEGORY_COLORS[expense.category]}15`, color: CATEGORY_COLORS[expense.category] }}>
                          <Wallet size={18} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{expense.title}</p>
                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <span>{expense.category}</span><span>•</span><span>{new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-white font-semibold">-{formatINR(expense.amount)}</p>
                        <button onClick={() => deleteExpense(expense.id)} className="text-zinc-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"><Trash2 size={16} /></button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 h-fit flex flex-col">
          <h2 className="text-lg font-semibold text-white mb-6">Spending Breakdown</h2>
          {expenses.length > 0 ? (
            <>
              <div className="h-[250px] w-full mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as Category]} />)}
                    </Pie>
                    <Tooltip 
                        formatter={(value: any) => formatINR(Number(value))} 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }} 
                        itemStyle={{ color: '#fff' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-3">
                {chartData.sort((a,b) => b.value - a.value).map(item => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[item.name as Category] }}></div>
                      <span className="text-zinc-400">{item.name}</span>
                    </div>
                    <span className="text-white font-medium">{formatINR(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
             <div className="flex flex-col items-center justify-center text-zinc-500 py-12 gap-4"><PieChartIcon size={48} className="opacity-20" /><p>Add expenses to see breakdown</p></div>
          )}
        </div>
      </div>
    </main>
  );
}
