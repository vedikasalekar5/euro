import React from 'react';
import { PerformanceOverviewSection } from './PerformanceOverviewSection';

export const TeacherDashboard: React.FC = () => {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-150" id="teacher-dashboard-view">
      <PerformanceOverviewSection />
    </div>
  );
};


