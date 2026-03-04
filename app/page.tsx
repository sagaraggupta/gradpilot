"use client";

import StatCard from "@/components/StatCard";
import { CalendarCheck, BookOpen, Wallet, Target } from "lucide-react";

export default function Home() {
  const currentDayIndex = new Date().getDay(); 
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = daysOfWeek[currentDayIndex];

  // REMOVED time and room. ADDED 6 (Saturday) to Computer Networks!
  const allScheduledClasses = [
    { id: 1, name: "Operating Systems", days: [1, 3, 5] }, 
    { id: 2, name: "Computer Networks", days: [2, 4, 6] }, 
    { id: 3, name: "Database Systems", days: [1, 3] }, 
    { id: 4, name: "UI/UX Design", days: [4, 5] }, 
  ];

  const todaysClasses = allScheduledClasses.filter(c => c.days.includes(currentDayIndex));

  return (
    <main className="max-w-6xl mx-auto pb-24 md:pb-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-zinc-400">Happy {todayName}! Here is your academic overview.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Attendance" value="88%" trend="Safe zone" icon={<CalendarCheck size={20} />} index={0} />
        <StatCard title="Assignments Due" value="3" trend="Next: Math Intro" icon={<BookOpen size={20} />} index={1} />
        <StatCard title="Monthly Budget" value="$120 left" icon={<Wallet size={20} />} index={2} />
        <StatCard title="Study Streak" value="4 Days" trend="Keep it up!" icon={<Target size={20} />} index={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Today's Schedule</h2>
            <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
              {todaysClasses.length} Classes
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {todaysClasses.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 bg-zinc-950/50 rounded-xl border border-dashed border-zinc-800">
                <p>No classes scheduled for today. Enjoy your day off!</p>
              </div>
            ) : (
              todaysClasses.map((cls) => (
                <div key={cls.id} className="flex gap-4 items-center group">
                  <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                  
                  {/* CLEANED UP CLASS CARD: Just the title! */}
                  <div className="flex-1 bg-zinc-950 border border-zinc-800 p-4 rounded-xl hover:border-zinc-700 transition-colors">
                    <h3 className="text-lg font-semibold text-white">{cls.name}</h3>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 h-fit">
          <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="flex flex-col gap-3">
            <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-xl transition-colors text-left flex items-center gap-3">
              <span className="bg-emerald-500/20 text-emerald-500 p-2 rounded-lg"><CalendarCheck size={18} /></span>
              Log Attendance
            </button>
            <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-xl transition-colors text-left flex items-center gap-3">
              <span className="bg-blue-500/20 text-blue-500 p-2 rounded-lg"><BookOpen size={18} /></span>
              Add Assignment
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}