import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Student,
  Subject,
  MarkRecord,
  StudentAcademicSummary,
  Department,
  AcademicYear,
} from '../types';
import { StorageService } from '../utils/storage';
import { calculateStudentSummary } from '../utils/calculations';
import { sortStudentsByEnrollment, sortSummariesByEnrollment } from '../utils/studentSorting';
import { useAuth } from './AuthContext';
import { ApiClient } from '../services/api';

interface AcademicContextType {
  // Roster Data
  students: Student[];
  subjects: Subject[];
  marks: MarkRecord[];
  allSummaries: StudentAcademicSummary[];
  teachers: any[]; // compatibility alias

  // Navigation State
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Course / Subject Actions (Teacher Personal Course Management)
  addCourse: (courseData: {
    course_title?: string;
    courseTitle?: string;
    subject_name?: string;
    subjectName?: string;
    course_code?: string;
    courseCode?: string;
    department: Department;
    programming_name?: Department;
    year: AcademicYear;
    semester?: number;
    unit1MaxMarks?: number;
    unit2MaxMarks?: number;
  }) => { success: boolean; message: string; course?: Subject };

  updateCourse: (
    id: string,
    courseData: Partial<{
      course_title?: string;
      courseTitle?: string;
      subject_name?: string;
      subjectName?: string;
      course_code?: string;
      courseCode?: string;
      department: Department;
      programming_name?: Department;
      year: AcademicYear;
      semester?: number;
      unit1MaxMarks?: number;
      unit2MaxMarks?: number;
    }>
  ) => { success: boolean; message: string };

  deleteCourse: (id: string) => Promise<{ success: boolean; message: string }> | { success: boolean; message: string };
  deleteCoursesBatch: (ids: string[]) => Promise<{
    success: boolean;
    deletedCount: number;
    failedCount: number;
    message: string;
  }>;
  deleteAllCourses: () => Promise<{
    success: boolean;
    deletedCount: number;
    message: string;
  }>;

  // Aliases for compatibility
  addSubject: (data: any) => { success: boolean; message: string; subject?: Subject };
  updateSubject: (id: string, data: any) => { success: boolean; message: string };
  deleteSubject: (id: string) => Promise<{ success: boolean; message: string }> | { success: boolean; message: string };
  deleteSubjectsBatch: (ids: string[]) => Promise<{
    success: boolean;
    deletedCount: number;
    failedCount: number;
    message: string;
  }>;
  deleteAllSubjects: () => Promise<{
    success: boolean;
    deletedCount: number;
    message: string;
  }>;

  // Student Actions
  addStudent: (studentData: {
    student_name?: string;
    name?: string;
    enrollment_number?: string;
    enrollmentNo?: string;
    rollNumber?: string;
    prn?: string;
    department: Department;
    year: AcademicYear;
    bt_no?: string;
    btNo?: string;
  }) => { success: boolean; message: string; student?: Student };

  updateStudent: (
    id: string,
    studentData: Partial<{
      student_name?: string;
      name?: string;
      enrollment_number?: string;
      enrollmentNo?: string;
      rollNumber?: string;
      prn?: string;
      department: Department;
      year: AcademicYear;
      bt_no?: string;
      btNo?: string;
    }>
  ) => { success: boolean; message: string };

  deleteStudent: (id: string) => Promise<{ success: boolean; message: string }> | { success: boolean; message: string };
  deleteStudentsBatch: (ids: string[]) => Promise<{
    success: boolean;
    deletedCount: number;
    failedCount: number;
    message: string;
  }>;
  deleteAllStudents: () => Promise<{
    success: boolean;
    deletedCount: number;
    message: string;
  }>;

  refreshData: () => Promise<void>;

  importStudentsBatch: (
    studentsToImport: Array<{
      roll_number?: string;
      student_name: string;
      enrollment_number: string;
      department?: Department;
      year?: AcademicYear;
      division?: string;
      gender?: string;
      email?: string;
      phone?: string;
      actionOnDuplicate?: 'skip' | 'update';
    }>,
    preferredAction?: 'skip' | 'update'
  ) => Promise<{
    success: boolean;
    importedCount: number;
    updatedCount: number;
    skippedCount: number;
    failedCount: number;
    message: string;
    details?: Array<{
      student_name: string;
      enrollment_number: string;
      roll_number?: string;
      status: 'imported' | 'updated' | 'skipped' | 'failed';
      message: string;
    }>;
  }>;

  // Marks Actions
  saveStudentMarks: (
    studentId: string,
    subjectId: string,
    unit1Marks: number,
    unit1MaxMarks: number,
    unit2Marks: number,
    unit2MaxMarks: number,
    remarks?: string
  ) => { success: boolean; message: string };

  saveUnitTestBatchMarks: (
    subjectId: string,
    examType: 'Unit Test 1' | 'Unit Test 2',
    records: Array<{
      studentId: string;
      marksObtained: number;
      maxMarks: number;
      remarks?: string;
    }>
  ) => { success: boolean; message: string };

  saveMarksForStudent: (
    studentId: string,
    subjectMarks: Array<{
      subjectId: string;
      unit1Marks: number;
      unit1MaxMarks: number;
      unit2Marks: number;
      unit2MaxMarks: number;
      remarks?: string;
    }>,
    teacherInfo?: any
  ) => { success: boolean; message: string };

  saveBatchMarks: (
    subjectId: string,
    records: Array<{
      studentId: string;
      unit1Marks: number;
      unit1MaxMarks: number;
      unit2Marks: number;
      unit2MaxMarks: number;
      remarks?: string;
    }>
  ) => { success: boolean; message: string };

  batchSaveMarks: (
    updates: Array<{
      studentId: string;
      subjectId: string;
      unit1Marks: number;
      unit1MaxMarks: number;
      unit2Marks: number;
      unit2MaxMarks: number;
      remarks?: string;
    }>,
    teacherInfo?: any
  ) => { success: boolean; message: string };

  getStudentSummary: (studentId: string) => StudentAcademicSummary | undefined;

  // Modals & Selection States
  selectedStudentProfile: Student | null;
  setSelectedStudentProfile: (student: Student | null) => void;

  studentFormModal: {
    isOpen: boolean;
    studentToEdit: Student | null;
  };
  setStudentFormModal: (state: { isOpen: boolean; studentToEdit: Student | null }) => void;

  courseFormModal: {
    isOpen: boolean;
    courseToEdit: Subject | null;
    defaultYear?: AcademicYear;
    defaultDept?: Department;
  };
  setCourseFormModal: (state: {
    isOpen: boolean;
    courseToEdit: Subject | null;
    defaultYear?: AcademicYear;
    defaultDept?: Department;
  }) => void;

