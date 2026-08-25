import React from 'react';
import { useAcademic } from '../../context/AcademicContext';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Building2,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  ArrowRight,
  GraduationCap,
  Sparkles,
  ChevronRight,
  PlusCircle,
  FileSpreadsheet,
  Trophy,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { getPerformanceBadgeClasses } from '../../utils/calculations';
import { Department, AcademicYear, PerformanceRating } from '../../types';

export const AdminDashboard: React.FC = () => {
  const {
    students,
    subjects,
    allSummaries,
    setActiveTab,
    setSelectedStudentProfile,
    setStudentFormModal,
  } = useAcademic();

  const { isAdmin } = useAuth();

  // Metrics computation
  const totalStudents = students.length;
  const totalSubjects = subjects.length;
  const departmentsList: Department[] = [
    'Computer Engineering',
    'Civil Engineering',
    'Mechanical Engineering',
    'Electrical Engineering',
  ];
  const yearsList: AcademicYear[] = ['1st Year', '2nd Year', '3rd Year', '2nd Year DSY'];

  let totalOverallPercentage = 0;
  let improvedStudentsCount = 0;
  let declinedStudentsCount = 0;
  let consistentStudentsCount = 0;
  let totalUnit1Percentage = 0;
  let totalUnit2Percentage = 0;

  const ratingCounts: Record<PerformanceRating, number> = {
    Excellent: 0,
    'Very Good': 0,
    Good: 0,
    Average: 0,
    'Below Average': 0,
    Poor: 0,
  };

  allSummaries.forEach((s) => {
    totalOverallPercentage += s.overallAveragePercentage;
    totalUnit1Percentage += s.overallUnit1Percentage;
    totalUnit2Percentage += s.overallUnit2Percentage;

    if (s.overallTrend === 'Improved') improvedStudentsCount++;
    else if (s.overallTrend === 'Declined') declinedStudentsCount++;
    else consistentStudentsCount++;

    ratingCounts[s.overallRating] = (ratingCounts[s.overallRating] || 0) + 1;
  });

  const collegeAvgPercentage =
    totalStudents > 0 ? Math.round((totalOverallPercentage / totalStudents) * 10) / 10 : 0;
  const collegeUnit1Avg =
    totalStudents > 0 ? Math.round((totalUnit1Percentage / totalStudents) * 10) / 10 : 0;
  const collegeUnit2Avg =
    totalStudents > 0 ? Math.round((totalUnit2Percentage / totalStudents) * 10) / 10 : 0;
  const improvementRate =
    totalStudents > 0 ? Math.round((improvedStudentsCount / totalStudents) * 100) : 0;

  const atRiskStudents = allSummaries.filter(
    (s) => s.overallRating === 'Below Average' || s.overallRating === 'Poor'
  );

  // Top performers
  const topPerformers = [...allSummaries]
    .sort((a, b) => b.overallAveragePercentage - a.overallAveragePercentage)
    .slice(0, 5);

  // Department-wise chart data
  const departmentChartData = departmentsList.map((dept) => {
    const deptSummaries = allSummaries.filter((s) => s.student.department === dept);
    const count = deptSummaries.length;
    let u1Sum = 0;
    let u2Sum = 0;
    let avgSum = 0;

    deptSummaries.forEach((s) => {
      u1Sum += s.overallUnit1Percentage;
      u2Sum += s.overallUnit2Percentage;
      avgSum += s.overallAveragePercentage;
    });

    return {
      name: dept.replace(' Engineering', ''),
      fullName: dept,
      unit1: count > 0 ? Math.round((u1Sum / count) * 10) / 10 : 0,
      unit2: count > 0 ? Math.round((u2Sum / count) * 10) / 10 : 0,
      average: count > 0 ? Math.round((avgSum / count) * 10) / 10 : 0,
      students: count,
    };
  });

  // Year-wise chart data
  const yearChartData = yearsList.map((yr) => {
    const yrSummaries = allSummaries.filter((s) => s.student.year === yr);
    const count = yrSummaries.length;
    let avgSum = 0;
    yrSummaries.forEach((s) => (avgSum += s.overallAveragePercentage));
    return {
      year: yr,
      average: count > 0 ? Math.round((avgSum / count) * 10) / 10 : 0,
      students: count,
    };
  });

  // Grade Distribution Pie Data
  const pieData = [
    { name: 'Excellent (90-100%)', value: ratingCounts['Excellent'], color: '#10b981' },
    { name: 'Very Good (80-89%)', value: ratingCounts['Very Good'], color: '#3b82f6' },
    { name: 'Good (70-79%)', value: ratingCounts['Good'], color: '#6366f1' },
    { name: 'Average (60-69%)', value: ratingCounts['Average'], color: '#f59e0b' },
    { name: 'Below Average (40-59%)', value: ratingCounts['Below Average'], color: '#f97316' },
    { name: 'Poor (<40%)', value: ratingCounts['Poor'], color: '#ef4444' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="admin-dashboard-view">
      
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-md">
              Academic Term 2025–2026
            </span>
            <span className="text-xs text-slate-400">Unit Test Evaluation Center</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Academic Performance Executive Overview
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Comprehensive assessment of Unit 1 and Unit 2 exams across all 4 engineering departments.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {isAdmin && (
            <button
              onClick={() => setStudentFormModal({ isOpen: true, studentToEdit: null })}
              className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"
              id="dashboard-enrol-student-btn"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Enrol Student</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('batch-marks')}
            className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all flex items-center gap-1.5"
            id="dashboard-batch-marks-btn"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-400" />
            <span>Batch Marks Grid</span>
          </button>
        </div>
      </div>

      {/* 6 Primary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Total Students */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Total Enrolled</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalStudents}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Across 4 branches</span>
            <span className="font-semibold text-blue-600 cursor-pointer" onClick={() => setActiveTab('students')}>
              View all →
            </span>
          </div>
        </div>

        {/* College Average */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Overall College Avg</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{collegeAvgPercentage}%</div>
          <div className="text-[11px] text-slate-500 mt-1">
            U1: <span className="font-medium text-slate-700">{collegeUnit1Avg}%</span> → U2: <span className="font-medium text-emerald-600">{collegeUnit2Avg}%</span>
          </div>
        </div>

        {/* Improved Students */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Progressed (U2 &gt; U1)</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{improvedStudentsCount}</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            📈 {improvementRate}% of all students
          </div>
        </div>

        {/* Declined */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Declined (U2 &lt; U1)</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600">{declinedStudentsCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Need revision mentoring
          </div>
        </div>

        {/* Students Needing Attention */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">At-Risk (&lt;60%)</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600">{atRiskStudents.length}</div>
          <div className="text-[11px] text-rose-700 font-medium mt-1">
            Action items flagged
          </div>
        </div>

        {/* Total Active Subjects */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Active Subjects</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalSubjects}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Syllabus mapped</span>
            <span className="font-semibold text-purple-600 cursor-pointer" onClick={() => setActiveTab('subjects')}>
              Manage →
            </span>
          </div>
        </div>

      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Department-wise Performance Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Department Performance (Unit 1 vs Unit 2 vs Average)
              </h3>
              <p className="text-xs text-slate-500">
                Comparative examination percentage across Engineering Departments
              </p>
            </div>
            <button
              onClick={() => setActiveTab('departments')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Details <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-800">
                          <div className="font-bold text-sm mb-1">{label} Engineering</div>
                          <div className="text-blue-300">Unit 1 Avg: {payload[0]?.value}%</div>
                          <div className="text-emerald-300">Unit 2 Avg: {payload[1]?.value}%</div>
                          <div className="text-indigo-300 font-semibold border-t border-slate-700 mt-1 pt-1">
                            Overall Avg: {payload[2]?.value}%
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  iconType="circle"
                />
                <Bar dataKey="unit1" name="Unit 1 Avg (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="unit2" name="Unit 2 Avg (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="average" name="Overall Avg (%)" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grade / Performance Distribution Pie Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900">Performance Classification</h3>
              <span className="text-xs font-semibold text-slate-400">Total {totalStudents}</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">Student percentage grading breakdown</p>

            <div className="h-56 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg shadow-lg text-xs">
                            <span className="font-semibold">{data.name}:</span> {data.value} students
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate">{item.name.split(' ')[0]}:</span>
                <span className="font-semibold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 2 Bottom Split Panels: Top Performers & Students Needing Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top 5 College Toppers Showcase */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">College Academic Toppers</h3>
                <p className="text-xs text-slate-500">Highest overall Unit 1 & 2 percentage</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('rankings')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View Leaderboard <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {topPerformers.map((summary, idx) => {
              const badge = getPerformanceBadgeClasses(summary.overallRating);
              const rankColor =
                idx === 0
                  ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-200'
                  : idx === 1
                  ? 'bg-slate-300 text-slate-800'
                  : idx === 2
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-600';

              return (
                <div
                  key={summary.student.id}
                  onClick={() => setSelectedStudentProfile(summary.student)}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group"
                  id={`topper-card-${summary.student.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 shadow-xs ${rankColor}`}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                        <span className="truncate">{summary.student.name}</span>
                        <span className="text-[10px] font-mono font-normal text-slate-500 px-1.5 py-0.2 bg-slate-100 rounded">
                          {summary.student.rollNumber}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {summary.student.department} • {summary.student.year}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-slate-900">
                      {summary.overallAveragePercentage}%
                    </div>
                    <span className="text-[10px] text-emerald-600 font-medium flex items-center justify-end gap-0.5">
                      📈 +{summary.overallImprovementDelta}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Academic Intervention / At-Risk Student Alert */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Academic Mentoring Required</h3>
                <p className="text-xs text-slate-500">Students scoring below 60% in unit tests</p>
              </div>
            </div>
            <span className="px-2 py-0.5 text-xs font-semibold bg-rose-100 text-rose-700 rounded-full">
              {atRiskStudents.length} Students Flagged
            </span>
          </div>

          {atRiskStudents.length > 0 ? (
            <div className="space-y-2.5">
              {atRiskStudents.slice(0, 5).map((summary) => (
                <div
                  key={summary.student.id}
                  onClick={() => setSelectedStudentProfile(summary.student)}
                  className="flex items-center justify-between p-3 rounded-xl border border-rose-100 bg-rose-50/20 hover:bg-rose-50/50 transition-all cursor-pointer group"
                  id={`at-risk-card-${summary.student.id}`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 group-hover:text-rose-600 transition-colors flex items-center gap-1.5">
                      <span className="truncate">{summary.student.name}</span>
                      <span className="text-[10px] font-mono text-slate-500">({summary.student.rollNumber})</span>
                    </div>
                    <div className="text-[11px] text-rose-700 font-medium truncate mt-0.5">
                      {summary.lowestSubject ? `Weak in: ${summary.lowestSubject.subject.subjectName} (${summary.lowestSubject.averagePercentage}%)` : 'Attention needed'}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 rounded-md">
                      {summary.overallAveragePercentage}%
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {summary.overallRating}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              All students have currently passed minimum benchmark standards! 🎉
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
