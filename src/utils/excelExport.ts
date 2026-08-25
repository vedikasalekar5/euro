import * as XLSX from 'xlsx';
import { StudentAcademicSummary, Subject, Student, Department, AcademicYear } from '../types';
import { downloadBlobFile } from './mobileShare';

/**
 * Helper to convert workbook to Blob and download Excel .xlsx directly
 */
async function writeAndShareWorkbook(workbook: XLSX.WorkBook, fileName: string, _title?: string): Promise<void> {
  const actualFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlobFile(blob, actualFileName);
}

/**
 * Exports All Students roster with ONLY 3 columns:
 * 1. Student Name
 * 2. Year
 * 3. Programming
 */
export async function exportAllStudentsToExcel(
  summariesOrStudents: Array<StudentAcademicSummary | Student>,
  fileName = 'All_Students.xlsx'
): Promise<void> {
  const data = summariesOrStudents.map((item) => {
    const student = 'student' in item ? item.student : item;
    return {
      'Student Name': student.student_name || student.name || '',
      Year: student.year || '',
      Programming: student.programming_name || student.department || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data, {
    header: ['Student Name', 'Year', 'Programming'],
  });

  // Set clean column widths for optimal display in Excel
  worksheet['!cols'] = [
    { wch: 28 }, // Student Name
    { wch: 16 }, // Year
    { wch: 26 }, // Programming
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'All Students');

  await writeAndShareWorkbook(workbook, fileName, 'EURO - All Students Directory');
}

export async function exportSummariesToExcel(
  summaries: StudentAcademicSummary[],
  fileName = 'Student_Academic_Performance_Report.xlsx'
): Promise<void> {
  const data = summaries.map((s, idx) => ({
    'Sr No': idx + 1,
    'Student Name': s.student.name,
    'Enrollment No.': s.student.enrollmentNo || s.student.rollNumber || s.student.prn,
    Department: s.student.department,
    Year: s.student.year,
    'BT No.': s.student.btNo || '07',
    'Unit 1 Marks': s.overallUnit1Marks,
    'Unit 1 Max': s.overallUnit1Max,
    'Unit 1 (%)': s.overallUnit1Percentage,
    'Unit 2 Marks': s.overallUnit2Marks,
    'Unit 2 Max': s.overallUnit2Max,
    'Unit 2 (%)': s.overallUnit2Percentage,
    'Overall Avg Marks': s.overallAverageMarks,
    'Overall Avg (%)': s.overallAveragePercentage,
    'Performance Rating': s.overallRating,
    'Trend / Progress': s.overallTrend,
    'Improvement Delta (%)': s.overallImprovementDelta,
    'Strong Subject': s.highestSubject?.subject.subjectName || 'N/A',
    'Weak Subject': s.lowestSubject?.subject.subjectName || 'N/A',
    'Evaluation Analysis': s.generatedAnalysis,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Academic Performance');

  await writeAndShareWorkbook(workbook, fileName, 'EURO - Academic Performance Report');
}

export async function exportAcademicReportToExcel(
  reportData: Array<{
    rank: number;
    name: string;
    rollNumber: string;
    prn: string;
    department: string;
    year: string;
    division: string;
    unit1Marks: number;
    unit1Max: number;
    unit1Percentage: number;
    unit2Marks: number;
    unit2Max: number;
    unit2Percentage: number;
    overallAverageMarks: number;
    overallMaxMarks: number;
    overallPercentage: number;
    rating: string;
    trend: string;
    improvementDelta: number;
  }>,
  fileName = 'Academic_Report_Ledger.xlsx'
): Promise<void> {
  const rows = reportData.map((r) => ({
    'Sr No': r.rank,
    'Student Name': r.name,
    'Enrollment No.': r.prn || r.rollNumber,
    'Department': r.department,
    'Class / Year': r.year,
    'Unit 1 Marks': r.unit1Marks,
    'Unit 1 Max': r.unit1Max,
    'Unit 1 (%)': `${r.unit1Percentage}%`,
    'Unit 2 Marks': r.unit2Marks,
    'Unit 2 Max': r.unit2Max,
    'Unit 2 (%)': `${r.unit2Percentage}%`,
    'Average Marks': r.overallAverageMarks,
    'Average Max': r.overallMaxMarks,
    'Average (%)': `${r.overallPercentage}%`,
    'Rating': r.rating,
    'Progress': r.trend,
    'Delta (%)': `${r.improvementDelta}%`,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Result Ledger');

  await writeAndShareWorkbook(workbook, fileName, 'EURO - Academic Report Ledger');
}

export async function generateBlankMarksTemplateExcel(
  classStudents: Student[],
  subject: Subject,
  department: Department,
  year: AcademicYear
): Promise<void> {
  const rows = classStudents.map((student, idx) => ({
    'Sr No': idx + 1,
    'Enrollment No.': student.enrollmentNo || student.rollNumber || student.prn,
    'Student Name': student.name,
    'BT No.': student.btNo || '07',
    Department: department,
    Year: year,
    'Subject Code': subject.subjectCode,
    'Subject Name': subject.subjectName,
    'Unit 1 Marks (0 - 25)': '',
    'Unit 1 Max Marks': subject.unit1MaxMarks || 25,
    'Unit 2 Marks (0 - 25)': '',
    'Unit 2 Max Marks': subject.unit2MaxMarks || 25,
    'Teacher Remarks': '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Marks Sheet');

  const fileName = `${subject.subjectCode}_${department.split(' ')[0]}_${year.replace(/\s+/g, '_')}_Template.xlsx`;
  await writeAndShareWorkbook(workbook, fileName, `EURO - Marks Template: ${subject.subjectCode}`);
}
