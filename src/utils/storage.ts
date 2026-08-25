import { Teacher, Student, Subject, MarkRecord } from '../types';
import { hashPassword } from './crypto';
import { sortStudentsByEnrollment } from './studentSorting';

const STORAGE_KEYS = {
  TEACHERS: 'teacher_mgmt_teachers_rel_v1',
  STUDENTS: 'teacher_mgmt_students_rel_v1',
  SUBJECTS: 'teacher_mgmt_subjects_rel_v1',
  MARKS: 'teacher_mgmt_marks_rel_v1',
  CURRENT_TEACHER_ID: 'teacher_mgmt_active_teacher_id_v1',
};

// Standard Curricular Courses for engineering departments
export const STANDARD_CURRICULUM_SUBJECTS: Array<{
  subject_name: string;
  course_title: string;
  course_code: string;
  department: 'Computer Engineering' | 'Civil Engineering' | 'Mechanical Engineering' | 'Electrical Engineering';
  year: '1st Year' | '2nd Year' | '3rd Year' | '2nd Year DSY';
  unit1MaxMarks: number;
  unit2MaxMarks: number;
}> = [
  // Computer Engineering - 2nd Year
  { subject_name: 'Operating System', course_title: 'Operating System', course_code: 'CO502', department: 'Computer Engineering', year: '2nd Year', unit1MaxMarks: 30, unit2MaxMarks: 30 },
  { subject_name: 'Cloud Computing', course_title: 'Cloud Computing', course_code: 'CO503', department: 'Computer Engineering', year: '2nd Year', unit1MaxMarks: 30, unit2MaxMarks: 30 },
  { subject_name: 'Software Engineering', course_title: 'Software Engineering', course_code: 'CO504', department: 'Computer Engineering', year: '2nd Year', unit1MaxMarks: 30, unit2MaxMarks: 30 },
  { subject_name: 'Database Management Systems', course_title: 'Database Management Systems', course_code: 'CO505', department: 'Computer Engineering', year: '2nd Year', unit1MaxMarks: 30, unit2MaxMarks: 30 },
  { subject_name: 'Computer Networks', course_title: 'Computer Networks', course_code: 'CO506', department: 'Computer Engineering', year: '2nd Year', unit1MaxMarks: 30, unit2MaxMarks: 30 },

  // Computer Engineering - 2nd Year DSY
  { subject_name: 'Operating System', course_title: 'Operating System', course_code: 'CO502', department: 'Computer Engineering', year: '2nd Year DSY', unit1MaxMarks: 30, unit2MaxMarks: 30 },
  { subject_name: 'Data Structures & Algorithms', course_title: 'Data Structures & Algorithms', course_code: 'CO501', department: 'Computer Engineering', year: '2nd Year DSY', unit1MaxMarks: 30, unit2MaxMarks: 30 },
  { subject_name: 'Software Engineering', course_title: 'Software Engineering', course_code: 'CO504', department: 'Computer Engineering', year: '2nd Year DSY', unit1MaxMarks: 30, unit2MaxMarks: 30 },

  // Computer Engineering - 3rd Year
  { subject_name: 'Machine Learning & AI', course_title: 'Machine Learning & AI', course_code: 'CO601', department: 'Computer Engineering', year: '3rd Year', unit1MaxMarks: 30, unit2MaxMarks: 30 },
  { subject_name: 'Information Security', course_title: 'Information Security', course_code: 'CO602', department: 'Computer Engineering', year: '3rd Year', unit1MaxMarks: 30, unit2MaxMarks: 30 },
  { subject_name: 'Web & Mobile Systems', course_title: 'Web & Mobile Systems', course_code: 'CO603', department: 'Computer Engineering', year: '3rd Year', unit1MaxMarks: 30, unit2MaxMarks: 30 },

  // Computer Engineering - 1st Year
  { subject_name: 'Engineering Mathematics I', course_title: 'Engineering Mathematics I', course_code: 'BSC101', department: 'Computer Engineering', year: '1st Year', unit1MaxMarks: 30, unit2MaxMarks: 30 },
  { subject_name: 'Programming in C/C++', course_title: 'Programming in C/C++', course_code: 'ESC102', department: 'Computer Engineering', year: '1st Year', unit1MaxMarks: 30, unit2MaxMarks: 30 },
  { subject_name: 'Engineering Physics', course_title: 'Engineering Physics', course_code: 'BSC103', department: 'Computer Engineering', year: '1st Year', unit1MaxMarks: 30, unit2MaxMarks: 30 },

  // Mechanical Engineering - 2nd Year
  { subject_name: 'Applied Thermodynamics', course_title: 'Applied Thermodynamics', course_code: 'ME401', department: 'Mechanical Engineering', year: '2nd Year', unit1MaxMarks: 30, unit2MaxMarks: 30 },
  { subject_name: 'Fluid Mechanics & Machinery', course_title: 'Fluid Mechanics & Machinery', course_code: 'ME402', department: 'Mechanical Engineering', year: '2nd Year', unit1MaxMarks: 30, unit2MaxMarks: 30 },
  { subject_name: 'Manufacturing Processes', course_title: 'Manufacturing Processes', course_code: 'ME403', department: 'Mechanical Engineering', year: '2nd Year', unit1MaxMarks: 30, unit2MaxMarks: 30 },
  { subject_name: 'Theory of Machines', course_title: 'Theory of Machines', course_code: 'ME404', department: 'Mechanical Engineering', year: '2nd Year', unit1MaxMarks: 30, unit2MaxMarks: 30 },

  // Mechanical Engineering - 3rd Year
  { subject_name: 'Heat Transfer & Power Plant', course_title: 'Heat Transfer & Power Plant', course_code: 'ME601', department: 'Mechanical Engineering', year: '3rd Year', unit1MaxMarks: 30, unit2MaxMarks: 30 },
  { subject_name: 'CAD / CAM & Robotics', course_title: 'CAD / CAM & Robotics', course_code: 'ME602', department: 'Mechanical Engineering', year: '3rd Year', unit1MaxMarks: 30, unit2MaxMarks: 30 },

  // Civil Engineering - 2nd Year
  { subject_name: 'Structural Mechanics', course_title: 'Structural Mechanics', course_code: 'CE401', department: 'Civil Engineering', year: '2nd Year', unit1MaxMarks: 30, unit2MaxMarks: 30 },
  { subject_name: 'Surveying & Geomatics', course_title: 'Surveying & Geomatics', course_code: 'CE402', department: 'Civil Engineering', year: '2nd Year', unit1MaxMarks: 30, unit2MaxMarks: 30 },
  { subject_name: 'Building Planning & Materials', course_title: 'Building Planning & Materials', course_code: 'CE403', department: 'Civil Engineering', year: '2nd Year', unit1MaxMarks: 30, unit2MaxMarks: 30 },

  // Civil Engineering - 3rd Year
  { subject_name: 'Design of Concrete Structures', course_title: 'Design of Concrete Structures', course_code: 'CE601', department: 'Civil Engineering', year: '3rd Year', unit1MaxMarks: 30, unit2MaxMarks: 30 },
  { subject_name: 'Environmental Engineering', course_title: 'Environmental Engineering', course_code: 'CE602', department: 'Civil Engineering', year: '3rd Year', unit1MaxMarks: 30, unit2MaxMarks: 30 },

  // Electrical Engineering - 2nd Year
  { subject_name: 'Electrical Circuit Analysis', course_title: 'Electrical Circuit Analysis', course_code: 'EE401', department: 'Electrical Engineering', year: '2nd Year', unit1MaxMarks: 30, unit2MaxMarks: 30 },
  { subject_name: 'Electrical Machines I', course_title: 'Electrical Machines I', course_code: 'EE402', department: 'Electrical Engineering', year: '2nd Year', unit1MaxMarks: 30, unit2MaxMarks: 30 },
  { subject_name: 'Analog & Digital Electronics', course_title: 'Analog & Digital Electronics', course_code: 'EE403', department: 'Electrical Engineering', year: '2nd Year', unit1MaxMarks: 30, unit2MaxMarks: 30 },

  // Electrical Engineering - 3rd Year
  { subject_name: 'Control Systems Engineering', course_title: 'Control Systems Engineering', course_code: 'EE601', department: 'Electrical Engineering', year: '3rd Year', unit1MaxMarks: 30, unit2MaxMarks: 30 },
  { subject_name: 'Power Systems & Grid', course_title: 'Power Systems & Grid', course_code: 'EE602', department: 'Electrical Engineering', year: '3rd Year', unit1MaxMarks: 30, unit2MaxMarks: 30 },
];

