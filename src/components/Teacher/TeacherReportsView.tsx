import React, { useState } from 'react';
import { useAcademic } from '../../context/AcademicContext';
import { useAuth } from '../../context/AuthContext';
import { CollegeLogo } from '../../assets/collegeLogo';
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  Award,
  AlertTriangle,
  TrendingUp,
  Filter,
  CheckCircle2,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { AcademicYear, Division, Student } from '../../types';
import {
  calculatePercentage,
  getPerformanceRating,
  getPerformanceBadgeClasses,
  detectImprovement,
} from '../../utils/calculations';
import { exportAcademicReportToExcel } from '../../utils/excelExport';

type ReportType =
  | 'subject-result-sheet'
  | 'unit1-report'
  | 'unit2-report'
  | 'weak-students'
  | 'merit-list'
  | 'improvement-report';

export const TeacherReportsView: React.FC = () => {
  const { students, subjects, marks, teachers } = useAcademic();
  const { currentUser, isTeacher } = useAuth();

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
  const [reportType, setReportType] = useState<ReportType>('subject-result-sheet');

  // Filter students
  const classStudents = students.filter((s) => {
    if (!activeSubject) return false;
    const matchDept = s.department === activeSubject.department;
    const matchYear = s.year === selectedYear;
    const matchDiv = selectedDivision === 'All' || s.division === selectedDivision;
    return matchDept && matchYear && matchDiv;
  });

  // Calculate detailed student results for the report
  const studentRows = classStudents.map((student) => {
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
    const { trend, delta } = detectImprovement(u1Pct, u2Pct);

    return {
      student,
      u1,
      u1Max,
      u1Pct,
      u2,
      u2Max,
      u2Pct,
      avgMarks,
      avgMax,
      avgPct,
      rating,
      trend,
      delta,
      remarks: mark?.remarks || 'Satisfactory',
    };
  });

  // Filter based on report type
  let displayedRows = [...studentRows];
  let reportTitle = 'Subject-Wise Examination Result Sheet';

  if (reportType === 'weak-students') {
    displayedRows = displayedRows.filter((r) => r.avgPct < 60).sort((a, b) => a.avgPct - b.avgPct);
    reportTitle = 'Remedial Action & Weak Students List (<60%)';
  } else if (reportType === 'merit-list') {
    displayedRows = displayedRows.filter((r) => r.avgPct >= 75).sort((a, b) => b.avgPct - a.avgPct);
    reportTitle = 'Merit List & Top Scorers (≥75%)';
  } else if (reportType === 'improvement-report') {
    displayedRows = displayedRows.filter((r) => r.trend === 'Improved').sort((a, b) => b.delta - a.delta);
    reportTitle = 'Unit 1 to Unit 2 Positive Progression Report';
  } else if (reportType === 'unit1-report') {
    displayedRows.sort((a, b) => b.u1Pct - a.u1Pct);
    reportTitle = 'Unit 1 Examination Performance Ledger';
  } else if (reportType === 'unit2-report') {
    displayedRows.sort((a, b) => b.u2Pct - a.u2Pct);
    reportTitle = 'Unit 2 Examination Performance Ledger';
  }

  // Handle Export to Excel
  const handleExportExcel = () => {
    if (!activeSubject) return;

    exportAcademicReportToExcel(
      displayedRows.map((r, idx) => ({
        rank: idx + 1,
        name: r.student.name,
        rollNumber: r.student.rollNumber,
        prn: r.student.prn,
        department: r.student.department,
        year: r.student.year,
        division: r.student.division,
        unit1Marks: r.u1,
        unit1Max: r.u1Max,
        unit1Percentage: r.u1Pct,
        unit2Marks: r.u2,
        unit2Max: r.u2Max,
        unit2Percentage: r.u2Pct,
        overallAverageMarks: r.avgMarks,
        overallMaxMarks: r.avgMax,
        overallPercentage: r.avgPct,
        rating: r.rating,
        trend: r.trend,
        improvementDelta: r.delta,
      })),
      `${activeSubject.subjectCode}_${reportType}_Report`
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="teacher-reports-view">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-[#D7E3EA] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-bold bg-[#F5F9FC] text-[#0094B3] border border-[#D7E3EA] rounded-md">
              Official Academic Reports
            </span>
            <span className="text-xs text-[#64748B]">
              Mandar Education Society's • EURO MANDAR Performance System
            </span>
          </div>
          <h2 className="text-xl font-black text-[#172B4D] tracking-tight">
            Academic Performance Reports &amp; Ledger
          </h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            Generate and export printable result sheets, merit rosters, remediation sheets, and unit comparison charts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-bold bg-[#F5F9FC] hover:bg-[#D7E3EA] text-[#0B1F3A] rounded-xl transition-all flex items-center gap-1.5 border border-[#D7E3EA] cursor-pointer"
            id="print-report-btn"
          >
            <Printer className="w-4 h-4 text-[#0094B3]" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-4 py-2 text-xs font-bold bg-[#0B1F3A] hover:bg-[#102A43] text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 border border-[#00D9FF]/30 cursor-pointer"
            id="export-report-excel-btn"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#00D9FF]" />
            <span>Export Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Configuration Strip */}
      <div className="bg-white p-4 rounded-2xl border border-[#D7E3EA] shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Report Type Selector */}
          <div>
            <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Select Report Template
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full px-3 py-2 text-sm bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl focus:bg-white focus:outline-none focus:border-[#00D9FF] font-bold text-[#172B4D]"
              id="report-type-select"
            >
              <option value="subject-result-sheet">📋 Full Subject Result Sheet</option>
              <option value="unit1-report">📝 Unit 1 Examination Report</option>
              <option value="unit2-report">📝 Unit 2 Examination Report</option>
              <option value="weak-students">⚠️ Remedial / Weak Students (&lt;60%)</option>
              <option value="merit-list">🏆 Merit List / Top Performers (≥75%)</option>
              <option value="improvement-report">📈 Positive Improvement Report</option>
            </select>
          </div>

          {/* Subject Selector */}
          <div>
            <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                const sub = subjects.find((s) => s.id === e.target.value);
                if (sub) setSelectedYear(sub.year);
              }}
              className="w-full px-3 py-2 text-sm bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl focus:bg-white focus:outline-none focus:border-[#00D9FF] font-medium text-[#172B4D]"
              id="report-subject-select"
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

          {/* Year */}
          <div>
            <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Academic Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value as AcademicYear)}
              className="w-full px-3 py-2 text-sm bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl focus:bg-white focus:outline-none focus:border-[#00D9FF] font-medium text-[#172B4D]"
              id="report-year-select"
            >
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="2nd Year DSY">2nd Year DSY</option>
              <option value="3rd Year">3rd Year</option>
            </select>
          </div>

          {/* Division */}
          <div>
            <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Class Division
            </label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value as Division | 'All')}
              className="w-full px-3 py-2 text-sm bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl focus:bg-white focus:outline-none focus:border-[#00D9FF] font-medium text-[#172B4D]"
              id="report-division-select"
            >
              <option value="All">All Divisions (A, B, C)</option>
              <option value="A">Division A</option>
              <option value="B">Division B</option>
              <option value="C">Division C</option>
            </select>
          </div>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-white rounded-2xl border border-[#D7E3EA] shadow-sm p-8 space-y-6 print:p-0 print:border-none print:shadow-none">
        {/* College Header */}
        <div className="border-b-2 border-[#0B1F3A] pb-4 text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <CollegeLogo className="w-12 h-12 shadow-sm" />
            <div className="text-left">
              <div className="text-xs font-extrabold text-[#0094B3] tracking-wider uppercase">
                Mandar Education Society's
              </div>
              <h1 className="text-lg font-black text-[#0B1F3A] uppercase tracking-tight">
                EURO MANDAR Institute of Technology
              </h1>
              <p className="text-[11px] text-[#64748B] font-semibold">
                Continuous Evaluation &amp; Academic Performance Assessment Report
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-[#172B4D] pt-2 border-t border-[#D7E3EA]">
            <span>Department: <strong>{activeSubject?.department}</strong></span>
            <span>•</span>
            <span>Subject: <strong>{activeSubject?.subjectName} ({activeSubject?.subjectCode})</strong></span>
            <span>•</span>
            <span>Class: <strong>{selectedYear} (Div {selectedDivision})</strong></span>
            <span>•</span>
            <span>Faculty: <strong>{currentTeacher?.name || currentUser?.name}</strong></span>
          </div>
        </div>

        {/* Report Subheader */}
        <div className="flex items-center justify-between text-xs font-semibold text-[#172B4D] bg-[#F5F9FC] p-3 rounded-xl border border-[#D7E3EA]">
          <div>
            <span className="text-[#64748B]">Report Focus:</span>{' '}
            <strong className="text-[#0B1F3A]">{reportTitle}</strong>
          </div>
          <div className="flex items-center gap-3 text-[#64748B]">
            <span>Total Candidates: <strong className="text-[#172B4D]">{displayedRows.length}</strong></span>
            <span>•</span>
            <span>Generated: {new Date().toLocaleDateString('en-GB')}</span>
          </div>
        </div>

        {/* Report Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-[#D7E3EA] border-collapse">
            <thead>
              <tr className="bg-[#F5F9FC] border-b border-[#D7E3EA] text-[#0B1F3A] font-bold uppercase text-[11px]">
                <th className="py-2.5 px-3 border-r border-[#D7E3EA] text-center w-12">Sr.</th>
                <th className="py-2.5 px-3 border-r border-[#D7E3EA]">Roll No</th>
                <th className="py-2.5 px-4 border-r border-[#D7E3EA]">Student Name</th>
                <th className="py-2.5 px-3 border-r border-[#D7E3EA] text-center">PRN</th>
                <th className="py-2.5 px-2 border-r border-[#D7E3EA] text-center">Div</th>
                <th className="py-2.5 px-3 border-r border-[#D7E3EA] text-center">Unit 1 ({activeSubject?.unit1MaxMarks})</th>
                <th className="py-2.5 px-3 border-r border-[#D7E3EA] text-center">Unit 2 ({activeSubject?.unit2MaxMarks})</th>
                <th className="py-2.5 px-3 border-r border-[#D7E3EA] text-center">Average</th>
                <th className="py-2.5 px-3 border-r border-[#D7E3EA] text-center">% Score</th>
                <th className="py-2.5 px-3 border-r border-[#D7E3EA] text-center">Rating</th>
                <th className="py-2.5 px-3 text-center">Progression</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D7E3EA] font-medium text-[#172B4D]">
              {displayedRows.length > 0 ? (
                displayedRows.map((row, idx) => {
                  const badgeClasses = getPerformanceBadgeClasses(row.rating);
                  return (
                    <tr key={row.student.id} className="hover:bg-[#F5F9FC]/60 transition-colors">
                      <td className="py-2 px-3 border-r border-[#D7E3EA] text-center font-mono text-[#64748B]">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 border-r border-[#D7E3EA] font-mono font-bold text-[#172B4D]">
                        {row.student.rollNumber}
                      </td>
                      <td className="py-2 px-4 border-r border-[#D7E3EA] font-bold text-[#172B4D]">
                        {row.student.name}
                      </td>
                      <td className="py-2 px-3 border-r border-[#D7E3EA] text-center font-mono text-[#64748B]">
                        {row.student.prn}
                      </td>
                      <td className="py-2 px-2 border-r border-[#D7E3EA] text-center font-semibold">
                        {row.student.division}
                      </td>
                      <td className="py-2 px-3 border-r border-[#D7E3EA] text-center font-semibold text-[#172B4D]">
                        {row.u1} <span className="text-[#64748B]">({row.u1Pct}%)</span>
                      </td>
                      <td className="py-2 px-3 border-r border-[#D7E3EA] text-center font-semibold text-[#172B4D]">
                        {row.u2} <span className="text-[#64748B]">({row.u2Pct}%)</span>
                      </td>
                      <td className="py-2 px-3 border-r border-[#D7E3EA] text-center font-bold text-[#172B4D]">
                        {row.avgMarks}
                      </td>
                      <td className="py-2 px-3 border-r border-[#D7E3EA] text-center font-bold text-[#0094B3]">
                        {row.avgPct}%
                      </td>
                      <td className="py-2 px-3 border-r border-[#D7E3EA] text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeClasses.bg}`}>
                          {row.rating}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-bold">
                        {row.trend === 'Improved' ? (
                          <span className="text-[#16A34A]">+{row.delta}%</span>
                        ) : row.trend === 'Declined' ? (
                          <span className="text-[#EF4444]">{row.delta}%</span>
                        ) : (
                          <span className="text-[#64748B]">0%</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-[#64748B]">
                    No students matching the criteria for this report.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Signatures Strip */}
        <div className="grid grid-cols-3 gap-8 pt-8 border-t border-[#D7E3EA] text-center text-xs text-[#64748B]">
          <div>
            <div className="h-10"></div>
            <div className="border-t border-[#D7E3EA] pt-1 font-bold text-[#172B4D]">
              {currentTeacher?.name || currentUser?.name}
            </div>
            <div className="text-[11px] text-[#64748B]">Subject Faculty</div>
          </div>
          <div>
            <div className="h-10"></div>
            <div className="border-t border-[#D7E3EA] pt-1 font-bold text-[#172B4D]">
              Prof. Anil Deshmukh
            </div>
            <div className="text-[11px] text-[#64748B]">Head of Department</div>
          </div>
          <div>
            <div className="h-10"></div>
            <div className="border-t border-[#D7E3EA] pt-1 font-bold text-[#172B4D]">
              Vedika Salekar
            </div>
            <div className="text-[11px] text-[#64748B]">Academic Dean / Administrator</div>
          </div>
        </div>
      </div>
    </div>
  );
};
