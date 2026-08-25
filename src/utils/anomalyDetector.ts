import { Student, Subject, MarkRecord, StudentAcademicSummary } from '../types';

export type AnomalySeverity = 'critical' | 'warning' | 'info';

export type AnomalyCategory =
  | 'exceeding_max'
  | 'negative_marks'
  | 'missing_marks'
  | 'duplicate_student'
  | 'duplicate_enrollment'
  | 'inconsistent_info'
  | 'unusual_change'
  | 'incomplete_record'
  | 'suspect_entry';

export interface AnomalyItem {
  id: string;
  category: AnomalyCategory;
  severity: AnomalySeverity;
  title: string;
  description: string;
  recommendation: string;
  studentId?: string;
  studentName?: string;
  enrollmentNo?: string;
  department?: string;
  year?: string;
  courseTitle?: string;
  courseCode?: string;
  marksDetail?: {
    unit1?: number;
    unit2?: number;
    maxMarks?: number;
    delta?: number;
  };
  detectedAt: string;
}

export interface AnomalyScanSummary {
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  issues: AnomalyItem[];
  scannedAt: string;
  cleanPercentage: number;
}

export function scanDatabaseForAnomalies(
  students: Student[],
  subjects: Subject[],
  marks: MarkRecord[],
  summaries?: StudentAcademicSummary[],
  filterDept?: string,
  filterYear?: string
): AnomalyScanSummary {
  const issues: AnomalyItem[] = [];
  const scannedAt = new Date().toISOString();

  // Filter students and marks if department or year is provided
  const targetStudents = students.filter((s) => {
    const sDept = s.department || (s as any).programming_name;
    if (filterDept && filterDept !== 'All' && sDept !== filterDept) return false;
    if (filterYear && filterYear !== 'All' && s.year !== filterYear) return false;
    return true;
  });

  const targetStudentIds = new Set(targetStudents.map((s) => s.id));

  // 1. Check for Duplicate Enrollment Numbers
  const enrollmentMap = new Map<string, Student[]>();
  targetStudents.forEach((st) => {
    const enroll = (st.enrollment_number || st.enrollmentNo || st.rollNumber || '').trim().toUpperCase();
    if (enroll) {
      if (!enrollmentMap.has(enroll)) {
        enrollmentMap.set(enroll, []);
      }
      enrollmentMap.get(enroll)!.push(st);
    }
  });

  enrollmentMap.forEach((matchedList, enroll) => {
    if (matchedList.length > 1) {
      const names = matchedList.map((s) => s.student_name || s.name).join(', ');
      issues.push({
        id: `anomaly_dup_enroll_${enroll}`,
        category: 'duplicate_enrollment',
        severity: 'critical',
        title: `Duplicate Enrollment Number: ${enroll}`,
        description: `Enrollment number "${enroll}" is assigned to multiple student profiles: ${names}.`,
        recommendation: `Edit student profiles to ensure unique enrollment identifiers.`,
        enrollmentNo: enroll,
        department: matchedList[0].department,
        year: matchedList[0].year,
        detectedAt: scannedAt,
      });
    }
  });

  // 2. Check for Incomplete Student Records (Missing name or missing enrollment)
  targetStudents.forEach((st) => {
    const name = (st.student_name || st.name || '').trim();
    const enroll = (st.enrollment_number || st.enrollmentNo || st.rollNumber || '').trim();

    if (!name || !enroll) {
      issues.push({
        id: `anomaly_incomplete_${st.id}`,
        category: 'incomplete_record',
        severity: 'critical',
        title: `Incomplete Student Record`,
        description: `Student ID "${st.id}" is missing required fields (${!name ? 'Missing Name' : ''} ${!enroll ? 'Missing Enrollment No' : ''}).`,
        recommendation: `Update student profile with complete name and enrollment number.`,
        studentId: st.id,
        studentName: name || 'Unnamed Student',
        enrollmentNo: enroll || 'Missing',
        department: st.department,
        year: st.year,
        detectedAt: scannedAt,
      });
    }
  });

  // 3. Scan Mark Records for Out of Bounds, Negative Marks, and Suspect Entries
  marks.forEach((m) => {
    const studentId = m.student_id || (m as any).studentId;
    if (!studentId || !targetStudentIds.has(studentId)) return;

    const student = targetStudents.find((s) => s.id === studentId);
    const studentName = student?.student_name || student?.name || 'Student';
    const enroll = student?.enrollment_number || student?.enrollmentNo || 'N/A';

    const subjectId = m.subject_id || (m as any).subjectId;
    const subject = subjects.find((s) => s.id === subjectId);
    const courseTitle = subject?.course_title || subject?.subject_name || m.course_title || (m as any).courseTitle || 'Course';
    const courseCode = subject?.course_code || subject?.subjectCode || m.course_code || '';

    const u1 = m.unit_1_marks ?? (m as any).unit1Marks ?? 0;
    const u1Max = m.unit_1_max_marks ?? (m as any).unit1MaxMarks ?? 30;
    const u2 = m.unit_2_marks ?? (m as any).unit2Marks ?? 0;
    const u2Max = m.unit_2_max_marks ?? (m as any).unit2MaxMarks ?? 30;

    // Check Marks > Max
    if (u1 > u1Max) {
      issues.push({
        id: `anomaly_max_u1_${m.id}`,
        category: 'exceeding_max',
        severity: 'critical',
        title: `Unit Test 1 Marks Exceed Maximum`,
        description: `${studentName} has ${u1} marks in "${courseTitle}", which exceeds the maximum allowed ${u1Max} marks.`,
        recommendation: `Edit Unit Test 1 marks in Marks Allocation to a value between 0 and ${u1Max}.`,
        studentId,
        studentName,
        enrollmentNo: enroll,
        department: student?.department,
        year: student?.year,
        courseTitle,
        courseCode,
        marksDetail: { unit1: u1, maxMarks: u1Max },
        detectedAt: scannedAt,
      });
    }

    if (u2 > u2Max) {
      issues.push({
        id: `anomaly_max_u2_${m.id}`,
        category: 'exceeding_max',
        severity: 'critical',
        title: `Unit Test 2 Marks Exceed Maximum`,
        description: `${studentName} has ${u2} marks in "${courseTitle}", which exceeds the maximum allowed ${u2Max} marks.`,
        recommendation: `Edit Unit Test 2 marks in Marks Allocation to a value between 0 and ${u2Max}.`,
        studentId,
        studentName,
        enrollmentNo: enroll,
        department: student?.department,
        year: student?.year,
        courseTitle,
        courseCode,
        marksDetail: { unit2: u2, maxMarks: u2Max },
        detectedAt: scannedAt,
      });
    }

    // Check Negative Marks
    if (u1 < 0) {
      issues.push({
        id: `anomaly_neg_u1_${m.id}`,
        category: 'negative_marks',
        severity: 'critical',
        title: `Negative Unit Test 1 Marks Detected`,
        description: `${studentName} has negative marks (${u1}) in "${courseTitle}".`,
        recommendation: `Ensure marks are entered as positive values $\\ge 0$.`,
        studentId,
        studentName,
        enrollmentNo: enroll,
        courseTitle,
        detectedAt: scannedAt,
      });
    }

    if (u2 < 0) {
      issues.push({
        id: `anomaly_neg_u2_${m.id}`,
        category: 'negative_marks',
        severity: 'critical',
        title: `Negative Unit Test 2 Marks Detected`,
        description: `${studentName} has negative marks (${u2}) in "${courseTitle}".`,
        recommendation: `Ensure marks are entered as positive values $\\ge 0$.`,
        studentId,
        studentName,
        enrollmentNo: enroll,
        courseTitle,
        detectedAt: scannedAt,
      });
    }

    // Check Unusual Sudden Changes (e.g. drop or spike >= 15 marks out of 30)
    if (u1 > 0 && u2 > 0) {
      const diff = u2 - u1;
      if (Math.abs(diff) >= 15) {
        issues.push({
          id: `anomaly_diff_${m.id}`,
          category: 'unusual_change',
          severity: 'warning',
          title: diff > 0 ? `Unusual Sudden Score Surge (+${diff} Marks)` : `Unusual Sudden Score Drop (${diff} Marks)`,
          description: `${studentName} had a steep score deviation in "${courseTitle}" from UT1 (${u1}/${u1Max}) to UT2 (${u2}/${u2Max}).`,
          recommendation: `Verify answer booklet and score entry to confirm if this deviation is accurate or a typographical error.`,
          studentId,
          studentName,
          enrollmentNo: enroll,
          department: student?.department,
          year: student?.year,
          courseTitle,
          courseCode,
          marksDetail: { unit1: u1, unit2: u2, delta: diff, maxMarks: u1Max },
          detectedAt: scannedAt,
        });
      }
    }
  });

  // 4. Check Missing Marks for Enrolled Students
  targetStudents.forEach((st) => {
    const studentDept = st.department || (st as any).programming_name;
    const studentYear = st.year;

    const relevantCourses = subjects.filter((sub) => {
      const subDept = sub.department || sub.programming_name;
      return subDept === studentDept && sub.year === studentYear;
    });

    relevantCourses.forEach((sub) => {
      const courseTitle = sub.course_title || sub.subject_name || 'Course';
      const studentMark = marks.find(
        (m) =>
          (m.student_id === st.id || (m as any).studentId === st.id) &&
          (m.subject_id === sub.id || (m as any).subjectId === sub.id)
      );

      const u1 = studentMark ? (studentMark.unit_1_marks ?? (studentMark as any).unit1Marks ?? 0) : 0;
      const u2 = studentMark ? (studentMark.unit_2_marks ?? (studentMark as any).unit2Marks ?? 0) : 0;

      if (!studentMark || (u1 === 0 && u2 === 0)) {
        issues.push({
          id: `anomaly_missing_${st.id}_${sub.id}`,
          category: 'missing_marks',
          severity: 'info',
          title: `Pending Marks Allocation`,
          description: `${st.student_name || st.name} has no recorded UT1 or UT2 marks for "${courseTitle}".`,
          recommendation: `Enter marks via Marks Allocation or AI Marks Scanner.`,
          studentId: st.id,
          studentName: st.student_name || st.name,
          enrollmentNo: st.enrollment_number || st.enrollmentNo || 'N/A',
          department: studentDept,
          year: studentYear,
          courseTitle,
          courseCode: sub.course_code || sub.subjectCode,
          detectedAt: scannedAt,
        });
      }
    });
  });

  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  const totalEvaluations = targetStudents.length * Math.max(1, subjects.length);
  const cleanPercentage = totalEvaluations > 0
    ? Math.max(0, Number((((totalEvaluations - (criticalCount + warningCount)) / totalEvaluations) * 100).toFixed(1)))
    : 100;

  return {
    totalIssues: issues.length,
    criticalCount,
    warningCount,
    infoCount,
    issues,
    scannedAt,
    cleanPercentage,
  };
}
