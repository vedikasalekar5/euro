import React, { useState, useEffect } from 'react';
import { useAcademic } from '../../context/AcademicContext';
import { Department, AcademicYear, Division, Teacher } from '../../types';
import { X, Save, BookOpen, UserCheck } from 'lucide-react';

interface TeacherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherToEdit?: Teacher | null;
}

export const TeacherFormModal: React.FC<TeacherFormModalProps> = ({
  isOpen,
  onClose,
  teacherToEdit,
}) => {
  const { subjects, addTeacher, updateTeacher } = useAcademic();

  const [teacherId, setTeacherId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState<Department>('Computer Engineering');
  const [title, setTitle] = useState('Assistant Professor');
  const [assignedSubjects, setAssignedSubjects] = useState<string[]>([]);
  const [assignedYears, setAssignedYears] = useState<AcademicYear[]>(['2nd Year']);
  const [divisions, setDivisions] = useState<Division[]>(['A', 'B']);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (teacherToEdit) {
      setTeacherId(teacherToEdit.teacherId);
      setName(teacherToEdit.name);
      setEmail(teacherToEdit.email);
      setDepartment(teacherToEdit.department);
      setTitle(teacherToEdit.title || 'Assistant Professor');
      setAssignedSubjects(teacherToEdit.assignedSubjects || []);
      setAssignedYears(teacherToEdit.assignedYears || ['2nd Year']);
      setDivisions(teacherToEdit.divisions || ['A']);
    } else {
      setTeacherId(`TCH-${Date.now().toString().slice(-4)}`);
      setName('');
      setEmail('');
      setDepartment('Computer Engineering');
      setTitle('Assistant Professor');
      setAssignedSubjects([]);
      setAssignedYears(['2nd Year']);
      setDivisions(['A', 'B']);
    }
    setError(null);
  }, [teacherToEdit, isOpen]);

  if (!isOpen) return null;

  // Filter subjects for the selected department
  const deptSubjects = subjects.filter((s) => s.department === department);

  const toggleSubject = (subId: string) => {
    setAssignedSubjects((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  const toggleYear = (yr: AcademicYear) => {
    setAssignedYears((prev) =>
      prev.includes(yr) ? (prev.length > 1 ? prev.filter((y) => y !== yr) : prev) : [...prev, yr]
    );
  };

  const toggleDivision = (div: Division) => {
    setDivisions((prev) =>
      prev.includes(div) ? (prev.length > 1 ? prev.filter((d) => d !== div) : prev) : [...prev, div]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!teacherId.trim() || !name.trim() || !email.trim()) {
      setError('Please fill in all mandatory fields (Teacher ID, Name, Email).');
      return;
    }

    if (assignedSubjects.length === 0) {
      setError('Please assign at least one subject to this faculty member.');
      return;
    }

    if (teacherToEdit) {
      const res = updateTeacher(teacherToEdit.id, {
        teacherId,
        name,
        email,
        department,
        title,
        assignedSubjects,
        assignedYears,
        divisions,
      });
      if (res.success) {
        onClose();
      } else {
        setError(res.message);
      }
    } else {
      const res = addTeacher({
        teacherId,
        name,
        email,
        department,
        title,
        assignedSubjects,
        assignedYears,
        divisions,
      });
      if (res.success) {
        onClose();
      } else {
        setError(res.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-[#071426]/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#D7E3EA] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#0B1F3A] p-6 text-white flex items-center justify-between border-b border-[#00D9FF]/20">
          <div>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-[#102A43] text-[#00D9FF] border border-[#00D9FF]/30 rounded-md">
              Faculty Management
            </span>
            <h3 className="text-xl font-bold mt-1 text-white">
              {teacherToEdit ? 'Edit Faculty & Subject Mapping' : 'Onboard New Faculty Member'}
            </h3>
            <p className="text-xs text-[#67E8F9] mt-0.5">
              Assign academic subjects, classes, and division permissions.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs font-semibold rounded-xl">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1">
                Teacher ID *
              </label>
              <input
                type="text"
                required
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                placeholder="e.g. TCH-CS-101"
                className="w-full px-3 py-2 text-sm bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl focus:bg-white focus:outline-none focus:border-[#00D9FF] font-mono font-bold text-[#172B4D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Prof. Rahul Patil"
                className="w-full px-3 py-2 text-sm bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl focus:bg-white focus:outline-none focus:border-[#00D9FF] font-bold text-[#172B4D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. rahul.patil@institute.edu.in"
                className="w-full px-3 py-2 text-sm bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl focus:bg-white focus:outline-none focus:border-[#00D9FF] text-[#172B4D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1">
                Department *
              </label>
              <select
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value as Department);
                  setAssignedSubjects([]);
                }}
                className="w-full px-3 py-2 text-sm bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl focus:bg-white focus:outline-none focus:border-[#00D9FF] font-semibold text-[#172B4D]"
              >
                <option value="Computer Engineering">Computer Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1">
                Designation / Academic Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Associate Professor & Subject Lead"
                className="w-full px-3 py-2 text-sm bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl focus:bg-white focus:outline-none focus:border-[#00D9FF] text-[#172B4D]"
              />
            </div>
          </div>

          {/* Assigned Subjects Multi-Select */}
          <div className="space-y-2 pt-2 border-t border-[#D7E3EA]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#172B4D] uppercase tracking-wider">
                Assigned Subjects in {department} *
              </label>
              <span className="text-xs text-[#0094B3] font-bold">
                {assignedSubjects.length} selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 bg-[#F5F9FC] rounded-2xl border border-[#D7E3EA]">
              {deptSubjects.length > 0 ? (
                deptSubjects.map((sub) => {
                  const isSelected = assignedSubjects.includes(sub.id);
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => toggleSubject(sub.id)}
                      className={`p-3 rounded-xl text-left border transition-all flex items-start justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-white border-[#00D9FF] text-[#0B1F3A] shadow-xs ring-1 ring-[#00D9FF]'
                          : 'bg-white border-[#D7E3EA] text-[#172B4D] hover:border-[#67E8F9]'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold leading-snug">{sub.subjectName}</div>
                        <div className="text-[11px] text-[#64748B] font-mono mt-0.5">
                          {sub.subjectCode} • {sub.year}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-[#0B1F3A] focus:ring-[#00D9FF]"
                      />
                    </button>
                  );
                })
              ) : (
                <div className="col-span-2 p-4 text-center text-xs text-[#64748B]">
                  No subjects found in this department.
                </div>
              )}
            </div>
          </div>

          {/* Classes & Divisions Multi-Select */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#D7E3EA]">
            <div>
              <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-2">
                Assigned Academic Classes
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(['1st Year', '2nd Year', '2nd Year DSY', '3rd Year'] as AcademicYear[]).map(
                  (yr) => {
                    const isSelected = assignedYears.includes(yr);
                    return (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => toggleYear(yr)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0B1F3A] text-[#00D9FF] border-[#0B1F3A] shadow-xs'
                            : 'bg-[#F5F9FC] text-[#64748B] border-[#D7E3EA] hover:bg-[#D7E3EA]/50'
                        }`}
                      >
                        {yr}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-2">
                Assigned Divisions
              </label>
              <div className="flex items-center gap-2">
                {(['A', 'B', 'C'] as Division[]).map((div) => {
                  const isSelected = divisions.includes(div);
                  return (
                    <button
                      key={div}
                      type="button"
                      onClick={() => toggleDivision(div)}
                      className={`w-10 h-10 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#102A43] text-[#67E8F9] border-[#00D9FF] shadow-xs'
                          : 'bg-[#F5F9FC] text-[#64748B] border-[#D7E3EA] hover:bg-[#D7E3EA]/50'
                      }`}
                    >
                      {div}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#D7E3EA]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#64748B] hover:bg-[#F5F9FC] rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold bg-[#0B1F3A] hover:bg-[#102A43] text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 border border-[#00D9FF]/30 cursor-pointer"
            >
              <Save className="w-4 h-4 text-[#00D9FF]" />
              <span>{teacherToEdit ? 'Save Changes' : 'Create Faculty Member'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
