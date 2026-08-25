import {
  Student,
  Subject,
  MarkRecord,
  PerformanceRating,
  ImprovementTrend,
  SubjectPerformanceDetail,
  StudentAcademicSummary,
} from '../types';

/**
 * Calculates percentage safely with 1-decimal precision
 */
export function calculatePercentage(marks: number, maxMarks: number): number {
  if (!maxMarks || maxMarks <= 0) return 0;
  const pct = (marks / maxMarks) * 100;
  return Math.min(100, Math.max(0, Math.round(pct * 10) / 10));
}

/**
 * Returns performance classification based on calculated percentage
 * 90–100% → Excellent
 * 80–89%  → Very Good
 * 70–79%  → Good
 * 60–69%  → Average
 * 40–59%  → Below Average
 * Below 40% → Poor
 */
export function getPerformanceRating(percentage: number): PerformanceRating {
  if (percentage >= 90) return 'Excellent';
  if (percentage >= 80) return 'Very Good';
  if (percentage >= 70) return 'Good';
  if (percentage >= 60) return 'Average';
  if (percentage >= 40) return 'Below Average';
  return 'Poor';
}

/**
 * Returns color classes for each performance rating
 */
export function getPerformanceBadgeClasses(rating: PerformanceRating): {
  bg: string;
  text: string;
  border: string;
  badgeBg: string;
  dotBg: string;
} {
  switch (rating) {
    case 'Excellent':
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        text: 'text-emerald-700',
        border: 'border-emerald-300',
        badgeBg: 'bg-emerald-500',
        dotBg: 'bg-emerald-500',
      };
    case 'Very Good':
      return {
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        text: 'text-blue-700',
        border: 'border-blue-300',
        badgeBg: 'bg-blue-500',
        dotBg: 'bg-blue-500',
      };
    case 'Good':
      return {
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        text: 'text-indigo-700',
        border: 'border-indigo-300',
        badgeBg: 'bg-indigo-500',
        dotBg: 'bg-indigo-500',
      };
    case 'Average':
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        text: 'text-amber-700',
        border: 'border-amber-300',
        badgeBg: 'bg-amber-500',
        dotBg: 'bg-amber-500',
      };
    case 'Below Average':
      return {
        bg: 'bg-orange-50 text-orange-700 border-orange-200',
        text: 'text-orange-700',
        border: 'border-orange-300',
        badgeBg: 'bg-orange-500',
        dotBg: 'bg-orange-500',
      };
    case 'Poor':
    default:
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        text: 'text-rose-700',
        border: 'border-rose-300',
        badgeBg: 'bg-rose-500',
        dotBg: 'bg-rose-500',
      };
  }
}

/**
 * Detects improvement between Unit 1 and Unit 2 percentages
 */
export function detectImprovement(unit1Pct: number, unit2Pct: number): {
  trend: ImprovementTrend;
  delta: number;
} {
  const delta = Math.round((unit2Pct - unit1Pct) * 10) / 10;
  if (delta > 0.5) {
    return { trend: 'Improved', delta };
  } else if (delta < -0.5) {
    return { trend: 'Declined', delta };
  } else {
    return { trend: 'Consistent', delta: 0 };
  }
}

/**
 * Calculates detailed performance for a single subject
 */
