import React, { useState } from 'react';
import { CollegeLogo } from '../../assets/collegeLogo';
import {
  UserPlus,
  LogIn,
  BookOpen,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Shield,
  GraduationCap,
  ArrowRight,
  School,
  Lock,
  Mail,
  Phone,
  User,
  Hash,
} from 'lucide-react';
import { Department, AcademicYear, Division } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useAcademic } from '../../context/AcademicContext';

interface SubjectEntry {
  id: string;
  subjectName: string;
  subjectCode: string;
  unit1MaxMarks: number;
  unit2MaxMarks: number;
  year: AcademicYear;
}

export const TeacherEnrollmentPage: React.FC = () => {
  const {
    registerTeacher,
    loginWithCredentials,
    loginAsAdmin,
    loginAsStudent,
  } = useAuth();

  const {
    teachers,
    students,
    setActiveTab,
    showToast,
    refreshData,
  } = useAcademic();

  const [authMode, setAuthMode] = useState<'register' | 'teacher-login' | 'admin-login' | 'student-login'>('register');
  const [showPassword, setShowPassword] = useState(false);

  // Registration Form State
  const [fullName, setFullName] = useState('');
  const [teacherId, setTeacherId] = useState('TCH-CS-105');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState<Department>('Computer Engineering');
  const [academicYear, setAcademicYear] = useState('2024-2025');
  const [selectedYears, setSelectedYears] = useState<AcademicYear[]>(['2nd Year', '2nd Year DSY']);
  const [selectedDivisions, setSelectedDivisions] = useState<Division[]>(['A', 'B']);

  const [subjectsList, setSubjectsList] = useState<SubjectEntry[]>([
    {
      id: 'sub_1',
      subjectName: 'Operating System',
      subjectCode: 'CS401',
      unit1MaxMarks: 25,
      unit2MaxMarks: 25,
      year: '2nd Year',
    },
    {
      id: 'sub_2',
      subjectName: 'Cloud Computing',
      subjectCode: 'CS402',
      unit1MaxMarks: 25,
      unit2MaxMarks: 25,
      year: '2nd Year DSY',
    },
  ]);

  // Login States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [studentIdentifier, setStudentIdentifier] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const availableDepts: Department[] = [
    'Computer Engineering',
    'Civil Engineering',
    'Mechanical Engineering',
    'Electrical Engineering',
  ];

  const availableYears: AcademicYear[] = ['1st Year', '2nd Year', '3rd Year', '2nd Year DSY'];
  const availableDivisions: Division[] = ['A', 'B', 'C', 'D'];

  const toggleYear = (yr: AcademicYear) => {
    if (selectedYears.includes(yr)) {
      if (selectedYears.length > 1) {
        setSelectedYears(selectedYears.filter((y) => y !== yr));
      }
    } else {
      setSelectedYears([...selectedYears, yr]);
    }
  };

  const toggleDivision = (div: Division) => {
    if (selectedDivisions.includes(div)) {
      if (selectedDivisions.length > 1) {
        setSelectedDivisions(selectedDivisions.filter((d) => d !== div));
      }
    } else {
      setSelectedDivisions([...selectedDivisions, div]);
    }
  };

  const handleAddSubjectRow = () => {
    const nextCode = `SUB-${department.split(' ')[0].substring(0, 2).toUpperCase()}-${subjectsList.length + 1}0${subjectsList.length + 1}`;
    setSubjectsList([
      ...subjectsList,
      {
        id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        subjectName: '',
        subjectCode: nextCode,
        unit1MaxMarks: 25,
        unit2MaxMarks: 25,
        year: selectedYears[0] || '2nd Year',
      },
    ]);
  };

  const handleRemoveSubjectRow = (id: string) => {
    if (subjectsList.length <= 1) {
      showToast('At least one subject must be assigned to the teacher', 'error');
      return;
    }
    setSubjectsList(subjectsList.filter((s) => s.id !== id));
  };

  const handleUpdateSubject = (id: string, field: keyof SubjectEntry, value: any) => {
    setSubjectsList(
      subjectsList.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  // Quick-fill helper for demonstration
  const handleQuickFillPriyaPatil = () => {
    setFullName('Prof. Priya Patil');
    setTeacherId('TCH-CS-105');
    setEmail('priya.patil@institute.edu');
    setMobileNumber('+91 98221 55678');
    setPassword('priya@123');
    setConfirmPassword('priya@123');
    setDepartment('Computer Engineering');
    setAcademicYear('2024-2025');
    setSelectedYears(['2nd Year', '2nd Year DSY']);
    setSelectedDivisions(['A', 'B']);
    setSubjectsList([
      {
        id: 'sub_1',
        subjectName: 'Operating System',
        subjectCode: 'CS401',
        unit1MaxMarks: 25,
        unit2MaxMarks: 25,
        year: '2nd Year',
      },
      {
        id: 'sub_2',
        subjectName: 'Cloud Computing',
        subjectCode: 'CS402',
        unit1MaxMarks: 25,
        unit2MaxMarks: 25,
        year: '2nd Year DSY',
      },
      {
        id: 'sub_3',
        subjectName: 'Software Engineering',
        subjectCode: 'CS403',
        unit1MaxMarks: 25,
        unit2MaxMarks: 25,
        year: '2nd Year',
      },
    ]);
    setErrorMsg(null);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Please enter Teacher Full Name');
      return;
    }
    if (!teacherId.trim()) {
      setErrorMsg('Please enter Teacher ID (e.g. TCH-CS-105)');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Please enter Email Address');
      return;
    }
    if (password && password !== confirmPassword) {
      setErrorMsg('Password and Confirm Password do not match');
      return;
    }

    const validSubjects = subjectsList.filter((s) => s.subjectName.trim() !== '');
    if (validSubjects.length === 0) {
      setErrorMsg('Please enter at least one Subject Name');
      return;
    }

    const result = registerTeacher({
      name: fullName.trim(),
      teacherId: teacherId.trim().toUpperCase(),
      email: email.trim().toLowerCase(),
      phone: mobileNumber.trim() || '+91 98000 00000',
      password: password || 'teacher123',
      department,
      academicYear,
      assignedYears: selectedYears,
      divisions: selectedDivisions,
      subjects: validSubjects.map((s) => ({
        subjectName: s.subjectName.trim(),
        subjectCode: s.subjectCode.trim() || `SUB-${s.subjectName.substring(0, 3).toUpperCase()}`,
        unit1MaxMarks: s.unit1MaxMarks || 25,
        unit2MaxMarks: s.unit2MaxMarks || 25,
        year: s.year,
      })),
    });

    if (result.success) {
      refreshData();
      setActiveTab('teacher-dashboard');
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleTeacherLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!loginIdentifier.trim()) {
      setErrorMsg('Please enter your Teacher ID or Email');
      return;
    }
    const res = loginWithCredentials(loginIdentifier.trim(), loginPassword);
    if (res.success) {
      refreshData();
      setActiveTab('teacher-dashboard');
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleStudentLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!studentIdentifier.trim()) {
      setErrorMsg('Please enter your Student PRN or Roll Number');
      return;
    }
    const found = students.find(
      (s) =>
        s.prn.toLowerCase() === studentIdentifier.trim().toLowerCase() ||
        s.rollNumber.toLowerCase() === studentIdentifier.trim().toLowerCase() ||
        s.name.toLowerCase().includes(studentIdentifier.trim().toLowerCase())
    );
    if (found) {
      loginAsStudent(found);
      setActiveTab('student-portal');
    } else {
      setErrorMsg('Student PRN or Roll Number not found in directory.');
    }
  };

  return (
    <div className="min-h-screen bg-[#071426] text-white flex flex-col justify-between selection:bg-[#00D9FF] selection:text-[#071426]" id="teacher-enrollment-view">
      {/* Top Brand Header */}
      <header className="border-b border-[#102A43] bg-[#0B1F3A]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <CollegeLogo className="w-11 h-11 shadow-lg ring-2 ring-[#00D9FF]/40 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl text-white tracking-tight">
                  EURO MANDAR
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#00D9FF]/15 text-[#00D9FF] border border-[#00D9FF]/30">
                  Mandar Education Society
                </span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Rajaram Shinde Institute of Engineering and Technology
              </p>
              <p className="text-[10px] text-[#67E8F9]/90 font-medium mt-0.5 flex items-center gap-1">
                <span className="text-[#64748B]">Under the Guidance of</span>
                <span className="font-semibold text-[#00D9FF]">Prof. Sandesh A. Gajmal</span>
              </p>
            </div>
          </div>

          {/* Quick Tab Switcher */}
          <div className="flex items-center gap-2 bg-[#071426] p-1 rounded-xl border border-[#102A43] text-xs">
            <button
              onClick={() => {
                setAuthMode('register');
                setErrorMsg(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                authMode === 'register'
                  ? 'bg-[#00D9FF] text-[#071426] font-extrabold shadow-sm'
                  : 'text-[#64748B] hover:text-white'
              }`}
              id="tab-enroll-teacher"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Enroll Yourself</span>
            </button>
            <button
              onClick={() => {
                setAuthMode('teacher-login');
                setErrorMsg(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                authMode === 'teacher-login'
                  ? 'bg-[#00D9FF] text-[#071426] font-extrabold shadow-sm'
                  : 'text-[#64748B] hover:text-white'
              }`}
              id="tab-login-teacher"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Teacher Login</span>
            </button>
            <button
              onClick={() => {
                loginAsAdmin();
                setActiveTab('dashboard');
              }}
              className="px-2.5 py-1.5 rounded-lg font-semibold text-[#64748B] hover:text-[#67E8F9] transition-colors flex items-center gap-1"
              title="Login as Super Administrator Vedika Salekar"
              id="btn-admin-bypass"
            >
              <Shield className="w-3.5 h-3.5 text-[#00D9FF]" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10 flex flex-col justify-center">
        {authMode === 'register' && (
          <div className="bg-[#0B1F3A] border border-[#102A43] rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Enrollment Banner */}
            <div className="bg-gradient-to-r from-[#0B1F3A] via-[#102A43] to-[#071426] p-6 sm:p-8 text-white border-b border-[#102A43] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00D9FF]/15 text-[#00D9FF] border border-[#00D9FF]/30 text-xs font-semibold mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#00D9FF]" />
                  <span>Step 1: Faculty Self-Registration</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Teacher Registration & Onboarding
                </h1>
                <p className="text-sm text-[#67E8F9]/80 mt-1 max-w-2xl">
                  Register your faculty credentials, department, and assigned subjects & classes to immediately unlock your personalized teacher dashboard and student grade ledger.
                </p>
              </div>

              {/* 1-Click Auto Fill Demo Button */}
              <button
                type="button"
                onClick={handleQuickFillPriyaPatil}
                className="shrink-0 px-4 py-2.5 rounded-xl bg-[#102A43] hover:bg-[#102A43]/80 border border-[#00D9FF]/30 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg active:scale-95 text-left"
                id="btn-quick-fill-priya"
              >
                <Sparkles className="w-4 h-4 text-[#00D9FF]" />
                <div>
                  <span className="block text-[11px] text-[#67E8F9]">1-Click Demo Fill</span>
                  <span className="font-bold text-white">Prof. Priya Patil (CS Dept)</span>
                </div>
              </button>
            </div>

            {errorMsg && (
              <div className="mx-6 sm:mx-8 mt-6 p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-red-200 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleRegisterSubmit} className="p-6 sm:p-8 space-y-8">
              {/* Section 1: Personal & Account Information */}
              <div>
                <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#102A43] text-white">
                  <User className="w-4 h-4 text-[#00D9FF]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                    1. Faculty Information & Login Credentials
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Full Name */}
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="e.g. Prof. Priya Patil"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-[#071426] border border-[#102A43] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#00D9FF] focus:border-transparent transition-all"
                        id="teacher-fullname-input"
                      />
                    </div>
                  </div>

                  {/* Teacher ID */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Teacher ID <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. TCH-CS-105"
                      value={teacherId}
                      onChange={(e) => setTeacherId(e.target.value)}
                      className="w-full bg-[#071426] border border-[#102A43] rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#00D9FF] focus:border-transparent transition-all"
                      id="teacher-id-input"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="priya.patil@institute.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#071426] border border-[#102A43] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#00D9FF] focus:border-transparent transition-all"
                      id="teacher-email-input"
                    />
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98221 55678"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full bg-[#071426] border border-[#102A43] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#00D9FF] focus:border-transparent transition-all"
                      id="teacher-mobile-input"
                    />
                  </div>

                  {/* Academic Year */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Academic Year
                    </label>
                    <input
                      type="text"
                      placeholder="2024-2025"
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      className="w-full bg-[#071426] border border-[#102A43] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#00D9FF] focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#071426] border border-[#102A43] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#00D9FF] focus:border-transparent pr-10 transition-all"
                        id="teacher-password-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-[#64748B] hover:text-[#00D9FF]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Confirm Password <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#071426] border border-[#102A43] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#00D9FF] focus:border-transparent transition-all"
                      id="teacher-confirmpassword-input"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Department, Classes & Divisions */}
              <div>
                <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#102A43] text-white">
                  <Building2 className="w-4 h-4 text-[#00D9FF]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                    2. Department & Assigned Classes
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Department Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Department <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value as Department)}
                      className="w-full bg-[#071426] border border-[#102A43] rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#00D9FF]"
                      id="teacher-dept-select"
                    >
                      {availableDepts.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-[#64748B] mt-1">
                      Your dashboard and subject options will automatically tailor to this department.
                    </p>
                  </div>

                  {/* Year / Class Multi-Select */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Classes / Years Taught <span className="text-rose-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableYears.map((yr) => {
                        const isSelected = selectedYears.includes(yr);
                        return (
                          <button
                            type="button"
                            key={yr}
                            onClick={() => toggleYear(yr)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border text-left flex items-center justify-between ${
                              isSelected
                                ? 'bg-[#00D9FF]/20 border-[#00D9FF] text-[#00D9FF] shadow-xs'
                                : 'bg-[#071426] border-[#102A43] text-[#64748B] hover:text-white'
                            }`}
                          >
                            <span>{yr}</span>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#00D9FF]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Division Multi-Select */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Divisions Taught <span className="text-rose-400">*</span>
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {availableDivisions.map((div) => {
                        const isSelected = selectedDivisions.includes(div);
                        return (
                          <button
                            type="button"
                            key={div}
                            onClick={() => toggleDivision(div)}
                            className={`py-2 rounded-xl text-xs font-bold transition-all border text-center ${
                              isSelected
                                ? 'bg-[#00D9FF]/20 border-[#00D9FF] text-[#00D9FF] shadow-xs'
                                : 'bg-[#071426] border-[#102A43] text-[#64748B] hover:text-white'
                            }`}
                          >
                            Div {div}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-1.5">
                      Select which divisions you take lectures/practical tests for.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 3: Multiple Subjects Builder */}
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#102A43] text-white">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#00D9FF]" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                      3. Subjects Taught ({subjectsList.length} subjects)
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSubjectRow}
                    className="px-3 py-1.5 rounded-xl bg-[#00D9FF]/15 hover:bg-[#00D9FF]/25 border border-[#00D9FF]/40 text-[#00D9FF] text-xs font-bold transition-all flex items-center gap-1.5"
                    id="btn-add-subject-row"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Another Subject</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {subjectsList.map((subject, idx) => (
                    <div
                      key={subject.id}
                      className="p-4 rounded-2xl bg-[#071426] border border-[#102A43] grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                    >
                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
                          Subject #{idx + 1} Name <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Operating System"
                          value={subject.subjectName}
                          onChange={(e) => handleUpdateSubject(subject.id, 'subjectName', e.target.value)}
                          className="w-full bg-[#0B1F3A] border border-[#102A43] rounded-lg px-3 py-2 text-xs text-white placeholder-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#00D9FF]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
                          Subject Code
                        </label>
                        <input
                          type="text"
                          placeholder="CS401"
                          value={subject.subjectCode}
                          onChange={(e) => handleUpdateSubject(subject.id, 'subjectCode', e.target.value)}
                          className="w-full bg-[#0B1F3A] border border-[#102A43] rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#00D9FF]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
                          Target Class
                        </label>
                        <select
                          value={subject.year}
                          onChange={(e) => handleUpdateSubject(subject.id, 'year', e.target.value as AcademicYear)}
                          className="w-full bg-[#0B1F3A] border border-[#102A43] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00D9FF]"
                        >
                          {selectedYears.map((yr) => (
                            <option key={yr} value={yr}>
                              {yr}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-3 grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
                            U1 Max
                          </label>
                          <input
                            type="number"
                            min="10"
                            max="100"
                            value={subject.unit1MaxMarks}
                            onChange={(e) => handleUpdateSubject(subject.id, 'unit1MaxMarks', Number(e.target.value))}
                            className="w-full bg-[#0B1F3A] border border-[#102A43] rounded-lg px-2.5 py-2 text-xs text-white font-mono text-center focus:outline-none focus:ring-1 focus:ring-[#00D9FF]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
                            U2 Max
                          </label>
                          <input
                            type="number"
                            min="10"
                            max="100"
                            value={subject.unit2MaxMarks}
                            onChange={(e) => handleUpdateSubject(subject.id, 'unit2MaxMarks', Number(e.target.value))}
                            className="w-full bg-[#0B1F3A] border border-[#102A43] rounded-lg px-2.5 py-2 text-xs text-white font-mono text-center focus:outline-none focus:ring-1 focus:ring-[#00D9FF]"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveSubjectRow(subject.id)}
                          className="p-2 rounded-lg text-[#64748B] hover:text-rose-400 hover:bg-[#0B1F3A] transition-colors"
                          title="Remove this subject"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit & Register Button */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#102A43]">
                <div className="text-xs text-[#64748B]">
                  By enrolling, your account is saved permanently. You can log in anytime with your Teacher ID or Email.
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#00D9FF] hover:bg-[#67E8F9] text-[#071426] font-black text-sm shadow-xl hover:shadow-[#00D9FF]/20 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  id="btn-complete-enrollment"
                >
                  <span>Complete Enrollment & Launch Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Teacher Login Form */}
        {authMode === 'teacher-login' && (
          <div className="max-w-xl mx-auto w-full bg-[#0B1F3A] border border-[#102A43] rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-[#0B1F3A] via-[#102A43] to-[#071426] p-6 text-white text-center border-b border-[#102A43]">
              <div className="w-12 h-12 rounded-2xl bg-[#00D9FF]/20 border border-[#00D9FF]/40 flex items-center justify-center mx-auto mb-3">
                <LogIn className="w-6 h-6 text-[#00D9FF]" />
              </div>
              <h2 className="text-2xl font-black text-white">Teacher Portal Login</h2>
              <p className="text-xs text-[#67E8F9]/80 mt-1">
                Enter your Teacher ID or registered email address to access your subjects and classes.
              </p>
            </div>

            {errorMsg && (
              <div className="mx-6 mt-6 p-3.5 rounded-xl bg-red-950/40 border border-red-500/50 text-red-200 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleTeacherLoginSubmit} className="p-6 sm:p-8 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Teacher ID or Registered Email
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. TCH-CS-101 or rahul.patil@enggcollege.edu"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full bg-[#071426] border border-[#102A43] rounded-xl px-4 py-3 text-sm text-white placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#00D9FF]"
                    id="teacher-login-id-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-[#071426] border border-[#102A43] rounded-xl px-4 py-3 text-sm text-white placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#00D9FF] pr-10"
                    id="teacher-login-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-[#64748B] hover:text-[#00D9FF]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#00D9FF] hover:bg-[#67E8F9] text-[#071426] font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                id="btn-teacher-login-submit"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In to Teacher Dashboard</span>
              </button>

              {/* Quick Preset Logins */}
              <div className="pt-4 border-t border-[#102A43]">
                <span className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
                  Or 1-Click Fast Login as Existing Faculty:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {teachers.slice(0, 4).map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => {
                        loginWithCredentials(t.teacherId);
                        setActiveTab('teacher-dashboard');
                      }}
                      className="p-2.5 rounded-xl bg-[#071426] hover:bg-[#102A43] border border-[#102A43] hover:border-[#00D9FF]/50 text-left transition-all group"
                    >
                      <div className="text-xs font-bold text-slate-200 group-hover:text-[#00D9FF]">
                        {t.name}
                      </div>
                      <div className="text-[10px] text-[#64748B] flex items-center justify-between mt-0.5">
                        <span>{t.department.split(' ')[0]}</span>
                        <span className="font-mono text-[#00D9FF]">{t.teacherId}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setErrorMsg(null);
                  }}
                  className="text-xs text-[#00D9FF] hover:text-[#67E8F9] font-semibold cursor-pointer"
                >
                  Don't have an account yet? Click here to Enroll Yourself →
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 3: Student Login Form */}
        {authMode === 'student-login' && (
          <div className="max-w-md mx-auto w-full bg-[#0B1F3A] border border-[#102A43] rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-[#0B1F3A] via-[#102A43] to-[#071426] p-6 text-white text-center border-b border-[#102A43]">
              <GraduationCap className="w-8 h-8 text-[#00D9FF] mx-auto mb-2" />
              <h2 className="text-xl font-bold">Student Result Portal</h2>
              <p className="text-xs text-[#67E8F9]/80 mt-1">
                Enter your Roll Number or PRN to check your Unit 1 and Unit 2 performance.
              </p>
            </div>

            <form onSubmit={handleStudentLoginSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Roll Number or PRN Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS-201 or 2024CS001"
                  value={studentIdentifier}
                  onChange={(e) => setStudentIdentifier(e.target.value)}
                  className="w-full bg-[#071426] border border-[#102A43] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#00D9FF]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#00D9FF] hover:bg-[#67E8F9] text-[#071426] font-bold text-xs shadow-lg transition-all cursor-pointer"
              >
                View My Academic Marks & Report Card
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="text-xs text-[#64748B] hover:text-white"
                >
                  ← Back to Faculty Registration
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#102A43] bg-[#0B1F3A]/80 py-4 text-center text-xs text-[#64748B]">
        EURO MANDAR Academic Management • Continuous Evaluation (Unit 1 & Unit 2)
      </footer>
    </div>
  );
};
