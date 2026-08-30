import React, { useState, useMemo } from 'react';
import { useAcademic } from '../../context/AcademicContext';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Filter,
  UserPlus,
  FileSpreadsheet,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  ArrowUpDown,
  Download,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { Department, AcademicYear, PerformanceRating, ImprovementTrend, Student } from '../../types';
import { getPerformanceBadgeClasses } from '../../utils/calculations';
import { exportAllStudentsToExcel } from '../../utils/excelExport';
import { compareEnrollmentNumbers, getEnrollmentNumber } from '../../utils/studentSorting';
import { StudentDeleteWorkflowModal } from '../Common/StudentDeleteWorkflowModal';

export const StudentList: React.FC = () => {
  const {
    students,
    allSummaries,
    deleteStudent,
    deleteStudentsBatch,
    deleteAllStudents,
    setSelectedStudentProfile,
    setSelectedStudentForMarks,
    setStudentFormModal,
    showToast,
  } = useAcademic();

  const { isTeacher, isAdmin } = useAuth();

  // Filters State
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<Department | 'All'>('All');
  const [yearFilter, setYearFilter] = useState<AcademicYear | 'All'>('All');
  const [ratingFilter, setRatingFilter] = useState<PerformanceRating | 'All'>('All');
  const [trendFilter, setTrendFilter] = useState<ImprovementTrend | 'All'>('All');

  // Unified Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [targetStudentForDelete, setTargetStudentForDelete] = useState<Student | null>(null);

  // Sorting: Default to Enrollment Number ascending
  const [sortField, setSortField] = useState<
    'name' | 'enrollmentNo' | 'overallAveragePercentage' | 'overallUnit1Percentage' | 'overallUnit2Percentage' | 'overallImprovementDelta'
  >('enrollmentNo');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // View Mode: 'roster' (minimal simple table) or 'academic' (full ledger)
  const [viewMode, setViewMode] = useState<'roster' | 'academic'>('academic');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Open Unified Delete Workflow from Row Action
  const handleOpenRowDelete = (student: Student) => {
    setTargetStudentForDelete(student);
    setIsDeleteModalOpen(true);
  };

  // Single Student Delete Handler
  const handleDeleteSingle = async (studentId: string) => {
    try {
      const res = deleteStudent(studentId);
      if (res && res.success === false) {
        showToast(res.message || 'Failed to delete student', 'error');
        return false;
      }
      showToast('Student record deleted successfully.', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Error deleting student', 'error');
      return false;
    }
  };

  // Multiple Students Batch Delete Handler
  const handleDeleteBatch = async (selectedIds: string[]) => {
    if (selectedIds.length === 0) return false;
    try {
      const res = await deleteStudentsBatch(selectedIds);
      if (res.success) {
        showToast(
          selectedIds.length === 1
            ? '1 student deleted successfully.'
            : `${selectedIds.length} students deleted successfully.`,
          'success'
        );
        return true;
      } else {
        showToast(res.message || 'Failed to delete selected students', 'error');
        return false;
      }
    } catch (err: any) {
      showToast(err.message || 'Error occurred while deleting students', 'error');
      return false;
    }
  };

  // Delete All Students Handler
  const handleDeleteAll = async () => {
    try {
      const res = await deleteAllStudents();
      if (res.success) {
        return true;
      } else {
        showToast(res.message || 'Failed to delete all students', 'error');
        return false;
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting all students', 'error');
      return false;
    }
  };

  // Filter logic
  const filteredSummaries = useMemo(() => {
    return allSummaries.filter((s) => {
      const q = search.trim().toLowerCase();
      const sEnrollment = (s.student.enrollmentNo || s.student.rollNumber || s.student.prn || '').toLowerCase();
      const sName = s.student.name.toLowerCase();

      const matchesSearch =
        !q ||
        sName.includes(q) ||
        sEnrollment.includes(q);

      const matchesDept = deptFilter === 'All' || s.student.department === deptFilter;
      const matchesYear = yearFilter === 'All' || s.student.year === yearFilter;
      const matchesRating = ratingFilter === 'All' || s.overallRating === ratingFilter;
      const matchesTrend = trendFilter === 'All' || s.overallTrend === trendFilter;

      return matchesSearch && matchesDept && matchesYear && matchesRating && matchesTrend;
    });
  }, [allSummaries, search, deptFilter, yearFilter, ratingFilter, trendFilter]);

  // Sort logic
  const sortedSummaries = useMemo(() => {
    return [...filteredSummaries].sort((a, b) => {
      if (sortField === 'enrollmentNo') {
        const enrollA = getEnrollmentNumber(a.student);
        const enrollB = getEnrollmentNumber(b.student);
        const cmp = compareEnrollmentNumbers(enrollA, enrollB);
        return sortOrder === 'asc' ? cmp : -cmp;
      }

      let aVal: any = a[sortField as keyof typeof a];
      let bVal: any = b[sortField as keyof typeof b];

      if (sortField === 'name') {
        aVal = a.student.name.toLowerCase();
        bVal = b.student.name.toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredSummaries, sortField, sortOrder]);

  // Pagination slice
  const totalPages = Math.ceil(sortedSummaries.length / itemsPerPage) || 1;
  const paginatedSummaries = sortedSummaries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setDeptFilter('All');
    setYearFilter('All');
    setRatingFilter('All');
    setTrendFilter('All');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    search !== '' ||
    deptFilter !== 'All' ||
    yearFilter !== 'All' ||
    ratingFilter !== 'All' ||
    trendFilter !== 'All';

  return (
    <div className="space-y-5 animate-in fade-in duration-200" id="student-list-section">
      
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Student Records & Performance</h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-100">
              {sortedSummaries.length} Students
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Minimal student roster with automatic Unit 1 & Unit 2 test calculations
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('academic')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === 'academic'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Academic Marks View
            </button>
            <button
              onClick={() => setViewMode('roster')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === 'roster'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Simple Student Table
            </button>
          </div>

          <button
            onClick={() => exportAllStudentsToExcel(sortedSummaries, `Students_Report_${deptFilter}_${yearFilter}.xlsx`)}
            className="px-3 py-2 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            id="export-excel-btn"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => setStudentFormModal({ isOpen: true, studentToEdit: null })}
            className="px-3.5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95 shadow-blue-600/20 cursor-pointer"
            id="student-list-enrol-btn"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          
          {/* Search Box: Student Name, Enrollment No */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Name or Enrollment No..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 text-xs text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 focus:border-blue-500 focus:bg-white outline-none transition-all"
              id="student-filter-search"
            />
          </div>

          {/* Programming Name Filter */}
          <div>
            <select
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-blue-500 focus:bg-white outline-none cursor-pointer"
              id="filter-department"
            >
              <option value="All">All Programming</option>
              <option value="Computer Engineering">Computer Engineering</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <select
              value={yearFilter}
              onChange={(e) => {
                setYearFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-blue-500 focus:bg-white outline-none cursor-pointer"
              id="filter-year"
            >
              <option value="All">All Years</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="2nd Year DSY">2nd Year DSY</option>
            </select>
          </div>

          {/* Performance Rating Filter */}
          <div>
            <select
              value={ratingFilter}
              onChange={(e) => {
                setRatingFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-blue-500 focus:bg-white outline-none cursor-pointer"
              id="filter-rating"
            >
              <option value="All">All Ratings</option>
              <option value="Excellent">Excellent (90-100%)</option>
              <option value="Very Good">Very Good (80-89%)</option>
              <option value="Good">Good (70-79%)</option>
              <option value="Average">Average (60-69%)</option>
              <option value="Below Average">Below Average (40-59%)</option>
              <option value="Poor">Poor (&lt;40%)</option>
            </select>
          </div>

        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span>
              Showing <strong className="text-slate-800">{sortedSummaries.length}</strong> matching students
            </span>
            <button
              onClick={resetFilters}
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Main Student Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 divide-y divide-slate-200/80">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3.5 w-14 text-center">Sr. No.</th>
                <th
                  onClick={() => handleSort('enrollmentNo')}
                  className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Enrollment No.</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Student Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3.5">Programming Name</th>
                <th className="px-4 py-3.5">Year</th>

                {viewMode === 'academic' && (
                  <>
                    <th
                      onClick={() => handleSort('overallUnit1Percentage')}
                      className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Unit Test 1</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('overallUnit2Percentage')}
                      className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Unit Test 2</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('overallAveragePercentage')}
                      className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Overall Avg</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="px-4 py-3.5 text-center">Rating</th>
                    <th
                      onClick={() => handleSort('overallImprovementDelta')}
                      className="px-4 py-3.5 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Trend</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                  </>
                )}

                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedSummaries.length > 0 ? (
                paginatedSummaries.map((summary, idx) => {
                  const student = summary.student;
                  const badge = getPerformanceBadgeClasses(summary.overallRating);
                  const isImproved = summary.overallTrend === 'Improved';
                  const isDeclined = summary.overallTrend === 'Declined';
                  const enrollment = student.enrollmentNo || student.rollNumber || student.prn || 'N/A';
                  const srNo = (currentPage - 1) * itemsPerPage + idx + 1;

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                      id={`student-row-${student.id}`}
                    >
                      {/* Sr. No. */}
                      <td className="px-4 py-3.5 text-center font-mono font-medium text-slate-400">
                        {srNo}
                      </td>

                      {/* Enrollment No. */}
                      <td className="px-4 py-3.5 font-mono font-medium text-slate-900 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-blue-50/80 text-blue-900 rounded-md font-semibold border border-blue-200">
                          {enrollment}
                        </span>
                      </td>

                      {/* Student Name */}
                      <td className="px-4 py-3.5">
                        <div
                          onClick={() => setSelectedStudentProfile(student)}
                          className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition-colors"
                        >
                          {student.name}
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3.5 font-medium text-slate-800">
                        {student.department}
                      </td>

                      {/* Year */}
                      <td className="px-4 py-3.5 font-medium text-slate-700">
                        {student.year}
                      </td>

                      {viewMode === 'academic' && (
                        <>
                          {/* Unit 1 */}
                          <td className="px-4 py-3.5 text-right font-medium text-slate-700">
                            {summary.overallUnit1Marks > 0 ? (
                              <div>
                                <span className="font-bold text-slate-900">{summary.overallUnit1Marks}</span>
                                <span className="text-[10px] text-slate-400">/{summary.overallUnit1Max}</span>
                                <div className="text-[10px] text-slate-500">({summary.overallUnit1Percentage}%)</div>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono">-</span>
                            )}
                          </td>

                          {/* Unit 2 */}
                          <td className="px-4 py-3.5 text-right font-medium text-slate-700">
                            {summary.overallUnit2Marks > 0 ? (
                              <div>
                                <span className="font-bold text-slate-900">{summary.overallUnit2Marks}</span>
                                <span className="text-[10px] text-slate-400">/{summary.overallUnit2Max}</span>
                                <div className="text-[10px] text-slate-500">({summary.overallUnit2Percentage}%)</div>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono">-</span>
                            )}
                          </td>

                          {/* Overall Avg */}
                          <td className="px-4 py-3.5 text-right font-black text-sm text-slate-900">
                            {summary.overallAverageMarks > 0 ? (
                              <div>
                                <span>{summary.overallAverageMarks}</span>
                                <span className="text-[10px] text-slate-400 font-normal">/{summary.overallAverageMax}</span>
                                <div className="text-[10px] text-blue-700 font-bold">{summary.overallAveragePercentage}%</div>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono">-</span>
                            )}
                          </td>

                          {/* Performance Rating */}
                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg}`}
                            >
                              {summary.overallRating}
                            </span>
                          </td>

                          {/* Progress Trend */}
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            {isImproved && (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                                <span>+{summary.overallImprovementDelta}% 📈</span>
                              </span>
                            )}
                            {isDeclined && (
                              <span className="inline-flex items-center gap-1 text-rose-600 font-semibold text-xs">
                                <span>{summary.overallImprovementDelta}% 📉</span>
                              </span>
                            )}
                            {!isImproved && !isDeclined && (
                              <span className="inline-flex items-center gap-1 text-slate-500 text-xs">
                                <span>0% ➡️</span>
                              </span>
                            )}
                          </td>
                        </>
                      )}

                      {/* Action Buttons: View / Edit / Delete */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedStudentProfile(student)}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            title="View Full Profile & Performance"
                            id={`view-profile-btn-${student.id}`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          <button
                            onClick={() => setSelectedStudentForMarks(student)}
                            className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            title="Enter / Edit Marks"
                            id={`enter-marks-btn-${student.id}`}
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Marks</span>
                          </button>

                          <button
                            onClick={() => setStudentFormModal({ isOpen: true, studentToEdit: student })}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Student Information"
                            id={`edit-student-btn-${student.id}`}
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>

                          {/* Delete Student Action */}
                          <button
                            onClick={() => handleOpenRowDelete(student)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Student"
                            id={`delete-student-btn-${student.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={viewMode === 'academic' ? 10 : 5} className="px-6 py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">No students match your filter criteria.</p>
                    <button
                      onClick={resetFilters}
                      className="mt-2 text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
                    >
                      Clear all search & filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {sortedSummaries.length > 0 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-semibold text-slate-700">
                {Math.min(currentPage * itemsPerPage, sortedSummaries.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-700">{sortedSummaries.length}</span> students
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                id="pagination-prev-btn"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-semibold text-slate-700">
                Page {currentPage} of {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                id="pagination-next-btn"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Unified Student Deletion Workflow Modal */}
      <StudentDeleteWorkflowModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setTargetStudentForDelete(null);
        }}
        targetStudent={targetStudentForDelete}
        students={students}
        currentDepartmentFilter={deptFilter}
        currentYearFilter={yearFilter}
        currentSearchQuery={search}
        onDeleteSingle={handleDeleteSingle}
        onDeleteMultiple={handleDeleteBatch}
        onDeleteAll={handleDeleteAll}
      />
    </div>
  );
};