export function calculateSubjectPerformance(
  subject: Subject,
  markRecord?: MarkRecord
): SubjectPerformanceDetail {
  const u1Marks = markRecord ? (markRecord.unit_1_marks ?? markRecord.unit1Marks ?? 0) : 0;
  const u1Max = markRecord
    ? (markRecord.unit_1_max_marks ?? markRecord.unit1MaxMarks ?? subject.unit1MaxMarks ?? 25)
    : (subject.unit1MaxMarks ?? 25);
  const u2Marks = markRecord ? (markRecord.unit_2_marks ?? markRecord.unit2Marks ?? 0) : 0;
  const u2Max = markRecord
    ? (markRecord.unit_2_max_marks ?? markRecord.unit2MaxMarks ?? subject.unit2MaxMarks ?? 25)
    : (subject.unit2MaxMarks ?? 25);

  const u1Pct = calculatePercentage(u1Marks, u1Max);
  const u2Pct = calculatePercentage(u2Marks, u2Max);

  const avgMarks = Math.round(((u1Marks + u2Marks) / 2) * 10) / 10;
  const avgMax = Math.round(((u1Max + u2Max) / 2) * 10) / 10;
  const avgPct = calculatePercentage(avgMarks, avgMax);

  const rating = getPerformanceRating(avgPct);
  const { trend, delta } = detectImprovement(u1Pct, u2Pct);

  return {
    subject,
    unit1Marks: u1Marks,
    unit1MaxMarks: u1Max,
    unit2Marks: u2Marks,
    unit2MaxMarks: u2Max,
    unit1Percentage: u1Pct,
    unit2Percentage: u2Pct,
    averageMarks: avgMarks,
    averageMaxMarks: avgMax,
    averagePercentage: avgPct,
    rating,
    trend,
    improvementPercentage: delta,
    isWeak: avgPct < 60,
    isStrong: avgPct >= 80,
  };
}

/**
 * Calculates comprehensive academic summary for a student across all subjects
 */
export function calculateStudentSummary(
  student: Student,
  subjects: Subject[],
  marks: MarkRecord[]
): StudentAcademicSummary {
  // Filter subjects for student's department and year
  const relevantSubjects = subjects.filter(
    (s) => s.department === student.department && s.year === student.year
  );

  const studentMarks = marks.filter(
    (m) => m.student_id === student.id || (m as any).studentId === student.id
  );
  const marksMap = new Map<string, MarkRecord>();
  studentMarks.forEach((m) => {
    const sId = m.subject_id || (m as any).subjectId;
    if (sId) marksMap.set(sId, m);
  });

  const details: SubjectPerformanceDetail[] = relevantSubjects.map((subject) => {
    return calculateSubjectPerformance(subject, marksMap.get(subject.id));
  });

  const studentDisplayName = student.student_name || student.name || 'Student';

  if (details.length === 0) {
    return {
      student,
      subjectsCount: 0,
      details: [],
      overallUnit1Marks: 0,
      overallUnit1Max: 0,
      overallUnit1Percentage: 0,
      overallUnit2Marks: 0,
      overallUnit2Max: 0,
      overallUnit2Percentage: 0,
      overallAverageMarks: 0,
      overallAverageMax: 0,
      overallAveragePercentage: 0,
      overallRating: 'Poor',
      overallTrend: 'Consistent',
      overallImprovementDelta: 0,
      highestSubject: null,
      lowestSubject: null,
      weakSubjects: [],
      strongSubjects: [],
      generatedAnalysis: 'No subjects or examination marks recorded for this student yet.',
    };
  }

  let totalU1Marks = 0;
  let totalU1Max = 0;
  let totalU2Marks = 0;
  let totalU2Max = 0;
  let totalSubjectAvgMarks = 0;
  let totalSubjectAvgMax = 0;

  details.forEach((d) => {
    totalU1Marks += d.unit1Marks;
    totalU1Max += d.unit1MaxMarks;
    totalU2Marks += d.unit2Marks;
    totalU2Max += d.unit2MaxMarks;
    totalSubjectAvgMarks += d.averageMarks;
    totalSubjectAvgMax += d.averageMaxMarks;
  });

  const count = details.length;
  const overallU1AvgMarks = Math.round((totalU1Marks / count) * 100) / 100;
  const overallU1AvgMax = Math.round((totalU1Max / count) * 100) / 100;
  const overallU2AvgMarks = Math.round((totalU2Marks / count) * 100) / 100;
  const overallU2AvgMax = Math.round((totalU2Max / count) * 100) / 100;

  const overallAvgMarks = Math.round((totalSubjectAvgMarks / count) * 100) / 100;
  const overallAvgMax = Math.round((totalSubjectAvgMax / count) * 100) / 100;

  const overallU1Pct = calculatePercentage(totalU1Marks, totalU1Max);
  const overallU2Pct = calculatePercentage(totalU2Marks, totalU2Max);
  const overallAvgPct = calculatePercentage(overallAvgMarks, overallAvgMax);

  const overallRating = getPerformanceRating(overallAvgPct);
  const { trend: overallTrend, delta: overallImprovementDelta } = detectImprovement(
    overallU1Pct,
    overallU2Pct
  );

  // Sort subjects by average percentage
  const sortedDetails = [...details].sort(
    (a, b) => b.averagePercentage - a.averagePercentage
  );

  const highestSubject = sortedDetails.length > 0 ? sortedDetails[0] : null;
  const lowestSubject = sortedDetails.length > 0 ? sortedDetails[sortedDetails.length - 1] : null;

  const weakSubjects = details.filter((d) => d.averagePercentage < 60);
  const strongSubjects = details.filter((d) => d.averagePercentage >= 80);

  // Qualitative academic summary analysis
  const generatedAnalysis = generateAnalysisText(
    studentDisplayName,
    overallRating,
    overallTrend,
    overallImprovementDelta,
    highestSubject,
    lowestSubject,
    weakSubjects,
    strongSubjects
  );

  return {
    student,
    subjectsCount: details.length,
    details,
    overallUnit1Marks: overallU1AvgMarks,
    overallUnit1Max: overallU1AvgMax,
    overallUnit1Percentage: overallU1Pct,
    overallUnit2Marks: overallU2AvgMarks,
    overallUnit2Max: overallU2AvgMax,
    overallUnit2Percentage: overallU2Pct,
    overallAverageMarks: overallAvgMarks,
    overallAverageMax: overallAvgMax,
    overallAveragePercentage: overallAvgPct,
    overallRating,
    overallTrend,
    overallImprovementDelta,
    highestSubject,
    lowestSubject,
    weakSubjects,
    strongSubjects,
    generatedAnalysis,
  };
}

