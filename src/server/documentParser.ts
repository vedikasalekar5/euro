import * as pdfParseModule from 'pdf-parse';
import Tesseract from 'tesseract.js';
import { Department, AcademicYear } from '../types';

const pdfParse: any = (pdfParseModule as any).default || pdfParseModule;

export interface ExtractedStudentResult {
  student_name: string;
  enrollment_number: string;
  uncertain_fields: string[];
  uncertainty_reason: string;
}

export interface DocumentParseOutput {
  success: boolean;
  students: ExtractedStudentResult[];
  rawText: string;
  pageCount?: number;
  engineUsed: string;
  message?: string;
}

// Normalize Department Name
export function normalizeDepartment(deptStr: string, fallbackDept?: string): Department | '' {
  const clean = (deptStr || '').trim();
  if (!clean) return (fallbackDept as Department) || '';

  if (/computer|comp|cse|it|information\s*tech|cs\b/i.test(clean)) {
    return 'Computer Engineering';
  }
  if (/civil|ce\b/i.test(clean)) {
    return 'Civil Engineering';
  }
  if (/mech|mechanical|me\b/i.test(clean)) {
    return 'Mechanical Engineering';
  }
  if (/elect|ee\b|electrical|ece|entc|electronics/i.test(clean)) {
    return 'Electrical Engineering';
  }

  if (['Computer Engineering', 'Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering'].includes(clean)) {
    return clean as Department;
  }

  return (fallbackDept as Department) || '';
}

// Normalize Academic Year
export function normalizeAcademicYear(yearStr: string, fallbackYear?: string): AcademicYear | '' {
  const clean = (yearStr || '').trim();
  if (!clean) return (fallbackYear as AcademicYear) || '';

  if (/dsy|direct\s*second|lateral/i.test(clean)) {
    return '2nd Year DSY';
  }
  if (/1st|first|fe\b|fy\b|sem\s*[12]\b/i.test(clean)) {
    return '1st Year';
  }
  if (/3rd|third|te\b|ty\b|sem\s*[56]\b/i.test(clean)) {
    return '3rd Year';
  }
  if (/2nd|second|se\b|sy\b|sem\s*[34]\b/i.test(clean)) {
    return '2nd Year';
  }

  if (['1st Year', '2nd Year', '3rd Year', '2nd Year DSY'].includes(clean)) {
    return clean as AcademicYear;
  }

  return (fallbackYear as AcademicYear) || '';
}

// Check for common OCR character confusions in enrollment numbers
export function checkEnrollmentAmbiguity(enrollment: string): { isUncertain: boolean; reason: string } {
  if (!enrollment) return { isUncertain: false, reason: '' };

  const hasDigits = /\d/.test(enrollment);
  const hasConfusableLetters = /[OISZB]/.test(enrollment);

  if (hasDigits && hasConfusableLetters) {
    const matched = [];
    if (/O/.test(enrollment)) matched.push('O (possible 0)');
    if (/I/.test(enrollment)) matched.push('I (possible 1)');
    if (/S/.test(enrollment)) matched.push('S (possible 5)');
    if (/Z/.test(enrollment)) matched.push('Z (possible 2)');
    if (/B/.test(enrollment)) matched.push('B (possible 8)');
    return {
      isUncertain: true,
      reason: `Potential OCR character ambiguity: ${matched.join(', ')}. Please verify.`,
    };
  }

  return { isUncertain: false, reason: '' };
}

// Split line into cells based on common table delimiters or multi-space columns
function splitIntoCells(line: string): string[] {
  if (line.includes('|')) {
    return line.split('|').map((s) => s.trim()).filter((s, idx, arr) => (idx === 0 || idx === arr.length - 1 ? s.length > 0 : true));
  }
  if (line.includes('\t')) {
    return line.split('\t').map((s) => s.trim());
  }
  if (line.includes(';') && line.split(';').length >= 3) {
    return line.split(';').map((s) => s.trim());
  }
  if (line.includes(',') && line.split(',').length >= 3 && !line.includes('Engineering,')) {
    return line.split(',').map((s) => s.trim());
  }
  if (/\s{2,}/.test(line)) {
    return line.split(/\s{2,}/).map((s) => s.trim());
  }
  return [line.trim()];
}

