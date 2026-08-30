import { queryOne, run, saveDbToDisk } from './db.js';
import { TeacherModel } from '../models/teacher.js';
import { INITIAL_TEACHERS, INITIAL_SUBJECTS, INITIAL_STUDENTS, INITIAL_MARKS, INITIAL_AUDIT_LOGS } from '../../data/initialData.js';
import { STANDARD_CURRICULUM_SUBJECTS } from '../../utils/storage.js';

/**
 * Runs migration and initial seed data if SQLite tables are empty
 */
export async function runDatabaseMigration(): Promise<void> {
  console.log('Checking database status for euro_unit_test.db...');

  // 1. Migrate Teachers
  const teacherCountRow = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM teachers');
  const teacherCount = teacherCountRow?.count || 0;

  if (teacherCount === 0) {
    console.log('Seeding initial faculty accounts into SQLite...');
    const defaultPassword = 'teacher123';
    const defaultHash = TeacherModel.hashPassword(defaultPassword);

    for (const t of INITIAL_TEACHERS) {
      const tid = t.teacher_id || t.teacherId || 'TCH001';
      const name = t.name || 'Faculty Member';
      const dept = t.department || 'Computer Engineering';
      const pos = t.title || t.position || 'Associate Professor';
      const email = t.email || `${tid.toLowerCase()}@rsiet.edu.in`;
      const phone = t.phone || t.mobile || '+91 98220 11445';

      run(
        `INSERT OR IGNORE INTO teachers (id, teacher_id, full_name, position, department, subject, course_code, email, phone, password_hash, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [t.id, tid, name, pos, dept, '', '', email, phone, defaultHash, t.joiningDate || new Date().toISOString()]
      );
    }

    // Also ensure standard TCH001 & TCH002 exist
    run(
      `INSERT OR IGNORE INTO teachers (id, teacher_id, full_name, position, department, subject, course_code, email, phone, password_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['tch_seed_001', 'TCH001', 'Prof. Rahul Patil', 'Assistant Professor', 'Computer Engineering', 'Operating System', 'CO502', 'rahul.patil@rsiet.edu.in', '+91 98220 11111', defaultHash, new Date().toISOString()]
    );
    run(
      `INSERT OR IGNORE INTO teachers (id, teacher_id, full_name, position, department, subject, course_code, email, phone, password_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['tch_seed_002', 'TCH002', 'Prof. Sunita Deshmukh', 'Assistant Professor', 'Computer Engineering', 'Cloud Computing', 'CO503', 'sunita.deshmukh@rsiet.edu.in', '+91 98220 22222', defaultHash, new Date().toISOString()]
    );
  }

  // 2. Migrate Subjects
  const subjectCountRow = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM subjects');
  const subjectCount = subjectCountRow?.count || 0;

  if (subjectCount === 0) {
    console.log('Seeding curriculum course catalog into SQLite...');
    // Seed INITIAL_SUBJECTS
    for (const s of INITIAL_SUBJECTS) {
      const subObj = s as any;
      const code = subObj.course_code || subObj.courseCode || subObj.subject_code || subObj.subjectCode || 'CO501';
      const name = subObj.subject_name || subObj.subjectName || subObj.course_title || subObj.courseTitle || 'Course';
      const dept = s.department || 'Computer Engineering';
      const yr = s.year || '2nd Year';
      const u1Max = s.unit1MaxMarks || 30;
      const u2Max = s.unit2MaxMarks || 30;

      run(
        `INSERT OR IGNORE INTO subjects (id, subject_code, subject_name, department, year, teacher_id, unit_1_max_marks, unit_2_max_marks, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [s.id, code, name, dept, yr, s.teacher_id || null, u1Max, u2Max, new Date().toISOString()]
      );
    }

    // Seed STANDARD_CURRICULUM_SUBJECTS
    for (const s of STANDARD_CURRICULUM_SUBJECTS) {
      const id = `sub_std_${s.course_code.toLowerCase()}_${s.year.replace(/\s+/g, '').toLowerCase()}`;
      run(
        `INSERT OR IGNORE INTO subjects (id, subject_code, subject_name, department, year, teacher_id, unit_1_max_marks, unit_2_max_marks, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, s.course_code, s.subject_name, s.department, s.year, null, s.unit1MaxMarks || 30, s.unit2MaxMarks || 30, new Date().toISOString()]
      );
    }
  }

  // 3. Migrate Students
  const studentCountRow = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM students');
  const studentCount = studentCountRow?.count || 0;

  if (studentCount === 0) {
    console.log('Seeding student records into SQLite...');
    let rollCounter = 1;
    for (const st of INITIAL_STUDENTS) {
      const name = st.student_name || st.name || 'Student';
      const enrollment = (st.enrollment_number || st.enrollmentNo || `EN2026${rollCounter.toString().padStart(3, '0')}`).trim().toUpperCase();
      const roll = (st.rollNumber || st.btNo || st.bt_no || `R${rollCounter}`).trim();
      const dept = st.department || 'Computer Engineering';
      const yr = st.year || '2nd Year';
      const div = st.division || 'A';
      const gdr = 'Other';
      const email = `${enrollment.toLowerCase()}@rsiet.edu.in`;
      const phone = `+91 98000 ${rollCounter.toString().padStart(5, '0')}`;
      const now = st.createdAt || new Date().toISOString();

      run(
        `INSERT OR IGNORE INTO students (roll_number, student_name, enrollment_number, department, year, division, gender, email, phone, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [roll, name, enrollment, dept, yr, div, gdr, email, phone, now, now]
      );
      rollCounter++;
    }
  }

  // 4. Migrate Marks
  const marksCountRow = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM marks');
  const marksCount = marksCountRow?.count || 0;

  if (marksCount === 0) {
    console.log('Seeding unit test marks records into SQLite...');
    // Create enrollment to student ID map
    const allStudents = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM students');
    
    for (const m of INITIAL_MARKS) {
      // Find student in DB by enrollment or ID
      let student = null;
      if (m.studentId || m.student_id) {
        const sid = m.studentId || m.student_id;
        const matched = INITIAL_STUDENTS.find((s) => s.id === sid);
        if (matched) {
          const enr = matched.enrollment_number || matched.enrollmentNo;
          if (enr) {
            const found = queryOne<{ id: number }>('SELECT id FROM students WHERE UPPER(enrollment_number) = ?', [enr.toUpperCase()]);
            if (found) student = found;
          }
        }
      }

      if (!student) {
        // Fallback match first student
        student = queryOne<{ id: number }>('SELECT id FROM students LIMIT 1');
      }

      const subjectId = m.subjectId || m.subject_id;
      if (student && subjectId) {
        const u1Marks = m.unit_1_marks ?? m.unit1Marks ?? (m.exam_type === 'Unit Test 1' ? m.marks_obtained : 0) ?? 0;
        const u1Max = m.unit_1_max_marks ?? m.unit1MaxMarks ?? 30;
        const u2Marks = m.unit_2_marks ?? m.unit2Marks ?? (m.exam_type === 'Unit Test 2' ? m.marks_obtained : 0) ?? 0;
        const u2Max = m.unit_2_max_marks ?? m.unit2MaxMarks ?? 30;

        const id = m.id || `mrk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const now = m.updated_at || m.created_at || new Date().toISOString();

        run(
          `INSERT OR IGNORE INTO marks (id, student_id, subject_id, unit_test_1_marks, unit_test_1_max_marks, unit_test_2_marks, unit_test_2_max_marks, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, student.id, subjectId, u1Marks, u1Max, u2Marks, u2Max, now, now]
        );
      }
    }
  }

  // 5. Migrate Audit Logs
  const auditCountRow = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM audit_logs');
  const auditCount = auditCountRow?.count || 0;

  if (auditCount === 0 && INITIAL_AUDIT_LOGS.length > 0) {
    for (const log of INITIAL_AUDIT_LOGS) {
      run(
        `INSERT OR IGNORE INTO audit_logs (id, timestamp, teacher_id, teacher_name, student_id, student_name, roll_number, subject_id, subject_name, course_title, course_code, programming_name, exam_type, unit, old_marks, new_marks, action, description, changed_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          log.id,
          log.timestamp,
          log.teacherId || '',
          log.teacherName || '',
          log.studentId || '',
          log.studentName || '',
          log.rollNumber || '',
          log.subjectId || '',
          log.subjectName || '',
          log.courseTitle || '',
          log.courseCode || '',
          log.programmingName || '',
          log.examType || '',
          log.unit || '',
          JSON.stringify(log.oldMarks || {}),
          JSON.stringify(log.newMarks || {}),
          log.action || '',
          log.description || '',
          log.changedBy || '',
        ]
      );
    }
  }

  saveDbToDisk();
  console.log('Database initialization and seeding completed successfully for euro_unit_test.db');
}
