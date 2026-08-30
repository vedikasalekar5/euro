import { query, queryOne, run } from '../database/db.js';
import { validateMarksInput, calculateSubjectMetrics } from '../services/calculationService.js';
import { StudentModel } from './student.js';
import { SubjectModel } from './subject.js';

export interface MarkRecordItem {
  id: string;
  student_id: number;
  subject_id: string;
  unit_test_1_marks: number;
  unit_test_1_max_marks: number;
  unit_test_2_marks: number;
  unit_test_2_max_marks: number;
  created_at: string;
  updated_at: string;

  // Joined metadata if retrieved with joins
  student_name?: string;
  roll_number?: string;
  enrollment_number?: string;
  department?: string;
  year?: string;
  subject_name?: string;
  subject_code?: string;
}

export class MarksModel {
  /**
   * Retrieves all marks with optional teacher_id scoping
   */
  static getAll(filters: { teacher_id?: string; student_id?: number | string; subject_id?: string } = {}): MarkRecordItem[] {
    let sql = `
      SELECT m.*, 
             s.student_name, s.roll_number, s.enrollment_number, s.department, s.year,
             sub.subject_name, sub.subject_code
      FROM marks m
      LEFT JOIN students s ON m.student_id = s.id
      LEFT JOIN subjects sub ON m.subject_id = sub.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.teacher_id && filters.teacher_id !== 'ALL') {
      sql += ' AND (s.teacher_id = ? OR sub.teacher_id = ?)';
      params.push(filters.teacher_id, filters.teacher_id);
    }

    if (filters.student_id) {
      sql += ' AND m.student_id = ?';
      params.push(Number(filters.student_id));
    }

    if (filters.subject_id) {
      sql += ' AND m.subject_id = ?';
      params.push(filters.subject_id);
    }

    sql += ' ORDER BY s.student_name ASC';
    return query<MarkRecordItem>(sql, params);
  }

  /**
   * Retrieves marks for a specific student
   */
  static getForStudent(studentId: number | string, teacherId?: string): MarkRecordItem[] {
    let sql = `SELECT m.*, 
               sub.subject_name, sub.subject_code, sub.department, sub.year
        FROM marks m
        LEFT JOIN students s ON m.student_id = s.id
        LEFT JOIN subjects sub ON m.subject_id = sub.id
        WHERE m.student_id = ?`;
    const params: any[] = [Number(studentId)];

    if (teacherId && teacherId !== 'ALL') {
      sql += ' AND (s.teacher_id = ? OR sub.teacher_id = ?)';
      params.push(teacherId, teacherId);
    }

    return query<MarkRecordItem>(sql, params);
  }

  /**
   * Retrieves marks for a specific subject
   */
  static getForSubject(subjectId: string, teacherId?: string): MarkRecordItem[] {
    let sql = `SELECT m.*, 
               s.student_name, s.roll_number, s.enrollment_number, s.department, s.year, s.division
        FROM marks m
        LEFT JOIN students s ON m.student_id = s.id
        LEFT JOIN subjects sub ON m.subject_id = sub.id
        WHERE m.subject_id = ?`;
    const params: any[] = [subjectId];

    if (teacherId && teacherId !== 'ALL') {
      sql += ' AND (s.teacher_id = ? OR sub.teacher_id = ?)';
      params.push(teacherId, teacherId);
    }

    sql += ' ORDER BY s.roll_number ASC, s.student_name ASC';
    return query<MarkRecordItem>(sql, params);
  }

  /**
   * Retrieves single mark record by student and subject
   */
  static getByStudentAndSubject(studentId: number | string, subjectId: string): MarkRecordItem | null {
    return queryOne<MarkRecordItem>(
      'SELECT * FROM marks WHERE student_id = ? AND subject_id = ?',
      [Number(studentId), subjectId]
    );
  }

  /**
   * Saves or updates marks for a student and subject with full validation
   */
  static saveMarks(
    studentId: number | string,
    subjectId: string,
    unit1Marks: number,
    unit1MaxMarks: number = 30,
    unit2Marks: number,
    unit2MaxMarks: number = 30,
    teacherId?: string
  ): {
    success: boolean;
    mark?: MarkRecordItem;
    metrics?: any;
    error?: string;
  } {
    // 1. Check student exists
    const student = StudentModel.getById(studentId, teacherId);
    if (!student) {
      return { success: false, error: `Student with ID ${studentId} not found or not authorized.` };
    }

    // 2. Check subject exists
    const subject = SubjectModel.getById(subjectId, teacherId);
    if (!subject) {
      return { success: false, error: `Subject with ID ${subjectId} not found or not authorized.` };
    }

    // 3. Validate marks
    const validation = validateMarksInput(unit1Marks, unit1MaxMarks, unit2Marks, unit2MaxMarks);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const u1 = Number(unit1Marks);
    const u1Max = Number(unit1MaxMarks);
    const u2 = Number(unit2Marks);
    const u2Max = Number(unit2MaxMarks);

    const now = new Date().toISOString();
    const existing = this.getByStudentAndSubject(student.id, subject.id);

    let markId: string;
    if (existing) {
      markId = existing.id;
      run(
        `UPDATE marks 
         SET unit_test_1_marks = ?, unit_test_1_max_marks = ?, unit_test_2_marks = ?, unit_test_2_max_marks = ?, updated_at = ?
         WHERE id = ?`,
        [u1, u1Max, u2, u2Max, now, markId]
      );
    } else {
      markId = `mrk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      run(
        `INSERT INTO marks (id, student_id, subject_id, unit_test_1_marks, unit_test_1_max_marks, unit_test_2_marks, unit_test_2_max_marks, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [markId, student.id, subject.id, u1, u1Max, u2, u2Max, now, now]
      );
    }

    const updatedRecord = this.getByStudentAndSubject(student.id, subject.id);
    const metrics = calculateSubjectMetrics(u1, u1Max, u2, u2Max);

    return {
      success: true,
      mark: updatedRecord || undefined,
      metrics,
    };
  }

  /**
   * Batch save marks for an exam type or subject
   */
  static batchSave(
    records: Array<{
      student_id: number | string;
      subject_id: string;
      unit_1_marks?: number;
      unit_1_max_marks?: number;
      unit_2_marks?: number;
      unit_2_max_marks?: number;
    }>,
    teacherId?: string
  ): { success: boolean; savedCount: number; errors: string[] } {
    let savedCount = 0;
    const errors: string[] = [];

    for (const rec of records) {
      const existing = this.getByStudentAndSubject(rec.student_id, rec.subject_id);
      const u1 = rec.unit_1_marks !== undefined ? rec.unit_1_marks : (existing?.unit_test_1_marks ?? 0);
      const u1Max = rec.unit_1_max_marks !== undefined ? rec.unit_1_max_marks : (existing?.unit_test_1_max_marks ?? 30);
      const u2 = rec.unit_2_marks !== undefined ? rec.unit_2_marks : (existing?.unit_test_2_marks ?? 0);
      const u2Max = rec.unit_2_max_marks !== undefined ? rec.unit_2_max_marks : (existing?.unit_test_2_max_marks ?? 30);

      const result = this.saveMarks(rec.student_id, rec.subject_id, u1, u1Max, u2, u2Max, teacherId);
      if (result.success) {
        savedCount++;
      } else if (result.error) {
        errors.push(`Student ID ${rec.student_id}: ${result.error}`);
      }
    }

    return {
      success: errors.length === 0,
      savedCount,
      errors,
    };
  }
}