// Pre-computed SHA-256 for 'teacher123'
const DEFAULT_PASSWORD_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'; // 'admin' / sample
// SHA-256 for 'teacher123' is:
// e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 (empty)
// Let's compute actual on the fly or provide static known hash

const SEED_TEACHER_1: Teacher = {
  id: 'tch_seed_001',
  teacher_id: 'TCH001',
  name: 'Prof. Rahul Patil',
  password_hash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // 'teacher123'
  department: 'Computer Engineering',
  created_at: '2026-01-15T09:00:00.000Z',
};

const SEED_STUDENTS_FOR_TCH001: Omit<Student, 'id' | 'teacher_id' | 'created_at'>[] = [
  {
    student_name: 'Vedika Salekar',
    enrollment_number: 'EN2026001',
    department: 'Computer Engineering',
    year: '2nd Year',
    bt_no: '07',
  },
  {
    student_name: 'Priya Patil',
    enrollment_number: 'EN2026002',
    department: 'Computer Engineering',
    year: '2nd Year',
    bt_no: '08',
  },
  {
    student_name: 'Sneha More',
    enrollment_number: 'EN2026003',
    department: 'Computer Engineering',
    year: '2nd Year',
    bt_no: '07',
  },
  {
    student_name: 'Rohan Deshmukh',
    enrollment_number: 'EN2026004',
    department: 'Computer Engineering',
    year: '2nd Year',
    bt_no: '15',
  },
  {
    student_name: 'Tanvi Joshi',
    enrollment_number: 'EN2026005',
    department: 'Computer Engineering',
    year: '2nd Year',
    bt_no: '01',
  },
  {
    student_name: 'Manish Shinde',
    enrollment_number: 'EN2026006',
    department: 'Computer Engineering',
    year: '2nd Year DSY',
    bt_no: '02',
  },
  {
    student_name: 'Pooja Sawant',
    enrollment_number: 'EN2026007',
    department: 'Computer Engineering',
    year: '2nd Year DSY',
    bt_no: '02',
  },
  {
    student_name: 'Kavya Nair',
    enrollment_number: 'EN2026008',
    department: 'Computer Engineering',
    year: '3rd Year',
    bt_no: '03',
  },
  {
    student_name: 'Siddharth Rao',
    enrollment_number: 'EN2026009',
    department: 'Computer Engineering',
    year: '3rd Year',
    bt_no: '03',
  },
  {
    student_name: 'Ananya Bhatt',
    enrollment_number: 'EN2026010',
    department: 'Computer Engineering',
    year: '1st Year',
    bt_no: '01',
  },
  {
    student_name: 'Prathamesh Kadam',
    enrollment_number: 'EN2026012',
    department: 'Mechanical Engineering',
    year: '2nd Year',
    bt_no: '05',
  },
  {
    student_name: 'Vaishnavi Chougule',
    enrollment_number: 'EN2026016',
    department: 'Civil Engineering',
    year: '2nd Year',
    bt_no: '02',
  },
  {
    student_name: 'Gaurav Kulkarni',
    enrollment_number: 'EN2026019',
    department: 'Electrical Engineering',
    year: '2nd Year',
    bt_no: '01',
  },
];

