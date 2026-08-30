export type Department = 
  | 'Computer Engineering'
  | 'Civil Engineering'
  | 'Mechanical Engineering'
  | 'Electrical Engineering';

export type ProgrammingName = Department;

export const PROGRAMMING_OPTIONS: Department[] = [
  'Computer Engineering',
  'Civil Engineering',
  'Mechanical Engineering',
  'Electrical Engineering',
];

export const ACADEMIC_YEAR_OPTIONS = [
  '2024–25',
  '2025–26',
  '2026–27',
  '2027–28',
] as const;

export type AcademicYearSession = (typeof ACADEMIC_YEAR_OPTIONS)[number] | string;

export type AcademicYear = 
  | '1st Year'
  | '2nd Year'
  | '3rd Year'
  | '2nd Year DSY';

export type ExamType = 'Unit Test 1' | 'Unit Test 2';

export type Division = 'A' | 'B' | 'C' | 'D' | 'DSY' | 'All' | string;

export type PerformanceRating = 
  | 'Excellent'      // 90–100%
  | 'Very Good'      // 80–89%
  | 'Good'           // 70–79%
  | 'Average'        // 60–69%
  | 'Below Average'  // 40–59%
  | 'Poor';          // Below 40%

export type ImprovementTrend = 'Improved' | 'Declined' | 'Consistent';

// 1. Teacher Entity (teachers table)
export interface Teacher {
  id: string;
  teacher_id?: string; // Auto-generated unique ID, e.g., TCH001, TCH002
  name: string; // Full Name
  password_hash?: string; // SHA-256 hashed password
  department?: Department;
  programming_name?: Department;
  created_at?: string;

  // Rich professional profile fields
  photo_url?: string;
  photoUrl?: string;
  avatar?: string;
  avatarUrl?: string;
  position?: string; // e.g. 'HOD' | 'Professor' | 'Lecturer' | 'Assistant Professor' | 'Lab Assistant' | 'Clerk' | 'Instructor' | 'Other'
  positionOther?: string;
  subject?: string;
  course_code?: string;
  email?: string;
  mobile?: string;
  phone?: string;
  qualification?: string;
  experience?: string;
  date_of_joining?: string;
  dateOfJoining?: string;
  joiningDate?: string;
  bio?: string;
  specialization?: string;

  // Convenience aliases
  teacherId?: string;
  title?: string;
  studentId?: string;
  role?: string;
  assignedSubjects?: string[];
  assignedYears?: AcademicYear[];
  divisions?: Division[];
}

export type UserProfile = Teacher;

export interface MarksAuditLog {
  id: string;
  studentId: string;
  subjectId: string;
  teacherId?: string;
  teacherName?: string;
  studentName?: string;
  rollNumber?: string;
  subjectName?: string;
  subjectCode?: string;
  courseTitle?: string;
  courseCode?: string;
  programmingName?: string;
  examType?: ExamType;
  unit?: string;
  oldMarks?: number | { unit1?: number; unit2?: number };
  newMarks?: number | { unit1?: number; unit2?: number };
  action?: string;
  description?: string;
  changedBy?: string;
  timestamp: string;
  changes?: string;
}

// 2. Student Entity (students table)
export interface Student {
  id: string;
  teacher_id?: string; // Linked to the teacher who created/manages this student
  student_name?: string; // Student Full Name (e.g., Vedika Salekar)
  enrollment_number?: string; // Unique Enrollment No. (e.g., EN2026001)
  department: Department; // Computer Engineering, Civil Engineering, etc.
  programming_name?: Department; // Programming Name alias
  year: AcademicYear; // 1st Year, 2nd Year, 3rd Year, 2nd Year DSY
  academic_year_session?: string; // e.g., 2024–25, 2025–26
  academicYear?: string;
  created_at?: string;

  // Convenience aliases for existing components
  name?: string;
  enrollmentNo?: string;
  bt_no?: string; // optional fallback
  btNo?: string; // optional fallback
  rollNumber?: string;
  prn?: string;
  division?: string;
  createdAt?: string;
}

// 3. Subject / Course Entity (subjects table)
export interface Subject {
  id: string;
  teacher_id?: string; // Linked to the teacher
  subject_name?: string; // e.g., Operating System, DBMS
  course_title?: string; // Course Title
  course_code?: string; // e.g. CO502, CO503, CO504
  department: Department;
  programming_name?: Department;
  programmingName?: Department;
  year: AcademicYear;
  created_at?: string;

  // Convenience fields for marks defaults & aliases
  subjectName?: string;
  subjectCode?: string;
  courseTitle?: string;
  courseCode?: string;
  semester?: string | number;
  credits?: number;
  unit1MaxMarks?: number;
  unit2MaxMarks?: number;
}

// 4. Mark Record Entity (marks table)
export interface MarkRecord {
  id: string;
  teacher_id?: string;
  student_id?: string;
  subject_id?: string;
  exam_type?: ExamType;
  examType?: ExamType;
  marks_obtained?: number;
  marksObtained?: number;
  max_marks?: number;
  maxMarks?: number;
  course_title?: string;
  courseTitle?: string;
  course_code?: string;
  courseCode?: string;
  programming_name?: Department;
  programmingName?: Department;
  year?: AcademicYear;
  bt_no?: string;
  btNo?: string;

  unit_1_marks?: number;
  unit_1_max_marks?: number;
  unit_2_marks?: number;
  unit_2_max_marks?: number;
  created_at?: string;
  updated_at?: string;

  // Convenience aliases for calculations and legacy data
  studentId?: string;
  subjectId?: string;
  unit1Marks?: number;
  unit1MaxMarks?: number;
  unit2Marks?: number;
  unit2MaxMarks?: number;
  updatedAt?: string;
  remarks?: string;
}

export interface DepartmentYearStats {
  department: Department;
  year: AcademicYear;
  totalStudents: number;
  averageScore: number;
  improvedCount: number;
  declinedCount: number;
  avgUnit1Percentage?: number;
  avgUnit2Percentage?: number;
  overallAveragePercentage?: number;
}

// Computed Performance Detail for a Student's Subject
export interface SubjectPerformanceDetail {
  subject: Subject;
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
  improvementPercentage: number; // Unit 2 % - Unit 1 %
  isWeak: boolean;
  isStrong: boolean;
  remarks?: string;
}

// Computed Comprehensive Academic Summary for a Student
export interface StudentAcademicSummary {
  student: Student;
  subjectsCount: number;
  details: SubjectPerformanceDetail[];
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
  highestSubject: SubjectPerformanceDetail | null;
  lowestSubject: SubjectPerformanceDetail | null;
  weakSubjects: SubjectPerformanceDetail[];
  strongSubjects: SubjectPerformanceDetail[];
  generatedAnalysis?: string;
  rank?: number;
}

// Filter Options for student rosters
export interface FilterOptions {
  searchQuery: string;
  department: Department | 'All';
  year: AcademicYear | 'All';
  rating: PerformanceRating | 'All';
  trend: ImprovementTrend | 'All';
  sortBy: 'name' | 'enrollmentNo' | 'overallPercentage' | 'improvement';
  sortOrder: 'asc' | 'desc';
}
