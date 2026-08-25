/**
 * Utility functions for robust numerical / natural sorting of student records by Enrollment Number.
 * 
 * Rules:
 * - Natural numerical ascending order (e.g., '2411098012' < '24110980110' < '24110980120')
 * - Supports large Indian engineering enrollment numbers (10+ digits) using BigInt precision
 * - Natural alphanumeric sort for formatted IDs (e.g., 'EN2026001' < 'EN2026002' < 'EN2026010')
 * - Stable secondary sort on Student Name
 */

import { Student, StudentAcademicSummary } from '../types';

/**
 * Extracts normalized enrollment number string from a student object or string
 */
export function getEnrollmentNumber(student: any): string {
  if (!student) return '';
  if (typeof student === 'string') return student.trim().toUpperCase();

  const val =
    student.enrollment_number ||
    student.enrollmentNo ||
    student.rollNumber ||
    student.prn ||
    student.roll_no ||
    student.rollNo ||
    '';

  return String(val).trim().toUpperCase();
}

/**
 * Extracts student name string from a student object
 */
export function getStudentName(student: any): string {
  if (!student) return '';
  if (typeof student === 'string') return student.trim();

  const val =
    student.student_name ||
    student.name ||
    student.studentName ||
    '';

  return String(val).trim();
}

/**
 * Compares two enrollment numbers numerically and naturally.
 * - Handles pure digit strings of any length (BigInt)
 * - Handles alphanumeric strings with natural chunk comparison ('EN2026001' vs 'EN2026010')
 * - Empty values are sorted to the end
 */
export function compareEnrollmentNumbers(aStr?: string, bStr?: string): number {
  const a = (aStr || '').trim();
  const b = (bStr || '').trim();

  if (!a && !b) return 0;
  if (!a) return 1; // empty goes last
  if (!b) return -1;

  // Check if both strings are pure digits
  const aIsDigits = /^\d+$/.test(a);
  const bIsDigits = /^\d+$/.test(b);

  if (aIsDigits && bIsDigits) {
    try {
      const bigA = BigInt(a);
      const bigB = BigInt(b);
      if (bigA < bigB) return -1;
      if (bigA > bigB) return 1;
      return 0;
    } catch {
      // Fallback to numeric localeCompare if BigInt fails for any reason
    }
  }

  // Natural sort for alphanumeric strings
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Sorts any list of student objects in ascending order of their Enrollment Number.
 * Generates an immutable, sorted copy.
 */
export function sortStudentsByEnrollment<T extends any>(students: T[]): T[] {
  if (!Array.isArray(students) || students.length <= 1) {
    return Array.isArray(students) ? [...students] : [];
  }

  return [...students].sort((a, b) => {
    const enrollA = getEnrollmentNumber(a);
    const enrollB = getEnrollmentNumber(b);

    const cmp = compareEnrollmentNumbers(enrollA, enrollB);
    if (cmp !== 0) return cmp;

    // Secondary fallback sort: Student Name (alphabetical)
    const nameA = getStudentName(a);
    const nameB = getStudentName(b);
    return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
  });
}

/**
 * Sorts student academic summaries in ascending order of student Enrollment Number.
 */
export function sortSummariesByEnrollment(
  summaries: StudentAcademicSummary[]
): StudentAcademicSummary[] {
  if (!Array.isArray(summaries) || summaries.length <= 1) {
    return Array.isArray(summaries) ? [...summaries] : [];
  }

  return [...summaries].sort((a, b) => {
    const enrollA = getEnrollmentNumber(a.student);
    const enrollB = getEnrollmentNumber(b.student);

    const cmp = compareEnrollmentNumbers(enrollA, enrollB);
    if (cmp !== 0) return cmp;

    const nameA = getStudentName(a.student);
    const nameB = getStudentName(b.student);
    return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
  });
}
