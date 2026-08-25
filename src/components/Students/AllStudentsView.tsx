import React, { useState } from 'react';
import { useAcademic } from '../../context/AcademicContext';
import {
  Users,
  Search,
  Filter,
  Eye,
  Award,
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  Hash,
  Download,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import { Department, AcademicYear } from '../../types';
import { getPerformanceBadgeClasses } from '../../utils/calculations';
import { exportAllStudentsToExcel } from '../../utils/excelExport';
import { sortSummariesByEnrollment } from '../../utils/studentSorting';

export const AllStudentsView: React.FC = () => {
  const {
    students,
    allSummaries,
    setSelectedStudentProfile,
  } = useAcademic();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');

  // Filter summaries based on user controls and sort by Enrollment Number
  const filteredSummaries = React.useMemo(() => {
    const list = allSummaries.filter((summary) => {
      const student = summary.student;
      const q = searchQuery.toLowerCase().trim();
      const studentName = (student.student_name || student.name || '').toLowerCase();
      const enrollment = (
        student.enrollment_number ||
        student.enrollmentNo ||
        student.rollNumber ||
        student.prn ||
        ''
      ).toLowerCase();

      const matchesSearch = !q || studentName.includes(q) || enrollment.includes(q);
      const matchesDept = selectedDept === 'All' || student.department === selectedDept;
      const matchesYear = selectedYear === 'All' || student.year === selectedYear;

      return matchesSearch && matchesDept && matchesYear;
    });

    return sortSummariesByEnrollment(list);
  }, [allSummaries, searchQuery, selectedDept, selectedYear]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150" id="all-students-view-section">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DCE7F5] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#EAF3FF] text-[#2563EB] rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#172033] tracking-tight">
              All Students Directory
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Comprehensive student roster with automated subject-wise Unit 1, Unit 2, and average scores
            </p>
          </div>
        </div>

        {/* Export Excel Button */}
        <button
          onClick={() => exportAllStudentsToExcel(filteredSummaries, 'All_Students.xlsx')}
          className="px-4 py-2.5 bg-[#EAF3FF] hover:bg-[#DCE7F5] text-[#2563EB] text-xs font-bold rounded-xl border border-[#DCE7F5] transition-colors flex items-center gap-2 cursor-pointer active:scale-95 shadow-xs"
          id="export-all-students-excel-btn"
        >
          <Download className="w-4 h-4" />
          <span>Export Excel</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#DCE7F5] shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name or enrollment no (e.g. EN2026001)..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#F7FAFF] text-xs font-medium text-[#172033] border border-[#DCE7F5] rounded-xl focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-[#EAF3FF] outline-none transition-all placeholder:text-[#94A3B8]"
              id="search-all-students-input"
            />
          </div>

          {/* Department Filter */}
          <div className="w-full lg:w-56">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#F7FAFF] text-xs font-medium text-[#172033] border border-[#DCE7F5] rounded-xl focus:border-[#2563EB] focus:bg-white outline-none cursor-pointer"
              id="filter-all-students-dept"
            >
              <option value="All">All Departments</option>
              <option value="Computer Engineering">Computer Engineering</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
            </select>
          </div>

          {/* Year Filter */}
          <div className="w-full lg:w-48">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#F7FAFF] text-xs font-medium text-[#172033] border border-[#DCE7F5] rounded-xl focus:border-[#2563EB] focus:bg-white outline-none cursor-pointer"
              id="filter-all-students-year"
            >
              <option value="All">All Years</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="2nd Year DSY">2nd Year DSY</option>
            </select>
          </div>
        </div>

        {/* Active Filter Indicators */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#64748B]">
          <span className="font-semibold text-[#172033]">Applied Filters:</span>
          <span className="px-2 py-0.5 bg-[#F7FAFF] rounded-md text-[#123B78] font-medium border border-[#DCE7F5]">
            Dept: {selectedDept}
          </span>
          <span className="px-2 py-0.5 bg-[#F7FAFF] rounded-md text-[#123B78] font-medium border border-[#DCE7F5]">
            Year: {selectedYear}
          </span>
          {(selectedDept !== 'All' || selectedYear !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedDept('All');
                setSelectedYear('All');
                setSearchQuery('');
              }}
              className="text-[#2563EB] hover:text-[#123B78] font-semibold underline cursor-pointer ml-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Students View Table */}
      <div className="bg-white rounded-3xl border border-[#DCE7F5] shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-[#DCE7F5] flex items-center justify-between bg-[#F7FAFF]">
          <h3 className="text-sm font-bold text-[#123B78]">
            Student Academic Ledger ({filteredSummaries.length})
          </h3>
          <span className="text-xs text-[#64748B]">
            Click any student row to view full subject-wise performance breakdown
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-[#DCE7F5]">
            <thead className="bg-[#F1F7FF] font-bold text-[#123B78] text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5 w-14 text-center">Sr. No.</th>
                <th className="px-4 py-3.5">Enrollment No.</th>
                <th className="px-6 py-3.5">Student Details</th>
                <th className="px-4 py-3.5">Department & Year</th>
                <th className="px-4 py-3.5 text-center">Unit 1 Avg</th>
                <th className="px-4 py-3.5 text-center">Unit 2 Avg</th>
                <th className="px-4 py-3.5 text-center bg-[#EAF3FF]/50 font-bold text-[#123B78]">
                  Overall Avg ((U1+U2)/2)
                </th>
                <th className="px-4 py-3.5 text-center">Rating</th>
                <th className="px-4 py-3.5 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE7F5] bg-white">
              {filteredSummaries.length > 0 ? (
                filteredSummaries.map((summary, idx) => {
                  const student = summary.student;
                  const studentName = student.student_name || student.name || 'Student';
                  const enrollment =
                    student.enrollment_number ||
                    student.enrollmentNo ||
                    student.rollNumber ||
                    student.prn ||
                    'N/A';
                  const badge = getPerformanceBadgeClasses(summary.overallRating);

                  return (
                    <tr
                      key={student.id}
                      onClick={() => setSelectedStudentProfile(student)}
                      className="hover:bg-[#F7FAFF] transition-colors cursor-pointer group"
                      id={`all-student-row-${student.id}`}
                    >
                      {/* Sr. No. */}
                      <td className="px-4 py-4 text-center font-mono font-medium text-[#64748B]">
                        {idx + 1}
                      </td>

                      {/* Enrollment */}
                      <td className="px-4 py-4">
                        <span className="font-mono font-bold text-[#2563EB] bg-[#EAF3FF] px-2.5 py-1 rounded-md border border-[#DCE7F5]">
                          {enrollment}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#EAF3FF] text-[#2563EB] font-black flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                            {studentName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-[#172033] text-sm group-hover:text-[#2563EB] transition-colors block">
                              {studentName}
                            </span>
                            <span className="text-[10px] text-[#64748B] font-mono">
                              {summary.subjectsCount} Subjects Enrolled
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Department & Year */}
                      <td className="px-4 py-4">
                        <div className="font-medium text-[#172033]">{student.department}</div>
                        <div className="text-[11px] text-[#64748B]">{student.year}</div>
                      </td>

                      {/* Unit 1 Avg */}
                      <td className="px-4 py-4 text-center">
                        <span className="font-semibold text-[#172033]">
                          {summary.overallUnit1Marks} / {summary.overallUnit1Max}
                        </span>
                        <span className="block text-[10px] text-[#2563EB] font-medium">
                          {summary.overallUnit1Percentage}%
                        </span>
                      </td>

                      {/* Unit 2 Avg */}
                      <td className="px-4 py-4 text-center">
                        <span className="font-semibold text-[#172033]">
                          {summary.overallUnit2Marks} / {summary.overallUnit2Max}
                        </span>
                        <span className="block text-[10px] text-[#3B82F6] font-medium">
                          {summary.overallUnit2Percentage}%
                        </span>
                      </td>

                      {/* Overall Average */}
                      <td className="px-4 py-4 text-center bg-[#F7FAFF]">
                        <div className="font-black text-[#172033] text-sm font-mono">
                          {summary.overallAverageMarks} / {summary.overallAverageMax}
                        </div>
                        <div className="text-[11px] font-bold text-[#2563EB]">
                          {summary.overallAveragePercentage}%
                        </div>
                      </td>

                      {/* Performance Rating */}
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}
                        >
                          {summary.overallRating}
                        </span>
                      </td>

                      {/* View Action */}
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudentProfile(student);
                          }}
                          className="px-3 py-1.5 bg-[#EAF3FF] hover:bg-[#DCE7F5] text-[#2563EB] text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1 cursor-pointer"
                          id={`view-profile-btn-${student.id}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-[#64748B]">
                    <Users className="w-10 h-10 mx-auto mb-2 text-[#94A3B8]" />
                    <p className="font-semibold text-sm text-[#172033]">No students match the current filters</p>
                    <p className="text-xs text-[#64748B] mt-1">Try relaxing your department or year filters.</p>
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
