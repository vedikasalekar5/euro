import { query, queryOne, run, withTransaction } from '../database/db.js';

export interface StudentRecord {
  id: number;
  teacher_id?: string;
  roll_number: string;
  student_name: string;
  enrollment_number: string;
  department: string;
  year: string;
  division: string;
  gender: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentImportItem {
  teacher_id?: string;
  roll_number?: string;
  student_name: string;
  enrollment_number: string;
  department?: string;
  year?: string;
  division?: string;
  gender?: string;
  email?: string;
  phone?: string;
  actionOnDuplicate?: 'skip' | 'update';
}

export interface StudentImportResult {
  success: boolean;
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  importedStudents: StudentRecord[];
  details: Array<{
    student_name: string;
    enrollment_number: string;
    roll_number?: string;
    status: 'imported' | 'updated' | 'skipped' | 'failed';
    message: string;
  }>;
  message?: string;
}

export interface StudentFilterOptions {
  teacher_id?: string;
  search?: string;
  department?: string;
  year?: string;
  division?: string;
  rating?: string;
  limit?: number;
  offset?: number;
}

export class StudentModel {
  /**
   * Retrieves all students matching search and filter conditions
   */
  static getAll(filters: StudentFilterOptions = {}): StudentRecord[] {
    let sql = 'SELECT * FROM students WHERE 1=1';
    const params: any[] = [];

    if (filters.teacher_id && filters.teacher_id !== 'ALL') {
      sql += ' AND teacher_id = ?';
      params.push(filters.teacher_id);
    }

    if (filters.department && filters.department !== 'All') {
      sql += ' AND department = ?';
      params.push(filters.department);
    }

    if (filters.year && filters.year !== 'All') {
      sql += ' AND year = ?';
      params.push(filters.year);
    }

    if (filters.division && filters.division !== 'All') {
      sql += ' AND division = ?';
      params.push(filters.division);
    }

    if (filters.search && filters.search.trim()) {
      const s = `%${filters.search.trim()}%`;
      sql += ' AND (student_name LIKE ? OR roll_number LIKE ? OR enrollment_number LIKE ? OR CAST(id AS TEXT) LIKE ?)';
      params.push(s, s, s, s);
    }

    sql += ' ORDER BY department ASC, year ASC, division ASC, roll_number ASC, student_name ASC';

    if (filters.limit && filters.limit > 0) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(filters.limit, filters.offset || 0);
    }

    return query<StudentRecord>(sql, params);
  }

  /**
   * Get student by ID
   */
  static getById(id: number | string, teacherId?: string): StudentRecord | null {
    if (teacherId) {
      return queryOne<StudentRecord>('SELECT * FROM students WHERE id = ? AND teacher_id = ?', [Number(id), teacherId]);
    }
    return queryOne<StudentRecord>('SELECT * FROM students WHERE id = ?', [Number(id)]);
  }

  /**
   * Get student by Enrollment Number
   */
  static getByEnrollment(enrollmentNumber: string, teacherId?: string): StudentRecord | null {
    if (teacherId) {
      return queryOne<StudentRecord>(
        'SELECT * FROM students WHERE UPPER(TRIM(enrollment_number)) = ? AND teacher_id = ?',
        [enrollmentNumber.trim().toUpperCase(), teacherId]
      );
    }
    return queryOne<StudentRecord>(
      'SELECT * FROM students WHERE UPPER(TRIM(enrollment_number)) = ?',
      [enrollmentNumber.trim().toUpperCase()]
    );
  }

  /**
   * Checks if roll number is already used in same department/year/division group
   */
  static checkDuplicateRoll(
    rollNumber: string,
    department: string,
    year: string,
    division: string = 'A',
    excludeId?: number | string,
    teacherId?: string
  ): boolean {
    let sql = `
      SELECT id FROM students 
      WHERE UPPER(TRIM(roll_number)) = ? 
        AND department = ? 
        AND year = ? 
        AND division = ?
    `;
    const params: any[] = [rollNumber.trim().toUpperCase(), department, year, division];

    if (teacherId) {
      sql += ' AND teacher_id = ?';
      params.push(teacherId);
    }

    if (excludeId) {
      sql += ' AND id != ?';
      params.push(Number(excludeId));
    }

    const row = queryOne(sql, params);
    return row !== null;
  }

