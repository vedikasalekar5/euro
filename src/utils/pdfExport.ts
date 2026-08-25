import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StudentAcademicSummary, DepartmentYearStats, Subject, PerformanceRating, Teacher } from '../types';
import { getCollegeLogoPngDataUrl } from '../assets/collegeLogo';
import { sortStudentsByEnrollment } from './studentSorting';
import { downloadBlobFile } from './mobileShare';

/**
 * Helper to save doc as Blob and download PDF directly to device
 */
async function saveAndSharePdf(doc: jsPDF, filename: string, _title?: string): Promise<void> {
  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  const blob = doc.output('blob');
  downloadBlobFile(blob, cleanFilename);
}

export interface SingleExamMarksPdfData {
  programmingName: string;
  courseTitle: string;
  courseCode: string;
  year: string;
  examType: 'Unit Test 1' | 'Unit Test 2';
  teacherName?: string;
  teacherPosition?: string;
  maxMarks: number;
  students: {
    srNo: number;
    enrollmentNo: string;
    studentName: string;
    marksObtained: number;
    maxMarks: number;
    percentage: number;
    status: 'Excellent' | 'First Class' | 'Pass' | 'Needs Attention' | 'Fail' | string;
    remarks: string;
  }[];
}

export interface SubjectMarksPdfData {
  department?: string;
  programmingName?: string;
  year: string;
  subject: Subject;
  teacherName?: string;
  teacherPosition?: string;
  examType?: 'Unit Test 1' | 'Unit Test 2' | 'All';
  students: {
    srNo: number;
    enrollmentNo: string;
    studentName: string;
    unit1Marks: number;
    unit2Marks: number;
    averageMarks: number;
    percentage: number;
    performance: PerformanceRating | string;
  }[];
}

export interface TeacherProfilePdfData {
  teacher: Teacher;
  courses: Subject[];
}

export function getFormattedDateTime(): { dateStr: string; timestampStr: string } {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return {
    dateStr,
    timestampStr: `${dateStr} | ${timeStr}`,
  };
}

/**
 * Helper to render date/time at bottom-right corner of active/all PDF pages.
 */
function renderPdfPageFooters(doc: jsPDF, timestampStr: string) {
  const pageCount = (doc.internal as any).getNumberOfPages ? (doc.internal as any).getNumberOfPages() : 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight() || 297;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(timestampStr, 198, pageHeight - 7, { align: 'right' });
  }
}

/**
 * Exports Single Exam (Unit Test 1 or Unit Test 2) Marks Sheet (out of 30)
 * Uses official Mandar Education Society's RSIET branding and layout.
 * Pagination: Up to 40 students fit on Page 1 along with Summary and Signatures.
 * For >40 students, table continues and Summary + Signatures appear strictly after the last student.
 * NO "Distinction" line or calculation.
 */
