import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Layout & UI
import DashboardLayout from "./components/layout/DashboardLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";

// Auth & Public Pages
import Landing from "./pages/Landing";
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
import Leaderboard from "./pages/Leaderboard"; 
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
        {/* ─── PUBLIC ROUTES ─── */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* ─── PROTECTED APP ROUTES ─── */}
        <Route element={<ProtectedRoute />}>
          {/* Notice we removed the path here so child routes keep their exact URLs! */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/timer" element={<Timer />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/grades" element={<Grades />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/ai" element={<AIAssistant />} />
          </Route>
        </Route>

        {/* Redirect unknown routes back to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}