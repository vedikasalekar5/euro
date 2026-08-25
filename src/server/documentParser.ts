import * as pdfParseModule from 'pdf-parse';
import Tesseract from 'tesseract.js';
import { Department, AcademicYear } from '../types';

const pdfParse: any = (pdfParseModule as any).default || pdfParseModule;

export interface ExtractedStudentResult {
  student_name: string;
  enrollment_number: string;
  department: string;
  year: string;
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

  if (/computer|comp|cse|it|information\s*tech/i.test(clean)) {
    return 'Computer Engineering';
  }
  if (/civil|ce/i.test(clean)) {
    return 'Civil Engineering';
  }
  if (/mech|me|mechanical/i.test(clean)) {
    return 'Mechanical Engineering';
  }
  if (/elect|ee|electrical|ece|entc/i.test(clean)) {
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
  if (/1st|first|fe|fy/i.test(clean)) {
    return '1st Year';
  }
  if (/3rd|third|te|ty/i.test(clean)) {
    return '3rd Year';
  }
  if (/2nd|second|se|sy/i.test(clean)) {
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

// Extract students deterministically from raw text (PDF text layer or Tesseract OCR output)
export function parseStudentsFromRawText(
  rawText: string,
  defaultDept?: string,
  defaultYear?: string
): ExtractedStudentResult[] {
  if (!rawText || typeof rawText !== 'string') return [];

  const rawLines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Global document header hints
  let documentLevelDept = '';
  let documentLevelYear = '';

  for (const line of rawLines.slice(0, 25)) {
    const detectedDept = normalizeDepartment(line);
    if (detectedDept && !documentLevelDept) {
      documentLevelDept = detectedDept;
    }
    const detectedYear = normalizeAcademicYear(line);
    if (detectedYear && !documentLevelYear) {
      documentLevelYear = detectedYear;
    }
  }

  const results: ExtractedStudentResult[] = [];
  const seenEnrollments = new Set<string>();

  // Filter out pure header lines
  const isHeaderLine = (line: string): boolean => {
    const lower = line.toLowerCase();
    if (
      lower.includes('college of engineering') ||
      lower.includes('institute of engineering') ||
      lower.includes('mandar education') ||
      lower.includes('academic year') && !lower.match(/\b(2\d{6,14}|[a-z0-9]{8,16})\b/i) ||
      lower.includes('semester examination') ||
      lower.includes('student roster') ||
      lower.includes('attendance sheet') ||
      lower.includes('roll no') && lower.includes('student name') ||
      lower.includes('enrollment no') && lower.includes('student name') ||
      lower.includes('sr. no') && lower.includes('name') ||
      lower.includes('signature') && lower.includes('marks') ||
      lower.includes('head of department') ||
      lower.includes('principal / academic dean') ||
      lower.includes('course teacher signature')
    ) {
      return true;
    }
    return false;
  };

  // Strip BT/Batch markers so they are not mistaken for enrollment or names
  const stripBtBatch = (text: string): string => {
    return text
      .replace(/\b(bt|bt\s*no|bt\s*number|batch|batch\s*no|batch\s*number)\s*[:\-\.]?\s*([0-9a-zA-Z]+)?\b/gi, '')
      .trim();
  };

  const isPossibleEnrollment = (str: string): boolean => {
    const clean = str.trim().toUpperCase();
    if (!clean) return false;
    // 6 to 18 characters, digits or alphanumeric code (e.g. 24110980101, EN2026001, 2104052, DSY202601)
    if (/^\d{6,18}$/.test(clean)) return true;
    if (/^[A-Z]{1,5}\d{4,14}[A-Z0-9]?$/i.test(clean)) return true;
    if (/^[A-Z0-9]{7,18}$/i.test(clean) && /\d/.test(clean)) return true;
    return false;
  };

  const isPossibleName = (str: string): boolean => {
    const clean = str.replace(/^(Mr\.|Ms\.|Miss|Master|Mrs\.)\s+/i, '').trim();
    // Must contain letters, length >= 3, not pure numbers, not header words
    if (!/^[A-Za-z\s\.\'\-]+$/.test(clean) || clean.length < 3) return false;
    const lower = clean.toLowerCase();
    if (
      lower === 'sr no' ||
      lower === 'roll no' ||
      lower === 'enrollment no' ||
      lower === 'student name' ||
      lower === 'programme' ||
      lower === 'department' ||
      lower === 'academic year' ||
      lower === 'signature'
    ) {
      return false;
    }
    return true;
  };

  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i];
    if (isHeaderLine(line)) continue;
    line = stripBtBatch(line);

    // Pattern 1: Delimited row (pipes, tabs, semicolons, commas, or 2+ consecutive spaces)
    let segments: string[] = [];
    if (line.includes('|')) {
      segments = line.split('|').map((s) => s.trim());
    } else if (line.includes('\t')) {
      segments = line.split('\t').map((s) => s.trim());
    } else if (line.includes(';') && line.split(';').length >= 2) {
      segments = line.split(';').map((s) => s.trim());
    } else if (line.includes(',') && line.split(',').length >= 2 && !line.includes('Engineering,')) {
      segments = line.split(',').map((s) => s.trim());
    } else if (/\s{2,}/.test(line)) {
      segments = line.split(/\s{2,}/).map((s) => s.trim());
    }

    if (segments.length >= 2) {
      let foundEnrollment = '';
      let foundName = '';
      let foundDept = '';
      let foundYear = '';

      for (const segment of segments) {
        const cleanSeg = segment.replace(/^Sr\.?\s*No\.?\s*[:\-\.]?\s*\d+/i, '').trim();
        if (!cleanSeg) continue;

        // Skip pure serial numbers (e.g. "1", "2", "01")
        if (/^\d{1,3}$/.test(cleanSeg)) continue;

        // Check if segment is department / programme
        const possibleDept = normalizeDepartment(cleanSeg);
        if (possibleDept && !foundDept) {
          foundDept = possibleDept;
          continue;
        }

        // Check if segment is year
        const possibleYear = normalizeAcademicYear(cleanSeg);
        if (possibleYear && !foundYear) {
          foundYear = possibleYear;
          continue;
        }

        // Check if segment is enrollment number
        if (!foundEnrollment && isPossibleEnrollment(cleanSeg)) {
          const m = cleanSeg.match(/\b([A-Z0-9]{6,18})\b/i);
          if (m) foundEnrollment = m[1].toUpperCase();
          continue;
        }

        // Check if segment is student name
        if (!foundName && isPossibleName(cleanSeg)) {
          const sanitizedName = cleanSeg.replace(/^(Mr\.|Ms\.|Miss|Master|Mrs\.)\s+/i, '').trim();
          if (sanitizedName.length >= 2) {
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
            department: foundDept || documentLevelDept || (defaultDept || 'Computer Engineering'),
            year: foundYear || documentLevelYear || (defaultYear || '2nd Year'),
            uncertain_fields: ambiguity.isUncertain ? ['enrollment_number'] : [],
            uncertainty_reason: ambiguity.reason,
          });
          continue;
        }
      }
    }

    // Pattern 2: Regex extraction from single line (e.g., "1  24110980111  Vedika Satish Salekar" or "Vedika Satish Salekar 24110980111")
    const enrollmentMatch = line.match(/\b(2\d{6,14}|[A-Z]{1,4}\d{4,12}|[A-Z0-9]{7,18})\b/i);
    if (enrollmentMatch) {
      const enrollmentNo = enrollmentMatch[1].toUpperCase();
      if (isPossibleEnrollment(enrollmentNo)) {
        let rest = line.replace(enrollmentMatch[0], '').replace(/^\s*\d+[\.\-\)]\s*/, '').trim();

        let lineDept = '';
        let lineYear = '';

        const deptMatch = rest.match(/(Computer|Civil|Mechanical|Electrical)(\s+Engineering)?/i);
        if (deptMatch) {
          lineDept = normalizeDepartment(deptMatch[0]);
          rest = rest.replace(deptMatch[0], '').trim();
        }

        const yearMatch = rest.match(/(1st|2nd|3rd|4th|FE|SE|TE|BE|DSY)(\s+Year)?/i);
        if (yearMatch) {
          lineYear = normalizeAcademicYear(yearMatch[0]);
          rest = rest.replace(yearMatch[0], '').trim();
        }

        const nameMatch = rest.match(/([A-Za-z\s\.\'\-]{3,60})/);
        if (nameMatch && isPossibleName(nameMatch[1])) {
          const cleanName = nameMatch[1]
            .replace(/^(Mr\.|Ms\.|Miss|Master|Mrs\.)\s+/i, '')
            .replace(/[\t\r\n]+/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim();

          if (cleanName.length >= 3 && !seenEnrollments.has(enrollmentNo)) {
            seenEnrollments.add(enrollmentNo);
            const ambiguity = checkEnrollmentAmbiguity(enrollmentNo);
            results.push({
              student_name: cleanName,
              enrollment_number: enrollmentNo,
              department: lineDept || documentLevelDept || (defaultDept || 'Computer Engineering'),
              year: lineYear || documentLevelYear || (defaultYear || '2nd Year'),
              uncertain_fields: ambiguity.isUncertain ? ['enrollment_number'] : [],
              uncertainty_reason: ambiguity.reason,
            });
            continue;
          }
        }
      }
    }

    // Pattern 3: Multi-line OCR detection (Line i is Name, Line i+1 is Enrollment or vice versa)
    if (i < rawLines.length - 1) {
      const nextLine = stripBtBatch(rawLines[i + 1]);
      if (isPossibleName(line) && isPossibleEnrollment(nextLine)) {
        const cleanName = line.replace(/^(Mr\.|Ms\.|Miss|Master|Mrs\.)\s+/i, '').trim();
        const enrollmentNo = nextLine.toUpperCase();
        if (cleanName.length >= 3 && !seenEnrollments.has(enrollmentNo)) {
          seenEnrollments.add(enrollmentNo);
          const ambiguity = checkEnrollmentAmbiguity(enrollmentNo);
          results.push({
            student_name: cleanName,
            enrollment_number: enrollmentNo,
            department: documentLevelDept || (defaultDept || 'Computer Engineering'),
            year: documentLevelYear || (defaultYear || '2nd Year'),
            uncertain_fields: ambiguity.isUncertain ? ['enrollment_number'] : [],
            uncertainty_reason: ambiguity.reason,
          });
          i++; // Skip next line
          continue;
        }
      } else if (isPossibleEnrollment(line) && isPossibleName(nextLine)) {
        const enrollmentNo = line.toUpperCase();
        const cleanName = nextLine.replace(/^(Mr\.|Ms\.|Miss|Master|Mrs\.)\s+/i, '').trim();
        if (cleanName.length >= 3 && !seenEnrollments.has(enrollmentNo)) {
          seenEnrollments.add(enrollmentNo);
          const ambiguity = checkEnrollmentAmbiguity(enrollmentNo);
          results.push({
            student_name: cleanName,
            enrollment_number: enrollmentNo,
            department: documentLevelDept || (defaultDept || 'Computer Engineering'),
            year: documentLevelYear || (defaultYear || '2nd Year'),
            uncertain_fields: ambiguity.isUncertain ? ['enrollment_number'] : [],
            uncertainty_reason: ambiguity.reason,
          });
          i++; // Skip next line
          continue;
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

// Perform Tesseract OCR on Image Buffer
export async function extractTextFromImageOcr(imageBuffer: Buffer): Promise<string> {
  try {
    const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng');
    return text || '';
  } catch (err: any) {
    console.error('Tesseract OCR error:', err);
    return '';
  }
}
