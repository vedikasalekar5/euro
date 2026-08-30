import { query, queryOne, run, withTransaction } from '../database/db.js';

export interface SubjectRecord {
  id: string;
  subject_code: string;
  subject_name: string;
  department: string;
  year: string;
  teacher_id?: string;
  unit_1_max_marks: number;
  unit_2_max_marks: number;
  created_at: string;
}

export class SubjectModel {
  /**
   * Retrieves all subjects with optional filters
   */
  static getAll(filters: { department?: string; year?: string; teacher_id?: string } = {}): SubjectRecord[] {
    let sql = 'SELECT * FROM subjects WHERE 1=1';
    const params: any[] = [];

    if (filters.department && filters.department !== 'All') {
      sql += ' AND department = ?';
      params.push(filters.department);
    }

    if (filters.year && filters.year !== 'All') {
      sql += ' AND year = ?';
      params.push(filters.year);
    }

    if (filters.teacher_id && filters.teacher_id !== 'ALL') {
      sql += ' AND teacher_id = ?';
      params.push(filters.teacher_id);
    }

    sql += ' ORDER BY department ASC, year ASC, subject_name ASC';
    return query<SubjectRecord>(sql, params);
  }

  /**
   * Get subject by ID
   */
  static getById(id: string, teacherId?: string): SubjectRecord | null {
    if (teacherId) {
      return queryOne<SubjectRecord>('SELECT * FROM subjects WHERE id = ? AND teacher_id = ?', [id, teacherId]);
    }
    return queryOne<SubjectRecord>('SELECT * FROM subjects WHERE id = ?', [id]);
  }

  /**
   * Get subject by code, department, and year
   */
  static getByCode(code: string, department: string, year: string, teacherId?: string): SubjectRecord | null {
    if (teacherId) {
      return queryOne<SubjectRecord>(
        'SELECT * FROM subjects WHERE UPPER(TRIM(subject_code)) = ? AND department = ? AND year = ? AND teacher_id = ?',
        [code.trim().toUpperCase(), department, year, teacherId]
      );
    }
    return queryOne<SubjectRecord>(
      'SELECT * FROM subjects WHERE UPPER(TRIM(subject_code)) = ? AND department = ? AND year = ?',
      [code.trim().toUpperCase(), department, year]
    );
  }

  /**
   * Creates a new subject
   */
  static create(data: {
    id?: string;
    subject_code: string;
    subject_name: string;
    department: string;
    year: string;
    teacher_id?: string;
    unit_1_max_marks?: number;
    unit_2_max_marks?: number;
  }): { success: boolean; subject?: SubjectRecord; error?: string } {
    const subjectName = (data.subject_name || '').trim();
    const subjectCode = (data.subject_code || '').trim().toUpperCase();
    const department = (data.department || 'Computer Engineering').trim();
    const year = (data.year || '2nd Year').trim();
    const teacherId = data.teacher_id ? data.teacher_id.trim() : null;
    const u1Max = Number(data.unit_1_max_marks) || 30;
    const u2Max = Number(data.unit_2_max_marks) || 30;

    if (!subjectName) {
      return { success: false, error: 'Subject name is required.' };
    }
    if (!subjectCode) {
      return { success: false, error: 'Course code is required.' };
    }

    const id = data.id || `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    run(
      `INSERT INTO subjects (id, subject_code, subject_name, department, year, teacher_id, unit_1_max_marks, unit_2_max_marks, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, subjectCode, subjectName, department, year, teacherId, u1Max, u2Max, now]
    );