  /**
   * Creates a new student with validations
   */
  static create(data: {
    teacher_id?: string;
    roll_number: string;
    student_name: string;
    enrollment_number: string;
    department: string;
    year: string;
    division?: string;
    gender?: string;
    email?: string;
    phone?: string;
  }): { success: boolean; student?: StudentRecord; error?: string } {
    const studentName = (data.student_name || '').trim();
    const enrollmentNumber = (data.enrollment_number || '').trim().toUpperCase();
    const rollNumber = (data.roll_number || enrollmentNumber || '').trim();
    const department = (data.department || 'Computer Engineering').trim();
    const year = (data.year || '2nd Year').trim();
    const division = (data.division || 'A').trim();
    const gender = (data.gender || 'Other').trim();
    const email = (data.email || '').trim();
    const phone = (data.phone || '').trim();
    const teacherId = data.teacher_id ? data.teacher_id.trim() : null;

    if (!studentName) {
      return { success: false, error: 'Student name is required.' };
    }
    if (!enrollmentNumber) {
      return { success: false, error: 'Enrollment number is required.' };
    }

    // Check duplicate enrollment
    const existingEnrollment = this.getByEnrollment(enrollmentNumber, teacherId || undefined);
    if (existingEnrollment) {
      return {
        success: false,
        error: `Enrollment number "${enrollmentNumber}" already exists for ${existingEnrollment.student_name}.`,
      };
    }

    // Check duplicate roll number in same group
    if (this.checkDuplicateRoll(rollNumber, department, year, division, undefined, teacherId || undefined)) {
      return {
        success: false,
        error: `Roll Number "${rollNumber}" is already assigned to another student in ${department} (${year}, Div ${division}).`,
      };
    }

    const now = new Date().toISOString();
    const result = run(
      `INSERT INTO students (teacher_id, roll_number, student_name, enrollment_number, department, year, division, gender, email, phone, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [teacherId, rollNumber, studentName, enrollmentNumber, department, year, division, gender, email, phone, now, now]
    );

    const inserted = this.getById(result.lastInsertRowid);
    if (!inserted) {
      return { success: false, error: 'Failed to retrieve created student.' };
    }

    return { success: true, student: inserted };
  }

  /**
   * Updates an existing student
   */
  static update(
    id: number | string,
    data: Partial<{
      teacher_id: string;
      roll_number: string;
      student_name: string;
      enrollment_number: string;
      department: string;
      year: string;
      division: string;
      gender: string;
      email: string;
      phone: string;
    }>,
    teacherId?: string
  ): { success: boolean; student?: StudentRecord; error?: string } {
    const student = this.getById(id, teacherId);
    if (!student) {
      return { success: false, error: 'Student not found in database or not authorized.' };
    }

    const studentName = data.student_name !== undefined ? data.student_name.trim() : student.student_name;
    const enrollmentNumber = data.enrollment_number !== undefined ? data.enrollment_number.trim().toUpperCase() : student.enrollment_number;
    const rollNumber = data.roll_number !== undefined ? data.roll_number.trim() : student.roll_number;
    const department = data.department !== undefined ? data.department.trim() : student.department;
    const year = data.year !== undefined ? data.year.trim() : student.year;
    const division = data.division !== undefined ? data.division.trim() : student.division;
    const gender = data.gender !== undefined ? data.gender.trim() : student.gender;
    const email = data.email !== undefined ? data.email.trim() : (student.email || '');
    const phone = data.phone !== undefined ? data.phone.trim() : (student.phone || '');
    const targetTeacherId = data.teacher_id !== undefined ? data.teacher_id : (student.teacher_id || null);

    // Check duplicate enrollment if changed
    if (enrollmentNumber !== student.enrollment_number) {
      const existing = this.getByEnrollment(enrollmentNumber, targetTeacherId || undefined);
      if (existing && existing.id !== student.id) {
        return { success: false, error: `Enrollment number "${enrollmentNumber}" is already in use.` };
      }
    }

    // Check duplicate roll number
    if (this.checkDuplicateRoll(rollNumber, department, year, division, student.id, targetTeacherId || undefined)) {
      return {
        success: false,
        error: `Roll Number "${rollNumber}" is already assigned in ${department} (${year}, Div ${division}).`,
      };
    }

    const now = new Date().toISOString();
    run(
      `UPDATE students 
       SET teacher_id = ?, roll_number = ?, student_name = ?, enrollment_number = ?, department = ?, year = ?, division = ?, gender = ?, email = ?, phone = ?, updated_at = ?
       WHERE id = ?`,
      [targetTeacherId, rollNumber, studentName, enrollmentNumber, department, year, division, gender, email, phone, now, student.id]
    );

    const updated = this.getById(student.id);
    return { success: true, student: updated || undefined };
  }

  /**
   * Deletes a student and cascades to delete all marks safely in a transaction
   */
  static delete(id: number | string, teacherId?: string): { success: boolean; error?: string } {
    const student = this.getById(id, teacherId);
    if (!student) {
      return { success: false, error: 'Student not found or not authorized.' };
    }

    try {
      withTransaction(() => {
        run('DELETE FROM marks WHERE student_id = ?', [student.id]);
        run('DELETE FROM students WHERE id = ?', [student.id]);
      });
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting student:', err);
      return { success: false, error: err.message || 'Failed to delete student' };
    }
  }

  /**
   * Deletes multiple students in a single atomic transaction safely cascading marks
   */
  static deleteBatch(ids: (number | string)[], teacherId?: string): {
    success: boolean;
    deletedCount: number;
    failedCount: number;
    deletedIds: (number | string)[];
    failedIds: (number | string)[];
    message?: string;
    error?: string;
  } {
    if (!ids || ids.length === 0) {
      return { success: true, deletedCount: 0, failedCount: 0, deletedIds: [], failedIds: [], message: '0 students deleted.' };
    }

    const validNumericIds: number[] = [];
    const failedIds: (number | string)[] = [];

    // Filter valid IDs and resolve string vs numeric IDs
    for (const rawId of ids) {
      const parsed = Number(rawId);
      if (!isNaN(parsed) && parsed > 0) {
        validNumericIds.push(parsed);
      } else {
        // Try looking up by string enrollment number or prn if string id
        const st = this.getByEnrollment(String(rawId), teacherId);
        if (st) {
          validNumericIds.push(st.id);
        } else {
          failedIds.push(rawId);
        }
      }
    }

    if (validNumericIds.length === 0) {
      return {
        success: false,
        deletedCount: 0,
        failedCount: failedIds.length,
        deletedIds: [],
        failedIds,
        message: 'No matching student records found for deletion.',
      };
    }

    let deletedCount = 0;
    const deletedIds: (number | string)[] = [];

    try {
      withTransaction(() => {
        for (const studentId of validNumericIds) {
          const student = this.getById(studentId, teacherId);
          if (student) {
            run('DELETE FROM marks WHERE student_id = ?', [student.id]);
            run('DELETE FROM students WHERE id = ?', [student.id]);
            deletedCount++;
            deletedIds.push(student.id);
          } else {
            failedIds.push(studentId);
          }
        }
      });

      return {
        success: true,
        deletedCount,
        failedCount: failedIds.length,
        deletedIds,
        failedIds,
        message: deletedCount === 1 ? '1 student deleted successfully.' : `${deletedCount} students deleted successfully.`,
      };
    } catch (err: any) {
      console.error('Batch student deletion transaction error:', err);
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
   * Deletes all students and associated marks in an atomic transaction.
   * Scoped by teacherId if provided.
   * Does NOT delete courses, teachers, audit logs, or settings.
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
          run('DELETE FROM marks WHERE student_id IN (SELECT id FROM students WHERE teacher_id = ?)', [teacherId]);
          run('DELETE FROM students WHERE teacher_id = ?', [teacherId]);
        } else {
          run('DELETE FROM marks WHERE student_id IN (SELECT id FROM students)');
          run('DELETE FROM students');
        }
      });
      return {
        success: true,
        deletedCount: count,
        message: 'All students deleted successfully.',
      };
    } catch (err: any) {
      console.error('Error deleting all students:', err);
      return {
        success: false,
        deletedCount: 0,
        error: err.message,
        message: 'Unable to delete all students. Please try again.',
      };
    }
  }

  /**
   * Batch import students safely with transaction protection and duplicate detection
   */
  static batchImport(
    students: StudentImportItem[],
    defaultActionOnDuplicate: 'skip' | 'update' = 'skip',
    teacherId?: string
  ): StudentImportResult {
    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const insertedIds: number[] = [];
    const updatedIds: number[] = [];
    const details: StudentImportResult['details'] = [];

    // Track records processed within this specific batch to prevent collisions
    const seenEnrollmentsInBatch = new Set<string>();
    const allocatedRollsInBatch = new Set<string>();

    try {
      withTransaction(() => {
        for (let i = 0; i < students.length; i++) {
          const item = students[i];
          const name = (item.student_name || '').trim();
          const enrollment = (item.enrollment_number || '').trim().toUpperCase();
          const dept = (item.department || 'Computer Engineering').trim();
          const yr = (item.year || '2nd Year').trim();
          const div = (item.division || 'A').trim();
          const gdr = (item.gender || 'Other').trim();
          const email = (item.email || '').trim();
          const phone = (item.phone || '').trim();
          const itemTeacherId = item.teacher_id || teacherId || null;
          const action = item.actionOnDuplicate || defaultActionOnDuplicate;

          // 1. Required field validation
          if (!name || name.length < 2) {
            failedCount++;
            details.push({
              student_name: name || `Row #${i + 1}`,
              enrollment_number: enrollment || 'MISSING',
              status: 'failed',
              message: 'Valid student name is required (at least 2 characters).',
            });
            continue;
          }

          if (!enrollment) {
            failedCount++;
            details.push({
              student_name: name,
              enrollment_number: 'MISSING',
              status: 'failed',
              message: 'Enrollment number is required.',
            });
            continue;
          }

          // Check duplicate enrollment within the same batch payload
          if (seenEnrollmentsInBatch.has(enrollment)) {
            skippedCount++;
            details.push({
              student_name: name,
              enrollment_number: enrollment,
              status: 'skipped',
              message: `${name} — Duplicate enrollment number in batch (Skipped)`,
            });
            continue;
          }
          seenEnrollmentsInBatch.add(enrollment);

          try {
            // 2. Check if student already exists in database
            const existing = this.getByEnrollment(enrollment, itemTeacherId || undefined);

            if (existing) {
              if (action === 'update') {
                // Determine roll number for update
                let targetRoll = (item.roll_number || existing.roll_number || enrollment).trim();
                const rollKey = `${dept}|${yr}|${div}|${targetRoll.toUpperCase()}`;
                
                if (
                  allocatedRollsInBatch.has(rollKey) ||
                  this.checkDuplicateRoll(targetRoll, dept, yr, div, existing.id, itemTeacherId || undefined)
                ) {
                  targetRoll = existing.roll_number;
                }
                allocatedRollsInBatch.add(`${dept}|${yr}|${div}|${targetRoll.toUpperCase()}`);

                const now = new Date().toISOString();
                run(
                  `UPDATE students 
                   SET teacher_id = ?, roll_number = ?, student_name = ?, department = ?, year = ?, division = ?, gender = ?, email = ?, phone = ?, updated_at = ?
                   WHERE id = ?`,
                  [
                    itemTeacherId,
                    targetRoll,
                    name,
                    dept,
                    yr,
                    div,
                    gdr,
                    email || existing.email || '',
                    phone || existing.phone || '',
                    now,
                    existing.id,
                  ]
                );

                updatedIds.push(existing.id);
                updatedCount++;
                details.push({
                  student_name: name,
                  enrollment_number: enrollment,
                  roll_number: targetRoll,
                  status: 'updated',
                  message: `${name} — Updated Existing Record`,
                });
              } else {
                skippedCount++;
                details.push({
                  student_name: name,
                  enrollment_number: enrollment,
                  roll_number: existing.roll_number,
                  status: 'skipped',
                  message: `${name} — Already Exists (Skipped)`,
                });
              }
            } else {
              // 3. New Student: determine unique roll number
              let roll = (item.roll_number || '').trim();
              
              const isRollTaken = (r: string) => {
                const key = `${dept}|${yr}|${div}|${r.toUpperCase()}`;
                return allocatedRollsInBatch.has(key) || this.checkDuplicateRoll(r, dept, yr, div, undefined, itemTeacherId || undefined);
              };

              if (!roll || isRollTaken(roll)) {
                // Find highest existing roll number and allocate next available
                let maxSql = `SELECT MAX(CAST(roll_number AS INTEGER)) as max_roll 
                   FROM students 
                   WHERE department = ? AND year = ? AND division = ? AND roll_number GLOB '[0-9]*'`;
                const maxParams: any[] = [dept, yr, div];
                if (itemTeacherId) {
                  maxSql += ' AND teacher_id = ?';
                  maxParams.push(itemTeacherId);
                }
                const maxRow = queryOne<{ max_roll: number }>(maxSql, maxParams);
                let nextInt = (maxRow?.max_roll || 0) + 1;
                while (isRollTaken(String(nextInt))) {
                  nextInt++;
                }
                roll = String(nextInt);
              }

              allocatedRollsInBatch.add(`${dept}|${yr}|${div}|${roll.toUpperCase()}`);

              const now = new Date().toISOString();
              const insertRes = run(
                `INSERT INTO students (teacher_id, roll_number, student_name, enrollment_number, department, year, division, gender, email, phone, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [itemTeacherId, roll, name, enrollment, dept, yr, div, gdr, email, phone, now, now]
              );

              if (insertRes.lastInsertRowid > 0) {
                insertedIds.push(insertRes.lastInsertRowid);
                importedCount++;
                details.push({
                  student_name: name,
                  enrollment_number: enrollment,
                  roll_number: roll,
                  status: 'imported',
                  message: `${name} — Imported Successfully`,
                });
              } else {
                failedCount++;
                details.push({
                  student_name: name,
                  enrollment_number: enrollment,
                  status: 'failed',
                  message: `Database insertion returned 0 rows for ${name}.`,
                });
              }
            }
          } catch (rowErr: any) {
            console.error(`Error importing student "${name}" (${enrollment}):`, rowErr);
            failedCount++;
            details.push({
              student_name: name,
              enrollment_number: enrollment,
              status: 'failed',
              message: rowErr.message || `Database error while saving ${name}.`,
            });
          }
        }
      });
    } catch (batchErr: any) {
      console.error('Fatal batch import transaction error:', batchErr);
      return {
        success: false,
        importedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        failedCount: students.length,
        importedStudents: [],
        details: students.map((s) => ({
          student_name: s.student_name || 'Student',
          enrollment_number: s.enrollment_number || 'UNKNOWN',
          status: 'failed',
          message: 'Unable to save the imported students. Please try again.',
        })),
        message: 'Unable to save the imported students. Please try again.',
      };
    }

    // 4. POST-COMMIT VERIFICATION: Verify all imported/updated students exist in the database
    const verifiedStudents: StudentRecord[] = [];
    for (const id of insertedIds) {
      const verified = this.getById(id);
      if (verified) {
        verifiedStudents.push(verified);
      }
    }
    for (const id of updatedIds) {
      const verified = this.getById(id);
      if (verified && !verifiedStudents.some((s) => s.id === verified.id)) {
        verifiedStudents.push(verified);
      }
    }

    let summaryMessage = '';
    if (importedCount > 0 && skippedCount > 0) {
      summaryMessage = `${importedCount} student(s) imported successfully into the database (${skippedCount} already existed).`;
    } else if (importedCount > 0 && updatedCount > 0) {
      summaryMessage = `${importedCount} student(s) imported successfully, ${updatedCount} existing student(s) updated.`;
    } else if (importedCount > 0) {
      summaryMessage = `${importedCount} student(s) imported successfully into the database.`;
    } else if (updatedCount > 0) {
      summaryMessage = `${updatedCount} existing student record(s) updated successfully.`;
    } else if (skippedCount > 0) {
      summaryMessage = `0 new students added. ${skippedCount} student(s) already existed in database.`;
    } else {
      summaryMessage = 'No valid student records could be imported.';
    }

    return {
      success: importedCount > 0 || updatedCount > 0 || (skippedCount > 0 && failedCount === 0),
      importedCount,
      updatedCount,
      skippedCount,
      failedCount,
      importedStudents: verifiedStudents,
      details,
      message: summaryMessage,
    };
  }
}

