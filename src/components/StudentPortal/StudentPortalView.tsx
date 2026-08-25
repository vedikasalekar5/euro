import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAcademic } from '../../context/AcademicContext';
import { CollegeLogo } from '../../assets/collegeLogo';
import {
  GraduationCap,
  Award,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  FileText,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { getPerformanceBadgeClasses } from '../../utils/calculations';

export const StudentPortalView: React.FC = () => {
  const { user } = useAuth();
  const { students, getStudentSummary, subjects, marks } = useAcademic();

  const studentId = user?.studentId || students[0]?.id;
  const summary = studentId ? getStudentSummary(studentId) : undefined;
  const currentStudent = summary?.student || students[0];

  if (!summary || !currentStudent) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-[#D7E3EA]">
        <CollegeLogo className="w-16 h-16 mx-auto mb-3 shadow-md" />
        <h3 className="text-base font-bold text-[#172B4D]">Student Record Not Found</h3>
      </div>
    );
  }

  const badge = getPerformanceBadgeClasses(summary.overallRating);

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="student-portal-view">
      {/* Student Welcome Header Banner */}
      <div className="bg-[#0B1F3A] rounded-2xl p-6 text-white shadow-lg border border-[#102A43] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <CollegeLogo className="w-14 h-14 shadow-lg ring-2 ring-[#00D9FF]/40 shrink-0" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-bold bg-[#102A43] text-[#00D9FF] border border-[#00D9FF]/40 rounded-md">
                EURO MANDAR Student Portal
              </span>
              <span className="text-xs text-[#67E8F9]">
                Mandar Education Society's
              </span>
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight">
              {currentStudent.student_name || currentStudent.name}
            </h2>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#67E8F9]">
              <span>Enrollment No: <strong className="text-white font-mono">{currentStudent.enrollment_number || currentStudent.enrollmentNo || currentStudent.rollNumber}</strong></span>
              <span>•</span>
              <span>Program: <strong className="text-white">{currentStudent.programming_name || currentStudent.department}</strong> ({currentStudent.year})</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-xs font-bold bg-[#102A43] hover:bg-[#102A43]/80 text-white rounded-xl transition-all flex items-center gap-1.5 border border-[#D7E3EA]/20 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#00D9FF]" />
            <span>Print Report Card</span>
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#D7E3EA] shadow-xs">
          <span className="text-xs font-bold text-[#64748B] block mb-1">Overall Percentage</span>
          <div className="text-3xl font-black text-[#172B4D]">{summary.overallAveragePercentage}%</div>
          <div className="text-xs text-[#64748B] mt-1 font-medium">Unit 1 &amp; Unit 2 Aggregate</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D7E3EA] shadow-xs">
          <span className="text-xs font-bold text-[#64748B] block mb-1">Performance Rating</span>
          <div className="mt-1">
            <span className={`px-3 py-1 text-sm font-bold rounded-lg border ${badge.bg}`}>
              {summary.overallRating}
            </span>
          </div>
          <div className="text-xs text-[#64748B] mt-2 font-medium">Academic Tier</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D7E3EA] shadow-xs">
          <span className="text-xs font-bold text-[#64748B] block mb-1">Unit-to-Unit Trend</span>
          <div className="flex items-center gap-2 mt-0.5">
            {summary.overallTrend === 'Improved' ? (
              <>
                <span className="text-2xl font-black text-[#16A34A]">+{summary.overallImprovementDelta}%</span>
                <TrendingUp className="w-5 h-5 text-[#16A34A]" />
              </>
            ) : summary.overallTrend === 'Declined' ? (
              <>
                <span className="text-2xl font-black text-[#EF4444]">{summary.overallImprovementDelta}%</span>
                <TrendingDown className="w-5 h-5 text-[#EF4444]" />
              </>
            ) : (
              <span className="text-2xl font-bold text-[#172B4D]">Consistent</span>
            )}
          </div>
          <div className="text-xs text-[#64748B] mt-1 font-medium">Progress between exams</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D7E3EA] shadow-xs">
          <span className="text-xs font-bold text-[#64748B] block mb-1">Department Rank</span>
          <div className="text-3xl font-black text-[#0B1F3A]">#{summary.departmentRank || 1}</div>
          <div className="text-xs text-[#64748B] mt-1 font-medium">
            College Rank: #{summary.collegeRank || 1}
          </div>
        </div>
      </div>

      {/* Subject-Wise Detailed Score Ledger */}
      <div className="bg-white rounded-2xl border border-[#D7E3EA] shadow-xs overflow-hidden">
        <div className="p-5 bg-[#F5F9FC] border-b border-[#D7E3EA] flex items-center justify-between">
          <h3 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#0094B3]" />
            <span>Course-Wise Examination Breakdown</span>
          </h3>
          <span className="text-xs font-bold text-[#64748B]">
            {summary.details.length} Courses Evaluated
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#F5F9FC]/80 border-b border-[#D7E3EA] text-[#0B1F3A] text-xs uppercase font-bold tracking-wider">
                <th className="py-3.5 px-4">Course Details</th>
                <th className="py-3.5 px-4 text-center">Unit Test 1 (/30)</th>
                <th className="py-3.5 px-4 text-center">Unit Test 2 (/30)</th>
                <th className="py-3.5 px-4 text-center">Average (/30)</th>
                <th className="py-3.5 px-4 text-center">Percentage</th>
                <th className="py-3.5 px-4 text-center">Rating</th>
                <th className="py-3.5 px-4 text-center">Trend</th>
                <th className="py-3.5 px-4">Faculty In-Charge / Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D7E3EA] font-medium text-[#172B4D]">
              {summary.details.map((detail) => {
                const subBadge = getPerformanceBadgeClasses(detail.rating);
                const courseTitle = detail.subject.course_title || detail.subject.subjectName || (detail.subject as any).subject_name;
                const courseCode = detail.subject.course_code || detail.subject.subjectCode || (detail.subject as any).subject_code || '';
                return (
                  <tr key={detail.subject.id} className="hover:bg-[#F5F9FC]/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#172B4D]">{courseTitle}</div>
                      <div className="text-[11px] text-[#64748B] font-mono">
                        {courseCode}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-[#172B4D]">
                      {detail.unit1Marks} / 30{' '}
                      <span className="text-xs text-[#64748B] font-normal">({detail.unit1Percentage}%)</span>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-[#172B4D]">
                      {detail.unit2Marks} / 30{' '}
                      <span className="text-xs text-[#64748B] font-normal">({detail.unit2Percentage}%)</span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-[#172B4D]">
                      {detail.averageMarks} / 30
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-[#0094B3]">
                      {detail.averagePercentage}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${subBadge.bg}`}>
                        {detail.rating}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      {detail.trend === 'Improved' ? (
                        <span className="text-[#16A34A] text-xs flex items-center justify-center gap-0.5">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>+{detail.improvementPercentage}%</span>
                        </span>
                      ) : detail.trend === 'Declined' ? (
                        <span className="text-[#EF4444] text-xs flex items-center justify-center gap-0.5">
                          <TrendingDown className="w-3.5 h-3.5" />
                          <span>{detail.improvementPercentage}%</span>
                        </span>
                      ) : (
                        <span className="text-[#64748B] text-xs">Consistent</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#172B4D]">
                      {detail.enteredByTeacherName && (
                        <div className="font-bold text-[#0B1F3A] mb-0.5">
                          {detail.enteredByTeacherName}
                        </div>
                      )}
                      <div className="text-[#64748B] italic">
                        {detail.remarks || 'Satisfactory classroom attendance and test performance.'}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analysis & Faculty Remarks Summary */}
      <div className="bg-white p-6 rounded-2xl border border-[#D7E3EA] shadow-xs space-y-3">
        <h4 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#0094B3]" />
          <span>Automated Academic Evaluation Analysis</span>
        </h4>
        <p className="text-xs text-[#172B4D] leading-relaxed font-medium bg-[#F5F9FC] p-4 rounded-xl border border-[#D7E3EA]">
          {summary.generatedAnalysis}
        </p>
      </div>
    </div>
  );
};
