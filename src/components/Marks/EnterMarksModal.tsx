import React, { useState, useEffect } from 'react';
import { useAcademic } from '../../context/AcademicContext';
import {
  X,
  Edit3,
  Save,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
} from 'lucide-react';
import {
  calculatePercentage,
  getPerformanceRating,
  getPerformanceBadgeClasses,
  detectImprovement,
} from '../../utils/calculations';
import { MarkRecord } from '../../types';

export const EnterMarksModal: React.FC = () => {
  const {
    selectedStudentForMarks,
    setSelectedStudentForMarks,
    students,
    subjects,
    marks,
    saveMarksForStudent,
  } = useAcademic();

  const [activeStudentId, setActiveStudentId] = useState<string>('');
  const [marksState, setMarksState] = useState<
    Record<
      string,
      {
        unit1Marks: number | string;
        unit1MaxMarks: number;
        unit2Marks: number | string;
        unit2MaxMarks: number;
        remarks: string;
      }
    >
  >({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (selectedStudentForMarks) {
      setActiveStudentId(selectedStudentForMarks.id);
    } else if (students.length > 0 && !activeStudentId) {
      setActiveStudentId(students[0].id);
    }
  }, [selectedStudentForMarks, students]);

  const activeStudent = students.find((s) => s.id === activeStudentId);

  // Load relevant subjects for active student
  const relevantSubjects = subjects.filter(
    (s) => s.department === activeStudent?.department && s.year === activeStudent?.year
  );

  // Sync current marks into state when activeStudentId changes
  useEffect(() => {
    if (!activeStudent) return;

    const studentMarks = marks.filter((m) => m.studentId === activeStudent.id);
    const marksMap = new Map<string, MarkRecord>(studentMarks.map((m) => [m.subjectId, m]));

    const stateObj: typeof marksState = {};
    relevantSubjects.forEach((sub) => {
      const existing = marksMap.get(sub.id);
      stateObj[sub.id] = {
        unit1Marks: existing ? (existing.unit_1_marks ?? existing.unit1Marks) : 0,
        unit1MaxMarks: existing ? existing.unit1MaxMarks : sub.unit1MaxMarks || 30,
        unit2Marks: existing ? (existing.unit_2_marks ?? existing.unit2Marks) : 0,
        unit2MaxMarks: existing ? existing.unit2MaxMarks : sub.unit2MaxMarks || 30,
        remarks: existing?.remarks || '',
      };
    });

    setMarksState(stateObj);
    setErrorMsg(null);
  }, [activeStudentId, subjects, marks]);

  if (!selectedStudentForMarks) return null;

  const handleMarkChange = (
    subjectId: string,
    field: 'unit1Marks' | 'unit2Marks' | 'unit1MaxMarks' | 'unit2MaxMarks' | 'remarks',
    value: string | number
  ) => {
    setMarksState((prev) => {
      const curr = prev[subjectId] || {
        unit1Marks: 0,
        unit1MaxMarks: 30,
        unit2Marks: 0,
        unit2MaxMarks: 30,
        remarks: '',
      };
      return {
        ...prev,
        [subjectId]: {
          ...curr,
          [field]: value,
        },
      };
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!activeStudent) return;

    // Validate entries
    const updates: {
      subjectId: string;
      unit1Marks: number;
      unit1MaxMarks: number;
      unit2Marks: number;
      unit2MaxMarks: number;
      remarks?: string;
    }[] = [];

    for (const sub of relevantSubjects) {
      const row = marksState[sub.id];
      if (!row) continue;

      const title = sub.course_title || sub.subject_name || (sub as any).subjectName || 'Subject';
      const u1 = Number(row.unit1Marks);
      const u1Max = Number(row.unit1MaxMarks) || 30;
      const u2 = Number(row.unit2Marks);
      const u2Max = Number(row.unit2MaxMarks) || 30;

      if (isNaN(u1) || u1 < 0) {
        setErrorMsg(`Unit 1 marks for ${title} must be a non-negative number.`);
        return;
      }
      if (u1 > u1Max) {
        setErrorMsg(`Unit 1 marks for ${title} (${u1}) cannot exceed maximum marks (${u1Max}).`);
        return;
      }
      if (isNaN(u2) || u2 < 0) {
        setErrorMsg(`Unit 2 marks for ${title} must be a non-negative number.`);
        return;
      }
      if (u2 > u2Max) {
        setErrorMsg(`Unit 2 marks for ${title} (${u2}) cannot exceed maximum marks (${u2Max}).`);
        return;
      }

      updates.push({
        subjectId: sub.id,
        unit1Marks: u1,
        unit1MaxMarks: u1Max,
        unit2Marks: u2,
        unit2MaxMarks: u2Max,
        remarks: row.remarks,
      });
    }

    saveMarksForStudent(activeStudent.id, updates);
    setSelectedStudentForMarks(null);
  };

  const enrollment =
    activeStudent?.enrollment_number ||
    activeStudent?.enrollmentNo ||
    activeStudent?.rollNumber ||
    activeStudent?.prn ||
    'N/A';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#172033]/60 backdrop-blur-xs overflow-y-auto"
      id="enter-marks-modal"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-[#DCE7F5] max-w-4xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-[#123B78] p-6 text-white flex items-center justify-between border-b border-[#1E4B8F]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#2563EB] rounded-xl border border-[#3B82F6]/40">
              <Edit3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Enter Unit Test Marks (Unit 1 &amp; Unit 2)</h3>
              <p className="text-xs text-[#EAF3FF]/80">
                Live auto-calculation of subject averages, percentages, and performance levels
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedStudentForMarks(null)}
            className="p-1.5 rounded-full hover:bg-[#1E4B8F] text-[#EAF3FF]/70 hover:text-white transition-colors cursor-pointer"
            id="close-enter-marks-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Selector Bar */}
        <div className="px-6 py-3.5 bg-[#F7FAFF] border-b border-[#DCE7F5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1 w-full sm:w-auto">
            <label className="block text-[11px] font-bold text-[#172033] uppercase tracking-wider mb-1">
              Select Student:
            </label>
            <select
              value={activeStudentId}
              onChange={(e) => setActiveStudentId(e.target.value)}
              className="w-full px-3 py-2 bg-white text-xs font-semibold text-[#172033] border border-[#DCE7F5] rounded-xl focus:border-[#2563EB] outline-none cursor-pointer"
              id="marks-student-selector"
            >
              {students.map((s) => {
                const sName = s.student_name || s.name;
                const sEnroll = s.enrollment_number || s.enrollmentNo || s.rollNumber || s.prn;
                return (
                  <option key={s.id} value={s.id}>
                    {sEnroll} — {sName} ({s.department} • {s.year})
                  </option>
                );
              })}
            </select>
          </div>

          {activeStudent && (
            <div className="text-right shrink-0">
              <div className="text-xs font-bold text-[#172033]">
                {activeStudent.department} • {activeStudent.year}
              </div>
              <div className="text-[11px] text-[#2563EB] font-mono font-semibold">
                Enrollment: {enrollment}
              </div>
            </div>
          )}
        </div>

        {/* Marks Entry Grid */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[#EF4444] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#EF4444]" />
              <span>{errorMsg}</span>
            </div>
          )}

          {relevantSubjects.length > 0 ? (
            <div className="border border-[#DCE7F5] rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs divide-y divide-[#DCE7F5]">
                <thead className="bg-[#F1F7FF] font-bold text-[#123B78] text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Subject Name &amp; Code</th>
                    <th className="px-3 py-3 text-center">Unit 1 (/30)</th>
                    <th className="px-3 py-3 text-center">Unit 2 (/30)</th>
                    <th className="px-3 py-3 text-center bg-[#EAF3FF] text-[#123B78] font-bold">Subject Average ((U1+U2)/2)</th>
                    <th className="px-3 py-3 text-right">Avg %</th>
                    <th className="px-3 py-3 text-center">Rating</th>
                    <th className="px-3 py-3 text-center">Trend</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#DCE7F5] bg-white">
                  {relevantSubjects.map((sub) => {
                    const row = marksState[sub.id] || {
                      unit1Marks: 0,
                      unit1MaxMarks: sub.unit1MaxMarks || 30,
                      unit2Marks: 0,
                      unit2MaxMarks: sub.unit2MaxMarks || 30,
                      remarks: '',
                    };

                    const u1Num = Number(row.unit1Marks) || 0;
                    const u1Max = Number(row.unit1MaxMarks) || 30;
                    const u2Num = Number(row.unit2Marks) || 0;
                    const u2Max = Number(row.unit2MaxMarks) || 30;

                    const u1Pct = calculatePercentage(u1Num, u1Max);
                    const u2Pct = calculatePercentage(u2Num, u2Max);

                    const avgMarks = Number(((u1Num + u2Num) / 2).toFixed(2));
                    const avgMax = Number(((u1Max + u2Max) / 2).toFixed(2));
                    const avgPct = calculatePercentage(avgMarks, avgMax);

                    const rating = getPerformanceRating(avgPct);
                    const badge = getPerformanceBadgeClasses(rating);
                    const { trend, delta } = detectImprovement(u1Pct, u2Pct);

                    const courseTitle = sub.course_title || sub.subject_name || (sub as any).subjectName || 'Subject';
                    const courseCode = sub.course_code || sub.subjectCode || (sub as any).courseCode || 'N/A';

                    return (
                      <tr key={sub.id} className="hover:bg-[#F1F7FF]/70 transition-colors">
                        {/* Subject */}
                        <td className="px-4 py-3">
                          <div className="font-bold text-[#172033]">{courseTitle}</div>
                          <span className="text-[10px] font-mono text-[#64748B]">{courseCode}</span>
                        </td>

                        {/* Unit 1 Input */}
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max={u1Max}
                              value={row.unit1Marks}
                              onChange={(e) => handleMarkChange(sub.id, 'unit1Marks', e.target.value)}
                              className="w-16 px-2 py-1.5 text-center font-bold text-[#172033] bg-[#F7FAFF] border border-[#DCE7F5] rounded-lg focus:border-[#2563EB] focus:bg-white outline-none"
                              id={`input-u1-${sub.id}`}
                            />
                            <span className="text-[#64748B] font-medium">/ {u1Max}</span>
                          </div>
                          <div className="text-[10px] text-[#2563EB] mt-0.5">{u1Pct}%</div>
                        </td>

                        {/* Unit 2 Input */}
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max={u2Max}
                              value={row.unit2Marks}
                              onChange={(e) => handleMarkChange(sub.id, 'unit2Marks', e.target.value)}
                              className="w-16 px-2 py-1.5 text-center font-bold text-[#172033] bg-[#F7FAFF] border border-[#DCE7F5] rounded-lg focus:border-[#2563EB] focus:bg-white outline-none"
                              id={`input-u2-${sub.id}`}
                            />
                            <span className="text-[#64748B] font-medium">/ {u2Max}</span>
                          </div>
                          <div className="text-[10px] text-[#3B82F6] mt-0.5">{u2Pct}%</div>
                        </td>

                        {/* Calculated Average */}
                        <td className="px-3 py-3 text-center bg-[#F7FAFF] font-black text-[#172033]">
                          <div>
                            <span>{avgMarks}</span>
                            <span className="text-[10px] text-[#64748B] font-normal">/{avgMax}</span>
                          </div>
                        </td>

                        {/* Calculated Percentage */}
                        <td className="px-3 py-3 text-right font-black text-[#2563EB]">
                          {avgPct}%
                        </td>

                        {/* Calculated Rating */}
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg}`}
                          >
                            {rating}
                          </span>
                        </td>

                        {/* Progress */}
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          {trend === 'Improved' && (
                            <span className="text-[#22C55E] font-bold text-[11px] flex items-center justify-center gap-1">
                              <span>+{delta}% 📈</span>
                            </span>
                          )}
                          {trend === 'Declined' && (
                            <span className="text-[#EF4444] font-bold text-[11px] flex items-center justify-center gap-1">
                              <span>{delta}% 📉</span>
                            </span>
                          )}
                          {trend === 'Consistent' && (
                            <span className="text-[#64748B] font-medium text-[11px]">
                              0% ➡️
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-[#64748B] border border-dashed border-[#DCE7F5] rounded-2xl bg-[#F7FAFF]">
              No subjects registered for {activeStudent?.department} ({activeStudent?.year}).
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-3 border-t border-[#DCE7F5] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setSelectedStudentForMarks(null)}
              className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-[#F7FAFF] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={relevantSubjects.length === 0}
              className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              id="save-student-marks-btn"
            >
              <Save className="w-4 h-4" />
              <span>Save &amp; Update Performance</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
