import { Home, Calendar, CheckSquare, Wallet } from "lucide-react";
import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 text-zinc-300 hidden md:flex flex-col h-screen fixed">
      {/* App Logo/Title */}
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Grad<span className="text-blue-500">Pilot</span>
        </h2>
      </div>

      {/* Navigation Links */}
      <nav className="flex-col flex gap-2 px-4 mt-4">
        {/* We use Next.js <Link> instead of HTML <a> tags for faster routing */}
        <Link href="/" className="flex items-center gap-3 hover:bg-zinc-800 hover:text-white p-3 rounded-lg transition-colors">
          <Home size={20} /> Dashboard
        </Link>
        <Link href="/attendance" className="flex items-center gap-3 hover:bg-zinc-800 hover:text-white p-3 rounded-lg transition-colors">
          <Calendar size={20} /> Attendance
        </Link>
        <Link href="/assignments" className="flex items-center gap-3 hover:bg-zinc-800 hover:text-white p-3 rounded-lg transition-colors">
          <CheckSquare size={20} /> Assignments
        </Link>
        <Link href="/expenses" className="flex items-center gap-3 hover:bg-zinc-800 hover:text-white p-3 rounded-lg transition-colors">
          <Wallet size={20} /> Expenses
        </Link>
      </nav>
    </aside>
  );
}