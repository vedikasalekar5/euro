import { StudentModel, StudentRecord } from '../models/student.js';
import { SubjectModel, SubjectRecord } from '../models/subject.js';
import { MarksModel, MarkRecordItem } from '../models/marks.js';
import { TeacherModel } from '../models/teacher.js';
import {
  calculateSubjectMetrics,
  getPerformanceRating,
  detectImprovement,
  calculatePercentage,
  PerformanceRating,
  ImprovementTrend,
} from './calculationService.js';

export interface StudentFullSummary {
  student: StudentRecord;
  subjectsCount: number;
  details: Array<{
    subject: SubjectRecord;
    unit1Marks: number;
    unit1MaxMarks: number;
    unit2Marks: number;
    unit2MaxMarks: number;
    unit1Percentage: number;
    unit2Percentage: number;
    averageMarks: number;
    averageMaxMarks: number;
    averagePercentage: number;
    rating: PerformanceRating;
    trend: ImprovementTrend;
    improvementLabel: string;
    improvementDelta: number;
  }>;
  overallUnit1Marks: number;
  overallUnit1Max: number;
  overallUnit1Percentage: number;
  overallUnit2Marks: number;
  overallUnit2Max: number;
  overallUnit2Percentage: number;
  overallAverageMarks: number;
  overallAverageMax: number;
  overallAveragePercentage: number;
  overallRating: PerformanceRating;
  overallTrend: ImprovementTrend;
  overallImprovementDelta: number;
  collegeRank?: number;
  departmentRank?: number;
  yearRank?: number;
  divisionRank?: number;
}

