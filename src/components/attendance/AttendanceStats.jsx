import React from 'react';
import StatCard from '../ui/StatCard';

export default function AttendanceStats({ stats }) {
  if (!stats) return null;
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
      <StatCard label="Overall Attendance" value={`${stats.overallPct}%`} sub="Across all subjects" icon="attendance" color={stats.overallPct >= 75 ? "#4ade80" : "#fbbf24"} />
      <StatCard label="Classes Attended" value={stats.totalPresent} sub={`out of ${stats.totalClasses} total`} icon="book" color="#818cf8" />
      <StatCard label="Subjects at Risk" value={stats.subjectsAtRisk} sub="Below target %" icon="bell" color={stats.subjectsAtRisk > 0 ? "#f87171" : "#4ade80"} />
      <StatCard label="Status" value={stats.statusState} sub={stats.statusSub} icon="zap" color={stats.statusColor} />
    </div>
  );
}