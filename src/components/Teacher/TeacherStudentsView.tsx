import React, { useState } from 'react';
import { useAcademic } from '../../context/AcademicContext';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Search,
  BookOpen,
  Edit,
  UserCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  X,
  GraduationCap,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { AcademicYear, Division, Student } from '../../types';
import {
  calculatePercentage,
  getPerformanceRating,
  getPerformanceBadgeClasses,
  detectImprovement,
} from '../../utils/calculations';

export const TeacherStudentsView: React.FC = () => {
  const {
    students,
    subjects,
    marks,
    teachers,
    saveMarksForStudent,
    setSelectedStudentProfile,
  } = useAcademic();
  const { currentUser, isTeacher } = useAuth();

  // Active teacher
  const currentTeacher = isTeacher && currentUser?.teacherId
    ? teachers.find((t) => t.teacherId === currentUser.teacherId || t.id === currentUser.id)
    : teachers[0];

  const assignedSubjectIds = currentTeacher?.assignedSubjects || [];
  const assignedSubjects = subjects.filter((s) => assignedSubjectIds.includes(s.id));

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    assignedSubjects.length > 0 ? assignedSubjects[0].id : (subjects[0]?.id || '')
  );

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId);

  const [selectedYear, setSelectedYear] = useState<AcademicYear>(
    activeSubject?.year || '2nd Year'
  );
  const [selectedDivision, setSelectedDivision] = useState<Division | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected student for focused teacher view modal
  const [focusedStudent, setFocusedStudent] = useState<Student | null>(null);
  const [editModalStudent, setEditModalStudent] = useState<Student | null>(null);

  // Quick edit state for edit modal
  const [editU1, setEditU1] = useState<number>(0);
  const [editU2, setEditU2] = useState<number>(0);
  const [editRemarks, setEditRemarks] = useState<string>('');

  // Filter students based on subject, dept, year, division, and search
  const filteredStudents = students.filter((s) => {
    if (!activeSubject) return false;
    const matchDept = s.department === activeSubject.department;
    const matchYear = s.year === selectedYear;
    const matchDiv = selectedDivision === 'All' || s.division === selectedDivision;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.rollNumber.toLowerCase().includes(q) ||
      s.prn.toLowerCase().includes(q);

    return matchDept && matchYear && matchDiv && matchSearch;
  });

  const handleOpenEditModal = (student: Student) => {
    if (!activeSubject) return;
    const mark = marks.find((m) => m.studentId === student.id && m.subjectId === activeSubject.id);
    setEditU1(mark ? mark.unit1Marks : 0);
    setEditU2(mark ? mark.unit2Marks : 0);
    setEditRemarks(mark?.remarks || '');
    setEditModalStudent(student);
  };

  const handleSaveMarks = () => {
    if (!editModalStudent || !activeSubject) return;

    saveMarksForStudent(
      editModalStudent.id,
      [
        {
          subjectId: activeSubject.id,
          unit1Marks: Number(editU1),
          unit1MaxMarks: activeSubject.unit1MaxMarks,
          unit2Marks: Number(editU2),
          unit2MaxMarks: activeSubject.unit2MaxMarks,
          remarks: editRemarks,
        },
      ],
      {
        id: currentUser?.id || 'admin',
        name: currentUser?.name || 'Faculty',
        teacherId: currentUser?.teacherId,
        role: currentUser?.role,
      }
    );

    setEditModalStudent(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="teacher-students-view">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-[#D7E3EA] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-bold bg-[#F5F9FC] text-[#0094B3] border border-[#D7E3EA] rounded-md">
              My Students • Assigned Roster
            </span>
            <span className="text-xs text-[#64748B]">
              Faculty: <strong className="text-[#172B4D]">{currentTeacher?.name || currentUser?.name}</strong>
            </span>
          </div>
          <h2 className="text-xl font-black text-[#172B4D] tracking-tight">
            Assigned Students &amp; Performance Records
          </h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            View student results for your assigned subjects, track individual progress, and update examination marks.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-[#172B4D] bg-[#F5F9FC] px-3.5 py-2 rounded-xl border border-[#D7E3EA]">
          <Users className="w-4 h-4 text-[#0094B3]" />
          <span>{filteredStudents.length} Students in Selected Class</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#D7E3EA] shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Subject Filter */}
          <div>
            <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">
              My Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                const sub = subjects.find((s) => s.id === e.target.value);
                if (sub) setSelectedYear(sub.year);
              }}
              className="w-full px-3 py-2 text-sm bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl focus:bg-white focus:outline-none focus:border-[#00D9FF] font-medium text-[#172B4D]"
              id="my-students-subject-select"
            >
              {assignedSubjects.length > 0 ? (
                assignedSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.subjectName} ({s.subjectCode})
                  </option>
                ))
              ) : (
                subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.subjectName} ({s.subjectCode})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Class / Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value as AcademicYear)}
              className="w-full px-3 py-2 text-sm bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl focus:bg-white focus:outline-none focus:border-[#00D9FF] font-medium text-[#172B4D]"
              id="my-students-year-select"
            >
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="2nd Year DSY">2nd Year DSY</option>
              <option value="3rd Year">3rd Year</option>
            </select>
          </div>

          {/* Division Filter */}
          <div>
            <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Division
            </label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value as Division | 'All')}
              className="w-full px-3 py-2 text-sm bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl focus:bg-white focus:outline-none focus:border-[#00D9FF] font-medium text-[#172B4D]"
              id="my-students-division-select"
            >
              <option value="All">All Divisions (A, B, C)</option>
              <option value="A">Division A</option>
              <option value="B">Division B</option>
              <option value="C">Division C</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Search Student
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Name, Roll No, PRN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl focus:bg-white focus:outline-none focus:border-[#00D9FF] text-[#172B4D]"
                id="my-students-search-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-[#D7E3EA] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse" id="my-students-table">
            <thead>
              <tr className="bg-[#F5F9FC] border-b border-[#D7E3EA] text-[#0B1F3A] text-xs uppercase font-bold tracking-wider">
                <th className="py-3.5 px-4">Roll No</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-3">Div</th>
                <th className="py-3.5 px-4 text-center">Unit 1 ({activeSubject?.unit1MaxMarks || 25})</th>
                <th className="py-3.5 px-4 text-center">Unit 2 ({activeSubject?.unit2MaxMarks || 25})</th>
                <th className="py-3.5 px-4 text-center">Average</th>
                <th className="py-3.5 px-4 text-center">Percentage</th>
                <th className="py-3.5 px-4 text-center">Rating</th>
                <th className="py-3.5 px-4 text-center">Trend</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D7E3EA] font-medium text-[#172B4D]">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const mark = activeSubject
                    ? marks.find((m) => m.studentId === student.id && m.subjectId === activeSubject.id)
                    : undefined;

                  const u1 = mark ? mark.unit1Marks : 0;
                  const u1Max = mark ? mark.unit1MaxMarks : (activeSubject?.unit1MaxMarks || 25);
                  const u2 = mark ? mark.unit2Marks : 0;
                  const u2Max = mark ? mark.unit2MaxMarks : (activeSubject?.unit2MaxMarks || 25);

                  const u1Pct = calculatePercentage(u1, u1Max);
                  const u2Pct = calculatePercentage(u2, u2Max);
                  const avgMarks = Math.round(((u1 + u2) / 2) * 10) / 10;
                  const avgMax = Math.round(((u1Max + u2Max) / 2) * 10) / 10;
                  const avgPct = calculatePercentage(avgMarks, avgMax);

                  const rating = getPerformanceRating(avgPct);
                  const badgeClasses = getPerformanceBadgeClasses(rating);
                  const { trend, delta } = detectImprovement(u1Pct, u2Pct);

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-[#F5F9FC]/60 transition-colors group cursor-pointer"
                      onClick={() => setFocusedStudent(student)}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#172B4D] text-xs">
                        {student.rollNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#172B4D] group-hover:text-[#0094B3] transition-colors">
                          {student.name}
                        </div>
                        <div className="text-[11px] text-[#64748B] font-mono">PRN: {student.prn}</div>
                      </td>
                      <td className="py-3 px-3 text-xs">
                        <span className="px-2 py-0.5 bg-[#F5F9FC] text-[#0B1F3A] border border-[#D7E3EA] rounded font-semibold">
                          {student.division}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-[#172B4D]">
                        {u1}/{u1Max}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-[#172B4D]">
                        {u2}/{u2Max}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-[#172B4D]">
                        {avgMarks}/{avgMax}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-[#0094B3]">
                        {avgPct}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold rounded-md border ${badgeClasses.bg}`}
                        >
                          {rating}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {trend === 'Improved' ? (
                          <span className="inline-flex items-center gap-1 text-[#16A34A] text-xs font-semibold">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>+{delta}%</span>
                          </span>
                        ) : trend === 'Declined' ? (
                          <span className="inline-flex items-center gap-1 text-[#EF4444] text-xs font-semibold">
                            <TrendingDown className="w-3.5 h-3.5" />
                            <span>{delta}%</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#64748B] text-xs">
                            <Minus className="w-3.5 h-3.5" />
                            <span>0%</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenEditModal(student)}
                            className="px-2.5 py-1 text-xs font-bold bg-[#0B1F3A] hover:bg-[#102A43] text-[#00D9FF] rounded-lg transition-all flex items-center gap-1 border border-[#00D9FF]/30 cursor-pointer"
                            title="Edit marks for this student"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Marks</span>
                          </button>

                          <button
                            onClick={() => setSelectedStudentProfile(student)}
                            className="px-2 py-1 text-xs font-semibold text-[#64748B] hover:text-[#0B1F3A] hover:bg-[#F5F9FC] rounded-lg transition-all cursor-pointer"
                            title="View Full College Profile"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#64748B]">
                    <Users className="w-10 h-10 mx-auto mb-2 text-[#64748B]" />
                    <p className="text-sm font-bold text-[#172B4D]">No students found</p>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Adjust your division filter or search query.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Focused Student Performance View (Teacher's View Specification) */}
      {focusedStudent && activeSubject && (
        <div className="fixed inset-0 bg-[#071426]/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-[#D7E3EA] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#0B1F3A] p-6 text-white flex items-start justify-between border-b border-[#00D9FF]/20">
              <div>
                <span className="px-2.5 py-0.5 text-xs font-bold bg-[#102A43] text-[#00D9FF] border border-[#00D9FF]/30 rounded-md">
                  Student Performance (Teacher's View)
                </span>
                <h3 className="text-xl font-bold mt-1 text-white">{focusedStudent.name}</h3>
                <p className="text-xs text-[#67E8F9] mt-0.5">
                  Roll No: <strong>{focusedStudent.rollNumber}</strong> • PRN: {focusedStudent.prn} • {focusedStudent.department} ({focusedStudent.year}, Div {focusedStudent.division})
                </p>
              </div>
              <button
                onClick={() => setFocusedStudent(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {(() => {
              const mark = marks.find(
                (m) => m.studentId === focusedStudent.id && m.subjectId === activeSubject.id
              );
              const u1 = mark ? mark.unit1Marks : 0;
              const u1Max = mark ? mark.unit1MaxMarks : activeSubject.unit1MaxMarks;
              const u2 = mark ? mark.unit2Marks : 0;
              const u2Max = mark ? mark.unit2MaxMarks : activeSubject.unit2MaxMarks;

              const u1Pct = calculatePercentage(u1, u1Max);
              const u2Pct = calculatePercentage(u2, u2Max);
              const avgMarks = Math.round(((u1 + u2) / 2) * 10) / 10;
              const avgMax = Math.round(((u1Max + u2Max) / 2) * 10) / 10;
              const avgPct = calculatePercentage(avgMarks, avgMax);

              const rating = getPerformanceRating(avgPct);
              const badgeClasses = getPerformanceBadgeClasses(rating);
              const { trend, delta } = detectImprovement(u1Pct, u2Pct);

              return (
                <div className="p-6 space-y-5">
                  {/* Subject Title Card */}
                  <div className="bg-[#F5F9FC] p-4 rounded-2xl border border-[#D7E3EA] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Subject</span>
                      <h4 className="text-base font-bold text-[#172B4D]">{activeSubject.subjectName}</h4>
                      <p className="text-xs text-[#64748B] font-mono">Code: {activeSubject.subjectCode}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Faculty</span>
                      <p className="text-xs font-bold text-[#0094B3]">{currentTeacher?.name || currentUser?.name}</p>
                    </div>
                  </div>

                  {/* Marks Breakdown Grid */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-[#F5F9FC] p-3.5 rounded-xl border border-[#D7E3EA]">
                      <div className="text-xs font-bold text-[#0B1F3A] uppercase">Unit 1</div>
                      <div className="text-2xl font-black text-[#172B4D] mt-0.5">{u1}/{u1Max}</div>
                      <div className="text-[11px] text-[#64748B] font-semibold">{u1Pct}%</div>
                    </div>

                    <div className="bg-[#F5F9FC] p-3.5 rounded-xl border border-[#D7E3EA]">
                      <div className="text-xs font-bold text-[#0094B3] uppercase">Unit 2</div>
                      <div className="text-2xl font-black text-[#172B4D] mt-0.5">{u2}/{u2Max}</div>
                      <div className="text-[11px] text-[#64748B] font-semibold">{u2Pct}%</div>
                    </div>

                    <div className="bg-[#F5F9FC] p-3.5 rounded-xl border border-[#D7E3EA]">
                      <div className="text-xs font-bold text-[#16A34A] uppercase">Average</div>
                      <div className="text-2xl font-black text-[#172B4D] mt-0.5">{avgMarks}/{avgMax}</div>
                      <div className="text-[11px] text-[#16A34A] font-bold">{avgPct}%</div>
                    </div>
                  </div>

                  {/* Classification & Trend Banner */}
                  <div className="bg-[#F5F9FC] p-4 rounded-2xl border border-[#D7E3EA] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#64748B]">Performance Classification:</span>
                      <span className={`px-2.5 py-0.5 text-xs font-bold rounded-md border ${badgeClasses.bg}`}>
                        {rating}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#D7E3EA] pt-2 text-xs">
                      <span className="font-bold text-[#64748B]">Improvement Status:</span>
                      <span className="font-bold">
                        {trend === 'Improved' ? (
                          <span className="text-[#16A34A] flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            <span>+{delta}% Improvement</span>
                          </span>
                        ) : trend === 'Declined' ? (
                          <span className="text-[#EF4444] flex items-center gap-1">
                            <TrendingDown className="w-4 h-4" />
                            <span>{delta}% Decline</span>
                          </span>
                        ) : (
                          <span className="text-[#64748B]">Consistent Score</span>
                        )}
                      </span>
                    </div>

                    {/* Natural statement */}
                    <div className="p-3 bg-white rounded-xl border border-[#D7E3EA] text-xs text-[#172B4D] leading-relaxed font-medium">
                      {trend === 'Improved' ? (
                        <p className="text-[#16A34A] flex items-center gap-1.5 font-semibold">
                          <span>📈</span>
                          <span><strong>{focusedStudent.name}</strong> has improved from Unit 1 ({u1}/{u1Max}) to Unit 2 ({u2}/{u2Max}) by <strong>+{delta}%</strong>.</span>
                        </p>
                      ) : trend === 'Declined' ? (
                        <p className="text-[#EF4444] flex items-center gap-1.5 font-semibold">
                          <span>📉</span>
                          <span><strong>{focusedStudent.name}</strong> scored lower in Unit 2 ({u2}/{u2Max}) compared to Unit 1 ({u1}/{u1Max}) by <strong>{delta}%</strong>. Faculty remediation recommended.</span>
                        </p>
                      ) : (
                        <p className="text-[#172B4D] flex items-center gap-1.5 font-medium">
                          <span>📊</span>
                          <span><strong>{focusedStudent.name}</strong> has maintained consistent marks across both Unit 1 and Unit 2 examinations.</span>
                        </p>
                      )}
                    </div>

                    {mark?.remarks && (
                      <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                        <strong className="text-amber-900">Teacher Remarks:</strong> {mark.remarks}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => {
                        const std = focusedStudent;
                        setFocusedStudent(null);
                        setSelectedStudentProfile(std);
                      }}
                      className="text-xs font-bold text-[#0094B3] hover:text-[#0B1F3A] flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All Subjects Profile</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const std = focusedStudent;
                          setFocusedStudent(null);
                          handleOpenEditModal(std);
                        }}
                        className="px-4 py-2 text-xs font-bold bg-[#0B1F3A] hover:bg-[#102A43] text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 border border-[#00D9FF]/30 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-[#00D9FF]" />
                        <span>Update Subject Marks</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Quick Edit Modal for Single Student */}
      {editModalStudent && activeSubject && (
        <div className="fixed inset-0 bg-[#071426]/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#D7E3EA] shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#0094B3] uppercase tracking-wider">
                  Marks Entry Form
                </span>
                <h3 className="text-lg font-bold text-[#172B4D]">{editModalStudent.name}</h3>
                <p className="text-xs text-[#64748B] font-medium">
                  {activeSubject.subjectName} ({activeSubject.subjectCode})
                </p>
              </div>
              <button
                onClick={() => setEditModalStudent(null)}
                className="p-1 rounded-lg text-[#64748B] hover:text-[#172B4D] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#172B4D] mb-1">
                  Unit 1 Marks (Max {activeSubject.unit1MaxMarks})
                </label>
                <input
                  type="number"
                  min="0"
                  max={activeSubject.unit1MaxMarks}
                  value={editU1}
                  onChange={(e) => setEditU1(Number(e.target.value))}
                  className="w-full px-3 py-2 text-base font-bold text-[#172B4D] bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl focus:bg-white focus:border-[#00D9FF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172B4D] mb-1">
                  Unit 2 Marks (Max {activeSubject.unit2MaxMarks})
                </label>
                <input
                  type="number"
                  min="0"
                  max={activeSubject.unit2MaxMarks}
                  value={editU2}
                  onChange={(e) => setEditU2(Number(e.target.value))}
                  className="w-full px-3 py-2 text-base font-bold text-[#172B4D] bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl focus:bg-white focus:border-[#00D9FF] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B4D] mb-1">
                Faculty Remarks (Optional)
              </label>
              <textarea
                rows={2}
                value={editRemarks}
                onChange={(e) => setEditRemarks(e.target.value)}
                placeholder="Enter feedback or performance guidance note..."
                className="w-full px-3 py-2 text-xs text-[#172B4D] bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl focus:bg-white focus:border-[#00D9FF] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D7E3EA]">
              <button
                onClick={() => setEditModalStudent(null)}
                className="px-4 py-2 text-xs font-bold text-[#64748B] hover:bg-[#F5F9FC] rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMarks}
                className="px-4 py-2 text-xs font-bold bg-[#0B1F3A] hover:bg-[#102A43] text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 border border-[#00D9FF]/30 cursor-pointer"
              >
                <Save className="w-4 h-4 text-[#00D9FF]" />
                <span>Save Marks</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
