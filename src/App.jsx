import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";

// ─── Layout & UI (Loaded Instantly) ───
import DashboardLayout from "./components/layout/DashboardLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";

// ─── Auth & Public Pages (Loaded Instantly) ───
import Landing from "./pages/Landing";
import Login from "./pages/Login";
// import SignUp from "./pages/SignUp";
// import ResetPassword from "./pages/ResetPassword"; 
import Onboarding from "./pages/Onboarding"; 

// ─── App Pages (Lazy Loaded for Performance) ───
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Assignments = lazy(() => import("./pages/Assignments"));
const Attendance = lazy(() => import("./pages/Attendance"));
const Timer = lazy(() => import("./pages/Timer"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Grades = lazy(() => import("./pages/Grades"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Goals = lazy(() => import("./pages/Goals"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const AIAssistant = lazy(() => import("./pages/AIAssistant"));

// ─── Utility Components ───
const NotFound = () => (
  <div className="flex flex-col items-center justify-center h-full text-center gap-4">
    <div className="text-6xl">🤷‍♂️</div>
    <h2 className="text-slate-100 font-bold text-2xl font-['Plus_Jakarta_Sans']">404 - Page Not Found</h2>
    <p className="text-slate-400">Oops! Looks like you took a wrong turn.</p>
  </div>
);

// Wraps lazily loaded routes to provide a fallback UI
const SuspenseLayout = () => (
  <Suspense fallback={
    <div className="flex h-full items-center justify-center text-slate-400">
      Loading Page...
    </div>
  }>
    <Outlet />
  </Suspense>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ─── PUBLIC ROUTES ─── */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        {/* <Route path="/signup" element={<SignUp />} /> */}
        <Route path="/onboarding" element={<Onboarding />} />

        {/* ─── PROTECTED APP ROUTES ─── */}
        {/* Notice we removed the path here so child routes keep their exact URLs! */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route element={<SuspenseLayout />}>
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
              
              {/* Catch-all inside protected routes */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Route>

        {/* Redirect unknown routes back to home for logged-out users */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}