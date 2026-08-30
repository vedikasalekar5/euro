import { Student, Subject, MarkRecord, Teacher, MarksAuditLog } from '../types';

const API_BASE = '/api';

/**
 * Universal JSON fetch helper with error handling and authenticated Teacher-ID header
 */
async function fetchJson<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  let activeTeacherId = '';
  try {
    activeTeacherId = localStorage.getItem('teacher_mgmt_active_teacher_id_v1') || '';
  } catch {}

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(activeTeacherId ? { 'X-Teacher-ID': activeTeacherId } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({ success: false, error: 'Failed to parse JSON response' }));

  if (!response.ok && data.error) {
    throw new Error(data.error || `HTTP ${response.status}: Request failed`);
  }

  return data as T;
}

export const ApiClient = {
  // DB Health
  async getDbStatus() {
    return fetchJson(`${API_BASE}/db/status`);
  },

  // Students
  async getStudents(params: { search?: string; department?: string; year?: string; division?: string; rating?: string } = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.department && params.department !== 'All') query.set('department', params.department);
    if (params.year && params.year !== 'All') query.set('year', params.year);
    if (params.division && params.division !== 'All') query.set('division', params.division);
    if (params.rating && params.rating !== 'All') query.set('rating', params.rating);

    const qs = query.toString();
    return fetchJson<{ success: boolean; students: Student[]; count: number }>(
      `${API_BASE}/students${qs ? `?${qs}` : ''}`
    );
  },

  async getStudentById(id: string | number) {
    return fetchJson<{ success: boolean; student: Student; summary: any }>(`${API_BASE}/students/${id}`);
  },

  async createStudent(studentData: any) {
    return fetchJson<{ success: boolean; student?: Student; error?: string }>(`${API_BASE}/students`, {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  },

  async updateStudent(id: string | number, studentData: any) {
    return fetchJson<{ success: boolean; student?: Student; error?: string }>(`${API_BASE}/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    });
  },

  async deleteStudent(id: string | number) {
    return fetchJson<{ success: boolean; message?: string; error?: string }>(`${API_BASE}/students/${id}`, {
      method: 'DELETE',
    });
  },

  async bulkDeleteStudents(studentIds: (string | number)[]) {
    return fetchJson<{
      success: boolean;
      deletedCount: number;
      failedCount: number;
      deletedIds: (string | number)[];
      failedIds: (string | number)[];
      message?: string;
      error?: string;
    }>(`${API_BASE}/students/bulk-delete`, {
      method: 'POST',
      body: JSON.stringify({ studentIds }),
    });
  },

  async deleteAllStudents() {
    return fetchJson<{
      success: boolean;
      deletedCount: number;
      message?: string;
      error?: string;
    }>(`${API_BASE}/students/all`, {
      method: 'DELETE',
    });
  },

  async batchImportStudents(students: any[], actionOnDuplicate: 'skip' | 'update' = 'skip') {
    return fetchJson<{
      success: boolean;
      importedCount: number;
      updatedCount: number;
      skippedCount: number;
      failedCount: number;
      importedStudents?: Student[];
      details?: Array<{
        student_name: string;
        enrollment_number: string;
        roll_number?: string;
        status: 'imported' | 'updated' | 'skipped' | 'failed';
        message: string;
      }>;
      allStudents?: any[];
      message?: string;
      error?: string;
    }>(
      `${API_BASE}/students/import`,
      {
        method: 'POST',
        body: JSON.stringify({ students, actionOnDuplicate }),
      }
    );
  },

  // Teachers & Auth
  async getTeachers() {
    return fetchJson<{ success: boolean; teachers: Teacher[] }>(`${API_BASE}/teachers`);
  },

  async getTeacherById(id: string) {
    return fetchJson<{ success: boolean; teacher: Teacher }>(`${API_BASE}/teachers/${id}`);
  },

  async updateTeacher(id: string, data: Partial<Teacher>) {
    return fetchJson<{ success: boolean; teacher: Teacher }>(`${API_BASE}/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async registerTeacher(data: { name: string; password: string; department?: string; position?: string; email?: string; phone?: string }) {
    return fetchJson<{ success: boolean; message: string; teacherId?: string; teacher?: Teacher }>(
      `${API_BASE}/auth/register`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  async login(teacherId: string, password?: string) {
    return fetchJson<{ success: boolean; message: string; teacher?: Teacher }>(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ teacherId, password }),
    });
  },

  async changePassword(teacherId: string, currentPassword: string, newPassword: string) {
    return fetchJson<{ success: boolean; message: string }>(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      body: JSON.stringify({ teacherId, currentPassword, newPassword }),
    });
  },

  async resetPassword(teacherId: string, name: string, newPassword: string) {
    return fetchJson<{ success: boolean; message: string }>(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ teacherId, name, newPassword }),
    });
  },

  // Subjects / Courses
  async getSubjects(params: { department?: string; year?: string; teacher_id?: string } = {}) {
    const query = new URLSearchParams();
    if (params.department && params.department !== 'All') query.set('department', params.department);
    if (params.year && params.year !== 'All') query.set('year', params.year);
    if (params.teacher_id) query.set('teacher_id', params.teacher_id);

    const qs = query.toString();
    return fetchJson<{ success: boolean; subjects: Subject[] }>(
      `${API_BASE}/subjects${qs ? `?${qs}` : ''}`
    );
  },

  async createSubject(subjectData: any) {
    return fetchJson<{ success: boolean; subject?: Subject; error?: string }>(`${API_BASE}/subjects`, {
      method: 'POST',
      body: JSON.stringify(subjectData),
    });
  },

  async updateSubject(id: string, subjectData: any) {
    return fetchJson<{ success: boolean; subject?: Subject; error?: string }>(`${API_BASE}/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(subjectData),
    });
  },

  async deleteSubject(id: string) {
    return fetchJson<{ success: boolean; message?: string; error?: string }>(`${API_BASE}/subjects/${id}`, {
      method: 'DELETE',
    });
  },

  async bulkDeleteSubjects(subjectIds: string[]) {
    return fetchJson<{
      success: boolean;
      deletedCount: number;
      failedCount: number;
      deletedIds: string[];
      failedIds: string[];
      message?: string;
      error?: string;
    }>(`${API_BASE}/subjects/bulk-delete`, {
      method: 'POST',
      body: JSON.stringify({ subjectIds }),
    });
  },

  async deleteAllSubjects() {
    return fetchJson<{
      success: boolean;
      deletedCount: number;
      message?: string;
      error?: string;
    }>(`${API_BASE}/subjects/all`, {
      method: 'DELETE',
    });
  },

  // Marks
  async getAllMarks() {
    return fetchJson<{ success: boolean; marks: MarkRecord[] }>(`${API_BASE}/marks`);
  },

  async getMarksForStudent(studentId: string | number) {
    return fetchJson<{ success: boolean; marks: MarkRecord[] }>(`${API_BASE}/marks/student/${studentId}`);
  },

  async getMarksForSubject(subjectId: string) {
    return fetchJson<{ success: boolean; marks: MarkRecord[] }>(`${API_BASE}/marks/subject/${subjectId}`);
  },

  async saveMarks(
    studentIdOrData: string | number | {
      student_id?: string | number;
      studentId?: string | number;
      subject_id?: string;
      subjectId?: string;
      unit_test_1_marks?: number;
      unit1Marks?: number;
      unit_test_1_max_marks?: number;
      unit1MaxMarks?: number;
      unit_test_2_marks?: number;
      unit2Marks?: number;
      unit_test_2_max_marks?: number;
      unit2MaxMarks?: number;
    },
    subjectId?: string,
    unit1Marks?: number,
    unit1MaxMarks?: number,
    unit2Marks?: number,
    unit2MaxMarks?: number
  ) {
    let payload: any;
    if (typeof studentIdOrData === 'object' && studentIdOrData !== null) {
      payload = {
        studentId: studentIdOrData.studentId ?? studentIdOrData.student_id,
        subjectId: studentIdOrData.subjectId ?? studentIdOrData.subject_id,
        unit1Marks: studentIdOrData.unit1Marks ?? studentIdOrData.unit_test_1_marks ?? 0,
        unit1MaxMarks: studentIdOrData.unit1MaxMarks ?? studentIdOrData.unit_test_1_max_marks ?? 30,
        unit2Marks: studentIdOrData.unit2Marks ?? studentIdOrData.unit_test_2_marks ?? 0,
        unit2MaxMarks: studentIdOrData.unit2MaxMarks ?? studentIdOrData.unit_test_2_max_marks ?? 30,
      };
    } else {
      payload = {
        studentId: studentIdOrData,
        subjectId,
        unit1Marks: unit1Marks ?? 0,
        unit1MaxMarks: unit1MaxMarks ?? 30,
        unit2Marks: unit2Marks ?? 0,
        unit2MaxMarks: unit2MaxMarks ?? 30,
      };
    }

    return fetchJson<{ success: boolean; mark?: MarkRecord; metrics?: any; error?: string }>(
      `${API_BASE}/marks`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  async batchSaveMarks(records: any[]) {
    return fetchJson<{ success: boolean; savedCount: number; errors: string[] }>(`${API_BASE}/marks/batch`, {
      method: 'POST',
      body: JSON.stringify({ records }),
    });
  },

  // Dashboard & Analytics
  async getDashboardStats() {
    return fetchJson<{ success: boolean; stats: any }>(`${API_BASE}/dashboard/stats`);
  },

  async getDepartmentYearAnalysis(department?: string, year?: string) {
    const query = new URLSearchParams();
    if (department && department !== 'All') query.set('department', department);
    if (year && year !== 'All') query.set('year', year);
    const qs = query.toString();
    return fetchJson<{ success: boolean; analysis: any }>(
      `${API_BASE}/analytics/department-year${qs ? `?${qs}` : ''}`
    );
  },

  async getRankings() {
    return fetchJson<{ success: boolean; rankings: any[] }>(`${API_BASE}/rankings`);
  },

  // Audit Logs
  async getAuditLogs() {
    return fetchJson<{ success: boolean; auditLogs: MarksAuditLog[] }>(`${API_BASE}/audit-logs`);
  },

  async recordAuditLog(log: any) {
    return fetchJson<{ success: boolean; id: string }>(`${API_BASE}/audit-logs`, {
      method: 'POST',
      body: JSON.stringify(log),
    });
  },

  async clearAuditLogs() {
    return fetchJson<{ success: boolean; message: string }>(`${API_BASE}/audit-logs`, {
      method: 'DELETE',
    });
  },
};