  importStudentsModal: {
    isOpen: boolean;
  };
  setImportStudentsModal: (state: { isOpen: boolean }) => void;

  selectedStudentForMarks: Student | null;
  setSelectedStudentForMarks: (student: Student | null) => void;

  // Toast notification system
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
}

const AcademicContext = createContext<AcademicContextType | undefined>(undefined);

export const AcademicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentTeacher } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [marks, setMarks] = useState<MarkRecord[]>([]);

  // Modals
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<Student | null>(null);
  const [studentFormModal, setStudentFormModal] = useState<{ isOpen: boolean; studentToEdit: Student | null }>({
    isOpen: false,
    studentToEdit: null,
  });
  const [importStudentsModal, setImportStudentsModal] = useState<{ isOpen: boolean }>({
    isOpen: false,
  });
  const [courseFormModal, setCourseFormModal] = useState<{
    isOpen: boolean;
    courseToEdit: Subject | null;
    defaultYear?: AcademicYear;
    defaultDept?: Department;
  }>({
    isOpen: false,
    courseToEdit: null,
  });
  const [selectedStudentForMarks, setSelectedStudentForMarks] = useState<Student | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const clearToast = () => {
    setToast(null);
  };

  // Function to refresh and synchronize all data from SQLite database
  const refreshData = async () => {
    if (!currentTeacher) return;
    const teacherId = currentTeacher.teacher_id;

    try {
      const [dbStudentsRes, dbSubjectsRes, dbMarksRes] = await Promise.all([
        ApiClient.getStudents().catch(() => null),
        ApiClient.getSubjects().catch(() => null),
        ApiClient.getAllMarks().catch(() => null),
      ]);

      if (dbStudentsRes?.success && Array.isArray(dbStudentsRes.students)) {
        const formattedStudents: Student[] = dbStudentsRes.students.map((st: any) => ({
          id: String(st.id),
          teacher_id: teacherId,
          student_name: st.student_name,
          name: st.student_name,
          enrollment_number: st.enrollment_number,
          enrollmentNo: st.enrollment_number,
          roll_number: st.roll_number || st.enrollment_number,
          rollNumber: st.roll_number || st.enrollment_number,
          prn: st.enrollment_number,
          department: st.department as Department,
          programming_name: st.department as Department,
          programmingName: st.department as Department,
          year: st.year as AcademicYear,
          division: st.division || 'A',
          gender: st.gender,
          email: st.email,
          phone: st.phone,
          bt_no: st.roll_number || '',
          btNo: st.roll_number || '',
          created_at: st.created_at || new Date().toISOString(),
        }));
        setStudents(formattedStudents);
        StorageService.saveStudentsForTeacher(teacherId, formattedStudents);
      }

      if (dbSubjectsRes?.success && Array.isArray(dbSubjectsRes.subjects)) {
        const formattedSubjects: Subject[] = dbSubjectsRes.subjects.map((sub: any) => ({
          id: String(sub.id),
          teacher_id: sub.teacher_id || teacherId,
          course_title: sub.subject_name || sub.course_title,
          courseTitle: sub.subject_name || sub.course_title,
          subject_name: sub.subject_name || sub.course_title,
          subjectName: sub.subject_name || sub.course_title,
          course_code: sub.subject_code || sub.course_code,
          courseCode: sub.subject_code || sub.course_code,
          subjectCode: sub.subject_code || sub.course_code,
          department: sub.department as Department,
          programming_name: sub.department as Department,
          programmingName: sub.department as Department,
          year: sub.year as AcademicYear,
          unit1MaxMarks: sub.unit_1_max_marks || sub.unit1MaxMarks || 30,
          unit2MaxMarks: sub.unit_2_max_marks || sub.unit2MaxMarks || 30,
          created_at: sub.created_at || new Date().toISOString(),
        }));
        setSubjects(formattedSubjects);
        StorageService.saveSubjectsForTeacher(teacherId, formattedSubjects);
      }

      if (dbMarksRes?.success && Array.isArray(dbMarksRes.marks)) {
        const formattedMarks: MarkRecord[] = dbMarksRes.marks.map((m: any) => ({
          id: String(m.id),
          teacher_id: teacherId,
          student_id: String(m.student_id),
          subject_id: String(m.subject_id),
          studentId: String(m.student_id),
          subjectId: String(m.subject_id),
          unit_1_marks: m.unit_test_1_marks ?? m.unit_1_marks ?? 0,
          unit_1_max_marks: m.unit_test_1_max_marks ?? m.unit_1_max_marks ?? 30,
          unit_2_marks: m.unit_test_2_marks ?? m.unit_2_marks ?? 0,
          unit_2_max_marks: m.unit_test_2_max_marks ?? m.unit_2_max_marks ?? 30,
          unit1Marks: m.unit_test_1_marks ?? m.unit_1_marks ?? 0,
          unit1MaxMarks: m.unit_test_1_max_marks ?? m.unit_1_max_marks ?? 30,
          unit2Marks: m.unit_test_2_marks ?? m.unit_2_marks ?? 0,
          unit2MaxMarks: m.unit_test_2_max_marks ?? m.unit_2_max_marks ?? 30,
          created_at: m.created_at || new Date().toISOString(),
          updated_at: m.updated_at || new Date().toISOString(),
        }));
        setMarks(formattedMarks);
        StorageService.saveMarksForTeacher(teacherId, formattedMarks);
      }
    } catch (syncErr) {
      console.warn('Database refresh error:', syncErr);
    }
  };

  // Synchronize data when active teacher changes (Fetch from SQLite DB with local fallback)
  useEffect(() => {
    if (currentTeacher) {
      const teacherId = currentTeacher.teacher_id;
      const loadedStudents = StorageService.getStudentsByTeacher(teacherId);
      const loadedSubjects = StorageService.getSubjectsByTeacher(teacherId);
      const loadedMarks = StorageService.getMarksByTeacher(teacherId);

      setStudents(loadedStudents);
      setSubjects(loadedSubjects);
      setMarks(loadedMarks);

      refreshData();
    } else {
      setStudents([]);
      setSubjects([]);
      setMarks([]);
    }
  }, [currentTeacher]);

  // Compute live Academic Summaries for all students (sorted by Enrollment Number)
  const allSummaries = useMemo(() => {
    if (!students.length) return [];
    const calculated = students.map((student) => calculateStudentSummary(student, subjects, marks));
    return sortSummariesByEnrollment(calculated);
  }, [students, subjects, marks]);

  // Add Course (Teacher Personal Course Creation)
  const addCourse = (courseData: {
    course_title?: string;
    courseTitle?: string;
    subject_name?: string;
    subjectName?: string;
    course_code?: string;
    courseCode?: string;
    department: Department;
    programming_name?: Department;
    year: AcademicYear;
    semester?: number;
    unit1MaxMarks?: number;
    unit2MaxMarks?: number;
  }) => {
    if (!currentTeacher) return { success: false, message: 'Please log in as a teacher.' };

    const cleanTitle = (
      courseData.course_title ||
      courseData.courseTitle ||
      courseData.subject_name ||
      courseData.subjectName ||
      ''
    ).trim();

    const cleanCode = (
      courseData.course_code ||
      courseData.courseCode ||
      ''
    ).trim().toUpperCase();

    const dept = courseData.department || courseData.programming_name || currentTeacher.department || 'Computer Engineering';
    const year = courseData.year || '2nd Year';

    if (!cleanTitle) {
      return { success: false, message: 'Course Title is required (e.g. Operating System).' };
    }
    if (!cleanCode) {
      return { success: false, message: 'Course Code is required (e.g. CO502).' };
    }

    const allSubjects = StorageService.getAllSubjects();
    const existingSameCode = allSubjects.find(
      (s) =>
        s.teacher_id === currentTeacher.teacher_id &&
        s.year === year &&
        s.department === dept &&
        (s.course_code || s.courseCode || s.subjectCode || '').toUpperCase() === cleanCode
    );

    if (existingSameCode) {
      return {
        success: false,
        message: `Course with code ${cleanCode} already exists for ${dept} (${year}).`,
      };
    }

    const newCourse: Subject = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      teacher_id: currentTeacher.teacher_id,
      course_title: cleanTitle,
      courseTitle: cleanTitle,
      subject_name: cleanTitle,
      subjectName: cleanTitle,
      course_code: cleanCode,
      courseCode: cleanCode,
      subjectCode: cleanCode,
      department: dept,
      programming_name: dept,
      programmingName: dept,
      year: year,
      unit1MaxMarks: courseData.unit1MaxMarks || 30,
      unit2MaxMarks: courseData.unit2MaxMarks || 30,
      semester: courseData.semester || (year === '1st Year' ? 1 : year === '2nd Year' || year === '2nd Year DSY' ? 3 : 5),
      created_at: new Date().toISOString(),
    };

    const updatedList = [...allSubjects, newCourse];
    StorageService.saveAllSubjects(updatedList);
    setSubjects((prev) => [...prev, newCourse]);

    // Persist asynchronously in SQLite database
    ApiClient.createSubject({
      id: newCourse.id,
      subject_name: cleanTitle,
      subject_code: cleanCode,
      department: dept,
      year: year,
      teacher_id: currentTeacher.teacher_id,
      unit_1_max_marks: courseData.unit1MaxMarks || 30,
      unit_2_max_marks: courseData.unit2MaxMarks || 30,
    }).catch((err) => console.warn('SQLite course creation sync error:', err));

    return { success: true, message: 'Course added successfully.', course: newCourse };
  };

  // Update Course
  const updateCourse = (
    id: string,
    courseData: Partial<{
      course_title?: string;
      courseTitle?: string;
      subject_name?: string;
      subjectName?: string;
      course_code?: string;
      courseCode?: string;
      department: Department;
      programming_name?: Department;
      year: AcademicYear;
      semester?: number;
      unit1MaxMarks?: number;
      unit2MaxMarks?: number;
    }>
  ) => {
    if (!currentTeacher) return { success: false, message: 'Not logged in.' };

    const allSubjects = StorageService.getAllSubjects();
    const target = allSubjects.find((s) => s.id === id);
    if (!target) return { success: false, message: 'Course not found.' };

    const cleanTitle = courseData.course_title !== undefined || courseData.courseTitle !== undefined || courseData.subject_name !== undefined || courseData.subjectName !== undefined
      ? (courseData.course_title || courseData.courseTitle || courseData.subject_name || courseData.subjectName || '').trim()
      : (target.course_title || target.courseTitle || target.subject_name || target.subjectName || '');

    const cleanCode = courseData.course_code !== undefined || courseData.courseCode !== undefined
      ? (courseData.course_code || courseData.courseCode || '').trim().toUpperCase()
      : (target.course_code || target.courseCode || target.subjectCode || '');

    const dept = courseData.department || courseData.programming_name || target.department;
    const year = courseData.year || target.year;

    if (!cleanTitle) {
      return { success: false, message: 'Course Title cannot be empty.' };
    }
    if (!cleanCode) {
      return { success: false, message: 'Course Code cannot be empty.' };
    }

    // Check duplicate code
    const duplicate = allSubjects.find(
      (s) =>
        s.id !== id &&
        s.teacher_id === currentTeacher.teacher_id &&
        s.year === year &&
        s.department === dept &&
        (s.course_code || s.courseCode || s.subjectCode || '').toUpperCase() === cleanCode
    );

    if (duplicate) {
      return { success: false, message: `Course Code ${cleanCode} is already assigned to another course in ${year}.` };
    }

    const updatedSubject: Subject = {
      ...target,
      course_title: cleanTitle,
      courseTitle: cleanTitle,
      subject_name: cleanTitle,
      subjectName: cleanTitle,
      course_code: cleanCode,
      courseCode: cleanCode,
      subjectCode: cleanCode,
      department: dept,
      programming_name: dept,
      programmingName: dept,
      year: year,
      unit1MaxMarks: courseData.unit1MaxMarks ?? target.unit1MaxMarks ?? 30,
      unit2MaxMarks: courseData.unit2MaxMarks ?? target.unit2MaxMarks ?? 30,
      semester: courseData.semester ?? target.semester,
    };

    const updatedList = allSubjects.map((s) => (s.id === id ? updatedSubject : s));
    StorageService.saveAllSubjects(updatedList);
    setSubjects((prev) => prev.map((s) => (s.id === id ? updatedSubject : s)));

    // Persist asynchronously in SQLite database
    ApiClient.updateSubject(id, {
      subject_name: cleanTitle,
      subject_code: cleanCode,
      department: dept,
      year: year,
      unit_1_max_marks: courseData.unit1MaxMarks ?? target.unit1MaxMarks ?? 30,
      unit_2_max_marks: courseData.unit2MaxMarks ?? target.unit2MaxMarks ?? 30,
    }).catch((err) => console.warn('SQLite course update sync error:', err));

    // Synchronize course title and code on existing marks
    const allMarks = StorageService.getAllMarks();
    let marksUpdated = false;
    const updatedMarks = allMarks.map((m) => {
      if (m.subject_id === id || (m as any).subjectId === id) {
        marksUpdated = true;
        return {
          ...m,
          course_title: cleanTitle,
          courseTitle: cleanTitle,
          course_code: cleanCode,
          courseCode: cleanCode,
          programming_name: dept,
          programmingName: dept,
        };
      }
      return m;
    });

    if (marksUpdated) {
      StorageService.saveAllMarks(updatedMarks);
      setMarks(StorageService.getMarksByTeacher(currentTeacher.teacher_id));
    }

    return { success: true, message: 'Course updated successfully.' };
  };

  // Delete Course
  const deleteCourse = async (id: string) => {
    if (!currentTeacher) return { success: false, message: 'Not logged in.' };

    const allSubjects = StorageService.getAllSubjects();
    const target = allSubjects.find((s) => s.id === id);
    if (!target) return { success: false, message: 'Course not found.' };

    // Delete course
    const updatedSubjects = allSubjects.filter((s) => s.id !== id);
    StorageService.saveAllSubjects(updatedSubjects);

    // Safely remove associated marks for this course without touching unrelated marks/students
    const allMarks = StorageService.getAllMarks();
    const updatedMarks = allMarks.filter(
      (m) => !(m.teacher_id === currentTeacher.teacher_id && (m.subject_id === id || (m as any).subjectId === id))
    );
    StorageService.saveAllMarks(updatedMarks);

    setSubjects((prev) => prev.filter((s) => s.id !== id));
    setMarks((prev) => prev.filter((m) => !(m.teacher_id === currentTeacher.teacher_id && (m.subject_id === id || (m as any).subjectId === id))));

    // Delete from SQLite database
    try {
      await ApiClient.deleteSubject(id);
    } catch (err: any) {
      console.warn('SQLite course delete sync error:', err);
    }

    showToast('Course deleted successfully.', 'success');
    return { success: true, message: 'Course deleted successfully.' };
  };

  // Bulk Delete Courses / Subjects
  const deleteCoursesBatch = async (ids: string[]) => {
    if (!currentTeacher) return { success: false, deletedCount: 0, failedCount: 0, message: 'Not logged in.' };
    if (!ids || ids.length === 0) return { success: true, deletedCount: 0, failedCount: 0, message: 'No courses selected.' };

    const targetSet = new Set(ids);
    const allSubjects = StorageService.getAllSubjects();
    const remainingSubjects = allSubjects.filter((s) => !targetSet.has(s.id));
    StorageService.saveAllSubjects(remainingSubjects);

    // Remove associated marks
    const allMarks = StorageService.getAllMarks();
    const remainingMarks = allMarks.filter(
      (m) => !(m.teacher_id === currentTeacher.teacher_id && (targetSet.has(m.subject_id) || targetSet.has((m as any).subjectId)))
    );
    StorageService.saveAllMarks(remainingMarks);

    setSubjects((prev) => prev.filter((s) => !targetSet.has(s.id)));
    setMarks((prev) => prev.filter((m) => !(m.teacher_id === currentTeacher.teacher_id && (targetSet.has(m.subject_id) || targetSet.has((m as any).subjectId)))));

    // Synchronize with backend database
    try {
      const res = await ApiClient.bulkDeleteSubjects(ids);
      const count = res.deletedCount || ids.length;
      showToast(`${count} course${count !== 1 ? 's' : ''} deleted successfully.`, 'success');
      return { success: true, deletedCount: count, failedCount: res.failedCount || 0, message: `${count} courses deleted.` };
    } catch (err: any) {
      console.warn('SQLite bulk course delete sync error:', err);
      showToast(`${ids.length} course${ids.length !== 1 ? 's' : ''} deleted successfully.`, 'success');
      return { success: true, deletedCount: ids.length, failedCount: 0, message: 'Courses deleted.' };
    }
  };

  // Delete All Courses
  const deleteAllCourses = async () => {
    if (!currentTeacher) return { success: false, deletedCount: 0, message: 'Not logged in.' };

    const teacherId = currentTeacher.teacher_id;
    const previousSubjects = StorageService.getSubjectsByTeacher(teacherId);
    const count = previousSubjects.length;

    StorageService.saveSubjectsForTeacher(teacherId, []);
    StorageService.saveMarksForTeacher(teacherId, []);

    setSubjects([]);
    setMarks([]);

    try {
      await ApiClient.deleteAllSubjects();
    } catch (err: any) {
      console.warn('SQLite deleteAllSubjects sync error:', err);
    }

    showToast('All courses deleted successfully.', 'success');
    return { success: true, deletedCount: count, message: 'All courses deleted successfully.' };
  };

  // Aliases for subject CRUD
  const addSubject = (data: any) => addCourse(data);
  const updateSubject = (id: string, data: any) => updateCourse(id, data);
  const deleteSubject = (id: string) => deleteCourse(id);
  const deleteSubjectsBatch = (ids: string[]) => deleteCoursesBatch(ids);
  const deleteAllSubjects = () => deleteAllCourses();

  // Add Student
  const addStudent = (studentData: {
    student_name?: string;
    name?: string;
    enrollment_number?: string;
    enrollmentNo?: string;
    rollNumber?: string;
    prn?: string;
    department: Department;
    year: AcademicYear;
    bt_no?: string;
    btNo?: string;
  }) => {
    if (!currentTeacher) return { success: false, message: 'Please log in as a teacher.' };

    const cleanName = (studentData.student_name || studentData.name || '').trim();
    const cleanEnrollment = (
      studentData.enrollment_number ||
      studentData.enrollmentNo ||
      studentData.rollNumber ||
      studentData.prn ||
      ''
    )
      .trim()
      .toUpperCase();
    const cleanBt = (studentData.bt_no || studentData.btNo || '').trim();

    if (!cleanName) return { success: false, message: 'Student Name is required.' };
    if (!cleanEnrollment) return { success: false, message: 'Enrollment Number is required.' };

    // Check unique enrollment across teacher's roster
    const allStudents = StorageService.getAllStudents();
    const exists = allStudents.some(
      (s) =>
        s.teacher_id === currentTeacher.teacher_id &&
        (s.enrollment_number || s.enrollmentNo || s.rollNumber || '').toUpperCase() === cleanEnrollment
    );

    if (exists) {
      return { success: false, message: `Enrollment Number ${cleanEnrollment} already exists in your roster.` };
    }

    const newStudent: Student = {
      id: `std_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      teacher_id: currentTeacher.teacher_id,
      student_name: cleanName,
      enrollment_number: cleanEnrollment,
      department: studentData.department,
      year: studentData.year,
      bt_no: cleanBt,
      created_at: new Date().toISOString(),
      name: cleanName,
      enrollmentNo: cleanEnrollment,
      btNo: cleanBt,
      rollNumber: cleanEnrollment,
      prn: cleanEnrollment,
    };

    const updated = [newStudent, ...allStudents];
    StorageService.saveAllStudents(updated);
    setStudents(StorageService.getStudentsByTeacher(currentTeacher.teacher_id));

    // Persist in SQLite database
    ApiClient.createStudent({
      student_name: cleanName,
      enrollment_number: cleanEnrollment,
      roll_number: cleanBt || cleanEnrollment,
      department: studentData.department,
      year: studentData.year,
      division: 'A',
    }).catch((err) => console.warn('SQLite student creation sync error:', err));

    return { success: true, message: 'Student added successfully.', student: newStudent };
  };

  // Update Student
  const updateStudent = (
    id: string,
    studentData: Partial<{
      student_name?: string;
      name?: string;
      enrollment_number?: string;
      enrollmentNo?: string;
      rollNumber?: string;
      prn?: string;
      department: Department;
      year: AcademicYear;
      bt_no?: string;
      btNo?: string;
    }>
  ) => {
    if (!currentTeacher) return { success: false, message: 'Not logged in.' };

    const allStudents = StorageService.getAllStudents();
    const target = allStudents.find((s) => s.id === id);
    if (!target) return { success: false, message: 'Student not found.' };

    const newEnrollment = (
      studentData.enrollment_number ||
      studentData.enrollmentNo ||
      studentData.rollNumber ||
      studentData.prn ||
      ''
    ).trim().toUpperCase();

    if (newEnrollment) {
      const duplicate = allStudents.find(
        (s) =>
          s.id !== id &&
          s.teacher_id === currentTeacher.teacher_id &&
          (s.enrollment_number || s.enrollmentNo || s.rollNumber || '').toUpperCase() === newEnrollment
      );
      if (duplicate) {
        return { success: false, message: `Enrollment Number ${newEnrollment} is already assigned to another student.` };
      }
    }

    const cleanName = (studentData.student_name || studentData.name || target.student_name || target.name || '').trim();
    const finalEnrollment = newEnrollment || target.enrollment_number || target.enrollmentNo || target.rollNumber || '';
    const cleanBt = studentData.bt_no !== undefined || studentData.btNo !== undefined
      ? (studentData.bt_no || studentData.btNo || '').trim()
      : (target.bt_no || target.btNo || '');

    const updatedStudent: Student = {
      ...target,
      ...studentData,
      student_name: cleanName,
      name: cleanName,
      enrollment_number: finalEnrollment,
      enrollmentNo: finalEnrollment,
      rollNumber: finalEnrollment,
      prn: finalEnrollment,
      bt_no: cleanBt,
      btNo: cleanBt,
    };

    const updatedList = allStudents.map((s) => (s.id === id ? updatedStudent : s));
    StorageService.saveAllStudents(updatedList);
    setStudents(StorageService.getStudentsByTeacher(currentTeacher.teacher_id));

    if (selectedStudentProfile?.id === id) {
      setSelectedStudentProfile(updatedStudent);
    }

    // Persist in SQLite database
    ApiClient.updateStudent(id, {
      student_name: cleanName,
      enrollment_number: finalEnrollment,
      roll_number: cleanBt || finalEnrollment,
      department: updatedStudent.department,
      year: updatedStudent.year,
    }).catch((err) => console.warn('SQLite student update sync error:', err));

    return { success: true, message: 'Student updated successfully.' };
  };

  // Delete Student
  const deleteStudent = async (id: string) => {
    if (!currentTeacher) return { success: false, message: 'Not logged in.' };

    const allStudents = StorageService.getAllStudents();
    const studentToDelete = allStudents.find((s) => s.id === id);
    if (!studentToDelete) {
      return { success: false, message: 'Student not found.' };
    }

    const updatedStudents = allStudents.filter((s) => s.id !== id);
    StorageService.saveAllStudents(updatedStudents);

    // Delete associated marks
    const allMarks = StorageService.getAllMarks();
    const updatedMarks = allMarks.filter((m) => m.student_id !== id && (m as any).studentId !== id);
    StorageService.saveAllMarks(updatedMarks);

    setStudents((prev) => prev.filter((s) => s.id !== id));
    setMarks((prev) => prev.filter((m) => m.student_id !== id && (m as any).studentId !== id));

    if (selectedStudentProfile?.id === id) {
      setSelectedStudentProfile(null);
    }

    // Persist in SQLite database
    try {
      await ApiClient.deleteStudent(id);
    } catch (err) {
      console.warn('SQLite student delete sync error:', err);
    }

    showToast('Student deleted successfully.', 'success');
    return { success: true, message: 'Student deleted successfully.' };
  };

  // Bulk Delete Students
  const deleteStudentsBatch = async (ids: string[]) => {
    if (!currentTeacher) return { success: false, deletedCount: 0, failedCount: 0, message: 'Not logged in.' };
    if (!ids || ids.length === 0) return { success: true, deletedCount: 0, failedCount: 0, message: 'No students selected for deletion.' };

    const targetSet = new Set(ids);
    const allStudents = StorageService.getAllStudents();
    const remainingStudents = allStudents.filter((s) => !targetSet.has(s.id));
    StorageService.saveAllStudents(remainingStudents);

    // Delete associated marks
    const allMarks = StorageService.getAllMarks();
    const remainingMarks = allMarks.filter((m) => !targetSet.has(m.student_id) && !targetSet.has((m as any).studentId));
    StorageService.saveAllMarks(remainingMarks);

    setStudents((prev) => prev.filter((s) => !targetSet.has(s.id)));
    setMarks((prev) => prev.filter((m) => !targetSet.has(m.student_id) && !targetSet.has((m as any).studentId)));

    if (selectedStudentProfile && targetSet.has(selectedStudentProfile.id)) {
      setSelectedStudentProfile(null);
    }

    try {
      const res = await ApiClient.bulkDeleteStudents(ids);
      const count = res.deletedCount || ids.length;
      showToast(`${count} student${count !== 1 ? 's' : ''} deleted successfully.`, 'success');
      return {
        success: true,
        deletedCount: count,
        failedCount: res.failedCount || 0,
        message: `${count} students deleted successfully.`,
      };
    } catch (err: any) {
      console.warn('SQLite bulk student delete sync error:', err);
      showToast(`${ids.length} student${ids.length !== 1 ? 's' : ''} deleted successfully.`, 'success');
      return {
        success: true,
        deletedCount: ids.length,
        failedCount: 0,
        message: `${ids.length} students deleted.`,
      };
    }
  };

  // Delete All Students
  const deleteAllStudents = async () => {
    if (!currentTeacher) return { success: false, deletedCount: 0, message: 'Not logged in.' };

    const teacherId = currentTeacher.teacher_id;
    const previousStudents = StorageService.getStudentsByTeacher(teacherId);
    const count = previousStudents.length;

    StorageService.saveStudentsForTeacher(teacherId, []);
    StorageService.saveMarksForTeacher(teacherId, []);

    setStudents([]);
    setMarks([]);
    setSelectedStudentProfile(null);

    try {
      await ApiClient.deleteAllStudents();
    } catch (err: any) {
      console.warn('SQLite deleteAllStudents sync error:', err);
    }

    showToast('All students deleted successfully.', 'success');
    return { success: true, deletedCount: count, message: 'All students deleted successfully.' };
  };

  // Batch Import Students from OCR / Document
  const importStudentsBatch = async (
    studentsToImport: Array<{
      roll_number?: string;
      student_name: string;
      enrollment_number: string;
      department?: Department;
      year?: AcademicYear;
      division?: string;
      gender?: string;
      email?: string;
      phone?: string;
      actionOnDuplicate?: 'skip' | 'update';
    }>,
    preferredAction: 'skip' | 'update' = 'skip'
  ) => {
    if (!studentsToImport || studentsToImport.length === 0) {
      return {
        success: false,
        importedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        failedCount: 0,
        message: 'No student records selected for import.',
      };
    }

    try {
      const defaultDept = currentTeacher?.department || 'Computer Engineering';
      const payload = studentsToImport.map((st) => ({
        student_name: (st.student_name || '').trim(),
        enrollment_number: (st.enrollment_number || '').trim().toUpperCase(),
        roll_number: (st.roll_number || '').trim(),
        department: st.department || defaultDept,
        year: st.year || '2nd Year',
        division: st.division || 'A',
        gender: st.gender || 'Other',
        email: (st.email || '').trim(),
        phone: (st.phone || '').trim(),
        actionOnDuplicate: st.actionOnDuplicate || preferredAction,
      }));

      // Send batch import request to SQLite backend
      const response = await ApiClient.batchImportStudents(payload, preferredAction);

      if (!response.success && response.importedCount === 0 && response.updatedCount === 0 && response.skippedCount === 0) {
        return {
          success: false,
          importedCount: 0,
          updatedCount: 0,
          skippedCount: 0,
          failedCount: response.failedCount || studentsToImport.length,
          message: response.error || response.message || 'Database rejected the student import.',
          details: response.details,
        };
      }

      // Re-sync all state with the updated SQLite database
      await refreshData();

      return {
        success: true,
        importedCount: response.importedCount || 0,
        updatedCount: response.updatedCount || 0,
        skippedCount: response.skippedCount || 0,
        failedCount: response.failedCount || 0,
        message: response.message || `${response.importedCount} student(s) imported successfully.`,
        details: response.details,
      };
    } catch (err: any) {
      console.error('Batch import execution error:', err);
      return {
        success: false,
        importedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        failedCount: studentsToImport.length,
        message: err.message || 'Failed to connect to database for student import.',
      };
    }
  };

  // Save Student Marks
  const saveStudentMarks = (
    studentId: string,
    subjectId: string,
    unit1Marks: number,
    unit1MaxMarks: number,
    unit2Marks: number,
    unit2MaxMarks: number,
    remarks?: string
  ) => {
    if (!currentTeacher) return { success: false, message: 'Not logged in.' };

    // Validation
    if (unit1MaxMarks <= 0 || unit2MaxMarks <= 0) {
      return { success: false, message: 'Maximum marks must be greater than 0.' };
    }
    if (unit1Marks < 0 || unit2Marks < 0) {
      return { success: false, message: 'Marks obtained cannot be negative.' };
    }
    if (unit1Marks > unit1MaxMarks) {
      return {
        success: false,
        message: `⚠️ Unit 1 marks obtained (${unit1Marks}) cannot be greater than maximum marks (${unit1MaxMarks}).`,
      };
    }
    if (unit2Marks > unit2MaxMarks) {
      return {
        success: false,
        message: `⚠️ Unit 2 marks obtained (${unit2Marks}) cannot be greater than maximum marks (${unit2MaxMarks}).`,
      };
    }

    const allMarks = StorageService.getAllMarks();
    const existingIndex = allMarks.findIndex(
      (m) =>
        m.teacher_id === currentTeacher.teacher_id &&
        (m.student_id === studentId || (m as any).studentId === studentId) &&
        (m.subject_id === subjectId || (m as any).subjectId === subjectId)
    );

    const now = new Date().toISOString();
    let updatedList: MarkRecord[];

    if (existingIndex >= 0) {
      const existing = allMarks[existingIndex];
      const updatedRecord: MarkRecord = {
        ...existing,
        unit_1_marks: unit1Marks,
        unit_1_max_marks: unit1MaxMarks,
        unit_2_marks: unit2Marks,
        unit_2_max_marks: unit2MaxMarks,
        unit1Marks: unit1Marks,
        unit1MaxMarks: unit1MaxMarks,
        unit2Marks: unit2Marks,
        unit2MaxMarks: unit2MaxMarks,
        updated_at: now,
      };
      updatedList = [...allMarks];
      updatedList[existingIndex] = updatedRecord;
    } else {
      const newRecord: MarkRecord = {
        id: `m_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        teacher_id: currentTeacher.teacher_id,
        student_id: studentId,
        subject_id: subjectId,
        unit_1_marks: unit1Marks,
        unit_1_max_marks: unit1MaxMarks,
        unit_2_marks: unit2Marks,
        unit_2_max_marks: unit2MaxMarks,
        unit1Marks: unit1Marks,
        unit1MaxMarks: unit1MaxMarks,
        unit2Marks: unit2Marks,
        unit2MaxMarks: unit2MaxMarks,
        created_at: now,
        updated_at: now,
      };
      updatedList = [newRecord, ...allMarks];
    }

    StorageService.saveAllMarks(updatedList);
    setMarks(StorageService.getMarksByTeacher(currentTeacher.teacher_id));

    // Persist asynchronously in SQLite database
    ApiClient.saveMarks({
      student_id: studentId,
      subject_id: subjectId,
      unit_test_1_marks: unit1Marks,
      unit_test_1_max_marks: unit1MaxMarks,
      unit_test_2_marks: unit2Marks,
      unit_test_2_max_marks: unit2MaxMarks,
    }).catch((err) => console.warn('SQLite saveMarks sync error:', err));

    return { success: true, message: 'Marks updated successfully.' };
  };

  // Save multiple marks for a single student
  const saveMarksForStudent = (
    studentId: string,
    subjectMarks: Array<{
      subjectId: string;
      unit1Marks: number;
      unit1MaxMarks: number;
      unit2Marks: number;
      unit2MaxMarks: number;
      remarks?: string;
    }>,
    teacherInfo?: any
  ) => {
    if (!currentTeacher) return { success: false, message: 'Not logged in.' };

    for (const sm of subjectMarks) {
      const res = saveStudentMarks(
        studentId,
        sm.subjectId,
        sm.unit1Marks,
        sm.unit1MaxMarks,
        sm.unit2Marks,
        sm.unit2MaxMarks,
        sm.remarks
      );
      if (!res.success) return res;
    }
    return { success: true, message: 'Marks saved successfully.' };
  };

  // Save Batch Marks
  const saveBatchMarks = (
    subjectId: string,
    records: Array<{
      studentId: string;
      unit1Marks: number;
      unit1MaxMarks: number;
      unit2Marks: number;
      unit2MaxMarks: number;
      remarks?: string;
    }>
  ) => {
    if (!currentTeacher) return { success: false, message: 'Not logged in.' };

    for (const rec of records) {
      if (rec.unit1MaxMarks <= 0 || rec.unit2MaxMarks <= 0) {
        return { success: false, message: 'Maximum marks must be greater than 0.' };
      }
      if (rec.unit1Marks < 0 || rec.unit2Marks < 0) {
        return { success: false, message: 'Marks cannot be negative.' };
      }
      if (rec.unit1Marks > rec.unit1MaxMarks) {
        return {
          success: false,
          message: `⚠️ Marks obtained (${rec.unit1Marks}) cannot be greater than maximum marks (${rec.unit1MaxMarks}).`,
        };
      }
      if (rec.unit2Marks > rec.unit2MaxMarks) {
        return {
          success: false,
          message: `⚠️ Marks obtained (${rec.unit2Marks}) cannot be greater than maximum marks (${rec.unit2MaxMarks}).`,
        };
      }
    }

    const allMarks = [...StorageService.getAllMarks()];
    const now = new Date().toISOString();

    records.forEach((rec) => {
      const idx = allMarks.findIndex(
        (m) =>
          m.teacher_id === currentTeacher.teacher_id &&
          (m.student_id === rec.studentId || (m as any).studentId === rec.studentId) &&
          (m.subject_id === subjectId || (m as any).subjectId === subjectId)
      );

      if (idx >= 0) {
        allMarks[idx] = {
          ...allMarks[idx],
          unit_1_marks: rec.unit1Marks,
          unit_1_max_marks: rec.unit1MaxMarks,
          unit_2_marks: rec.unit2Marks,
          unit_2_max_marks: rec.unit2MaxMarks,
          unit1Marks: rec.unit1Marks,
          unit1MaxMarks: rec.unit1MaxMarks,
          unit2Marks: rec.unit2Marks,
          unit2MaxMarks: rec.unit2MaxMarks,
          updated_at: now,
        };
      } else {
        allMarks.push({
          id: `m_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          teacher_id: currentTeacher.teacher_id,
          student_id: rec.studentId,
          subject_id: subjectId,
          unit_1_marks: rec.unit1Marks,
          unit_1_max_marks: rec.unit1MaxMarks,
          unit_2_marks: rec.unit2Marks,
          unit_2_max_marks: rec.unit2MaxMarks,
          unit1Marks: rec.unit1Marks,
          unit1MaxMarks: rec.unit1MaxMarks,
          unit2Marks: rec.unit2Marks,
          unit2MaxMarks: rec.unit2MaxMarks,
          created_at: now,
          updated_at: now,
        });
      }
    });

    StorageService.saveAllMarks(allMarks);
    setMarks(StorageService.getMarksByTeacher(currentTeacher.teacher_id));

    // Batch persist to SQLite database
    Promise.all(
      records.map((rec) =>
        ApiClient.saveMarks({
          student_id: rec.studentId,
          subject_id: subjectId,
          unit_test_1_marks: rec.unit1Marks,
          unit_test_1_max_marks: rec.unit1MaxMarks,
          unit_test_2_marks: rec.unit2Marks,
          unit_test_2_max_marks: rec.unit2MaxMarks,
        })
      )
    ).catch((err) => console.warn('SQLite batch saveMarks sync error:', err));

    return { success: true, message: `Successfully updated ${records.length} student marks.` };
  };

  // Batch Save for a Specific Unit Test without overwriting the other exam
  const saveUnitTestBatchMarks = (
    subjectId: string,
    examType: 'Unit Test 1' | 'Unit Test 2',
    records: Array<{
      studentId: string;
      marksObtained: number;
      maxMarks: number;
      remarks?: string;
    }>
  ) => {
    if (!currentTeacher) return { success: false, message: 'Not logged in.' };

    for (const rec of records) {
      if (rec.maxMarks <= 0) {
        return { success: false, message: 'Maximum marks must be greater than 0.' };
      }
      if (rec.marksObtained < 0) {
        return { success: false, message: 'Marks obtained cannot be negative.' };
      }
      if (rec.marksObtained > rec.maxMarks) {
        return {
          success: false,
          message: `⚠️ Marks obtained (${rec.marksObtained}) cannot be greater than maximum marks (${rec.maxMarks}).`,
        };
      }
    }

    const allMarks = [...StorageService.getAllMarks()];
    const now = new Date().toISOString();
    const sub = subjects.find((s) => s.id === subjectId);
    const courseTitle = sub?.course_title || sub?.subject_name || 'Course';
    const courseCode = sub?.course_code || sub?.subjectCode || '';
    const programmingName = sub?.department || currentTeacher.department || 'Computer Engineering';

    records.forEach((rec) => {
      const student = students.find((s) => s.id === rec.studentId);
      const idx = allMarks.findIndex(
        (m) =>
          m.teacher_id === currentTeacher.teacher_id &&
          (m.student_id === rec.studentId || (m as any).studentId === rec.studentId) &&
          (m.subject_id === subjectId || (m as any).subjectId === subjectId)
      );

      const isU1 = examType === 'Unit Test 1';

      if (idx >= 0) {
        const existing = allMarks[idx];
        const u1Marks = isU1 ? rec.marksObtained : (existing.unit_1_marks ?? existing.unit1Marks ?? 0);
        const u1Max = isU1 ? rec.maxMarks : (existing.unit_1_max_marks ?? existing.unit1MaxMarks ?? 30);
        const u2Marks = !isU1 ? rec.marksObtained : (existing.unit_2_marks ?? existing.unit2Marks ?? 0);
        const u2Max = !isU1 ? rec.maxMarks : (existing.unit_2_max_marks ?? existing.unit2MaxMarks ?? 30);

        allMarks[idx] = {
          ...existing,
          unit_1_marks: u1Marks,
          unit_1_max_marks: u1Max,
          unit_2_marks: u2Marks,
          unit_2_max_marks: u2Max,
          unit1Marks: u1Marks,
          unit1MaxMarks: u1Max,
          unit2Marks: u2Marks,
          unit2MaxMarks: u2Max,
          exam_type: examType,
          examType: examType,
          marks_obtained: rec.marksObtained,
          marksObtained: rec.marksObtained,
          max_marks: rec.maxMarks,
          maxMarks: rec.maxMarks,
          course_title: courseTitle,
          courseTitle: courseTitle,
          course_code: courseCode,
          courseCode: courseCode,
          programming_name: programmingName,
          programmingName: programmingName,
          year: student?.year,
          bt_no: student?.bt_no || student?.btNo,
          btNo: student?.bt_no || student?.btNo,
          updated_at: now,
        };
      } else {
        const u1Marks = isU1 ? rec.marksObtained : 0;
        const u1Max = isU1 ? rec.maxMarks : 30;
        const u2Marks = !isU1 ? rec.marksObtained : 0;
        const u2Max = !isU1 ? rec.maxMarks : 30;

        allMarks.push({
          id: `m_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          teacher_id: currentTeacher.teacher_id,
          student_id: rec.studentId,
          subject_id: subjectId,
          studentId: rec.studentId,
          subjectId: subjectId,
          unit_1_marks: u1Marks,
          unit_1_max_marks: u1Max,
          unit_2_marks: u2Marks,
          unit_2_max_marks: u2Max,
          unit1Marks: u1Marks,
          unit1MaxMarks: u1Max,
          unit2Marks: u2Marks,
          unit2MaxMarks: u2Max,
          exam_type: examType,
          examType: examType,
          marks_obtained: rec.marksObtained,
          marksObtained: rec.marksObtained,
          max_marks: rec.maxMarks,
          maxMarks: rec.maxMarks,
          course_title: courseTitle,
          courseTitle: courseTitle,
          course_code: courseCode,
          courseCode: courseCode,
          programming_name: programmingName,
          programmingName: programmingName,
          year: student?.year,
          bt_no: student?.bt_no || student?.btNo,
          btNo: student?.bt_no || student?.btNo,
          created_at: now,
          updated_at: now,
        });
      }
    });

    StorageService.saveAllMarks(allMarks);
    setMarks(StorageService.getMarksByTeacher(currentTeacher.teacher_id));

    // Persist to SQLite database
    Promise.all(
      records.map((rec) => {
        const matched = allMarks.find(
          (m) =>
            m.teacher_id === currentTeacher.teacher_id &&
            (m.student_id === rec.studentId || (m as any).studentId === rec.studentId) &&
            (m.subject_id === subjectId || (m as any).subjectId === subjectId)
        );
        return ApiClient.saveMarks({
          student_id: rec.studentId,
          subject_id: subjectId,
          unit_test_1_marks: matched?.unit_1_marks ?? (examType === 'Unit Test 1' ? rec.marksObtained : 0),
          unit_test_1_max_marks: matched?.unit_1_max_marks ?? (examType === 'Unit Test 1' ? rec.maxMarks : 30),
          unit_test_2_marks: matched?.unit_2_marks ?? (examType === 'Unit Test 2' ? rec.marksObtained : 0),
          unit_test_2_max_marks: matched?.unit_2_max_marks ?? (examType === 'Unit Test 2' ? rec.maxMarks : 30),
        });
      })
    ).catch((err) => console.warn('SQLite unit test batch saveMarks sync error:', err));

    return { success: true, message: `Successfully updated ${records.length} student marks for ${examType}.` };
  };

  // Batch save marks alias
  const batchSaveMarks = (
    updates: Array<{
      studentId: string;
      subjectId: string;
      unit1Marks: number;
      unit1MaxMarks: number;
      unit2Marks: number;
      unit2MaxMarks: number;
      remarks?: string;
    }>,
    teacherInfo?: any
  ) => {
    if (!currentTeacher) return { success: false, message: 'Not logged in.' };
    if (!updates.length) return { success: false, message: 'No records to save.' };

    const subjectId = updates[0].subjectId;
    return saveBatchMarks(subjectId, updates);
  };

  const getStudentSummary = (studentId: string): StudentAcademicSummary | undefined => {
    const std = students.find((s) => s.id === studentId);
    if (!std) return undefined;
    return calculateStudentSummary(std, subjects, marks);
  };

  return (
    <AcademicContext.Provider
      value={{
        students,
        subjects,
        marks,
        allSummaries,
        teachers: [],
        activeTab,
        setActiveTab,
        addCourse,
        updateCourse,
        deleteCourse,
        deleteCoursesBatch,
        deleteAllCourses,
        addSubject,
        updateSubject,
        deleteSubject,
        deleteSubjectsBatch,
        deleteAllSubjects,
        addStudent,
        updateStudent,
        deleteStudent,
        deleteStudentsBatch,
        deleteAllStudents,
        refreshData,
        importStudentsBatch,
        saveStudentMarks,
        saveUnitTestBatchMarks,
        saveMarksForStudent,
        saveBatchMarks,
        batchSaveMarks,
        getStudentSummary,
        selectedStudentProfile,
        setSelectedStudentProfile,
        studentFormModal,
        setStudentFormModal,
        importStudentsModal,
        setImportStudentsModal,
        courseFormModal,
        setCourseFormModal,
        selectedStudentForMarks,
        setSelectedStudentForMarks,
        toast,
        showToast,
        clearToast,
      }}
    >
      {children}
    </AcademicContext.Provider>
  );
};

export const useAcademic = () => {
  const context = useContext(AcademicContext);
  if (!context) {
    throw new Error('useAcademic must be used within an AcademicProvider');
  }
  return context;
};
