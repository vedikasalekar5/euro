import React, { useState } from 'react';
import { useAcademic } from '../../context/AcademicContext';
import { useAuth } from '../../context/AuthContext';
import {
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Filter,
  BarChart3,
  Sparkles,
  ArrowRight,
  BookOpen,
  Users,
} from 'lucide-react';
import { AcademicYear, Division, PerformanceRating } from '../../types';
import { getPerformanceBadgeClasses } from '../../utils/calculations';

export const TeacherPerformanceView: React.FC = () => {
  const {
    subjects,
    teachers,
    getTeacherSubjectStats,
    setActiveTab,
    setSelectedStudentProfile,
  } = useAcademic();
  const { currentUser, isTeacher } = useAuth();

  // Determine active teacher
  const currentTeacher = isTeacher && currentUser?.teacherId
    ? teachers.find((t) => t.teacherId === currentUser.teacherId || t.id === currentUser.id)
    : teachers[0];

  const assignedSubjectIds = currentTeacher?.assignedSubjects || [];
  const assignedSubjects = subjects.filter((s) => assignedSubjectIds.includes(s.id));

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    assignedSubjects.length > 0 ? assignedSubjects[0].id : (subjects[0]?.id || '')
  );

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId);

  const [selectedYear, setSelectedYear] = useState<AcademicYear>(
    activeSubject?.year || '2nd Year'
  );
  const [selectedDivision, setSelectedDivision] = useState<Division | 'All'>('All');

  const stats = selectedSubjectId
    ? getTeacherSubjectStats(selectedSubjectId, selectedYear, selectedDivision)
    : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="teacher-performance-view">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-[#D7E3EA] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-bold bg-[#F5F9FC] text-[#0094B3] border border-[#D7E3EA] rounded-md">
              Subject Academic Analytics
            </span>
            <span className="text-xs text-[#64748B]">
              Faculty: <strong className="text-[#172B4D]">{currentTeacher?.name || currentUser?.name}</strong>
            </span>
          </div>
          <h2 className="text-xl font-black text-[#172B4D] tracking-tight">
            Subject-Wise Performance &amp; Trends
          </h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            Deep examination analytics, unit-to-unit progression, and score distribution graphs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('batch-marks')}
            className="px-4 py-2 text-xs font-bold bg-[#0B1F3A] hover:bg-[#102A43] text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 border border-[#00D9FF]/30 cursor-pointer"
            id="jump-to-marks-entry-btn"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#00D9FF]" />
            <span>Open Marks Entry</span>
          </button>
        </div>
      </div>

      {/* Subject & Class Selectors */}
      <div className="bg-white p-4 rounded-2xl border border-[#D7E3EA] shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
              Select Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                const sub = subjects.find((s) => s.id === e.target.value);
                if (sub) setSelectedYear(sub.year);
              }}
              className="w-full px-3 py-2 text-sm bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl focus:bg-white focus:outline-none focus:border-[#00D9FF] font-medium text-[#172B4D]"
              id="performance-subject-select"
            >
              {assignedSubjects.length > 0 ? (
                assignedSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.subjectName} ({s.subjectCode}) • {s.department}
                  </option>
                ))
              ) : (
                subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.subjectName} ({s.subjectCode}) • {s.department}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="w-44">
            <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
              Year / Class
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value as AcademicYear)}
              className="w-full px-3 py-2 text-sm bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl focus:bg-white focus:outline-none focus:border-[#00D9FF] font-medium text-[#172B4D]"
              id="performance-year-select"
            >
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="2nd Year DSY">2nd Year DSY</option>
              <option value="3rd Year">3rd Year</option>
            </select>
          </div>

          <div className="w-36">
            <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
              Division
            </label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value as Division | 'All')}
              className="w-full px-3 py-2 text-sm bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl focus:bg-white focus:outline-none focus:border-[#00D9FF] font-medium text-[#172B4D]"
              id="performance-division-select"
            >
              <option value="All">All Divisions</option>
              <option value="A">Division A</option>
              <option value="B">Division B</option>
              <option value="C">Division C</option>
            </select>
          </div>
        </div>
      </div>

      {stats ? (
        <>
          {/* Key Subject Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#D7E3EA] shadow-xs">
              <div className="flex items-center justify-between text-[#64748B] mb-1">
                <span className="text-xs font-bold text-[#64748B]">Total Enrolled</span>
                <Users className="w-4 h-4 text-[#0094B3]" />
              </div>
              <div className="text-3xl font-black text-[#172B4D]">{stats.totalStudents}</div>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="text-[#16A34A] font-bold">
                  {stats.marksCompletedCount} Completed
                </span>
                <span className="text-[#D7E3EA]">•</span>
                <span className="text-amber-700 font-bold">
                  {stats.marksPendingCount} Pending
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#D7E3EA] shadow-xs">
              <div className="flex items-center justify-between text-[#64748B] mb-1">
                <span className="text-xs font-bold text-[#64748B]">Class Average</span>
                <BarChart3 className="w-4 h-4 text-[#0B1F3A]" />
              </div>
              <div className="text-3xl font-black text-[#172B4D]">{stats.classAveragePercentage}%</div>
              <div className="flex items-center gap-3 mt-2 text-xs text-[#64748B]">
                <span>Unit 1: <strong className="text-[#172B4D]">{stats.u1AvgPct}%</strong></span>
                <span>Unit 2: <strong className="text-[#172B4D]">{stats.u2AvgPct}%</strong></span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#D7E3EA] shadow-xs">
              <div className="flex items-center justify-between text-[#64748B] mb-1">
                <span className="text-xs font-bold text-[#64748B]">Score Progression</span>
                <TrendingUp className="w-4 h-4 text-[#16A34A]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#16A34A]">+{stats.improvedCount}</span>
                <span className="text-xs text-[#64748B]">students improved</span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="text-[#EF4444] font-bold">-{stats.declinedCount} declined</span>
                <span className="text-[#D7E3EA]">•</span>
                <span className="text-[#64748B]">{stats.consistentCount} consistent</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#D7E3EA] shadow-xs">
              <div className="flex items-center justify-between text-[#64748B] mb-1">
                <span className="text-xs font-bold text-[#64748B]">Needs Attention</span>
                <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
              </div>
              <div className="text-3xl font-black text-[#EF4444]">{stats.attentionCount}</div>
              <div className="text-xs text-[#EF4444] mt-2 font-medium">
                Scoring below 60% in {activeSubject?.subjectName}
              </div>
            </div>
          </div>

          {/* Highest & Lowest Marks Callouts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#D7E3EA] shadow-xs flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 text-[11px] font-bold bg-[#F5F9FC] text-[#16A34A] border border-[#D7E3EA] rounded-md">
                  TOP SCORER IN SUBJECT
                </span>
                <h4 className="text-lg font-bold text-[#172B4D] mt-1">
                  {stats.highestMarks.studentName}
                </h4>
                <p className="text-xs text-[#64748B]">
                  Average Score: {stats.highestMarks.marks}/{stats.highestMarks.maxMarks} ({stats.highestMarks.percentage}%)
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#0B1F3A] text-[#00D9FF] flex items-center justify-center font-bold text-xl shadow-xs border border-[#00D9FF]/30">
                <Award className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#D7E3EA] shadow-xs flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 rounded-md">
                  LOWEST SCORE / AT-RISK
                </span>
                <h4 className="text-lg font-bold text-[#172B4D] mt-1">
                  {stats.lowestMarks.studentName}
                </h4>
                <p className="text-xs text-[#64748B]">
                  Average Score: {stats.lowestMarks.marks}/{stats.lowestMarks.maxMarks} ({stats.lowestMarks.percentage}%)
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Rating Distribution & Unit Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rating Category Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-[#D7E3EA] shadow-xs space-y-4">
              <h3 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#0094B3]" />
                <span>Performance Classification Breakdown</span>
              </h3>
              <p className="text-xs text-[#64748B]">
                Number of students distributed across academic performance tiers.
              </p>

              <div className="space-y-3 pt-2">
                {(
                  [
                    { rating: 'Excellent', label: 'Excellent (≥90%)', color: 'bg-emerald-500', bar: 'bg-emerald-100' },
                    { rating: 'Very Good', label: 'Very Good (80–89%)', color: 'bg-[#00D9FF]', bar: 'bg-cyan-100' },
                    { rating: 'Good', label: 'Good (70–79%)', color: 'bg-[#0B1F3A]', bar: 'bg-slate-200' },
                    { rating: 'Average', label: 'Average (60–69%)', color: 'bg-amber-500', bar: 'bg-amber-100' },
                    { rating: 'Below Average', label: 'Below Average (40–59%)', color: 'bg-orange-500', bar: 'bg-orange-100' },
                    { rating: 'Poor', label: 'Poor (<40%)', color: 'bg-rose-500', bar: 'bg-rose-100' },
                  ] as { rating: PerformanceRating; label: string; color: string; bar: string }[]
                ).map((item) => {
                  const count = stats.ratingDistribution[item.rating] || 0;
                  const pct = stats.totalStudents > 0 ? Math.round((count / stats.totalStudents) * 100) : 0;

                  return (
                    <div key={item.rating} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#172B4D]">{item.label}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#172B4D]">{count} students</span>
                          <span className="text-[#64748B]">({pct}%)</span>
                        </div>
                      </div>
                      <div className={`h-2.5 w-full ${item.bar} rounded-full overflow-hidden`}>
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Unit 1 vs Unit 2 Comparative Analysis */}
            <div className="bg-white p-6 rounded-2xl border border-[#D7E3EA] shadow-xs space-y-4">
              <h3 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#0094B3]" />
                <span>Unit 1 vs Unit 2 Examination Comparison</span>
              </h3>
              <p className="text-xs text-[#64748B]">
                Comparative analysis of average class scores between both examination phases.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-[#F5F9FC] p-4 rounded-xl border border-[#D7E3EA] text-center">
                  <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                    Unit 1 Test Average
                  </span>
                  <div className="text-3xl font-black text-[#0B1F3A] mt-1">
                    {stats.u1AvgPct}%
                  </div>
                  <div className="text-xs text-[#64748B] mt-1">
                    Max Marks: {activeSubject?.unit1MaxMarks || 25}
                  </div>
                </div>

                <div className="bg-[#F5F9FC] p-4 rounded-xl border border-[#D7E3EA] text-center">
                  <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                    Unit 2 Test Average
                  </span>
                  <div className="text-3xl font-black text-[#0094B3] mt-1">
                    {stats.u2AvgPct}%
                  </div>
                  <div className="text-xs text-[#64748B] mt-1">
                    Max Marks: {activeSubject?.unit2MaxMarks || 25}
                  </div>
                </div>
              </div>

              {/* Progress Delta banner */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                stats.u2AvgPct >= stats.u1AvgPct
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider">
                    Overall Unit-to-Unit Shift
                  </div>
                  <div className="text-sm font-semibold mt-0.5">
                    {stats.u2AvgPct >= stats.u1AvgPct
                      ? `Class average improved by +${Math.round((stats.u2AvgPct - stats.u1AvgPct) * 10) / 10}% in Unit 2.`
                      : `Class average declined by ${Math.round((stats.u2AvgPct - stats.u1AvgPct) * 10) / 10}% in Unit 2.`}
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  {stats.u2AvgPct >= stats.u1AvgPct ? (
                    <TrendingUp className="w-8 h-8 text-[#16A34A]" />
                  ) : (
                    <TrendingDown className="w-8 h-8 text-[#EF4444]" />
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveTab('teacher-students')}
                  className="text-xs font-bold text-[#0094B3] hover:text-[#0B1F3A] flex items-center gap-1 cursor-pointer"
                >
                  <span>View Subject Student Roster</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-[#D7E3EA]">
          <BookOpen className="w-12 h-12 text-[#64748B] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#172B4D]">No subject selected</h3>
          <p className="text-xs text-[#64748B] mt-1">Please select an assigned subject to review analytics.</p>
        </div>
      )}
    </div>
  );
};
