import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Layout & UI
import DashboardLayout from "./components/layout/DashboardLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";

// Auth Pages
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";

// App Pages
import Dashboard from "./pages/Dashboard";
import Assignments from "./pages/Assignments";
import Attendance from "./pages/Attendance";
import Timer from "./pages/Timer";
import Expenses from "./pages/Expenses";
import Grades from "./pages/Grades";
import Analytics from "./pages/Analytics";
import Goals from "./pages/Goals";
import AIAssistant from "./pages/AIAssistant";

const ComingSoon = () => (
  <div className="flex flex-col items-center justify-center h-full text-center gap-4">
    <div className="text-6xl">🚀</div>
    <h2 className="text-slate-100 font-bold text-2xl font-['Plus_Jakarta_Sans']">Coming Soon</h2>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected Routes (Requires Login) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            
            {/* THE CRITICAL FIX: Changed "tasks" to "assignments" to match the sidebar! */}
            <Route path="assignments" element={<Assignments />} />
            
            <Route path="attendance" element={<Attendance />} />
            <Route path="timer" element={<Timer />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="grades" element={<Grades />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="goals" element={<Goals />} />
            <Route path="ai" element={<AIAssistant />} />
            <Route path="*" element={<ComingSoon />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}