import React, { useState } from 'react';
import { useAcademic } from '../../context/AcademicContext';
import { useAuth } from '../../context/AuthContext';
import {
  UserCheck,
  Plus,
  Search,
  BookOpen,
  Edit,
  Trash2,
  LogIn,
  Users,
  Shield,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { Department, Teacher } from '../../types';
import { TeacherFormModal } from './TeacherFormModal';

export const TeacherManagement: React.FC = () => {
  const {
    teachers,
    subjects,
    students,
    deleteTeacher,
    selectedTeacherForEdit,
    setSelectedTeacherForEdit,
    isTeacherFormModalOpen,
    setIsTeacherFormModalOpen,
    setActiveTab,
  } = useAcademic();
  const { loginAsTeacher, user } = useAuth();

  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredTeachers = teachers.filter((t) => {
    const matchDept = selectedDept === 'All' || t.department === selectedDept;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.teacherId.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      t.department.toLowerCase().includes(q);

    return matchDept && matchSearch;
  });

  const handleOpenAdd = () => {
    setSelectedTeacherForEdit(null);
    setIsTeacherFormModalOpen(true);
  };

  const handleOpenEdit = (teacher: Teacher) => {
    setSelectedTeacherForEdit(teacher);
    setIsTeacherFormModalOpen(true);
  };

  const handleSwitchToTeacher = (teacher: Teacher) => {
    loginAsTeacher(teacher);
    setActiveTab('teacher-dashboard');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="teacher-management-view">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-[#D7E3EA] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-bold bg-[#F5F9FC] text-[#0094B3] border border-[#D7E3EA] rounded-md flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Faculty Control Center</span>
            </span>
          </div>
          <h2 className="text-xl font-black text-[#172B4D] tracking-tight">
            Faculty Directory &amp; Subject Assignment
          </h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            Manage professors, assign department subjects, map class divisions, and oversee marks entry permissions.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 text-xs font-bold bg-[#0B1F3A] hover:bg-[#102A43] text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 border border-[#00D9FF]/30 cursor-pointer"
          id="add-teacher-btn"
        >
          <Plus className="w-4 h-4 text-[#00D9FF]" />
          <span>Add New Faculty</span>
        </button>
      </div>

      {/* Filter Strip */}
      <div className="bg-white p-4 rounded-2xl border border-[#D7E3EA] shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Department Filter */}
          <div>
            <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl focus:bg-white focus:outline-none focus:border-[#00D9FF] font-medium text-[#172B4D]"
            >
              <option value="All">All Departments</option>
              <option value="Computer Engineering">Computer Engineering</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
            </select>
          </div>

          {/* Search Query */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Search Faculty
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Name, Teacher ID, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl focus:bg-white focus:outline-none focus:border-[#00D9FF] text-[#172B4D]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTeachers.length > 0 ? (
          filteredTeachers.map((teacher) => {
            const assignedSubObjs = subjects.filter((s) =>
              teacher.assignedSubjects.includes(s.id)
            );

            // Compute student count in this teacher's classes
            const teacherStudents = students.filter(
              (s) =>
                s.department === teacher.department &&
                teacher.assignedYears.includes(s.year) &&
                teacher.divisions.includes(s.division)
            );

            const isCurrentLoggedIn = user?.teacherId === teacher.teacherId;

            return (
              <div
                key={teacher.id}
                className={`bg-white rounded-2xl p-5 border transition-all hover:shadow-md flex flex-col justify-between space-y-4 ${
                  isCurrentLoggedIn
                    ? 'border-[#00D9FF] ring-2 ring-[#00D9FF]/20 bg-[#F5F9FC]/40'
                    : 'border-[#D7E3EA] shadow-xs'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-[#F5F9FC] text-[#0B1F3A] border border-[#D7E3EA] rounded">
                          {teacher.teacherId}
                        </span>
                        <span className="text-[11px] font-bold text-[#0094B3] bg-[#F5F9FC] px-2 py-0.5 rounded border border-[#D7E3EA]">
                          {teacher.department.split(' ')[0]}
                        </span>
                        {isCurrentLoggedIn && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/30 rounded">
                            Active Session
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-[#172B4D] mt-1.5">{teacher.name}</h3>
                      <p className="text-xs text-[#64748B]">{teacher.title || 'Assistant Professor'} • {teacher.email}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(teacher)}
                        className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0094B3] hover:bg-[#F5F9FC] transition-all cursor-pointer"
                        title="Edit Faculty Assignments"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete ${teacher.name} from faculty database?`)) {
                            deleteTeacher(teacher.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-[#64748B] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-all cursor-pointer"
                        title="Delete Faculty"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Assigned Subjects Pills */}
                  <div>
                    <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                      Assigned Subjects ({assignedSubObjs.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {assignedSubObjs.length > 0 ? (
                        assignedSubObjs.map((sub) => (
                          <span
                            key={sub.id}
                            className="px-2.5 py-1 text-xs font-semibold bg-[#F5F9FC] border border-[#D7E3EA] text-[#172B4D] rounded-lg"
                          >
                            {sub.subjectName}{' '}
                            <span className="text-[#64748B] font-mono text-[10px]">
                              ({sub.subjectCode})
                            </span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-[#EF4444] italic">No subjects assigned yet</span>
                      )}
                    </div>
                  </div>

                  {/* Classes & Divisions */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#D7E3EA]">
                    <div>
                      <span className="text-[#64748B] font-medium">Assigned Classes:</span>{' '}
                      <strong className="text-[#172B4D]">{teacher.assignedYears.join(', ')}</strong>
                    </div>
                    <div>
                      <span className="text-[#64748B] font-medium">Divisions:</span>{' '}
                      <strong className="text-[#172B4D]">{teacher.divisions.join(', ')}</strong>
                    </div>
                  </div>
                </div>

                {/* Footer Strip */}
                <div className="flex items-center justify-between pt-3 border-t border-[#D7E3EA]">
                  <div className="text-xs text-[#64748B] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#64748B]" />
                    <span><strong className="text-[#172B4D]">{teacherStudents.length}</strong> enrolled students</span>
                  </div>

                  <button
                    onClick={() => handleSwitchToTeacher(teacher)}
                    className="px-3 py-1.5 text-xs font-bold bg-[#0B1F3A] hover:bg-[#102A43] text-[#00D9FF] rounded-xl transition-all flex items-center gap-1.5 border border-[#00D9FF]/30 cursor-pointer"
                    id={`login-as-${teacher.teacherId.toLowerCase()}`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Login As Teacher</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 p-12 text-center text-[#64748B] bg-white rounded-2xl border border-[#D7E3EA]">
            <UserCheck className="w-10 h-10 mx-auto mb-2 text-[#64748B]" />
            <p className="text-sm font-bold text-[#172B4D]">No faculty members found</p>
            <p className="text-xs text-[#64748B] mt-0.5">Add a new faculty member using the button above.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <TeacherFormModal
        isOpen={isTeacherFormModalOpen}
        onClose={() => setIsTeacherFormModalOpen(false)}
        teacherToEdit={selectedTeacherForEdit}
      />
    </div>
  );
};
