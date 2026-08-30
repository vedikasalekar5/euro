import React, { useState, useMemo } from 'react';
import { useAcademic } from '../../context/AcademicContext';
import {
  Users,
  Award,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit2,
  Download,
  UserPlus,
  FileSpreadsheet,
  Building2,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
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
import { Department, AcademicYear, PerformanceRating, Student, StudentAcademicSummary } from '../../types';
import { getPerformanceBadgeClasses, getPerformanceRating } from '../../utils/calculations';
import { exportAllStudentsToExcel } from '../../utils/excelExport';
import {
  sortSummariesByEnrollment,
  getEnrollmentNumber,
  getStudentName,
  compareEnrollmentNumbers,
} from '../../utils/studentSorting';

type SortField = 'name' | 'enrollment' | 'department' | 'year' | 'unit1' | 'unit2' | 'overall' | 'rating';
type SortOrder = 'asc' | 'desc';

export const TeacherDashboard: React.FC = () => {
  const {
    students,
    subjects,
    marks,
    allSummaries,
    setStudentFormModal,
    setImportStudentsModal,
    setSelectedStudentProfile,
    showToast,
  } = useAcademic();

  // Filters State (Default is 'All' so ALL students are immediately displayed)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<Department | 'All'>('All');
  const [selectedYear, setSelectedYear] = useState<AcademicYear | 'All'>('All');
  const [selectedRating, setSelectedRating] = useState<PerformanceRating | 'All'>('All');

  // Sorting State
  const [sortField, setSortField] = useState<SortField>('enrollment');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // 1. Dynamic list of all departments
  const allDepartments = useMemo(() => {
    const fromStudents = students.map((s) => s.department || (s as any).programming_name).filter(Boolean) as Department[];
    const defaultDepts: Department[] = [
      'Computer Engineering',
      'Civil Engineering',
      'Mechanical Engineering',
      'Electrical Engineering',
    ];
    return Array.from(new Set([...defaultDepts, ...fromStudents]));
  }, [students]);

  // 2. Dynamic list of all academic years
  const allYears = useMemo(() => {
    const defaultYears: AcademicYear[] = ['1st Year', '2nd Year', '3rd Year', '2nd Year DSY'];
    const fromStudents = students.map((s) => s.year).filter(Boolean) as AcademicYear[];
    return Array.from(new Set([...defaultYears, ...fromStudents]));
  }, [students]);

  // 3. Institution-wide Summary Statistics
  const stats = useMemo(() => {
    const totalStudents = students.length;
    let totalOverallPct = 0;
    let improvedCount = 0;
    let attentionCount = 0;
    let evaluatedCount = 0;

    allSummaries.forEach((s) => {
      totalOverallPct += s.overallAveragePercentage;
      if (s.details.some((d) => (d.unit1Marks ?? 0) > 0 || (d.unit2Marks ?? 0) > 0)) {
        evaluatedCount++;
      }
      if (s.overallTrend === 'Improved') {
        improvedCount++;
      }
      if (s.overallRating === 'Below Average' || s.overallRating === 'Poor') {
        attentionCount++;
      }
    });

    const averagePerformance = totalStudents > 0 ? Number((totalOverallPct / totalStudents).toFixed(1)) : 0;
    const improvedRate = totalStudents > 0 ? Math.round((improvedCount / totalStudents) * 100) : 0;
    const attentionRate = totalStudents > 0 ? Math.round((attentionCount / totalStudents) * 100) : 0;

    return {
      totalStudents,
      evaluatedCount,
      averagePerformance,
      improvedCount,
      improvedRate,
      attentionCount,
      attentionRate,
    };
  }, [students, allSummaries]);

  // 4. Filtered student summaries list
  const filteredSummaries = useMemo(() => {
    return allSummaries.filter((summary) => {
      const student = summary.student;
      const studentName = getStudentName(student).toLowerCase();
      const enrollment = getEnrollmentNumber(student).toLowerCase();
      const dept = (student.department || (student as any).programming_name || '').toLowerCase();

      // Search matching (optional)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = studentName.includes(q);
        const matchesEnroll = enrollment.includes(q);
        const matchesDept = dept.includes(q);
        if (!matchesName && !matchesEnroll && !matchesDept) return false;
      }

      // Department filter
      if (selectedDept !== 'All') {
        const studentDept = student.department || (student as any).programming_name;
        if (studentDept !== selectedDept) return false;
      }

      // Year filter
      if (selectedYear !== 'All' && student.year !== selectedYear) {
        return false;
      }

      // Performance rating filter
      if (selectedRating !== 'All' && summary.overallRating !== selectedRating) {
        return false;
      }

      return true;
    });
  }, [allSummaries, searchQuery, selectedDept, selectedYear, selectedRating]);

  // 5. Sorted student summaries list
  const sortedSummaries = useMemo(() => {
    const list = [...filteredSummaries];

    return list.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name': {
          const nameA = getStudentName(a.student).toLowerCase();
          const nameB = getStudentName(b.student).toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        }
        case 'enrollment': {
          const enrollA = getEnrollmentNumber(a.student);
          const enrollB = getEnrollmentNumber(b.student);
          comparison = compareEnrollmentNumbers(enrollA, enrollB);
          break;
        }
        case 'department': {
          const deptA = a.student.department || '';
          const deptB = b.student.department || '';
          comparison = deptA.localeCompare(deptB);
          break;
        }
        case 'year': {
          const yrA = a.student.year || '';
          const yrB = b.student.year || '';
          comparison = yrA.localeCompare(yrB);
          break;
        }
        case 'unit1': {
          comparison = a.overallUnit1Percentage - b.overallUnit1Percentage;
          break;
        }
        case 'unit2': {
          comparison = a.overallUnit2Percentage - b.overallUnit2Percentage;
          break;
        }
        case 'overall': {
          comparison = a.overallAveragePercentage - b.overallAveragePercentage;
          break;
        }
        case 'rating': {
          const ratingOrder: Record<PerformanceRating, number> = {
            Excellent: 6,
            'Very Good': 5,
            Good: 4,
            Average: 3,
            'Below Average': 2,
            Poor: 1,
          };
          comparison = (ratingOrder[a.overallRating] || 0) - (ratingOrder[b.overallRating] || 0);
          break;
        }
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredSummaries, sortField, sortOrder]);

  // 6. Paginated student summaries
  const totalRecords = sortedSummaries.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedSummaries = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return sortedSummaries.slice(start, start + pageSize);
  }, [sortedSummaries, safeCurrentPage, pageSize]);

  // Reset page to 1 when filters or search change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDept, selectedYear, selectedRating, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'overall' || field === 'unit1' || field === 'unit2' ? 'desc' : 'asc');
    }
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' || selectedDept !== 'All' || selectedYear !== 'All' || selectedRating !== 'All';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDept('All');
    setSelectedYear('All');
    setSelectedRating('All');
  };

  // Department-wise summary for macro analytics below
  const departmentStats = useMemo(() => {
    return allDepartments.map((dept) => {
      const deptSummaries = allSummaries.filter((s) => s.student.department === dept || (s.student as any).programming_name === dept);
      const count = deptSummaries.length;
      let avgSum = 0;
      let u1Sum = 0;
      let u2Sum = 0;
      deptSummaries.forEach((s) => {
        avgSum += s.overallAveragePercentage;
        u1Sum += s.overallUnit1Percentage;
        u2Sum += s.overallUnit2Percentage;
      });
      return {
        name: dept.replace(' Engineering', ''),
        fullName: dept,
        count,
        avg: count > 0 ? Number((avgSum / count).toFixed(1)) : 0,
        u1: count > 0 ? Number((u1Sum / count).toFixed(1)) : 0,
        u2: count > 0 ? Number((u2Sum / count).toFixed(1)) : 0,
      };
    });
  }, [allDepartments, allSummaries]);

  // Performance category breakdown
  const categoryStats = useMemo(() => {
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

  const startRecord = totalRecords === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endRecord = Math.min(safeCurrentPage * pageSize, totalRecords);

  return (
    <div className="space-y-6 animate-in fade-in duration-150" id="student-academic-dashboard">
      
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-7 border border-[#D7E3EA] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5" id="dashboard-header-banner">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-black bg-[#0B1F3A] text-[#00D9FF] rounded-md tracking-wider">
              EURO
            </span>
            <span className="text-xs font-bold text-[#64748B]">Continuous Evaluation &amp; Marks Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0B1F3A] tracking-tight">
            Student Academic Performance Management System
          </h1>
          <p className="text-xs text-[#64748B] mt-1 flex items-center gap-1.5 flex-wrap">
            <span>Rajaram Shinde Institute of Engineering &amp; Technology</span>
            <span>•</span>
            <span className="font-semibold text-[#172B4D]">Under the Guidance of Prof. Sandesh A. Gajmal</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => exportAllStudentsToExcel(filteredSummaries, 'EURO_Student_Performance.xlsx')}
            className="px-3.5 py-2 bg-[#F5F9FC] hover:bg-[#E6FCFF] text-[#0B1F3A] text-xs font-bold rounded-xl border border-[#D7E3EA] hover:border-[#00D9FF] transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
            id="dashboard-export-excel-btn"
          >
            <Download className="w-3.5 h-3.5 text-[#00D9FF]" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => setImportStudentsModal({ isOpen: true })}
            className="px-3.5 py-2 bg-[#F5F9FC] hover:bg-[#E6FCFF] text-[#0B1F3A] text-xs font-bold rounded-xl border border-[#D7E3EA] hover:border-[#00D9FF] transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
            id="dashboard-import-students-btn"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#0094B3]" />
            <span>Import Students</span>
          </button>

          <button
            onClick={() => setStudentFormModal({ isOpen: true, studentToEdit: null })}
            className="px-4 py-2 bg-[#0B1F3A] hover:bg-[#102A43] text-white text-xs font-bold rounded-xl shadow-md shadow-[#0B1F3A]/20 transition-all flex items-center gap-2 cursor-pointer border border-[#00D9FF]/40 active:scale-95"
            id="dashboard-add-student-btn"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#00D9FF]" />
            <span>+ Add Student</span>
          </button>
        </div>
      </div>

      {/* 2. Summary Statistics (4 Key Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5" id="dashboard-summary-stats-cards">
        
        {/* Card 1: Total Students */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D7E3EA] shadow-xs flex flex-col justify-between hover:border-[#00D9FF] hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#172B4D]">Total Students</span>
            <div className="p-2 bg-[#E6FCFF] text-[#0B1F3A] rounded-xl border border-[#67E8F9]/40">
              <Users className="w-4 h-4 text-[#0B1F3A]" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#0B1F3A] font-mono leading-none">
              {stats.totalStudents}
            </div>
            <p className="text-[11px] text-[#64748B] mt-1.5 flex items-center gap-1">
              <span className="font-semibold text-[#0B1F3A]">{stats.evaluatedCount}</span> with test marks
            </p>
          </div>
        </div>

        {/* Card 2: Average Performance */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D7E3EA] shadow-xs flex flex-col justify-between hover:border-[#00D9FF] hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#172B4D]">Average Performance</span>
            <div className="p-2 bg-[#ECFDF5] text-[#059669] rounded-xl border border-[#A7F3D0]">
              <Award className="w-4 h-4 text-[#059669]" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#059669] font-mono leading-none">
              {stats.averagePerformance}%
            </div>
            <p className="text-[11px] text-[#64748B] mt-1.5">
              Continuous evaluation average
            </p>
          </div>
        </div>

        {/* Card 3: Improved */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D7E3EA] shadow-xs flex flex-col justify-between hover:border-[#00D9FF] hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#172B4D]">Improved</span>
            <div className="p-2 bg-[#EFF6FF] text-[#2563EB] rounded-xl border border-[#BFDBFE]">
              <TrendingUp className="w-4 h-4 text-[#2563EB]" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#2563EB] font-mono leading-none">
              {stats.improvedCount}
            </div>
            <p className="text-[11px] text-[#2563EB] font-semibold mt-1.5">
              📈 {stats.improvedRate}% progressed in Unit 2
            </p>
          </div>
        </div>

        {/* Card 4: Attention (Need Mentoring) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D7E3EA] shadow-xs flex flex-col justify-between hover:border-[#00D9FF] hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#172B4D]">Attention</span>
            <div className="p-2 bg-[#FEF2F2] text-[#DC2626] rounded-xl border border-[#FECACA]">
              <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#DC2626] font-mono leading-none">
              {stats.attentionCount}
            </div>
            <p className="text-[11px] text-[#DC2626] font-semibold mt-1.5">
              ⚠️ {stats.attentionRate}% score &lt;60% (At-risk)
            </p>
          </div>
        </div>

      </div>

      {/* 3. Filters & Student Performance Table Section */}
      <div className="bg-white rounded-2xl border border-[#D7E3EA] shadow-xs overflow-hidden" id="student-performance-table-container">
        
        {/* Table Header & Controls */}
        <div className="p-5 border-b border-[#D7E3EA] space-y-4 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#0B1F3A] text-[#00D9FF] flex items-center justify-center shadow-xs">
                  <Users className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-[#0B1F3A]">
                  Student Performance
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-bold bg-[#E6FCFF] text-[#0B1F3A] rounded-full border border-[#67E8F9]">
                  {totalRecords} Students
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-1">
                All students are listed directly below with Unit 1, Unit 2, and overall performance.
              </p>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F9FC] hover:bg-[#E6FCFF] text-[#0B1F3A] text-xs font-semibold rounded-xl border border-[#D7E3EA] hover:border-[#00D9FF] transition-all cursor-pointer w-fit"
                id="reset-all-student-filters-btn"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#00D9FF]" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Search and Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            
            {/* Optional Search */}
            <div>
              <label className="block text-[11px] font-bold text-[#172B4D] uppercase tracking-wider mb-1">
                Search Students
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name or enrollment no..."
                  className="w-full pl-9 pr-3 py-2 bg-[#F5F9FC] text-xs font-medium text-[#172B4D] rounded-xl border border-[#D7E3EA] focus:border-[#00D9FF] focus:bg-white focus:ring-2 focus:ring-[#00D9FF]/20 outline-none transition-all placeholder:text-[#64748B]"
                  id="dashboard-student-search-input"
                />
              </div>
            </div>

            {/* Programming Filter */}
            <div>
              <label className="block text-[11px] font-bold text-[#172B4D] uppercase tracking-wider mb-1">
                Programming
              </label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#F5F9FC] text-xs font-semibold text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:bg-white focus:border-[#00D9FF] focus:ring-2 focus:ring-[#00D9FF]/20 outline-none cursor-pointer transition-all"
                id="dashboard-filter-programming"
              >
                <option value="All">All Programming ({allDepartments.length})</option>
                {allDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Academic Year Filter */}
            <div>
              <label className="block text-[11px] font-bold text-[#172B4D] uppercase tracking-wider mb-1">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#F5F9FC] text-xs font-semibold text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:bg-white focus:border-[#00D9FF] focus:ring-2 focus:ring-[#00D9FF]/20 outline-none cursor-pointer transition-all"
                id="dashboard-filter-year"
              >
                <option value="All">All Years ({allYears.length})</option>
                {allYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Performance Rating Filter */}
            <div>
              <label className="block text-[11px] font-bold text-[#172B4D] uppercase tracking-wider mb-1">
                Performance
              </label>
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#F5F9FC] text-xs font-semibold text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:bg-white focus:border-[#00D9FF] focus:ring-2 focus:ring-[#00D9FF]/20 outline-none cursor-pointer transition-all"
                id="dashboard-filter-performance"
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

        {/* Interactive Student Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="dashboard-students-performance-table">
            <thead>
              <tr className="border-b border-[#D7E3EA] bg-[#0B1F3A] text-[11px] font-bold text-white uppercase tracking-wider">
                <th className="py-3.5 px-3 w-12 text-center text-[#67E8F9]">#</th>
                
                {/* Name */}
                <th
                  onClick={() => handleSort('name')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-[#102A43] transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Name</span>
                    {sortField === 'name' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#00D9FF]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#00D9FF]" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-[#67E8F9]/50" />
                    )}
                  </div>
                </th>

                {/* Enrollment No. */}
                <th
                  onClick={() => handleSort('enrollment')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-[#102A43] transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Enrollment No.</span>
                    {sortField === 'enrollment' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#00D9FF]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#00D9FF]" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-[#67E8F9]/50" />
                    )}
                  </div>
                </th>

                {/* Programming */}
                <th
                  onClick={() => handleSort('department')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-[#102A43] transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Programming</span>
                    {sortField === 'department' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#00D9FF]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#00D9FF]" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-[#67E8F9]/50" />
                    )}
                  </div>
                </th>

                {/* Year */}
                <th
                  onClick={() => handleSort('year')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-[#102A43] transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Year</span>
                    {sortField === 'year' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#00D9FF]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#00D9FF]" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-[#67E8F9]/50" />
                    )}
                  </div>
                </th>

                {/* Unit 1 Avg */}
                <th
                  onClick={() => handleSort('unit1')}
                  className="py-3.5 px-4 text-center cursor-pointer hover:bg-[#102A43] transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Unit 1 Avg</span>
                    {sortField === 'unit1' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#00D9FF]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#00D9FF]" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-[#67E8F9]/50" />
                    )}
                  </div>
                </th>

                {/* Unit 2 Avg */}
                <th
                  onClick={() => handleSort('unit2')}
                  className="py-3.5 px-4 text-center cursor-pointer hover:bg-[#102A43] transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Unit 2 Avg</span>
                    {sortField === 'unit2' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#00D9FF]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#00D9FF]" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-[#67E8F9]/50" />
                    )}
                  </div>
                </th>

                {/* Overall Avg */}
                <th
                  onClick={() => handleSort('overall')}
                  className="py-3.5 px-4 text-center cursor-pointer hover:bg-[#102A43] transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Overall Avg</span>
                    {sortField === 'overall' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#00D9FF]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#00D9FF]" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-[#67E8F9]/50" />
                    )}
                  </div>
                </th>

                {/* Performance */}
                <th
                  onClick={() => handleSort('rating')}
                  className="py-3.5 px-4 text-center cursor-pointer hover:bg-[#102A43] transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Performance</span>
                    {sortField === 'rating' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#00D9FF]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#00D9FF]" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-[#67E8F9]/50" />
                    )}
                  </div>
                </th>

                {/* Actions */}
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#D7E3EA] text-xs">
              {paginatedSummaries.length > 0 ? (
                paginatedSummaries.map((summary, idx) => {
                  const student = summary.student;
                  const name = getStudentName(student);
                  const enrollment = getEnrollmentNumber(student);
                  const dept = student.department || (student as any).programming_name || 'N/A';
                  const year = student.year || 'N/A';
                  const badge = getPerformanceBadgeClasses(summary.overallRating);
                  const rowNumber = (safeCurrentPage - 1) * pageSize + idx + 1;

                  return (
                    <tr
                      key={student.id}
                      onClick={() => setSelectedStudentProfile(student)}
                      className="hover:bg-[#F5F9FC] transition-colors cursor-pointer group"
                      id={`student-row-${student.id}`}
                    >
                      {/* Row Index */}
                      <td className="py-3.5 px-3 text-center text-[#64748B] font-mono text-[11px]">
                        {rowNumber}
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#0B1F3A] group-hover:text-[#0094B3] transition-colors flex items-center gap-1.5">
                          <span>{name}</span>
                        </div>
                      </td>

                      {/* Enrollment Number */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-[#0B1F3A] bg-[#E6FCFF] px-2 py-0.5 rounded-md border border-[#67E8F9]/50">
                          {enrollment || 'N/A'}
                        </span>
                      </td>

                      {/* Programming */}
                      <td className="py-3.5 px-4 text-[#172B4D] font-medium">
                        {dept}
                      </td>

                      {/* Year */}
                      <td className="py-3.5 px-4 text-[#64748B]">
                        <span className="px-2 py-0.5 bg-[#F5F9FC] text-[#0B1F3A] font-semibold rounded text-[11px] border border-[#D7E3EA]">
                          {year}
                        </span>
                      </td>

                      {/* Unit 1 Avg */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        <div className="font-bold text-[#0B1F3A]">
                          {summary.overallUnit1Percentage}%
                        </div>
                        <div className="text-[10px] text-[#64748B]">
                          {summary.overallUnit1Marks} / 30
                        </div>
                      </td>

                      {/* Unit 2 Avg */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        <div className="font-bold text-[#0B1F3A]">
                          {summary.overallUnit2Percentage}%
                        </div>
                        <div className="text-[10px] text-[#64748B]">
                          {summary.overallUnit2Marks} / 30
                        </div>
                      </td>

                      {/* Overall Avg */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        <div className="font-black text-[#0B1F3A] text-sm">
                          {summary.overallAveragePercentage}%
                        </div>
                        <div className="text-[10px] flex items-center justify-center gap-0.5">
                          {summary.overallTrend === 'Improved' ? (
                            <span className="text-[#059669] font-bold">↑ Improved</span>
                          ) : summary.overallTrend === 'Declined' ? (
                            <span className="text-[#DC2626] font-bold">↓ Declined</span>
                          ) : (
                            <span className="text-[#64748B]">→ Consistent</span>
                          )}
                        </div>
                      </td>

                      {/* Performance Rating */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-full border ${badge.bg}`}>
                          {summary.overallRating}
                        </span>
                      </td>

                      {/* Row Actions */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()} // Prevent row click
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Profile */}
                          <button
                            onClick={() => setSelectedStudentProfile(student)}
                            className="p-1.5 text-[#0B1F3A] hover:bg-[#E6FCFF] hover:text-[#0094B3] rounded-lg transition-colors cursor-pointer border border-transparent hover:border-[#67E8F9]"
                            title="View Complete Academic Profile"
                            id={`btn-view-profile-${student.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Student */}
                          <button
                            onClick={() => setStudentFormModal({ isOpen: true, studentToEdit: student })}
                            className="p-1.5 text-[#64748B] hover:bg-[#F5F9FC] hover:text-[#0B1F3A] rounded-lg transition-colors cursor-pointer border border-transparent hover:border-[#D7E3EA]"
                            title="Edit Student Details"
                            id={`btn-edit-student-${student.id}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#64748B] text-xs">
                    <div className="max-w-md mx-auto space-y-2">
                      <Users className="w-8 h-8 mx-auto text-[#94A3B8]" />
                      <div className="font-bold text-[#0B1F3A] text-sm">No Students Found</div>
                      <p className="text-xs text-[#64748B]">
                        No students match the current filter or search criteria.
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={handleResetFilters}
                          className="mt-2 px-3 py-1.5 bg-[#0B1F3A] text-white text-xs font-semibold rounded-xl hover:bg-[#102A43] cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-[#D7E3EA] bg-[#F5F9FC] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" id="dashboard-pagination-bar">
          
          {/* Status count */}
          <div className="text-[#64748B] font-medium flex items-center gap-2">
            <span>
              Showing <strong className="text-[#0B1F3A] font-mono">{startRecord}–{endRecord}</strong> of{' '}
              <strong className="text-[#0B1F3A] font-mono">{totalRecords}</strong> students
            </span>

            {/* Page size selector */}
            <div className="flex items-center gap-1 ml-3 border-l border-[#D7E3EA] pl-3">
              <span className="text-[11px] text-[#64748B]">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2 py-1 bg-white border border-[#D7E3EA] rounded-lg text-xs font-semibold text-[#0B1F3A] cursor-pointer outline-none"
                id="pagination-pagesize-select"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-1">
            {/* First Page */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage <= 1}
              className="p-1.5 rounded-lg bg-white border border-[#D7E3EA] text-[#0B1F3A] hover:bg-[#E6FCFF] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="First Page"
              id="pagination-first-btn"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Previous Page */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
              className="px-3 py-1.5 rounded-lg bg-white border border-[#D7E3EA] text-[#0B1F3A] font-semibold hover:bg-[#E6FCFF] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              id="pagination-prev-btn"
            >
              Previous
            </button>

            {/* Page Number Pills (Max 5 pills) */}
            <div className="flex items-center gap-1 mx-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5) {
                  if (safeCurrentPage > 3 && safeCurrentPage < totalPages - 2) {
                    pageNum = safeCurrentPage - 2 + i;
                  } else if (safeCurrentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  }
                }

                const isActive = pageNum === safeCurrentPage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#0B1F3A] text-white border border-[#00D9FF]/40 shadow-xs'
                        : 'bg-white text-[#0B1F3A] border border-[#D7E3EA] hover:bg-[#E6FCFF]'
                    }`}
                    id={`pagination-page-${pageNum}-btn`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Page */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="px-3 py-1.5 rounded-lg bg-white border border-[#D7E3EA] text-[#0B1F3A] font-semibold hover:bg-[#E6FCFF] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              id="pagination-next-btn"
            >
              Next
            </button>

            {/* Last Page */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage >= totalPages}
              className="p-1.5 rounded-lg bg-white border border-[#D7E3EA] text-[#0B1F3A] hover:bg-[#E6FCFF] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Last Page"
              id="pagination-last-btn"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* 4. Macro Performance Analytics (Clean Department & Category Visuals) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="dashboard-analytics-charts">
        
        {/* Department-wise Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-[#D7E3EA] shadow-xs">
          <div className="flex items-center justify-between border-b border-[#D7E3EA] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0B1F3A] text-[#00D9FF] flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0B1F3A]">
                  Department Performance Comparison
                </h3>
                <p className="text-[11px] text-[#64748B]">
                  Unit 1 vs Unit 2 vs Overall average percentage by engineering department
                </p>
              </div>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
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
                        <div className="bg-[#0B1F3A] text-white p-2.5 rounded-xl shadow-xl text-xs space-y-1 border border-[#00D9FF]/40">
                          <div className="font-bold border-b border-[#102A43] pb-1 text-[#00D9FF]">{data.fullName}</div>
                          <div className="text-[#67E8F9]">Unit 1 Avg: {data.u1}%</div>
                          <div className="text-[#E6FCFF]">Unit 2 Avg: {data.u2}%</div>
                          <div className="text-[#00D9FF] font-bold pt-1 border-t border-[#102A43]">
                            Overall Avg: {data.avg}% ({data.count} Students)
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} iconType="circle" />
                <Bar dataKey="u1" name="Unit 1 Avg (%)" fill="#00D9FF" radius={[4, 4, 0, 0]} maxBarSize={24} />
                <Bar dataKey="u2" name="Unit 2 Avg (%)" fill="#67E8F9" radius={[4, 4, 0, 0]} maxBarSize={24} />
                <Bar dataKey="avg" name="Overall Avg (%)" fill="#0B1F3A" radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Category Distribution (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-[#D7E3EA] shadow-xs">
          <div className="flex items-center justify-between border-b border-[#D7E3EA] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0B1F3A] text-[#00D9FF] flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0B1F3A]">
                  Performance Distribution
                </h3>
                <p className="text-[11px] text-[#64748B]">
                  Student count across academic performance tiers
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-6 h-48 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryStats.filter((d) => d.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                  >
                    {categoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#0B1F3A] text-white px-3 py-1.5 rounded-lg text-xs shadow-md border border-[#00D9FF]/40">
                            <span className="font-bold text-[#00D9FF]">{data.name}: </span>
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
                <span className="text-lg font-black text-[#0B1F3A] font-mono leading-none">
                  {allSummaries.length}
                </span>
                <span className="text-[9px] text-[#64748B] uppercase tracking-wider font-semibold mt-0.5">
                  Students
                </span>
              </div>
            </div>

            <div className="sm:col-span-6 space-y-1 text-xs">
              {categoryStats.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between px-2 py-0.5 rounded-lg hover:bg-[#F5F9FC] text-[#64748B] transition-all"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[11px] font-semibold text-[#172B4D]">{item.name}</span>
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
    </div>
  );
};