export async function exportExamMarksPDF(data: SingleExamMarksPdfData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageHeight = doc.internal.pageSize.getHeight() || 297;
  const { dateStr, timestampStr } = getFormattedDateTime();

  // Fetch college logo PNG
  let logoDataUrl = '';
  try {
    logoDataUrl = await getCollegeLogoPngDataUrl(350);
  } catch (err) {
    console.warn('Failed to load logo data URL, generating PDF without logo', err);
  }

  // --- 1. Top Institution Header Banner ---
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 210, 32, 'F');

  // Embed College Logo on top left if available
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', 10, 3.5, 25, 25);
    } catch {
      // ignore image render errors
    }
  }

  // Header Typography
  doc.setTextColor(226, 232, 240); // Slate 200
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text("MANDAR EDUCATION SOCIETY'S", 115, 8, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(
    'RAJARAM SHINDE INSTITUTE OF ENGINEERING AND TECHNOLOGY (RSIET)',
    115,
    14.5,
    { align: 'center' }
  );

  doc.setFontSize(10);
  doc.setTextColor(147, 197, 253); // Blue 300
  doc.text(
    `STUDENT UNIT TEST RESULT — ${data.examType.toUpperCase()}`,
    115,
    21.5,
    { align: 'center' }
  );

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text(
    `CONTINUOUS INTERNAL EVALUATION  |  MAXIMUM MARKS: ${data.maxMarks || 30}  |  DATE: ${dateStr}`,
    115,
    27.5,
    { align: 'center' }
  );

  // --- 2. Details Metadata Box ---
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, 35, 186, 20.5, 1.5, 1.5, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8);

  // Row 1: Programming Name & Year
  doc.setFont('helvetica', 'bold');
  doc.text('Programming Name:', 16, 40.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.programmingName}`, 47, 40.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Year / Class:', 122, 40.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.year}`, 144, 40.5);

  // Row 2: Course Title & Course Code
  doc.setFont('helvetica', 'bold');
  doc.text('Course Title:', 16, 46.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.courseTitle}`, 37, 46.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Course Code:', 122, 46.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.courseCode || 'N/A'}`, 144, 46.5);

  // Row 3: Examination & Faculty
  doc.setFont('helvetica', 'bold');
  doc.text('Examination:', 16, 52.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.examType}`, 37, 52.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Faculty Name:', 122, 52.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.teacherName || 'Faculty In-charge'}`, 144, 52.5);

  // --- 3. Table Rows Construction ---
  const tableHead = [
    [
      'Sr. No.',
      'Enrollment No.',
      'Student Name',
      `Marks Obtained (/ ${data.maxMarks || 30})`,
      'Percentage (%)',
      'Status / Performance',
      'Remarks',
    ],
  ];

  // Guarantee students are sorted numerically by Enrollment Number with sequential Sr. No.
  const sortedStudents = sortStudentsByEnrollment(data.students);

  // Map any "Distinction" in individual status to "Excellent" to ensure word never appears
  const tableBody = sortedStudents.map((st, idx) => {
    let cleanStatus = st.status;
    if (cleanStatus === 'Distinction') {
      cleanStatus = 'Excellent';
    }
    return [
      (idx + 1).toString(),
      st.enrollmentNo,
      st.studentName,
      `${st.marksObtained} / ${data.maxMarks || 30}`,
      `${st.percentage}%`,
      cleanStatus,
      st.remarks,
    ];
  });

  autoTable(doc, {
    head: tableHead,
    body: tableBody,
    startY: 58,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138], // Deep Navy Blue
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      cellPadding: { top: 1.2, bottom: 1.2, left: 1, right: 1 },
      minCellHeight: 4.2,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [15, 23, 42],
      valign: 'middle',
      cellPadding: { top: 0.8, bottom: 0.8, left: 1, right: 1 },
      minCellHeight: 3.4,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 14 },
      1: { halign: 'center', cellWidth: 32 },
      2: { halign: 'left', cellWidth: 54 },
      3: { halign: 'center', cellWidth: 26 },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'center', cellWidth: 24 },
      6: { halign: 'center', cellWidth: 16 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 12, right: 12 },
    showHead: 'everyPage',
  });

  // Calculate coordinates after the table (strictly after last student)
  let finalY = (doc as any).lastAutoTable.finalY || 175;

  // Space required for Summary (19mm) + Gap (14mm) + Signatures (8mm) + bottom-right margin (10mm) = ~51mm
  const spaceNeeded = 51;
  const availableSpace = pageHeight - finalY;

  // If table ended close to page bottom, add a new page for Summary & Signatures together
  if (availableSpace < spaceNeeded) {
    doc.addPage();
    finalY = 22;
  }

  // --- 4. Class Performance Summary Box (NO Distinction) ---
  const totalStudents = data.students.length;
  const marksList = data.students.map((s) => s.marksObtained);
  const totalMarks = marksList.reduce((acc, m) => acc + m, 0);
  const classAvg = totalStudents > 0 ? (totalMarks / totalStudents).toFixed(1) : '0.0';
  const highestMark = totalStudents > 0 ? Math.max(...marksList) : 0;
  const lowestMark = totalStudents > 0 ? Math.min(...marksList) : 0;
  const passedStudents = data.students.filter((s) => s.percentage >= 40).length;
  const passRate = totalStudents > 0 ? ((passedStudents / totalStudents) * 100).toFixed(1) : '0.0';

  const summaryTop = finalY + 4;
  const summaryHeight = 19;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, summaryTop, 186, summaryHeight, 1.5, 1.5, 'FD');

  // Blue header band on summary
  doc.setFillColor(30, 58, 138);
  doc.roundedRect(12, summaryTop, 186, 5.2, 1.5, 1.5, 'F');
  doc.rect(12, summaryTop + 3, 186, 2.2, 'F'); // square bottom corners of band
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `${data.examType.toUpperCase()} CLASS PERFORMANCE SUMMARY & METRICS`,
    105,
    summaryTop + 3.8,
    { align: 'center' }
  );

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7.5);

  // Row 1: Total Students | Class Average | Highest Mark
  doc.setFont('helvetica', 'bold');
  doc.text('Total Students:', 18, summaryTop + 10.2);
  doc.setFont('helvetica', 'normal');
  doc.text(`${totalStudents}`, 42, summaryTop + 10.2);

  doc.setFont('helvetica', 'bold');
  doc.text('Class Average:', 72, summaryTop + 10.2);
  doc.setFont('helvetica', 'normal');
  doc.text(`${classAvg} / ${data.maxMarks || 30}`, 96, summaryTop + 10.2);

  doc.setFont('helvetica', 'bold');
  doc.text('Highest Mark:', 134, summaryTop + 10.2);
  doc.setFont('helvetica', 'normal');
  doc.text(`${highestMark} / ${data.maxMarks || 30}`, 158, summaryTop + 10.2);

  // Row 2: Passed Count | Passing Rate | Lowest Mark
  doc.setFont('helvetica', 'bold');
  doc.text('Passed Count:', 18, summaryTop + 15.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text(`${passedStudents} / ${totalStudents}`, 42, summaryTop + 15.5);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('Passing Rate:', 72, summaryTop + 15.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${passRate}%`, 96, summaryTop + 15.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Lowest Mark:', 134, summaryTop + 15.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${lowestMark} / ${data.maxMarks || 30}`, 158, summaryTop + 15.5);

  // --- 5. Signature Section (Directly after Performance Summary) ---
  const sigY = summaryTop + summaryHeight + 14;

  // Signature lines
  doc.setDrawColor(148, 163, 184); // Slate 400
  doc.line(18, sigY, 68, sigY);
  doc.line(84, sigY, 128, sigY);
  doc.line(144, sigY, 192, sigY);

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Course Teacher Signature', 43, sigY + 4, { align: 'center' });
  doc.text('Head of Department (HOD)', 106, sigY + 4, { align: 'center' });
  doc.text('Principal / Academic Dean', 168, sigY + 4, { align: 'center' });

  // --- 6. Date & Time and Developer Credit in page footer ---
  renderPdfPageFooters(doc, timestampStr);

  // Generate File Name: e.g. Computer_Engineering_2nd_Year_Operating_System_Unit_Test_1.pdf
  const sanitizedProg = data.programmingName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
  const sanitizedYear = data.year.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
  const sanitizedCourse = data.courseTitle.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
  const sanitizedExam = data.examType.replace(/[^a-zA-Z0-9]/g, '_');
  
  const filename = `${sanitizedProg}_${sanitizedYear}_${sanitizedCourse}_${sanitizedExam}.pdf`;

  // Trigger download / Android native share
  await saveAndSharePdf(doc, filename, `${data.programmingName} - ${data.examType}`);
}

/**
 * Exports Subject-wise Unit 1 & Unit 2 Marks Sheet (out of 30) for all students in selected class
 * Uses official Mandar Education Society's RSIET branding and layout.
 * Pagination: Up to 40 students fit on Page 1 along with Summary and Signatures.
 * For >40 students, table continues and Summary + Signatures appear strictly after the last student.
 * NO "Distinction" line or calculation.
 */
