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
  Search,
} from 'lucide-react';
import { Subject, Department, AcademicYear } from '../../types';
import { CourseDeleteWorkflowModal } from '../Common/CourseDeleteWorkflowModal';

export const MyCoursesView: React.FC = () => {
  const {
    subjects,
    students,
    deleteCourse,
    deleteCoursesBatch,
    deleteAllCourses,
    setCourseFormModal,
    setActiveTab,
    showToast,
  } = useAcademic();
  const { currentTeacher } = useAuth();

  const [selectedYear, setSelectedYear] = useState<AcademicYear | 'All'>('All');
  const [selectedDept, setSelectedDept] = useState<Department | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Course Delete Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [targetCourseForDelete, setTargetCourseForDelete] = useState<Subject | null>(null);

  const filteredCourses = useMemo(() => {
    return subjects.filter((course) => {
      const matchesYear = selectedYear === 'All' || course.year === selectedYear;
      const matchesDept =
        selectedDept === 'All' ||
        course.department === selectedDept ||
        (course as any).programming_name === selectedDept;
      const title = (course.course_title || course.courseTitle || course.subject_name || '').toLowerCase();
      const code = (course.course_code || course.courseCode || course.subjectCode || '').toLowerCase();
      const matchesSearch =
        !searchQuery ||
        title.includes(searchQuery.toLowerCase()) ||
        code.includes(searchQuery.toLowerCase());
      return matchesYear && matchesDept && matchesSearch;
    });
  }, [subjects, selectedYear, selectedDept, searchQuery]);

  const yearTabs: Array<AcademicYear | 'All'> = ['All', '1st Year', '2nd Year', '3rd Year', '2nd Year DSY'];

  const handleOpenRowDelete = (course: Subject) => {
    setTargetCourseForDelete(course);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSingle = async (courseId: string) => {
    try {
      const res = await deleteCourse(courseId);
      if (res && res.success === false) {
        showToast(res.message || 'Failed to delete course', 'error');
        return false;
      }
      return true;
    } catch (err: any) {
      showToast(err.message || 'Error deleting course', 'error');
      return false;
    }
  };

  const handleDeleteBatch = async (courseIds: string[]) => {
    if (courseIds.length === 0) return false;
    try {
      const res = await deleteCoursesBatch(courseIds);
      if (res.success) {
        return true;
      } else {
        showToast(res.message || 'Failed to delete selected courses', 'error');
        return false;
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting courses', 'error');
      return false;
    }
  };

  const handleDeleteAll = async () => {
    try {
      const res = await deleteAllCourses();
      if (res.success) {
        return true;
      } else {
        showToast(res.message || 'Failed to delete all courses', 'error');
        return false;
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting all courses', 'error');
      return false;
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

        <div className="flex items-center gap-2.5 flex-wrap">
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

      {/* Courses Table */}
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
                  <th className="py-3.5 px-4">Sr.</th>
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
                      <td className="py-4 px-4 font-mono text-[#64748B] font-medium">
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
                            onClick={() => handleOpenRowDelete(course)}
                            className="p-1.5 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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

      {/* Course Deletion Workflow Modal */}
      <CourseDeleteWorkflowModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setTargetCourseForDelete(null);
        }}
        targetCourse={targetCourseForDelete}
        courses={subjects}
        currentDepartmentFilter={selectedDept}
        currentYearFilter={selectedYear}
        currentSearchQuery={searchQuery}
        onDeleteSingle={handleDeleteSingle}
        onDeleteMultiple={handleDeleteBatch}
        onDeleteAll={handleDeleteAll}
      />
    </div>
  );
};

