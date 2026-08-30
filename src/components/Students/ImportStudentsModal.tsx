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
  ArrowRight,
  ShieldCheck,
  Check,
  Eye,
  FileSearch,
  Users,
  AlertCircle,
  RotateCcw,
  Building2,
  Calendar,
} from 'lucide-react';

export interface ExtractedStudentRow {
  id: string;
  selected: boolean;
  student_name: string;
  enrollment_number: string;
  uncertain_fields: string[];
  uncertainty_reason: string;
  isDuplicate: boolean;
  duplicateAction: 'skip' | 'update';
}

export interface ImportResultSummary {
  success: boolean;
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  message: string;
  details?: Array<{
    student_name: string;
    enrollment_number: string;
    status: 'imported' | 'updated' | 'skipped' | 'failed';
    message: string;
  }>;
}

export const ImportStudentsModal: React.FC = () => {
  const {
    importStudentsModal,
    setImportStudentsModal,
    students: existingStudents,
    importStudentsBatch,
    showToast,
    refreshData,
  } = useAcademic();
  const { currentTeacher } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Manual Programming & Academic Year Selection
  const [selectedProgramming, setSelectedProgramming] = useState<Department>(
    (currentTeacher?.department as Department) || 'Computer Engineering'
  );
  const [selectedYear, setSelectedYear] = useState<AcademicYear>('2nd Year');

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

  // Saving state
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveProgressMessage, setSaveProgressMessage] = useState<string>('');

  // Import Result Screen state
  const [importResult, setImportResult] = useState<ImportResultSummary | null>(null);

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
    setImportResult(null);
    setImportStudentsModal({ isOpen: false });
  };

  const handleResetForNewImport = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setExtractedRows([]);
    setHasExtracted(false);
    setIsExtracting(false);
    setErrorMsg(null);
    setRawDetectedText('');
    setShowRawTextViewer(false);
    setImportResult(null);
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

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        try {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;

          // Contrast & sharpness boost
          const contrast = 1.15;
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
    setImportResult(null);
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
        (s.enrollment_number || s.enrollmentNo || s.prn || '').toUpperCase() === clean
    );
  };

  const processExtractedData = (rawList: any[]) => {
    const rows: ExtractedStudentRow[] = rawList.map((item, idx) => {
      const enrollment = (item.enrollment_number || '').trim().toUpperCase();
      const isDup = checkDuplicate(enrollment);
      const uncertainFields = Array.isArray(item.uncertain_fields) ? item.uncertain_fields : [];
      let reason = item.uncertainty_reason || '';

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
    setImportResult(null);
    setExtractionStage('Processing document...');

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

      setExtractionStage('Extracting Student Names & Enrollment Numbers...');

      const response = await fetch('/api/students/extract-from-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileBase64: base64Data,
          mimeType: selectedFile.type || (selectedFile.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
          fileName: selectedFile.name,
          defaultDepartment: selectedProgramming,
          defaultYear: selectedYear,
        }),
      });

      setExtractionStage('Preparing student preview...');

      let result: any = null;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          result = await response.json();
        } catch (jsonErr) {
          console.warn('Failed to parse JSON response:', jsonErr);
        }
      }

      if (!result) {
        result = {
          success: false,
          students: [],
          message: 'Unable to extract student details from this file. Please ensure the document is clear and readable.',
        };
      }

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
        setErrorMsg(result.message || 'No student records were detected in this file. Make sure the document contains clear student names and enrollment numbers (e.g., Name | Enrollment No).');
      }
    } catch (err: any) {
      console.error('Extraction Failed:', err);
      setExtractedRows([]);
      setHasExtracted(true);
      setErrorMsg('No student records were detected in this file. Make sure the document contains clear student names and enrollment numbers.');
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

  const handleSetAllDuplicateAction = (action: 'skip' | 'update') => {
    setExtractedRows((prev) =>
      prev.map((r) => (r.isDuplicate ? { ...r, duplicateAction: action } : r))
    );
  };

  // Save selected students to database
  const handleSaveToDatabase = async () => {
    // 1. Validate Programming and Year are selected
    if (!selectedProgramming) {
      setErrorMsg('Please select Programming before importing.');
      return;
    }
    if (!selectedYear) {
      setErrorMsg('Please select Academic Year before importing.');
      return;
    }

    const selectedRows = extractedRows.filter((r) => r.selected);
    if (selectedRows.length === 0) {
      setErrorMsg('Please select at least one student to import.');
      return;
    }

    // 2. Validate Student Names and Enrollment Numbers
    const invalidRows = selectedRows.filter(
      (r) => !r.student_name.trim() || !r.enrollment_number.trim()
    );
    if (invalidRows.length > 0) {
      setErrorMsg(`Please ensure all ${invalidRows.length} selected student(s) have both a Student Name and an Enrollment Number.`);
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSaveProgressMessage(`Importing ${selectedRows.length} student(s) into ${selectedProgramming} (${selectedYear})...`);

    try {
      // Build payload applying the manually selected Programming and Year to ALL students
      const payload = selectedRows.map((r) => ({
        student_name: r.student_name.trim(),
        enrollment_number: r.enrollment_number.trim().toUpperCase(),
        department: selectedProgramming,
        year: selectedYear,
        division: 'A',
        actionOnDuplicate: r.duplicateAction,
      }));

      const result = await importStudentsBatch(payload);

      // Populate summary result for dedicated confirmation view
      setImportResult({
        success: result.success,
        importedCount: result.importedCount,
        updatedCount: result.updatedCount,
        skippedCount: result.skippedCount,
        failedCount: result.failedCount,
        message: result.message,
        details: result.details,
      });

      if (result.success) {
        showToast(result.message || `${result.importedCount} student(s) imported successfully!`, 'success');
        await refreshData();
      } else {
        showToast(result.message || 'Import finished with warnings.', 'error');
      }
    } catch (err: any) {
      console.error('Import save error:', err);
      setErrorMsg(err.message || 'An error occurred while saving students to database.');
    } finally {
      setIsSaving(false);
      setSaveProgressMessage('');
    }
  };

  const totalExtracted = extractedRows.length;
  const selectedCount = extractedRows.filter((r) => r.selected).length;
  const duplicateCount = extractedRows.filter((r) => r.isDuplicate).length;
  const readyCount = extractedRows.filter((r) => r.selected && !r.isDuplicate).length;

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
                Import Students from PDF / Image / Document
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#102A43] text-[#00D9FF] rounded-full border border-[#00D9FF]/40">
                  Name + Enrollment Number Only
                </span>
              </h3>
              <p className="text-xs text-[#67E8F9]/80 mt-0.5">
                Extracts student names and enrollment numbers directly from documents. Programming and Year are selected manually.
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
          {/* Error Banner */}
          {errorMsg && !importResult && (
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

          {/* Raw Text Viewer */}
          {showRawTextViewer && rawDetectedText && (
            <div className="p-4 bg-[#0B1F3A] text-[#F5F9FC] rounded-2xl border border-[#102A43] text-xs font-mono">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#102A43]">
                <span className="font-bold text-[#00D9FF] flex items-center gap-2">
                  <FileSearch className="w-4 h-4 text-[#00D9FF]" />
                  Verbatim Extracted Text:
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

          {/* Step 3: Import Result Summary Screen */}
          {importResult ? (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200" id="import-result-summary-section">
              <div
                className={`p-6 rounded-2xl border ${
                  importResult.success && importResult.importedCount > 0
                    ? 'bg-[#DCFCE7]/40 border-[#BBF7D0]'
                    : importResult.success
                    ? 'bg-[#F5F9FC] border-[#D7E3EA]'
                    : 'bg-rose-50 border-rose-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      importResult.success && importResult.importedCount > 0
                        ? 'bg-[#16A34A] text-white'
                        : importResult.success
                        ? 'bg-[#0B1F3A] text-[#00D9FF]'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {importResult.success ? (
                      <CheckCircle2 className="w-7 h-7" />
                    ) : (
                      <AlertCircle className="w-7 h-7" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-black text-[#172B4D]">
                      {importResult.success && importResult.importedCount > 0
                        ? 'Import Completed Successfully'
                        : importResult.success
                        ? 'Import Completed (Existing Records Preserved)'
                        : 'Import Finished with Warnings'}
                    </h4>
                    <p className="text-xs text-[#64748B] mt-1 font-medium">
                      {importResult.message}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-[#0B1F3A]">
                      <span className="px-2.5 py-1 bg-white rounded-lg border border-[#D7E3EA]">
                        Programming: {selectedProgramming}
                      </span>
                      <span className="px-2.5 py-1 bg-white rounded-lg border border-[#D7E3EA]">
                        Year: {selectedYear}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-4 bg-[#DCFCE7] rounded-2xl border border-[#BBF7D0]">
                  <div className="text-xs font-bold text-[#16A34A] flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    New Students Added
                  </div>
                  <div className="text-2xl font-black text-[#16A34A] mt-1">
                    {importResult.importedCount}
                  </div>
                </div>

                <div className="p-4 bg-[#F5F9FC] rounded-2xl border border-[#D7E3EA]">
                  <div className="text-xs font-bold text-[#0B1F3A] flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4" />
                    Students Updated
                  </div>
                  <div className="text-2xl font-black text-[#0B1F3A] mt-1">
                    {importResult.updatedCount}
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                  <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                    Already Exist (Skipped)
                  </div>
                  <div className="text-2xl font-black text-amber-900 mt-1">
                    {importResult.skippedCount}
                  </div>
                </div>

                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200">
                  <div className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                    <X className="w-4 h-4 text-rose-500" />
                    Failed Records
                  </div>
                  <div className="text-2xl font-black text-rose-900 mt-1">
                    {importResult.failedCount}
                  </div>
                </div>
              </div>

              {/* Ledger Breakdown */}
              {importResult.details && importResult.details.length > 0 && (
                <div className="border border-[#D7E3EA] rounded-2xl overflow-hidden shadow-2xs">
                  <div className="px-5 py-3.5 bg-[#F5F9FC] border-b border-[#D7E3EA] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0B1F3A]">
                      Import Audit Ledger ({importResult.details.length} Records Processed)
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      Saved directly into Student Database
                    </span>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs divide-y divide-[#D7E3EA]">
                      <thead className="bg-[#F5F9FC] text-[#0B1F3A] text-[11px] font-bold">
                        <tr>
                          <th className="px-4 py-2.5">#</th>
                          <th className="px-4 py-2.5">Student Name</th>
                          <th className="px-4 py-2.5">Enrollment Number / PRN</th>
                          <th className="px-4 py-2.5">Result Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D7E3EA] bg-white">
                        {importResult.details.map((d, i) => {
                          let badgeBg = 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]';
                          let badgeText = 'Imported Successfully';

                          if (d.status === 'updated') {
                            badgeBg = 'bg-[#0B1F3A]/5 text-[#0B1F3A] border-[#D7E3EA]';
                            badgeText = 'Updated Record';
                          } else if (d.status === 'skipped') {
                            badgeBg = 'bg-amber-50 text-amber-800 border-amber-200';
                            badgeText = 'Already Exists (Skipped)';
                          } else if (d.status === 'failed') {
                            badgeBg = 'bg-rose-50 text-rose-700 border-rose-200';
                            badgeText = d.message || 'Failed';
                          }

                          return (
                            <tr key={i} className="hover:bg-[#F5F9FC]">
                              <td className="px-4 py-2 font-mono text-[#64748B]">{i + 1}</td>
                              <td className="px-4 py-2 font-bold text-[#172B4D]">{d.student_name}</td>
                              <td className="px-4 py-2 font-mono font-bold text-[#0B1F3A]">{d.enrollment_number}</td>
                              <td className="px-4 py-2">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeBg}`}>
                                  {badgeText}
                                </span>
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
          ) : !hasExtracted ? (
            /* Step 1: Upload Screen */
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
                  {selectedFile ? selectedFile.name : 'Click to select or drag & drop student list file'}
                </h4>
                <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
                  Supports <strong className="text-[#0B1F3A]">PDF, JPG, JPEG, PNG, and WebP</strong> files. Scanned student lists, class rosters, marks sheets, or screenshots.
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
                    <p className="font-bold text-[#172B4D]">Document Preview Ready</p>
                    <p className="text-[#64748B]">The parser will extract student names and enrollment numbers directly from this uploaded document.</p>
                  </div>
                </div>
              )}

              {/* Manual Programming & Year Selection */}
              <div className="p-5 bg-[#F5F9FC] rounded-2xl border border-[#D7E3EA] space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0B1F3A]">
                  <Building2 className="w-4 h-4 text-[#0094B3]" />
                  <span>Select Target Programme &amp; Academic Year (Applied to all imported students)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#172B4D] mb-1.5">
                      Programming / Department <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedProgramming}
                      onChange={(e) => setSelectedProgramming(e.target.value as Department)}
                      className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-[#D7E3EA] bg-white text-[#172B4D] focus:border-[#00D9FF] focus:ring-2 focus:ring-[#00D9FF]/20 outline-none transition-all"
                      id="import-programming-select"
                    >
                      <option value="Computer Engineering">Computer Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Electrical Engineering">Electrical Engineering</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172B4D] mb-1.5">
                      Academic Year <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value as AcademicYear)}
                      className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-[#D7E3EA] bg-white text-[#172B4D] focus:border-[#00D9FF] focus:ring-2 focus:ring-[#00D9FF]/20 outline-none transition-all"
                      id="import-year-select"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="2nd Year DSY">2nd Year DSY</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Extraction Action Button */}
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
                      <span>{extractionStage || 'Extracting Students...'}</span>
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
            /* Step 2: Review & Verification Preview Screen */
            <div className="space-y-5" id="import-preview-section">
              {/* Preview Header: Document Name & Students Found */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#0B1F3A] text-white rounded-2xl border border-[#102A43]">
                <div className="flex items-center gap-3 text-xs">
                  <div className="p-2 bg-[#102A43] text-[#00D9FF] rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] text-[#67E8F9]/80 font-bold uppercase tracking-wider">
                      IMPORT STUDENTS PREVIEW
                    </div>
                    <div className="text-sm font-black text-white mt-0.5 flex items-center gap-2">
                      <span>File: {selectedFile?.name || 'students.pdf'}</span>
                      <span className="px-2.5 py-0.5 text-xs bg-[#00D9FF] text-[#0B1F3A] rounded-full font-black">
                        Students Found: {totalExtracted}
                      </span>
                    </div>
                  </div>
                </div>

                {rawDetectedText && (
                  <button
                    type="button"
                    onClick={() => setShowRawTextViewer(!showRawTextViewer)}
                    className="px-3 py-1.5 bg-[#102A43] hover:bg-[#18395C] border border-[#00D9FF]/30 text-[#00D9FF] text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{showRawTextViewer ? 'Hide Verbatim Text' : 'View Verbatim Text'}</span>
                  </button>
                )}
              </div>

              {/* Manual Programming & Year Selection Bar */}
              <div className="p-4 bg-[#F5F9FC] rounded-2xl border border-[#D7E3EA] flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-[#172B4D] flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-[#0094B3]" />
                      Programming:
                    </label>
                    <select
                      value={selectedProgramming}
                      onChange={(e) => setSelectedProgramming(e.target.value as Department)}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl border border-[#D7E3EA] bg-white text-[#172B4D] shadow-2xs focus:border-[#00D9FF] outline-none"
                      id="preview-programming-select"
                    >
                      <option value="Computer Engineering">Computer Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Electrical Engineering">Electrical Engineering</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-[#172B4D] flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#0094B3]" />
                      Year:
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value as AcademicYear)}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl border border-[#D7E3EA] bg-white text-[#172B4D] shadow-2xs focus:border-[#00D9FF] outline-none"
                      id="preview-year-select"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="2nd Year DSY">2nd Year DSY</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {duplicateCount > 0 && (
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-[#D7E3EA] text-xs">
                      <span className="text-amber-800 font-bold">Duplicates ({duplicateCount}):</span>
                      <button
                        type="button"
                        onClick={() => handleSetAllDuplicateAction('skip')}
                        className="px-2 py-0.5 bg-[#F5F9FC] rounded font-bold text-[#0B1F3A] hover:bg-slate-200 border border-[#D7E3EA] cursor-pointer"
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
                    className="px-3 py-1.5 bg-[#0B1F3A] hover:bg-[#102A43] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 border border-[#00D9FF]/30"
                    id="preview-add-row-btn"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#00D9FF]" />
                    <span>Add Row</span>
                  </button>
                </div>
              </div>

              {/* Status Badges Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-white rounded-2xl border border-[#D7E3EA] shadow-2xs">
                  <div className="text-[11px] font-bold text-[#64748B]">Total Extracted</div>
                  <div className="text-xl font-black text-[#172B4D] mt-0.5">{totalExtracted}</div>
                </div>
                <div className="p-3.5 bg-[#DCFCE7] rounded-2xl border border-[#BBF7D0] shadow-2xs">
                  <div className="text-[11px] font-bold text-[#16A34A]">Ready to Import</div>
                  <div className="text-xl font-black text-[#16A34A] mt-0.5">{readyCount}</div>
                </div>
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 shadow-2xs">
                  <div className="text-[11px] font-bold text-amber-800">Already Exist</div>
                  <div className="text-xl font-black text-amber-900 mt-0.5">{duplicateCount}</div>
                </div>
                <div className="p-3.5 bg-[#F5F9FC] rounded-2xl border border-[#D7E3EA] shadow-2xs">
                  <div className="text-[11px] font-bold text-[#0B1F3A]">Selected Rows</div>
                  <div className="text-xl font-black text-[#0B1F3A] mt-0.5">{selectedCount}</div>
                </div>
              </div>

              {/* Preview Table Container */}
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
                        <th className="p-3 w-12 text-center">#</th>
                        <th className="p-3 min-w-[240px]">Student Name</th>
                        <th className="p-3 min-w-[200px]">Enrollment Number / PRN</th>
                        <th className="p-3 min-w-[180px]">Status</th>
                        <th className="p-3 w-12 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D7E3EA] text-[#172B4D]">
                      {extractedRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-[#64748B]">
                            <div className="max-w-xl mx-auto space-y-4">
                              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                                <AlertTriangle className="w-6 h-6" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-[#172B4D]">
                                  No student records were detected in this file.
                                </h4>
                                <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                                  Make sure the document contains clear student names and enrollment numbers (e.g., Name | Enrollment No).
                                </p>
                              </div>

                              <div className="flex items-center justify-center gap-3 pt-2">
                                <button
                                  type="button"
                                  onClick={handleAddRow}
                                  className="px-4 py-2 bg-[#0B1F3A] hover:bg-[#102A43] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                                >
                                  <Plus className="w-3.5 h-3.5 text-[#00D9FF]" />
                                  <span>Add Student Manually</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setHasExtracted(false);
                                    setExtractedRows([]);
                                    setErrorMsg(null);
                                  }}
                                  className="px-4 py-2 bg-white hover:bg-[#F5F9FC] border border-[#D7E3EA] text-[#0B1F3A] text-xs font-bold rounded-xl cursor-pointer"
                                >
                                  Upload Different File
                                </button>
                              </div>
                            </div>
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
                                  className={`w-full px-3 py-1.5 text-xs font-semibold rounded-lg border bg-white text-[#172B4D] transition-all ${
                                    !row.student_name.trim()
                                      ? 'border-rose-400 ring-2 ring-rose-400/20'
                                      : 'border-[#D7E3EA] focus:border-[#00D9FF]'
                                  }`}
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.enrollment_number}
                                  onChange={(e) => handleRowChange(row.id, 'enrollment_number', e.target.value)}
                                  placeholder="e.g. 24110980114"
                                  className={`w-full px-3 py-1.5 text-xs font-mono font-bold uppercase rounded-lg border bg-white text-[#172B4D] transition-all ${
                                    !row.enrollment_number.trim()
                                      ? 'border-rose-400 ring-2 ring-rose-400/20'
                                      : hasOcrWarning
                                      ? 'border-amber-400 bg-amber-50/40 text-amber-900'
                                      : 'border-[#D7E3EA] focus:border-[#00D9FF]'
                                  }`}
                                />
                              </td>
                              <td className="p-3">
                                <div className="flex flex-col gap-1">
                                  {row.isDuplicate ? (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                                        <AlertTriangle className="w-3 h-3 text-[#F59E0B]" />
                                        Already Exists
                                      </span>
                                      <div className="inline-flex rounded border border-[#D7E3EA] overflow-hidden text-[10px]">
                                        <button
                                          type="button"
                                          onClick={() => handleRowChange(row.id, 'duplicateAction', 'skip')}
                                          className={`px-2 py-0.5 font-bold cursor-pointer ${
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
                                          className={`px-2 py-0.5 font-bold cursor-pointer ${
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
                                    <div className="flex items-center gap-1 text-[11px] text-[#16A34A] font-bold">
                                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#22C55E]" />
                                      <span>Ready</span>
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
          {importResult ? (
            /* Result Screen Footer */
            <div className="w-full flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetForNewImport}
                className="px-4 py-2.5 text-xs font-bold text-[#0B1F3A] hover:bg-[#E2ECF4] rounded-xl transition-colors cursor-pointer flex items-center gap-2 border border-[#D7E3EA]"
                id="btn-import-another-doc"
              >
                <RotateCcw className="w-4 h-4 text-[#0094B3]" />
                <span>Import Another Document</span>
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 text-xs font-bold rounded-xl bg-[#0B1F3A] hover:bg-[#102A43] text-white shadow-md shadow-[#0B1F3A]/20 transition-all cursor-pointer active:scale-95 flex items-center gap-2 border border-[#00D9FF]/30"
                id="btn-view-imported-students"
              >
                <Users className="w-4 h-4 text-[#00D9FF]" />
                <span>View Students in List</span>
              </button>
            </div>
          ) : hasExtracted ? (
            /* Preview Footer */
            <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-xs font-bold text-[#172B4D] flex items-center gap-3">
                <span>Programming: <strong className="text-[#0B1F3A]">{selectedProgramming}</strong></span>
                <span className="text-[#D7E3EA]">|</span>
                <span>Year: <strong className="text-[#0B1F3A]">{selectedYear}</strong></span>
              </div>

              <div className="flex items-center gap-2.5 ml-auto">
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
                  disabled={selectedCount === 0 || isSaving}
                  className={`px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95 ${
                    selectedCount === 0 || isSaving
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-[#0B1F3A] hover:bg-[#102A43] text-white shadow-[#0B1F3A]/20 border border-[#00D9FF]/30'
                  }`}
                  id="confirm-import-students-btn"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#00D9FF]" />
                      <span>{saveProgressMessage || 'Saving to Database...'}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-[#00D9FF]" />
                      <span>Import Students ({selectedCount})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Upload Screen Footer */
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
