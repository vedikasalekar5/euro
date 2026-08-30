import { Router } from 'express';
import { getDb, query, run } from '../database/db.js';
import { StudentModel } from '../models/student.js';
import { TeacherModel } from '../models/teacher.js';
import { SubjectModel } from '../models/subject.js';
import { MarksModel } from '../models/marks.js';
import { PerformanceService } from '../services/performanceService.js';
import { validateMarksInput } from '../services/calculationService.js';

export const apiRouter = Router();

/**
 * Extracts authenticated teacher_id from Request headers, query params, or body
 */
function getAuthTeacherId(req: any): string | undefined {
  const header = req.headers['x-teacher-id'] || req.headers['authorization'];
  if (typeof header === 'string') {
    const trimmed = header.startsWith('Bearer ') ? header.slice(7).trim() : header.trim();
    if (trimmed) return trimmed;
  }
  const queryVal = req.query?.teacher_id || req.query?.teacherId;
  if (typeof queryVal === 'string' && queryVal.trim()) {
    return queryVal.trim();
  }
  const bodyVal = req.body?.teacher_id || req.body?.teacherId;
  if (typeof bodyVal === 'string' && bodyVal.trim()) {
    return bodyVal.trim();
  }
  return undefined;
}

// ==========================================
// 1. DATABASE HEALTH & STATUS
// ==========================================
apiRouter.get('/db/status', async (req, res) => {
  try {
    await getDb();
    const teacherId = getAuthTeacherId(req);
    const studentsCount = StudentModel.getAll({ teacher_id: teacherId }).length;
    const subjectsCount = SubjectModel.getAll({ teacher_id: teacherId }).length;
    const teachersCount = TeacherModel.getAll().length;
    const marksCount = MarksModel.getAll({ teacher_id: teacherId }).length;

    res.json({
      success: true,
      connected: true,
      database: 'euro_unit_test.db',
      type: 'SQLite3 Relational Database',
      stats: {
        studentsCount,
        subjectsCount,
        teachersCount,
        marksCount,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      connected: false,
      error: err.message,
    });
  }
});

// ==========================================
// 2. STUDENTS CRUD & SEARCH / FILTERS
// ==========================================
apiRouter.get('/students', (req, res) => {
  try {
    const teacherId = getAuthTeacherId(req);
    const { search, department, year, division, rating, limit, offset } = req.query;
    let students = StudentModel.getAll({
      search: search as string,
      department: department as string,
      year: year as string,
      division: division as string,
      teacher_id: teacherId,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });

    // If performance rating filter is specified, filter using PerformanceService
    if (rating && rating !== 'All') {
      const summaries = PerformanceService.getAllStudentSummaries(teacherId);
      const matchingIds = new Set(
        summaries
          .filter((s) => s.overallRating === rating)
          .map((s) => s.student.id)
      );
      students = students.filter((st) => matchingIds.has(st.id));
    }

    res.json({ success: true, count: students.length, students });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/students/:id', (req, res) => {
  try {
    const teacherId = getAuthTeacherId(req);
    const { id } = req.params;
    const summary = PerformanceService.getStudentSummary(id, teacherId);
    if (!summary) {
      return res.status(404).json({ success: false, error: 'Student not found in database.' });
    }
    res.json({ success: true, student: summary.student, summary });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/students', (req, res) => {
  try {
    const teacherId = getAuthTeacherId(req);
    const { student_name, name, enrollment_number, enrollmentNo, roll_number, rollNumber, prn, department, year, division, gender, email, phone } = req.body;

    const result = StudentModel.create({
      student_name: student_name || name,
      enrollment_number: enrollment_number || enrollmentNo || prn,
      roll_number: roll_number || rollNumber || enrollment_number || enrollmentNo,
      department,
      year,
      division,
      gender,
      email,
      phone,
      teacher_id: teacherId,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/students/:id', (req, res) => {
  try {
    const teacherId = getAuthTeacherId(req);
    const { id } = req.params;
    const { student_name, name, enrollment_number, enrollmentNo, roll_number, rollNumber, department, year, division, gender, email, phone } = req.body;

    const result = StudentModel.update(id, {
      student_name: student_name || name,
      enrollment_number: enrollment_number || enrollmentNo,
      roll_number: roll_number || rollNumber,
      department,
      year,
      division,
      gender,
      email,
      phone,
      teacher_id: teacherId,
    }, teacherId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete All Students (Must be declared before /students/:id)
apiRouter.delete('/students/all', (req, res) => {
  try {
    const teacherId = getAuthTeacherId(req);
    const result = StudentModel.deleteAll(teacherId);
    if (!result.success) {
      return res.status(500).json(result);
    }
    res.json(result);
  } catch (err: any) {
    console.error('API /students/all error:', err);
    res.status(500).json({ success: false, deletedCount: 0, error: err.message, message: 'Unable to delete all students. Please try again.' });
  }
});

// Bulk Delete Students (Must be declared before /students/:id)
apiRouter.post('/students/bulk-delete', (req, res) => {
  try {
    const teacherId = getAuthTeacherId(req);
    const { studentIds, ids } = req.body;
    const targetIds = Array.isArray(studentIds) ? studentIds : Array.isArray(ids) ? ids : [];

    if (targetIds.length === 0) {
      return res.status(400).json({
        success: false,
        deletedCount: 0,
        failedCount: 0,
        message: 'No student IDs provided for deletion.',
      });
    }

    const result = StudentModel.deleteBatch(targetIds, teacherId);
    if (!result.success && result.deletedCount === 0) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (err: any) {
    console.error('API /students/bulk-delete error:', err);
    res.status(500).json({
      success: false,
      deletedCount: 0,
      failedCount: Array.isArray(req.body?.studentIds) ? req.body.studentIds.length : 0,
      error: err.message,
      message: 'Unable to delete the selected record. Please try again.',
    });
  }
});

// Single Student Delete
apiRouter.delete('/students/:id', (req, res) => {
  try {
    const teacherId = getAuthTeacherId(req);
    const { id } = req.params;
    if (id === 'all') {
      const result = StudentModel.deleteAll(teacherId);
      return res.json(result);
    }
    const result = StudentModel.delete(id, teacherId);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json({ success: true, message: 'Student and associated marks deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, message: 'Unable to delete the selected record. Please try again.' });
  }
});

apiRouter.post('/students/import', (req, res) => {
  try {
    const teacherId = getAuthTeacherId(req);
    const { students, actionOnDuplicate } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, error: 'A non-empty students array is required.' });
    }

    const result = StudentModel.batchImport(students, actionOnDuplicate || 'skip', teacherId);
    const allStudents = StudentModel.getAll({ teacher_id: teacherId });

    res.json({
      success: result.success,
      ...result,
      allStudents,
    });
  } catch (err: any) {
    console.error('Batch import endpoint error:', err);
    res.status(500).json({
      success: false,
      importedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      failedCount: Array.isArray(req.body?.students) ? req.body.students.length : 0,
      error: 'Unable to save the imported students. Please try again.',
      message: 'Unable to save the imported students. Please try again.',
      technicalError: err.message,
    });
  }
});

// ==========================================
// 3. TEACHERS & AUTHENTICATION
// ==========================================
apiRouter.get('/teachers', (req, res) => {
  try {
    const teachers = TeacherModel.getAll().map((t) => {
      const { password_hash, ...rest } = t;
      return rest;
    });
    res.json({ success: true, count: teachers.length, teachers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/teachers/:id', (req, res) => {
  try {
    const { id } = req.params;
    const teacher = TeacherModel.getById(id) || TeacherModel.getByTeacherId(id);
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher not found.' });
    }
    const { password_hash, ...rest } = teacher;
    res.json({ success: true, teacher: rest });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/teachers/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = TeacherModel.update(id, req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    const { password_hash, ...rest } = result.teacher!;
    res.json({ success: true, teacher: rest });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/auth/register', (req, res) => {
  try {
    const { name, full_name, password, department, position, email, phone } = req.body;
    const teacherName = (name || full_name || '').trim();
    if (!teacherName) {
      return res.status(400).json({ success: false, message: 'Teacher name is required.' });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters.' });
    }

    const result = TeacherModel.create({
      full_name: teacherName,
      password,
      department,
      position,
      email,
      phone,
    });

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }

    const { password_hash, ...rest } = result.teacher!;
    res.status(201).json({
      success: true,
      message: 'Teacher registered successfully.',
      teacherId: result.teacher!.teacher_id,
      teacher: rest,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

apiRouter.post('/auth/login', (req, res) => {
  try {
    const { teacher_id, teacherId, password } = req.body;
    const tId = (teacher_id || teacherId || '').trim();
    if (!tId) {
      return res.status(400).json({ success: false, message: 'Please enter your Teacher ID.' });
    }

    const result = TeacherModel.authenticate(tId, password);
    if (!result.success) {
      return res.status(401).json({ success: false, message: result.error });
    }

    const { password_hash, ...rest } = result.teacher!;
    res.json({
      success: true,
      message: 'Login successful.',
      teacher: rest,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

apiRouter.post('/auth/change-password', (req, res) => {
  try {
    const { teacherId, currentPassword, newPassword } = req.body;
    if (!teacherId || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const teacher = TeacherModel.getByTeacherId(teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found.' });
    }

    const isMatch = TeacherModel.verifyPassword(currentPassword, teacher.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password does not match.' });
    }

    const newHash = TeacherModel.hashPassword(newPassword);
    TeacherModel.update(teacher.id, { password_hash: newHash });

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

apiRouter.post('/auth/reset-password', (req, res) => {
  try {
    const { teacherId, name, newPassword } = req.body;
    const teacher = TeacherModel.getByTeacherId(teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: `Teacher ID "${teacherId}" not found.` });
    }

    if (name && !teacher.full_name.toLowerCase().includes(name.trim().toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Teacher name does not match records.' });
    }

    const newHash = TeacherModel.hashPassword(newPassword);
    TeacherModel.update(teacher.id, { password_hash: newHash });

    res.json({ success: true, message: 'Password reset successfully. You can now login.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 4. SUBJECTS / COURSES
// ==========================================
apiRouter.get('/subjects', (req, res) => {
  try {
    const teacherId = getAuthTeacherId(req);
    const { department, year } = req.query;
    const subjects = SubjectModel.getAll({
      department: department as string,
      year: year as string,
      teacher_id: teacherId,
    });
    res.json({ success: true, count: subjects.length, subjects });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/subjects/:id', (req, res) => {
  try {
    const teacherId = getAuthTeacherId(req);
    const { id } = req.params;
    const subject = SubjectModel.getById(id, teacherId);
    if (!subject) {
      return res.status(404).json({ success: false, error: 'Subject not found.' });
    }
    res.json({ success: true, subject });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/subjects', (req, res) => {
  try {
    const teacherId = getAuthTeacherId(req);
    const {
      subject_name,
      subjectName,
      course_title,
      courseTitle,
      subject_code,
      subjectCode,
      course_code,
      courseCode,
      department,
      year,
      unit_1_max_marks,
      unit1MaxMarks,
      unit_2_max_marks,
      unit2MaxMarks,
    } = req.body;

    const result = SubjectModel.create({
      subject_name: subject_name || subjectName || course_title || courseTitle,
      subject_code: subject_code || subjectCode || course_code || courseCode,
      department,
      year,
      teacher_id: teacherId,
      unit_1_max_marks: unit_1_max_marks || unit1MaxMarks || 30,
      unit_2_max_marks: unit_2_max_marks || unit2MaxMarks || 30,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/subjects/:id', (req, res) => {
  try {
    const teacherId = getAuthTeacherId(req);
    const { id } = req.params;
    const {
      subject_name,
      subjectName,
      course_title,
      courseTitle,
      subject_code,
      subjectCode,
      course_code,
      courseCode,
      department,
      year,
      unit_1_max_marks,
      unit1MaxMarks,
      unit_2_max_marks,
      unit2MaxMarks,
    } = req.body;

    const result = SubjectModel.update(id, {
      subject_name: subject_name || subjectName || course_title || courseTitle,
      subject_code: subject_code || subjectCode || course_code || courseCode,
      department,
      year,
      teacher_id: teacherId,
      unit_1_max_marks: unit_1_max_marks !== undefined ? unit_1_max_marks : unit1MaxMarks,
      unit_2_max_marks: unit_2_max_marks !== undefined ? unit_2_max_marks : unit2MaxMarks,
    }, teacherId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete All Subjects / Courses (Must be declared before /subjects/:id)
apiRouter.delete('/subjects/all', (req, res) => {
  try {
    const teacherId = getAuthTeacherId(req);
    const result = SubjectModel.deleteAll(teacherId);
    if (!result.success) {
      return res.status(500).json(result);
    }
    res.json(result);
  } catch (err: any) {
    console.error('API /subjects/all error:', err);
    res.status(500).json({ success: false, deletedCount: 0, error: err.message, message: 'Unable to delete all courses. Please try again.' });
  }
});

// Bulk Delete Subjects / Courses (Must be declared before /subjects/:id)
apiRouter.post('/subjects/bulk-delete', (req, res) => {
  try {
    const teacherId = getAuthTeacherId(req);
    const { subjectIds, courseIds, ids } = req.body;
    const targetIds = Array.isArray(subjectIds) ? subjectIds : Array.isArray(courseIds) ? courseIds : Array.isArray(ids) ? ids : [];

    if (targetIds.length === 0) {
      return res.status(400).json({
        success: false,
        deletedCount: 0,
        failedCount: 0,
        message: 'No course IDs provided for deletion.',
      });
    }

    const result = SubjectModel.deleteBatch(targetIds, teacherId);
    if (!result.success && result.deletedCount === 0) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (err: any) {
    console.error('API /subjects/bulk-delete error:', err);
    res.status(500).json({
      success: false,
      deletedCount: 0,
      failedCount: Array.isArray(req.body?.subjectIds) ? req.body.subjectIds.length : 0,
      error: err.message,
      message: 'Unable to delete the selected record. Please try again.',
    });
  }
});

// Single Subject / Course Delete
apiRouter.delete('/subjects/:id', (req, res) => {
  try {
    const teacherId = getAuthTeacherId(req);
    const { id } = req.params;
    if (id === 'all') {
      const result = SubjectModel.deleteAll(teacherId);
      return res.json(result);
    }
    const result = SubjectModel.delete(id, teacherId);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json({ success: true, message: 'Course and related marks deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, message: 'Unable to delete the selected record. Please try again.' });
  }
});

// Aliases for /courses endpoints
apiRouter.get('/courses', (req, res) => {
  try {
    const teacherId = getAuthTeacherId(req);
    const { department, year } = req.query;
    const subjects = SubjectModel.getAll({
      department: department as string,
      year: year as string,
      teacher_id: teacherId,
    });
    res.json({ success: true, count: subjects.length, subjects });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.delete('/courses/all', (req, res) => {
  try {
    const teacherId = getAuthTeacherId(req);
    const result = SubjectModel.deleteAll(teacherId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/courses/bulk-delete', (req, res) => {
  try {
    const teacherId = getAuthTeacherId(req);
    const { courseIds, subjectIds, ids } = req.body;
    const targetIds = Array.isArray(courseIds) ? courseIds : Array.isArray(subjectIds) ? subjectIds : Array.isArray(ids) ? ids : [];
    const result = SubjectModel.deleteBatch(targetIds, teacherId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.delete('/courses/:id', (req, res) => {
  try {
    const teacherId = getAuthTeacherId(req);
    const { id } = req.params;
    if (id === 'all') {
      const result = SubjectModel.deleteAll(teacherId);
      return res.json(result);
    }
    const result = SubjectModel.delete(id, teacherId);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json({ success: true, message: 'Course and related marks deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 5. MARKS ENTRY & VALIDATION
// ==========================================
apiRouter.get('/marks', (req, res) => {
  try {
    const teacherId = getAuthTeacherId(req);
    const { student_id, subject_id } = req.query;
    const marks = MarksModel.getAll({
      teacher_id: teacherId,
      student_id: student_id as string,
      subject_id: subject_id as string,
    });
    res.json({ success: true, count: marks.length, marks });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/marks/student/:studentId', (req, res) => {
  try {
    const teacherId = getAuthTeacherId(req);
    const { studentId } = req.params;
    const marks = MarksModel.getForStudent(studentId, teacherId);
    res.json({ success: true, count: marks.length, marks });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/marks/subject/:subjectId', (req, res) => {
  try {
    const teacherId = getAuthTeacherId(req);
    const { subjectId } = req.params;
    const marks = MarksModel.getForSubject(subjectId, teacherId);
    res.json({ success: true, count: marks.length, marks });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/marks', (req, res) => {
  try {
    const teacherId = getAuthTeacherId(req);
    const {
      student_id,
      studentId,
      subject_id,
      subjectId,
      unit_1_marks,
      unit1Marks,
      unit_1_max_marks,
      unit1MaxMarks,
      unit_2_marks,
      unit2Marks,
      unit_2_max_marks,
      unit2MaxMarks,
    } = req.body;

    const sId = student_id || studentId;
    const subId = subject_id || subjectId;
    const u1 = unit_1_marks !== undefined ? unit_1_marks : unit1Marks;
    const u1Max = unit_1_max_marks !== undefined ? unit_1_max_marks : (unit1MaxMarks || 30);
    const u2 = unit_2_marks !== undefined ? unit_2_marks : unit2Marks;
    const u2Max = unit_2_max_marks !== undefined ? unit_2_max_marks : (unit2MaxMarks || 30);

    const result = MarksModel.saveMarks(sId, subId, u1, u1Max, u2, u2Max, teacherId);
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/marks/batch', (req, res) => {
  try {
    const teacherId = getAuthTeacherId(req);
    const { records } = req.body;
    if (!Array.isArray(records)) {
      return res.status(400).json({ success: false, error: 'Records array is required.' });
    }

    const result = MarksModel.batchSave(records, teacherId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 6. DASHBOARD, ANALYTICS & DYNAMIC RANKING
// ==========================================
apiRouter.get('/dashboard/stats', (req, res) => {
  try {
    const teacherId = getAuthTeacherId(req);
    const stats = PerformanceService.getDashboardStats(teacherId);
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/analytics/department-year', (req, res) => {
  try {
    const teacherId = getAuthTeacherId(req);
    const { department, year } = req.query;
    const analysis = PerformanceService.getDepartmentYearAnalysis(
      department as string,
      year as string,
      teacherId
    );
    res.json({ success: true, analysis });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/rankings', (req, res) => {
  try {
    const teacherId = getAuthTeacherId(req);
    const summaries = PerformanceService.getAllStudentSummaries(teacherId);
    res.json({ success: true, count: summaries.length, rankings: summaries });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 7. AUDIT LOGS
// ==========================================
apiRouter.get('/audit-logs', (req, res) => {
  try {
    const teacherId = getAuthTeacherId(req);
    let logs: any[];
    if (teacherId) {
      logs = query('SELECT * FROM audit_logs WHERE teacher_id = ? OR teacher_id = "" OR teacher_id IS NULL ORDER BY timestamp DESC LIMIT 200', [teacherId]);
    } else {
      logs = query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 200');
    }
    const parsedLogs = logs.map((l: any) => {
      try {
        return {
          ...l,
          oldMarks: typeof l.old_marks === 'string' ? JSON.parse(l.old_marks || '{}') : l.old_marks,
          newMarks: typeof l.new_marks === 'string' ? JSON.parse(l.new_marks || '{}') : l.new_marks,
          teacherId: l.teacher_id,
          teacherName: l.teacher_name,
          studentId: l.student_id,
          studentName: l.student_name,
          rollNumber: l.roll_number,
          subjectId: l.subject_id,
          subjectName: l.subject_name,
          courseTitle: l.course_title,
          courseCode: l.course_code,
          programmingName: l.programming_name,
          examType: l.exam_type,
          changedBy: l.changed_by,
        };
      } catch {
        return l;
      }
    });
    res.json({ success: true, count: parsedLogs.length, auditLogs: parsedLogs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/audit-logs', (req, res) => {
  try {
    const teacherId = getAuthTeacherId(req);
    const log = req.body;
    const id = log.id || `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const ts = log.timestamp || new Date().toISOString();

    run(
      `INSERT INTO audit_logs (id, timestamp, teacher_id, teacher_name, student_id, student_name, roll_number, subject_id, subject_name, course_title, course_code, programming_name, exam_type, unit, old_marks, new_marks, action, description, changed_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        ts,
        log.teacherId || log.teacher_id || teacherId || '',
        log.teacherName || log.teacher_name || '',
        log.studentId || log.student_id || '',
        log.studentName || log.student_name || '',
        log.rollNumber || log.roll_number || '',
        log.subjectId || log.subject_id || '',
        log.subjectName || log.subject_name || '',
        log.courseTitle || log.course_title || '',
        log.courseCode || log.course_code || '',
        log.programmingName || log.programming_name || '',
        log.examType || log.exam_type || '',
        log.unit || '',
        typeof log.oldMarks === 'object' ? JSON.stringify(log.oldMarks) : String(log.oldMarks || ''),
        typeof log.newMarks === 'object' ? JSON.stringify(log.newMarks) : String(log.newMarks || ''),
        log.action || '',
        log.description || '',
        log.changedBy || log.changed_by || '',
      ]
    );

    res.status(201).json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.delete('/audit-logs', (req, res) => {
  try {
    const teacherId = getAuthTeacherId(req);
    if (teacherId) {
      run('DELETE FROM audit_logs WHERE teacher_id = ?', [teacherId]);
    } else {
      run('DELETE FROM audit_logs');
    }
    res.json({ success: true, message: 'Audit logs cleared successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