export async function exportSubjectMarksPDF(data: SubjectMarksPdfData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageHeight = doc.internal.pageSize.getHeight() || 297;
  const { dateStr, timestampStr } = getFormattedDateTime();

  const courseTitle =
    data.subject.course_title ||
    data.subject.subject_name ||
    (data.subject as any).courseTitle ||
    (data.subject as any).subjectName ||
    'Course';
  const courseCode =
    (data.subject as any).course_code ||
    (data.subject as any).courseCode ||
    (data.subject as any).subjectCode ||
    '';
  const programmingName =
    data.programmingName ||
    data.department ||
    data.subject.programming_name ||
    data.subject.department ||
    'Engineering';

  // Fetch college logo PNG
  let logoDataUrl = '';
  try {
    logoDataUrl = await getCollegeLogoPngDataUrl(350);
  } catch (err) {
    console.warn('Failed to load logo data URL', err);
  }

  // --- 1. Top Header Banner ---
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 210, 32, 'F');

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', 10, 3.5, 25, 25);
    } catch {
      // ignore
    }
  }

  doc.setTextColor(226, 232, 240);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text("MANDAR EDUCATION SOCIETY'S", 115, 8, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(
    'RAJARAM SHINDE INSTITUTE OF ENGINEERING AND TECHNOLOGY (RSIET)',
    115,
    14.5,
    { align: 'center' }
  );

  doc.setFontSize(10);
  doc.setTextColor(147, 197, 253);
  doc.text('STUDENT ACADEMIC PERFORMANCE REPORT — UNIT TEST 1 & 2', 115, 21.5, { align: 'center' });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(
    `CONTINUOUS INTERNAL EVALUATION (UNIT TEST 1 & 2 — OUT OF 30)  |  DATE: ${dateStr}`,
    115,
    27.5,
    { align: 'center' }
  );

  // --- 2. Details Metadata Box ---
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, 35, 186, 20.5, 1.5, 1.5, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8);

  doc.setFont('helvetica', 'bold');
  doc.text('Programming Name:', 16, 40.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${programmingName}`, 47, 40.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Year / Class:', 122, 40.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.year}`, 144, 40.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Course Title:', 16, 46.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${courseTitle}`, 37, 46.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Course Code:', 122, 46.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${courseCode || 'N/A'}`, 144, 46.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Evaluation Base:', 16, 52.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Unit Test 1 (30M) + Unit Test 2 (30M) | Average / 30', 44, 52.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Faculty Name:', 122, 52.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.teacherName || 'Faculty In-charge'}`, 144, 52.5);

  // --- 3. Table Rows Construction ---
  const tableHead = [
    [
      'Sr. No.',
      'Enrollment No.',
      'Student Name',
      'Unit Test 1 / 30',
      'Unit Test 2 / 30',
      'Average / 30',
      'Percentage',
      'Performance',
    ],
  ];

  // Guarantee students are sorted numerically by Enrollment Number with sequential Sr. No.
  const sortedStudents = sortStudentsByEnrollment(data.students);

  // Map any "Distinction" in performance to "Excellent"
  const tableBody = sortedStudents.map((st, idx) => {
    let cleanPerf = st.performance;
    if (cleanPerf === 'Distinction') {
      cleanPerf = 'Excellent';
    }
    return [
      (idx + 1).toString(),
      st.enrollmentNo,
      st.studentName,
      `${st.unit1Marks} / 30`,
      `${st.unit2Marks} / 30`,
      `${st.averageMarks.toFixed(1)} / 30`,
      `${st.percentage}%`,
      cleanPerf,
    ];
  });

  autoTable(doc, {
    head: tableHead,
    body: tableBody,
    startY: 58,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138], // Deep Navy Blue
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      cellPadding: { top: 1.2, bottom: 1.2, left: 1, right: 1 },
      minCellHeight: 4.2,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [15, 23, 42],
      valign: 'middle',
      cellPadding: { top: 0.8, bottom: 0.8, left: 1, right: 1 },
      minCellHeight: 3.4,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 14 },
      1: { halign: 'center', cellWidth: 28 },
      2: { halign: 'left', cellWidth: 50 },
      3: { halign: 'center', cellWidth: 22 },
      4: { halign: 'center', cellWidth: 22 },
      5: { halign: 'center', cellWidth: 22 },
      6: { halign: 'center', cellWidth: 14 },
      7: { halign: 'center', cellWidth: 24 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 12, right: 12 },
    showHead: 'everyPage',
  });

  // Calculate coordinates after the table
  let finalY = (doc as any).lastAutoTable.finalY || 175;

  const spaceNeeded = 51;
  const availableSpace = pageHeight - finalY;

  if (availableSpace < spaceNeeded) {
    doc.addPage();
    finalY = 22;
  }

  // --- 4. Class Performance Summary Box (NO Distinction) ---
  const totalStudents = data.students.length;
  const u1Total = data.students.reduce((acc, s) => acc + s.unit1Marks, 0);
  const u2Total = data.students.reduce((acc, s) => acc + s.unit2Marks, 0);
  const u1ClassAvg = totalStudents > 0 ? (u1Total / totalStudents).toFixed(1) : '0.0';
  const u2ClassAvg = totalStudents > 0 ? (u2Total / totalStudents).toFixed(1) : '0.0';
  const overallClassAvg =
    totalStudents > 0 ? (((Number(u1ClassAvg) + Number(u2ClassAvg)) / 2)).toFixed(2) : '0.0';

  const u1Highest = totalStudents > 0 ? Math.max(...data.students.map((s) => s.unit1Marks)) : 0;
  const u2Highest = totalStudents > 0 ? Math.max(...data.students.map((s) => s.unit2Marks)) : 0;
  const u1Lowest = totalStudents > 0 ? Math.min(...data.students.map((s) => s.unit1Marks)) : 0;
  const u2Lowest = totalStudents > 0 ? Math.min(...data.students.map((s) => s.unit2Marks)) : 0;
  const passedStudents = data.students.filter((s) => s.percentage >= 40).length;
  const passRate = totalStudents > 0 ? ((passedStudents / totalStudents) * 100).toFixed(1) : '0.0';

  const summaryTop = finalY + 4;
  const summaryHeight = 19;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, summaryTop, 186, summaryHeight, 1.5, 1.5, 'FD');

  doc.setFillColor(30, 58, 138);
  doc.roundedRect(12, summaryTop, 186, 5.2, 1.5, 1.5, 'F');
  doc.rect(12, summaryTop + 3, 186, 2.2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('CLASS PERFORMANCE SUMMARY & ANALYTICS', 105, summaryTop + 3.8, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7.5);

  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Students:`, 18, summaryTop + 10.2);
  doc.setFont('helvetica', 'normal');
  doc.text(`${totalStudents}`, 42, summaryTop + 10.2);

  doc.setFont('helvetica', 'bold');
  doc.text(`Overall Class Avg:`, 68, summaryTop + 10.2);
  doc.setFont('helvetica', 'normal');
  doc.text(`${overallClassAvg} / 30`, 98, summaryTop + 10.2);

  doc.setFont('helvetica', 'bold');
  doc.text(`Passing Rate:`, 134, summaryTop + 10.2);
  doc.setFont('helvetica', 'normal');
  doc.text(`${passRate}% (${passedStudents}/${totalStudents})`, 158, summaryTop + 10.2);

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.text(`Unit Test 1 Avg:`, 18, summaryTop + 15.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${u1ClassAvg} / 30 (Hi: ${u1Highest}, Lo: ${u1Lowest})`, 44, summaryTop + 15.5);

  doc.setFont('helvetica', 'bold');
  doc.text(`Unit Test 2 Avg:`, 114, summaryTop + 15.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${u2ClassAvg} / 30 (Hi: ${u2Highest}, Lo: ${u2Lowest})`, 140, summaryTop + 15.5);

  // --- 5. Signature Section (Directly after Performance Summary) ---
  const sigY = summaryTop + summaryHeight + 14;

  // Signature lines
  doc.setDrawColor(148, 163, 184);
  doc.line(18, sigY, 68, sigY);
  doc.line(84, sigY, 128, sigY);
  doc.line(144, sigY, 192, sigY);

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Course Teacher Signature', 43, sigY + 4, { align: 'center' });
  doc.text('Head of Department (HOD)', 106, sigY + 4, { align: 'center' });
  doc.text('Principal / Academic Dean', 168, sigY + 4, { align: 'center' });

  // --- 6. Date & Time and Developer Credit in page footer ---
  renderPdfPageFooters(doc, timestampStr);

  // Generate File Name
  const sanitizedProg = programmingName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
  const sanitizedYear = data.year.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
  const sanitizedCourse = courseTitle.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
  const filename = `${sanitizedProg}_${sanitizedYear}_${sanitizedCourse}_Unit_Test_1_and_2.pdf`;

  // Trigger download / Android native share
  await saveAndSharePdf(doc, filename, `${programmingName} - Unit Test 1 & 2`);
}

/**
 * Exports Individual Student Performance Report (Unit Test 1 & 2)
 */
export async function exportIndividualStudentPDF(summary: StudentAcademicSummary): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  const { dateStr, timestampStr } = getFormattedDateTime();
  const student = summary.student;
  const studentName = student.student_name || student.name || 'Student';
  const enrollment =
    student.enrollment_number ||
    student.enrollmentNo ||
    student.rollNumber ||
    student.prn ||
    'N/A';
  const progName = student.programming_name || student.department || 'Engineering';

  let logoDataUrl = '';
  try {
    logoDataUrl = await getCollegeLogoPngDataUrl(350);
  } catch {
    // ignore
  }

  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 210, 36, 'F');

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', 10, 4.5, 27, 27);
    } catch {
      // ignore
    }
  }

  doc.setTextColor(226, 232, 240);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text("MANDAR EDUCATION SOCIETY'S", 115, 9, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('RAJARAM SHINDE INSTITUTE OF ENGINEERING AND TECHNOLOGY (RSIET)', 115, 16, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(147, 197, 253);
  doc.text('STUDENT INDIVIDUAL PERFORMANCE REPORT (UNIT TEST 1 & 2)', 115, 24, { align: 'center' });

  // Student Profile Card
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, 42, 186, 35, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Student Name: ${studentName}`, 18, 50);
  doc.text(`Enrollment No.: ${enrollment}`, 120, 50);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Programming Name: ${progName}`, 18, 57);
  doc.text(`Year / Class: ${student.year}`, 120, 57);

  doc.text(`Performance Rating: ${summary.overallRating}`, 18, 64);
  doc.text(`Progress Trend: ${summary.overallTrend} (${summary.overallImprovementDelta >= 0 ? '+' : ''}${summary.overallImprovementDelta}%)`, 120, 64);

  doc.text(`Overall Average: ${summary.overallAverageMarks} / 30 (${summary.overallAveragePercentage}%)`, 18, 71);

  // Subject Marks Table
  const tableHead = [
    [
      'Course Code',
      'Course Title',
      'Unit Test 1 (/30)',
      'Unit Test 2 (/30)',
      'Average (/30)',
      'Percentage',
      'Rating',
      'Trend',
    ],
  ];

  const tableBody = summary.details.map((d) => [
    (d.subject as any).course_code || (d.subject as any).courseCode || (d.subject as any).subjectCode || '-',
    d.subject.course_title || d.subject.subject_name || (d.subject as any).subjectName || '',
    `${d.unit1Marks} / 30`,
    `${d.unit2Marks} / 30`,
    `${d.averageMarks} / 30`,
    `${d.averagePercentage}%`,
    d.rating,
    d.trend === 'Improved' ? `+${d.improvementPercentage}%` : d.trend === 'Declined' ? `${d.improvementPercentage}%` : 'Consistent',
  ]);

  autoTable(doc, {
    head: tableHead,
    body: tableBody,
    startY: 82,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 24 },
      1: { halign: 'left', cellWidth: 50 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 180;

  // Analysis & Remarks Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(254, 252, 232); // Light yellow tint
  doc.roundedRect(12, finalY + 6, 186, 26, 2, 2, 'FD');

  doc.setTextColor(113, 63, 18);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Automated Academic Evaluation Analysis:', 18, finalY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const splitText = doc.splitTextToSize(summary.generatedAnalysis || 'Continuous performance evaluation report.', 174);
  doc.text(splitText, 18, finalY + 20);

  // Signature Section
  let sigY = finalY + 48;
  if (sigY > 265) {
    doc.addPage();
    sigY = 35;
  }

  doc.setDrawColor(148, 163, 184);
  doc.line(18, sigY, 68, sigY);
  doc.line(84, sigY, 128, sigY);
  doc.line(144, sigY, 192, sigY);

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Course Teacher Signature', 43, sigY + 5, { align: 'center' });
  doc.text('Head of Department (HOD)', 106, sigY + 5, { align: 'center' });
  doc.text('Principal / Academic Dean', 168, sigY + 5, { align: 'center' });

  // Date & Time and Developer Credit in page footer
  renderPdfPageFooters(doc, timestampStr);

  // Save or Share the PDF
  await saveAndSharePdf(doc, `${enrollment}_Academic_Report_${studentName.replace(/\s+/g, '_')}.pdf`, `Student Report: ${studentName}`);
}

/**
 * Exports Department Summary Performance Report
 */
export async function exportDepartmentSummaryPDF(
  stats: DepartmentYearStats,
  summaries: StudentAcademicSummary[]
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  const { dateStr, timestampStr } = getFormattedDateTime();

  let logoDataUrl = '';
  try {
    logoDataUrl = await getCollegeLogoPngDataUrl(350);
  } catch {
    // ignore
  }

  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 210, 36, 'F');

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', 10, 4.5, 27, 27);
    } catch {
      // ignore
    }
  }

  doc.setTextColor(226, 232, 240);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text("MANDAR EDUCATION SOCIETY'S", 115, 9, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('RAJARAM SHINDE INSTITUTE OF ENGINEERING AND TECHNOLOGY (RSIET)', 115, 16, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(147, 197, 253);
  doc.text('DEPARTMENT ACADEMIC PERFORMANCE REPORT', 115, 24, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(
    `PROGRAMMING: ${stats.department.toUpperCase()} | YEAR: ${stats.year.toUpperCase()} | DATE: ${dateStr}`,
    115,
    31,
    { align: 'center' }
  );

  // Summary Metrics Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, 42, 186, 26, 2, 2, 'FD');

  const delta = Number((stats.avgUnit2Percentage! - stats.avgUnit1Percentage!).toFixed(2));

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.text(`Total Students: ${stats.totalStudents}`, 18, 50);
  doc.text(`Overall Class Avg: ${stats.overallAveragePercentage}%`, 78, 50);
  doc.text(`Improved Count: ${stats.improvedCount}`, 138, 50);

  doc.text(`Unit Test 1 Class Avg: ${stats.avgUnit1Percentage}%`, 18, 59);
  doc.text(`Unit Test 2 Class Avg: ${stats.avgUnit2Percentage}%`, 78, 59);
  doc.text(`Net Class Delta: ${delta >= 0 ? '+' : ''}${delta}%`, 138, 59);

  // Student Summaries Table
  const tableHead = [
    ['Enrollment No.', 'Student Name', 'Unit Test 1 / 30', 'Unit Test 2 / 30', 'Average / 30', 'Percentage', 'Rating', 'Trend'],
  ];

  const tableBody = summaries.map((s) => [
    s.student.enrollment_number || s.student.enrollmentNo || s.student.rollNumber || s.student.prn,
    s.student.student_name || s.student.name,
    `${s.overallUnit1Marks} / 30`,
    `${s.overallUnit2Marks} / 30`,
    `${s.overallAverageMarks} / 30`,
    `${s.overallAveragePercentage}%`,
    s.overallRating,
    s.overallTrend === 'Improved' ? `+${s.overallImprovementDelta}%` : s.overallTrend === 'Declined' ? `${s.overallImprovementDelta}%` : 'Consistent',
  ]);

  autoTable(doc, {
    head: tableHead,
    body: tableBody,
    startY: 74,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      halign: 'center',
    },
    columnStyles: {
      1: { halign: 'left' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  let finalY = (doc as any).lastAutoTable.finalY || 180;
  let sigY = finalY + 28;
  if (sigY > 265) {
    doc.addPage();
    sigY = 35;
  }

  doc.setDrawColor(148, 163, 184);
  doc.line(30, sigY, 80, sigY);
  doc.line(130, sigY, 180, sigY);

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Head of Department (HOD)', 55, sigY + 5, { align: 'center' });
  doc.text('Principal / Academic Dean', 155, sigY + 5, { align: 'center' });

  // Date & Time and Developer Credit in page footer
  renderPdfPageFooters(doc, timestampStr);

  // Trigger download / Android share
  await saveAndSharePdf(doc, `Academic_Report_${stats.department}_${stats.year}.pdf`, `Department Report - ${stats.department}`);
}

/**
 * Exports Official Teacher Professional Profile PDF
 * Header: Mandar Education Society's RSIET + TEACHER PROFESSIONAL PROFILE
 * Content: Photo / Avatar, Name, Unique Teacher ID, Position, Dept, Email, Mobile, Qualification, Experience, Date of Joining
 * Section: COURSES / SUBJECTS TAUGHT (Filtered strictly to this teacher's courses)
 * Footer: Teacher Signature line & Auto-generated bottom-right Date/Time (e.g. 21 August 2026 | 03:30 PM).
 */
export async function exportTeacherProfilePDF(data: TeacherProfilePdfData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const { dateStr, timestampStr } = getFormattedDateTime();
  const teacher = data.teacher;
  const teacherName = teacher.name || 'Faculty Member';
  const teacherId = teacher.teacher_id || teacher.teacherId || 'TCH001';
  const position = teacher.position || teacher.role || 'Professor';
  const department = teacher.department || teacher.programming_name || 'Computer Engineering';
  const email = teacher.email || 'faculty@rsiet.edu.in';
  const mobile = teacher.mobile || teacher.phone || '+91 98765 43210';
  const qualification = teacher.qualification || 'M.Tech in Computer Engineering / B.E.';
  const experience = teacher.experience || '6+ Years';
  const dateOfJoining = teacher.date_of_joining || teacher.dateOfJoining || teacher.joiningDate || '01 July 2022';
  const photoUrl = teacher.photo_url || teacher.photoUrl || teacher.avatar || '';

  // Fetch college logo PNG
  let logoDataUrl = '';
  try {
    logoDataUrl = await getCollegeLogoPngDataUrl(350);
  } catch (err) {
    console.warn('Failed to load logo data URL', err);
  }

  // --- 1. Top Institution Header Banner ---
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 210, 36, 'F');

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', 10, 4.5, 27, 27);
    } catch {
      // ignore
    }
  }

  doc.setTextColor(226, 232, 240);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text("MANDAR EDUCATION SOCIETY'S", 115, 9, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(
    'RAJARAM SHINDE INSTITUTE OF ENGINEERING AND TECHNOLOGY',
    115,
    16,
    { align: 'center' }
  );

  doc.setFontSize(10.5);
  doc.setTextColor(147, 197, 253);
  doc.text('TEACHER PROFESSIONAL PROFILE', 115, 24, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(
    `FACULTY CREDENTIAL RECORD  |  DEPARTMENT: ${department.toUpperCase()}  |  DATE: ${dateStr}`,
    115,
    31,
    { align: 'center' }
  );

  // --- 2. Teacher Profile Summary Card ---
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, 42, 186, 52, 2, 2, 'FD');

  // Photo Area / Monogram Box
  const photoX = 18;
  const photoY = 48;
  const photoSize = 32;

  let photoRendered = false;
  if (photoUrl && photoUrl.startsWith('data:image')) {
    try {
      const format = photoUrl.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(photoUrl, format, photoX, photoY, photoSize, photoSize);
      photoRendered = true;
    } catch (e) {
      photoRendered = false;
    }
  }

  if (!photoRendered) {
    // Elegant fallback monogram badge
    doc.setFillColor(30, 58, 138); // Deep Blue
    doc.roundedRect(photoX, photoY, photoSize, photoSize, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const initials = teacherName
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'T';
    doc.text(initials, photoX + photoSize / 2, photoY + photoSize / 2 + 6, { align: 'center' });
  }

  // Teacher Name & Unique Teacher ID
  const infoX = photoX + photoSize + 8;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(teacherName, infoX, 51);

  // Teacher ID Badge
  doc.setFillColor(224, 231, 255); // Indigo 100
  doc.setDrawColor(165, 180, 252);
  doc.roundedRect(infoX, 54, 30, 5.5, 1, 1, 'FD');
  doc.setTextColor(49, 46, 129); // Indigo 900
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`ID: ${teacherId}`, infoX + 15, 58, { align: 'center' });

  // Grid of details
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);

  const col1X = infoX;
  const col2X = infoX + 66;

  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.text('Position in College:', col1X, 66);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(position, col1X + 28, 66);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Department:', col2X, 66);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(department, col2X + 20, 66);

  // Row 2
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Email ID:', col1X, 73);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(email, col1X + 16, 73);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Mobile No.:', col2X, 73);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(mobile, col2X + 18, 73);

  // Row 3
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Qualification:', col1X, 80);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(qualification, col1X + 22, 80);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Experience:', col2X, 80);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(experience, col2X + 18, 80);

  // Row 4
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Date of Joining:', col1X, 87);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(dateOfJoining, col1X + 24, 87);

  if (teacher.specialization || teacher.bio) {
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.text('Specialization:', col2X, 87);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const spec = (teacher.specialization || teacher.bio || '').slice(0, 30);
    doc.text(spec, col2X + 22, 87);
  }

  // --- 3. Courses / Subjects Taught Section ---
  const coursesStartY = 100;
  doc.setFillColor(30, 58, 138); // Navy bar
  doc.roundedRect(12, coursesStartY, 186, 6.5, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('COURSES / SUBJECTS TAUGHT', 18, coursesStartY + 4.5);

  const courseTableHead = [['Sr.', 'Course Title', 'Course Code', 'Department', 'Year']];
  
  const courseTableBody =
    data.courses.length > 0
      ? data.courses.map((c, idx) => [
          (idx + 1).toString(),
          c.course_title || c.subject_name || (c as any).courseTitle || 'Course',
          (c as any).course_code || (c as any).courseCode || 'N/A',
          c.department || c.programming_name || department,
          c.year,
        ])
      : [['1', 'No courses registered yet', '-', department, '-']];

  autoTable(doc, {
    head: courseTableHead,
    body: courseTableBody,
    startY: coursesStartY + 8,
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85], // Slate 700
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [15, 23, 42],
      valign: 'middle',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'left', cellWidth: 64 },
      2: { halign: 'center', cellWidth: 32 },
      3: { halign: 'left', cellWidth: 48 },
      4: { halign: 'center', cellWidth: 30 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 12, right: 12 },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 180;

  // --- 4. Signature Section ---
  let sigY = finalY + 36;
  if (sigY > 265) {
    doc.addPage();
    sigY = 40;
  }

  doc.setDrawColor(148, 163, 184); // Slate 400
  doc.line(134, sigY, 192, sigY);

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Teacher Signature', 163, sigY + 5, { align: 'center' });

  // --- 5. Date & Time and Developer Credit in page footer ---
  renderPdfPageFooters(doc, timestampStr);

  // Trigger download / Android share
  const sanitizedName = teacherName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${teacherId}_Profile_${sanitizedName}.pdf`;
  await saveAndSharePdf(doc, filename, `Teacher Profile - ${teacherName}`);
}

