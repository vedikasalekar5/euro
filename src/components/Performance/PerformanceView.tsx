import React, { useState, useMemo, useEffect } from 'react';
import { useAcademic } from '../../context/AcademicContext';
import { useAuth } from '../../context/AuthContext';
import {
  TrendingUp,
  Search,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Trophy,
  Award,
  Download,
  FileSpreadsheet,
  FileText,
  X,
  ArrowUpRight,
  Users,
  CheckCircle2,
  Layers,
  GraduationCap,
  BookOpen,
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
import { getPerformanceBadgeClasses } from '../../utils/calculations';
import { exportAllStudentsToExcel } from '../../utils/excelExport';
import { exportDepartmentSummaryPDF } from '../../utils/pdfExport';
import { sortSummariesByEnrollment } from '../../utils/studentSorting';

export const PerformanceView: React.FC = () => {
  const {
    students,
    subjects,
    marks,
    allSummaries,
    setSelectedStudentProfile,
    showToast,
  } = useAcademic();

  const { currentTeacher } = useAuth();

  // 1. Dynamic list of Programmings/Departments from actual database records
  const availableProgrammings = useMemo(() => {
    const fromStudents = students
      .map((s) => s.department || (s as any).programming_name)
      .filter(Boolean) as Department[];

    const fromSubjects = subjects
      .map((sub) => sub.department || sub.programming_name)
      .filter(Boolean) as Department[];

    const combined = Array.from(new Set([...fromStudents, ...fromSubjects]));

    // If database is empty or new, ensure standard college engineering departments exist
    const defaultDepts: Department[] = [
      'Computer Engineering',
      'Civil Engineering',
      'Mechanical Engineering',
      'Electrical Engineering',
    ];

    defaultDepts.forEach((d) => {
      if (!combined.includes(d)) {
        combined.push(d);
      }
    });

    return combined;
  }, [students, subjects]);

  // Primary Selected Programming (Department)
  const [selectedProgramming, setSelectedProgramming] = useState<Department>(() => {
    if (currentTeacher?.department && availableProgrammings.includes(currentTeacher.department)) {
      return currentTeacher.department;
    }
    return availableProgrammings[0] || 'Computer Engineering';
  });

  // Keep selected programming valid if list changes
  useEffect(() => {
    if (!availableProgrammings.includes(selectedProgramming) && availableProgrammings.length > 0) {
      setSelectedProgramming(availableProgrammings[0]);
    }
  }, [availableProgrammings, selectedProgramming]);

  // Additional secondary filters (working together with Selected Programming)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<AcademicYear | 'All'>('All');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('All');
  const [selectedRating, setSelectedRating] = useState<PerformanceRating | 'All' | 'Improved'>('All');
  const [selectedUnitTestFocus, setSelectedUnitTestFocus] = useState<'All' | 'Unit Test 1' | 'Unit Test 2'>('All');

  // Courses available strictly for the selected programming
  const availableCoursesForProgramming = useMemo(() => {
    return subjects.filter((s) => {
      const matchDept = s.department === selectedProgramming || s.programming_name === selectedProgramming;
      if (!matchDept) return false;
      if (selectedYear !== 'All' && s.year !== selectedYear) return false;
      return true;
    });
  }, [subjects, selectedProgramming, selectedYear]);

  // Reset course selector if no longer valid for chosen programming
  useEffect(() => {
    if (selectedSubjectId !== 'All' && !availableCoursesForProgramming.some((s) => s.id === selectedSubjectId)) {
      setSelectedSubjectId('All');
    }
  }, [availableCoursesForProgramming, selectedSubjectId]);

  // 2. All summaries strictly for the selected programming
  const programmingSummaries = useMemo(() => {
    return allSummaries.filter(
      (sum) =>
        sum.student.department === selectedProgramming ||
        (sum.student as any).programming_name === selectedProgramming
    );
  }, [allSummaries, selectedProgramming]);

  // 3. Filtered performance records for the table and deep inspection
  const filteredPerformanceRows = useMemo(() => {
    return programmingSummaries
      .filter((sum) => {
        const student = sum.student;

        // Year Filter
        if (selectedYear !== 'All' && student.year !== selectedYear) {
          return false;
        }

        // Search Filter (Name, Enrollment No, BT No)
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase().trim();
          const name = (student.student_name || student.name || '').toLowerCase();
          const enroll = (student.enrollment_number || student.enrollmentNo || '').toLowerCase();
          const bt = (student.bt_no || student.btNo || '').toLowerCase();
          if (!name.includes(q) && !enroll.includes(q) && !bt.includes(q)) {
            return false;
          }
        }

        // Rating Filter
        if (selectedRating !== 'All') {
          if (selectedRating === 'Improved') {
            if (sum.overallTrend !== 'Improved') return false;
          } else if (sum.overallRating !== selectedRating) {
            return false;
          }
        }

        return true;
      })
      .map((sum) => {
        const student = sum.student;

        // If a specific course is selected, extract exact marks for that course
        if (selectedSubjectId !== 'All') {
          const matchedDetail = sum.details.find((d) => d.subject.id === selectedSubjectId);
          if (matchedDetail) {
            const u1 = matchedDetail.unit1Marks;
            const u2 = matchedDetail.unit2Marks;
            const avg = Number(((u1 + u2) / 2).toFixed(1));
            const pct = matchedDetail.averagePercentage;
            return {
              summary: sum,
              student,
              unit1Marks: u1,
              unit1Max: matchedDetail.unit1MaxMarks,
              unit1Pct: matchedDetail.unit1Percentage,
              unit2Marks: u2,
              unit2Max: matchedDetail.unit2MaxMarks,
              unit2Pct: matchedDetail.unit2Percentage,
              averageMarks: avg,
              averagePct: pct,
              rating: matchedDetail.rating,
              trend: matchedDetail.trend,
              delta: matchedDetail.improvementPercentage,
            };
          }
        }

        // Default: use overall student average across all subjects
        const u1 = sum.overallUnit1Marks;
        const u2 = sum.overallUnit2Marks;
        const avg = Number(((u1 + u2) / 2).toFixed(1));
        const pct = sum.overallAveragePercentage;
        return {
          summary: sum,
          student,
          unit1Marks: u1,
          unit1Max: 30,
          unit1Pct: sum.overallUnit1Percentage,
          unit2Marks: u2,
          unit2Max: 30,
          unit2Pct: sum.overallUnit2Percentage,
          averageMarks: avg,
          averagePct: pct,
          rating: sum.overallRating,
          trend: sum.overallTrend,
          delta: sum.overallImprovementDelta,
        };
      });
  }, [programmingSummaries, selectedYear, selectedSubjectId, selectedRating, searchTerm]);

  // Sort rows naturally by enrollment number
  const sortedPerformanceRows = useMemo(() => {
    return [...filteredPerformanceRows].sort((a, b) => {
      const eA = a.student.enrollment_number || a.student.enrollmentNo || '';
      const eB = b.student.enrollment_number || b.student.enrollmentNo || '';
      return eA.localeCompare(eB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [filteredPerformanceRows]);

  // 4. Summary Metrics for the SELECTED PROGRAMMING
  const programmingMetrics = useMemo(() => {
    const totalStudentsInProg = students.filter(
      (s) => s.department === selectedProgramming || (s as any).programming_name === selectedProgramming
    ).length;

    const evaluatedRows = programmingSummaries;
    const evaluatedCount = evaluatedRows.length;

    if (evaluatedCount === 0) {
      return {
        totalStudents: totalStudentsInProg,
        evaluatedStudents: 0,
        avgU1: 0,
        avgU1Pct: 0,
        avgU2: 0,
        avgU2Pct: 0,
        avgOverallMarks: 0,
        avgOverallPct: 0,
        improvedCount: 0,
        improvedRate: 0,
        excellentCount: 0,
      };
    }

    const sumU1 = evaluatedRows.reduce((acc, r) => acc + r.overallUnit1Marks, 0);
    const sumU2 = evaluatedRows.reduce((acc, r) => acc + r.overallUnit2Marks, 0);
    const sumAvgMarks = evaluatedRows.reduce((acc, r) => acc + r.overallAverageMarks, 0);
    const sumPct = evaluatedRows.reduce((acc, r) => acc + r.overallAveragePercentage, 0);
    const sumU1Pct = evaluatedRows.reduce((acc, r) => acc + r.overallUnit1Percentage, 0);
    const sumU2Pct = evaluatedRows.reduce((acc, r) => acc + r.overallUnit2Percentage, 0);

    const improved = evaluatedRows.filter((r) => r.overallTrend === 'Improved').length;
    const excellent = evaluatedRows.filter((r) => r.overallRating === 'Excellent').length;

    const avgU1 = Number((sumU1 / evaluatedCount).toFixed(1));
    const avgU2 = Number((sumU2 / evaluatedCount).toFixed(1));
    const avgOverallMarks = Number((sumAvgMarks / evaluatedCount).toFixed(1));

    return {
      totalStudents: totalStudentsInProg,
      evaluatedStudents: evaluatedCount,
      avgU1: avgU1,
      avgU1Pct: Number((sumU1Pct / evaluatedCount).toFixed(1)),
      avgU2: avgU2,
      avgU2Pct: Number((sumU2Pct / evaluatedCount).toFixed(1)),
      avgOverallMarks: avgOverallMarks,
      avgOverallPct: Number((sumPct / evaluatedCount).toFixed(1)),
      improvedCount: improved,
      improvedRate: Number(((improved / evaluatedCount) * 100).toFixed(1)),
      excellentCount: excellent,
    };
  }, [students, programmingSummaries, selectedProgramming]);

  // 5. Unit Test 1 vs Unit Test 2 Comparison Chart Data (Only for selected programming)
  const comparisonChartData = useMemo(() => {
    if (sortedPerformanceRows.length > 0 && sortedPerformanceRows.length <= 12) {
      return sortedPerformanceRows.map((r) => {
        const name = r.student.student_name || r.student.name || 'Student';
        const shortName = name.split(' ')[0] + ' ' + (name.split(' ')[1] ? name.split(' ')[1].charAt(0) + '.' : '');
        return {
          name: shortName,
          fullName: name,
          unit1: r.unit1Marks,
          unit2: r.unit2Marks,
          average: r.averageMarks,
          percentage: r.averagePct,
        };
      });
    }

    const years: AcademicYear[] = ['1st Year', '2nd Year', '3rd Year', '2nd Year DSY'];
    return years.map((yr) => {
      const yrSummaries = programmingSummaries.filter((s) => s.student.year === yr);
      const count = yrSummaries.length;
      const u1 = count > 0 ? Number((yrSummaries.reduce((a, b) => a + b.overallUnit1Marks, 0) / count).toFixed(1)) : 0;
      const u2 = count > 0 ? Number((yrSummaries.reduce((a, b) => a + b.overallUnit2Marks, 0) / count).toFixed(1)) : 0;
      const avg = count > 0 ? Number((yrSummaries.reduce((a, b) => a + b.overallAverageMarks, 0) / count).toFixed(1)) : 0;
      return {
        name: yr,
        fullName: `${selectedProgramming} - ${yr}`,
        unit1: u1,
        unit2: u2,
        average: avg,
        students: count,
      };
    });
  }, [sortedPerformanceRows, programmingSummaries, selectedProgramming]);

  // 6. Performance Distribution Donut Chart Data (Only for selected programming)
  const distributionData = useMemo(() => {
    const categories: { label: PerformanceRating; color: string }[] = [
      { label: 'Excellent', color: '#10B981' },     // Emerald Green
      { label: 'Very Good', color: '#00D9FF' },     // Bright Cyan
      { label: 'Good', color: '#67E8F9' },          // Soft Cyan
      { label: 'Average', color: '#F59E0B' },       // Amber
      { label: 'Below Average', color: '#FB923C' }, // Orange
      { label: 'Poor', color: '#EF4444' },          // Coral Red
    ];

    const sourceData = programmingSummaries;
    const total = sourceData.length;

    return categories.map((cat) => {
      const count = sourceData.filter((r) => r.overallRating === cat.label).length;
      const pct = total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0;
      return {
        name: cat.label,
        value: count,
        percentage: pct,
        color: cat.color,
      };
    });
  }, [programmingSummaries]);

  // 7. Top 5 Performing Students from the SELECTED PROGRAMMING
  const top5Students = useMemo(() => {
    return [...programmingSummaries]
      .sort((a, b) => b.overallAveragePercentage - a.overallAveragePercentage)
      .slice(0, 5);
  }, [programmingSummaries]);

  // Export PDF Handler for the selected programming
  const handleExportPDF = async () => {
    if (programmingSummaries.length === 0) {
      showToast(`No student records found for ${selectedProgramming}`, 'error');
      return;
    }

    try {
      const yearLabel = selectedYear === 'All' ? 'All Academic Years' : selectedYear;
      await exportDepartmentSummaryPDF(
        {
          department: selectedProgramming,
          year: selectedYear === 'All' ? '2nd Year' : selectedYear,
          totalStudents: programmingMetrics.evaluatedStudents,
          averageScore: programmingMetrics.avgOverallPct,
          overallAveragePercentage: programmingMetrics.avgOverallPct,
          avgUnit1Percentage: programmingMetrics.avgU1Pct,
          avgUnit2Percentage: programmingMetrics.avgU2Pct,
          improvedCount: programmingMetrics.improvedCount,
          declinedCount: programmingSummaries.filter((s) => s.overallTrend === 'Declined').length,
        },
        programmingSummaries
      );
    } catch (err) {
      console.error(err);
      showToast('Failed to export PDF report', 'error');
    }
  };

  // Export Excel Handler for the selected programming (Strict 3 columns: Student Name, Year, Programming)
  const handleExportExcel = () => {
    const progStudents = students.filter(
      (s) => s.department === selectedProgramming || (s as any).programming_name === selectedProgramming
    );
    if (progStudents.length === 0) {
      showToast(`No student records found for ${selectedProgramming}`, 'error');
      return;
    }
    const cleanFileName = `${selectedProgramming.replace(/\s+/g, '_')}_Students_Roster.xlsx`;
    exportAllStudentsToExcel(progStudents, cleanFileName);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150" id="programming-performance-view">
      
      {/* 1. Header & Prominent Programming Selector */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#D7E3EA] shadow-xs space-y-4" id="performance-header-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Title and Icon */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#0B1F3A] text-[#00D9FF] flex items-center justify-center shadow-xs shrink-0">
              <TrendingUp className="w-6 h-6 text-[#00D9FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#172B4D] tracking-tight">
                  Performance Analysis
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#0B1F3A]/5 text-[#0B1F3A] border border-[#00D9FF]/30">
                  Programming-Wise
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Continuous evaluation analytics powered by Unit Test 1 and Unit Test 2 marks
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-[#F5F9FC] hover:bg-[#E2ECF4] text-[#172B4D] text-xs font-bold rounded-xl border border-[#D7E3EA] transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-xs"
              id="performance-export-excel-btn"
              title={`Export Excel roster for ${selectedProgramming}`}
            >
              <FileSpreadsheet className="w-4 h-4 text-[#10B981]" />
              <span className="hidden sm:inline">Export Excel</span>
              <span className="sm:hidden">Excel</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="px-3.5 py-2 bg-[#0B1F3A] hover:bg-[#102A43] text-white text-xs font-bold rounded-xl shadow-md shadow-[#0B1F3A]/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer border border-[#00D9FF]/30"
              id="performance-export-pdf-btn"
              title={`Generate PDF report for ${selectedProgramming}`}
            >
              <FileText className="w-4 h-4 text-[#00D9FF]" />
              <span className="hidden sm:inline">Generate PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
          </div>
        </div>

        {/* PROMINENT PROGRAMMING SELECTION BAR */}
        <div className="pt-3 border-t border-[#D7E3EA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F5F9FC] p-3.5 rounded-xl border border-[#D7E3EA]">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0B1F3A]">
            <GraduationCap className="w-4 h-4 text-[#00D9FF] shrink-0" />
            <span className="uppercase tracking-wider text-[11px]">Select Programming:</span>
          </div>

          {/* Dynamic Programming Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <select
                value={selectedProgramming}
                onChange={(e) => setSelectedProgramming(e.target.value as Department)}
                className="w-full pl-3.5 pr-10 py-2.5 bg-white text-[#172B4D] font-extrabold text-sm rounded-xl border-2 border-[#0B1F3A] shadow-xs outline-none focus:ring-2 focus:ring-[#00D9FF]/30 transition-all cursor-pointer"
                id="programming-selector-dropdown"
              >
                {availableProgrammings.map((prog) => {
                  const progStudentCount = students.filter(
                    (s) => s.department === prog || (s as any).programming_name === prog
                  ).length;
                  return (
                    <option key={prog} value={prog} className="font-semibold text-[#172B4D]">
                      {prog} ({progStudentCount} students)
                    </option>
                  );
                })}
              </select>
            </div>

            <span className="hidden md:inline-flex px-3 py-1.5 bg-[#0B1F3A] text-white text-xs font-bold rounded-lg items-center gap-1.5 shrink-0 shadow-xs border border-[#00D9FF]/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00D9FF]" />
              <span>Active Scope</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Key Analytics Metric Cards for Selected Programming */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4" id="programming-summary-cards">
        
        {/* Card 1: Total Students for Selected Programming */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#D7E3EA] shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                Total Students
              </span>
              <span className="text-[10px] text-[#0B1F3A] font-semibold truncate block max-w-[120px]">
                {selectedProgramming.replace(' Engineering', '')}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#F5F9FC] text-[#0B1F3A] border border-[#D7E3EA] flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#172B4D] font-mono tracking-tight">
              {programmingMetrics.totalStudents}
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              {programmingMetrics.evaluatedStudents} with evaluation records
            </p>
          </div>
        </div>

        {/* Card 2: Unit Test 1 Average for Selected Programming */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#D7E3EA] shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              Unit Test 1 Average
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#0B1F3A]/5 text-[#0B1F3A] flex items-center justify-center shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] font-mono tracking-tight">
              {programmingMetrics.avgU1}{' '}
              <span className="text-xs font-sans text-[#64748B] font-normal">/ 30</span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              {programmingMetrics.avgU1Pct}% average score
            </p>
          </div>
        </div>

        {/* Card 3: Unit Test 2 Average for Selected Programming */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#D7E3EA] shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              Unit Test 2 Average
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#00D9FF]/10 text-[#0094B3] flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#102A43] font-mono tracking-tight">
              {programmingMetrics.avgU2}{' '}
              <span className="text-xs font-sans text-[#64748B] font-normal">/ 30</span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              {programmingMetrics.avgU2Pct}% average score
            </p>
          </div>
        </div>

        {/* Card 4: Overall Average for Selected Programming */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#D7E3EA] shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              Overall Average
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#16A34A] font-mono tracking-tight">
              {programmingMetrics.avgOverallPct}%
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#64748B] mt-0.5">
              <span className="text-[#16A34A] flex items-center">
                <ArrowUpRight className="w-3 h-3" />
                {programmingMetrics.improvedRate}%
              </span>
              <span>improved in UT2</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Visual Charts Grid (Unit Test 1 vs Unit Test 2 & Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="programming-charts-container">
        
        {/* Left: Unit Test 1 vs Unit Test 2 Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#D7E3EA] shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D7E3EA] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#00D9FF]" />
                <span>{selectedProgramming}: UT1 vs UT2 Comparison</span>
              </h2>
              <p className="text-[11px] text-[#64748B]">
                Average marks out of 30 across cohorts
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-[#0B1F3A]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0B1F3A]" />
                Unit Test 1
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-[#0094B3]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00D9FF]" />
                Unit Test 2
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            {comparisonChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2ECF4" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-10}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#64748B"
                    fontSize={11}
                    domain={[0, 30]}
                    tickCount={7}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#0B1F3A] text-white p-3 rounded-xl shadow-lg border border-[#00D9FF]/40 text-xs">
                            <div className="font-bold text-white mb-1.5">{data.fullName || label}</div>
                            <div className="space-y-1 font-mono">
                              <div className="flex items-center justify-between gap-4 text-[#D7E3EA]">
                                <span>Unit Test 1:</span>
                                <span className="font-bold text-white">{data.unit1}/30</span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-[#67E8F9]">
                                <span>Unit Test 2:</span>
                                <span className="font-bold text-[#00D9FF]">{data.unit2}/30</span>
                              </div>
                              <div className="pt-1 border-t border-white/10 flex items-center justify-between gap-4 text-[#10B981] font-sans">
                                <span>Average:</span>
                                <span className="font-bold font-mono">{data.average}/30 ({((data.average / 30) * 100).toFixed(1)}%)</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="unit1" name="Unit Test 1" fill="#0B1F3A" radius={[6, 6, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="unit2" name="Unit Test 2" fill="#00D9FF" radius={[6, 6, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#64748B]">
                No evaluation records available for {selectedProgramming}.
              </div>
            )}
          </div>
        </div>

        {/* Right: Performance Distribution Donut Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#D7E3EA] shadow-xs flex flex-col justify-between">
          <div className="border-b border-[#D7E3EA] pb-3">
            <h2 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-[#00D9FF]" />
              <span>{selectedProgramming.replace(' Engineering', '')} Distribution</span>
            </h2>
            <p className="text-[11px] text-[#64748B]">
              Rating categories for {selectedProgramming} students
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-3">
            
            {/* Donut Canvas */}
            <div className="sm:col-span-6 h-48 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData.filter((d) => d.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#0B1F3A] text-white px-2.5 py-1.5 rounded-lg text-xs shadow-md border border-[#00D9FF]/40">
                            <span className="font-bold">{data.name}: </span>
                            <span>{data.value} students ({data.percentage}%)</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-[#172B4D] font-mono leading-none">
                  {programmingMetrics.evaluatedStudents}
                </span>
                <span className="text-[9px] text-[#64748B] uppercase tracking-wider font-semibold">
                  Students
                </span>
              </div>
            </div>

            {/* Distribution Legend List */}
            <div className="sm:col-span-6 space-y-1.5 text-xs">
              {distributionData.map((item) => (
                <div
                  key={item.name}
                  onClick={() => setSelectedRating(selectedRating === item.name ? 'All' : (item.name as any))}
                  className={`flex items-center justify-between px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedRating === item.name ? 'bg-[#0B1F3A]/10 font-bold text-[#0B1F3A]' : 'hover:bg-[#F5F9FC] text-[#64748B]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[11px] truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-mono">
                    <span className="font-semibold text-[#172B4D]">{item.value}</span>
                    <span className="text-[#64748B]">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Top 5 Performing Students from Selected Programming */}
      <div className="bg-white p-6 rounded-2xl border border-[#D7E3EA] shadow-xs" id="programming-top-students-card">
        <div className="flex items-center justify-between border-b border-[#D7E3EA] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0B1F3A]/5 text-[#0B1F3A] flex items-center justify-center shadow-xs">
              <Trophy className="w-4 h-4 text-[#00D9FF]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#172B4D]">
                Top 5 Performing Students ({selectedProgramming})
              </h2>
              <p className="text-[11px] text-[#64748B]">
                Highest average marks across Unit Test 1 &amp; 2 in {selectedProgramming}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#0B1F3A]/5 text-[#0B1F3A] border border-[#D7E3EA]">
            Top Performers
          </span>
        </div>

        {top5Students.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {top5Students.map((sum, idx) => {
              const rankLabels = ['🥇 Rank 1', '🥈 Rank 2', '🥉 Rank 3', '#4 Rank', '#5 Rank'];
              const rankBorder =
                idx === 0
                  ? 'border-[#00D9FF] bg-[#00D9FF]/5'
                  : idx === 1
                  ? 'border-[#67E8F9] bg-[#F5F9FC]'
                  : idx === 2
                  ? 'border-[#D7E3EA] bg-[#F5F9FC]'
                  : 'border-[#D7E3EA] bg-white';

              const name = sum.student.student_name || sum.student.name || 'Student';
              const enroll = sum.student.enrollment_number || sum.student.enrollmentNo || '-';
              const badge = getPerformanceBadgeClasses(sum.overallRating);

              return (
                <div
                  key={sum.student.id}
                  onClick={() => setSelectedStudentProfile(sum.student)}
                  className={`p-3.5 rounded-xl border ${rankBorder} hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10.5px] font-bold text-[#0B1F3A] bg-white px-2 py-0.5 rounded-full border border-[#D7E3EA] shadow-2xs">
                        {rankLabels[idx]}
                      </span>
                      <span className="text-xs font-extrabold text-[#0B1F3A] font-mono">
                        {sum.overallAveragePercentage}%
                      </span>
                    </div>

                    <div className="font-bold text-xs text-[#172B4D] group-hover:text-[#0094B3] transition-colors truncate" title={name}>
                      {name}
                    </div>
                    <div className="text-[10px] font-mono text-[#64748B] truncate">
                      {enroll} • {sum.student.year}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#D7E3EA] space-y-1.5">
                    <div className="flex items-center justify-between text-[10.5px] font-mono">
                      <span className="text-[#64748B]">UT1: <strong className="text-[#172B4D]">{sum.overallUnit1Marks}</strong></span>
                      <span className="text-[#64748B]">UT2: <strong className="text-[#172B4D]">{sum.overallUnit2Marks}</strong></span>
                      <span className="text-[#10B981] font-bold">Avg: {sum.overallAverageMarks}</span>
                    </div>
                    <div className="flex justify-end">
                      <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${badge.bg}`}>
                        {sum.overallRating}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-[#64748B]">
            No students found for {selectedProgramming}.
          </div>
        )}
      </div>

      {/* 5. Student Performance Table for Selected Programming */}
      <div className="bg-white rounded-2xl border border-[#D7E3EA] shadow-xs overflow-hidden" id="programming-student-table-card">
        
        {/* Filter Controls Bar */}
        <div className="p-5 sm:p-6 border-b border-[#D7E3EA] space-y-3.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#172B4D] tracking-tight">
                  {selectedProgramming} — Student Directory
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#0B1F3A]/5 text-[#0B1F3A] border border-[#D7E3EA]">
                  {sortedPerformanceRows.length} Students
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                Filtered continuous evaluation records for {selectedProgramming}
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or enrollment no..."
                className="w-full pl-9 pr-8 py-2 bg-[#F5F9FC] hover:bg-white focus:bg-white text-xs text-[#172B4D] placeholder-[#64748B] rounded-xl border border-[#D7E3EA] focus:border-[#00D9FF] focus:ring-1 focus:ring-[#00D9FF] outline-none transition-all"
                id="programming-search-input"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#172B4D] p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Secondary Filter Grid: Year, Course, Unit Test Focus, Rating */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-[#64748B] flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" />
              Filters:
            </span>

            {/* Filter: Year */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value as AcademicYear | 'All')}
              className="px-3 py-1.5 bg-[#F5F9FC] hover:bg-white text-xs font-semibold text-[#172B4D] border border-[#D7E3EA] rounded-xl outline-none focus:border-[#00D9FF] transition-all cursor-pointer"
              id="programming-filter-year"
            >
              <option value="All">All Years</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="2nd Year DSY">2nd Year DSY</option>
            </select>

            {/* Filter: Course belonging to this programming */}
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-3 py-1.5 bg-[#F5F9FC] hover:bg-white text-xs font-semibold text-[#172B4D] border border-[#D7E3EA] rounded-xl outline-none focus:border-[#00D9FF] transition-all cursor-pointer max-w-[220px] truncate"
              id="programming-filter-course"
            >
              <option value="All">All Courses (Aggregated)</option>
              {availableCoursesForProgramming.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.course_title || sub.subject_name || sub.courseCode}
                </option>
              ))}
            </select>

            {/* Filter: Performance Rating */}
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value as any)}
              className="px-3 py-1.5 bg-[#F5F9FC] hover:bg-white text-xs font-semibold text-[#172B4D] border border-[#D7E3EA] rounded-xl outline-none focus:border-[#00D9FF] transition-all cursor-pointer"
              id="programming-filter-rating"
            >
              <option value="All">All Performance Levels</option>
              <option value="Excellent">Excellent (≥ 90%)</option>
              <option value="Very Good">Very Good (80–89%)</option>
              <option value="Good">Good (70–79%)</option>
              <option value="Average">Average (60–69%)</option>
              <option value="Below Average">Below Average (40–59%)</option>
              <option value="Poor">Poor (&lt; 40%)</option>
              <option value="Improved">Improved in UT2</option>
            </select>

            {/* Reset Filters */}
            {(selectedYear !== 'All' || selectedSubjectId !== 'All' || selectedRating !== 'All' || searchTerm) && (
              <button
                onClick={() => {
                  setSelectedYear('All');
                  setSelectedSubjectId('All');
                  setSelectedRating('All');
                  setSearchTerm('');
                }}
                className="text-xs text-[#0B1F3A] hover:text-[#0094B3] font-semibold px-2 py-1 hover:bg-[#F5F9FC] rounded-lg transition-colors ml-auto cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Student Performance Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="programming-students-table">
            <thead>
              <tr className="bg-[#F5F9FC] border-b border-[#D7E3EA] text-[11px] font-bold text-[#0B1F3A] uppercase tracking-wider">
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Enrollment No.</th>
                <th className="py-3.5 px-4">Year</th>
                <th className="py-3.5 px-4 text-center">Unit Test 1</th>
                <th className="py-3.5 px-4 text-center">Unit Test 2</th>
                <th className="py-3.5 px-4 text-center">Average</th>
                <th className="py-3.5 px-4 text-right">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D7E3EA] text-xs text-[#172B4D]">
              {sortedPerformanceRows.length > 0 ? (
                sortedPerformanceRows.map((row) => {
                  const student = row.student;
                  const stdName = student.student_name || student.name || 'Student';
                  const enrollNo = student.enrollment_number || student.enrollmentNo || '-';
                  const badge = getPerformanceBadgeClasses(row.rating);

                  return (
                    <tr
                      key={student.id}
                      onClick={() => setSelectedStudentProfile(student)}
                      className="hover:bg-[#F5F9FC] transition-colors cursor-pointer group"
                      id={`prog-row-${student.id}`}
                    >
                      {/* Student Name */}
                      <td className="py-3.5 px-4 font-medium">
                        <div className="font-bold text-[#172B4D] group-hover:text-[#0094B3] transition-colors">
                          {stdName}
                        </div>
                        <div className="text-[10.5px] text-[#64748B] font-normal">
                          {student.department}
                        </div>
                      </td>

                      {/* Enrollment No. */}
                      <td className="py-3.5 px-4 font-mono text-[#64748B] text-[11.5px]">
                        <span className="px-2 py-0.5 rounded-md bg-[#F5F9FC] text-[#0B1F3A] border border-[#D7E3EA]">
                          {enrollNo}
                        </span>
                      </td>

                      {/* Year */}
                      <td className="py-3.5 px-4 text-[#172B4D] font-medium">
                        {student.year}
                      </td>

                      {/* Unit Test 1 */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="font-bold text-[#172B4D]">{row.unit1Marks}</span>
                        <span className="text-[10px] text-[#64748B]">/{row.unit1Max}</span>
                        <div className="text-[10px] text-[#0B1F3A] font-sans font-semibold">
                          {row.unit1Pct}%
                        </div>
                      </td>

                      {/* Unit Test 2 */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="font-bold text-[#172B4D]">{row.unit2Marks}</span>
                        <span className="text-[10px] text-[#64748B]">/{row.unit2Max}</span>
                        <div className="text-[10px] text-[#0094B3] font-sans font-semibold">
                          {row.unit2Pct}%
                        </div>
                      </td>

                      {/* Average */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        <div className="font-extrabold text-[#0B1F3A] text-sm">
                          {row.averageMarks}
                          <span className="text-[10.5px] text-[#64748B] font-normal font-sans">/30</span>
                        </div>
                        <div className="text-[10.5px] font-bold text-[#172B4D] font-sans">
                          {row.averagePct}%
                        </div>
                      </td>

                      {/* Performance Badge */}
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.bg}`}
                        >
                          {row.rating}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[#64748B]">
                    No students match the selected filters for {selectedProgramming}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 bg-[#F5F9FC] border-t border-[#D7E3EA] flex items-center justify-between text-[11px] text-[#64748B]">
          <span>
            Showing {sortedPerformanceRows.length} of {programmingSummaries.length} {selectedProgramming} students
          </span>
          <span className="hidden sm:inline">Click any student row to view full continuous mark breakdown</span>
        </div>
      </div>
    </div>
  );
};
