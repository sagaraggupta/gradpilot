import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// ─── 1. THE DONUT PIE CHART (Categories) ───
export function CategoryPieChart({ categoryTotals, CATEGORY_CONFIG }) {
  const data = useMemo(() => {
    return Object.entries(categoryTotals)
      .filter(([_, amount]) => amount > 0)
      .map(([name, amount]) => ({
        name,
        value: amount,
        color: CATEGORY_CONFIG[name]?.color || '#8884d8',
        icon: CATEGORY_CONFIG[name]?.icon || '💰'
      })).sort((a, b) => b.value - a.value);
  }, [categoryTotals, CATEGORY_CONFIG]);

  if (data.length === 0) return <div className="text-white/30 text-[13px] text-center py-10">No spend data for this month.</div>;

  return (
    <div className="flex flex-col items-center">
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} innerRadius={65} outerRadius={85} paddingAngle={6} dataKey="value" stroke="none">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => `₹${value.toLocaleString()}`}
              contentStyle={{ backgroundColor: '#1a1a24', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
              itemStyle={{ fontWeight: 'bold', color: '#fff' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Sleek Custom Legend */}
      <div className="w-full flex flex-wrap justify-center gap-2 mt-2">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 bg-white/5 px-2.5 py-1 rounded-full border border-white/5 hover:bg-white/10 transition-colors">
            <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: d.color }}></div>
            <span>{d.icon} {d.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 2. THE GRADIENT AREA CHART (Spending Trends) ───
export function SpendingTrendChart({ monthlyExpenses }) {
  const data = useMemo(() => {
    if (!monthlyExpenses || monthlyExpenses.length === 0) return [];
    
    // Group all expenses by their exact date
    const grouped = monthlyExpenses.reduce((acc, curr) => {
      const d = new Date(curr.date);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      acc[dateStr] = (acc[dateStr] || 0) + Number(curr.amount);
      return acc;
    }, {});

    // Sort chronologically so the line graph flows left to right
    return Object.entries(grouped)
      .map(([date, amount]) => ({ date, amount, rawDate: new Date(date + ` ${new Date().getFullYear()}`) }))
      .sort((a, b) => a.rawDate - b.rawDate);
  }, [monthlyExpenses]);

  if (data.length === 0) return null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-5 shadow-lg">
      <h3 className="text-slate-100 font-semibold mb-6 text-[15px] flex items-center gap-2">
        📈 Daily Spending Trend
      </h3>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.5}/>
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
            <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
            <Tooltip 
              formatter={(value) => [`₹${value.toLocaleString()}`, 'Spent']}
              contentStyle={{ backgroundColor: '#1a1a24', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
            />
            <Area type="monotone" dataKey="amount" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" activeDot={{ r: 6, fill: '#818cf8', stroke: '#0d0d14', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}