/**
 * Generates an automatic qualitative analysis paragraph based on calculated marks
 */
function generateAnalysisText(
  name: string,
  rating: PerformanceRating,
  trend: ImprovementTrend,
  delta: number,
  highest: SubjectPerformanceDetail | null,
  lowest: SubjectPerformanceDetail | null,
  weakSubjects: SubjectPerformanceDetail[],
  strongSubjects: SubjectPerformanceDetail[]
): string {
  const parts: string[] = [];

  if (rating === 'Excellent' || rating === 'Very Good') {
    parts.push(
      `${name} is performing exceptionally well with a ${rating} academic standing.`
    );
  } else if (rating === 'Good' || rating === 'Average') {
    parts.push(
      `${name} demonstrates steady continuous performance with a ${rating} standing.`
    );
  } else {
    parts.push(
      `${name} is currently in the ${rating} bracket and requires targeted academic guidance.`
    );
  }

  if (trend === 'Improved') {
    parts.push(
      `Performance showed positive growth from Unit 1 to Unit 2 (+${delta}%).`
    );
  } else if (trend === 'Declined') {
    parts.push(
      `A slight decline was noted between Unit 1 and Unit 2 (${delta}%).`
    );
  } else {
    parts.push(`Performance remained steady across Unit 1 and Unit 2.`);
  }

  if (strongSubjects.length > 0 && highest) {
    const subName = highest.subject.subject_name || (highest.subject as any).subjectName;
    parts.push(
      `Demonstrated strength in ${subName} (${highest.averageMarks}/${highest.averageMaxMarks}, ${highest.averagePercentage}%).`
    );
  }

  if (weakSubjects.length > 0) {
    const weakList = weakSubjects
      .map((s) => s.subject.subject_name || (s.subject as any).subjectName)
      .join(', ');
    parts.push(`Recommended focus areas: ${weakList}.`);
  }

  return parts.join(' ');
}