// Extract students deterministically from raw text (PDF text layer or Tesseract OCR output)
// Extracts ONLY student_name and enrollment_number
export function parseStudentsFromRawText(
  rawText: string
): ExtractedStudentResult[] {
  if (!rawText || typeof rawText !== 'string') return [];

  const rawLines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const results: ExtractedStudentResult[] = [];
  const seenEnrollments = new Set<string>();

  // Filter out pure noise/footer/header lines
  const isHeaderLine = (line: string): boolean => {
    const lower = line.toLowerCase();
    if (
      lower.includes('college of engineering') ||
      lower.includes('institute of engineering') ||
      lower.includes('mandar education') ||
      lower.includes('semester examination') ||
      (lower.includes('unit test') && lower.includes('management')) ||
      lower.includes('head of department') ||
      lower.includes('principal / academic dean') ||
      lower.includes('course teacher signature') ||
      lower.includes('signature of student')
    ) {
      return true;
    }
    return false;
  };

  const isPossibleEnrollment = (str: string): boolean => {
    const clean = str.replace(/[^A-Za-z0-9]/g, '').trim().toUpperCase();
    if (!clean) return false;
    // 6 to 18 characters, digits or alphanumeric code (e.g. 24110980114, 24110980115, EN2026001, PRN202401)
    if (/^\d{6,18}$/.test(clean)) return true;
    if (/^[A-Z]{1,5}\d{4,14}[A-Z0-9]?$/i.test(clean)) return true;
    if (/^[A-Z0-9]{7,18}$/i.test(clean) && /\d/.test(clean)) return true;
    return false;
  };

  const isPossibleName = (str: string): boolean => {
    const clean = str.replace(/^(Mr\.|Ms\.|Miss|Master|Mrs\.)\s+/i, '').replace(/^\d+[\.\-\)]\s*/, '').trim();
    if (!/^[A-Za-z\s\.\'\-]+$/.test(clean) || clean.length < 3) return false;
    const lower = clean.toLowerCase();
    if (
      lower === 'sr no' ||
      lower === 'sr' ||
      lower === 'sn' ||
      lower === 'roll no' ||
      lower === 'enrollment no' ||
      lower === 'enrollment number' ||
      lower === 'student name' ||
      lower === 'programme' ||
      lower === 'department' ||
      lower === 'academic year' ||
      lower === 'signature' ||
      lower === 'division' ||
      lower === 'status' ||
      lower === 'prn' ||
      lower === 'prn no'
    ) {
      return false;
    }
    return true;
  };

  const sanitizeName = (raw: string): string => {
    return raw
      .replace(/^(Mr\.|Ms\.|Miss|Master|Mrs\.)\s+/i, '')
      .replace(/^\d+[\.\-\)]\s*/, '')
      .replace(/[\t\r\n]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/[\|\:\;\,]+$/, '')
      .trim();
  };

  // --- PASS 1: Detect Structured Table Header and Column Index Mapping ---
  let headerRowIndex = -1;
  let colIndexName = -1;
  let colIndexEnrollment = -1;

  for (let i = 0; i < Math.min(rawLines.length, 30); i++) {
    const cells = splitIntoCells(rawLines[i]).map((c) => c.toLowerCase());
    if (cells.length >= 2) {
      let foundName = -1;
      let foundEnrollment = -1;

      cells.forEach((cell, idx) => {
        // Name variations: Name, Student Name, Full Name, Student, Name of Student, Candidate Name
        if (
          /^(student\s*name|name\s*of\s*student|candidate\s*name|full\s*name|student|name)$/i.test(cell) ||
          (cell.includes('name') && !cell.includes('college') && !cell.includes('course') && !cell.includes('dept'))
        ) {
          foundName = idx;
        }
        // Enrollment variations: Enrollment No, Enrollment Number, Enrollment, PRN, PRN No, PRN Number, Reg No, Registration No
        else if (/^(enrollment\s*no\.?|enrollment\s*number|enrollment|prn\s*no\.?|prn\s*number|prn|reg\s*no\.?|registration\s*no\.?)$/i.test(cell)) {
          foundEnrollment = idx;
        }
      });

      if (foundName !== -1 && foundEnrollment !== -1) {
        headerRowIndex = i;
        colIndexName = foundName;
        colIndexEnrollment = foundEnrollment;
        break;
      }
    }
  }

  // If table header was detected, parse subsequent table rows
  if (headerRowIndex !== -1 && colIndexName !== -1 && colIndexEnrollment !== -1) {
    for (let i = headerRowIndex + 1; i < rawLines.length; i++) {
      const line = rawLines[i];
      if (isHeaderLine(line)) continue;
      const cells = splitIntoCells(line);
      if (cells.length < 2) continue;

      let nameVal = colIndexName < cells.length ? cells[colIndexName] : '';
      let enrollVal = colIndexEnrollment < cells.length ? cells[colIndexEnrollment] : '';

      nameVal = sanitizeName(nameVal);
      enrollVal = enrollVal.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

      // If enrollment column didn't have valid format, check other cells
      if (!isPossibleEnrollment(enrollVal)) {
        for (const c of cells) {
          const m = c.match(/\b(2\d{6,14}|[A-Z]{1,5}\d{4,14}[A-Z0-9]?|[A-Z0-9]{7,18})\b/i);
          if (m && isPossibleEnrollment(m[1])) {
            enrollVal = m[1].toUpperCase();
            break;
          }
        }
      }

      // If name was not in the expected column, search other cells
      if (!isPossibleName(nameVal)) {
        for (let cIdx = 0; cIdx < cells.length; cIdx++) {
          if (cIdx === colIndexEnrollment) continue;
          const candidate = sanitizeName(cells[cIdx]);
          if (isPossibleName(candidate) && !candidate.includes(enrollVal)) {
            nameVal = candidate;
            break;
          }
        }
      }

      if (nameVal && isPossibleEnrollment(enrollVal)) {
        if (!seenEnrollments.has(enrollVal)) {
          seenEnrollments.add(enrollVal);
          const ambiguity = checkEnrollmentAmbiguity(enrollVal);
          results.push({
            student_name: nameVal,
            enrollment_number: enrollVal,
            uncertain_fields: ambiguity.isUncertain ? ['enrollment_number'] : [],
            uncertainty_reason: ambiguity.reason,
          });
        }
      }
    }
  }

  // --- PASS 2: If table header was not detected or yielded no results, run fallback pattern matchers ---
  if (results.length === 0) {
    for (let i = 0; i < rawLines.length; i++) {
      let line = rawLines[i];
      if (isHeaderLine(line)) continue;

      // Pattern 1: Delimited row (pipes, tabs, semicolons, commas, or 2+ consecutive spaces)
      const segments = splitIntoCells(line);

      if (segments.length >= 2) {
        let foundEnrollment = '';
        let foundName = '';

        for (const segment of segments) {
          const cleanSeg = segment.replace(/^Sr\.?\s*No\.?\s*[:\-\.]?\s*\d+/i, '').trim();
          if (!cleanSeg) continue;

          // Check if segment is enrollment number
          if (!foundEnrollment && isPossibleEnrollment(cleanSeg)) {
            const m = cleanSeg.match(/\b([A-Z0-9]{6,18})\b/i);
            if (m && isPossibleEnrollment(m[1])) {
              foundEnrollment = m[1].toUpperCase();
              continue;
            }
          }

          // Check if segment is student name
          if (!foundName && isPossibleName(cleanSeg)) {
            const sanitizedName = sanitizeName(cleanSeg);
            if (sanitizedName.length >= 3) {
              foundName = sanitizedName;
            }
            continue;
          }
        }

        if (foundName && foundEnrollment) {
          if (!seenEnrollments.has(foundEnrollment)) {
            seenEnrollments.add(foundEnrollment);
            const ambiguity = checkEnrollmentAmbiguity(foundEnrollment);
            results.push({
              student_name: foundName,
              enrollment_number: foundEnrollment,
              uncertain_fields: ambiguity.isUncertain ? ['enrollment_number'] : [],
              uncertainty_reason: ambiguity.reason,
            });
            continue;
          }
        }
      }

      // Pattern 2: Regex extraction from single line (e.g. "Vedika Salekar 24110980114" or "24110980114 Vedika Salekar")
      const enrollmentMatch = line.match(/\b(2\d{6,14}|[A-Z]{1,4}\d{4,12}|[A-Z0-9]{7,18})\b/i);
      if (enrollmentMatch) {
        const enrollmentNo = enrollmentMatch[1].toUpperCase();
        if (isPossibleEnrollment(enrollmentNo)) {
          const rest = line.replace(enrollmentMatch[0], '').replace(/^\s*\d+[\.\-\)]\s*/, '').trim();
          const cleanName = sanitizeName(rest);

          if (cleanName.length >= 3 && isPossibleName(cleanName) && !seenEnrollments.has(enrollmentNo)) {
            seenEnrollments.add(enrollmentNo);
            const ambiguity = checkEnrollmentAmbiguity(enrollmentNo);
            results.push({
              student_name: cleanName,
              enrollment_number: enrollmentNo,
              uncertain_fields: ambiguity.isUncertain ? ['enrollment_number'] : [],
              uncertainty_reason: ambiguity.reason,
            });
            continue;
          }
        }
      }

      // Pattern 3: Multi-line OCR detection (Line i is Name, Line i+1 is Enrollment or vice versa)
      if (i < rawLines.length - 1) {
        const lineA = rawLines[i];
        const lineB = rawLines[i + 1];

        if (isPossibleName(lineA) && isPossibleEnrollment(lineB)) {
          const cleanName = sanitizeName(lineA);
          const enrollmentNo = lineB.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
          if (cleanName.length >= 3 && isPossibleEnrollment(enrollmentNo) && !seenEnrollments.has(enrollmentNo)) {
            seenEnrollments.add(enrollmentNo);
            const ambiguity = checkEnrollmentAmbiguity(enrollmentNo);
            results.push({
              student_name: cleanName,
              enrollment_number: enrollmentNo,
              uncertain_fields: ambiguity.isUncertain ? ['enrollment_number'] : [],
              uncertainty_reason: ambiguity.reason,
            });
            i++;
            continue;
          }
        } else if (isPossibleEnrollment(lineA) && isPossibleName(lineB)) {
          const enrollmentNo = lineA.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
          const cleanName = sanitizeName(lineB);
          if (cleanName.length >= 3 && isPossibleEnrollment(enrollmentNo) && !seenEnrollments.has(enrollmentNo)) {
            seenEnrollments.add(enrollmentNo);
            const ambiguity = checkEnrollmentAmbiguity(enrollmentNo);
            results.push({
              student_name: cleanName,
              enrollment_number: enrollmentNo,
              uncertain_fields: ambiguity.isUncertain ? ['enrollment_number'] : [],
              uncertainty_reason: ambiguity.reason,
            });
            i++;
            continue;
          }
        }
      }
    }
  }

  return results;
}

// Read and extract text from PDF buffer
export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<{ text: string; pageCount: number }> {
  try {
    const data = await pdfParse(pdfBuffer);
    return {
      text: data.text || '',
      pageCount: data.numpages || 1,
    };
  } catch (err: any) {
    console.error('PDF Text extraction error:', err);
    return { text: '', pageCount: 1 };
  }
}

// Perform Tesseract OCR on Image Buffer with safe timeout
export async function extractTextFromImageOcr(imageBuffer: Buffer): Promise<string> {
  try {
    const ocrPromise = Tesseract.recognize(imageBuffer, 'eng').then((res) => res?.data?.text || '');
    const timeoutPromise = new Promise<string>((resolve) => setTimeout(() => resolve(''), 10000));
    return await Promise.race([ocrPromise, timeoutPromise]);
  } catch (err: any) {
    console.error('Tesseract OCR error:', err);
    return '';
  }
}