export class PerformanceService {
  /**
   * Computes full academic summary for a single student
   */
  static getStudentSummary(studentId: number | string, teacherId?: string): StudentFullSummary | null {
    const student = StudentModel.getById(studentId, teacherId);
    if (!student) return null;

    const allSubjects = SubjectModel.getAll({
      department: student.department,
      year: student.year,
      teacher_id: teacherId,
    });

    const marksList = MarksModel.getForStudent(student.id, teacherId);
    const marksMap = new Map<string, MarkRecordItem>();
    marksList.forEach((m) => marksMap.set(m.subject_id, m));

    const details = allSubjects.map((sub) => {
      const m = marksMap.get(sub.id);
      const u1 = m ? m.unit_test_1_marks : 0;
      const u1Max = m ? m.unit_test_1_max_marks : sub.unit_1_max_marks;
      const u2 = m ? m.unit_test_2_marks : 0;
      const u2Max = m ? m.unit_test_2_max_marks : sub.unit_2_max_marks;

      const metrics = calculateSubjectMetrics(u1, u1Max, u2, u2Max);
      return {
        subject: sub,
        ...metrics,
      };
    });

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
      };
    }

    let totalU1Marks = 0;
    let totalU1Max = 0;
    let totalU2Marks = 0;
    let totalU2Max = 0;
    let totalAvgMarks = 0;
    let totalAvgMax = 0;

    details.forEach((d) => {
      totalU1Marks += d.unit1Marks;
      totalU1Max += d.unit1MaxMarks;
      totalU2Marks += d.unit2Marks;
      totalU2Max += d.unit2MaxMarks;
      totalAvgMarks += d.averageMarks;
      totalAvgMax += d.averageMaxMarks;
    });

    const count = details.length;
    const overallU1AvgMarks = Math.round((totalU1Marks / count) * 10) / 10;
    const overallU1AvgMax = Math.round((totalU1Max / count) * 10) / 10;
    const overallU2AvgMarks = Math.round((totalU2Marks / count) * 10) / 10;
    const overallU2AvgMax = Math.round((totalU2Max / count) * 10) / 10;

    const overallAvgMarks = Math.round((totalAvgMarks / count) * 10) / 10;
    const overallAvgMax = Math.round((totalAvgMax / count) * 10) / 10;

    const overallU1Pct = calculatePercentage(totalU1Marks, totalU1Max);
    const overallU2Pct = calculatePercentage(totalU2Marks, totalU2Max);
    const overallAvgPct = calculatePercentage(overallAvgMarks, overallAvgMax);

    const overallRating = getPerformanceRating(overallAvgPct);
    const { trend, delta } = detectImprovement(overallU1Pct, overallU2Pct);

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
      overallTrend: trend,
      overallImprovementDelta: delta,
    };
  }

  /**
   * Computes summaries and dynamic rankings for all students
   */
  static getAllStudentSummaries(teacherId?: string): StudentFullSummary[] {
    const students = StudentModel.getAll({ teacher_id: teacherId });
    const summaries: StudentFullSummary[] = [];

    for (const student of students) {
      const sum = this.getStudentSummary(student.id, teacherId);
      if (sum) summaries.push(sum);
    }

    // Dynamic College Ranking (Sort descending by overall average percentage)
    const collegeRanked = [...summaries].sort(
      (a, b) => b.overallAveragePercentage - a.overallAveragePercentage
    );
    collegeRanked.forEach((item, index) => {
      item.collegeRank = index + 1;
    });

    // Dynamic Department Ranking
    const deptGroups: Record<string, StudentFullSummary[]> = {};
    summaries.forEach((s) => {
      const dept = s.student.department;
      if (!deptGroups[dept]) deptGroups[dept] = [];
      deptGroups[dept].push(s);
    });
    Object.values(deptGroups).forEach((group) => {
      group
        .sort((a, b) => b.overallAveragePercentage - a.overallAveragePercentage)
        .forEach((item, index) => {
          item.departmentRank = index + 1;
        });
    });

    // Dynamic Year Ranking
    const yearGroups: Record<string, StudentFullSummary[]> = {};
    summaries.forEach((s) => {
      const key = `${s.student.department}_${s.student.year}`;
      if (!yearGroups[key]) yearGroups[key] = [];
      yearGroups[key].push(s);
    });
    Object.values(yearGroups).forEach((group) => {
      group
        .sort((a, b) => b.overallAveragePercentage - a.overallAveragePercentage)
        .forEach((item, index) => {
          item.yearRank = index + 1;
        });
    });

    // Dynamic Division Ranking
    const divGroups: Record<string, StudentFullSummary[]> = {};
    summaries.forEach((s) => {
      const key = `${s.student.department}_${s.student.year}_${s.student.division}`;
      if (!divGroups[key]) divGroups[key] = [];
      divGroups[key].push(s);
    });
    Object.values(divGroups).forEach((group) => {
      group
        .sort((a, b) => b.overallAveragePercentage - a.overallAveragePercentage)
        .forEach((item, index) => {
          item.divisionRank = index + 1;
        });
    });

    return summaries;
  }

  /**
   * Retrieves overall Dashboard statistics directly from database
   */
  static getDashboardStats(teacherId?: string) {
    const students = StudentModel.getAll({ teacher_id: teacherId });
    const subjects = SubjectModel.getAll({ teacher_id: teacherId });
    const teachers = TeacherModel.getAll();
    const summaries = this.getAllStudentSummaries(teacherId);

    let totalU1Pct = 0;
    let totalU2Pct = 0;
    let totalOverallPct = 0;
    let improvedCount = 0;
    let declinedCount = 0;
    let attentionCount = 0;

    const evaluatedStudents = summaries.filter((s) => s.subjectsCount > 0);
    const count = evaluatedStudents.length;

    evaluatedStudents.forEach((s) => {
      totalU1Pct += s.overallUnit1Percentage;
      totalU2Pct += s.overallUnit2Percentage;
      totalOverallPct += s.overallAveragePercentage;

      if (s.overallTrend === 'Improved') improvedCount++;
      else if (s.overallTrend === 'Declined') declinedCount++;

      // Needing attention: below 50% or poor/below average
      if (s.overallAveragePercentage < 50 || s.overallRating === 'Poor' || s.overallRating === 'Below Average') {
        attentionCount++;
      }
    });

    const avgUnit1Performance = count > 0 ? Math.round((totalU1Pct / count) * 10) / 10 : 0;
    const avgUnit2Performance = count > 0 ? Math.round((totalU2Pct / count) * 10) / 10 : 0;
    const overallAverage = count > 0 ? Math.round((totalOverallPct / count) * 10) / 10 : 0;

    return {
      totalStudents: students.length,
      totalSubjects: subjects.length,
      totalTeachers: teachers.length,
      evaluatedCount: count,
      avgUnit1Performance,
      avgUnit2Performance,
      overallAverage,
      studentsImproved: improvedCount,
      studentsDeclined: declinedCount,
      studentsNeedingAttention: attentionCount,
    };
  }

  /**
   * Generates Department and Year-wise analysis
   */
  static getDepartmentYearAnalysis(department?: string, year?: string, teacherId?: string) {
    const allSummaries = this.getAllStudentSummaries(teacherId);
    let filtered = allSummaries;

    if (department && department !== 'All') {
      filtered = filtered.filter((s) => s.student.department === department);
    }
    if (year && year !== 'All') {
      filtered = filtered.filter((s) => s.student.year === year);
    }

    const totalStudents = filtered.length;
    let totalU1Pct = 0;
    let totalU2Pct = 0;
    let totalOverallPct = 0;
    let improvedCount = 0;
    let declinedCount = 0;

    filtered.forEach((s) => {
      totalU1Pct += s.overallUnit1Percentage;
      totalU2Pct += s.overallUnit2Percentage;
      totalOverallPct += s.overallAveragePercentage;
      if (s.overallTrend === 'Improved') improvedCount++;
      if (s.overallTrend === 'Declined') declinedCount++;
    });

    const sortedByScore = [...filtered].sort(
      (a, b) => b.overallAveragePercentage - a.overallAveragePercentage
    );

    const highestPerformer = sortedByScore.length > 0 ? sortedByScore[0] : null;
    const lowestPerformer = sortedByScore.length > 0 ? sortedByScore[sortedByScore.length - 1] : null;

    // Performance categories distribution
    const performanceCategories = {
      Excellent: filtered.filter((s) => s.overallRating === 'Excellent').length,
      'Very Good': filtered.filter((s) => s.overallRating === 'Very Good').length,
      Good: filtered.filter((s) => s.overallRating === 'Good').length,
      Average: filtered.filter((s) => s.overallRating === 'Average').length,
      'Below Average': filtered.filter((s) => s.overallRating === 'Below Average').length,
      Poor: filtered.filter((s) => s.overallRating === 'Poor').length,
    };

    return {
      department: department || 'All Departments',
      year: year || 'All Years',
      totalStudents,
      unit1Average: totalStudents > 0 ? Math.round((totalU1Pct / totalStudents) * 10) / 10 : 0,
      unit2Average: totalStudents > 0 ? Math.round((totalU2Pct / totalStudents) * 10) / 10 : 0,
      overallAverage: totalStudents > 0 ? Math.round((totalOverallPct / totalStudents) * 10) / 10 : 0,
      improvedStudents: improvedCount,
      declinedStudents: declinedCount,
      highestPerformer: highestPerformer
        ? {
            id: highestPerformer.student.id,
            name: highestPerformer.student.student_name,
            roll: highestPerformer.student.roll_number,
            enrollment: highestPerformer.student.enrollment_number,
            percentage: highestPerformer.overallAveragePercentage,
            rating: highestPerformer.overallRating,
          }
        : null,
      lowestPerformer: lowestPerformer
        ? {
            id: lowestPerformer.student.id,
            name: lowestPerformer.student.student_name,
            roll: lowestPerformer.student.roll_number,
            enrollment: lowestPerformer.student.enrollment_number,
            percentage: lowestPerformer.overallAveragePercentage,
            rating: lowestPerformer.overallRating,
          }
        : null,
      performanceCategories,
      studentList: filtered,
    };
  }
}
