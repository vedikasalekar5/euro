import React, { useState, useEffect, useMemo } from 'react';
import { useAcademic } from '../../context/AcademicContext';
import { useAuth } from '../../context/AuthContext';
import {
  Save,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Users,
  Check,
  FileText,
  Sparkles,
  ClipboardCheck,
  GraduationCap,
} from 'lucide-react';
import { Department, AcademicYear, MarkRecord, ExamType } from '../../types';
import { exportExamMarksPDF, exportSubjectMarksPDF } from '../../utils/pdfExport';
import { sortStudentsByEnrollment } from '../../utils/studentSorting';
import { AiMarksScannerModal } from './AiMarksScannerModal';

interface StudentExamRow {
  studentId: string;
  name: string;
  enrollmentNo: string;
  unit1Marks: string | number;
  unit2Marks: string | number;
  isSaved?: boolean;
}

export const MarksAllocationView: React.FC = () => {
  const {
    students,
    subjects,
    marks,
    saveUnitTestBatchMarks,
    saveBatchMarks,
    setCourseFormModal,
    showToast,
  } = useAcademic();

  const { currentTeacher } = useAuth();

  // Step 1: Programming Name
  const [selectedProgramming, setSelectedProgramming] = useState<Department>('Computer Engineering');

  // Step 2: Year
  const [selectedYear, setSelectedYear] = useState<AcademicYear>('2nd Year');

  // Step 3 & 4: Course Title and Course Code
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  // Step 5: Examination (Unit Test 1 | Unit Test 2 | Combined)
  const [selectedExamType, setSelectedExamType] = useState<ExamType>('Unit Test 1');

  // Step 6: Rows State
  const [rowsState, setRowsState] = useState<Record<string, StudentExamRow>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isAiScannerOpen, setIsAiScannerOpen] = useState(false);

  // Available courses strictly matching Programming Name & Year
  const availableCourses = useMemo(() => {
    return subjects.filter(
      (s) =>
        (s.programming_name || s.department) === selectedProgramming &&
        s.year === selectedYear
    );
  }, [subjects, selectedProgramming, selectedYear]);

  // Auto-select first available course when department or year changes
  useEffect(() => {
    if (availableCourses.length > 0) {
      if (!availableCourses.some((s) => s.id === selectedSubjectId)) {
        setSelectedSubjectId(availableCourses[0].id);
      }
    } else {
      setSelectedSubjectId('');
    }
  }, [availableCourses, selectedSubjectId]);

  const activeCourse = subjects.find((s) => s.id === selectedSubjectId);
  const activeCourseTitle =
    activeCourse?.course_title ||
    activeCourse?.subject_name ||
    (activeCourse as any)?.courseTitle ||
    (activeCourse as any)?.subjectName ||
    'Course';
  const activeCourseCode =
    activeCourse?.course_code ||
    (activeCourse as any)?.courseCode ||
    (activeCourse as any)?.subjectCode ||
    '';

  // Filter students strictly by Programming Name & Year and sort by Enrollment Number
  const matchingStudents = useMemo(() => {
    const filtered = students.filter(
      (s) =>
        (s.programming_name || s.department) === selectedProgramming &&
        s.year === selectedYear
    );
    return sortStudentsByEnrollment(filtered);
  }, [students, selectedProgramming, selectedYear]);

  // Populate row state from database marks
  useEffect(() => {
    if (!activeCourse) {
      setRowsState({});
      return;
    }

    const marksMap = new Map<string, MarkRecord>();
    marks
      .filter((m) => m.subjectId === activeCourse.id || m.subject_id === activeCourse.id)
      .forEach((m) => marksMap.set(m.studentId || (m as any).student_id, m));

    const newRows: Record<string, StudentExamRow> = {};
    matchingStudents.forEach((student) => {
      const existing = marksMap.get(student.id);
      newRows[student.id] = {
        studentId: student.id,
        name: student.student_name || student.name || 'Student',
        enrollmentNo:
          student.enrollment_number ||
          student.enrollmentNo ||
          student.rollNumber ||
          student.prn ||
          'N/A',
        unit1Marks:
          existing !== undefined
            ? (existing.unit_1_marks ?? existing.unit1Marks ?? 0)
            : 0,
        unit2Marks:
          existing !== undefined
            ? (existing.unit_2_marks ?? existing.unit2Marks ?? 0)
            : 0,
        isSaved: true,
      };
    });

    setRowsState(newRows);
    setValidationError(null);
  }, [selectedSubjectId, selectedProgramming, selectedYear, matchingStudents, marks, activeCourse]);

  // Handle mark input change with 0-30 validation
  const handleInputChange = (
    studentId: string,
    field: 'unit1Marks' | 'unit2Marks',
    value: string | number
  ) => {
    setValidationError(null);
    setSuccessNotice(null);

    const num = Number(value);
    if (num > 30) {
      setValidationError('⚠️ Marks cannot exceed 30. Maximum marks for Unit Test 1 and Unit Test 2 is 30.');
    }

    setRowsState((prev) => {
      const current = prev[studentId];
      if (!current) return prev;
      return {
        ...prev,
        [studentId]: {
          ...current,
          [field]: value,
          isSaved: false,
        },
      };
    });
  };

  // Validate single mark (0-30 range)
  const validateSingleMark = (
    val: string | number,
    studentName: string,
    examLabel: string
  ): { valid: boolean; value: number; error?: string } => {
    const num = Number(val);
    if (isNaN(num) || num < 0) {
      return { valid: false, value: 0, error: `Invalid ${examLabel} marks for ${studentName}. Marks cannot be negative.` };
    }
    if (num > 30) {
      return {
        valid: false,
        value: 0,
        error: `Marks cannot exceed 30. ${examLabel} marks (${num}) for ${studentName} exceeds maximum 30.`,
      };
    }
    return { valid: true, value: num };
  };

  // Save single student row
  const handleSaveSingleRow = (studentId: string) => {
    if (!activeCourse) return;
    const row = rowsState[studentId];
    if (!row) return;

    if (selectedExamType === 'Unit Test 1') {
      const val = validateSingleMark(row.unit1Marks, row.name, 'Unit Test 1');
      if (!val.valid) {
        setValidationError(val.error || 'Marks cannot exceed 30.');
        return;
      }
      const res = saveUnitTestBatchMarks(activeCourse.id, 'Unit Test 1', [
        {
          studentId,
          marksObtained: val.value,
          maxMarks: 30,
        },
      ]);
      if (res.success) {
        setRowsState((prev) => ({
          ...prev,
          [studentId]: {
            ...prev[studentId],
            unit1Marks: val.value,
            isSaved: true,
          },
        }));
      } else {
        setValidationError(res.message);
      }
    } else if (selectedExamType === 'Unit Test 2') {
      const val = validateSingleMark(row.unit2Marks, row.name, 'Unit Test 2');
      if (!val.valid) {
        setValidationError(val.error || 'Marks cannot exceed 30.');
        return;
      }
      const res = saveUnitTestBatchMarks(activeCourse.id, 'Unit Test 2', [
        {
          studentId,
          marksObtained: val.value,
          maxMarks: 30,
        },
      ]);
      if (res.success) {
        setRowsState((prev) => ({
          ...prev,
          [studentId]: {
            ...prev[studentId],
            unit2Marks: val.value,
            isSaved: true,
          },
        }));
      } else {
        setValidationError(res.message);
      }
    }
  };

  // Save All Rows
  const handleSaveAll = () => {
    if (!activeCourse) return;
    setValidationError(null);
    setSuccessNotice(null);

    if (matchingStudents.length === 0) {
      setValidationError('No students found to save marks for.');
      return;
    }

    if (selectedExamType === 'Unit Test 1' || selectedExamType === 'Unit Test 2') {
      const isU1 = selectedExamType === 'Unit Test 1';
      const recordsToSave: {
        studentId: string;
        marksObtained: number;
        maxMarks: number;
      }[] = [];

      for (const student of matchingStudents) {
        const row = rowsState[student.id];
        if (!row) continue;
        const markVal = isU1 ? row.unit1Marks : row.unit2Marks;
        const validation = validateSingleMark(
          markVal,
          student.student_name || student.name || 'Student',
          selectedExamType
        );
        if (!validation.valid) {
          setValidationError(validation.error || 'Marks cannot exceed 30.');
          return;
        }
        recordsToSave.push({
          studentId: student.id,
          marksObtained: validation.value,
          maxMarks: 30,
        });
      }

      const res = saveUnitTestBatchMarks(activeCourse.id, selectedExamType, recordsToSave);
      if (res.success) {
        setRowsState((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((id) => {
            next[id] = { ...next[id], isSaved: true };
          });
          return next;
        });
        setSuccessNotice(
          `Successfully saved ${selectedExamType} marks (${recordsToSave.length} students) for ${activeCourseTitle} [${activeCourseCode}] out of 30!`
        );
      } else {
        setValidationError(res.message);
      }
    } else {
      // Combined save
      const updates: {
        studentId: string;
        subjectId: string;
        unit1Marks: number;
        unit1MaxMarks: number;
        unit2Marks: number;
        unit2MaxMarks: number;
      }[] = [];

      for (const student of matchingStudents) {
        const row = rowsState[student.id];
        if (!row) continue;
        const v1 = validateSingleMark(row.unit1Marks, row.name, 'Unit Test 1');
        const v2 = validateSingleMark(row.unit2Marks, row.name, 'Unit Test 2');
        if (!v1.valid) {
          setValidationError(v1.error || 'Marks cannot exceed 30.');
          return;
        }
        if (!v2.valid) {
          setValidationError(v2.error || 'Marks cannot exceed 30.');
          return;
        }
        updates.push({
          studentId: student.id,
          subjectId: activeCourse.id,
          unit1Marks: v1.value,
          unit1MaxMarks: 30,
          unit2Marks: v2.value,
          unit2MaxMarks: 30,
        });
      }

      const res = saveBatchMarks(activeCourse.id, updates);
      if (res.success) {
        setRowsState((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((id) => {
            next[id] = { ...next[id], isSaved: true };
          });
          return next;
        });
        setSuccessNotice(`Saved Unit Test 1 & Unit Test 2 marks for all ${updates.length} students!`);
      } else {
        setValidationError(res.message);
      }
    }
  };

  // Download PDF Handler
  const handleDownloadPDF = async () => {
    if (!activeCourse) {
      setValidationError('Please select a course to download the PDF report.');
      return;
    }
    if (matchingStudents.length === 0) {
      setValidationError('No students found for the selected programming department and year.');
      return;
    }

    setIsExportingPdf(true);
    const teacherDisplayName = currentTeacher?.name || 'Course Faculty';
    const teacherPosition = 'Course Faculty';

    try {
      if (selectedExamType === 'Unit Test 1' || selectedExamType === 'Unit Test 2') {
        const isU1 = selectedExamType === 'Unit Test 1';

        // Check if any mark exceeds 30
        for (const st of matchingStudents) {
          const row = rowsState[st.id];
          if (row) {
            const markVal = Number(isU1 ? row.unit1Marks : row.unit2Marks) || 0;
            if (markVal > 30) {
              setValidationError('Marks cannot exceed 30.');
              setIsExportingPdf(false);
              return;
            }
          }
        }

        const pdfStudents = matchingStudents.map((student, index) => {
          const row = rowsState[student.id];
          const rawMark = row ? (isU1 ? row.unit1Marks : row.unit2Marks) : 0;
          const marksObtained = Number(rawMark) || 0;
          const percentage = Number(((marksObtained / 30) * 100).toFixed(1));

          let status: 'Excellent' | 'First Class' | 'Pass' | 'Needs Attention' | 'Fail' = 'Pass';
          let remarks = 'Good';

          if (percentage >= 75) {
            status = 'Excellent';
            remarks = 'Excellent';
          } else if (percentage >= 60) {
            status = 'First Class';
            remarks = 'Good';
          } else if (percentage >= 40) {
            status = 'Pass';
            remarks = 'Satisfactory';
          } else {
            status = 'Needs Attention';
            remarks = 'Needs Support';
          }

          return {
            srNo: index + 1,
            enrollmentNo:
              student.enrollment_number ||
              student.enrollmentNo ||
              student.rollNumber ||
              student.prn ||
              'N/A',
            studentName: student.student_name || student.name || 'Student',
            marksObtained,
            maxMarks: 30,
            percentage,
            status,
            remarks,
          };
        });

        await exportExamMarksPDF({
          programmingName: selectedProgramming,
          courseTitle: activeCourseTitle,
          courseCode: activeCourseCode,
          year: selectedYear,
          examType: selectedExamType,
          teacherName: teacherDisplayName,
          teacherPosition,
          maxMarks: 30,
          students: pdfStudents,
        });
      } else {
        // Combined PDF
        const pdfStudents = matchingStudents.map((student, index) => {
          const row = rowsState[student.id];
          const u1 = Number(row ? row.unit1Marks : 0) || 0;
          const u2 = Number(row ? row.unit2Marks : 0) || 0;
          const avg = Number(((u1 + u2) / 2).toFixed(1));
          const percentage = Number(((avg / 30) * 100).toFixed(1));

          let performance: any = 'Pass';
          if (percentage >= 75) performance = 'Excellent';
          else if (percentage >= 60) performance = 'First Class';
          else if (percentage >= 40) performance = 'Pass';
          else performance = 'Needs Attention';

          return {
            srNo: index + 1,
            enrollmentNo:
              student.enrollment_number ||
              student.enrollmentNo ||
              student.rollNumber ||
              student.prn ||
              'N/A',
            studentName: student.student_name || student.name || 'Student',
            unit1Marks: u1,
            unit2Marks: u2,
            averageMarks: avg,
            percentage,
            performance,
          };
        });

        await exportSubjectMarksPDF({
          programmingName: selectedProgramming,
          department: selectedProgramming,
          year: selectedYear,
          subject: activeCourse,
          teacherName: teacherDisplayName,
          teacherPosition,
          students: pdfStudents,
        });
      }
    } catch (err) {
      console.error('PDF Export Error:', err);
      showToast('Error generating PDF report.', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-12" id="marks-allocation-section">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#D7E3EA] shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-[#0B1F3A] text-[#00D9FF] rounded-xl shadow-xs">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black text-[#172B4D] tracking-tight">
                Marks Allocation
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-[#0B1F3A]/5 text-[#0B1F3A] rounded-full border border-[#00D9FF]/30">
                EURO MANDAR
              </span>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-[#F5F9FC] text-[#0B1F3A] rounded-lg border border-[#D7E3EA]">
                Max Marks: 30
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              Academic Workflow: Programming Name → Year → Course Title → Course Code → Unit Test → Student Marks Entry
            </p>
          </div>
        </div>

        {activeCourse && matchingStudents.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* AI Marks Scanner Button */}
            <button
              type="button"
              onClick={() => setIsAiScannerOpen(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-linear-to-r from-[#082B5C] to-[#123B78] hover:from-[#0B1F3A] hover:to-[#082B5C] text-white text-xs font-bold rounded-xl border border-[#00D9FF]/40 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95 shadow-xs"
              id="ai-marks-scanner-header-btn"
              title="Extract student marks from physical sheet image or PDF"
            >
              <Sparkles className="w-4 h-4 text-[#00D9FF]" />
              <span>Scan Marks with AI</span>
            </button>

            {/* Download PDF Button */}
            <button
              type="button"
              disabled={isExportingPdf}
              onClick={handleDownloadPDF}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-[#F5F9FC] hover:bg-[#E2ECF4] text-[#172B4D] text-xs font-bold rounded-xl border border-[#D7E3EA] transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50 active:scale-95 shadow-xs"
              id="download-marks-pdf-header-btn"
              title="Download official PDF result sheet"
            >
              <FileText className="w-4 h-4 text-[#0094B3]" />
              <span>{isExportingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>

            {/* Save All Button */}
            <button
              type="button"
              onClick={handleSaveAll}
              className="flex-1 sm:flex-initial px-6 py-2.5 bg-[#0B1F3A] hover:bg-[#102A43] text-white text-xs font-bold rounded-xl shadow-md shadow-[#0B1F3A]/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95 border border-[#00D9FF]/30"
              id="save-all-marks-header-btn"
            >
              <Save className="w-4 h-4 text-[#00D9FF]" />
              <span>Save All ({matchingStudents.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* Step-by-Step Flow Container */}
      <div className="space-y-4">
        
        {/* STEPS 1 to 4: Sequential Selection Flow */}
        <div className="bg-white rounded-2xl p-6 border border-[#D7E3EA] shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#D7E3EA] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#0B1F3A] text-[#00D9FF] font-bold text-xs flex items-center justify-center border border-[#00D9FF]/30">
                ✓
              </span>
              <h3 className="text-sm font-bold text-[#172B4D] uppercase tracking-wider">
                Step 1 to 4: Course &amp; Academic Selection Flow
              </h3>
            </div>
            <span className="text-xs text-[#64748B] font-medium hidden sm:inline-block">
              Strict Year-Wise Separation Enforced
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Step 1: Programming Name */}
            <div className="p-3.5 bg-[#F5F9FC] rounded-xl border border-[#D7E3EA] space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#172B4D] uppercase tracking-wider">
                <span>Step 1: Programming Name</span>
                <span className="text-[#0094B3] font-mono">01</span>
              </div>
              <select
                value={selectedProgramming}
                onChange={(e) => setSelectedProgramming(e.target.value as Department)}
                className="w-full px-3 py-2 bg-white text-xs font-semibold text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:border-[#00D9FF] outline-none cursor-pointer"
                id="step-1-programming-name"
              >
                <option value="Computer Engineering">Computer Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
              </select>
            </div>

            {/* Step 2: Year */}
            <div className="p-3.5 bg-[#F5F9FC] rounded-xl border border-[#D7E3EA] space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#172B4D] uppercase tracking-wider">
                <span>Step 2: Select Year</span>
                <span className="text-[#0094B3] font-mono">02</span>
              </div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value as AcademicYear)}
                className="w-full px-3 py-2 bg-white text-xs font-bold text-[#0B1F3A] border border-[#D7E3EA] rounded-xl focus:border-[#00D9FF] outline-none cursor-pointer"
                id="step-2-select-year"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="2nd Year DSY">2nd Year DSY</option>
              </select>
            </div>

            {/* Step 3: Course Title (Year-Wise Only) */}
            <div className="p-3.5 bg-[#F5F9FC] rounded-xl border border-[#D7E3EA] space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#172B4D] uppercase tracking-wider">
                <span>Step 3: Course Title</span>
                <button
                  type="button"
                  onClick={() =>
                    setCourseFormModal({
                      isOpen: true,
                      courseToEdit: null,
                      defaultDept: selectedProgramming,
                      defaultYear: selectedYear,
                    })
                  }
                  className="text-[10px] text-[#0094B3] hover:text-[#0B1F3A] font-bold hover:underline cursor-pointer"
                  id="add-course-quick-link"
                >
                  + Add Course
                </button>
              </div>
              {availableCourses.length > 0 ? (
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-xs font-bold text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:border-[#00D9FF] outline-none cursor-pointer truncate"
                  id="step-3-course-title"
                >
                  {availableCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.course_title || c.subject_name}
                    </option>
                  ))}
                </select>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setCourseFormModal({
                      isOpen: true,
                      courseToEdit: null,
                      defaultDept: selectedProgramming,
                      defaultYear: selectedYear,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#0B1F3A]/5 hover:bg-[#0B1F3A]/10 text-[#0B1F3A] border border-dashed border-[#D7E3EA] rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
                  id="add-course-empty-trigger"
                >
                  + Add Course for {selectedYear}
                </button>
              )}
            </div>

            {/* Step 4: Course Code (Auto-displayed from Course Title) */}
            <div className="p-3.5 bg-[#F5F9FC] rounded-xl border border-[#D7E3EA] space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#172B4D] uppercase tracking-wider">
                <span>Step 4: Course Code</span>
                <span className="text-[#0094B3] font-mono">04</span>
              </div>
              <div className="w-full px-3 py-2 bg-[#0B1F3A]/5 text-xs font-mono font-bold text-[#0B1F3A] border border-[#D7E3EA] rounded-xl truncate flex items-center justify-between">
                <span>{activeCourseCode || '—'}</span>
                <span className="text-[10px] text-[#64748B] font-sans font-normal">Max 30M</span>
              </div>
            </div>

          </div>
        </div>

        {/* STEP 5: Select Examination (Unit Test 1 / Unit Test 2 / Combined) */}
        <div className="bg-white rounded-2xl p-6 border border-[#D7E3EA] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#0B1F3A] text-[#00D9FF] font-bold text-xs flex items-center justify-center border border-[#00D9FF]/30">
                05
              </span>
              <h3 className="text-sm font-bold text-[#172B4D] uppercase tracking-wider">
                Step 5: Select Examination
              </h3>
            </div>
            <span className="text-xs text-[#64748B] font-medium">
              Unit Test 1 (30M) and Unit Test 2 (30M) are allocated separately without overwriting
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" id="exam-type-selection-container">
            {/* Unit Test 1 */}
            <button
              type="button"
              onClick={() => {
                setSelectedExamType('Unit Test 1');
                setValidationError(null);
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                selectedExamType === 'Unit Test 1'
                  ? 'bg-[#0B1F3A]/5 border-[#00D9FF] text-[#172B4D] ring-2 ring-[#00D9FF]/20 shadow-xs'
                  : 'bg-[#F5F9FC] border-[#D7E3EA] text-[#64748B] hover:bg-[#E2ECF4]'
              }`}
              id="select-unit-test-1-btn"
            >
              <div>
                <div className="font-black text-sm text-[#172B4D]">Unit Test 1</div>
                <div className="text-[11px] text-[#64748B] mt-0.5">
                  Max Marks: 30 • Individual Allocation
                </div>
              </div>
              {selectedExamType === 'Unit Test 1' && (
                <span className="p-1.5 bg-[#0B1F3A] text-[#00D9FF] rounded-full">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              )}
            </button>

            {/* Unit Test 2 */}
            <button
              type="button"
              onClick={() => {
                setSelectedExamType('Unit Test 2');
                setValidationError(null);
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                selectedExamType === 'Unit Test 2'
                  ? 'bg-[#0B1F3A]/5 border-[#00D9FF] text-[#172B4D] ring-2 ring-[#00D9FF]/20 shadow-xs'
                  : 'bg-[#F5F9FC] border-[#D7E3EA] text-[#64748B] hover:bg-[#E2ECF4]'
              }`}
              id="select-unit-test-2-btn"
            >
              <div>
                <div className="font-black text-sm text-[#172B4D]">Unit Test 2</div>
                <div className="text-[11px] text-[#64748B] mt-0.5">
                  Max Marks: 30 • Individual Allocation
                </div>
              </div>
              {selectedExamType === 'Unit Test 2' && (
                <span className="p-1.5 bg-[#0B1F3A] text-[#00D9FF] rounded-full">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              )}
            </button>

            {/* Combined Overview */}
            <button
              type="button"
              onClick={() => {
                setSelectedExamType('Combined');
                setValidationError(null);
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                selectedExamType === 'Combined'
                  ? 'bg-[#0B1F3A]/5 border-[#00D9FF] text-[#172B4D] ring-2 ring-[#00D9FF]/20 shadow-xs'
                  : 'bg-[#F5F9FC] border-[#D7E3EA] text-[#64748B] hover:bg-[#E2ECF4]'
              }`}
              id="select-combined-exam-btn"
            >
              <div>
                <div className="font-black text-sm text-[#172B4D]">Combined Overview</div>
                <div className="text-[11px] text-[#64748B] mt-0.5">
                  Unit Test 1 &amp; 2 Average &amp; Performance
                </div>
              </div>
              {selectedExamType === 'Combined' && (
                <span className="p-1.5 bg-[#0B1F3A] text-[#00D9FF] rounded-full">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Validation / Success Messages */}
      {validationError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {successNotice && (
        <div className="p-4 bg-[#DCFCE7] border border-[#BBF7D0] rounded-xl text-[#16A34A] text-xs font-medium flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* STEP 6: Display Students & Enter Marks */}
      <div className="bg-white rounded-2xl border border-[#D7E3EA] shadow-xs overflow-hidden">
        
        {/* Table Top Header */}
        <div className="p-6 border-b border-[#D7E3EA] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F5F9FC]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#0B1F3A] text-[#00D9FF] font-bold text-xs flex items-center justify-center border border-[#00D9FF]/30">
              06
            </span>
            <div>
              <h3 className="text-sm font-black text-[#172B4D] uppercase tracking-wider">
                Step 6: Student Marks Entry Table ({matchingStudents.length} Students)
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                {selectedProgramming} • <strong className="text-[#0B1F3A]">{selectedYear}</strong> • {activeCourseTitle} ({activeCourseCode})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-4 py-2 bg-[#0B1F3A] hover:bg-[#102A43] text-white text-xs font-bold rounded-xl shadow-md shadow-[#0B1F3A]/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border border-[#00D9FF]/30"
            >
              <Save className="w-3.5 h-3.5 text-[#00D9FF]" />
              <span>Save All</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-[#D7E3EA]">
            <thead className="bg-[#F5F9FC] font-bold text-[#0B1F3A] text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5 text-center w-14">Sr.</th>
                <th className="px-5 py-3.5">Enrollment No.</th>
                <th className="px-5 py-3.5">Student Name</th>

                {selectedExamType === 'Unit Test 1' && (
                  <>
                    <th className="px-5 py-3.5 text-center bg-[#0B1F3A]/5 text-[#0B1F3A] font-bold">
                      Unit Test 1 Marks (0–30)
                    </th>
                    <th className="px-4 py-3.5 text-center">Percentage</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                  </>
                )}

                {selectedExamType === 'Unit Test 2' && (
                  <>
                    <th className="px-5 py-3.5 text-center bg-[#0B1F3A]/5 text-[#0B1F3A] font-bold">
                      Unit Test 2 Marks (0–30)
                    </th>
                    <th className="px-4 py-3.5 text-center">Percentage</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                  </>
                )}

                {selectedExamType === 'Combined' && (
                  <>
                    <th className="px-4 py-3.5 text-center">Unit 1 / 30</th>
                    <th className="px-4 py-3.5 text-center">Unit 2 / 30</th>
                    <th className="px-4 py-3.5 text-center bg-[#0B1F3A]/5 text-[#0B1F3A] font-bold">
                      Average / 30
                    </th>
                    <th className="px-4 py-3.5 text-center">Percentage</th>
                    <th className="px-4 py-3.5 text-center">Performance</th>
                  </>
                )}

                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#D7E3EA] bg-white">
              {matchingStudents.length > 0 ? (
                matchingStudents.map((student, index) => {
                  const row = rowsState[student.id];
                  const u1Mark = row ? row.unit1Marks : 0;
                  const u2Mark = row ? row.unit2Marks : 0;

                  const numU1 = Number(u1Mark) || 0;
                  const numU2 = Number(u2Mark) || 0;

                  const activeMark = selectedExamType === 'Unit Test 1' ? numU1 : numU2;
                  const pct = Number(((activeMark / 30) * 100).toFixed(1));
                  const avgMark = Number(((numU1 + numU2) / 2).toFixed(1));
                  const combinedPct = Number(((avgMark / 30) * 100).toFixed(1));

                  const isSaved = row?.isSaved ?? true;

                  const enrollment =
                    student.enrollment_number ||
                    student.enrollmentNo ||
                    student.rollNumber ||
                    student.prn ||
                    'N/A';
                  const studentName = student.student_name || student.name || 'Student';

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-[#F5F9FC] transition-colors"
                      id={`marks-row-${student.id}`}
                    >
                      {/* Sr. No. */}
                      <td className="px-5 py-3.5 text-center font-mono font-medium text-[#64748B]">
                        {index + 1}
                      </td>

                      {/* Enrollment No. */}
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-[#0B1F3A] bg-[#F5F9FC] px-2 py-0.5 rounded border border-[#D7E3EA]">
                          {enrollment}
                        </span>
                      </td>

                      {/* Student Name */}
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-[#172B4D] text-sm block">
                          {studentName}
                        </span>
                      </td>

                      {/* Unit Test 1 Direct Input */}
                      {selectedExamType === 'Unit Test 1' && (
                        <>
                          <td className="px-5 py-3.5 text-center bg-[#F5F9FC]">
                            <div className="inline-flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                max="30"
                                value={u1Mark}
                                onChange={(e) =>
                                  handleInputChange(student.id, 'unit1Marks', e.target.value)
                                }
                                className={`w-20 px-2.5 py-1.5 text-center font-bold text-sm rounded-xl border outline-none transition-all ${
                                  Number(u1Mark) > 30
                                    ? 'bg-rose-50 border-rose-400 text-[#EF4444] ring-2 ring-rose-300'
                                    : 'bg-white border-[#D7E3EA] text-[#0B1F3A] focus:border-[#00D9FF] focus:ring-2 focus:ring-[#00D9FF]/20'
                                }`}
                                id={`u1-input-${student.id}`}
                              />
                              <span className="text-[#64748B] text-xs font-semibold">/ 30</span>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-center font-bold text-[#172B4D]">
                            {pct}%
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                pct >= 75
                                  ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]'
                                  : pct >= 60
                                  ? 'bg-[#0B1F3A]/5 text-[#0B1F3A] border border-[#D7E3EA]'
                                  : pct >= 40
                                  ? 'bg-amber-50 text-[#F59E0B] border border-amber-200'
                                  : 'bg-rose-50 text-[#EF4444] border border-rose-200'
                              }`}
                            >
                              {pct >= 75
                                ? 'Distinction'
                                : pct >= 60
                                ? 'First Class'
                                : pct >= 40
                                ? 'Pass'
                                : 'Needs Support'}
                            </span>
                          </td>
                        </>
                      )}

                      {/* Unit Test 2 Direct Input */}
                      {selectedExamType === 'Unit Test 2' && (
                        <>
                          <td className="px-5 py-3.5 text-center bg-[#F5F9FC]">
                            <div className="inline-flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                max="30"
                                value={u2Mark}
                                onChange={(e) =>
                                  handleInputChange(student.id, 'unit2Marks', e.target.value)
                                }
                                className={`w-20 px-2.5 py-1.5 text-center font-bold text-sm rounded-xl border outline-none transition-all ${
                                  Number(u2Mark) > 30
                                    ? 'bg-rose-50 border-rose-400 text-[#EF4444] ring-2 ring-rose-300'
                                    : 'bg-white border-[#D7E3EA] text-[#0B1F3A] focus:border-[#00D9FF] focus:ring-2 focus:ring-[#00D9FF]/20'
                                }`}
                                id={`u2-input-${student.id}`}
                              />
                              <span className="text-[#64748B] text-xs font-semibold">/ 30</span>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-center font-bold text-[#172B4D]">
                            {pct}%
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                pct >= 75
                                  ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]'
                                  : pct >= 60
                                  ? 'bg-[#0B1F3A]/5 text-[#0B1F3A] border border-[#D7E3EA]'
                                  : pct >= 40
                                  ? 'bg-amber-50 text-[#F59E0B] border border-amber-200'
                                  : 'bg-rose-50 text-[#EF4444] border border-rose-200'
                              }`}
                            >
                              {pct >= 75
                                ? 'Distinction'
                                : pct >= 60
                                ? 'First Class'
                                : pct >= 40
                                ? 'Pass'
                                : 'Needs Support'}
                            </span>
                          </td>
                        </>
                      )}

                      {/* Combined View */}
                      {selectedExamType === 'Combined' && (
                        <>
                          <td className="px-4 py-3.5 text-center">
                            <input
                              type="number"
                              min="0"
                              max="30"
                              value={u1Mark}
                              onChange={(e) =>
                                handleInputChange(student.id, 'unit1Marks', e.target.value)
                              }
                              className="w-16 px-2 py-1 text-center font-bold text-xs bg-[#F5F9FC] border border-[#D7E3EA] rounded-lg outline-none focus:border-[#00D9FF]"
                            />
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <input
                              type="number"
                              min="0"
                              max="30"
                              value={u2Mark}
                              onChange={(e) =>
                                handleInputChange(student.id, 'unit2Marks', e.target.value)
                              }
                              className="w-16 px-2 py-1 text-center font-bold text-xs bg-[#F5F9FC] border border-[#D7E3EA] rounded-lg outline-none focus:border-[#00D9FF]"
                            />
                          </td>

                          <td className="px-4 py-3.5 text-center bg-[#F5F9FC]">
                            <span className="font-black text-[#172B4D] text-sm">
                              {avgMark}
                            </span>
                            <span className="text-[#64748B] text-xs"> / 30</span>
                          </td>

                          <td className="px-4 py-3.5 text-center font-bold text-[#0094B3]">
                            {combinedPct}%
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                combinedPct >= 75
                                  ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]'
                                  : combinedPct >= 60
                                  ? 'bg-[#0B1F3A]/5 text-[#0B1F3A] border border-[#D7E3EA]'
                                  : combinedPct >= 40
                                  ? 'bg-amber-50 text-[#F59E0B] border border-amber-200'
                                  : 'bg-rose-50 text-[#EF4444] border border-rose-200'
                              }`}
                            >
                              {combinedPct >= 75
                                ? 'Distinction'
                                : combinedPct >= 60
                                ? 'First Class'
                                : combinedPct >= 40
                                ? 'Pass'
                                : 'Needs Support'}
                            </span>
                          </td>
                        </>
                      )}

                      {/* Single Save Action */}
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleSaveSingleRow(student.id)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1 cursor-pointer ${
                            isSaved
                              ? 'bg-[#F5F9FC] text-[#64748B] hover:bg-[#0B1F3A]/5 hover:text-[#0B1F3A] border border-[#D7E3EA]'
                              : 'bg-[#0B1F3A] text-white hover:bg-[#102A43] shadow-xs border border-[#00D9FF]/30'
                          }`}
                          id={`save-row-btn-${student.id}`}
                        >
                          <Save className="w-3 h-3 text-[#00D9FF]" />
                          <span>{isSaved ? 'Saved' : 'Save'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#64748B]">
                    <Users className="w-10 h-10 mx-auto mb-2 text-[#64748B]" />
                    <p className="font-semibold text-sm text-[#172B4D]">
                      No students found for {selectedProgramming} • {selectedYear}
                    </p>
                    <p className="text-xs text-[#64748B] mt-1">
                      Add students to this year or select another programming department above.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* AI Marks Scanner Modal */}
      <AiMarksScannerModal
        isOpen={isAiScannerOpen}
        onClose={() => setIsAiScannerOpen(false)}
        targetProgramming={selectedProgramming}
        targetYear={selectedYear}
        targetSubjectId={selectedSubjectId}
      />
    </div>
  );
};
