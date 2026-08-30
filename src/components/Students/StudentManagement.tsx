import React, { useState, useMemo } from 'react';
import { useAcademic } from '../../context/AcademicContext';
import {
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Users,
  Building2,
  Calendar,
  Hash,
  AlertCircle,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  Eye,
} from 'lucide-react';
import { Department, AcademicYear, Student } from '../../types';
import { getStudentName, getEnrollmentNumber } from '../../utils/studentSorting';
import { StudentDeleteWorkflowModal } from '../Common/StudentDeleteWorkflowModal';

export const StudentManagement: React.FC = () => {
  const {
    students,
    deleteStudent,
    deleteStudentsBatch,
    deleteAllStudents,
    setStudentFormModal,
    setImportStudentsModal,
    setSelectedStudentProfile,
    showToast,
  } = useAcademic();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  
  // Unified Delete Options Workflow Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [targetStudentForDelete, setTargetStudentForDelete] = useState<Student | null>(null);

  // Filtered Students List for the normal clean table
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const q = searchQuery.toLowerCase().trim();
      const studentName = getStudentName(student).toLowerCase();
      const enrollment = getEnrollmentNumber(student).toLowerCase();
      const roll = (student.roll_number || student.rollNumber || '').toLowerCase();

      const matchesSearch = !q || studentName.includes(q) || enrollment.includes(q) || roll.includes(q);
      const matchesDept = selectedDept === 'All' || student.department === selectedDept;
      const matchesYear = selectedYear === 'All' || student.year === selectedYear;

      return matchesSearch && matchesDept && matchesYear;
    });
  }, [students, searchQuery, selectedDept, selectedYear]);

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

  return (
    <div className="space-y-6 animate-in fade-in duration-150" id="student-management-section">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#D7E3EA] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3.5 bg-[#0B1F3A] text-[#00D9FF] rounded-xl shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#172B4D] tracking-tight">
                Students Management
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Add, edit, delete, and manage student enrollment records
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setImportStudentsModal({ isOpen: true })}
            className="px-4 py-2.5 bg-[#F5F9FC] hover:bg-[#E2ECF4] text-[#172B4D] text-xs font-bold rounded-xl border border-[#D7E3EA] shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            id="btn-import-students-document"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#0094B3]" />
            <span>Import Students from Image / PDF</span>
          </button>

          <button
            onClick={() => setStudentFormModal({ isOpen: true, studentToEdit: null })}
            className="px-5 py-2.5 bg-[#0B1F3A] hover:bg-[#102A43] text-white text-xs font-bold rounded-xl shadow-md shadow-[#0B1F3A]/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95 border border-[#00D9FF]/30"
            id="btn-add-new-student"
          >
            <UserPlus className="w-4 h-4 text-[#00D9FF]" />
            <span>+ Add Student</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#D7E3EA] shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name or enrollment number (EN2026...)..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#F5F9FC] text-xs font-medium text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:border-[#00D9FF] focus:bg-white focus:ring-2 focus:ring-[#00D9FF]/20 outline-none transition-all placeholder:text-[#64748B]"
            id="search-students-management-input"
          />
        </div>

        {/* Department Filter */}
        <div className="w-full md:w-56">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#F5F9FC] text-xs font-medium text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:border-[#00D9FF] focus:bg-white outline-none cursor-pointer"
            id="filter-management-dept"
          >
            <option value="All">All Departments</option>
            <option value="Computer Engineering">Computer Engineering</option>
            <option value="Civil Engineering">Civil Engineering</option>
            <option value="Mechanical Engineering">Mechanical Engineering</option>
            <option value="Electrical Engineering">Electrical Engineering</option>
          </select>
        </div>

        {/* Year Filter */}
        <div className="w-full md:w-44">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#F5F9FC] text-xs font-medium text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:border-[#00D9FF] focus:bg-white outline-none cursor-pointer"
            id="filter-management-year"
          >
            <option value="All">All Years</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="2nd Year DSY">2nd Year DSY</option>
          </select>
        </div>
      </div>

      {/* Clean Students Management Table (No default checkboxes) */}
      <div className="bg-white rounded-2xl border border-[#D7E3EA] shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-[#D7E3EA] flex items-center justify-between bg-[#F5F9FC]">
          <h3 className="text-sm font-bold text-[#172B4D]">
            Student Records List ({filteredStudents.length})
          </h3>
          <span className="text-xs text-[#64748B]">
            Showing {filteredStudents.length} of {students.length} students
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-[#D7E3EA]">
            <thead className="bg-[#F5F9FC] font-bold text-[#0B1F3A] text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Student Name</th>
                <th className="px-5 py-3.5">Roll No.</th>
                <th className="px-5 py-3.5">Enrollment No.</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Year</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D7E3EA] bg-white">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const studentName = getStudentName(student);
                  const enrollment = getEnrollmentNumber(student);
                  const rollNo = student.roll_number || student.rollNumber || '—';

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-[#F5F9FC] transition-colors"
                      id={`student-row-${student.id}`}
                    >
                      {/* Student Name */}
                      <td className="px-5 py-4">
                        <div
                          className="flex items-center gap-3 cursor-pointer group"
                          onClick={() => setSelectedStudentProfile(student)}
                          title="Click to view full student performance profile"
                        >
                          <div className="w-8 h-8 rounded-xl bg-[#0B1F3A] group-hover:bg-[#102A43] text-[#00D9FF] font-black flex items-center justify-center text-xs shrink-0 transition-colors">
                            {studentName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-[#172B4D] group-hover:text-[#0094B3] text-sm block transition-colors">
                              {studentName}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Roll No. */}
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-[#64748B] bg-[#F5F9FC] px-2 py-1 rounded border border-[#D7E3EA]">
                          {rollNo}
                        </span>
                      </td>

                      {/* Enrollment No. */}
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-[#0B1F3A] bg-[#F5F9FC] px-2.5 py-1 rounded-md border border-[#D7E3EA]">
                          {enrollment}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="px-5 py-4 font-medium text-[#172B4D]">
                        {student.department}
                      </td>

                      {/* Year */}
                      <td className="px-5 py-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0B1F3A]/5 text-[#0B1F3A] border border-[#D7E3EA]">
                          {student.year}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Profile */}
                          <button
                            onClick={() => setSelectedStudentProfile(student)}
                            className="p-2 text-[#64748B] hover:text-[#0094B3] hover:bg-[#F5F9FC] rounded-xl transition-colors cursor-pointer"
                            title="View Student Profile"
                            id={`view-profile-btn-${student.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() =>
                              setStudentFormModal({ isOpen: true, studentToEdit: student })
                            }
                            className="p-2 text-[#64748B] hover:text-[#0094B3] hover:bg-[#F5F9FC] rounded-xl transition-colors cursor-pointer"
                            title="Edit Student"
                            id={`edit-student-btn-${student.id}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete Action Button */}
                          <button
                            onClick={() => handleOpenRowDelete(student)}
                            className="p-2 text-[#64748B] hover:text-[#EF4444] hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
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
                  <td colSpan={6} className="px-6 py-12 text-center text-[#64748B]">
                    <Users className="w-10 h-10 mx-auto mb-2 text-[#64748B]" />
                    <p className="font-semibold text-sm text-[#172B4D]">No students found matching your criteria</p>
                    <p className="text-xs text-[#64748B] mt-1 mb-4">
                      Add students manually or automatically import them from an image or PDF document.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setImportStudentsModal({ isOpen: true })}
                        className="px-4 py-2 bg-[#F5F9FC] hover:bg-[#E2ECF4] text-[#172B4D] text-xs font-bold rounded-xl border border-[#D7E3EA] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-[#0094B3]" />
                        <span>Import from Image/PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudentFormModal({ isOpen: true, studentToEdit: null })}
                        className="px-4 py-2 bg-[#0B1F3A] hover:bg-[#102A43] text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer border border-[#00D9FF]/30"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-[#00D9FF]" />
                        <span>Add Student</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
        currentDepartmentFilter={selectedDept}
        currentYearFilter={selectedYear}
        currentSearchQuery={searchQuery}
        onDeleteSingle={handleDeleteSingle}
        onDeleteMultiple={handleDeleteBatch}
        onDeleteAll={handleDeleteAll}
      />
    </div>
  );
};

