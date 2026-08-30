export type PerformanceRating =
  | 'Excellent'
  | 'Very Good'
  | 'Good'
  | 'Average'
  | 'Below Average'
  | 'Poor';

export type ImprovementTrend = 'Improved' | 'Declined' | 'Consistent';

/**
 * Calculates percentage safely with 1-decimal precision
 */
export function calculatePercentage(marks: number, maxMarks: number): number {
  if (!maxMarks || maxMarks <= 0) return 0;
  const pct = (marks / maxMarks) * 100;
  return Math.min(100, Math.max(0, Math.round(pct * 10) / 10));
}

/**
 * Returns performance classification based on calculated percentage:
 * - 90–100% → Excellent
 * - 80–89%  → Very Good
 * - 70–79%  → Good
 * - 60–69%  → Average
 * - 40–59%  → Below Average
 * - Below 40% → Poor
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
 * Compares Unit Test 1 and Unit Test 2 percentages and determines improvement
 */
export function detectImprovement(unit1Pct: number, unit2Pct: number): {
  trend: ImprovementTrend;
  delta: number;
  label: string;
} {
  const delta = Math.round((unit2Pct - unit1Pct) * 10) / 10;
  if (delta > 0.5) {
    return { trend: 'Improved', delta, label: '📈 Improved' };
  } else if (delta < -0.5) {
    return { trend: 'Declined', delta, label: '📉 Declined' };
  } else {
    return { trend: 'Consistent', delta: 0, label: '➡️ Consistent' };
  }
}

/**
 * Calculates overall subject performance and metrics
 */
export function calculateSubjectMetrics(
  u1Marks: number,
  u1Max: number,
  u2Marks: number,
  u2Max: number
) {
  const u1Pct = calculatePercentage(u1Marks, u1Max);
  const u2Pct = calculatePercentage(u2Marks, u2Max);

  let avgMarks: number;
  let avgMax: number;
  let avgPct: number;

  if (u1Max === u2Max && u1Max > 0) {
    avgMarks = Math.round(((u1Marks + u2Marks) / 2) * 10) / 10;
    avgMax = u1Max;
    avgPct = calculatePercentage(avgMarks, avgMax);
  } else {
    avgMarks = Math.round(((u1Marks + u2Marks) / 2) * 10) / 10;
    avgMax = Math.round(((u1Max + u2Max) / 2) * 10) / 10;
    avgPct = Math.round(((u1Pct + u2Pct) / 2) * 10) / 10;
  }

  const rating = getPerformanceRating(avgPct);
  const { trend, delta, label } = detectImprovement(u1Pct, u2Pct);

  return {
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
    improvementLabel: label,
    improvementDelta: delta,
  };
}

/**
 * Validates unit test marks input against business rules
 */
export function validateMarksInput(
  u1Marks: any,
  u1Max: any,
  u2Marks: any,
  u2Max: any
): { valid: boolean; error?: string } {
  const numU1Marks = Number(u1Marks);
  const numU1Max = Number(u1Max);
  const numU2Marks = Number(u2Marks);
  const numU2Max = Number(u2Max);

  if (isNaN(numU1Marks) || isNaN(numU1Max) || isNaN(numU2Marks) || isNaN(numU2Max)) {
    return { valid: false, error: 'All marks and maximum marks must be valid numbers.' };
  }

  if (numU1Max <= 0) {
    return { valid: false, error: 'Unit 1 maximum marks must be greater than zero.' };
  }

  if (numU2Max <= 0) {
    return { valid: false, error: 'Unit 2 maximum marks must be greater than zero.' };
  }

  if (numU1Marks < 0) {
    return { valid: false, error: 'Unit 1 marks cannot be negative.' };
  }

  if (numU2Marks < 0) {
    return { valid: false, error: 'Unit 2 marks cannot be negative.' };
  }

  if (numU1Marks > numU1Max) {
    return {
      valid: false,
      error: `Unit 1 marks (${numU1Marks}) cannot exceed the maximum marks of ${numU1Max}.`,
    };
  }

  if (numU2Marks > numU2Max) {
    return {
      valid: false,
      error: `Unit 2 marks (${numU2Marks}) cannot exceed the maximum marks of ${numU2Max}.`,
    };
  }

  return { valid: true };
}
