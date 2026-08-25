import React, { useState, useRef } from 'react';
import { useAcademic } from '../../context/AcademicContext';
import { useAuth } from '../../context/AuthContext';
import { Department, AcademicYear } from '../../types';
import { sortStudentsByEnrollment } from '../../utils/studentSorting';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Plus,
  X,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  Eye,
  FileSearch,
  Sparkles,
} from 'lucide-react';

interface ExtractedStudentRow {
  id: string;
  selected: boolean;
  student_name: string;
  enrollment_number: string;
  department: Department;
  year: AcademicYear;
  uncertain_fields: string[];
  uncertainty_reason: string;
  isDuplicate: boolean;
  duplicateAction: 'skip' | 'update';
}

export const ImportStudentsModal: React.FC = () => {
  const {
    importStudentsModal,
    setImportStudentsModal,
    students: existingStudents,
    importStudentsBatch,
  } = useAcademic();
  const { currentTeacher } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [defaultDept, setDefaultDept] = useState<Department>(
    currentTeacher?.department || 'Computer Engineering'
  );
  const [defaultYear, setDefaultYear] = useState<AcademicYear>('2nd Year');

  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionStage, setExtractionStage] = useState<string>('');
  const [extractedRows, setExtractedRows] = useState<ExtractedStudentRow[]>([]);
  const [hasExtracted, setHasExtracted] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rawDetectedText, setRawDetectedText] = useState<string>('');
  const [showRawTextViewer, setShowRawTextViewer] = useState<boolean>(false);
  const [detectedPageCount, setDetectedPageCount] = useState<number>(1);
  const [extractionEngine, setExtractionEngine] = useState<string>('');

  // Bulk edit state
  const [bulkDept, setBulkDept] = useState<Department>(defaultDept);
  const [bulkYear, setBulkYear] = useState<AcademicYear>(defaultYear);

  if (!importStudentsModal.isOpen) return null;

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setExtractedRows([]);
    setHasExtracted(false);
    setIsExtracting(false);
    setErrorMsg(null);
    setRawDetectedText('');
    setShowRawTextViewer(false);
    setImportStudentsModal({ isOpen: false });
  };

  // Pre-process and enhance images using HTML5 Canvas for optimal OCR sharpness & contrast
  const preprocessImageFile = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
          return;
        }

        // Maintain high resolution
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        try {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;

          // Simple contrast & sharpness boost
          const contrast = 1.15; // 15% contrast boost
          const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
            data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
            data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
          }

          ctx.putImageData(imgData, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.95));
        } catch {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        }
      };

      img.onerror = () => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = (file: File) => {
    setErrorMsg(null);
    setRawDetectedText('');
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|pdf)$/i)) {
      setErrorMsg('Please select a valid image (JPG, PNG, WebP) or PDF file.');
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      setErrorMsg('File size exceeds 30MB. Please upload a smaller image or document.');
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const checkDuplicate = (enrollment: string): boolean => {
    const clean = enrollment.trim().toUpperCase();
    if (!clean) return false;
    return existingStudents.some(
      (s) =>
        (s.enrollment_number || s.enrollmentNo || s.rollNumber || s.prn || '').toUpperCase() === clean
    );
  };

  const processExtractedData = (rawList: any[]) => {
    const rows: ExtractedStudentRow[] = rawList.map((item, idx) => {
      const enrollment = (item.enrollment_number || '').trim().toUpperCase();
      const isDup = checkDuplicate(enrollment);
      const uncertainFields = Array.isArray(item.uncertain_fields) ? item.uncertain_fields : [];
      let reason = item.uncertainty_reason || '';

      // Secondary rule: check for common 0 vs O or 1 vs I digit ambiguities
      if (enrollment && /[OISZB]/.test(enrollment) && /\d/.test(enrollment)) {
        if (!uncertainFields.includes('enrollment_number')) {
          uncertainFields.push('enrollment_number');
          reason = reason || 'Please check enrollment number for OCR ambiguity (0/O, 1/I, 5/S, 8/B).';
        }
      }

      return {
        id: `row_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
        selected: true,
        student_name: (item.student_name || '').trim(),
        enrollment_number: enrollment,
        department: (item.department as Department) || defaultDept,
        year: (item.year as AcademicYear) || defaultYear,
        uncertain_fields: uncertainFields,
        uncertainty_reason: reason,
        isDuplicate: isDup,
        duplicateAction: 'skip',
      };
    });

    const sortedRows = sortStudentsByEnrollment(rows);
    setExtractedRows(sortedRows);
    setHasExtracted(true);
  };

  const handleStartExtraction = async () => {
    if (!selectedFile) {
      setErrorMsg('Please choose an image or PDF student document to extract.');
      return;
    }

    setIsExtracting(true);
    setErrorMsg(null);
    setExtractionStage('Preprocessing document and optimizing visual clarity...');

    try {
      let base64Data = '';
      if (selectedFile.type.startsWith('image/')) {
        base64Data = await preprocessImageFile(selectedFile);
      } else {
        const reader = new FileReader();
        base64Data = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
      }

      setExtractionStage('Analyzing document structure and extracting student records...');

      const response = await fetch('/api/students/extract-from-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileBase64: base64Data,
          mimeType: selectedFile.type || (selectedFile.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
          fileName: selectedFile.name,
          defaultDepartment: defaultDept,
          defaultYear: defaultYear,
        }),
      });

      const result = await response.json();

      if (result.rawText) {
        setRawDetectedText(result.rawText);
      }
      if (result.pageCount) {
        setDetectedPageCount(result.pageCount);
      }
      if (result.engineUsed) {
        setExtractionEngine(result.engineUsed);
      }

      if (result.success && Array.isArray(result.students) && result.students.length > 0) {
        processExtractedData(result.students);
      } else {
        setExtractedRows([]);
        setHasExtracted(true);
        setErrorMsg('Unable to confidently extract student details from this file. Please upload a clearer image/PDF or enter/correct the student information manually.');
      }
    } catch (err: any) {
      console.error('OCR Extraction Failed:', err);
      setExtractedRows([]);
      setHasExtracted(true);
      setErrorMsg(`Unable to extract student details from this file (${err.message || 'Network error'}). Please upload a clearer image/PDF or enter student details manually.`);
    } finally {
      setIsExtracting(false);
    }
  };

  // Row update handlers
  const handleRowChange = (id: string, field: keyof ExtractedStudentRow, value: any) => {
    setExtractedRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value };
        if (field === 'enrollment_number') {
          updated.enrollment_number = String(value).toUpperCase();
          updated.isDuplicate = checkDuplicate(updated.enrollment_number);
        }
        return updated;
      })
    );
  };

  const handleRemoveRow = (id: string) => {
    setExtractedRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddRow = () => {
    const newRow: ExtractedStudentRow = {
      id: `row_manual_${Date.now()}`,
      selected: true,
      student_name: '',
      enrollment_number: '',
      department: defaultDept,
      year: defaultYear,
      uncertain_fields: [],
      uncertainty_reason: '',
      isDuplicate: false,
      duplicateAction: 'skip',
    };
    setExtractedRows((prev) => [...prev, newRow]);
  };

  const handleToggleSelectAll = (select: boolean) => {
    setExtractedRows((prev) => prev.map((r) => ({ ...r, selected: select })));
  };

  const handleApplyBulkDept = () => {
    setExtractedRows((prev) =>
      prev.map((r) => (r.selected ? { ...r, department: bulkDept } : r))
    );
  };

  const handleApplyBulkYear = () => {
    setExtractedRows((prev) =>
      prev.map((r) => (r.selected ? { ...r, year: bulkYear } : r))
    );
  };

  const handleSetAllDuplicateAction = (action: 'skip' | 'update') => {
    setExtractedRows((prev) =>
      prev.map((r) => (r.isDuplicate ? { ...r, duplicateAction: action } : r))
    );
  };

  // Save selected students to database
  const handleSaveToDatabase = () => {
    const selectedRows = extractedRows.filter((r) => r.selected);
    if (selectedRows.length === 0) {
      setErrorMsg('Please select at least one student to import.');
      return;
    }

    // Validation for empty fields
    const invalidRows = selectedRows.filter(
      (r) => !r.student_name.trim() || !r.enrollment_number.trim()
    );
    if (invalidRows.length > 0) {
      setErrorMsg(`Please fill in student names and enrollment numbers for all ${invalidRows.length} selected row(s).`);
      return;
    }

    const payload = selectedRows.map((r) => ({
      student_name: r.student_name.trim(),
      enrollment_number: r.enrollment_number.trim().toUpperCase(),
      department: r.department,
      year: r.year,
      actionOnDuplicate: r.duplicateAction,
    }));

    const result = importStudentsBatch(payload);
    if (result.success) {
      handleClose();
    }
  };

  const totalExtracted = extractedRows.length;
  const selectedCount = extractedRows.filter((r) => r.selected).length;
  const duplicateCount = extractedRows.filter((r) => r.isDuplicate).length;
  const uncertainCount = extractedRows.filter((r) => r.uncertain_fields.length > 0).length;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-[#071426]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      id="import-students-modal-overlay"
    >
      <div
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-[#D7E3EA] flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        id="import-students-modal-dialog"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#D7E3EA] bg-[#0B1F3A] text-white shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#102A43] text-[#00D9FF] flex items-center justify-center shrink-0 shadow-xs border border-[#00D9FF]/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Import Students from Document / Image / PDF
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#102A43] text-[#00D9FF] rounded-full border border-[#00D9FF]/40">
                  Accurate OCR &amp; Table Extraction
                </span>
              </h3>
              <p className="text-xs text-[#67E8F9]/80 mt-0.5">
                Upload student rosters, photos, screenshots, or PDFs to automatically extract student names, enrollment IDs, programme, and year.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-[#64748B] hover:text-white rounded-xl hover:bg-[#102A43] transition-colors cursor-pointer"
            id="close-import-students-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
              <div className="flex items-start sm:items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#F59E0B] mt-0.5 sm:mt-0" />
                <span className="font-bold">{errorMsg}</span>
              </div>
              {rawDetectedText && (
                <button
                  type="button"
                  onClick={() => setShowRawTextViewer(!showRawTextViewer)}
                  className="shrink-0 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 font-bold rounded-lg text-amber-900 flex items-center gap-1.5 cursor-pointer"
                  id="view-extracted-text-btn"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showRawTextViewer ? 'Hide Extracted Text' : 'View Extracted Text'}</span>
                </button>
              )}
            </div>
          )}

          {/* Raw Text / OCR Auditing Viewer */}
          {showRawTextViewer && rawDetectedText && (
            <div className="p-4 bg-[#0B1F3A] text-[#F5F9FC] rounded-2xl border border-[#102A43] text-xs font-mono">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#102A43]">
                <span className="font-bold text-[#00D9FF] flex items-center gap-2">
                  <FileSearch className="w-4 h-4 text-[#00D9FF]" />
                  Raw Detected Document Text:
                </span>
                <span className="text-[11px] text-[#64748B]">
                  {detectedPageCount > 1 ? `${detectedPageCount} pages` : 'Single document'} • {extractionEngine}
                </span>
              </div>
              <pre className="whitespace-pre-wrap max-h-48 overflow-y-auto text-[11px] leading-relaxed text-[#F5F9FC] p-2.5 bg-[#071426] rounded-xl border border-[#102A43]">
                {rawDetectedText}
              </pre>
            </div>
          )}

          {!hasExtracted ? (
            /* Upload Screen */
            <div className="space-y-6">
              {/* Document Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#00D9FF] bg-[#F5F9FC] ring-4 ring-[#00D9FF]/20'
                    : 'border-[#D7E3EA] hover:border-[#00D9FF] hover:bg-[#F5F9FC]'
                }`}
                id="student-document-dropzone"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  id="student-file-input"
                />

                <div className="w-14 h-14 rounded-2xl bg-[#0B1F3A] text-[#00D9FF] flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <Upload className="w-7 h-7" />
                </div>

                <h4 className="text-sm font-bold text-[#172B4D]">
                  {selectedFile ? selectedFile.name : 'Click to select or drag and drop student document'}
                </h4>
                <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
                  Supports <strong className="text-[#0B1F3A]">JPG, JPEG, PNG, and PDF</strong> files. Scanned roster sheets, photos of attendance registers, or multi-page digital class lists.
                </p>

                {selectedFile && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-[#F5F9FC] text-[#0B1F3A] rounded-xl text-xs font-bold border border-[#D7E3EA]">
                    <FileText className="w-4 h-4 text-[#0094B3]" />
                    <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="ml-1 text-[#64748B] hover:text-[#EF4444] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Image Preview if applicable */}
              {previewUrl && (
                <div className="p-3.5 bg-[#F5F9FC] rounded-2xl border border-[#D7E3EA] flex items-center gap-4">
                  <img
                    src={previewUrl}
                    alt="Document preview"
                    className="w-16 h-16 object-cover rounded-xl border border-[#D7E3EA]"
                  />
                  <div className="flex-1 text-xs">
                    <p className="font-bold text-[#172B4D]">Image Preview Ready</p>
                    <p className="text-[#64748B]">The OCR engine will read tabular rows, student names, and enrollment numbers directly from this uploaded file.</p>
                  </div>
                </div>
              )}

              {/* Extraction Fallback Configurations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#F5F9FC] rounded-2xl border border-[#D7E3EA]">
                <div>
                  <label className="block text-xs font-bold text-[#172B4D] mb-1">
                    Fallback Programme (If not explicitly present in file)
                  </label>
                  <select
                    value={defaultDept}
                    onChange={(e) => setDefaultDept(e.target.value as Department)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-[#D7E3EA] bg-white text-[#172B4D] focus:border-[#00D9FF] outline-none"
                    id="import-default-dept-select"
                  >
                    <option value="Computer Engineering">Computer Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172B4D] mb-1">
                    Fallback Academic Year (If not explicitly present in file)
                  </label>
                  <select
                    value={defaultYear}
                    onChange={(e) => setDefaultYear(e.target.value as AcademicYear)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-[#D7E3EA] bg-white text-[#172B4D] focus:border-[#00D9FF] outline-none"
                    id="import-default-year-select"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="2nd Year DSY">2nd Year DSY</option>
                  </select>
                </div>
              </div>

              {/* Extraction Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleStartExtraction}
                  disabled={!selectedFile || isExtracting}
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
                    !selectedFile || isExtracting
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-[#0B1F3A] hover:bg-[#102A43] text-white shadow-md shadow-[#0B1F3A]/20 active:scale-95 border border-[#00D9FF]/30'
                  }`}
                  id="start-ocr-extraction-btn"
                >
                  {isExtracting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#00D9FF]" />
                      <span>{extractionStage || 'Extracting Student Records...'}</span>
                    </>
                  ) : (
                    <>
                      <span>Extract Student Details</span>
                      <ArrowRight className="w-4 h-4 text-[#00D9FF]" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Review & Verification Table Screen */
            <div className="space-y-5">
              {/* Source Document Reference Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#F5F9FC] rounded-2xl border border-[#D7E3EA]">
                <div className="flex items-center gap-2.5 text-xs">
                  <FileText className="w-4 h-4 text-[#0094B3]" />
                  <div>
                    <span className="text-[#64748B] font-semibold">SOURCE FILE: </span>
                    <strong className="text-[#172B4D] font-bold">{selectedFile?.name || 'Uploaded Document'}</strong>
                    {detectedPageCount > 1 && (
                      <span className="ml-2 px-2 py-0.5 text-[10px] bg-[#0B1F3A] text-[#00D9FF] rounded font-bold">
                        {detectedPageCount} Pages Processed
                      </span>
                    )}
                  </div>
                </div>

                {rawDetectedText && (
                  <button
                    type="button"
                    onClick={() => setShowRawTextViewer(!showRawTextViewer)}
                    className="px-3 py-1.5 bg-white hover:bg-[#F5F9FC] border border-[#D7E3EA] text-[#0B1F3A] text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#0094B3]" />
                    <span>{showRawTextViewer ? 'Hide OCR Text' : 'View Extracted Text'}</span>
                  </button>
                )}
              </div>

              {/* Summary Stats Header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-white rounded-2xl border border-[#D7E3EA] shadow-2xs">
                  <div className="text-[11px] font-bold text-[#64748B]">Total Extracted</div>
                  <div className="text-xl font-black text-[#172B4D] mt-0.5">{totalExtracted}</div>
                </div>
                <div className="p-3.5 bg-[#DCFCE7] rounded-2xl border border-[#BBF7D0] shadow-2xs">
                  <div className="text-[11px] font-bold text-[#16A34A]">Selected to Save</div>
                  <div className="text-xl font-black text-[#16A34A] mt-0.5">{selectedCount}</div>
                </div>
                <div className="p-3.5 bg-[#F5F9FC] rounded-2xl border border-[#D7E3EA] shadow-2xs">
                  <div className="text-[11px] font-bold text-[#0B1F3A]">Existing Duplicates</div>
                  <div className="text-xl font-black text-[#0B1F3A] mt-0.5">{duplicateCount}</div>
                </div>
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 shadow-2xs">
                  <div className="text-[11px] font-bold text-[#F59E0B]">OCR Review Flags</div>
                  <div className="text-xl font-black text-amber-800 mt-0.5">{uncertainCount}</div>
                </div>
              </div>

              {/* Review Guidance Banner */}
              <div className="p-4 bg-[#F5F9FC] border border-[#D7E3EA] rounded-2xl flex items-start gap-3 text-xs text-[#172B4D]">
                <ShieldCheck className="w-4 h-4 text-[#0094B3] shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Verification Ledger:</strong> The student details extracted from your uploaded file are listed below. You may edit names, enrollment IDs, departments, or academic years, and resolve duplicate actions before saving.
                </div>
              </div>

              {/* Batch Editing Controls Bar */}
              <div className="p-3.5 bg-white rounded-2xl border border-[#D7E3EA] shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#172B4D]">Set Programme for selected:</span>
                    <select
                      value={bulkDept}
                      onChange={(e) => setBulkDept(e.target.value as Department)}
                      className="px-2.5 py-1.5 rounded-lg border border-[#D7E3EA] bg-[#F5F9FC] text-[#172B4D] font-semibold"
                    >
                      <option value="Computer Engineering">Computer Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Electrical Engineering">Electrical Engineering</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleApplyBulkDept}
                      className="px-2.5 py-1.5 bg-[#F5F9FC] hover:bg-[#E2ECF4] font-bold rounded-lg text-[#0B1F3A] border border-[#D7E3EA] cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#172B4D]">Set Year:</span>
                    <select
                      value={bulkYear}
                      onChange={(e) => setBulkYear(e.target.value as AcademicYear)}
                      className="px-2.5 py-1.5 rounded-lg border border-[#D7E3EA] bg-[#F5F9FC] text-[#172B4D] font-semibold"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="2nd Year DSY">2nd Year DSY</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleApplyBulkYear}
                      className="px-2.5 py-1.5 bg-[#F5F9FC] hover:bg-[#E2ECF4] font-bold rounded-lg text-[#0B1F3A] border border-[#D7E3EA] cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {duplicateCount > 0 && (
                    <div className="flex items-center gap-1.5 bg-[#F5F9FC] px-2.5 py-1 rounded-lg border border-[#D7E3EA]">
                      <span className="text-[#0B1F3A] font-bold">Duplicates:</span>
                      <button
                        type="button"
                        onClick={() => handleSetAllDuplicateAction('skip')}
                        className="px-2 py-0.5 bg-white rounded font-bold text-[#0B1F3A] hover:text-[#0094B3] border border-[#D7E3EA] cursor-pointer"
                      >
                        Skip All
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetAllDuplicateAction('update')}
                        className="px-2 py-0.5 bg-[#0B1F3A] text-white rounded font-bold hover:bg-[#102A43] cursor-pointer"
                      >
                        Update All
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="px-3 py-1.5 bg-[#0B1F3A] hover:bg-[#102A43] text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 border border-[#00D9FF]/30"
                    id="import-add-row-btn"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#00D9FF]" />
                    <span>Add Row</span>
                  </button>
                </div>
              </div>

              {/* Table Container */}
              <div className="border border-[#D7E3EA] rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-[380px]">
                  <table className="w-full text-left text-xs border-collapse" id="extracted-students-table">
                    <thead className="bg-[#F5F9FC] text-[#0B1F3A] font-bold sticky top-0 z-10 border-b border-[#D7E3EA]">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={extractedRows.length > 0 && extractedRows.every((r) => r.selected)}
                            onChange={(e) => handleToggleSelectAll(e.target.checked)}
                            className="rounded text-[#0B1F3A] focus:ring-[#00D9FF] cursor-pointer"
                            id="select-all-extracted-students-checkbox"
                          />
                        </th>
                        <th className="p-3 w-10 text-center">Sr.</th>
                        <th className="p-3 min-w-[200px]">Student Name</th>
                        <th className="p-3 min-w-[150px]">Enrollment Number</th>
                        <th className="p-3 min-w-[170px]">Programme</th>
                        <th className="p-3 min-w-[120px]">Academic Year</th>
                        <th className="p-3 min-w-[180px]">Status &amp; Validation</th>
                        <th className="p-3 w-12 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D7E3EA] text-[#172B4D]">
                      {extractedRows.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-[#64748B]">
                            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-[#F59E0B]" />
                            <p className="font-bold text-[#172B4D]">No student records found in table</p>
                            <p className="text-xs text-[#64748B] mt-1">Click "+ Add Row" above to enter students manually, or view the extracted raw text.</p>
                          </td>
                        </tr>
                      ) : (
                        extractedRows.map((row, idx) => {
                          const hasOcrWarning = row.uncertain_fields.length > 0;
                          return (
                            <tr
                              key={row.id}
                              className={`hover:bg-[#F5F9FC] transition-colors ${
                                !row.selected ? 'opacity-60 bg-[#F5F9FC]/50' : ''
                              }`}
                              id={`extracted-student-row-${idx + 1}`}
                            >
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={row.selected}
                                  onChange={(e) => handleRowChange(row.id, 'selected', e.target.checked)}
                                  className="rounded text-[#0B1F3A] focus:ring-[#00D9FF] cursor-pointer"
                                />
                              </td>
                              <td className="p-3 text-center font-mono font-medium text-[#64748B]">
                                {idx + 1}
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.student_name}
                                  onChange={(e) => handleRowChange(row.id, 'student_name', e.target.value)}
                                  placeholder="Enter Student Name"
                                  className={`w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border bg-white text-[#172B4D] transition-all ${
                                    !row.student_name.trim()
                                      ? 'border-rose-400 ring-2 ring-rose-400/20'
                                      : 'border-[#D7E3EA] focus:border-[#00D9FF]'
                                  }`}
                                />
                              </td>
                              <td className="p-2">
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={row.enrollment_number}
                                    onChange={(e) => handleRowChange(row.id, 'enrollment_number', e.target.value)}
                                    placeholder="e.g. 24110980111"
                                    className={`w-full px-2.5 py-1.5 text-xs font-mono font-bold uppercase rounded-lg border bg-white text-[#172B4D] transition-all ${
                                      !row.enrollment_number.trim()
                                        ? 'border-rose-400 ring-2 ring-rose-400/20'
                                        : hasOcrWarning
                                        ? 'border-amber-400 bg-amber-50/40 text-amber-900'
                                        : 'border-[#D7E3EA] focus:border-[#00D9FF]'
                                    }`}
                                  />
                                </div>
                              </td>
                              <td className="p-2">
                                <select
                                  value={row.department}
                                  onChange={(e) => handleRowChange(row.id, 'department', e.target.value as Department)}
                                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D7E3EA] bg-white text-[#172B4D]"
                                >
                                  <option value="Computer Engineering">Computer Engineering</option>
                                  <option value="Civil Engineering">Civil Engineering</option>
                                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                                  <option value="Electrical Engineering">Electrical Engineering</option>
                                </select>
                              </td>
                              <td className="p-2">
                                <select
                                  value={row.year}
                                  onChange={(e) => handleRowChange(row.id, 'year', e.target.value as AcademicYear)}
                                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D7E3EA] bg-white text-[#172B4D]"
                                >
                                  <option value="1st Year">1st Year</option>
                                  <option value="2nd Year">2nd Year</option>
                                  <option value="3rd Year">3rd Year</option>
                                  <option value="2nd Year DSY">2nd Year DSY</option>
                                </select>
                              </td>
                              <td className="p-3">
                                <div className="flex flex-col gap-1">
                                  {row.isDuplicate ? (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-[#F5F9FC] text-[#0B1F3A] border border-[#D7E3EA]">
                                        Exists
                                      </span>
                                      <div className="inline-flex rounded border border-[#D7E3EA] overflow-hidden text-[10px]">
                                        <button
                                          type="button"
                                          onClick={() => handleRowChange(row.id, 'duplicateAction', 'skip')}
                                          className={`px-1.5 py-0.5 font-bold cursor-pointer ${
                                            row.duplicateAction === 'skip'
                                              ? 'bg-[#0B1F3A] text-white'
                                              : 'bg-white text-[#64748B]'
                                          }`}
                                        >
                                          Skip
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRowChange(row.id, 'duplicateAction', 'update')}
                                          className={`px-1.5 py-0.5 font-bold cursor-pointer ${
                                            row.duplicateAction === 'update'
                                              ? 'bg-[#0B1F3A] text-[#00D9FF]'
                                              : 'bg-white text-[#64748B]'
                                          }`}
                                        >
                                          Update
                                        </button>
                                      </div>
                                    </div>
                                  ) : hasOcrWarning ? (
                                    <div className="flex items-center gap-1 text-[11px] text-amber-700 font-medium">
                                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#F59E0B]" />
                                      <span title={row.uncertainty_reason}>Check OCR characters</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 text-[11px] text-[#16A34A] font-semibold">
                                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#22C55E]" />
                                      <span>Ready to Add</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRow(row.id)}
                                  className="p-1 text-[#64748B] hover:text-[#EF4444] rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Remove row"
                                >
                                  <Trash2 className="w-4 h-4" />
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
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#D7E3EA] bg-[#F5F9FC] shrink-0">
          {hasExtracted ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setHasExtracted(false);
                  setExtractedRows([]);
                  setErrorMsg(null);
                }}
                className="px-4 py-2 text-xs font-bold text-[#64748B] hover:bg-[#E2ECF4] hover:text-[#0B1F3A] rounded-xl transition-colors cursor-pointer"
                id="import-reupload-btn"
              >
                Upload Different File
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-bold text-[#64748B] hover:bg-[#E2ECF4] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveToDatabase}
                  disabled={selectedCount === 0}
                  className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95 ${
                    selectedCount === 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-[#0B1F3A] hover:bg-[#102A43] text-white shadow-[#0B1F3A]/20 border border-[#00D9FF]/30'
                  }`}
                  id="confirm-import-students-btn"
                >
                  <Check className="w-4 h-4 text-[#00D9FF]" />
                  <span>Save Selected Students ({selectedCount})</span>
                </button>
              </div>
            </>
          ) : (
            <div className="ml-auto">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2 text-xs font-bold text-[#64748B] hover:bg-[#E2ECF4] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
