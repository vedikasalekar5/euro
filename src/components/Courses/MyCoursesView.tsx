import React, { useState, useMemo } from 'react';
import { useAcademic } from '../../context/AcademicContext';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Filter,
  FileEdit,
  GraduationCap,
  Layers,
  AlertTriangle,
  Sparkles,
  Search,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Subject, Department, AcademicYear } from '../../types';

export const MyCoursesView: React.FC = () => {
  const { subjects, students, marks, deleteCourse, setCourseFormModal, setActiveTab } = useAcademic();
  const { currentTeacher } = useAuth();

  const [selectedYear, setSelectedYear] = useState<AcademicYear | 'All'>('All');
  const [selectedDept, setSelectedDept] = useState<Department | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Delete modal state
  const [courseToDelete, setCourseToDelete] = useState<Subject | null>(null);

  const filteredCourses = useMemo(() => {
    return subjects.filter((course) => {
      const matchesYear = selectedYear === 'All' || course.year === selectedYear;
      const matchesDept = selectedDept === 'All' || course.department === selectedDept || (course as any).programming_name === selectedDept;
      const title = (course.course_title || course.courseTitle || course.subject_name || '').toLowerCase();
      const code = (course.course_code || course.courseCode || course.subjectCode || '').toLowerCase();
      const matchesSearch = !searchQuery || title.includes(searchQuery.toLowerCase()) || code.includes(searchQuery.toLowerCase());
      return matchesYear && matchesDept && matchesSearch;
    });
  }, [subjects, selectedYear, selectedDept, searchQuery]);

  const yearTabs: Array<AcademicYear | 'All'> = ['All', '1st Year', '2nd Year', '3rd Year', '2nd Year DSY'];

  const handleDeleteConfirm = () => {
    if (courseToDelete) {
      deleteCourse(courseToDelete.id);
      setCourseToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150" id="my-courses-view">
      
      {/* Top Header Card */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#D7E3EA] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F5F9FC] border border-[#D7E3EA] flex items-center justify-center text-[#0B1F3A] shrink-0 shadow-xs">
            <BookOpen className="w-6 h-6 text-[#0094B3]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-[#172B4D] tracking-tight">
                My Courses
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-[#F5F9FC] text-[#0B1F3A] rounded-full border border-[#D7E3EA]">
                {subjects.length} Total Course{subjects.length !== 1 ? 's' : ''}
              </span>
              <span className="px-2 py-0.5 text-[11px] font-mono font-semibold bg-[#F5F9FC] text-[#0B1F3A] rounded-md border border-[#D7E3EA]">
                Teacher: {currentTeacher?.teacher_id}
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-1 max-w-2xl">
              Personally add and manage the courses you teach. Enter Course Title and official Course Code manually without predefined lists.
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            setCourseFormModal({
              isOpen: true,
              courseToEdit: null,
              defaultYear: selectedYear !== 'All' ? selectedYear : '2nd Year',
              defaultDept: selectedDept !== 'All' ? selectedDept : currentTeacher?.department,
            })
          }
          className="px-5 py-2.5 bg-[#0B1F3A] hover:bg-[#102A43] active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-[#0B1F3A]/20 transition-all flex items-center gap-2 cursor-pointer shrink-0 border border-[#00D9FF]/30"
          id="add-course-main-btn"
        >
          <Plus className="w-4 h-4 text-[#00D9FF]" />
          <span>Add Course</span>
        </button>
      </div>

      {/* Year Filter Tabs & Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D7E3EA] shadow-xs space-y-4">
        
        {/* Year Pills Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1" id="year-filter-tabs">
          {yearTabs.map((y) => {
            const count = y === 'All' ? subjects.length : subjects.filter((s) => s.year === y).length;
            const isSelected = selectedYear === y;
            return (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[#0B1F3A] text-white shadow-md border border-[#00D9FF]/30'
                    : 'bg-[#F5F9FC] text-[#64748B] hover:bg-[#E2ECF4] hover:text-[#172B4D] border border-[#D7E3EA]'
                }`}
                id={`year-tab-${y.replace(/\s+/g, '-').toLowerCase()}`}
              >
                <span>{y === 'All' ? 'All Academic Years' : y}</span>
                <span
                  className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-bold ${
                    isSelected ? 'bg-white/20 text-[#00D9FF]' : 'bg-[#E2ECF4] text-[#0B1F3A]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters Row: Department & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-[#D7E3EA]">
          <div className="sm:col-span-4">
            <div className="relative">
              <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value as any)}
                className="w-full pl-9 pr-3 py-2 bg-[#F5F9FC] text-xs font-semibold text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:bg-white focus:border-[#00D9FF] outline-none cursor-pointer"
                id="course-dept-filter"
              >
                <option value="All">All Programming Departments</option>
                <option value="Computer Engineering">Computer Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
              </select>
            </div>
          </div>

          <div className="sm:col-span-8">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your courses by title or code (e.g. Operating System, CO502)..."
                className="w-full pl-9 pr-4 py-2 bg-[#F5F9FC] text-xs font-medium text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:bg-white focus:border-[#00D9FF] outline-none placeholder:text-[#64748B]"
                id="course-search-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Courses Table / Cards */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#D7E3EA] p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#F5F9FC] text-[#0B1F3A] border border-[#D7E3EA] mx-auto flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-[#0094B3]" />
          </div>
          <h3 className="text-base font-bold text-[#172B4D]">
            {searchQuery || selectedYear !== 'All' || selectedDept !== 'All'
              ? 'No courses match your filter'
              : 'No courses added yet'}
          </h3>
          <p className="text-xs text-[#64748B] mt-1.5 max-w-md mx-auto">
            {searchQuery || selectedYear !== 'All' || selectedDept !== 'All'
              ? 'Try adjusting your search query or selecting a different year.'
              : 'You have not added any courses yet. Add the courses you personally teach to begin allocating marks.'}
          </p>
          <div className="mt-5">
            <button
              onClick={() =>
                setCourseFormModal({
                  isOpen: true,
                  courseToEdit: null,
                  defaultYear: selectedYear !== 'All' ? selectedYear : '2nd Year',
                  defaultDept: selectedDept !== 'All' ? selectedDept : currentTeacher?.department,
                })
              }
              className="px-5 py-2.5 bg-[#0B1F3A] hover:bg-[#102A43] text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer border border-[#00D9FF]/30"
              id="empty-state-add-course-btn"
            >
              <Plus className="w-4 h-4 text-[#00D9FF]" />
              <span>Add Your First Course</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#D7E3EA] shadow-xs overflow-hidden">
          
          <div className="px-6 py-4 border-b border-[#D7E3EA] flex items-center justify-between bg-[#F5F9FC]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
                Teacher's Personal Course List
              </span>
              <span className="text-xs font-semibold text-[#64748B] font-mono">
                ({filteredCourses.length})
              </span>
            </div>
            <p className="text-xs text-[#64748B] hidden sm:block">
              Unit Test 1 (30M) &amp; Unit Test 2 (30M)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs" id="my-courses-table">
              <thead>
                <tr className="bg-[#F5F9FC] border-b border-[#D7E3EA] text-[#0B1F3A] font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-5">Sr.</th>
                  <th className="py-3.5 px-5">Course Title</th>
                  <th className="py-3.5 px-5">Course Code</th>
                  <th className="py-3.5 px-5">Programming Name</th>
                  <th className="py-3.5 px-5">Year</th>
                  <th className="py-3.5 px-5 text-center">Enrolled Students</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D7E3EA]">
                {filteredCourses.map((course, idx) => {
                  const courseTitle = course.course_title || course.courseTitle || course.subject_name || 'Course';
                  const courseCode = course.course_code || course.courseCode || course.subjectCode || 'N/A';
                  const dept = course.department || (course as any).programming_name || 'Computer Engineering';
                  const year = course.year;

                  // Compute enrolled students in this department and year
                  const enrolledCount = students.filter(
                    (s) => s.department === dept && s.year === year
                  ).length;

                  return (
                    <tr
                      key={course.id}
                      className="hover:bg-[#F5F9FC] transition-colors group"
                      id={`course-row-${course.id}`}
                    >
                      <td className="py-4 px-5 font-mono text-[#64748B] font-medium">
                        {idx + 1}
                      </td>

                      {/* Course Title */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-[#172B4D] text-sm">
                          {courseTitle}
                        </div>
                        <div className="text-[11px] text-[#64748B]">
                          {course.teacher_id === currentTeacher?.teacher_id ? 'Personal Course' : 'Faculty Course'}
                        </div>
                      </td>

                      {/* Course Code */}
                      <td className="py-4 px-5">
                        <span className="px-2.5 py-1 bg-[#F5F9FC] text-[#0B1F3A] font-mono font-bold text-xs rounded-lg border border-[#D7E3EA] inline-block shadow-2xs">
                          {courseCode}
                        </span>
                      </td>

                      {/* Programming Name */}
                      <td className="py-4 px-5 text-[#172B4D] font-medium">
                        {dept}
                      </td>

                      {/* Year */}
                      <td className="py-4 px-5">
                        <span className="px-2.5 py-1 bg-[#F5F9FC] text-[#0B1F3A] font-semibold text-[11px] rounded-lg border border-[#D7E3EA]">
                          {year}
                        </span>
                      </td>

                      {/* Enrolled Students */}
                      <td className="py-4 px-5 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#DCFCE7] text-[#16A34A] font-bold text-xs rounded-lg border border-[#BBF7D0]">
                          <span>{enrolledCount} Students</span>
                        </div>
                      </td>

                      {/* Actions: Allocate Marks, Edit, Delete */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setActiveTab('marks-allocation');
                            }}
                            className="px-2.5 py-1.5 bg-[#F5F9FC] hover:bg-[#E2ECF4] text-[#0B1F3A] font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-[#D7E3EA]"
                            title="Allocate Marks for this course"
                            id={`allocate-marks-btn-${course.id}`}
                          >
                            <FileEdit className="w-3.5 h-3.5 text-[#0094B3]" />
                            <span className="hidden sm:inline">Marks</span>
                          </button>

                          <button
                            onClick={() =>
                              setCourseFormModal({
                                isOpen: true,
                                courseToEdit: course,
                              })
                            }
                            className="p-1.5 text-[#64748B] hover:text-[#0B1F3A] hover:bg-[#F5F9FC] rounded-lg transition-colors cursor-pointer"
                            title="Edit Course Details"
                            id={`edit-course-btn-${course.id}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setCourseToDelete(course)}
                            className="p-1.5 text-[#64748B] hover:text-[#EF4444] hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Course"
                            id={`delete-course-btn-${course.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {courseToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#071426]/70 backdrop-blur-xs"
          id="delete-course-modal"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-[#D7E3EA] max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-[#EF4444] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-[#172B4D]">
                Are you sure you want to delete this course?
              </h3>
              <p className="text-xs text-[#64748B] mt-1">
                This will delete the course entry from your teacher portal.
              </p>
            </div>

            {/* Course Summary Box */}
            <div className="bg-[#F5F9FC] p-3.5 rounded-2xl border border-[#D7E3EA] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Course Title:</span>
                <strong className="text-[#172B4D]">
                  {courseToDelete.course_title || courseToDelete.subject_name}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Course Code:</span>
                <span className="font-mono font-bold text-[#0B1F3A]">
                  {courseToDelete.course_code || courseToDelete.courseCode || courseToDelete.subjectCode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Programming / Year:</span>
                <span className="text-[#172B4D]">
                  {courseToDelete.department} • {courseToDelete.year}
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
              Any marks entered for this course will be safely cleaned up without affecting other subjects or student records.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setCourseToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-[#F5F9FC] rounded-xl cursor-pointer transition-colors"
                id="cancel-delete-course-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-5 py-2 text-xs font-bold text-white bg-[#EF4444] hover:bg-rose-600 rounded-xl shadow-md shadow-rose-600/20 active:scale-95 cursor-pointer transition-all"
                id="confirm-delete-course-btn"
              >
                Yes, Delete Course
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
