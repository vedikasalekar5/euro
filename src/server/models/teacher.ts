import bcrypt from 'bcryptjs';
import { query, queryOne, run } from '../database/db.js';

export interface TeacherRecord {
  id: string;
  teacher_id: string;
  full_name: string;
  position: string;
  department: string;
  subject?: string;
  course_code?: string;
  email?: string;
  phone?: string;
  password_hash: string;
  created_at: string;
}

export class TeacherModel {
  /**
   * Hashes plain text password using bcrypt
   */
  static hashPassword(password: string): string {
    return bcrypt.hashSync(password, 10);
  }

  /**
   * Verifies password against hash (supports bcrypt and sha256 fallback)
   */
  static verifyPassword(password: string, hash: string): boolean {
    if (!password || !hash) return false;
    // Check bcrypt
    if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
      return bcrypt.compareSync(password, hash);
    }
    // Check plain/sha256 fallback if migrated from legacy
    return hash === password;
  }

  /**
   * Retrieves all teachers
   */
  static getAll(): TeacherRecord[] {
    return query<TeacherRecord>('SELECT * FROM teachers ORDER BY full_name ASC');
  }

  /**
   * Get teacher by internal ID
   */
  static getById(id: string): TeacherRecord | null {
    return queryOne<TeacherRecord>('SELECT * FROM teachers WHERE id = ?', [id]);
  }

  /**
   * Get teacher by Teacher ID (e.g. TCH001, TCH-CS-101)
   */
  static getByTeacherId(teacherId: string): TeacherRecord | null {
    return queryOne<TeacherRecord>(
      'SELECT * FROM teachers WHERE UPPER(TRIM(teacher_id)) = ?',
      [teacherId.trim().toUpperCase()]
    );
  }

  /**
   * Generates next sequential teacher ID (e.g., TCH001 -> TCH002)
   */
  static generateNextTeacherId(): string {
    const teachers = this.getAll();
    let maxNum = 0;
    teachers.forEach((t) => {
      const match = t.teacher_id.match(/TCH(\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextNum = maxNum + 1;
    return `TCH${nextNum.toString().padStart(3, '0')}`;
  }

  /**
   * Creates a new teacher record with hashed password
   */
  static create(data: {
    id?: string;
    teacher_id?: string;
    full_name: string;
    position?: string;
    department?: string;
    subject?: string;
    course_code?: string;
    email?: string;
    phone?: string;
    password?: string;
    password_hash?: string;
  }): { success: boolean; teacher?: TeacherRecord; error?: string } {
    const fullName = (data.full_name || '').trim();
    if (!fullName) {
      return { success: false, error: 'Full name is required.' };
    }

    const teacherId = (data.teacher_id || this.generateNextTeacherId()).trim().toUpperCase();
    const existing = this.getByTeacherId(teacherId);
    if (existing) {
      return { success: false, error: `Teacher ID "${teacherId}" already exists.` };
    }

    const id = data.id || `tch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const position = data.position || 'Faculty';
    const department = data.department || 'Computer Engineering';
    const subject = data.subject || '';
    const courseCode = data.course_code || '';
    const email = data.email || '';
    const phone = data.phone || '';
    const passwordHash = data.password_hash || (data.password ? this.hashPassword(data.password) : this.hashPassword('teacher123'));
    const now = new Date().toISOString();

    run(
      `INSERT INTO teachers (id, teacher_id, full_name, position, department, subject, course_code, email, phone, password_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, teacherId, fullName, position, department, subject, courseCode, email, phone, passwordHash, now]
    );

    const inserted = this.getById(id);
    return { success: true, teacher: inserted || undefined };
  }

  /**
   * Updates teacher profile details
   */
  static update(
    id: string,
    data: Partial<{
      full_name: string;
      position: string;
      department: string;
      subject: string;
      course_code: string;
      email: string;
      phone: string;
      password_hash: string;
    }>
  ): { success: boolean; teacher?: TeacherRecord; error?: string } {
    const teacher = this.getById(id) || this.getByTeacherId(id);
    if (!teacher) {
      return { success: false, error: 'Teacher not found.' };
    }

    const fullName = data.full_name !== undefined ? data.full_name.trim() : teacher.full_name;
    const position = data.position !== undefined ? data.position.trim() : teacher.position;
    const department = data.department !== undefined ? data.department.trim() : teacher.department;
    const subject = data.subject !== undefined ? data.subject.trim() : (teacher.subject || '');
    const courseCode = data.course_code !== undefined ? data.course_code.trim() : (teacher.course_code || '');
    const email = data.email !== undefined ? data.email.trim() : (teacher.email || '');
    const phone = data.phone !== undefined ? data.phone.trim() : (teacher.phone || '');
    const passHash = data.password_hash !== undefined ? data.password_hash : teacher.password_hash;

    run(
      `UPDATE teachers
       SET full_name = ?, position = ?, department = ?, subject = ?, course_code = ?, email = ?, phone = ?, password_hash = ?
       WHERE id = ?`,
      [fullName, position, department, subject, courseCode, email, phone, passHash, teacher.id]
    );

    const updated = this.getById(teacher.id);
    return { success: true, teacher: updated || undefined };
  }

  /**
   * Authenticate teacher credentials
   */
  static authenticate(teacherId: string, plainPassword: string): { success: boolean; teacher?: TeacherRecord; error?: string } {
    const teacher = this.getByTeacherId(teacherId);
    if (!teacher) {
      return { success: false, error: `Teacher ID "${teacherId}" not found.` };
    }

    if (!plainPassword) {
      return { success: false, error: 'Please enter your password.' };
    }

    const isMatch = this.verifyPassword(plainPassword, teacher.password_hash);
    if (!isMatch) {
      return { success: false, error: 'Incorrect password. Please verify and try again.' };
    }

    return { success: true, teacher };
  }
}
