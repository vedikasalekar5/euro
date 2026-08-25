import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAcademic } from '../../context/AcademicContext';
import { CollegeLogo } from '../../assets/collegeLogo';
import {
  X,
  Shield,
  GraduationCap,
  UserCheck,
  CheckCircle2,
  LogIn,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Teacher, Student } from '../../types';

export const LoginModal: React.FC = () => {
  const {
    currentUser,
    isLoginModalOpen,
    setIsLoginModalOpen,
    loginAsAdmin,
    loginAsTeacher,
    loginAsStudent,
    logout,
  } = useAuth();

  const { teachers, students, setActiveTab } = useAcademic();

  const [activeTab, setActiveRoleTab] = useState<'admin' | 'teacher' | 'student'>('teacher');
  const [customTeacherId, setCustomTeacherId] = useState('');
  const [customStudentPrn, setCustomStudentPrn] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isLoginModalOpen) return null;

  const handleAdminLogin = () => {
    loginAsAdmin();
    setActiveTab('dashboard');
    setIsLoginModalOpen(false);
  };

  const handleTeacherSelect = (teacher: Teacher) => {
    loginAsTeacher(teacher);
    setActiveTab('teacher-dashboard');
    setIsLoginModalOpen(false);
  };

  const handleStudentSelect = (student: Student) => {
    loginAsStudent(student);
    setActiveTab('student-portal');
    setIsLoginModalOpen(false);
  };

  const handleCustomTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const found = teachers.find(
      (t) =>
        t.teacherId.toLowerCase() === customTeacherId.trim().toLowerCase() ||
        t.email.toLowerCase() === customTeacherId.trim().toLowerCase()
    );
    if (found) {
      handleTeacherSelect(found);
    } else {
      setError('Teacher ID or email not found in faculty directory.');
    }
  };

  const handleCustomStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const found = students.find(
      (s) =>
        s.prn.toLowerCase() === customStudentPrn.trim().toLowerCase() ||
        s.rollNumber.toLowerCase() === customStudentPrn.trim().toLowerCase()
    );
    if (found) {
      handleStudentSelect(found);
    } else {
      setError('Student PRN or Roll Number not found.');
    }
  };

  return (
    <div className="fixed inset-0 bg-[#071426]/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-[#D7E3EA] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#0B1F3A] p-6 text-white flex items-center justify-between border-b border-[#102A43]">
          <div className="flex items-center gap-3.5">
            <CollegeLogo className="w-11 h-11 shadow-md ring-2 ring-[#00D9FF]/40 rounded-full" />
            <div>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-[#102A43] text-[#00D9FF] border border-[#00D9FF]/30 rounded-md flex items-center gap-1 w-fit">
                <Sparkles className="w-3.5 h-3.5" />
                <span>EURO MANDAR Authentication</span>
              </span>
              <h3 className="text-xl font-black mt-1 text-white">Switch Role &amp; User Profile</h3>
              <p className="text-xs text-[#67E8F9] mt-0.5">
                Select or authenticate as Admin, Subject Faculty, or Student.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsLoginModalOpen(false)}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Selector Tabs */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-2 p-1 bg-[#F5F9FC] rounded-2xl border border-[#D7E3EA]">
            <button
              onClick={() => {
                setActiveRoleTab('admin');
                setError(null);
              }}
              className={`py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-[#0B1F3A] text-white shadow-sm border border-[#102A43]'
                  : 'text-[#64748B] hover:text-[#0B1F3A]'
              }`}
            >
              <Shield className={`w-4 h-4 ${activeTab === 'admin' ? 'text-[#00D9FF]' : ''}`} />
              <span>Admin</span>
            </button>

            <button
              onClick={() => {
                setActiveRoleTab('teacher');
                setError(null);
              }}
              className={`py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'teacher'
                  ? 'bg-[#0B1F3A] text-white shadow-sm border border-[#102A43]'
                  : 'text-[#64748B] hover:text-[#0B1F3A]'
              }`}
            >
              <UserCheck className={`w-4 h-4 ${activeTab === 'teacher' ? 'text-[#00D9FF]' : ''}`} />
              <span>Teacher</span>
            </button>

            <button
              onClick={() => {
                setActiveRoleTab('student');
                setError(null);
              }}
              className={`py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'student'
                  ? 'bg-[#0B1F3A] text-white shadow-sm border border-[#102A43]'
                  : 'text-[#64748B] hover:text-[#0B1F3A]'
              }`}
            >
              <GraduationCap className={`w-4 h-4 ${activeTab === 'student' ? 'text-[#00D9FF]' : ''}`} />
              <span>Student</span>
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl">
              {error}
            </div>
          )}

          {/* Admin Tab */}
          {activeTab === 'admin' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#F5F9FC] rounded-2xl border border-[#D7E3EA] flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-[#E6FCFF] text-[#0B1F3A] border border-[#67E8F9] rounded">
                    SUPER ADMINISTRATOR
                  </span>
                  <h4 className="text-base font-black text-[#0B1F3A] mt-1">Vedika Salekar</h4>
                  <p className="text-xs text-[#64748B]">vedikasalekar9@gmail.com</p>
                  <p className="text-[11px] text-[#0B1F3A] font-semibold mt-2">
                    Full college authority: All Departments, Faculty Management, Student Records, Marks Entry, &amp; System Configuration.
                  </p>
                </div>
              </div>

              <button
                onClick={handleAdminLogin}
                className="w-full py-3 bg-[#0B1F3A] hover:bg-[#102A43] border border-[#102A43] hover:border-[#00D9FF] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <LogIn className="w-4 h-4 text-[#00D9FF]" />
                <span>Continue as Admin (Vedika Salekar)</span>
              </button>
            </div>
          )}

          {/* Teacher Tab */}
          {activeTab === 'teacher' && (
            <div className="space-y-4">
              <div className="text-xs font-bold text-[#172B4D] uppercase tracking-wider">
                Select Active Faculty Member
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {teachers.map((t) => {
                  const isCurrent = currentUser?.teacherId === t.teacherId;
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleTeacherSelect(t)}
                      className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
                        isCurrent
                          ? 'bg-[#F5F9FC] border-[#00D9FF] text-[#0B1F3A] shadow-xs'
                          : 'bg-white border-[#D7E3EA] hover:border-[#00D9FF] hover:bg-[#F5F9FC] text-[#172B4D]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold group-hover:text-[#00D9FF] transition-colors">
                            {t.name}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-mono bg-[#E6FCFF] text-[#0B1F3A] border border-[#67E8F9] font-bold rounded">
                            {t.teacherId}
                          </span>
                        </div>
                        <div className="text-xs text-[#64748B] mt-0.5">
                          {t.department} • {t.assignedYears.join(', ')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isCurrent ? (
                          <span className="text-xs font-bold text-[#0B1F3A] flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-[#00D9FF]" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-[#00D9FF] group-hover:translate-x-0.5 transition-all" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleCustomTeacherLogin} className="pt-2 border-t border-[#D7E3EA]">
                <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
                  Or Enter Teacher ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. TCH001"
                    value={customTeacherId}
                    onChange={(e) => setCustomTeacherId(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-mono bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl focus:bg-white focus:ring-2 focus:ring-[#00D9FF]/20 focus:border-[#00D9FF] outline-none text-[#172B4D]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold bg-[#0B1F3A] hover:bg-[#102A43] border border-[#102A43] hover:border-[#00D9FF] text-white rounded-xl transition-all cursor-pointer active:scale-95 shadow-xs"
                  >
                    Login
                  </button>
                </div>
              </form>

              <div className="pt-2 border-t border-[#D7E3EA] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setIsLoginModalOpen(false);
                  }}
                  className="w-full py-2.5 px-3 bg-[#F5F9FC] hover:bg-[#E6FCFF] border border-[#D7E3EA] hover:border-[#00D9FF] text-[#0B1F3A] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-2xs"
                >
                  <Sparkles className="w-4 h-4 text-[#00D9FF]" />
                  <span>Enroll Yourself / Register New Teacher</span>
                </button>
              </div>
            </div>
          )}

          {/* Student Tab */}
          {activeTab === 'student' && (
            <div className="space-y-4">
              <div className="text-xs font-bold text-[#172B4D] uppercase tracking-wider">
                Select Sample Enrolled Student
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {students.slice(0, 6).map((st) => (
                  <button
                    key={st.id}
                    onClick={() => handleStudentSelect(st)}
                    className="w-full p-3.5 rounded-2xl border border-[#D7E3EA] bg-white hover:border-[#00D9FF] hover:bg-[#F5F9FC] text-left transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="text-sm font-bold text-[#172B4D] group-hover:text-[#00D9FF]">
                        {st.student_name || st.name}
                      </div>
                      <div className="text-xs text-[#64748B]">
                        Enrollment: <strong className="text-[#0B1F3A] font-mono">{st.enrollment_number || st.rollNumber || st.prn}</strong> • {st.department} ({st.year})
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-[#00D9FF] group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>

              <form onSubmit={handleCustomStudentLogin} className="pt-2 border-t border-[#D7E3EA]">
                <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
                  Or Lookup by PRN / Roll No
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 24110980111"
                    value={customStudentPrn}
                    onChange={(e) => setCustomStudentPrn(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-mono bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl focus:bg-white focus:ring-2 focus:ring-[#00D9FF]/20 focus:border-[#00D9FF] outline-none text-[#172B4D]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold bg-[#0B1F3A] hover:bg-[#102A43] border border-[#102A43] hover:border-[#00D9FF] text-white rounded-xl transition-all cursor-pointer active:scale-95 shadow-xs"
                  >
                    View Portal
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer Credit */}
        <div className="px-6 py-3 bg-[#F5F9FC] border-t border-[#D7E3EA] text-center text-[11px] text-[#64748B]">
          Developed by <span className="font-bold text-[#0B1F3A]">Vedika Satish Salekar</span>
        </div>
      </div>
    </div>
  );
};
