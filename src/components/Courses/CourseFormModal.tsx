import React, { useState, useEffect } from 'react';
import { useAcademic } from '../../context/AcademicContext';
import { useAuth } from '../../context/AuthContext';
import { Department, AcademicYear } from '../../types';
import { BookOpen, X, Save, AlertCircle, Sparkles } from 'lucide-react';

export const CourseFormModal: React.FC = () => {
  const { courseFormModal, setCourseFormModal, addCourse, updateCourse } = useAcademic();
  const { currentTeacher } = useAuth();

  const [formData, setFormData] = useState<{
    course_title: string;
    course_code: string;
    department: Department;
    year: AcademicYear;
    unit1MaxMarks: number;
    unit2MaxMarks: number;
  }>({
    course_title: '',
    course_code: '',
    department: 'Computer Engineering',
    year: '2nd Year',
    unit1MaxMarks: 30,
    unit2MaxMarks: 30,
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (courseFormModal.isOpen) {
      if (courseFormModal.courseToEdit) {
        const c = courseFormModal.courseToEdit;
        setFormData({
          course_title: c.course_title || c.courseTitle || c.subject_name || c.subjectName || '',
          course_code: c.course_code || c.courseCode || c.subjectCode || '',
          department: c.department || (c as any).programming_name || currentTeacher?.department || 'Computer Engineering',
          year: c.year || '2nd Year',
          unit1MaxMarks: c.unit1MaxMarks || 30,
          unit2MaxMarks: c.unit2MaxMarks || 30,
        });
      } else {
        setFormData({
          course_title: '',
          course_code: '',
          department: courseFormModal.defaultDept || currentTeacher?.department || 'Computer Engineering',
          year: courseFormModal.defaultYear || '2nd Year',
          unit1MaxMarks: 30,
          unit2MaxMarks: 30,
        });
      }
      setErrorMsg(null);
    }
  }, [courseFormModal.isOpen, courseFormModal.courseToEdit, courseFormModal.defaultDept, courseFormModal.defaultYear, currentTeacher]);

  if (!courseFormModal.isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const title = formData.course_title.trim();
    const code = formData.course_code.trim().toUpperCase();

    if (!title) {
      setErrorMsg('Please enter the Course Title (e.g. Operating System).');
      return;
    }
    if (!code) {
      setErrorMsg('Please enter the official Course Code (e.g. CO502).');
      return;
    }

    setIsSubmitting(true);

    try {
      if (courseFormModal.courseToEdit) {
        const res = updateCourse(courseFormModal.courseToEdit.id, {
          course_title: title,
          course_code: code,
          department: formData.department,
          year: formData.year,
          unit1MaxMarks: 30,
          unit2MaxMarks: 30,
        });
        if (!res.success) {
          setErrorMsg(res.message);
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = addCourse({
          course_title: title,
          course_code: code,
          department: formData.department,
          year: formData.year,
          unit1MaxMarks: 30,
          unit2MaxMarks: 30,
        });
        if (!res.success) {
          setErrorMsg(res.message);
          setIsSubmitting(false);
          return;
        }
      }

      setCourseFormModal({ isOpen: false, courseToEdit: null });
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!courseFormModal.courseToEdit;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#071426]/70 backdrop-blur-xs overflow-y-auto"
      id="course-form-modal-overlay"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-[#D7E3EA] max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        id="course-form-modal-container"
      >
        {/* Header */}
        <div className="bg-[#0B1F3A] px-6 py-4.5 text-white flex items-center justify-between border-b border-[#102A43]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#102A43] border border-[#00D9FF]/40 flex items-center justify-center text-[#00D9FF] shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight" id="course-modal-title">
                {isEditing ? 'Edit Course Details' : 'Add New Course'}
              </h3>
              <p className="text-[11px] text-[#67E8F9]">
                {isEditing
                  ? 'Update Course Title, Course Code, Department or Year'
                  : 'Enter the subject/course you personally teach'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setCourseFormModal({ isOpen: false, courseToEdit: null })}
            className="p-1.5 rounded-full hover:bg-white/10 text-[#67E8F9] hover:text-white transition-colors cursor-pointer"
            id="close-course-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4" id="course-entry-form">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#EF4444] mt-0.5" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Programming Name */}
            <div>
              <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
                Programming Name <span className="text-[#EF4444]">*</span>
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value as Department })}
                className="w-full px-3.5 py-2.5 bg-[#F5F9FC] text-xs font-medium text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:bg-white focus:border-[#00D9FF] focus:ring-2 focus:ring-[#67E8F9]/30 outline-none cursor-pointer transition-all"
                id="course-form-dept-select"
              >
                <option value="Computer Engineering">Computer Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
                Academic Year <span className="text-[#EF4444]">*</span>
              </label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value as AcademicYear })}
                className="w-full px-3.5 py-2.5 bg-[#F5F9FC] text-xs font-medium text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:bg-white focus:border-[#00D9FF] focus:ring-2 focus:ring-[#67E8F9]/30 outline-none cursor-pointer transition-all"
                id="course-form-year-select"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="2nd Year DSY">2nd Year DSY</option>
              </select>
            </div>

            {/* Course Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
                Course Title <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.course_title}
                onChange={(e) => setFormData({ ...formData, course_title: e.target.value })}
                placeholder="e.g. Operating System, Cloud Computing, Software Engineering..."
                className="w-full px-3.5 py-2.5 bg-[#F5F9FC] text-xs font-medium text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:bg-white focus:border-[#00D9FF] focus:ring-2 focus:ring-[#67E8F9]/30 outline-none transition-all placeholder:text-[#64748B]"
                id="course-form-title-input"
              />
              <p className="text-[11px] text-[#64748B] mt-1">
                Type the exact course title you personally teach. No predefined selection is forced.
              </p>
            </div>

            {/* Course Code */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
                Course Code <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.course_code}
                onChange={(e) => setFormData({ ...formData, course_code: e.target.value.toUpperCase() })}
                placeholder="e.g. CO502, CO503, CE401, ME402..."
                className="w-full px-3.5 py-2.5 bg-[#F5F9FC] font-mono text-xs font-bold text-[#0B1F3A] uppercase border border-[#D7E3EA] rounded-xl focus:bg-white focus:border-[#00D9FF] focus:ring-2 focus:ring-[#67E8F9]/30 outline-none transition-all placeholder:text-[#64748B]"
                id="course-form-code-input"
              />
              <p className="text-[11px] text-[#64748B] mt-1">
                Manually enter the official Course Code. System will never auto-generate or override this code.
              </p>
            </div>
          </div>

          {/* Evaluation Standard Note */}
          <div className="p-3 bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl flex items-center gap-2.5 text-xs text-[#0B1F3A]">
            <Sparkles className="w-4 h-4 text-[#00D9FF] shrink-0" />
            <span>
              Evaluation Base: <strong>Unit Test 1 (30M)</strong> &amp; <strong>Unit Test 2 (30M)</strong>. Teacher ID: <strong className="font-mono">{currentTeacher?.teacher_id}</strong>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#D7E3EA] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setCourseFormModal({ isOpen: false, courseToEdit: null })}
              className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-[#F5F9FC] rounded-xl cursor-pointer transition-colors"
              id="cancel-course-modal-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-[#0B1F3A] hover:bg-[#102A43] active:scale-95 rounded-xl shadow-md shadow-[#0B1F3A]/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 border border-[#00D9FF]/30"
              id="save-course-btn"
            >
              <Save className="w-4 h-4 text-[#00D9FF]" />
              <span>{isSubmitting ? 'Saving...' : isEditing ? 'Update Course' : 'Add Course'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
