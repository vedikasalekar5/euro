import React, { useState, useEffect, useMemo } from 'react';
import { useAcademic } from '../../context/AcademicContext';
import { useAuth } from '../../context/AuthContext';
import {
  Layers,
  Save,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  BookOpen,
  Filter,
  User,
  Calculator,
} from 'lucide-react';
import { Department, AcademicYear, Subject } from '../../types';
import {
  calculatePercentage,
  getPerformanceRating,
  getPerformanceBadgeClasses,
  detectImprovement,
} from '../../utils/calculations';
import { generateBlankMarksTemplateExcel } from '../../utils/excelExport';

export const BatchMarksEntry: React.FC = () => {
  const { students, subjects, marks, teachers, batchSaveMarks, saveMarksForStudent, showToast } = useAcademic();
  const { user, isTeacher } = useAuth();

  // Active teacher info
  const currentTeacher = isTeacher && user?.teacherId
    ? teachers.find((t) => t.teacherId === user.teacherId || t.id === user.id)
    : undefined;

  const defaultDept: Department = currentTeacher ? currentTeacher.department : 'Computer Engineering';
  const [selectedDept, setSelectedDept] = useState<Department>(defaultDept);
  const [selectedYear, setSelectedYear] = useState<AcademicYear>(
    currentTeacher?.assignedYears[0] || '2nd Year'
  );
  const [btNoInput, setBtNoInput] = useState<string>('All');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  // Local grid state: studentId -> { u1, u2, u1Max, u2Max, remarks }
  const [gridData, setGridData] = useState<
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

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [savingRowId, setSavingRowId] = useState<string | null>(null);

  // Available unique BT Nos in the current department and year
  const availableBtNos = useMemo(() => {
    const set = new Set<string>();
    students
      .filter((s) => s.department === selectedDept && s.year === selectedYear)
      .forEach((s) => {
        if (s.btNo && s.btNo.trim()) set.add(s.btNo.trim());
      });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [students, selectedDept, selectedYear]);

  // Filter available subjects based on teacher assignments or selected dept & year
  const availableSubjects = subjects.filter((s) => {
    const matchDept = s.department === selectedDept;
    const matchYear = s.year === selectedYear;
    if (isTeacher && currentTeacher) {
      return matchDept && matchYear && currentTeacher.assignedSubjects.includes(s.id);
    }
    return matchDept && matchYear;
  });

  // Set default subject when list changes
  useEffect(() => {
    if (availableSubjects.length > 0) {
      if (!availableSubjects.some((s) => s.id === selectedSubjectId)) {
        setSelectedSubjectId(availableSubjects[0].id);
      }
    } else {
      setSelectedSubjectId('');
    }
  }, [selectedDept, selectedYear, isTeacher, currentTeacher, subjects]);

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId);

  // Filter students in this class/batch
  const classStudents = useMemo(() => {
    return students.filter((s) => {
      const matchDept = s.department === selectedDept;
      const matchYear = s.year === selectedYear;
      const matchBt =
        btNoInput === 'All' ||
        !btNoInput.trim() ||
        (s.btNo || '').trim().toLowerCase() === btNoInput.trim().toLowerCase();
      return matchDept && matchYear && matchBt;
    });
  }, [students, selectedDept, selectedYear, btNoInput]);

  // Populate grid when subject or class changes
  useEffect(() => {
    if (!activeSubject) return;

    const newGrid: typeof gridData = {};
    classStudents.forEach((student) => {
      const existing = marks.find(
        (m) => m.studentId === student.id && m.subjectId === activeSubject.id
      );

      newGrid[student.id] = {
        unit1Marks: existing ? existing.unit1Marks : 0,
        unit1MaxMarks: existing ? existing.unit1MaxMarks : (activeSubject.unit1MaxMarks || 25),
        unit2Marks: existing ? existing.unit2Marks : 0,
        unit2MaxMarks: existing ? existing.unit2MaxMarks : (activeSubject.unit2MaxMarks || 25),
        remarks: existing?.remarks || '',
      };
    });

    setGridData(newGrid);
    setValidationErrors({});
  }, [selectedDept, selectedYear, btNoInput, selectedSubjectId, marks, classStudents.length]);

  const validateCell = (val: number, max: number, label: string): string | null => {
    if (isNaN(val)) return `${label} must be a valid number`;
    if (val < 0) return `${label} cannot be negative`;
    if (val > max) return `${label} cannot exceed maximum (${max})`;
    return null;
  };

  const handleCellChange = (
    studentId: string,
    field: 'unit1Marks' | 'unit2Marks' | 'remarks',
    value: string
  ) => {
    setGridData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));

    if (!activeSubject) return;

    // Real-time validation check
    const errorsCopy = { ...validationErrors };
    const key = `${studentId}_${field}`;

    if (field === 'unit1Marks') {
      const num = Number(value);
      const err = validateCell(num, activeSubject.unit1MaxMarks, 'Unit 1');
      if (err) errorsCopy[key] = err;
      else delete errorsCopy[key];
    } else if (field === 'unit2Marks') {
      const num = Number(value);
      const err = validateCell(num, activeSubject.unit2MaxMarks, 'Unit 2');
      if (err) errorsCopy[key] = err;
      else delete errorsCopy[key];
    }

    setValidationErrors(errorsCopy);
  };

  // Save a single row
  const handleSaveSingleRow = (studentId: string) => {
    if (!activeSubject) return;
    const row = gridData[studentId];
    if (!row) return;

    const u1 = Number(row.unit1Marks);
    const u2 = Number(row.unit2Marks);

    const err1 = validateCell(u1, activeSubject.unit1MaxMarks, 'Unit 1');
    const err2 = validateCell(u2, activeSubject.unit2MaxMarks, 'Unit 2');

    if (err1 || err2) {
      showToast(err1 || err2 || 'Invalid marks entered.', 'error');
      return;
    }

    setSavingRowId(studentId);

    const teacherInfo = {
      id: user?.id || 'teacher',
      name: currentTeacher?.name || user?.name || 'Prof. Priya Patil',
      teacherId: currentTeacher?.teacherId || user?.teacherId,
      role: user?.role,
    };

    saveMarksForStudent(
      studentId,
      [
        {
          subjectId: activeSubject.id,
          unit1Marks: u1,
          unit1MaxMarks: activeSubject.unit1MaxMarks,
          unit2Marks: u2,
          unit2MaxMarks: activeSubject.unit2MaxMarks,
          remarks: row.remarks,
        },
      ],
      teacherInfo
    );

    setTimeout(() => setSavingRowId(null), 400);
  };

  // Save all rows
  const handleBulkSave = () => {
    if (!activeSubject) return;

    const errors: Record<string, string> = {};
    const updates: {
      studentId: string;
      subjectId: string;
      unit1Marks: number;
      unit1MaxMarks: number;
      unit2Marks: number;
      unit2MaxMarks: number;
      remarks: string;
    }[] = [];

    for (const student of classStudents) {
      const row = gridData[student.id];
      if (!row) continue;

      const u1 = Number(row.unit1Marks);
      const u2 = Number(row.unit2Marks);

      const err1 = validateCell(u1, activeSubject.unit1MaxMarks, 'Unit 1');
      const err2 = validateCell(u2, activeSubject.unit2MaxMarks, 'Unit 2');

      if (err1) errors[`${student.id}_unit1Marks`] = err1;
      if (err2) errors[`${student.id}_unit2Marks`] = err2;

      updates.push({
        studentId: student.id,
        subjectId: activeSubject.id,
        unit1Marks: u1,
        unit1MaxMarks: activeSubject.unit1MaxMarks,
        unit2Marks: u2,
        unit2MaxMarks: activeSubject.unit2MaxMarks,
        remarks: row.remarks,
      });
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast('Validation errors found. Please fix highlighted fields before saving.', 'error');
      return;
    }

    const teacherInfo = {
      id: user?.id || 'teacher',
      name: currentTeacher?.name || user?.name || 'Prof. Priya Patil',
      teacherId: currentTeacher?.teacherId || user?.teacherId,
      role: user?.role,
    };

    batchSaveMarks(updates, teacherInfo);
  };

  const handleDownloadTemplate = () => {
    if (!activeSubject) return;
    generateBlankMarksTemplateExcel(
      classStudents,
      activeSubject,
      selectedDept,
      selectedYear
    );
  };

  const hasErrors = Object.keys(validationErrors).length > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="batch-marks-view">
      
      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-md flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Subject-Wise Marks Entry</span>
            </span>
            {isTeacher && (
              <span className="text-xs text-slate-500 font-medium">
                Faculty:{' '}
                <strong className="text-slate-800">{currentTeacher?.name || user?.name}</strong>
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Marks Entry & Real-Time Calculation
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select Department, Year, BT No., and Subject to enter Unit 1 and Unit 2 scores with instant automatic calculations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleDownloadTemplate}
            disabled={!activeSubject || classStudents.length === 0}
            className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            id="download-excel-template-btn"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Blank Excel Template</span>
          </button>

          <button
            onClick={handleBulkSave}
            disabled={!activeSubject || classStudents.length === 0 || hasErrors}
            className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-95 shadow-blue-600/20 cursor-pointer"
            id="save-all-marks-btn"
          >
            <Save className="w-4 h-4" />
            <span>Save All Marks ({classStudents.length})</span>
          </button>
        </div>
      </div>

      {/* Class & Subject Selection Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Department */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              1. Department <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value as Department)}
              className="w-full py-2.5 px-3 bg-slate-50 text-xs font-medium text-slate-900 rounded-xl border border-slate-200 focus:border-blue-500 focus:bg-white outline-none cursor-pointer"
              id="select-marks-dept"
            >
              <option value="Computer Engineering">Computer Engineering</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
            </select>
          </div>

          {/* 2. Year */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              2. Year / Class <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value as AcademicYear)}
              className="w-full py-2.5 px-3 bg-slate-50 text-xs font-medium text-slate-900 rounded-xl border border-slate-200 focus:border-blue-500 focus:bg-white outline-none cursor-pointer"
              id="select-marks-year"
            >
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="2nd Year DSY">2nd Year DSY</option>
            </select>
          </div>

          {/* 3. BT No. Selection / Search */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              3. BT No. / Batch <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-1.5">
              <select
                value={availableBtNos.includes(btNoInput) ? btNoInput : 'Custom'}
                onChange={(e) => {
                  if (e.target.value !== 'Custom') {
                    setBtNoInput(e.target.value);
                  }
                }}
                className="w-1/2 py-2.5 px-2.5 bg-slate-50 text-xs font-medium text-slate-900 rounded-xl border border-slate-200 focus:border-blue-500 focus:bg-white outline-none cursor-pointer"
                id="select-marks-btno"
              >
                <option value="All">All Batches</option>
                {availableBtNos.map((bt) => (
                  <option key={bt} value={bt}>
                    BT {bt}
                  </option>
                ))}
                <option value="Custom">Manual Entry</option>
              </select>

              <input
                type="text"
                value={btNoInput === 'All' ? '' : btNoInput}
                onChange={(e) => setBtNoInput(e.target.value || 'All')}
                placeholder="e.g. 07, 08"
                className="w-1/2 py-2.5 px-3 bg-slate-50 text-xs font-bold text-slate-900 rounded-xl border border-slate-200 focus:border-blue-500 focus:bg-white outline-none placeholder:text-slate-400 placeholder:font-normal"
                id="input-marks-btno-search"
                title="Enter specific BT No. to filter batch"
              />
            </div>
          </div>

          {/* 4. Subject Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              4. Subject <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={availableSubjects.length === 0}
              className="w-full py-2.5 px-3 bg-slate-50 text-xs font-medium text-slate-900 rounded-xl border border-slate-200 focus:border-blue-500 focus:bg-white outline-none disabled:opacity-50 cursor-pointer"
              id="select-marks-subject"
            >
              {availableSubjects.length > 0 ? (
                availableSubjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.subjectName} ({sub.subjectCode})
                  </option>
                ))
              ) : (
                <option value="">No subjects found for this department & year</option>
              )}
            </select>
          </div>

        </div>

        {/* Selected Context Banner */}
        {activeSubject && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">Evaluating:</span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-800 font-bold rounded border border-blue-200">
                {activeSubject.subjectName} ({activeSubject.subjectCode})
              </span>
              <span>Max Marks: Unit 1 ({activeSubject.unit1MaxMarks || 25}) | Unit 2 ({activeSubject.unit2MaxMarks || 25})</span>
            </div>
            <div className="text-slate-500">
              Found <strong className="text-slate-800">{classStudents.length}</strong> students in this batch
            </div>
          </div>
        )}
      </div>

      {/* Marks Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {classStudents.length > 0 && activeSubject ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 divide-y divide-slate-200/80">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3.5">Enrollment No.</th>
                  <th className="px-4 py-3.5">Student Name</th>
                  <th className="px-3 py-3.5 text-center">BT No.</th>
                  <th className="px-3 py-3.5 text-center w-28">
                    Unit 1 <span className="text-[10px] text-slate-400">(/25)</span>
                  </th>
                  <th className="px-3 py-3.5 text-center w-28">
                    Unit 2 <span className="text-[10px] text-slate-400">(/25)</span>
                  </th>
                  <th className="px-3 py-3.5 text-center bg-blue-50/50 text-blue-950 font-bold">
                    Subject Avg <span className="text-[10px] font-normal">((U1+U2)/2)</span>
                  </th>
                  <th className="px-3 py-3.5 text-right font-bold">Avg %</th>
                  <th className="px-3 py-3.5 text-center">Performance Rating</th>
                  <th className="px-3 py-3.5 text-center">Trend</th>
                  <th className="px-4 py-3.5">Remarks</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {classStudents.map((student) => {
                  const row = gridData[student.id] || {
                    unit1Marks: 0,
                    unit1MaxMarks: activeSubject.unit1MaxMarks || 25,
                    unit2Marks: 0,
                    unit2MaxMarks: activeSubject.unit2MaxMarks || 25,
                    remarks: '',
                  };

                  const u1 = Number(row.unit1Marks) || 0;
                  const u2 = Number(row.unit2Marks) || 0;
                  const u1Max = row.unit1MaxMarks || 25;
                  const u2Max = row.unit2MaxMarks || 25;

                  // Real-time calculation
                  const avgMarks = Number(((u1 + u2) / 2).toFixed(2));
                  const avgMax = (u1Max + u2Max) / 2;
                  const pct = calculatePercentage(avgMarks, avgMax);
                  const rating = getPerformanceRating(pct);
                  const badge = getPerformanceBadgeClasses(rating);
                  const u1Pct = calculatePercentage(u1, u1Max);
                  const u2Pct = calculatePercentage(u2, u2Max);
                  const trend = detectImprovement(u1Pct, u2Pct);

                  const u1Err = validationErrors[`${student.id}_unit1Marks`];
                  const u2Err = validationErrors[`${student.id}_unit2Marks`];
                  const enrollment = student.enrollmentNo || student.rollNumber || student.prn || 'N/A';
                  const btNumber = student.btNo || '07';

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/70 transition-colors"
                      id={`marks-row-${student.id}`}
                    >
                      {/* Enrollment No. */}
                      <td className="px-4 py-3 font-mono font-bold text-blue-900 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-900 rounded border border-blue-200">
                          {enrollment}
                        </span>
                      </td>

                      {/* Student Name */}
                      <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                        {student.name}
                      </td>

                      {/* BT No. */}
                      <td className="px-3 py-3 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-bold rounded border border-slate-200">
                          {btNumber}
                        </span>
                      </td>

                      {/* Unit 1 Input */}
                      <td className="px-3 py-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max={u1Max}
                          step="0.5"
                          value={row.unit1Marks}
                          onChange={(e) => handleCellChange(student.id, 'unit1Marks', e.target.value)}
                          className={`w-20 text-center font-bold text-xs py-1.5 px-2 rounded-lg border outline-none transition-all ${
                            u1Err
                              ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-200'
                              : 'bg-white border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-900'
                          }`}
                          title={u1Err || `Max: ${u1Max}`}
                          id={`input-u1-${student.id}`}
                        />
                      </td>

                      {/* Unit 2 Input */}
                      <td className="px-3 py-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max={u2Max}
                          step="0.5"
                          value={row.unit2Marks}
                          onChange={(e) => handleCellChange(student.id, 'unit2Marks', e.target.value)}
                          className={`w-20 text-center font-bold text-xs py-1.5 px-2 rounded-lg border outline-none transition-all ${
                            u2Err
                              ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-200'
                              : 'bg-white border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-900'
                          }`}
                          title={u2Err || `Max: ${u2Max}`}
                          id={`input-u2-${student.id}`}
                        />
                      </td>

                      {/* Subject Average ((U1+U2)/2) */}
                      <td className="px-3 py-3 text-center font-black text-slate-900 bg-blue-50/40">
                        <span>{avgMarks}</span>
                        <span className="text-[10px] text-slate-400 font-normal">/{avgMax}</span>
                      </td>

                      {/* Percentage */}
                      <td className="px-3 py-3 text-right font-black text-slate-900">
                        {pct}%
                      </td>

                      {/* Performance Rating */}
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                          {rating}
                        </span>
                      </td>

                      {/* Trend */}
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        {trend.trend === 'Improved' && (
                          <span className="text-emerald-600 font-bold text-xs">
                            +{trend.delta}% 📈
                          </span>
                        )}
                        {trend.trend === 'Declined' && (
                          <span className="text-rose-600 font-bold text-xs">
                            {trend.delta}% 📉
                          </span>
                        )}
                        {trend.trend === 'Consistent' && (
                          <span className="text-slate-500 font-medium text-xs">
                            0% ➡️
                          </span>
                        )}
                      </td>

                      {/* Remarks Input */}
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={row.remarks}
                          onChange={(e) => handleCellChange(student.id, 'remarks', e.target.value)}
                          placeholder="Optional feedback..."
                          className="w-full min-w-[120px] px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-500 focus:bg-white outline-none"
                          id={`input-remarks-${student.id}`}
                        />
                      </td>

                      {/* Save Individual Row Button */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleSaveSingleRow(student.id)}
                          disabled={savingRowId === student.id || !!u1Err || !!u2Err}
                          className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                          id={`save-row-btn-${student.id}`}
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{savingRowId === student.id ? 'Saved' : 'Save'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium">No students found matching your Department, Year, and BT No. filter.</p>
            <p className="text-xs text-slate-400 mt-1">Please adjust your selection criteria or add students to this class.</p>
          </div>
        )}
      </div>

    </div>
  );
};