    const inserted = this.getById(id);
    return { success: true, subject: inserted || undefined };
  }

  /**
   * Updates an existing subject
   */
  static update(
    id: string,
    data: Partial<{
      subject_code: string;
      subject_name: string;
      department: string;
      year: string;
      teacher_id: string | null;
      unit_1_max_marks: number;
      unit_2_max_marks: number;
    }>,
    teacherId?: string
  ): { success: boolean; subject?: SubjectRecord; error?: string } {
    const subject = this.getById(id, teacherId);
    if (!subject) {
      return { success: false, error: 'Course not found or not authorized.' };
    }

    const subjectName = data.subject_name !== undefined ? data.subject_name.trim() : subject.subject_name;
    const subjectCode = data.subject_code !== undefined ? data.subject_code.trim().toUpperCase() : subject.subject_code;
    const department = data.department !== undefined ? data.department.trim() : subject.department;
    const year = data.year !== undefined ? data.year.trim() : subject.year;
    const targetTeacherId = data.teacher_id !== undefined ? data.teacher_id : subject.teacher_id;
    const u1Max = data.unit_1_max_marks !== undefined ? Number(data.unit_1_max_marks) : subject.unit_1_max_marks;
    const u2Max = data.unit_2_max_marks !== undefined ? Number(data.unit_2_max_marks) : subject.unit_2_max_marks;

    run(
      `UPDATE subjects 
       SET subject_code = ?, subject_name = ?, department = ?, year = ?, teacher_id = ?, unit_1_max_marks = ?, unit_2_max_marks = ?
       WHERE id = ?`,
      [subjectCode, subjectName, department, year, targetTeacherId, u1Max, u2Max, subject.id]
    );

    const updated = this.getById(subject.id);
    return { success: true, subject: updated || undefined };
  }

  /**
   * Deletes a subject and cascades marks safely in a transaction
   */
  static delete(id: string, teacherId?: string): { success: boolean; error?: string } {
    const subject = this.getById(id, teacherId);
    if (!subject) {
      return { success: false, error: 'Course not found or not authorized.' };
    }

    try {
      withTransaction(() => {
        run('DELETE FROM marks WHERE subject_id = ?', [subject.id]);
        run('DELETE FROM subjects WHERE id = ?', [subject.id]);
      });
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting course:', err);
      return { success: false, error: err.message || 'Failed to delete course' };
    }
  }

  /**
   * Deletes multiple subjects in a single atomic transaction with teacher ownership verification
   */
  static deleteBatch(ids: string[], teacherId?: string): {
    success: boolean;
    deletedCount: number;
    failedCount: number;
    deletedIds: string[];
    failedIds: string[];
    message?: string;
    error?: string;
  } {
    if (!ids || ids.length === 0) {
      return { success: true, deletedCount: 0, failedCount: 0, deletedIds: [], failedIds: [], message: '0 courses deleted.' };
    }

    let deletedCount = 0;
    const deletedIds: string[] = [];
    const failedIds: string[] = [];

    try {
      withTransaction(() => {
        for (const id of ids) {
          const subject = this.getById(id, teacherId);
          if (subject) {
            run('DELETE FROM marks WHERE subject_id = ?', [subject.id]);
            run('DELETE FROM subjects WHERE id = ?', [subject.id]);
            deletedCount++;
            deletedIds.push(subject.id);
          } else {
            failedIds.push(id);
          }
        }
      });

      return {
        success: true,
        deletedCount,
        failedCount: failedIds.length,
        deletedIds,
        failedIds,
        message: deletedCount === 1 ? '1 course deleted successfully.' : `${deletedCount} courses deleted successfully.`,
      };
    } catch (err: any) {
      console.error('Batch course deletion transaction error:', err);
      return {
        success: false,
        deletedCount: 0,
        failedCount: ids.length,
        deletedIds: [],
        failedIds: ids,
        error: err.message,
        message: 'Unable to delete the selected record. Please try again.',
      };
    }
  }

  /**
   * Deletes all courses and associated marks in an atomic transaction.
   * Scoped to teacherId if provided.
   * Does NOT delete students, teachers, audit logs, or settings.
   */
  static deleteAll(teacherId?: string): {
    success: boolean;
    deletedCount: number;
    message?: string;
    error?: string;
  } {
    try {
      let count = 0;
      withTransaction(() => {
        const all = this.getAll({ teacher_id: teacherId });
        count = all.length;
        if (teacherId) {
          run('DELETE FROM marks WHERE subject_id IN (SELECT id FROM subjects WHERE teacher_id = ?)', [teacherId]);
          run('DELETE FROM subjects WHERE teacher_id = ?', [teacherId]);
        } else {
          run('DELETE FROM marks WHERE subject_id IN (SELECT id FROM subjects)');
          run('DELETE FROM subjects');
        }
      });
      return {
        success: true,
        deletedCount: count,
        message: 'All courses deleted successfully.',
      };
    } catch (err: any) {
      console.error('Error deleting all courses:', err);
      return {
        success: false,
        deletedCount: 0,
        error: err.message,
        message: 'Unable to delete all courses. Please try again.',
      };
    }
  }
}
