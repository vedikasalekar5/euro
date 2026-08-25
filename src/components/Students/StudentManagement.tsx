import React, { useState } from 'react';
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
} from 'lucide-react';
import { Department, AcademicYear, Student } from '../../types';

export const StudentManagement: React.FC = () => {
  const {
    students,
    deleteStudent,
    setStudentFormModal,
    setImportStudentsModal,
    showToast,
  } = useAcademic();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Filtered Students List
  const filteredStudents = students.filter((student) => {
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

  const handleDeleteConfirm = () => {
    if (!studentToDelete) return;
    const res = deleteStudent(studentToDelete.id);
    if (!res.success) {
      showToast(res.message, 'error');
    }
    setStudentToDelete(null);
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

        {/* Action Buttons: Add Student & Import from Image/PDF */}
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

      {/* Students Management Table */}
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
                <th className="px-6 py-3.5">Student Name</th>
                <th className="px-6 py-3.5">Enrollment No.</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Year</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D7E3EA] bg-white">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const studentName = student.student_name || student.name || 'Student';
                  const enrollment =
                    student.enrollment_number ||
                    student.enrollmentNo ||
                    student.rollNumber ||
                    student.prn ||
                    'N/A';

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-[#F5F9FC] transition-colors"
                      id={`student-row-${student.id}`}
                    >
                      {/* Student Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#0B1F3A] text-[#00D9FF] font-black flex items-center justify-center text-xs shrink-0">
                            {studentName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-[#172B4D] text-sm block">
                              {studentName}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Enrollment No. */}
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-[#0B1F3A] bg-[#F5F9FC] px-2.5 py-1 rounded-md border border-[#D7E3EA]">
                          {enrollment}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="px-6 py-4 font-medium text-[#172B4D]">
                        {student.department}
                      </td>

                      {/* Year */}
                      <td className="px-6 py-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0B1F3A]/5 text-[#0B1F3A] border border-[#D7E3EA]">
                          {student.year}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
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

                          {/* Delete */}
                          <button
                            onClick={() => setStudentToDelete(student)}
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
                  <td colSpan={5} className="px-6 py-12 text-center text-[#64748B]">
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

      {/* Delete Confirmation Modal */}
      {studentToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#071426]/70 backdrop-blur-xs animate-in fade-in duration-150"
          id="delete-student-confirmation-dialog"
        >
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-[#D7E3EA] space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-[#EF4444] flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-bold text-base text-[#172B4D]">Delete Student?</h3>
              <p className="text-xs text-[#64748B] mt-1">
                Are you sure you want to remove{' '}
                <span className="font-bold text-[#172B4D]">
                  {studentToDelete.student_name || studentToDelete.name}
                </span>{' '}
                (
                {studentToDelete.enrollment_number ||
                  studentToDelete.enrollmentNo ||
                  studentToDelete.rollNumber ||
                  studentToDelete.prn}
                )? This will also remove their associated mark records.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="flex-1 py-2.5 text-xs font-semibold text-[#64748B] hover:bg-[#F5F9FC] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-[#EF4444] hover:bg-rose-600 active:scale-95 rounded-xl shadow-md transition-colors cursor-pointer"
                id="confirm-delete-student-btn"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
