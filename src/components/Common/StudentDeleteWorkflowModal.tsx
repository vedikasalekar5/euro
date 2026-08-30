import React, { useState, useMemo, useEffect } from 'react';
import {
  Trash2,
  UserX,
  Users,
  AlertTriangle,
  AlertCircle,
  Search,
  CheckSquare,
  Square,
  X,
  ArrowLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Student } from '../../types';
import { getEnrollmentNumber, getStudentName } from '../../utils/studentSorting';

export type DeleteWorkflowStep =
  | 'menu'
  | 'single_select'
  | 'single_confirm'
  | 'multiple_select'
  | 'multiple_confirm'
  | 'all_confirm';

interface StudentDeleteWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetStudent?: Student | null;
  students: Student[];
  currentDepartmentFilter?: string;
  currentYearFilter?: string;
  currentSearchQuery?: string;
  onDeleteSingle: (studentId: string) => Promise<boolean | void> | boolean | void;
  onDeleteMultiple: (studentIds: string[]) => Promise<boolean | void> | boolean | void;
  onDeleteAll: () => Promise<boolean | void> | boolean | void;
}

export const StudentDeleteWorkflowModal: React.FC<StudentDeleteWorkflowModalProps> = ({
  isOpen,
  onClose,
  targetStudent = null,
  students,
  currentDepartmentFilter = 'All',
  currentYearFilter = 'All',
  currentSearchQuery = '',
  onDeleteSingle,
  onDeleteMultiple,
  onDeleteAll,
}) => {
  const [step, setStep] = useState<DeleteWorkflowStep>('menu');
  const [selectedSingleStudent, setSelectedSingleStudent] = useState<Student | null>(null);
  const [selectedMultipleIds, setSelectedMultipleIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [yearFilter, setYearFilter] = useState<string>('All');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [confirmAllChecked, setConfirmAllChecked] = useState<boolean>(false);

  // Initialize or reset state when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setStep('menu');
      setSelectedSingleStudent(targetStudent || null);
      setSelectedMultipleIds([]);
      setSearchQuery(currentSearchQuery || '');
      setDeptFilter(currentDepartmentFilter || 'All');
      setYearFilter(currentYearFilter || 'All');
      setIsDeleting(false);
      setConfirmAllChecked(false);
    }
  }, [isOpen, targetStudent, currentDepartmentFilter, currentYearFilter, currentSearchQuery]);

  // Extract unique departments & years for multiple selection filtering
  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      const dept = s.department || (s as any).programming_name;
      if (dept) set.add(dept);
    });
    return Array.from(set);
  }, [students]);

  const uniqueYears = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.year) set.add(s.year);
    });
    return Array.from(set);
  }, [students]);

  // Filtered students for multiple selection (respects current search and department/year filters)
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return students.filter((s) => {
      const sName = getStudentName(s).toLowerCase();
      const sEnrollment = getEnrollmentNumber(s).toLowerCase();
      const sDept = (s.department || (s as any).programming_name || '').toLowerCase();
      const matchSearch = !q || sName.includes(q) || sEnrollment.includes(q) || sDept.includes(q);
      const matchDept = deptFilter === 'All' || s.department === deptFilter || (s as any).programming_name === deptFilter;
      const matchYear = yearFilter === 'All' || s.year === yearFilter;
      return matchSearch && matchDept && matchYear;
    });
  }, [students, searchQuery, deptFilter, yearFilter]);

  // Checkbox select-all logic for filtered list
  const isAllFilteredSelected = useMemo(() => {
    if (filteredStudents.length === 0) return false;
    return filteredStudents.every((s) => selectedMultipleIds.includes(s.id));
  }, [filteredStudents, selectedMultipleIds]);

  const isSomeFilteredSelected = useMemo(() => {
    return (
      filteredStudents.some((s) => selectedMultipleIds.includes(s.id)) &&
      !isAllFilteredSelected
    );
  }, [filteredStudents, selectedMultipleIds, isAllFilteredSelected]);

  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      const filteredIdSet = new Set(filteredStudents.map((s) => s.id));
      setSelectedMultipleIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    } else {
      const filteredIdList = filteredStudents.map((s) => s.id);
      setSelectedMultipleIds((prev) => Array.from(new Set([...prev, ...filteredIdList])));
    }
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedMultipleIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Selected students array for multiple deletion confirmation list
  const selectedStudentsList = useMemo(() => {
    const idSet = new Set(selectedMultipleIds);
    return students.filter((s) => idSet.has(s.id));
  }, [students, selectedMultipleIds]);

  // Handlers for menu options
  const handleSelectDeleteOption = (option: 'single' | 'multiple' | 'all') => {
    if (option === 'single') {
      if (selectedSingleStudent) {
        setStep('single_confirm');
      } else {
        setStep('single_select');
      }
    } else if (option === 'multiple') {
      setStep('multiple_select');
    } else if (option === 'all') {
      setStep('all_confirm');
    }
  };

  // Delete Action Executions
  const handleConfirmSingleDelete = async () => {
    if (!selectedSingleStudent) return;
    setIsDeleting(true);
    try {
      const res = await onDeleteSingle(selectedSingleStudent.id);
      if (res !== false) {
        onClose();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmMultipleDelete = async () => {
    if (selectedMultipleIds.length === 0) return;
    setIsDeleting(true);
    try {
      const res = await onDeleteMultiple(selectedMultipleIds);
      if (res !== false) {
        onClose();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmAllDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await onDeleteAll();
      if (res !== false) {
        onClose();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-[#071426]/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-100"
      id="student-delete-workflow-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-[#D7E3EA] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        id="student-delete-workflow-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-[#0B1F3A] text-white flex items-center justify-between border-b border-[#00D9FF]/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#DC2626]/20 text-[#DC2626] rounded-xl border border-[#DC2626]/30">
              <Trash2 className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-white">
                {step === 'menu' && 'Delete Options'}
                {step === 'single_select' && 'Select Student to Delete'}
                {step === 'single_confirm' && 'Delete Student?'}
                {step === 'multiple_select' && 'Delete Multiple Students'}
                {step === 'multiple_confirm' && 'Confirm Multiple Deletion'}
                {step === 'all_confirm' && 'Delete All Students'}
              </h3>
              <p className="text-[11px] text-[#E6FCFF]/70">
                {step === 'menu' && 'Choose a deletion method for student records'}
                {step === 'single_select' && 'Pick the student you wish to permanently remove'}
                {step === 'single_confirm' && 'Review student details before permanent removal'}
                {step === 'multiple_select' && 'Select one or more students using checkboxes'}
                {step === 'multiple_confirm' && 'Review selected students before permanent removal'}
                {step === 'all_confirm' && 'Permanently delete all students and evaluation marks'}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
            id="close-student-delete-workflow-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: DELETE OPTIONS MENU */}
        {step === 'menu' && (
          <div className="p-6 space-y-4" id="delete-options-menu-step">
            <p className="text-xs text-[#64748B] leading-relaxed">
              Select an action to manage student deletions in the EURO marks management system. All deletions permanently remove the student profile and their Unit 1 and Unit 2 marks.
            </p>

            <div className="space-y-2.5">
              {/* Option 1: Manual Delete */}
              <button
                type="button"
                onClick={() => handleSelectDeleteOption('single')}
                className="w-full p-4 rounded-2xl border border-[#D7E3EA] hover:border-[#00D9FF] bg-white hover:bg-[#F5F9FC] text-left flex items-center justify-between group transition-all cursor-pointer shadow-xs"
                id="option-manual-delete-student-btn"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#0B1F3A]/5 text-[#0B1F3A] group-hover:bg-[#0B1F3A] group-hover:text-[#00D9FF] flex items-center justify-center transition-colors shrink-0">
                    <UserX className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#0B1F3A] flex items-center gap-2">
                      <span>🗑 Manual Delete</span>
                      {selectedSingleStudent && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E6FCFF] text-[#0094B3] font-semibold">
                          {getStudentName(selectedSingleStudent)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      {selectedSingleStudent
                        ? `Delete ${getStudentName(selectedSingleStudent)} and their test marks`
                        : 'Select and delete a single student record'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#64748B] group-hover:text-[#0B1F3A] group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>

              {/* Option 2: Multiple Delete */}
              <button
                type="button"
                onClick={() => handleSelectDeleteOption('multiple')}
                className="w-full p-4 rounded-2xl border border-[#D7E3EA] hover:border-[#00D9FF] bg-white hover:bg-[#F5F9FC] text-left flex items-center justify-between group transition-all cursor-pointer shadow-xs"
                id="option-multiple-delete-students-btn"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#0B1F3A]/5 text-[#0B1F3A] group-hover:bg-[#0B1F3A] group-hover:text-[#00D9FF] flex items-center justify-center transition-colors shrink-0">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#0B1F3A]">
                      ☑ Multiple Delete
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Select multiple students using checkboxes with Select All
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#64748B] group-hover:text-[#0B1F3A] group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>

              {/* Option 3: Delete All */}
              <button
                type="button"
                onClick={() => handleSelectDeleteOption('all')}
                className="w-full p-4 rounded-2xl border border-[#FECACA] hover:border-[#DC2626] bg-[#FEF2F2]/50 hover:bg-[#FEF2F2] text-left flex items-center justify-between group transition-all cursor-pointer shadow-xs"
                id="option-delete-all-students-btn"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#DC2626]/10 text-[#DC2626] group-hover:bg-[#DC2626] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#DC2626]">
                      ⚠ Delete All ({students.length} Students)
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Permanently wipe all student records with strong confirmation
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#DC2626] group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            </div>

            <div className="pt-3 border-t border-[#D7E3EA] flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#64748B] hover:text-[#0B1F3A] hover:bg-[#F5F9FC] border border-[#D7E3EA] transition-all cursor-pointer"
                id="cancel-delete-menu-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* STEP: SINGLE STUDENT PICKER (When opened from header without row target) */}
        {step === 'single_select' && (
          <div className="p-5 sm:p-6 flex flex-col flex-1 min-h-0 space-y-4">
            <div className="relative shrink-0">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student by name or enrollment no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-[#F5F9FC] border border-[#D7E3EA] focus:outline-none focus:border-[#00D9FF] text-[#0B1F3A]"
                id="search-single-student-input"
              />
            </div>

            <div className="flex-1 overflow-y-auto border border-[#D7E3EA] rounded-2xl divide-y divide-[#D7E3EA] bg-white p-1 min-h-[220px] max-h-[340px]">
              {filteredStudents.length === 0 ? (
                <div className="py-12 text-center text-[#64748B]">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-semibold">No matching students found</p>
                </div>
              ) : (
                filteredStudents.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSelectedSingleStudent(s);
                      setStep('single_confirm');
                    }}
                    className="p-3 rounded-xl flex items-center justify-between gap-3 text-xs hover:bg-[#F5F9FC] transition-colors cursor-pointer my-0.5"
                  >
                    <div>
                      <div className="font-bold text-[#0B1F3A]">{getStudentName(s)}</div>
                      <div className="text-[11px] font-mono text-[#64748B]">
                        {getEnrollmentNumber(s)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 bg-[#F5F9FC] text-[#0B1F3A] text-[10px] font-semibold rounded-md border border-[#D7E3EA]">
                        {s.department}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#64748B]" />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#D7E3EA]">
              <button
                type="button"
                onClick={() => setStep('menu')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:text-[#0B1F3A] hover:bg-[#F5F9FC] border border-[#D7E3EA] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:text-[#0B1F3A] hover:bg-[#F5F9FC] border border-[#D7E3EA] transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* STEP: SINGLE STUDENT CONFIRMATION */}
        {step === 'single_confirm' && selectedSingleStudent && (
          <div className="p-5 sm:p-6 space-y-4 animate-in fade-in duration-100" id="single-student-confirm-step">
            <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl text-xs text-[#DC2626] flex items-start gap-3">
              <div className="p-2 bg-white rounded-xl text-[#DC2626] shadow-xs shrink-0">
                <AlertCircle className="w-5 h-5 text-[#DC2626]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-[#0B1F3A]">
                  You are about to delete {getStudentName(selectedSingleStudent)}.
                </h4>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  This action cannot be undone. The student profile and all associated Unit 1 and Unit 2 marks will be permanently removed from the database.
                </p>
              </div>
            </div>

            {/* Student Details Card */}
            <div className="p-4 bg-[#F5F9FC] rounded-2xl border border-[#D7E3EA] text-xs space-y-1.5">
              <div className="font-bold text-[#0B1F3A] text-sm">
                {getStudentName(selectedSingleStudent)}
              </div>
              <div className="text-[#64748B] font-mono">
                Enrollment Number: <strong className="text-[#0B1F3A]">{getEnrollmentNumber(selectedSingleStudent)}</strong>
              </div>
              <div className="text-[#64748B]">
                Department: <strong className="text-[#0B1F3A]">{selectedSingleStudent.department}</strong> • Year: <strong className="text-[#0B1F3A]">{selectedSingleStudent.year}</strong>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#D7E3EA]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setStep('menu')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:text-[#0B1F3A] hover:bg-[#F5F9FC] border border-[#D7E3EA] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                id="back-from-single-confirm-btn"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:text-[#0B1F3A] hover:bg-[#F5F9FC] border border-[#D7E3EA] transition-all cursor-pointer disabled:opacity-50"
                  id="cancel-single-delete-btn"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmSingleDelete}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#DC2626] hover:bg-[#B91C1C] active:scale-95 transition-all shadow-md shadow-rose-600/20 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  id="confirm-delete-single-student-btn"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Deleting Student...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Student</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP: MULTIPLE SELECTION VIEW */}
        {step === 'multiple_select' && (
          <div className="p-5 sm:p-6 flex flex-col flex-1 min-h-0 space-y-4" id="multiple-delete-selection-step">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search students by name or enrollment number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-[#F5F9FC] border border-[#D7E3EA] focus:outline-none focus:border-[#00D9FF] text-[#0B1F3A]"
                  id="multiple-delete-search-input"
                />
              </div>

              {uniqueDepartments.length > 1 && (
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl bg-[#F5F9FC] border border-[#D7E3EA] focus:outline-none focus:border-[#00D9FF] text-[#0B1F3A] font-medium cursor-pointer"
                  id="multiple-delete-dept-filter"
                >
                  <option value="All">All Departments</option>
                  {uniqueDepartments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              )}

              {uniqueYears.length > 1 && (
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl bg-[#F5F9FC] border border-[#D7E3EA] focus:outline-none focus:border-[#00D9FF] text-[#0B1F3A] font-medium cursor-pointer"
                  id="multiple-delete-year-filter"
                >
                  <option value="All">All Years</option>
                  {uniqueYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Select All Toggle Bar */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#F5F9FC] rounded-xl border border-[#D7E3EA] text-xs shrink-0">
              <label
                className="flex items-center gap-2.5 font-bold text-[#0B1F3A] cursor-pointer select-none"
                id="select-all-multiple-students-label"
              >
                <input
                  type="checkbox"
                  checked={isAllFilteredSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isSomeFilteredSelected;
                  }}
                  onChange={toggleSelectAllFiltered}
                  className="w-4 h-4 rounded border-gray-300 text-[#00D9FF] focus:ring-[#00D9FF] cursor-pointer accent-[#00D9FF]"
                  id="select-all-multiple-students-checkbox"
                />
                <span>Select All ({filteredStudents.length})</span>
              </label>

              <span className="text-[11px] font-semibold text-[#64748B]">
                Selected:{' '}
                <strong className="text-[#0B1F3A] font-mono font-bold">
                  {selectedMultipleIds.length}
                </strong>{' '}
                {selectedMultipleIds.length === 1 ? 'Student' : 'Students'}
              </span>
            </div>

            {/* Scrollable Students List */}
            <div
              className="flex-1 overflow-y-auto border border-[#D7E3EA] rounded-2xl divide-y divide-[#D7E3EA] bg-white p-1 min-h-[220px] max-h-[340px]"
              id="multiple-delete-students-list"
            >
              {filteredStudents.length === 0 ? (
                <div className="py-12 text-center text-[#64748B]">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#64748B]" />
                  <p className="text-xs font-semibold">No students found</p>
                  <p className="text-[11px] opacity-75 mt-0.5">Try adjusting your search query or filters</p>
                </div>
              ) : (
                filteredStudents.map((s) => {
                  const isChecked = selectedMultipleIds.includes(s.id);
                  const sName = getStudentName(s);
                  const sEnrollment = getEnrollmentNumber(s);
                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleSelectStudent(s.id)}
                      className={`p-3 rounded-xl flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer my-0.5 first:mt-0 last:mb-0 select-none ${
                        isChecked
                          ? 'bg-[#E6FCFF]/70 hover:bg-[#E6FCFF] border border-[#00D9FF]/40'
                          : 'hover:bg-[#F5F9FC] border border-transparent'
                      }`}
                      id={`multiple-select-row-${s.id}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectStudent(s.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-gray-300 text-[#00D9FF] focus:ring-[#00D9FF] cursor-pointer accent-[#00D9FF] shrink-0"
                          id={`multiple-item-checkbox-${s.id}`}
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-[#0B1F3A] truncate">
                            {sName}
                          </div>
                          {sEnrollment && (
                            <div className="text-[11px] font-mono text-[#64748B] truncate">
                              {sEnrollment}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {s.department && (
                          <span className="px-2 py-0.5 bg-[#F5F9FC] text-[#0B1F3A] text-[10px] font-semibold rounded-md border border-[#D7E3EA]">
                            {s.department}
                          </span>
                        )}
                        {s.year && (
                          <span className="px-2 py-0.5 bg-[#E6FCFF] text-[#0094B3] text-[10px] font-semibold rounded-md border border-[#67E8F9]/40">
                            {s.year}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[#D7E3EA] shrink-0">
              <button
                type="button"
                onClick={() => setStep('menu')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:text-[#0B1F3A] hover:bg-[#F5F9FC] border border-[#D7E3EA] transition-all cursor-pointer flex items-center gap-1.5"
                id="back-from-multiple-select-btn"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:text-[#0B1F3A] hover:bg-[#F5F9FC] border border-[#D7E3EA] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedMultipleIds.length === 0}
                  onClick={() => setStep('multiple_confirm')}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#DC2626] hover:bg-[#B91C1C] active:scale-95 transition-all shadow-md shadow-rose-600/20 cursor-pointer flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#DC2626] disabled:active:scale-100"
                  id="proceed-delete-selected-btn"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    {selectedMultipleIds.length === 0
                      ? 'Delete Selected'
                      : `Delete Selected (${selectedMultipleIds.length})`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP: MULTIPLE SELECTION CONFIRMATION */}
        {step === 'multiple_confirm' && (
          <div className="p-5 sm:p-6 flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-100" id="multiple-delete-confirm-step">
            <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl text-xs text-[#DC2626] flex items-start gap-3">
              <div className="p-2 bg-white rounded-xl text-[#DC2626] shadow-xs shrink-0">
                <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-[#0B1F3A]">
                  You are about to delete {selectedMultipleIds.length}{' '}
                  {selectedMultipleIds.length === 1 ? 'student' : 'students'}.
                </h4>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  This action cannot be undone. All associated Unit 1 and Unit 2 marks and continuous evaluation performance records will be permanently removed.
                </p>
              </div>
            </div>

            {/* List of items being deleted */}
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-[#172B4D]">
                Records to be deleted ({selectedStudentsList.length}):
              </div>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-[#D7E3EA] bg-[#F5F9FC] divide-y divide-[#D7E3EA] p-1 shadow-inner">
                {selectedStudentsList.map((s, idx) => (
                  <div
                    key={s.id}
                    className="p-2 flex items-center justify-between text-xs bg-white rounded-lg my-0.5 first:mt-0 last:mb-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-4 h-4 rounded bg-[#F5F9FC] text-[#64748B] font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-[#D7E3EA]">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-[#0B1F3A] truncate">
                        {getStudentName(s)}
                      </span>
                      {getEnrollmentNumber(s) && (
                        <span className="text-[10px] font-mono text-[#64748B] truncate">
                          ({getEnrollmentNumber(s)})
                        </span>
                      )}
                    </div>
                    {s.department && (
                      <span className="text-[10px] font-medium text-[#64748B] shrink-0">
                        {s.department}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Confirmation Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#D7E3EA]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setStep('multiple_select')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:text-[#0B1F3A] hover:bg-[#F5F9FC] border border-[#D7E3EA] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                id="back-to-multiple-selection-btn"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Selection</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:text-[#0B1F3A] hover:bg-[#F5F9FC] border border-[#D7E3EA] transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmMultipleDelete}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#DC2626] hover:bg-[#B91C1C] active:scale-95 transition-all shadow-md shadow-rose-600/20 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  id="confirm-final-multiple-delete-btn"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Deleting {selectedMultipleIds.length}...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>
                        Delete {selectedMultipleIds.length}{' '}
                        {selectedMultipleIds.length === 1 ? 'Student' : 'Students'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP: DELETE ALL STUDENTS SAFETY WARNING */}
        {step === 'all_confirm' && (
          <div className="p-5 sm:p-6 space-y-4 animate-in fade-in duration-100" id="delete-all-students-confirm-step">
            <div className="p-4.5 bg-[#FEF2F2] border-2 border-[#FECACA] rounded-2xl text-xs text-[#DC2626] space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white text-[#DC2626] rounded-xl shadow-xs shrink-0 border border-[#FECACA]">
                  <ShieldAlert className="w-6 h-6 text-[#DC2626]" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-[#7F1D1D] tracking-tight">
                    ⚠ Warning: Delete ALL Students
                  </h4>
                  <p className="text-[11px] text-[#991B1B] font-medium">
                    Critical system-wide action requiring explicit confirmation
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-[#7F1D1D] bg-white/60 p-3.5 rounded-xl border border-[#FECACA]/60 leading-relaxed">
                <p className="font-semibold">
                  You are about to delete <strong>ALL {students.length} students</strong> from the system.
                </p>
                <p>
                  This action will permanently remove all student roster profiles and their related academic data (Unit Test 1 marks, Unit Test 2 marks, and performance logs).
                </p>
                <p className="text-[11px] text-[#059669] font-medium">
                  ✓ Subjects, faculty credentials, and system settings will NOT be deleted.
                </p>
              </div>
            </div>

            {/* Total Count Display Card */}
            <div className="p-4 bg-[#F5F9FC] rounded-2xl border border-[#D7E3EA] flex items-center justify-between text-xs">
              <span className="font-bold text-[#0B1F3A]">Total Student Records:</span>
              <span className="font-mono font-black text-sm px-3 py-1 bg-white rounded-xl border border-[#D7E3EA] text-[#DC2626]">
                {students.length} Students
              </span>
            </div>

            {/* Safety Confirmation Checkbox */}
            <label className="flex items-start gap-3 p-3 bg-white rounded-xl border border-[#D7E3EA] text-xs cursor-pointer select-none hover:bg-[#F5F9FC] transition-colors">
              <input
                type="checkbox"
                checked={confirmAllChecked}
                onChange={(e) => setConfirmAllChecked(e.target.value ? e.target.checked : false)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#DC2626] focus:ring-[#DC2626] cursor-pointer accent-[#DC2626]"
                id="confirm-delete-all-checkbox"
              />
              <span className="font-semibold text-[#0B1F3A]">
                I understand that all {students.length} student records and their Unit 1 & Unit 2 evaluation marks will be permanently and irreversibly removed.
              </span>
            </label>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#D7E3EA]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setStep('menu')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:text-[#0B1F3A] hover:bg-[#F5F9FC] border border-[#D7E3EA] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                id="back-from-all-confirm-btn"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:text-[#0B1F3A] hover:bg-[#F5F9FC] border border-[#D7E3EA] transition-all cursor-pointer disabled:opacity-50"
                  id="cancel-delete-all-btn"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!confirmAllChecked || isDeleting || students.length === 0}
                  onClick={handleConfirmAllDelete}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#DC2626] hover:bg-[#B91C1C] active:scale-95 transition-all shadow-md shadow-rose-600/20 cursor-pointer flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#DC2626]"
                  id="confirm-final-delete-all-btn"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Deleting All Students...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Delete All {students.length} Students</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
