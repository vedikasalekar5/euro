import React, { useState, useMemo, useEffect } from 'react';
import {
  Trash2,
  BookX,
  BookOpen,
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
import { Subject, Department, AcademicYear } from '../../types';

export type CourseDeleteWorkflowStep =
  | 'menu'
  | 'single_select'
  | 'single_confirm'
  | 'multiple_select'
  | 'multiple_confirm'
  | 'all_confirm';

interface CourseDeleteWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCourse?: Subject | null;
  courses: Subject[];
  currentDepartmentFilter?: string;
  currentYearFilter?: string;
  currentSearchQuery?: string;
  onDeleteSingle: (courseId: string) => Promise<boolean | void> | boolean | void;
  onDeleteMultiple: (courseIds: string[]) => Promise<boolean | void> | boolean | void;
  onDeleteAll: () => Promise<boolean | void> | boolean | void;
}

export const CourseDeleteWorkflowModal: React.FC<CourseDeleteWorkflowModalProps> = ({
  isOpen,
  onClose,
  targetCourse = null,
  courses,
  currentDepartmentFilter = 'All',
  currentYearFilter = 'All',
  currentSearchQuery = '',
  onDeleteSingle,
  onDeleteMultiple,
  onDeleteAll,
}) => {
  const [step, setStep] = useState<CourseDeleteWorkflowStep>('menu');
  const [selectedSingleCourse, setSelectedSingleCourse] = useState<Subject | null>(null);
  const [selectedMultipleIds, setSelectedMultipleIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [yearFilter, setYearFilter] = useState<string>('All');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [confirmAllChecked, setConfirmAllChecked] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setStep('menu');
      setSelectedSingleCourse(targetCourse || null);
      setSelectedMultipleIds(targetCourse ? [targetCourse.id] : []);
      setSearchQuery(currentSearchQuery || '');
      setDeptFilter(currentDepartmentFilter || 'All');
      setYearFilter(currentYearFilter || 'All');
      setIsDeleting(false);
      setConfirmAllChecked(false);
    }
  }, [isOpen, targetCourse, currentDepartmentFilter, currentYearFilter, currentSearchQuery]);

  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => {
      const dept = c.department || (c as any).programming_name;
      if (dept) set.add(dept);
    });
    return Array.from(set);
  }, [courses]);

  const uniqueYears = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => {
      if (c.year) set.add(c.year);
    });
    return Array.from(set);
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return courses.filter((c) => {
      const title = (c.course_title || c.courseTitle || c.subject_name || '').toLowerCase();
      const code = (c.course_code || c.courseCode || c.subjectCode || '').toLowerCase();
      const dept = (c.department || (c as any).programming_name || '').toLowerCase();
      const matchSearch = !q || title.includes(q) || code.includes(q) || dept.includes(q);
      const matchDept = deptFilter === 'All' || c.department === deptFilter || (c as any).programming_name === deptFilter;
      const matchYear = yearFilter === 'All' || c.year === yearFilter;
      return matchSearch && matchDept && matchYear;
    });
  }, [courses, searchQuery, deptFilter, yearFilter]);

  const isAllFilteredSelected = useMemo(() => {
    if (filteredCourses.length === 0) return false;
    return filteredCourses.every((c) => selectedMultipleIds.includes(c.id));
  }, [filteredCourses, selectedMultipleIds]);

  const isSomeFilteredSelected = useMemo(() => {
    return (
      filteredCourses.some((c) => selectedMultipleIds.includes(c.id)) &&
      !isAllFilteredSelected
    );
  }, [filteredCourses, selectedMultipleIds, isAllFilteredSelected]);

  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      const filteredIdSet = new Set(filteredCourses.map((c) => c.id));
      setSelectedMultipleIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    } else {
      const filteredIdList = filteredCourses.map((c) => c.id);
      setSelectedMultipleIds((prev) => Array.from(new Set([...prev, ...filteredIdList])));
    }
  };

  const toggleSelectCourse = (id: string) => {
    setSelectedMultipleIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectedCoursesList = useMemo(() => {
    const idSet = new Set(selectedMultipleIds);
    return courses.filter((c) => idSet.has(c.id));
  }, [courses, selectedMultipleIds]);

  const handleSelectDeleteOption = (option: 'single' | 'multiple' | 'all') => {
    if (option === 'single') {
      if (selectedSingleCourse) {
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

  const handleConfirmSingleDelete = async () => {
    if (!selectedSingleCourse) return;
    setIsDeleting(true);
    try {
      const res = await onDeleteSingle(selectedSingleCourse.id);
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
      id="course-delete-workflow-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-[#D7E3EA] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        id="course-delete-workflow-modal-card"
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
                {step === 'menu' && 'Course Delete Options'}
                {step === 'single_select' && 'Select Course to Delete'}
                {step === 'single_confirm' && 'Delete Course?'}
                {step === 'multiple_select' && 'Delete Multiple Courses'}
                {step === 'multiple_confirm' && 'Confirm Multiple Course Deletion'}
                {step === 'all_confirm' && 'Delete All Courses'}
              </h3>
              <p className="text-[11px] text-[#E6FCFF]/70">
                {step === 'menu' && 'Choose a deletion method for course records'}
                {step === 'single_select' && 'Pick the course you wish to permanently remove'}
                {step === 'single_confirm' && 'Review course details before permanent removal'}
                {step === 'multiple_select' && 'Select one or more courses using checkboxes'}
                {step === 'multiple_confirm' && 'Review selected courses before permanent removal'}
                {step === 'all_confirm' && 'Permanently delete all courses and evaluation marks'}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
            id="close-course-delete-workflow-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: DELETE OPTIONS MENU */}
        {step === 'menu' && (
          <div className="p-6 space-y-4 overflow-y-auto" id="course-delete-menu-step">
            <div className="bg-[#F5F9FC] p-4 rounded-2xl border border-[#D7E3EA] text-xs text-[#64748B]">
              <span className="font-semibold text-[#172B4D]">Course Deletion Workflow: </span>
              Select how you would like to delete courses. You can delete just this course, select multiple courses, or delete all courses.
            </div>

            {targetCourse && (
              <div className="p-4 bg-[#F5F9FC] border border-[#D7E3EA] rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0B1F3A] text-[#00D9FF] flex items-center justify-center font-bold text-xs shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#172B4D]">
                      {targetCourse.course_title || targetCourse.courseTitle || targetCourse.subject_name}
                    </div>
                    <div className="text-[11px] font-mono text-[#64748B]">
                      Code: {targetCourse.course_code || targetCourse.courseCode || targetCourse.subjectCode} • {targetCourse.department} ({targetCourse.year})
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md">
                  Active Target
                </span>
              </div>
            )}

            <div className="space-y-2.5 pt-1">
              {/* Option 1: Manual / Single Delete */}
              <button
                type="button"
                onClick={() => handleSelectDeleteOption('single')}
                className="w-full p-4 rounded-2xl border border-[#D7E3EA] hover:border-[#0094B3] hover:bg-[#F5F9FC] transition-all text-left flex items-center justify-between group cursor-pointer"
                id="course-delete-opt-manual"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#F5F9FC] group-hover:bg-[#0B1F3A] group-hover:text-[#00D9FF] text-[#0B1F3A] flex items-center justify-center transition-colors shrink-0">
                    <BookX className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#172B4D] group-hover:text-[#0094B3] transition-colors">
                      {targetCourse ? 'Manual Delete (This Course Only)' : 'Manual Delete (Pick a Course)'}
                    </div>
                    <div className="text-[11px] text-[#64748B]">
                      {targetCourse
                        ? `Delete "${targetCourse.course_title || targetCourse.courseTitle || targetCourse.subject_name}" individually with confirmation.`
                        : 'Choose a single course to remove individually with a confirmation prompt.'}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:text-[#0094B3] transition-colors shrink-0" />
              </button>

              {/* Option 2: Multiple Delete */}
              <button
                type="button"
                onClick={() => handleSelectDeleteOption('multiple')}
                className="w-full p-4 rounded-2xl border border-[#D7E3EA] hover:border-[#0094B3] hover:bg-[#F5F9FC] transition-all text-left flex items-center justify-between group cursor-pointer"
                id="course-delete-opt-multiple"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#F5F9FC] group-hover:bg-[#0B1F3A] group-hover:text-[#00D9FF] text-[#0B1F3A] flex items-center justify-center transition-colors shrink-0">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#172B4D] group-hover:text-[#0094B3] transition-colors">
                      Multiple Delete
                    </div>
                    <div className="text-[11px] text-[#64748B]">
                      Select specific courses using interactive checkboxes and delete them in a single batch.
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:text-[#0094B3] transition-colors shrink-0" />
              </button>

              {/* Option 3: Delete All */}
              <button
                type="button"
                onClick={() => handleSelectDeleteOption('all')}
                className="w-full p-4 rounded-2xl border border-rose-200 hover:border-rose-400 bg-rose-50/40 hover:bg-rose-50 transition-all text-left flex items-center justify-between group cursor-pointer"
                id="course-delete-opt-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 group-hover:bg-rose-600 group-hover:text-white text-rose-600 flex items-center justify-center transition-colors shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-rose-900 group-hover:text-rose-700 transition-colors">
                      Delete All Courses ({courses.length} Total)
                    </div>
                    <div className="text-[11px] text-rose-700/80">
                      Permanently wipe all course records and their test evaluation marks.
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400 group-hover:text-rose-600 transition-colors shrink-0" />
              </button>
            </div>

            {/* Cancel Button */}
            <div className="pt-3 border-t border-[#D7E3EA] flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-[#F5F9FC] hover:bg-[#E2ECF4] text-[#172B4D] text-xs font-bold rounded-xl border border-[#D7E3EA] transition-all cursor-pointer"
                id="course-delete-cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* STEP 2A: SINGLE COURSE SELECTION */}
        {step === 'single_select' && (
          <div className="p-6 space-y-4 overflow-y-auto flex-1 flex flex-col" id="course-delete-single-select-step">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep('menu')}
                className="p-1 text-[#64748B] hover:text-[#172B4D] rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h4 className="text-xs font-bold text-[#172B4D]">Choose Course to Delete</h4>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search course title or code..."
                className="w-full pl-9 pr-3 py-2 bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl text-xs outline-none focus:border-[#00D9FF] focus:bg-white"
              />
            </div>

            <div className="divide-y divide-[#D7E3EA] border border-[#D7E3EA] rounded-2xl max-h-64 overflow-y-auto">
              {filteredCourses.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#64748B]">No courses found.</div>
              ) : (
                filteredCourses.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedSingleCourse(c);
                      setStep('single_confirm');
                    }}
                    className="p-3.5 hover:bg-[#F5F9FC] flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#172B4D]">
                        {c.course_title || c.courseTitle || c.subject_name}
                      </div>
                      <div className="text-[11px] font-mono text-[#64748B]">
                        Code: {c.course_code || c.courseCode || c.subjectCode} • {c.department} ({c.year})
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#64748B]" />
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep('menu')}
                className="px-4 py-2 bg-[#F5F9FC] text-[#172B4D] text-xs font-bold rounded-xl border border-[#D7E3EA] cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#F5F9FC] text-[#64748B] text-xs font-bold rounded-xl border border-[#D7E3EA] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* STEP 2B: SINGLE COURSE CONFIRMATION */}
        {step === 'single_confirm' && selectedSingleCourse && (
          <div className="p-6 space-y-4 overflow-y-auto" id="course-delete-single-confirm-step">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900">
                <div className="font-bold">Permanent Action Warning</div>
                <p className="mt-0.5">
                  Are you sure you want to permanently delete this course? All associated Unit Test 1 and Unit Test 2 marks for enrolled students will also be removed.
                </p>
              </div>
            </div>

            {/* Course Summary Box */}
            <div className="p-4 bg-[#F5F9FC] border border-[#D7E3EA] rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#64748B]">Course Title:</span>
                <span className="font-bold text-[#172B4D]">
                  {selectedSingleCourse.course_title || selectedSingleCourse.courseTitle || selectedSingleCourse.subject_name}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#64748B]">Course Code:</span>
                <span className="font-mono font-bold text-[#0B1F3A]">
                  {selectedSingleCourse.course_code || selectedSingleCourse.courseCode || selectedSingleCourse.subjectCode}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#64748B]">Department:</span>
                <span className="font-medium text-[#172B4D]">{selectedSingleCourse.department}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#64748B]">Academic Year:</span>
                <span className="font-medium text-[#172B4D]">{selectedSingleCourse.year}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#D7E3EA] flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setStep('menu')}
                className="px-4 py-2.5 bg-[#F5F9FC] hover:bg-[#E2ECF4] text-[#172B4D] text-xs font-bold rounded-xl border border-[#D7E3EA] transition-all cursor-pointer disabled:opacity-50"
              >
                Back to Options
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={onClose}
                  className="px-4 py-2.5 bg-[#F5F9FC] hover:bg-[#E2ECF4] text-[#64748B] text-xs font-bold rounded-xl border border-[#D7E3EA] transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmSingleDelete}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  id="confirm-single-course-delete-btn"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? 'Deleting...' : 'Delete Course'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3A: MULTIPLE COURSE SELECTION */}
        {step === 'multiple_select' && (
          <div className="p-6 space-y-4 overflow-y-auto flex-1 flex flex-col" id="course-delete-multiple-select-step">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('menu')}
                  className="p-1 text-[#64748B] hover:text-[#172B4D] rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h4 className="text-xs font-bold text-[#172B4D]">Select Courses to Delete</h4>
              </div>
              <span className="text-[11px] font-bold text-[#0094B3] bg-[#F5F9FC] px-2.5 py-1 rounded-lg border border-[#D7E3EA]">
                {selectedMultipleIds.length} Selected
              </span>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="relative sm:col-span-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-8 pr-2 py-1.5 bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl text-xs outline-none focus:border-[#00D9FF] focus:bg-white"
                />
              </div>
              <div>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl text-xs outline-none"
                >
                  <option value="All">All Depts</option>
                  {uniqueDepartments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl text-xs outline-none"
                >
                  <option value="All">All Years</option>
                  {uniqueYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Select All Toggle */}
            <div className="flex items-center justify-between px-3 py-2 bg-[#F5F9FC] rounded-xl border border-[#D7E3EA]">
              <button
                type="button"
                onClick={toggleSelectAllFiltered}
                className="flex items-center gap-2 text-xs font-bold text-[#172B4D] cursor-pointer"
              >
                {isAllFilteredSelected ? (
                  <CheckSquare className="w-4 h-4 text-[#0094B3]" />
                ) : isSomeFilteredSelected ? (
                  <Square className="w-4 h-4 text-[#0094B3] fill-[#0094B3]/30" />
                ) : (
                  <Square className="w-4 h-4 text-[#64748B]" />
                )}
                <span>Select All Filtered ({filteredCourses.length})</span>
              </button>
              {selectedMultipleIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedMultipleIds([])}
                  className="text-[11px] text-rose-600 hover:underline font-bold cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {/* Courses List */}
            <div className="divide-y divide-[#D7E3EA] border border-[#D7E3EA] rounded-2xl max-h-56 overflow-y-auto">
              {filteredCourses.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#64748B]">No courses match filter.</div>
              ) : (
                filteredCourses.map((c) => {
                  const isChecked = selectedMultipleIds.includes(c.id);
                  return (
                    <div
                      key={c.id}
                      onClick={() => toggleSelectCourse(c.id)}
                      className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked ? 'bg-[#E6FCFF]/40' : 'hover:bg-[#F5F9FC]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-xs">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-[#0094B3]" />
                          ) : (
                            <Square className="w-4 h-4 text-[#64748B]" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#172B4D]">
                            {c.course_title || c.courseTitle || c.subject_name}
                          </div>
                          <div className="text-[11px] font-mono text-[#64748B]">
                            {c.course_code || c.courseCode || c.subjectCode} • {c.department} ({c.year})
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-[#D7E3EA] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep('menu')}
                className="px-4 py-2 bg-[#F5F9FC] hover:bg-[#E2ECF4] text-[#172B4D] text-xs font-bold rounded-xl border border-[#D7E3EA] cursor-pointer"
              >
                Back
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-[#F5F9FC] hover:bg-[#E2ECF4] text-[#64748B] text-xs font-bold rounded-xl border border-[#D7E3EA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedMultipleIds.length === 0}
                  onClick={() => setStep('multiple_confirm')}
                  className="px-5 py-2 bg-[#0B1F3A] hover:bg-[#102A43] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border border-[#00D9FF]/30"
                  id="proceed-multiple-course-delete-btn"
                >
                  Proceed to Delete ({selectedMultipleIds.length})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3B: MULTIPLE COURSE CONFIRMATION */}
        {step === 'multiple_confirm' && (
          <div className="p-6 space-y-4 overflow-y-auto" id="course-delete-multiple-confirm-step">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900">
                <div className="font-bold">
                  Delete {selectedMultipleIds.length} Selected Course{selectedMultipleIds.length !== 1 ? 's' : ''}?
                </div>
                <p className="mt-0.5">
                  This action is permanent and will delete the selected courses along with all their student marks.
                </p>
              </div>
            </div>

            <div className="divide-y divide-[#D7E3EA] border border-[#D7E3EA] rounded-2xl max-h-52 overflow-y-auto bg-[#F5F9FC] p-2">
              {selectedCoursesList.map((c, i) => (
                <div key={c.id} className="py-2 px-3 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-[#172B4D]">
                      {i + 1}. {c.course_title || c.courseTitle || c.subject_name}
                    </span>
                    <span className="text-[#64748B] text-[11px] font-mono ml-2">
                      ({c.course_code || c.courseCode || c.subjectCode})
                    </span>
                  </div>
                  <span className="text-[11px] text-[#64748B]">
                    {c.department} • {c.year}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#D7E3EA] flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setStep('multiple_select')}
                className="px-4 py-2.5 bg-[#F5F9FC] hover:bg-[#E2ECF4] text-[#172B4D] text-xs font-bold rounded-xl border border-[#D7E3EA] cursor-pointer disabled:opacity-50"
              >
                Back to Selection
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={onClose}
                  className="px-4 py-2.5 bg-[#F5F9FC] hover:bg-[#E2ECF4] text-[#64748B] text-xs font-bold rounded-xl border border-[#D7E3EA] cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmMultipleDelete}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  id="confirm-multiple-course-delete-btn"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>
                    {isDeleting ? 'Deleting...' : `Delete ${selectedMultipleIds.length} Courses`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: DELETE ALL COURSES CONFIRMATION */}
        {step === 'all_confirm' && (
          <div className="p-6 space-y-4 overflow-y-auto" id="course-delete-all-confirm-step">
            <div className="p-4 bg-rose-100 border border-rose-300 rounded-2xl flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-rose-700 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-950 space-y-1">
                <div className="font-bold text-sm">Critical: Delete All Courses</div>
                <p>
                  You are about to delete <span className="font-bold underline">{courses.length} courses</span> and all related marks records for your teacher profile.
                </p>
                <p className="text-rose-800">
                  This action cannot be undone. Other teachers&apos; courses and data will remain unaffected.
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#F5F9FC] border border-[#D7E3EA] rounded-2xl">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmAllChecked}
                  onChange={(e) => setConfirmAllChecked(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded cursor-pointer accent-rose-600"
                  id="confirm-delete-all-courses-checkbox"
                />
                <span className="text-xs font-bold text-[#172B4D]">
                  I understand that this will permanently remove all {courses.length} courses.
                </span>
              </label>
            </div>

            <div className="pt-3 border-t border-[#D7E3EA] flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setStep('menu')}
                className="px-4 py-2.5 bg-[#F5F9FC] hover:bg-[#E2ECF4] text-[#172B4D] text-xs font-bold rounded-xl border border-[#D7E3EA] cursor-pointer disabled:opacity-50"
              >
                Back to Options
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={onClose}
                  className="px-4 py-2.5 bg-[#F5F9FC] hover:bg-[#E2ECF4] text-[#64748B] text-xs font-bold rounded-xl border border-[#D7E3EA] cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting || !confirmAllChecked || courses.length === 0}
                  onClick={handleConfirmAllDelete}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  id="confirm-delete-all-courses-btn"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? 'Deleting All...' : 'Delete All Courses'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
