import React, { useState } from 'react';
import { useAcademic } from '../../context/AcademicContext';
import { useAuth } from '../../context/AuthContext';
import {
  History,
  Search,
  Filter,
  Trash2,
  Download,
  Calendar,
  UserCheck,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { exportAcademicReportToExcel } from '../../utils/excelExport';

export const MarksAuditLogView: React.FC = () => {
  const { auditLogs, teachers, subjects, clearAuditLogs } = useAcademic();
  const { isAdmin } = useAuth();

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('All');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('All');
  const [selectedUnit, setSelectedUnit] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter logs
  const filteredLogs = auditLogs.filter((log) => {
    const matchTeacher = selectedTeacherId === 'All' || log.teacherId === selectedTeacherId;
    const matchSubject = selectedSubjectId === 'All' || log.subjectId === selectedSubjectId;
    const matchUnit = selectedUnit === 'All' || log.unit === selectedUnit;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      log.studentName.toLowerCase().includes(q) ||
      log.rollNumber.toLowerCase().includes(q) ||
      log.teacherName.toLowerCase().includes(q) ||
      log.subjectName.toLowerCase().includes(q) ||
      log.description.toLowerCase().includes(q);

    return matchTeacher && matchSubject && matchUnit && matchSearch;
  });

  const handleExportAuditExcel = () => {
    exportAcademicReportToExcel(
      filteredLogs.map((log, idx) => ({
        rank: idx + 1,
        name: log.studentName,
        rollNumber: log.rollNumber,
        prn: log.subjectCode,
        department: log.teacherName,
        year: log.unit,
        division: log.action,
        unit1Marks: log.newMarks.unit1,
        unit1Max: log.oldMarks.unit1,
        unit1Percentage: 0,
        unit2Marks: log.newMarks.unit2,
        unit2Max: log.oldMarks.unit2,
        unit2Percentage: 0,
        overallAverageMarks: 0,
        overallMaxMarks: 0,
        overallPercentage: 0,
        rating: 'Good',
        trend: 'Consistent',
        improvementDelta: 0,
      })),
      'Marks_Audit_History_Ledger'
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="marks-audit-log-view">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-[#D7E3EA] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-bold bg-[#F5F9FC] text-[#0094B3] border border-[#D7E3EA] rounded-md flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Academic Integrity &amp; Security Audit</span>
            </span>
          </div>
          <h2 className="text-xl font-black text-[#172B4D] tracking-tight">
            Marks Audit &amp; Modification History
          </h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            Transparent immutable audit trail tracking all marks entries, faculty attribution, and score revisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && auditLogs.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear the audit history?')) {
                  clearAuditLogs();
                }
              }}
              className="px-3.5 py-2 text-xs font-bold text-[#EF4444] bg-[#EF4444]/10 hover:bg-[#EF4444]/20 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              id="clear-audit-logs-btn"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear History</span>
            </button>
          )}

          <button
            onClick={handleExportAuditExcel}
            className="px-4 py-2 text-xs font-bold bg-[#0B1F3A] hover:bg-[#102A43] text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 border border-[#00D9FF]/30 cursor-pointer"
            id="export-audit-excel-btn"
          >
            <Download className="w-4 h-4 text-[#00D9FF]" />
            <span>Export Audit Trail</span>
          </button>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="bg-white p-4 rounded-2xl border border-[#D7E3EA] shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Teacher Filter */}
          <div>
            <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Filter by Faculty
            </label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl focus:bg-white focus:outline-none focus:border-[#00D9FF] font-medium text-[#172B4D]"
            >
              <option value="All">All Faculty Members</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.teacherId}>
                  {t.name} ({t.teacherId})
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl focus:bg-white focus:outline-none focus:border-[#00D9FF] font-medium text-[#172B4D]"
            >
              <option value="All">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subjectName} ({s.subjectCode})
                </option>
              ))}
            </select>
          </div>

          {/* Unit Filter */}
          <div>
            <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Unit Tested
            </label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl focus:bg-white focus:outline-none focus:border-[#00D9FF] font-medium text-[#172B4D]"
            >
              <option value="All">All Units</option>
              <option value="Unit 1">Unit 1</option>
              <option value="Unit 2">Unit 2</option>
              <option value="Both">Both Units</option>
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Search Student / Detail
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Student, Roll No, Teacher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl focus:bg-white focus:outline-none focus:border-[#00D9FF] text-[#172B4D]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Timeline / Ledger */}
      <div className="bg-white rounded-2xl border border-[#D7E3EA] shadow-xs overflow-hidden">
        <div className="p-4 bg-[#F5F9FC] border-b border-[#D7E3EA] flex items-center justify-between text-xs font-bold text-[#0B1F3A]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#0094B3]" />
            <span>Audit Trail ({filteredLogs.length} logged modifications)</span>
          </div>
          <span className="text-[#64748B] font-normal">All times recorded in IST</span>
        </div>

        <div className="divide-y divide-[#D7E3EA]">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-[#F5F9FC]/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-[#F5F9FC] text-[#0094B3] border border-[#D7E3EA] rounded-md">
                      {log.teacherName} ({log.teacherId})
                    </span>
                    <span className="text-xs font-bold text-[#172B4D]">
                      → {log.studentName} ({log.rollNumber})
                    </span>
                    <span className="px-2 py-0.5 text-[11px] font-semibold bg-[#F5F9FC] text-[#172B4D] border border-[#D7E3EA] rounded">
                      {log.subjectName} ({log.subjectCode})
                    </span>
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-[#0B1F3A] text-[#00D9FF] rounded">
                      {log.unit}
                    </span>
                  </div>

                  <p className="text-xs text-[#172B4D] font-medium leading-relaxed">
                    {log.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-right shrink-0">
                  {/* Score Change Box */}
                  <div className="bg-[#F5F9FC] px-3 py-1.5 rounded-xl border border-[#D7E3EA] text-xs font-mono text-center">
                    <div className="text-[10px] text-[#64748B] font-sans uppercase font-bold">
                      Score Revision
                    </div>
                    <div className="flex items-center gap-1.5 font-bold text-[#172B4D]">
                      <span>U1: {log.oldMarks.unit1} → <strong className="text-[#0094B3]">{log.newMarks.unit1}</strong></span>
                      <span className="text-[#D7E3EA]">|</span>
                      <span>U2: {log.oldMarks.unit2} → <strong className="text-[#0B1F3A]">{log.newMarks.unit2}</strong></span>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="text-right">
                    <div className="text-xs font-bold text-[#172B4D]">
                      {new Date(log.timestamp).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-[11px] text-[#64748B] font-mono">
                      {new Date(log.timestamp).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-[#64748B]">
              <History className="w-10 h-10 mx-auto mb-2 text-[#64748B]" />
              <p className="text-sm font-bold text-[#172B4D]">No audit records found</p>
              <p className="text-xs text-[#64748B] mt-0.5">
                Modifications to Unit 1 and Unit 2 marks will be logged here automatically.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
