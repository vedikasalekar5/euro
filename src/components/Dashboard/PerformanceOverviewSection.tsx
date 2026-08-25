import React, { useState, useMemo } from 'react';
import { useAcademic } from '../../context/AcademicContext';
import {
  Users,
  Building2,
  BookOpen,
  Award,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  PieChart as PieChartIcon,
  Filter,
  CheckCircle2,
  Search,
  ArrowUpRight,
  Layers,
  GraduationCap,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Department, AcademicYear, PerformanceRating } from '../../types';
import { getPerformanceBadgeClasses, getPerformanceRating } from '../../utils/calculations';

export const PerformanceOverviewSection: React.FC = () => {
  const { students, subjects, marks, allSummaries, setActiveTab, setSelectedStudentProfile } = useAcademic();

  // Top Filter States (Defaults to 'All' as strictly required)
  const [selectedDept, setSelectedDept] = useState<Department | 'All'>('All');
  const [selectedYear, setSelectedYear] = useState<AcademicYear | 'All'>('All');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('All');
  const [selectedRating, setSelectedRating] = useState<PerformanceRating | 'All'>('All');
  const [subjectSearch, setSubjectSearch] = useState<string>('');

  // 1. Extract all unique departments dynamically from students and subjects
  const allDepartments = useMemo(() => {
    const fromStudents = students.map((s) => s.department || (s as any).programming_name).filter(Boolean) as Department[];
    const fromSubjects = subjects.map((sub) => sub.department || sub.programming_name).filter(Boolean) as Department[];
    const defaultDepts: Department[] = [
      'Computer Engineering',
      'Civil Engineering',
      'Mechanical Engineering',
      'Electrical Engineering',
    ];
    const combined = Array.from(new Set([...defaultDepts, ...fromStudents, ...fromSubjects]));
    return combined;
  }, [students, subjects]);

  // 2. Extract all unique academic years dynamically
  const allYears = useMemo(() => {
    const defaultYears: AcademicYear[] = ['1st Year', '2nd Year', '3rd Year', '2nd Year DSY'];
    const fromStudents = students.map((s) => s.year).filter(Boolean) as AcademicYear[];
    const fromSubjects = subjects.map((sub) => sub.year).filter(Boolean) as AcademicYear[];
    return Array.from(new Set([...defaultYears, ...fromStudents, ...fromSubjects]));
  }, [students, subjects]);

  // 3. Filtered list of subjects matching current filters
  const filteredSubjectsForDropdown = useMemo(() => {
    return subjects.filter((s) => {
      if (selectedDept !== 'All' && s.department !== selectedDept && s.programming_name !== selectedDept) return false;
      if (selectedYear !== 'All' && s.year !== selectedYear) return false;
      return true;
    });
  }, [subjects, selectedDept, selectedYear]);

  // Reset subject filter if it is not in the active dropdown
  React.useEffect(() => {
    if (selectedSubjectId !== 'All' && !filteredSubjectsForDropdown.some((s) => s.id === selectedSubjectId)) {
      setSelectedSubjectId('All');
    }
  }, [filteredSubjectsForDropdown, selectedSubjectId]);

  // 4. Detailed calculation for EVERY individual programming / subject / course
  const subjectPerformanceList = useMemo(() => {
    return subjects.map((sub) => {
      const courseTitle = sub.course_title || sub.subject_name || (sub as any).courseTitle || (sub as any).subjectName || 'Course';
      const courseCode = sub.course_code || sub.subject_code || (sub as any).courseCode || (sub as any).subjectCode || 'N/A';
      const dept = sub.department || sub.programming_name || 'Computer Engineering';
      const year = sub.year || '2nd Year';
      const maxMarks = sub.unit1MaxMarks || 30;

      // Eligible students for this course
      const enrolledStudents = students.filter(
        (st) => (st.department === dept || (st as any).programming_name === dept) && st.year === year
      );

      // Find all marks for this subject
      const subjectMarks = marks.filter((m) => m.subjectId === sub.id || (m as any).subject_id === sub.id);

      const evaluatedCount = subjectMarks.filter((m) => (m.unit1Marks ?? 0) > 0 || (m.unit2Marks ?? 0) > 0).length;

      let totalU1 = 0;
      let totalU2 = 0;
      let totalAvgMarks = 0;
      let highestMarks = 0;
      let lowestMarks = evaluatedCount > 0 ? 30 : 0;
      let highestU1 = 0;
      let highestU2 = 0;

      subjectMarks.forEach((m) => {
        const u1 = m.unit1Marks ?? 0;
        const u2 = m.unit2Marks ?? 0;
        const avg = Number(((u1 + u2) / 2).toFixed(1));

        totalU1 += u1;
        totalU2 += u2;
        totalAvgMarks += avg;

        if (avg > highestMarks) highestMarks = avg;
        if (avg < lowestMarks && (u1 > 0 || u2 > 0)) lowestMarks = avg;
        if (u1 > highestU1) highestU1 = u1;
        if (u2 > highestU2) highestU2 = u2;
      });

      const avgMarks = evaluatedCount > 0 ? Number((totalAvgMarks / evaluatedCount).toFixed(1)) : 0;
      const avgPercentage = evaluatedCount > 0 ? Number(((avgMarks / maxMarks) * 100).toFixed(1)) : 0;
      const avgU1 = evaluatedCount > 0 ? Number((totalU1 / evaluatedCount).toFixed(1)) : 0;
      const avgU2 = evaluatedCount > 0 ? Number((totalU2 / evaluatedCount).toFixed(1)) : 0;

      const category = getPerformanceRating(avgPercentage);

      return {
        id: sub.id,
        courseTitle,
        courseCode,
        department: dept,
        year,
        maxMarks,
        enrolledCount: enrolledStudents.length || evaluatedCount,
        evaluatedCount,
        avgMarks,
        avgPercentage,
        avgU1,
        avgU2,
        highestMarks,
        lowestMarks: evaluatedCount > 0 ? lowestMarks : 0,
        highestU1,
        highestU2,
        category,
        trend: avgU2 > avgU1 ? 'Improved' : avgU2 < avgU1 ? 'Declined' : 'Consistent',
      };
    });
  }, [subjects, students, marks]);

  // Filtered Subject Performance List based on active top filters
  const filteredSubjectPerformanceList = useMemo(() => {
    return subjectPerformanceList.filter((item) => {
      if (selectedDept !== 'All' && item.department !== selectedDept) return false;
      if (selectedYear !== 'All' && item.year !== selectedYear) return false;
      if (selectedSubjectId !== 'All' && item.id !== selectedSubjectId) return false;
      if (selectedRating !== 'All' && item.category !== selectedRating) return false;
      if (subjectSearch.trim()) {
        const q = subjectSearch.toLowerCase().trim();
        const matchTitle = item.courseTitle.toLowerCase().includes(q);
        const matchCode = item.courseCode.toLowerCase().includes(q);
        const matchDept = item.department.toLowerCase().includes(q);
        if (!matchTitle && !matchCode && !matchDept) return false;
      }
      return true;
    });
  }, [subjectPerformanceList, selectedDept, selectedYear, selectedSubjectId, selectedRating, subjectSearch]);

  // 5. Institution-Wide Overall Performance Statistics
  const overallStats = useMemo(() => {
    const totalStudents = students.length;
    const totalDepartments = allDepartments.length;
    const totalSubjects = subjects.length;

    // Filter summaries according to top filters for responsive dynamic drilldown
    const activeSummaries = allSummaries.filter((s) => {
      if (selectedDept !== 'All' && s.student.department !== selectedDept) return false;
      if (selectedYear !== 'All' && s.student.year !== selectedYear) return false;
      if (selectedRating !== 'All' && s.overallRating !== selectedRating) return false;
      return true;
    });

    const evaluatedStudents = activeSummaries.filter((s) =>
      s.details.some((d) => d.unit1Marks > 0 || d.unit2Marks > 0)
    );

    const count = evaluatedStudents.length;

    let overallMarksSum = 0;
    let overallPctSum = 0;
    let u1MarksSum = 0;
    let u2MarksSum = 0;

    let performingWellCount = 0; // >= 60% (Good, Very Good, Excellent)
    let needingImprovementCount = 0; // < 60% (Below Average, Poor)

    let highestAvgStudentPct = 0;
    let lowestAvgStudentPct = count > 0 ? 100 : 0;

    evaluatedStudents.forEach((s) => {
      overallMarksSum += s.overallAverageMarks;
      overallPctSum += s.overallAveragePercentage;
      u1MarksSum += s.overallUnit1Marks;
      u2MarksSum += s.overallUnit2Marks;

      if (s.overallAveragePercentage >= 60) {
        performingWellCount++;
      } else {
        needingImprovementCount++;
      }

      if (s.overallAveragePercentage > highestAvgStudentPct) {
        highestAvgStudentPct = s.overallAveragePercentage;
      }
      if (s.overallAveragePercentage < lowestAvgStudentPct) {
        lowestAvgStudentPct = s.overallAveragePercentage;
      }
    });

    // Subject level highest & lowest
    const evaluatedSubjectRows = subjectPerformanceList.filter((s) => s.evaluatedCount > 0);
    let highestSubjectAvgPct = 0;
    let highestSubjectName = '';
    let lowestSubjectAvgPct = evaluatedSubjectRows.length > 0 ? 100 : 0;
    let lowestSubjectName = '';

    evaluatedSubjectRows.forEach((s) => {
      if (s.avgPercentage > highestSubjectAvgPct) {
        highestSubjectAvgPct = s.avgPercentage;
        highestSubjectName = s.courseTitle;
      }
      if (s.avgPercentage < lowestSubjectAvgPct) {
        lowestSubjectAvgPct = s.avgPercentage;
        lowestSubjectName = s.courseTitle;
      }
    });

    const overallAverageMarks = count > 0 ? Number((overallMarksSum / count).toFixed(1)) : 0;
    const overallAveragePct = count > 0 ? Number((overallPctSum / count).toFixed(1)) : 0;
    const avgU1Marks = count > 0 ? Number((u1MarksSum / count).toFixed(1)) : 0;
    const avgU2Marks = count > 0 ? Number((u2MarksSum / count).toFixed(1)) : 0;

    return {
      totalStudents,
      totalDepartments,
      totalSubjects,
      evaluatedStudentsCount: count,
      overallAverageMarks,
      overallAveragePct,
      avgU1Marks,
      avgU2Marks,
      highestAverageScore: highestAvgStudentPct,
      lowestAverageScore: count > 0 ? lowestAvgStudentPct : 0,
      highestSubjectName: highestSubjectName || 'N/A',
      highestSubjectAvgPct,
      lowestSubjectName: lowestSubjectName || 'N/A',
      lowestSubjectAvgPct: evaluatedSubjectRows.length > 0 ? lowestSubjectAvgPct : 0,
      performingWellCount,
      performingWellRate: count > 0 ? Math.round((performingWellCount / count) * 100) : 0,
      needingImprovementCount,
      needingImprovementRate: count > 0 ? Math.round((needingImprovementCount / count) * 100) : 0,
    };
  }, [students, allDepartments, subjects, allSummaries, selectedDept, selectedYear, selectedRating, subjectPerformanceList]);

  // 6. Department-Wise Comparison Data (All Departments)
  const departmentPerformanceData = useMemo(() => {
    return allDepartments.map((dept) => {
      const deptSummaries = allSummaries.filter((s) => s.student.department === dept || (s.student as any).programming_name === dept);
      const deptSubjects = subjects.filter((s) => s.department === dept || s.programming_name === dept);
      const count = deptSummaries.length;

      let u1Sum = 0;
      let u2Sum = 0;
      let avgSum = 0;

      deptSummaries.forEach((s) => {
        u1Sum += s.overallUnit1Percentage;
        u2Sum += s.overallUnit2Percentage;
        avgSum += s.overallAveragePercentage;
      });

      const avgU1 = count > 0 ? Number((u1Sum / count).toFixed(1)) : 0;
      const avgU2 = count > 0 ? Number((u2Sum / count).toFixed(1)) : 0;
      const avgOverall = count > 0 ? Number((avgSum / count).toFixed(1)) : 0;
      const rating = getPerformanceRating(avgOverall);

      return {
        department: dept,
        shortName: dept.replace(' Engineering', ''),
        studentCount: count,
        subjectCount: deptSubjects.length,
        avgU1,
        avgU2,
        avgOverall,
        rating,
      };
    });
  }, [allDepartments, allSummaries, subjects]);

  // 7. Year-Wise Performance Data (1st, 2nd, 3rd, 2nd Year DSY & future)
  const yearPerformanceData = useMemo(() => {
    return allYears.map((yr) => {
      const yrSummaries = allSummaries.filter((s) => s.student.year === yr);
      const yrSubjects = subjects.filter((s) => s.year === yr);
      const count = yrSummaries.length;

      let u1Sum = 0;
      let u2Sum = 0;
      let avgSum = 0;
      let improvedCount = 0;

      yrSummaries.forEach((s) => {
        u1Sum += s.overallUnit1Percentage;
        u2Sum += s.overallUnit2Percentage;
        avgSum += s.overallAveragePercentage;
        if (s.overallTrend === 'Improved') improvedCount++;
      });

      const avgU1 = count > 0 ? Number((u1Sum / count).toFixed(1)) : 0;
      const avgU2 = count > 0 ? Number((u2Sum / count).toFixed(1)) : 0;
      const avgOverall = count > 0 ? Number((avgSum / count).toFixed(1)) : 0;
      const rating = getPerformanceRating(avgOverall);

      return {
        year: yr,
        studentCount: count,
        subjectCount: yrSubjects.length,
        avgU1,
        avgU2,
        avgOverall,
        rating,
        improvedRate: count > 0 ? Math.round((improvedCount / count) * 100) : 0,
      };
    });
  }, [allYears, allSummaries, subjects]);

  // 8. Performance Categories Distribution Data
  const performanceDistributionData = useMemo(() => {
    const categories: { label: PerformanceRating; color: string; range: string }[] = [
      { label: 'Excellent', color: '#00D9FF', range: '90–100%' },
      { label: 'Very Good', color: '#0284C7', range: '80–89%' },
      { label: 'Good', color: '#0B1F3A', range: '70–79%' },
      { label: 'Average', color: '#F59E0B', range: '60–69%' },
      { label: 'Below Average', color: '#FB923C', range: '40–59%' },
      { label: 'Poor', color: '#EF4444', range: '<40%' },
    ];

    const total = allSummaries.length;
    return categories.map((cat) => {
      const count = allSummaries.filter((s) => s.overallRating === cat.label).length;
      const pct = total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0;
      return {
        name: cat.label,
        range: cat.range,
        value: count,
        percentage: pct,
        color: cat.color,
      };
    });
  }, [allSummaries]);

  // 9. Subject-Wise Average Performance Chart Data (All Subjects)
  const subjectChartData = useMemo(() => {
    return filteredSubjectPerformanceList.map((item) => ({
      name: item.courseTitle.length > 18 ? item.courseTitle.substring(0, 16) + '…' : item.courseTitle,
      fullName: item.courseTitle,
      code: item.courseCode,
      department: item.department,
      year: item.year,
      avgMarks: item.avgMarks,
      avgPercentage: item.avgPercentage,
      avgU1: item.avgU1,
      avgU2: item.avgU2,
      highestMarks: item.highestMarks,
      lowestMarks: item.lowestMarks,
      students: item.evaluatedCount,
    }));
  }, [filteredSubjectPerformanceList]);

  const hasActiveFilters = selectedDept !== 'All' || selectedYear !== 'All' || selectedSubjectId !== 'All' || selectedRating !== 'All' || subjectSearch !== '';

  const handleResetFilters = () => {
    setSelectedDept('All');
    setSelectedYear('All');
    setSelectedSubjectId('All');
    setSelectedRating('All');
    setSubjectSearch('');
  };

  return (
    <div className="space-y-6" id="institution-performance-overview">
      {/* 1. Global Filter Header (Default: All Departments, All Years, All Subjects, All Ratings) */}
      <div className="bg-white p-5 rounded-2xl border border-[#D7E3EA] shadow-xs" id="performance-overview-filter-bar">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#D7E3EA]">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#0B1F3A] text-[#00D9FF] flex items-center justify-center shadow-xs">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[#0B1F3A]">
                Performance Overview
              </h2>
              <span className="px-2.5 py-0.5 text-[11px] font-bold bg-[#E6FCFF] text-[#0B1F3A] rounded-full border border-[#67E8F9] hidden sm:inline-block">
                EURO MANDAR Dashboard
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              Complete academic evaluation across all departments, academic years, courses/programmings, and enrolled students.
            </p>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F9FC] hover:bg-[#E6FCFF] text-[#0B1F3A] text-xs font-semibold rounded-xl border border-[#D7E3EA] hover:border-[#00D9FF] transition-all cursor-pointer w-fit"
              id="reset-performance-filters-btn"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#00D9FF]" />
              <span>Reset to All</span>
            </button>
          )}
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
          
          {/* Department Filter */}
          <div>
            <label className="block text-[11px] font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
              Department / Branch
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#F5F9FC] text-xs font-semibold text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:bg-white focus:border-[#00D9FF] focus:ring-2 focus:ring-[#00D9FF]/20 outline-none cursor-pointer transition-all"
              id="filter-all-departments"
            >
              <option value="All">All Departments ({allDepartments.length})</option>
              {allDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Academic Year Filter */}
          <div>
            <label className="block text-[11px] font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
              Academic Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#F5F9FC] text-xs font-semibold text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:bg-white focus:border-[#00D9FF] focus:ring-2 focus:ring-[#00D9FF]/20 outline-none cursor-pointer transition-all"
              id="filter-all-years"
            >
              <option value="All">All Academic Years ({allYears.length})</option>
              {allYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Programming / Subject Filter */}
          <div>
            <label className="block text-[11px] font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
              Programming / Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3 py-2 bg-[#F5F9FC] text-xs font-semibold text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:bg-white focus:border-[#00D9FF] focus:ring-2 focus:ring-[#00D9FF]/20 outline-none cursor-pointer transition-all truncate"
              id="filter-all-subjects"
            >
              <option value="All">All Programming/Subjects ({subjects.length})</option>
              {filteredSubjectsForDropdown.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.course_title || s.subject_name} ({s.course_code || (s as any).subjectCode || 'N/A'})
                </option>
              ))}
            </select>
          </div>

          {/* Performance Category Filter */}
          <div>
            <label className="block text-[11px] font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
              Performance Category
            </label>
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#F5F9FC] text-xs font-semibold text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:bg-white focus:border-[#00D9FF] focus:ring-2 focus:ring-[#00D9FF]/20 outline-none cursor-pointer transition-all"
              id="filter-all-ratings"
            >
              <option value="All">All Performance Levels</option>
              <option value="Excellent">Excellent (90–100%)</option>
              <option value="Very Good">Very Good (80–89%)</option>
              <option value="Good">Good (70–79%)</option>
              <option value="Average">Average (60–69%)</option>
              <option value="Below Average">Below Average (40–59%)</option>
              <option value="Poor">Poor (&lt;40%)</option>
            </select>
          </div>

        </div>
      </div>

      {/* 2. Overall Performance Statistics (8 Key Metrics Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-3.5" id="performance-stats-grid">
        
        {/* Card 1: Total Students */}
        <div className="bg-white p-4 rounded-2xl border border-[#D7E3EA] shadow-xs flex flex-col justify-between hover:border-[#00D9FF] hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-[10.5px] font-bold uppercase tracking-wider">Students</span>
            <div className="p-1.5 bg-[#E6FCFF] text-[#0B1F3A] rounded-lg">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-[#0B1F3A] font-mono">
              {overallStats.totalStudents}
            </div>
            <p className="text-[10px] text-[#64748B] mt-0.5">
              {overallStats.evaluatedStudentsCount} evaluated
            </p>
          </div>
        </div>

        {/* Card 2: Total Departments */}
        <div className="bg-white p-4 rounded-2xl border border-[#D7E3EA] shadow-xs flex flex-col justify-between hover:border-[#00D9FF] hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-[10.5px] font-bold uppercase tracking-wider">Departments</span>
            <div className="p-1.5 bg-[#0B1F3A] text-[#00D9FF] rounded-lg">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-[#0B1F3A] font-mono">
              {overallStats.totalDepartments}
            </div>
            <p className="text-[10px] text-[#64748B] mt-0.5 truncate">
              All Branches
            </p>
          </div>
        </div>

        {/* Card 3: Total Programs / Subjects */}
        <div className="bg-white p-4 rounded-2xl border border-[#D7E3EA] shadow-xs flex flex-col justify-between hover:border-[#00D9FF] hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-[10.5px] font-bold uppercase tracking-wider">Subjects</span>
            <div className="p-1.5 bg-[#E6FCFF] text-[#0B1F3A] rounded-lg">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-[#0B1F3A] font-mono">
              {overallStats.totalSubjects}
            </div>
            <p className="text-[10px] text-[#64748B] mt-0.5 truncate">
              Courses Active
            </p>
          </div>
        </div>

        {/* Card 4: Overall Average Marks */}
        <div className="bg-white p-4 rounded-2xl border border-[#D7E3EA] shadow-xs flex flex-col justify-between hover:border-[#00D9FF] hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-[10.5px] font-bold uppercase tracking-wider">College Avg</span>
            <div className="p-1.5 bg-[#ECFDF5] text-[#059669] rounded-lg">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-[#059669] font-mono">
              {overallStats.overallAveragePct}%
            </div>
            <p className="text-[10px] text-[#64748B] mt-0.5">
              Avg {overallStats.overallAverageMarks} / 30
            </p>
          </div>
        </div>

        {/* Card 5: Highest Average Performance */}
        <div className="bg-white p-4 rounded-2xl border border-[#D7E3EA] shadow-xs flex flex-col justify-between hover:border-[#00D9FF] hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-[10.5px] font-bold uppercase tracking-wider">Highest Avg</span>
            <div className="p-1.5 bg-[#FEF3C7] text-[#D97706] rounded-lg">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-[#D97706] font-mono">
              {overallStats.highestAverageScore}%
            </div>
            <p className="text-[10px] text-[#64748B] mt-0.5 truncate" title={overallStats.highestSubjectName}>
              Top: {overallStats.highestSubjectName.split(' ')[0]} ({overallStats.highestSubjectAvgPct}%)
            </p>
          </div>
        </div>

        {/* Card 6: Lowest Average Performance */}
        <div className="bg-white p-4 rounded-2xl border border-[#D7E3EA] shadow-xs flex flex-col justify-between hover:border-[#00D9FF] hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-[10.5px] font-bold uppercase tracking-wider">Lowest Avg</span>
            <div className="p-1.5 bg-[#FEE2E2] text-[#DC2626] rounded-lg">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-[#DC2626] font-mono">
              {overallStats.lowestAverageScore}%
            </div>
            <p className="text-[10px] text-[#64748B] mt-0.5 truncate" title={overallStats.lowestSubjectName}>
              Low: {overallStats.lowestSubjectName.split(' ')[0]} ({overallStats.lowestSubjectAvgPct}%)
            </p>
          </div>
        </div>

        {/* Card 7: Students Performing Well (>= 60%) */}
        <div className="bg-white p-4 rounded-2xl border border-[#D7E3EA] shadow-xs flex flex-col justify-between hover:border-[#00D9FF] hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-[10.5px] font-bold uppercase tracking-wider">Performing Well</span>
            <div className="p-1.5 bg-[#ECFDF5] text-[#059669] rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-[#059669] font-mono">
              {overallStats.performingWellCount}
            </div>
            <p className="text-[10px] text-[#059669] font-semibold mt-0.5">
              {overallStats.performingWellRate}% (≥60%)
            </p>
          </div>
        </div>

        {/* Card 8: Students Needing Improvement (< 60%) */}
        <div className="bg-white p-4 rounded-2xl border border-[#D7E3EA] shadow-xs flex flex-col justify-between hover:border-[#00D9FF] hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-[10.5px] font-bold uppercase tracking-wider">Need Mentoring</span>
            <div className="p-1.5 bg-[#FEE2E2] text-[#EF4444] rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-[#EF4444] font-mono">
              {overallStats.needingImprovementCount}
            </div>
            <p className="text-[10px] text-[#EF4444] font-semibold mt-0.5">
              {overallStats.needingImprovementRate}% (&lt;60%)
            </p>
          </div>
        </div>

      </div>

      {/* 3. Visual Charts Grid (4 Comprehensive Visualizations) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="performance-charts-grid">
        
        {/* Chart 1: Department-wise Average Performance (6 cols) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-[#D7E3EA] shadow-xs flex flex-col justify-between" id="chart-department-performance">
          <div>
            <div className="flex items-center justify-between border-b border-[#D7E3EA] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#0B1F3A] text-[#00D9FF] flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0B1F3A]">
                    Department-wise Performance
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Unit 1 vs Unit 2 vs Overall average percentage by engineering department
                  </p>
                </div>
              </div>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="shortName"
                    tick={{ fill: '#64748B', fontSize: 10.5, fontWeight: 600 }}
                    axisLine={{ stroke: '#D7E3EA' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: '#64748B', fontSize: 10 }}
                    axisLine={{ stroke: '#D7E3EA' }}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#0B1F3A] text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-[#00D9FF]/40">
                            <div className="font-bold border-b border-[#102A43] pb-1 text-[#00D9FF]">{data.department}</div>
                            <div className="text-[#67E8F9]">Unit 1 Avg: {data.avgU1}%</div>
                            <div className="text-[#E6FCFF]">Unit 2 Avg: {data.avgU2}%</div>
                            <div className="text-[#00D9FF] font-bold pt-1 border-t border-[#102A43]">
                              Overall Avg: {data.avgOverall}% ({data.rating})
                            </div>
                            <div className="text-[10px] text-[#64748B]">Students: {data.studentCount} | Subjects: {data.subjectCount}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} iconType="circle" />
                  <Bar dataKey="avgU1" name="Unit 1 Avg (%)" fill="#00D9FF" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="avgU2" name="Unit 2 Avg (%)" fill="#67E8F9" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="avgOverall" name="Overall Avg (%)" fill="#0B1F3A" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Chart 2: Performance Category Distribution (6 cols) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-[#D7E3EA] shadow-xs flex flex-col justify-between" id="chart-category-distribution">
          <div>
            <div className="flex items-center justify-between border-b border-[#D7E3EA] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#0B1F3A] text-[#00D9FF] flex items-center justify-center">
                  <PieChartIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0B1F3A]">
                    Performance Category Distribution
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Student distribution across academic performance tiers
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-6 h-52 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={performanceDistributionData.filter((d) => d.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={72}
                      paddingAngle={3}
                    >
                      {performanceDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#0B1F3A] text-white px-3 py-1.5 rounded-lg text-xs shadow-md border border-[#00D9FF]/40">
                              <span className="font-bold text-[#00D9FF]">{data.name} ({data.range}): </span>
                              <span>{data.value} students ({data.percentage}%)</span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-black text-[#0B1F3A] font-mono leading-none">
                    {allSummaries.length}
                  </span>
                  <span className="text-[9px] text-[#64748B] uppercase tracking-wider font-semibold mt-0.5">
                    Students
                  </span>
                </div>
              </div>

              <div className="sm:col-span-6 space-y-1.5 text-xs">
                {performanceDistributionData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between px-2.5 py-1 rounded-lg hover:bg-[#F5F9FC] text-[#64748B] transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-[11px] font-semibold text-[#172B4D]">{item.name}</span>
                      <span className="text-[10px] text-[#64748B]">({item.range})</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-mono">
                      <span className="font-bold text-[#0B1F3A]">{item.value}</span>
                      <span className="text-[#64748B]">({item.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chart 3: Programming / Subject-Wise Average Performance (8 cols) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-[#D7E3EA] shadow-xs flex flex-col justify-between" id="chart-subject-performance">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#D7E3EA] pb-3 mb-4 gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#0B1F3A] text-[#00D9FF] flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0B1F3A]">
                    Programming / Subject-wise Performance
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Average score out of 30 &amp; Percentage for every registered subject
                  </p>
                </div>
              </div>
              <span className="text-xs text-[#0B1F3A] font-bold bg-[#E6FCFF] px-2.5 py-1 rounded-lg border border-[#67E8F9] w-fit">
                {subjectChartData.length} Subjects Displayed
              </span>
            </div>

            <div className="h-64 w-full">
              {subjectChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#172B4D', fontSize: 10, fontWeight: 500 }}
                      angle={-20}
                      textAnchor="end"
                      interval={0}
                      axisLine={{ stroke: '#D7E3EA' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 30]}
                      tick={{ fill: '#64748B', fontSize: 10 }}
                      axisLine={{ stroke: '#D7E3EA' }}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#0B1F3A] text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-[#00D9FF]/40">
                              <div className="font-bold border-b border-[#102A43] pb-1 text-[#00D9FF]">
                                {data.fullName} ({data.code})
                              </div>
                              <div className="text-[#67E8F9] text-[11px]">
                                {data.department} • {data.year}
                              </div>
                              <div className="text-[#E6FCFF] pt-1">
                                Average Marks: <strong className="text-white font-mono">{data.avgMarks} / 30</strong> ({data.avgPercentage}%)
                              </div>
                              <div className="text-[#67E8F9] flex justify-between gap-4 text-[11px]">
                                <span>Unit 1: {data.avgU1}/30</span>
                                <span>Unit 2: {data.avgU2}/30</span>
                              </div>
                              <div className="text-[#00D9FF] text-[11px]">
                                Highest: {data.highestMarks}/30 | Lowest: {data.lowestMarks}/30
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="avgMarks" name="Average Marks (/30)" fill="#00D9FF" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#64748B]">
                  No subject records found matching the filter.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chart 4: Year-wise Performance (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-[#D7E3EA] shadow-xs flex flex-col justify-between" id="chart-year-performance">
          <div>
            <div className="flex items-center justify-between border-b border-[#D7E3EA] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#0B1F3A] text-[#00D9FF] flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0B1F3A]">
                    Year-wise Performance
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    1st, 2nd, 3rd Year &amp; DSY
                  </p>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="year"
                    tick={{ fill: '#64748B', fontSize: 10, fontWeight: 600 }}
                    axisLine={{ stroke: '#D7E3EA' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: '#64748B', fontSize: 10 }}
                    axisLine={{ stroke: '#D7E3EA' }}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#0B1F3A] text-white p-2.5 rounded-xl shadow-lg border border-[#00D9FF]/40 text-xs space-y-1">
                            <div className="font-bold border-b border-[#102A43] pb-1 text-[#00D9FF]">{data.year}</div>
                            <div className="text-[#67E8F9]">Overall Avg: <strong className="text-white font-mono">{data.avgOverall}%</strong> ({data.rating})</div>
                            <div className="text-[#E6FCFF] text-[11px]">Enrolled: {data.studentCount} Students</div>
                            <div className="text-[#00D9FF] text-[11px]">📈 {data.improvedRate}% Improved in UT2</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="avgOverall" name="Overall Avg (%)" fill="#0B1F3A" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

      {/* 4. Department & Year Comparison Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="department-and-year-breakdown-cards">
        
        {/* Department-Wise Comparison Cards */}
        <div className="bg-white p-5 rounded-2xl border border-[#D7E3EA] shadow-xs">
          <div className="flex items-center justify-between border-b border-[#D7E3EA] pb-3 mb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#00D9FF]" />
              <h3 className="text-sm font-bold text-[#0B1F3A]">
                Department Academic Comparison
              </h3>
            </div>
            <span className="text-xs font-semibold text-[#64748B]">
              {departmentPerformanceData.length} Departments
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {departmentPerformanceData.map((d) => {
              const badge = getPerformanceBadgeClasses(d.rating);
              return (
                <div
                  key={d.department}
                  className="p-3.5 rounded-xl border border-[#D7E3EA] bg-[#F5F9FC] hover:bg-white hover:border-[#00D9FF] transition-all flex flex-col justify-between gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-[#0B1F3A] leading-snug">
                        {d.department}
                      </h4>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        {d.studentCount} Students • {d.subjectCount} Subjects
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border shrink-0 ${badge.bg}`}>
                      {d.rating}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#D7E3EA]/60 text-xs">
                    <div className="text-[11px] text-[#64748B]">
                      U1: <span className="font-bold text-[#0B1F3A]">{d.avgU1}%</span> → U2: <span className="font-bold text-[#0284C7]">{d.avgU2}%</span>
                    </div>
                    <div className="font-black text-[#0B1F3A] text-sm">
                      {d.avgOverall}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Year-Wise Comparison Cards */}
        <div className="bg-white p-5 rounded-2xl border border-[#D7E3EA] shadow-xs">
          <div className="flex items-center justify-between border-b border-[#D7E3EA] pb-3 mb-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#00D9FF]" />
              <h3 className="text-sm font-bold text-[#0B1F3A]">
                Academic Year Performance
              </h3>
            </div>
            <span className="text-xs font-semibold text-[#64748B]">
              {yearPerformanceData.length} Batches
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {yearPerformanceData.map((y) => {
              const badge = getPerformanceBadgeClasses(y.rating);
              return (
                <div
                  key={y.year}
                  className="p-3.5 rounded-xl border border-[#D7E3EA] bg-[#F5F9FC] hover:bg-white hover:border-[#00D9FF] transition-all flex flex-col justify-between gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-[#0B1F3A]">
                        {y.year}
                      </h4>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        {y.studentCount} Students Enrolled
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border shrink-0 ${badge.bg}`}>
                      {y.rating}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#D7E3EA]/60 text-xs">
                    <div className="text-[11px] text-[#059669] font-semibold">
                      📈 {y.improvedRate}% Progressed
                    </div>
                    <div className="font-black text-[#0B1F3A] text-sm">
                      {y.avgOverall}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 5. Programming / Subject Performance Table (Requirement 4) */}
      <div className="bg-white rounded-2xl border border-[#D7E3EA] shadow-xs overflow-hidden" id="programming-performance-table-section">
        <div className="p-4 sm:p-5 border-b border-[#D7E3EA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F5F9FC]">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#00D9FF]" />
              <h3 className="text-sm font-bold text-[#0B1F3A]">
                Programming / Subject Performance Matrix
              </h3>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Comprehensive subject-wise evaluation for all {filteredSubjectPerformanceList.length} programming courses in the system
            </p>
          </div>

          {/* Table Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B]" />
            <input
              type="text"
              value={subjectSearch}
              onChange={(e) => setSubjectSearch(e.target.value)}
              placeholder="Search course title or code..."
              className="w-full pl-9 pr-3 py-1.5 bg-white text-xs text-[#172B4D] rounded-xl border border-[#D7E3EA] focus:border-[#00D9FF] focus:ring-2 focus:ring-[#00D9FF]/20 outline-none"
              id="search-subject-matrix-input"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="programming-performance-table">
            <thead>
              <tr className="border-b border-[#D7E3EA] bg-[#0B1F3A] text-[11px] font-bold text-white uppercase tracking-wider">
                <th className="py-3 px-4">Subject Name &amp; Code</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Year</th>
                <th className="py-3 px-4 text-center">Students</th>
                <th className="py-3 px-4 text-center">Average Marks</th>
                <th className="py-3 px-4 text-center">Avg %</th>
                <th className="py-3 px-4 text-center">Highest Marks</th>
                <th className="py-3 px-4 text-center">Lowest Marks</th>
                <th className="py-3 px-4 text-center">Performance Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D7E3EA] text-xs">
              {filteredSubjectPerformanceList.length > 0 ? (
                filteredSubjectPerformanceList.map((sub) => {
                  const badge = getPerformanceBadgeClasses(sub.category);
                  return (
                    <tr key={sub.id} className="hover:bg-[#F5F9FC] transition-colors" id={`subject-row-${sub.id}`}>
                      {/* Name & Code */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#172B4D]">{sub.courseTitle}</div>
                        <span className="text-[10.5px] font-mono font-bold text-[#0B1F3A] bg-[#E6FCFF] px-1.5 py-0.5 rounded border border-[#67E8F9]/50">{sub.courseCode}</span>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4 font-medium text-[#172B4D]">
                        {sub.department}
                      </td>

                      {/* Year */}
                      <td className="py-3 px-4 text-[#64748B]">
                        <span className="px-2 py-0.5 bg-[#F5F9FC] text-[#0B1F3A] font-semibold rounded text-[11px] border border-[#D7E3EA]">
                          {sub.year}
                        </span>
                      </td>

                      {/* Number of Students */}
                      <td className="py-3 px-4 text-center font-mono font-medium text-[#172B4D]">
                        <span className="font-bold">{sub.evaluatedCount}</span>
                        <span className="text-[#64748B] text-[11px]"> / {sub.enrolledCount}</span>
                      </td>

                      {/* Average Marks */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-[#0B1F3A]">
                        {sub.avgMarks} <span className="text-[#64748B] font-normal text-[11px]">/ {sub.maxMarks}</span>
                      </td>

                      {/* Average Percentage */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-[#0B1F3A]">
                        {sub.avgPercentage}%
                      </td>

                      {/* Highest Marks */}
                      <td className="py-3 px-4 text-center font-mono font-semibold text-[#059669]">
                        {sub.highestMarks} <span className="text-[#64748B] font-normal text-[10px]">/ {sub.maxMarks}</span>
                      </td>

                      {/* Lowest Marks */}
                      <td className="py-3 px-4 text-center font-mono font-semibold text-[#EF4444]">
                        {sub.lowestMarks} <span className="text-[#64748B] font-normal text-[10px]">/ {sub.maxMarks}</span>
                      </td>

                      {/* Performance Category */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${badge.bg}`}>
                          {sub.category}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#64748B] text-xs">
                    No programming courses match the current filter or search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
