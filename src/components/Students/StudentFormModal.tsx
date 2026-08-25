import React, { useState, useEffect } from 'react';
import { useAcademic } from '../../context/AcademicContext';
import { X, UserPlus, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Department, AcademicYear } from '../../types';

export const StudentFormModal: React.FC = () => {
  const { studentFormModal, setStudentFormModal, addStudent, updateStudent } = useAcademic();
  const { isOpen, studentToEdit } = studentFormModal;

  const [formData, setFormData] = useState({
    name: '',
    enrollmentNo: '',
    department: 'Computer Engineering' as Department,
    year: '2nd Year' as AcademicYear,
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (studentToEdit) {
      setFormData({
        name: studentToEdit.student_name || studentToEdit.name || '',
        enrollmentNo:
          studentToEdit.enrollment_number ||
          studentToEdit.enrollmentNo ||
          studentToEdit.prn ||
          studentToEdit.rollNumber ||
          '',
        department: studentToEdit.department || 'Computer Engineering',
        year: studentToEdit.year || '2nd Year',
      });
    } else {
      setFormData({
        name: '',
        enrollmentNo: '',
        department: 'Computer Engineering',
        year: '2nd Year',
      });
    }
    setErrorMsg(null);
  }, [studentToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation: simple and strictly checked
    if (!formData.name.trim()) {
      setErrorMsg('Please enter student name.');
      return;
    }
    if (!formData.enrollmentNo.trim()) {
      setErrorMsg('Please enter enrollment number (e.g. EN2026001).');
      return;
    }

    const payload = {
      student_name: formData.name.trim(),
      name: formData.name.trim(),
      enrollment_number: formData.enrollmentNo.trim().toUpperCase(),
      enrollmentNo: formData.enrollmentNo.trim().toUpperCase(),
      department: formData.department,
      year: formData.year,
      rollNumber: formData.enrollmentNo.trim().toUpperCase(),
      prn: formData.enrollmentNo.trim().toUpperCase(),
    };

    if (studentToEdit) {
      const res = updateStudent(studentToEdit.id, payload);
      if (!res.success) {
        setErrorMsg(res.message);
        return;
      }
    } else {
      const res = addStudent(payload);
      if (!res.success) {
        setErrorMsg(res.message);
        return;
      }
    }

    setStudentFormModal({ isOpen: false, studentToEdit: null });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#071426]/70 backdrop-blur-xs overflow-y-auto"
      id="student-form-modal"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-[#D7E3EA] max-w-md w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-[#0B1F3A] px-6 py-5 text-white flex items-center justify-between border-b border-[#102A43]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#102A43] text-[#00D9FF] rounded-xl shadow-xs border border-[#00D9FF]/30">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {studentToEdit ? 'Edit Student Details' : 'Add Student'}
              </h3>
              <p className="text-xs text-[#67E8F9]/80">
                {studentToEdit ? `Update student record` : 'Enter student information'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setStudentFormModal({ isOpen: false, studentToEdit: null })}
            className="p-1.5 rounded-full hover:bg-[#102A43] text-[#64748B] hover:text-white transition-colors cursor-pointer"
            id="close-student-form-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#EF4444]" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Student Name */}
          <div>
            <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
              1. Student Name <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Vedika Salekar"
              className="w-full px-3.5 py-2.5 bg-[#F5F9FC] text-sm text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:border-[#00D9FF] focus:bg-white focus:ring-2 focus:ring-[#00D9FF]/20 outline-none transition-all placeholder:text-[#64748B]"
              id="input-student-name"
              autoFocus
            />
          </div>

          {/* 2. Enrollment Number */}
          <div>
            <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
              2. Enrollment Number <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.enrollmentNo}
              onChange={(e) => setFormData({ ...formData, enrollmentNo: e.target.value.toUpperCase() })}
              placeholder="e.g. EN2026001"
              className="w-full px-3.5 py-2.5 bg-[#F5F9FC] font-mono text-sm text-[#0B1F3A] font-bold border border-[#D7E3EA] rounded-xl focus:border-[#00D9FF] focus:bg-white focus:ring-2 focus:ring-[#00D9FF]/20 outline-none transition-all placeholder:text-[#64748B] uppercase"
              id="input-student-enrollment"
            />
            <p className="text-[11px] text-[#64748B] mt-1">Unique identifier to prevent duplicate entries</p>
          </div>

          {/* 3. Department / Programming Name Dropdown */}
          <div>
            <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
              3. Programming Name <span className="text-[#EF4444]">*</span>
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value as Department })}
              className="w-full px-3.5 py-2.5 bg-[#F5F9FC] text-sm text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:border-[#00D9FF] focus:bg-white outline-none cursor-pointer"
              id="select-student-dept"
            >
              <option value="Computer Engineering">Computer Engineering</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
            </select>
          </div>

          {/* 4. Year Dropdown */}
          <div>
            <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
              4. Year <span className="text-[#EF4444]">*</span>
            </label>
            <select
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value as AcademicYear })}
              className="w-full px-3.5 py-2.5 bg-[#F5F9FC] text-sm text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:border-[#00D9FF] focus:bg-white outline-none cursor-pointer"
              id="select-student-year"
            >
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="2nd Year DSY">2nd Year DSY</option>
            </select>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-[#D7E3EA] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setStudentFormModal({ isOpen: false, studentToEdit: null })}
              className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#172B4D] hover:bg-[#F5F9FC] rounded-xl transition-colors cursor-pointer"
              id="cancel-student-form-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#0B1F3A] hover:bg-[#102A43] active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-[#0B1F3A]/20 transition-all flex items-center gap-2 cursor-pointer border border-[#00D9FF]/30"
              id="save-student-btn"
            >
              <Save className="w-4 h-4 text-[#00D9FF]" />
              <span>Save Student</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
