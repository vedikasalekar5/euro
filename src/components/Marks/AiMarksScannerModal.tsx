import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  X,
  Sparkles,
  Upload,
  Camera,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Plus,
  RefreshCw,
  ShieldAlert,
  GraduationCap,
  BookOpen,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  Department,
  AcademicYear,
  Student,
  Subject,
  PROGRAMMING_OPTIONS,
  ACADEMIC_YEAR_OPTIONS,
  AcademicYearSession,
} from '../../types';
import { useAcademic } from '../../context/AcademicContext';

interface ExtractedMarkRow {
  tempId: string;
  studentName: string;
  enrollmentNo: string;
  unit1Marks: string | number;
  unit2Marks: string | number;
  uncertainFields: string[];
  uncertaintyReason?: string;
  matchedStudentId?: string;
  existingU1?: number;
  existingU2?: number;
  hasExistingMarks?: boolean;
  overwriteAction?: 'replace' | 'keep';
  isNewStudent?: boolean;
}

interface AiMarksScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDepartment?: Department;
  targetProgramming?: Department;
  targetYear?: AcademicYear;
  targetAcademicYear?: string;
  targetSubjectId?: string;
}

export const AiMarksScannerModal: React.FC<AiMarksScannerModalProps> = ({
  isOpen,
  onClose,
  targetDepartment,
  targetProgramming,
  targetYear,
  targetAcademicYear,
  targetSubjectId,
}) => {
  const { students, subjects, marks, saveBatchMarks, addStudent, showToast } = useAcademic();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const initialProg = targetProgramming || targetDepartment || PROGRAMMING_OPTIONS[0];
  const [selectedProgramming, setSelectedProgramming] = useState<Department>(initialProg);
  const [selectedAcademicYearSession, setSelectedAcademicYearSession] = useState<AcademicYearSession>(
    targetAcademicYear || ACADEMIC_YEAR_OPTIONS[0]
  );
  const [selectedClassYear, setSelectedClassYear] = useState<AcademicYear>(targetYear || '2nd Year');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(targetSubjectId || '');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [extractedRows, setExtractedRows] = useState<ExtractedMarkRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Synchronize initial selections when modal opens with new props
  useEffect(() => {
    if (isOpen) {
      const prog = targetProgramming || targetDepartment || PROGRAMMING_OPTIONS[0];
      setSelectedProgramming(prog);
      if (targetYear) setSelectedClassYear(targetYear);
      if (targetAcademicYear) setSelectedAcademicYearSession(targetAcademicYear);
      if (targetSubjectId) setSelectedCourseId(targetSubjectId);
      setValidationError(null);
    }
  }, [isOpen, targetProgramming, targetDepartment, targetYear, targetAcademicYear, targetSubjectId]);

  // Filter courses available for the selected Programming and Class Year
  const availableCourses = useMemo(() => {
    return subjects.filter((s) => {
      const matchProg =
        s.programming_name === selectedProgramming ||
        s.programmingName === selectedProgramming ||
        s.department === selectedProgramming;
      const matchYear = s.year === selectedClassYear;
      return matchProg && matchYear;
    });
  }, [subjects, selectedProgramming, selectedClassYear]);

  // Auto-select first matching course if current selected course is invalid
  useEffect(() => {
    if (availableCourses.length > 0) {
      if (!selectedCourseId || !availableCourses.some((c) => c.id === selectedCourseId)) {
        setSelectedCourseId(availableCourses[0].id);
      }
    } else {
      setSelectedCourseId('');
    }
  }, [availableCourses, selectedCourseId]);

  const activeCourse = subjects.find((s) => s.id === selectedCourseId);
  const courseTitle = activeCourse?.course_title || activeCourse?.subject_name || 'Selected Course';
  const courseCode = activeCourse?.course_code || activeCourse?.subjectCode || '';
  const maxMarks = activeCourse?.unit1MaxMarks || 30;

  // Filter existing students in this Programming & Year
  const rosterStudents = useMemo(() => {
    return students.filter(
      (s) =>
        (s.department === selectedProgramming || (s as any).programming_name === selectedProgramming) &&
        s.year === selectedClassYear
    );
  }, [students, selectedProgramming, selectedClassYear]);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    setValidationError(null);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleProcessScan = async () => {
    // 1. Mandatory Validation
    setValidationError(null);

    if (!selectedProgramming) {
      setValidationError('Please select a Programming branch before scanning.');
      showToast('Programming selection is required.', 'error');
      return;
    }

    if (!selectedAcademicYearSession) {
      setValidationError('Please select an Academic Year before scanning.');
      showToast('Academic Year selection is required.', 'error');
      return;
    }

    if (!selectedCourseId || !activeCourse) {
      setValidationError('Please select a Target Course to associate the marks with.');
      showToast('Target Course selection is required.', 'error');
      return;
    }

    if (!selectedFile) {
      setValidationError('Please select or capture a marks sheet document or photo.');
      showToast('No marks sheet document selected.', 'error');
      return;
    }

    setIsScanning(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = async () => {
        const base64Data = reader.result as string;

        const res = await fetch('/api/marks/extract-from-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64: base64Data,
            mimeType: selectedFile.type,
            fileName: selectedFile.name,
            programming: selectedProgramming,
            academicYear: `${selectedAcademicYearSession} (${selectedClassYear})`,
            courseTitle: `${courseTitle} [${courseCode}]`,
            maxMarks: maxMarks,
          }),
        });

        const json = await res.json();
        if (json.success && Array.isArray(json.extractedMarks) && json.extractedMarks.length > 0) {
          // Process and match extracted rows against roster & existing marks
          const parsedRows: ExtractedMarkRow[] = json.extractedMarks.map((raw: any, idx: number) => {
            const rawName = (raw.student_name || '').trim();
            const rawEnroll = (raw.enrollment_number || '').trim().toUpperCase();

            // Match with existing student in roster
            const matched = rosterStudents.find((st) => {
              const stEnroll = (st.enrollment_number || st.enrollmentNo || st.rollNumber || '').trim().toUpperCase();
              const stName = (st.student_name || st.name || '').toLowerCase();
              if (rawEnroll && stEnroll && rawEnroll === stEnroll) return true;
              if (rawName && stName && (rawName.toLowerCase().includes(stName) || stName.includes(rawName.toLowerCase()))) return true;
              return false;
            });

            // Check existing marks in database for this course
            let existingU1: number | undefined;
            let existingU2: number | undefined;
            let hasExisting = false;

            if (matched) {
              const existingRecord = marks.find(
                (m) =>
                  (m.student_id === matched.id || (m as any).studentId === matched.id) &&
                  (m.subject_id === selectedCourseId || (m as any).subjectId === selectedCourseId)
              );
              if (existingRecord) {
                existingU1 = existingRecord.unit_1_marks ?? (existingRecord as any).unit1Marks;
                existingU2 = existingRecord.unit_2_marks ?? (existingRecord as any).unit2Marks;
                if ((existingU1 !== undefined && existingU1 > 0) || (existingU2 !== undefined && existingU2 > 0)) {
                  hasExisting = true;
                }
              }
            }

            return {
              tempId: `extracted_${Date.now()}_${idx}`,
              studentName: matched ? (matched.student_name || matched.name || rawName) : rawName,
              enrollmentNo: matched ? (matched.enrollment_number || matched.enrollmentNo || rawEnroll) : rawEnroll,
              unit1Marks: raw.unit_1_marks !== null && raw.unit_1_marks !== undefined ? raw.unit_1_marks : '',
              unit2Marks: raw.unit_2_marks !== null && raw.unit_2_marks !== undefined ? raw.unit_2_marks : '',
              uncertainFields: raw.uncertain_fields || [],
              uncertaintyReason: raw.uncertainty_reason,
              matchedStudentId: matched?.id,
              existingU1,
              existingU2,
              hasExistingMarks: hasExisting,
              overwriteAction: 'replace',
              isNewStudent: !matched,
            };
          });

          setExtractedRows(parsedRows);
        } else {
          // If no rows found automatically, provide one empty row for manual entry
          setExtractedRows([
            {
              tempId: `manual_${Date.now()}`,
              studentName: '',
              enrollmentNo: '',
              unit1Marks: '',
              unit2Marks: '',
              uncertainFields: [],
              overwriteAction: 'replace',
              isNewStudent: true,
            },
          ]);
        }
        setIsScanning(false);
      };
    } catch (err: any) {
      console.error(err);
      setIsScanning(false);
      showToast('Error parsing marks document: ' + err.message, 'error');
    }
  };

  const handleRowChange = (tempId: string, field: keyof ExtractedMarkRow, value: any) => {
    setExtractedRows((prev) =>
      prev.map((row) => {
        if (row.tempId === tempId) {
          const updated = { ...row, [field]: value };
          // If enrollment changed, match with roster
          if (field === 'enrollmentNo') {
            const cleanEnroll = String(value).trim().toUpperCase();
            const matched = rosterStudents.find(
              (s) => (s.enrollment_number || s.enrollmentNo || '').trim().toUpperCase() === cleanEnroll
            );
            if (matched) {
              updated.studentName = matched.student_name || matched.name || updated.studentName;
              updated.matchedStudentId = matched.id;
              updated.isNewStudent = false;
            } else {
              updated.isNewStudent = true;
            }
          }
          return updated;
        }
        return row;
      })
    );
  };

  const handleAddRow = () => {
    setExtractedRows((prev) => [
      ...prev,
      {
        tempId: `row_new_${Date.now()}_${Math.random()}`,
        studentName: '',
        enrollmentNo: '',
        unit1Marks: '',
        unit2Marks: '',
        uncertainFields: [],
        overwriteAction: 'replace',
        isNewStudent: true,
      },
    ]);
  };

  const handleDeleteRow = (tempId: string) => {
    setExtractedRows((prev) => prev.filter((r) => r.tempId !== tempId));
  };

  const handleConfirmSave = async () => {
    // 1. Validation Checks
    if (!selectedProgramming) {
      setValidationError('Please select a Programming branch.');
      showToast('Programming is required.', 'error');
      return;
    }

    if (!selectedAcademicYearSession) {
      setValidationError('Please select an Academic Year.');
      showToast('Academic Year is required.', 'error');
      return;
    }

    if (!selectedCourseId || !activeCourse) {
      setValidationError('Please select a target course.');
      showToast('Target course is required.', 'error');
      return;
    }

    if (extractedRows.length === 0) {
      showToast('No student marks rows to save.', 'error');
      return;
    }

    // Row-by-row validation
    for (const row of extractedRows) {
      if (!row.studentName.trim() && !row.enrollmentNo.trim()) {
        showToast('Each row must have a Student Name or Enrollment Number.', 'error');
        return;
      }

      const u1 = row.unit1Marks !== '' ? Number(row.unit1Marks) : 0;
      const u2 = row.unit2Marks !== '' ? Number(row.unit2Marks) : 0;

      if (isNaN(u1) || u1 < 0 || u1 > maxMarks) {
        showToast(
          `Invalid Unit 1 marks for "${row.studentName || 'Student'}". Must be between 0 and ${maxMarks}.`,
          'error'
        );
        return;
      }
      if (isNaN(u2) || u2 < 0 || u2 > maxMarks) {
        showToast(
          `Invalid Unit 2 marks for "${row.studentName || 'Student'}". Must be between 0 and ${maxMarks}.`,
          'error'
        );
        return;
      }
    }

    setIsSaving(true);

    try {
      const recordsToSave: Array<{
        studentId: string;
        unit1Marks: number;
        unit1MaxMarks: number;
        unit2Marks: number;
        unit2MaxMarks: number;
        remarks?: string;
      }> = [];

      for (const row of extractedRows) {
        let sId = row.matchedStudentId;

        // If student not already matched to an ID, look up in current students or create new record
        if (!sId) {
          const match = students.find(
            (s) =>
              (s.enrollment_number || s.enrollmentNo || '').trim().toUpperCase() ===
              row.enrollmentNo.trim().toUpperCase()
          );
          if (match) {
            sId = match.id;
          } else {
            // Automatically create new student with selected Programming and Academic Year
            const createRes = addStudent({
              student_name: row.studentName.trim() || `Student ${row.enrollmentNo.trim()}`,
              enrollment_number: row.enrollmentNo.trim().toUpperCase() || `EN${Date.now()}`,
              department: selectedProgramming,
              year: selectedClassYear,
            });
            if (createRes.success && createRes.student) {
              sId = createRes.student.id;
            }
          }
        }

        if (sId) {
          let finalU1 = Number(row.unit1Marks) || 0;
          let finalU2 = Number(row.unit2Marks) || 0;

          // If keep existing choice
          if (row.overwriteAction === 'keep' && row.hasExistingMarks) {
            if (row.existingU1 !== undefined) finalU1 = row.existingU1;
            if (row.existingU2 !== undefined) finalU2 = row.existingU2;
          }

          recordsToSave.push({
            studentId: sId,
            unit1Marks: finalU1,
            unit1MaxMarks: maxMarks,
            unit2Marks: finalU2,
            unit2MaxMarks: maxMarks,
            remarks: `AI Marks Sheet Scan (${selectedProgramming} • ${selectedAcademicYearSession})`,
          });
        }
      }

      if (recordsToSave.length > 0) {
        saveBatchMarks(selectedCourseId, recordsToSave);
        onClose();
      } else {
        showToast('Could not link student records. Please check the rows.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Failed to save batch marks: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      id="ai-marks-scanner-modal"
    >
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl border border-[#D7E3EA] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 bg-[#082B5C] text-white flex items-center justify-between border-b border-[#00D9FF]/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00D9FF]/20 border border-[#00D9FF]/40 text-[#00D9FF] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#00D9FF]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Scan Marks with AI
              </h2>
              <p className="text-xs text-[#CFFAFE]/80 mt-0.5">
                Physical marks sheet photo or PDF OCR extraction with teacher review
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            id="close-ai-marks-scanner-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#F5F9FC]">
          
          {/* Validation Notice Banner */}
          {validationError && (
            <div className="p-3 bg-[#FEF2F2] border border-[#F87171] rounded-xl flex items-center gap-2.5 text-xs text-[#DC2626] font-semibold">
              <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Configuration Form: Programming & Academic Year Selection */}
          <div className="bg-white p-4 rounded-xl border border-[#D7E3EA] shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-[#D7E3EA] pb-2">
              <Layers className="w-4 h-4 text-[#0094B3]" />
              <h3 className="text-xs font-black text-[#172B4D] uppercase tracking-wider">
                Target Academic &amp; Course Mapping
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              
              {/* 1. Programming Selector */}
              <div>
                <label className="block font-bold text-[#172B4D] uppercase tracking-wider text-[11px] mb-1">
                  Programming <span className="text-[#EF4444]">*</span>
                </label>
                <select
                  value={selectedProgramming}
                  onChange={(e) => setSelectedProgramming(e.target.value as Department)}
                  className="w-full px-3 py-2 rounded-lg bg-white text-[#082B5C] font-bold border border-[#CBD5E1] focus:ring-2 focus:ring-[#00D9FF] focus:border-[#00D9FF] outline-none cursor-pointer"
                  id="scanner-programming-select"
                >
                  {PROGRAMMING_OPTIONS.map((prog) => (
                    <option key={prog} value={prog}>
                      {prog}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Academic Year Selector */}
              <div>
                <label className="block font-bold text-[#172B4D] uppercase tracking-wider text-[11px] mb-1">
                  Academic Year <span className="text-[#EF4444]">*</span>
                </label>
                <select
                  value={selectedAcademicYearSession}
                  onChange={(e) => setSelectedAcademicYearSession(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white text-[#082B5C] font-bold border border-[#CBD5E1] focus:ring-2 focus:ring-[#00D9FF] focus:border-[#00D9FF] outline-none cursor-pointer"
                  id="scanner-academic-year-select"
                >
                  {ACADEMIC_YEAR_OPTIONS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Class / Year of Study */}
              <div>
                <label className="block font-bold text-[#172B4D] uppercase tracking-wider text-[11px] mb-1">
                  Year of Study <span className="text-[#EF4444]">*</span>
                </label>
                <select
                  value={selectedClassYear}
                  onChange={(e) => setSelectedClassYear(e.target.value as AcademicYear)}
                  className="w-full px-3 py-2 rounded-lg bg-white text-[#082B5C] font-bold border border-[#CBD5E1] focus:ring-2 focus:ring-[#00D9FF] focus:border-[#00D9FF] outline-none cursor-pointer"
                  id="scanner-class-year-select"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="2nd Year DSY">2nd Year DSY</option>
                </select>
              </div>

              {/* 4. Target Course */}
              <div>
                <label className="block font-bold text-[#172B4D] uppercase tracking-wider text-[11px] mb-1">
                  Target Course ({maxMarks} Marks) <span className="text-[#EF4444]">*</span>
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white text-[#082B5C] font-bold border border-[#CBD5E1] focus:ring-2 focus:ring-[#00D9FF] focus:border-[#00D9FF] outline-none cursor-pointer"
                  id="scanner-course-select"
                >
                  {availableCourses.length > 0 ? (
                    availableCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.course_title || c.subject_name} ({c.course_code || c.subjectCode || 'Code'})
                      </option>
                    ))
                  ) : (
                    <option value="">No courses created for this class</option>
                  )}
                </select>
              </div>

            </div>

            <div className="text-[11px] text-[#64748B] flex items-center gap-1.5 pt-1">
              <GraduationCap className="w-3.5 h-3.5 text-[#0094B3]" />
              <span>
                Scanned records will be mapped to <strong>{selectedProgramming}</strong> • <strong>{selectedAcademicYearSession}</strong> ({selectedClassYear}).
              </span>
            </div>
          </div>

          {/* Upload / Capture Document Section */}
          <div className="bg-white p-5 rounded-xl border-2 border-dashed border-[#00D9FF]/40 hover:border-[#00D9FF] transition-all text-center space-y-3 bg-[#ECFEFF]/20">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            />

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 bg-[#082B5C] hover:bg-[#123B78] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer border border-[#00D9FF]/30 active:scale-95"
                id="upload-sheet-file-btn"
              >
                <Upload className="w-4 h-4 text-[#00D9FF]" />
                <span>Upload Marks Sheet (JPG, PNG, PDF)</span>
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="px-4 py-2.5 bg-white hover:bg-[#F8FAFC] text-[#082B5C] text-xs font-bold rounded-xl border border-[#D7E3EA] shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                id="camera-photo-btn"
              >
                <Camera className="w-4 h-4 text-[#00D9FF]" />
                <span>Take Photo with Camera</span>
              </button>
            </div>

            {selectedFile && (
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-[#082B5C] font-semibold">
                <FileText className="w-4 h-4 text-[#00D9FF]" />
                <span>
                  Selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
                <button
                  type="button"
                  onClick={handleProcessScan}
                  disabled={isScanning}
                  className="ml-2 px-4 py-1.5 bg-[#00D9FF] hover:bg-[#22D3EE] text-[#082B5C] font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 active:scale-95"
                  id="process-scan-btn"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'Scanning Table...' : 'Scan & Extract Marks'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Scanning Progress */}
          {isScanning && (
            <div className="bg-white p-6 rounded-xl border border-[#D7E3EA] text-center space-y-3 shadow-xs">
              <RefreshCw className="w-8 h-8 text-[#00D9FF] animate-spin mx-auto" />
              <h4 className="text-sm font-bold text-[#172B4D]">Scanning Marks Sheet with AI Vision...</h4>
              <p className="text-xs text-[#64748B]">
                Extracting student names, enrollment IDs, Unit Test 1 marks, and Unit Test 2 marks for {selectedProgramming}.
              </p>
            </div>
          )}

          {/* Extracted Marks Review Table */}
          {extractedRows.length > 0 && !isScanning && (
            <div className="bg-white rounded-xl border border-[#D7E3EA] shadow-xs p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D7E3EA] pb-3">
                <div>
                  <h3 className="text-sm font-black text-[#172B4D] flex items-center gap-2">
                    <span>Review Extracted Marks ({extractedRows.length} Students)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F59E0B]/10 text-[#D97706] border border-[#F59E0B]/20">
                      Mandatory Confirmation Required
                    </span>
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Review values below. Highlighted entries with ⚠️ indicate handwritten ambiguity. You may edit any field before saving.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddRow}
                  className="px-3 py-1.5 bg-[#F8FAFC] hover:bg-[#E2E8F0] text-[#082B5C] text-xs font-bold rounded-lg border border-[#CBD5E1] transition-all flex items-center gap-1.5 self-start cursor-pointer"
                  id="add-extracted-row-btn"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Missing Row</span>
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-[#D7E3EA]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#D7E3EA] text-[#64748B] font-bold uppercase tracking-wider">
                      <th className="p-2.5 w-10">#</th>
                      <th className="p-2.5">Student Name</th>
                      <th className="p-2.5">Enrollment No</th>
                      <th className="p-2.5 w-24">UT1 (/{maxMarks})</th>
                      <th className="p-2.5 w-24">UT2 (/{maxMarks})</th>
                      <th className="p-2.5">Status &amp; Verification</th>
                      <th className="p-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {extractedRows.map((row, idx) => {
                      const isUncertain = row.uncertainFields.length > 0;
                      const hasExisting = row.hasExistingMarks;

                      return (
                        <tr
                          key={row.tempId}
                          className={`transition-colors ${
                            isUncertain ? 'bg-[#FFFBEB]' : hasExisting ? 'bg-[#F0FDF4]/40' : 'hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <td className="p-2.5 font-bold text-[#64748B]">{idx + 1}</td>
                          
                          {/* Student Name */}
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={row.studentName}
                              onChange={(e) => handleRowChange(row.tempId, 'studentName', e.target.value)}
                              placeholder="Student Name"
                              className="w-full px-2 py-1.5 rounded-lg border border-[#CBD5E1] text-xs font-bold text-[#172B4D] focus:ring-2 focus:ring-[#00D9FF]"
                            />
                          </td>

                          {/* Enrollment No */}
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={row.enrollmentNo}
                              onChange={(e) => handleRowChange(row.tempId, 'enrollmentNo', e.target.value)}
                              placeholder="ENROLLMENT NO"
                              className="w-full px-2 py-1.5 rounded-lg border border-[#CBD5E1] text-xs font-mono font-bold text-[#082B5C] focus:ring-2 focus:ring-[#00D9FF]"
                            />
                          </td>

                          {/* UT1 Marks */}
                          <td className="p-2.5">
                            <input
                              type="number"
                              min="0"
                              max={maxMarks}
                              value={row.unit1Marks}
                              onChange={(e) => handleRowChange(row.tempId, 'unit1Marks', e.target.value)}
                              placeholder="0"
                              className={`w-20 px-2 py-1.5 rounded-lg border text-xs font-bold text-center focus:ring-2 focus:ring-[#00D9FF] ${
                                Number(row.unit1Marks) > maxMarks || Number(row.unit1Marks) < 0
                                  ? 'border-[#EF4444] bg-[#FEF2F2] text-[#DC2626]'
                                  : 'border-[#CBD5E1] text-[#172B4D]'
                              }`}
                            />
                          </td>

                          {/* UT2 Marks */}
                          <td className="p-2.5">
                            <input
                              type="number"
                              min="0"
                              max={maxMarks}
                              value={row.unit2Marks}
                              onChange={(e) => handleRowChange(row.tempId, 'unit2Marks', e.target.value)}
                              placeholder="0"
                              className={`w-20 px-2 py-1.5 rounded-lg border text-xs font-bold text-center focus:ring-2 focus:ring-[#00D9FF] ${
                                Number(row.unit2Marks) > maxMarks || Number(row.unit2Marks) < 0
                                  ? 'border-[#EF4444] bg-[#FEF2F2] text-[#DC2626]'
                                  : 'border-[#CBD5E1] text-[#172B4D]'
                              }`}
                            />
                          </td>

                          {/* Status & Warning Notice */}
                          <td className="p-2.5 text-[11px]">
                            {isUncertain && (
                              <div className="flex items-center gap-1 text-[#D97706] font-bold">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>{row.uncertaintyReason || 'Review handwriting'}</span>
                              </div>
                            )}

                            {hasExisting && !isUncertain && (
                              <div className="flex items-center gap-2 text-[#082B5C]">
                                <span className="font-semibold">
                                  Existing: UT1({row.existingU1 || 0}), UT2({row.existingU2 || 0})
                                </span>
                                <select
                                  value={row.overwriteAction}
                                  onChange={(e) => handleRowChange(row.tempId, 'overwriteAction', e.target.value)}
                                  className="px-1.5 py-0.5 rounded border border-[#CBD5E1] text-[10px] font-bold bg-white"
                                >
                                  <option value="replace">Replace</option>
                                  <option value="keep">Keep Existing</option>
                                </select>
                              </div>
                            )}

                            {!isUncertain && !hasExisting && (
                              <span className="text-[#10B981] font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{row.isNewStudent ? 'New Student • Ready' : 'Ready to save'}</span>
                              </span>
                            )}
                          </td>

                          {/* Delete */}
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(row.tempId)}
                              className="p-1 rounded-md text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-[#D7E3EA] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-[#64748B] flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-[#00D9FF]" />
            <span>Marks and student mappings will only be written to the database upon clicking Confirm &amp; Save.</span>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#64748B] font-bold text-xs rounded-xl transition-all cursor-pointer"
              id="cancel-scanner-modal-btn"
            >
              Cancel
            </button>

            {extractedRows.length > 0 && (
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="px-5 py-2 bg-[#082B5C] hover:bg-[#123B78] text-white font-bold text-xs rounded-xl shadow-md shadow-[#082B5C]/20 transition-all flex items-center gap-2 active:scale-95 cursor-pointer border border-[#00D9FF]/30 disabled:opacity-50"
                id="confirm-save-scanner-btn"
              >
                <CheckCircle2 className="w-4 h-4 text-[#00D9FF]" />
                <span>{isSaving ? 'Saving to Database...' : `Confirm & Save (${extractedRows.length} Records)`}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