export interface AiSingleStudentReportPdfData {
  studentName: string;
  enrollmentNo: string;
  department: string;
  year: string;
  courseTitle: string;
  courseCode?: string;
  examFocus?: string;
  unit1Marks: string;
  unit2Marks: string;
  totalMarks: string;
  averageMarks: string;
  percentage: string;
  performanceCategory: string;
  trend: string;
  strengths: string[];
  weakAreas: string[];
  performanceAnalysis: string;
  improvementSuggestions: string[];
  teacherRecommendation: string;
}

export async function exportAiSingleStudentReportPDF(data: AiSingleStudentReportPdfData): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { dateStr, timestampStr } = getFormattedDateTime();

  // Header Banner
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('MANDAR EDUCATION SOCIETY’S', 105, 7, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('RAJENDRA MANE COLLEGE OF ENGINEERING & TECHNOLOGY (RSIET)', 105, 12, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(226, 232, 240);
  doc.text('EURO AI — INDIVIDUAL STUDENT PERFORMANCE REPORT', 105, 18, { align: 'center' });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${dateStr}`, 105, 23, { align: 'center' });

  // Student Profile Card Table
  const profileTable: any[][] = [
    [
      { content: 'Student Name:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } },
      { content: data.studentName, styles: { fontStyle: 'bold', textColor: [15, 23, 42] } },
      { content: 'Enrollment No:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } },
      { content: data.enrollmentNo || 'N/A', styles: { fontStyle: 'bold', textColor: [15, 23, 42] } },
    ],
    [
      { content: 'Programming / Dept:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } },
      { content: data.department },
      { content: 'Academic Year:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } },
      { content: data.year },
    ],
    [
      { content: 'Course / Subject:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } },
      { content: `${data.courseTitle} ${data.courseCode && data.courseCode !== 'N/A' ? `(${data.courseCode})` : ''}` },
      { content: 'Evaluation Focus:', styles: { fontStyle: 'bold', textColor: [71, 85, 105] } },
      { content: data.examFocus || 'Unit Test 1 & 2 Combined' },
    ],
  ];

  autoTable(doc, {
    body: profileTable,
    startY: 30,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.2 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 12, right: 12 },
  });

  let currentY = (doc as any).lastAutoTable.finalY + 4;

  // Marks Summary Table
  const marksHead = [['Unit Test 1', 'Unit Test 2', 'Total Marks', 'Average Marks', 'Percentage', 'Rating', 'Progression']];
  const marksBody = [[
    data.unit1Marks,
    data.unit2Marks,
    data.totalMarks,
    data.averageMarks,
    data.percentage,
    data.performanceCategory,
    data.trend,
  ]];

  autoTable(doc, {
    head: marksHead,
    body: marksBody,
    startY: currentY,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8.5,
      halign: 'center',
      fontStyle: 'bold',
      textColor: [15, 23, 42],
    },
    margin: { left: 12, right: 12 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // Performance Analysis Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(12, currentY, 186, 26, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(12, currentY, 186, 26, 2, 2, 'D');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('CONTINUOUS EVALUATION ANALYSIS', 16, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(51, 65, 85);
  const splitAnalysis = doc.splitTextToSize(data.performanceAnalysis, 178);
  doc.text(splitAnalysis, 16, currentY + 10);

  currentY += 31;

  // Strengths & Weak Areas Table (Side-by-side or 2 rows)
  const insightsHead = [['Academic Strengths & Competencies', 'Areas for Growth & Revision']];
  const strengthsText = data.strengths.map((s, idx) => `${idx + 1}. ${s}`).join('\n');
  const weakText = data.weakAreas.map((w, idx) => `${idx + 1}. ${w}`).join('\n');

  autoTable(doc, {
    head: insightsHead,
    body: [[strengthsText, weakText]],
    startY: currentY,
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.8,
      textColor: [15, 23, 42],
      valign: 'top',
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 93 },
      1: { cellWidth: 93 },
    },
    margin: { left: 12, right: 12 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // Actionable Suggestions for Student
  const suggestionsHead = [['Actionable Student Study Roadmap']];
  const suggestionsText = data.improvementSuggestions.map((s, idx) => `• ${s}`).join('\n');
  autoTable(doc, {
    head: suggestionsHead,
    body: [[suggestionsText]],
    startY: currentY,
    theme: 'grid',
    headStyles: {
      fillColor: [71, 85, 105],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.8,
      textColor: [15, 23, 42],
      cellPadding: 3,
    },
    margin: { left: 12, right: 12 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // Teacher Recommendation Box
  if (currentY > 245) {
    doc.addPage();
    currentY = 25;
  }

  doc.setFillColor(254, 243, 199); // Amber 100
  doc.roundedRect(12, currentY, 186, 20, 2, 2, 'F');
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(12, currentY, 186, 20, 2, 2, 'D');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(146, 64, 14); // Amber 800
  doc.text('FACULTY & REMEDIAL GUIDANCE RECOMMENDATION', 16, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(120, 53, 15);
  const splitTeacherRec = doc.splitTextToSize(data.teacherRecommendation, 178);
  doc.text(splitTeacherRec, 16, currentY + 10);

  // Signature Line
  let sigY = currentY + 28;
  if (sigY > 265) {
    doc.addPage();
    sigY = 40;
  }
  doc.setDrawColor(148, 163, 184);
  doc.line(14, sigY, 70, sigY);
  doc.line(134, sigY, 192, sigY);

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Subject Teacher Signature', 42, sigY + 4, { align: 'center' });
  doc.text('HOD / Academic Dean', 163, sigY + 4, { align: 'center' });

  renderPdfPageFooters(doc, timestampStr);

  const cleanName = (data.studentName || 'Student').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `AI_Report_${cleanName}_${data.year.replace(/\s+/g, '')}.pdf`;
  await saveAndSharePdf(doc, filename, `EURO AI Report - ${data.studentName}`);
}

export interface AiClassReportPdfData {
  title: string;
  department: string;
  year: string;
  courseTitle: string;
  courseCode?: string;
  examFocus?: string;
  totalStudents: number;
  evaluatedStudents: number;
  passCount: number;
  failCount: number;
  avgU1: string;
  avgU2: string;
  overallAvg: string;
  highestScore: { name: string; marks: string; enrollmentNo?: string };
  lowestScore: { name: string; marks: string; enrollmentNo?: string };
  performanceCategories?: Record<string, number>;
  aiSummary: string;
  keyImprovements: string[];
  areasOfConcern: string[];
  studentsRequiringAttention: { name: string; enrollmentNo?: string; marks: string; reason: string }[];
  studentBreakdownList?: {
    rank: number;
    name: string;
    enrollmentNo: string;
    u1: number;
    u2: number;
    avg: number;
    pct: number;
    rating: string;
    trend: string;
    delta?: number;
    strength?: string;
    weakness?: string;
    aiRemark?: string;
  }[];
  overallPerformanceTrend: string;
  teacherRecommendation: string;
}

export async function exportAiClassReportPDF(data: AiClassReportPdfData): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { dateStr, timestampStr } = getFormattedDateTime();

  // Header Banner
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('MANDAR EDUCATION SOCIETY’S', 105, 7, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('RAJENDRA MANE COLLEGE OF ENGINEERING & TECHNOLOGY (RSIET)', 105, 12, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(226, 232, 240);
  doc.text(`EURO AI — CLASS ACADEMIC PERFORMANCE REPORT (${data.department.toUpperCase()})`, 105, 18, { align: 'center' });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Academic Year: ${data.year} | Course: ${data.courseTitle} | Generated: ${dateStr}`, 105, 23, { align: 'center' });

  // Class Stats Cards Table
  const statsHead = [['Total Enrolled', 'Evaluated', 'Pass Count', 'UT1 Avg', 'UT2 Avg', 'Overall Avg', 'Pass Rate']];
  const passRate = data.evaluatedStudents > 0 ? `${Math.round((data.passCount / data.evaluatedStudents) * 100)}%` : '100%';
  const statsBody = [[
    data.totalStudents.toString(),
    data.evaluatedStudents.toString(),
    `${data.passCount} / ${data.evaluatedStudents}`,
    data.avgU1,
    data.avgU2,
    data.overallAvg,
    passRate,
  ]];

  autoTable(doc, {
    head: statsHead,
    body: statsBody,
    startY: 30,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      halign: 'center',
      fontStyle: 'bold',
      textColor: [15, 23, 42],
    },
    margin: { left: 12, right: 12 },
  });

  let currentY = (doc as any).lastAutoTable.finalY + 4;

  // Executive AI Summary Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(12, currentY, 186, 24, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(12, currentY, 186, 24, 2, 2, 'D');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('EXECUTIVE PERFORMANCE SYNTHESIS', 16, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const splitSummary = doc.splitTextToSize(data.aiSummary, 178);
  doc.text(splitSummary, 16, currentY + 10);

  currentY += 28;

  // Key Improvements & Areas of Concern side by side
  const improvementsText = data.keyImprovements.map((s, idx) => `${idx + 1}. ${s}`).join('\n');
  const concernsText = data.areasOfConcern.map((w, idx) => `${idx + 1}. ${w}`).join('\n');

  autoTable(doc, {
    head: [['Key Academic Improvements & Highlights', 'Areas of Academic Concern & Bottlenecks']],
    body: [[improvementsText, concernsText]],
    startY: currentY,
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontSize: 7.8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [15, 23, 42],
      valign: 'top',
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 93 },
      1: { cellWidth: 93 },
    },
    margin: { left: 12, right: 12 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // Students Requiring Attention Table
  if (data.studentsRequiringAttention && data.studentsRequiringAttention.length > 0) {
    const attentionHead = [['Student Name', 'Enrollment', 'Marks', 'Identified Academic Reason']];
    const attentionBody = data.studentsRequiringAttention.map(s => [
      s.name,
      s.enrollmentNo || 'N/A',
      s.marks,
      s.reason,
    ]);

    autoTable(doc, {
      head: attentionHead,
      body: attentionBody,
      startY: currentY,
      theme: 'grid',
      headStyles: {
        fillColor: [185, 28, 28], // Red 700
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [15, 23, 42],
        cellPadding: 2,
      },
      margin: { left: 12, right: 12 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 4;
  }

  // Complete Student Performance Roster
  if (data.studentBreakdownList && data.studentBreakdownList.length > 0) {
    if (currentY > 220) {
      doc.addPage();
      currentY = 25;
    }

    const rosterHead = [['Rank', 'Student Name', 'Enrollment', 'UT1 (30)', 'UT2 (30)', 'Avg (30)', 'Pct (%)', 'Category', 'Trend']];
    const rosterBody = data.studentBreakdownList.map(st => [
      st.rank.toString(),
      st.name,
      st.enrollmentNo || 'N/A',
      st.u1.toString(),
      st.u2.toString(),
      st.avg.toString(),
      `${st.pct}%`,
      st.rating,
      st.trend,
    ]);

    autoTable(doc, {
      head: rosterHead,
      body: rosterBody,
      startY: currentY,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 7.2,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 7.2,
        halign: 'center',
        cellPadding: 1.8,
      },
      columnStyles: {
        1: { halign: 'left' },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 12, right: 12 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 4;
  }

  // Teacher & Department Remedial Recommendations
  if (currentY > 240) {
    doc.addPage();
    currentY = 25;
  }

  doc.setFillColor(254, 243, 199);
  doc.roundedRect(12, currentY, 186, 22, 2, 2, 'F');
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(12, currentY, 186, 22, 2, 2, 'D');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(146, 64, 14);
  doc.text('DEPARTMENTAL REMEDIAL ACTION PLAN & FACULTY GUIDELINES', 16, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(120, 53, 15);
  const splitTeacherRec = doc.splitTextToSize(data.teacherRecommendation, 178);
  doc.text(splitTeacherRec, 16, currentY + 10);

  // Signatures
  let sigY = currentY + 28;
  if (sigY > 265) {
    doc.addPage();
    sigY = 40;
  }
  doc.setDrawColor(148, 163, 184);
  doc.line(14, sigY, 70, sigY);
  doc.line(134, sigY, 192, sigY);

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Subject Teacher Signature', 42, sigY + 4, { align: 'center' });
  doc.text('HOD / Academic Dean', 163, sigY + 4, { align: 'center' });

  renderPdfPageFooters(doc, timestampStr);

  const cleanDept = (data.department || 'Class').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `AI_Class_Report_${cleanDept}_${data.year.replace(/\s+/g, '')}.pdf`;
  await saveAndSharePdf(doc, filename, `EURO AI Class Report - ${data.department}`);
}