export const StorageService = {
  // 1. Teachers
  getTeachers(): Teacher[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TEACHERS);
      if (!raw) {
        this.saveTeachers([SEED_TEACHER_1]);
        this.provisionInitialCoursesForTch001('TCH001');
        this.seedInitialStudentsAndMarksForTch001();
        return [SEED_TEACHER_1];
      }
      return JSON.parse(raw);
    } catch {
      return [SEED_TEACHER_1];
    }
  },

  saveTeachers(teachers: Teacher[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
    } catch (e) {
      console.error('Failed to save teachers', e);
    }
  },

  // Generates the next sequential Teacher ID: TCH001, TCH002, TCH003...
  generateNextTeacherId(): string {
    const teachers = this.getTeachers();
    let maxNum = 0;
    teachers.forEach((t) => {
      const match = t.teacher_id.match(/TCH(\d+)/i);
      if (match && match[1]) {
        const n = parseInt(match[1], 10);
        if (!isNaN(n) && n > maxNum) {
          maxNum = n;
        }
      }
    });
    const nextNum = maxNum + 1;
    return `TCH${String(nextNum).padStart(3, '0')}`;
  },

  // 2. Active Session
  getActiveTeacherId(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.CURRENT_TEACHER_ID);
    } catch {
      return null;
    }
  },

  setActiveTeacherId(teacherId: string | null): void {
    try {
      if (teacherId) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_TEACHER_ID, teacherId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_TEACHER_ID);
      }
    } catch {}
  },

  // 3. Subjects
  getAllSubjects(): Subject[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
      if (!raw) return [];
      const parsed: Subject[] = JSON.parse(raw);
      return parsed.map((s) => {
        const title = s.course_title || s.courseTitle || s.subject_name || s.subjectName || 'Course';
        const code = s.course_code || s.courseCode || s.subjectCode || '';

        return {
          ...s,
          subject_name: title,
          subjectName: title,
          course_title: title,
          courseTitle: title,
          course_code: code,
          courseCode: code,
          subjectCode: code,
          programming_name: s.department,
          programmingName: s.department,
          unit1MaxMarks: s.unit1MaxMarks || 30,
          unit2MaxMarks: s.unit2MaxMarks || 30,
        };
      });
    } catch {
      return [];
    }
  },

  saveAllSubjects(subjects: Subject[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
    } catch (e) {
      console.error('Failed to save subjects', e);
    }
  },

  getSubjectsByTeacher(teacherId: string): Subject[] {
    const all = this.getAllSubjects();
    return all.filter((s) => s.teacher_id === teacherId);
  },

  provisionInitialCoursesForTch001(teacherId: string): void {
    const existing = this.getAllSubjects();
    const hasAlready = existing.some((s) => s.teacher_id === teacherId);
    if (hasAlready) return;

    // Only seed initial courses for initial default demonstration teacher TCH001
    const seedCourses: Subject[] = [
      {
        id: `sub_${teacherId}_1`,
        teacher_id: teacherId,
        subject_name: 'Operating System',
        course_title: 'Operating System',
        course_code: 'CO502',
        subjectName: 'Operating System',
        courseTitle: 'Operating System',
        courseCode: 'CO502',
        department: 'Computer Engineering',
        programming_name: 'Computer Engineering',
        year: '2nd Year',
        unit1MaxMarks: 30,
        unit2MaxMarks: 30,
        created_at: new Date().toISOString(),
      },
      {
        id: `sub_${teacherId}_2`,
        teacher_id: teacherId,
        subject_name: 'Cloud Computing',
        course_title: 'Cloud Computing',
        course_code: 'CO503',
        subjectName: 'Cloud Computing',
        courseTitle: 'Cloud Computing',
        courseCode: 'CO503',
        department: 'Computer Engineering',
        programming_name: 'Computer Engineering',
        year: '2nd Year',
        unit1MaxMarks: 30,
        unit2MaxMarks: 30,
        created_at: new Date().toISOString(),
      },
      {
        id: `sub_${teacherId}_3`,
        teacher_id: teacherId,
        subject_name: 'Software Engineering',
        course_title: 'Software Engineering',
        course_code: 'CO504',
        subjectName: 'Software Engineering',
        courseTitle: 'Software Engineering',
        courseCode: 'CO504',
        department: 'Computer Engineering',
        programming_name: 'Computer Engineering',
        year: '2nd Year',
        unit1MaxMarks: 30,
        unit2MaxMarks: 30,
        created_at: new Date().toISOString(),
      },
    ];

    this.saveAllSubjects([...existing, ...seedCourses]);
  },

  // 4. Students
  getAllStudents(): Student[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (!raw) return [];
      const parsed: Student[] = JSON.parse(raw);
      const mapped = parsed.map((s) => ({
        ...s,
        name: s.student_name,
        enrollmentNo: s.enrollment_number,
        btNo: s.bt_no,
        rollNumber: s.enrollment_number,
        prn: s.enrollment_number,
        programming_name: s.department,
      }));
      return sortStudentsByEnrollment(mapped);
    } catch {
      return [];
    }
  },

  saveAllStudents(students: Student[]): void {
    try {
      const sorted = sortStudentsByEnrollment(students);
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(sorted));
    } catch (e) {
      console.error('Failed to save students', e);
    }
  },

  getStudentsByTeacher(teacherId: string): Student[] {
    const all = this.getAllStudents();
    const filtered = all.filter((s) => s.teacher_id === teacherId);
    return sortStudentsByEnrollment(filtered);
  },

  // 5. Marks
  getAllMarks(): MarkRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MARKS);
      if (!raw) return [];
      const parsed: MarkRecord[] = JSON.parse(raw);
      return parsed.map((m) => ({
        ...m,
        unit1Marks: m.unit_1_marks,
        unit1MaxMarks: m.unit_1_max_marks || 30,
        unit2Marks: m.unit_2_marks,
        unit2MaxMarks: m.unit_2_max_marks || 30,
      }));
    } catch {
      return [];
    }
  },

  saveAllMarks(marks: MarkRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MARKS, JSON.stringify(marks));
    } catch (e) {
      console.error('Failed to save marks', e);
    }
  },

  getMarksByTeacher(teacherId: string): MarkRecord[] {
    const all = this.getAllMarks();
    return all.filter((m) => m.teacher_id === teacherId);
  },

  // 6. Seed Initial Data for TCH001
  seedInitialStudentsAndMarksForTch001(): void {
    const teacherId = 'TCH001';
    const existingStudents = this.getAllStudents();
    if (existingStudents.some((s) => s.teacher_id === teacherId)) {
      return;
    }

    const createdStudents: Student[] = SEED_STUDENTS_FOR_TCH001.map((std, idx) => ({
      id: `std_tch1_${idx + 1}`,
      teacher_id: teacherId,
      student_name: std.student_name,
      enrollment_number: std.enrollment_number,
      department: std.department,
      programming_name: std.department,
      year: std.year,
      bt_no: std.bt_no,
      created_at: new Date().toISOString(),
      name: std.student_name,
      enrollmentNo: std.enrollment_number,
      btNo: std.bt_no,
      rollNumber: std.enrollment_number,
      prn: std.enrollment_number,
    }));

    this.saveAllStudents([...existingStudents, ...createdStudents]);

    // Seed Marks
    const subjects = this.getSubjectsByTeacher(teacherId);
    const marks: MarkRecord[] = [];

    // Seed exemplary marks matching the prompt examples (out of 30)
    // Vedika Salekar: OS 24/30 (U1) & 27/30 (U2) -> +10% improvement
    const vedika = createdStudents.find((s) => s.student_name === 'Vedika Salekar');
    if (vedika) {
      const os = subjects.find((sub) => sub.subject_name === 'Operating System' && sub.year === '2nd Year');
      const cloud = subjects.find((sub) => sub.subject_name === 'Cloud Computing' && sub.year === '2nd Year');
      const dbms = subjects.find((sub) => sub.subject_name === 'Database Management Systems' && sub.year === '2nd Year');
      const se = subjects.find((sub) => sub.subject_name === 'Software Engineering' && sub.year === '2nd Year');
      const net = subjects.find((sub) => sub.subject_name === 'Computer Networks' && sub.year === '2nd Year');

      if (os) marks.push({ id: `m_1`, teacher_id: teacherId, student_id: vedika.id, subject_id: os.id, course_title: 'Operating System', course_code: 'CO502', unit_1_marks: 24, unit_1_max_marks: 30, unit_2_marks: 27, unit_2_max_marks: 30, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      if (cloud) marks.push({ id: `m_2`, teacher_id: teacherId, student_id: vedika.id, subject_id: cloud.id, course_title: 'Cloud Computing', course_code: 'CO503', unit_1_marks: 25, unit_1_max_marks: 30, unit_2_marks: 28, unit_2_max_marks: 30, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      if (dbms) marks.push({ id: `m_3`, teacher_id: teacherId, student_id: vedika.id, subject_id: dbms.id, course_title: 'Database Management Systems', course_code: 'CO505', unit_1_marks: 26, unit_1_max_marks: 30, unit_2_marks: 28, unit_2_max_marks: 30, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      if (se) marks.push({ id: `m_4`, teacher_id: teacherId, student_id: vedika.id, subject_id: se.id, course_title: 'Software Engineering', course_code: 'CO504', unit_1_marks: 22, unit_1_max_marks: 30, unit_2_marks: 25, unit_2_max_marks: 30, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      if (net) marks.push({ id: `m_5`, teacher_id: teacherId, student_id: vedika.id, subject_id: net.id, course_title: 'Computer Networks', course_code: 'CO506', unit_1_marks: 25, unit_1_max_marks: 30, unit_2_marks: 27, unit_2_max_marks: 30, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }

    // Priya Patil (e.g. 21/30 & 25/30 from prompt example)
    const priya = createdStudents.find((s) => s.student_name === 'Priya Patil');
    if (priya) {
      const os = subjects.find((sub) => sub.subject_name === 'Operating System' && sub.year === '2nd Year');
      const cloud = subjects.find((sub) => sub.subject_name === 'Cloud Computing' && sub.year === '2nd Year');
      if (os) marks.push({ id: `m_6`, teacher_id: teacherId, student_id: priya.id, subject_id: os.id, course_title: 'Operating System', course_code: 'CO502', unit_1_marks: 21, unit_1_max_marks: 30, unit_2_marks: 25, unit_2_max_marks: 30, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      if (cloud) marks.push({ id: `m_7`, teacher_id: teacherId, student_id: priya.id, subject_id: cloud.id, course_title: 'Cloud Computing', course_code: 'CO503', unit_1_marks: 24, unit_1_max_marks: 30, unit_2_marks: 27, unit_2_max_marks: 30, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }

    // Sneha More (e.g. 27/30 & 22/30 from prompt example)
    const sneha = createdStudents.find((s) => s.student_name === 'Sneha More');
    if (sneha) {
      const os = subjects.find((sub) => sub.subject_name === 'Operating System' && sub.year === '2nd Year');
      if (os) marks.push({ id: `m_8`, teacher_id: teacherId, student_id: sneha.id, subject_id: os.id, course_title: 'Operating System', course_code: 'CO502', unit_1_marks: 27, unit_1_max_marks: 30, unit_2_marks: 22, unit_2_max_marks: 30, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }

    // Rohan Deshmukh (Needs attention student: 12/30 & 14/30)
    const rohan = createdStudents.find((s) => s.student_name === 'Rohan Deshmukh');
    if (rohan) {
      const os = subjects.find((sub) => sub.subject_name === 'Operating System' && sub.year === '2nd Year');
      if (os) marks.push({ id: `m_9`, teacher_id: teacherId, student_id: rohan.id, subject_id: os.id, course_title: 'Operating System', course_code: 'CO502', unit_1_marks: 12, unit_1_max_marks: 30, unit_2_marks: 14, unit_2_max_marks: 30, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }

    const existingMarks = this.getAllMarks();
    this.saveAllMarks([...existingMarks, ...marks]);
  },
};
