import React, { useState } from 'react';
import { useAcademic } from '../../context/AcademicContext';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen,
  Users,
  Award,
  TrendingUp,
  TrendingDown,
  Layers,
  Edit,
  Save,
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  Sparkles,
  ChevronRight,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  Printer,
  Plus,
} from 'lucide-react';
import { AcademicYear, Division, Subject, Student, PerformanceRating } from '../../types';
import { getPerformanceBadgeClasses, calculatePercentage, getPerformanceRating, detectImprovement } from '../../utils/calculations';
import { exportSummariesToExcel } from '../../utils/excelExport';

export const MySubjectsView: React.FC = () => {
  const {
    subjects,
    students,
    teachers,
    marks,
    getTeacherSubjectStats,
    getStudentSummary,
    batchSaveMarks,
    setSelectedStudentProfile,
    setSelectedStudentForMarks,
    setActiveTab,
    showToast,
  } = useAcademic();

  const { currentUser, isTeacher } = useAuth();

  // Active teacher identification
  const currentTeacher = isTeacher && currentUser?.teacherId
    ? teachers.find((t) => t.teacherId === currentUser.teacherId || t.id === currentUser.id)
    : teachers[0];

  const assignedSubjectIds = currentTeacher?.assignedSubjects || [];
  const assignedYears = currentTeacher?.assignedYears || ['2nd Year', '2nd Year DSY'];
  const assignedDivisions = currentTeacher?.divisions || ['A', 'B'];
  const teacherDept = currentTeacher?.department || currentUser?.department || 'Computer Engineering';

  const mySubjects = subjects.filter((s) => assignedSubjectIds.includes(s.id));

  // Selected Subject & Class drill-down state
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    mySubjects[0]?.id || (subjects[0]?.id ?? '')
  );
  const [selectedYear, setSelectedYear] = useState<AcademicYear>(
    mySubjects[0]?.year || assignedYears[0] || '2nd Year'
  );
  const [selectedDivision, setSelectedDivision] = useState<Division | 'All'>('All');
  const [searchFilter, setSearchFilter] = useState('');
  const [sortField, setSortField] = useState<'rollNumber' | 'name' | 'average' | 'unit1' | 'unit2'>('rollNumber');
  const [sortAsc, setSortAsc] = useState(true);

  // Quick inline mark edits in this table
  const [editingMarks, setEditingMarks] = useState<
    Record<string, { u1: number | string; u2: number | string; remarks?: string }>
  >({});
  const [isSaving, setIsSaving] = useState(false);

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) || mySubjects[0];

  // When subject changes, keep year synced if applicable
  const handleSubjectSelect = (sub: Subject) => {
    setSelectedSubjectId(sub.id);
    if (sub.year && assignedYears.includes(sub.year)) {
      setSelectedYear(sub.year);
    }
  };

  // Enrolled students in the selected class and subject
  const enrolledStudents = students.filter(
    (s) =>
      s.department === teacherDept &&
      (s.year === selectedYear || (selectedYear === '2nd Year DSY' && s.year === '2nd Year DSY')) &&
      (selectedDivision === 'All' || s.division === selectedDivision)
  );

  // Filtered students by search
  const filteredStudents = enrolledStudents.filter((s) => {
    const q = searchFilter.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.rollNumber.toLowerCase().includes(q) ||
      s.prn.toLowerCase().includes(q)
    );
  });

  // Calculate subject stats
  const subjectStats = activeSubject
    ? getTeacherSubjectStats(activeSubject.id, selectedYear, selectedDivision)
    : null;

  // Student rows with their current marks for this subject
  const studentRows = filteredStudents.map((student) => {
    const markRecord = marks.find(
      (m) => m.studentId === student.id && m.subjectId === (activeSubject?.id || '')
    );
    const u1 = markRecord?.unit1Marks ?? 0;
    const u1Max = activeSubject?.unit1MaxMarks ?? 25;
    const u2 = markRecord?.unit2Marks ?? 0;
    const u2Max = activeSubject?.unit2MaxMarks ?? 25;

    const u1Pct = calculatePercentage(u1, u1Max);
    const u2Pct = calculatePercentage(u2, u2Max);
    const avgMarks = Math.round(((u1 + u2) / 2) * 10) / 10;
    const avgMax = Math.round(((u1Max + u2Max) / 2) * 10) / 10;
    const avgPct = calculatePercentage(avgMarks, avgMax);
    const rating = getPerformanceRating(avgPct);
    const trend = detectImprovement(u1Pct, u2Pct).trend;

    return {
      student,
      markRecord,
      u1,
      u1Max,
      u2,
      u2Max,
      u1Pct,
      u2Pct,
      avgMarks,
      avgPct,
      rating,
      trend,
    };
  });

  // Sort student rows
  const sortedRows = [...studentRows].sort((a, b) => {
    let comp = 0;
    if (sortField === 'rollNumber') comp = a.student.rollNumber.localeCompare(b.student.rollNumber);
    else if (sortField === 'name') comp = a.student.name.localeCompare(b.student.name);
    else if (sortField === 'average') comp = a.avgPct - b.avgPct;
    else if (sortField === 'unit1') comp = a.u1Pct - b.u1Pct;
    else if (sortField === 'unit2') comp = b.u2Pct - b.u2Pct;
    return sortAsc ? comp : -comp;
  });

  const handleInlineChange = (studentId: string, field: 'u1' | 'u2', val: string) => {
    const num = val === '' ? '' : Math.max(0, Math.min(25, Number(val)));
    setEditingMarks((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: num,
      },
    }));
  };

  const handleSaveAllInlineMarks = () => {
    if (!activeSubject) return;
    setIsSaving(true);
    const updates: any[] = [];

    Object.entries(editingMarks).forEach(([studentId, vals]: [string, { u1: number | string; u2: number | string; remarks?: string }]) => {
      const student = students.find((s) => s.id === studentId);
      if (!student) return;
      const currentRecord = marks.find(
        (m) => m.studentId === studentId && m.subjectId === activeSubject.id
      );

      const u1 = vals.u1 !== undefined && vals.u1 !== '' ? Number(vals.u1) : (currentRecord?.unit1Marks ?? 0);
      const u2 = vals.u2 !== undefined && vals.u2 !== '' ? Number(vals.u2) : (currentRecord?.unit2Marks ?? 0);

      updates.push({
        studentId,
        subjectId: activeSubject.id,
        unit1Marks: u1,
        unit1MaxMarks: activeSubject.unit1MaxMarks,
        unit2Marks: u2,
        unit2MaxMarks: activeSubject.unit2MaxMarks,
      });
    });

    if (updates.length === 0) {
      setIsSaving(false);
      return;
    }

    const res = batchSaveMarks(updates, {
      id: currentTeacher?.id || 'tch_custom',
      name: currentTeacher?.name || 'Faculty',
      teacherId: currentTeacher?.teacherId,
    });

    if (res.success) {
      setEditingMarks({});
    } else {
      showToast(res.message, 'error');
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="my-subjects-view">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#D7E3EA] shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#0094B3] uppercase tracking-wider mb-1">
            <UserCheck className="w-4 h-4 text-[#00D9FF]" />
            <span>Faculty Personal Academic Ledger</span>
          </div>
          <h1 className="text-2xl font-black text-[#172B4D] tracking-tight">
            My Subjects &amp; Class Ledgers
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            {teacherDept} • {currentTeacher?.name} ({currentTeacher?.teacherId})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('batch-marks')}
            className="px-4 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#102A43] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 active:scale-95 border border-[#00D9FF]/30 cursor-pointer"
            id="btn-goto-batch-marks"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#00D9FF]" />
            <span>Open Full Marks Grid</span>
          </button>
          <button
            onClick={() => {
              const summaries = enrolledStudents.map((s) => getStudentSummary(s.id)).filter(Boolean) as any;
              exportSummariesToExcel(summaries, `${activeSubject?.subjectName || 'Subject'}_Ledger.xlsx`);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-[#F5F9FC] hover:bg-[#D7E3EA] text-[#0B1F3A] font-bold text-xs transition-all flex items-center gap-2 border border-[#D7E3EA] cursor-pointer"
          >
            <FileText className="w-4 h-4 text-[#16A34A]" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Subject Cards Selector Carousel */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
            Select Your Assigned Subject:
          </span>
          <span className="text-xs text-[#64748B] font-semibold">
            {mySubjects.length} subjects registered
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mySubjects.map((sub) => {
            const isSelected = sub.id === selectedSubjectId;
            const stats = getTeacherSubjectStats(sub.id, sub.year, 'All');

            return (
              <div
                key={sub.id}
                onClick={() => handleSubjectSelect(sub)}
                className={`p-5 rounded-2xl cursor-pointer transition-all border text-left relative overflow-hidden ${
                  isSelected
                    ? 'bg-[#0B1F3A] text-white border-[#00D9FF] shadow-lg ring-2 ring-[#00D9FF]/30 scale-[1.01]'
                    : 'bg-white text-[#172B4D] border-[#D7E3EA] hover:border-[#00D9FF] hover:shadow-md'
                }`}
                id={`card-subject-${sub.id}`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        isSelected
                          ? 'bg-[#102A43] text-[#00D9FF] border border-[#00D9FF]/30'
                          : 'bg-[#F5F9FC] text-[#0B1F3A] border border-[#D7E3EA]'
                      }`}
                    >
                      {sub.subjectCode}
                    </span>
                    <h3 className="text-lg font-bold mt-1 tracking-tight">{sub.subjectName}</h3>
                  </div>

                  {isSelected && (
                    <span className="w-3 h-3 rounded-full bg-[#00D9FF] ring-4 ring-[#00D9FF]/30" />
                  )}
                </div>

                <div className="text-xs space-y-1 opacity-90 mb-4">
                  <p className={isSelected ? 'text-[#67E8F9]' : 'text-[#64748B]'}>
                    Classes: {sub.year} • {teacherDept.split(' ')[0]}
                  </p>
                  <p className={isSelected ? 'text-[#67E8F9]/80' : 'text-[#64748B]'}>
                    Max: U1 {sub.unit1MaxMarks}M | U2 {sub.unit2MaxMarks}M
                  </p>
                </div>

                {/* Quick Subject Metric Footer */}
                {stats && (
                  <div
                    className={`pt-3 border-t flex items-center justify-between text-xs font-semibold ${
                      isSelected ? 'border-white/10 text-[#67E8F9]' : 'border-[#D7E3EA] text-[#64748B]'
                    }`}
                  >
                    <span>Avg: {stats.classAveragePercentage}%</span>
                    <span className="flex items-center gap-1 text-[#00D9FF] font-bold">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{stats.improvedCount} improved</span>
                    </span>
                    <span>{stats.totalStudents} students</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Class & Division Filters for the Selected Subject */}
      {activeSubject && (
        <div className="bg-white p-5 rounded-2xl border border-[#D7E3EA] shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#D7E3EA]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#172B4D]">
                  {activeSubject.subjectName}
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 bg-[#F5F9FC] font-bold text-[#0B1F3A] rounded-md border border-[#D7E3EA]">
                  {activeSubject.subjectCode}
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Manage Unit 1 &amp; Unit 2 scores, calculate student ratings, and track improvements.
              </p>
            </div>

            {/* Class Year & Division Selectors */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-[#F5F9FC] p-1 rounded-xl border border-[#D7E3EA]">
                {assignedYears.map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setSelectedYear(yr)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedYear === yr
                        ? 'bg-[#0B1F3A] text-white shadow-xs'
                        : 'text-[#64748B] hover:text-[#172B4D]'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-[#F5F9FC] p-1 rounded-xl border border-[#D7E3EA]">
                <button
                  onClick={() => setSelectedDivision('All')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedDivision === 'All'
                      ? 'bg-[#0B1F3A] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#172B4D]'
                  }`}
                >
                  All Divs
                </button>
                {assignedDivisions.map((div) => (
                  <button
                    key={div}
                    onClick={() => setSelectedDivision(div)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedDivision === div
                        ? 'bg-[#0B1F3A] text-white shadow-xs'
                        : 'text-[#64748B] hover:text-[#172B4D]'
                    }`}
                  >
                    Div {div}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Subject Stats Banner */}
          {subjectStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
              <div className="p-3 bg-[#F5F9FC] rounded-xl border border-[#D7E3EA] text-left">
                <span className="text-[10px] font-bold uppercase text-[#0094B3]">Enrolled</span>
                <div className="text-xl font-black text-[#172B4D]">{subjectStats.totalStudents}</div>
              </div>
              <div className="p-3 bg-[#F5F9FC] rounded-xl border border-[#D7E3EA] text-left">
                <span className="text-[10px] font-bold uppercase text-[#64748B]">Unit 1 Avg</span>
                <div className="text-xl font-black text-[#172B4D]">{subjectStats.u1AvgPct}%</div>
              </div>
              <div className="p-3 bg-[#F5F9FC] rounded-xl border border-[#D7E3EA] text-left">
                <span className="text-[10px] font-bold uppercase text-[#64748B]">Unit 2 Avg</span>
                <div className="text-xl font-black text-[#172B4D]">{subjectStats.u2AvgPct}%</div>
              </div>
              <div className="p-3 bg-[#F5F9FC] rounded-xl border border-[#D7E3EA] text-left">
                <span className="text-[10px] font-bold uppercase text-[#0B1F3A]">Class Average</span>
                <div className="text-xl font-black text-[#0B1F3A]">{subjectStats.classAveragePercentage}%</div>
              </div>
              <div className="p-3 bg-[#F5F9FC] rounded-xl border border-[#D7E3EA] text-left">
                <span className="text-[10px] font-bold uppercase text-[#16A34A]">Highest Score</span>
                <div className="text-sm font-black text-[#172B4D] truncate">
                  {subjectStats.highestMarks.studentName || 'N/A'}
                </div>
                <span className="text-[11px] font-bold text-[#16A34A]">
                  {subjectStats.highestMarks.percentage}%
                </span>
              </div>
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-left">
                <span className="text-[10px] font-bold uppercase text-amber-700">Need Attention</span>
                <div className="text-xl font-black text-amber-900">{subjectStats.attentionCount}</div>
                <span className="text-[10px] text-amber-700 font-semibold">(&lt;60% remedial)</span>
              </div>
            </div>
          )}

          {/* Search & Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search students by name, roll no, PRN..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl text-xs text-[#172B4D] placeholder-[#64748B] focus:outline-none focus:border-[#00D9FF] focus:bg-white"
              />
            </div>

            {Object.keys(editingMarks).length > 0 && (
              <button
                onClick={handleSaveAllInlineMarks}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#102A43] text-[#00D9FF] font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 border border-[#00D9FF]/40 cursor-pointer"
                id="btn-save-inline-marks"
              >
                <Save className="w-4 h-4" />
                <span>Save {Object.keys(editingMarks).length} Pending Changes</span>
              </button>
            )}
          </div>

          {/* Teacher's Personal Student Database Table */}
          <div className="overflow-x-auto rounded-2xl border border-[#D7E3EA]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F5F9FC] text-[#0B1F3A] font-bold border-b border-[#D7E3EA] uppercase tracking-wider text-[10px]">
                  <th
                    className="p-3.5 cursor-pointer hover:text-[#0094B3]"
                    onClick={() => {
                      setSortField('rollNumber');
                      setSortAsc(!sortAsc);
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Roll No</span>
                      <ArrowUpDown className="w-3 h-3 text-[#64748B]" />
                    </div>
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-[#0094B3]"
                    onClick={() => {
                      setSortField('name');
                      setSortAsc(!sortAsc);
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Student</span>
                      <ArrowUpDown className="w-3 h-3 text-[#64748B]" />
                    </div>
                  </th>
                  <th className="p-3.5">PRN Number</th>
                  <th className="p-3.5 text-center">
                    Unit 1 ({activeSubject.unit1MaxMarks}M)
                  </th>
                  <th className="p-3.5 text-center">
                    Unit 2 ({activeSubject.unit2MaxMarks}M)
                  </th>
                  <th
                    className="p-3.5 text-center cursor-pointer hover:text-[#0094B3]"
                    onClick={() => {
                      setSortField('average');
                      setSortAsc(!sortAsc);
                    }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Average</span>
                      <ArrowUpDown className="w-3 h-3 text-[#64748B]" />
                    </div>
                  </th>
                  <th className="p-3.5 text-center">Performance Rating</th>
                  <th className="p-3.5 text-center">Trend</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D7E3EA] font-medium text-[#172B4D]">
                {sortedRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-[#64748B]">
                      No students enrolled matching current filters.
                    </td>
                  </tr>
                ) : (
                  sortedRows.map((row) => {
                    const badge = getPerformanceBadgeClasses(row.rating);
                    const pendingEdit = editingMarks[row.student.id];

                    const displayU1 = pendingEdit?.u1 !== undefined ? pendingEdit.u1 : row.u1;
                    const displayU2 = pendingEdit?.u2 !== undefined ? pendingEdit.u2 : row.u2;

                    return (
                      <tr
                        key={row.student.id}
                        className="hover:bg-[#F5F9FC] transition-colors group"
                      >
                        {/* Roll No */}
                        <td className="p-3.5 font-bold font-mono text-[#172B4D]">
                          {row.student.rollNumber}
                        </td>

                        {/* Student Name */}
                        <td className="p-3.5">
                          <button
                            onClick={() => setSelectedStudentProfile(row.student)}
                            className="font-bold text-[#172B4D] hover:text-[#0094B3] transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>{row.student.name}</span>
                            <ChevronRight className="w-3 h-3 text-[#64748B] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                          <span className="text-[10px] text-[#64748B]">
                            Div {row.student.division} • {row.student.gender}
                          </span>
                        </td>

                        {/* PRN */}
                        <td className="p-3.5 font-mono text-[#64748B] text-[11px]">
                          {row.student.prn}
                        </td>

                        {/* Unit 1 Input */}
                        <td className="p-3.5 text-center">
                          <input
                            type="number"
                            min="0"
                            max={activeSubject.unit1MaxMarks}
                            value={displayU1}
                            onChange={(e) =>
                              handleInlineChange(row.student.id, 'u1', e.target.value)
                            }
                            className={`w-14 text-center py-1 px-1.5 rounded-lg border font-mono text-xs font-bold ${
                              pendingEdit?.u1 !== undefined
                                ? 'border-[#00D9FF] bg-[#F5F9FC] text-[#0B1F3A]'
                                : 'border-[#D7E3EA] bg-white text-[#172B4D]'
                            } focus:outline-none focus:border-[#00D9FF]`}
                          />
                        </td>

                        {/* Unit 2 Input */}
                        <td className="p-3.5 text-center">
                          <input
                            type="number"
                            min="0"
                            max={activeSubject.unit2MaxMarks}
                            value={displayU2}
                            onChange={(e) =>
                              handleInlineChange(row.student.id, 'u2', e.target.value)
                            }
                            className={`w-14 text-center py-1 px-1.5 rounded-lg border font-mono text-xs font-bold ${
                              pendingEdit?.u2 !== undefined
                                ? 'border-[#00D9FF] bg-[#F5F9FC] text-[#0B1F3A]'
                                : 'border-[#D7E3EA] bg-white text-[#172B4D]'
                            } focus:outline-none focus:border-[#00D9FF]`}
                          />
                        </td>

                        {/* Average */}
                        <td className="p-3.5 text-center font-mono font-bold text-[#172B4D]">
                          {row.avgMarks} <span className="text-[10px] text-[#64748B] font-normal">({row.avgPct}%)</span>
                        </td>

                        {/* Performance Rating */}
                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badge.bg}`}
                          >
                            {row.rating}
                          </span>
                        </td>

                        {/* Trend */}
                        <td className="p-3.5 text-center">
                          {row.trend === 'Improved' && (
                            <span className="inline-flex items-center gap-0.5 text-[#16A34A] font-bold text-[11px]">
                              <TrendingUp className="w-3.5 h-3.5" />
                              <span>Improved</span>
                            </span>
                          )}
                          {row.trend === 'Declined' && (
                            <span className="inline-flex items-center gap-0.5 text-[#EF4444] font-bold text-[11px]">
                              <TrendingDown className="w-3.5 h-3.5" />
                              <span>Declined</span>
                            </span>
                          )}
                          {row.trend === 'Consistent' && (
                            <span className="text-[#64748B] font-semibold text-[11px]">
                              Consistent
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedStudentProfile(row.student)}
                            className="px-2.5 py-1 rounded-lg bg-[#F5F9FC] hover:bg-[#D7E3EA] hover:text-[#0B1F3A] text-[#172B4D] font-bold text-[11px] transition-colors border border-[#D7E3EA] cursor-pointer"
                          >
                            Profile &amp; Analytics
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
