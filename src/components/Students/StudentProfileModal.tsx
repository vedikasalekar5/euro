import React, { useState } from 'react';
import { useAcademic } from '../../context/AcademicContext';
import {
  X,
  GraduationCap,
  Award,
  TrendingUp,
  TrendingDown,
  Download,
  Printer,
  Edit,
  Sparkles,
  BookOpen,
  Building,
  Calendar,
  AlertCircle,
  CheckCircle,
  Hash,
  User,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { getPerformanceBadgeClasses } from '../../utils/calculations';
import { exportIndividualStudentPDF } from '../../utils/pdfExport';

export const StudentProfileModal: React.FC = () => {
  const {
    selectedStudentProfile,
    setSelectedStudentProfile,
    getStudentSummary,
    setSelectedStudentForMarks,
    setStudentFormModal,
  } = useAcademic();

  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  if (!selectedStudentProfile) return null;

  const summary = getStudentSummary(selectedStudentProfile.id);
  if (!summary) return null;

  const student = summary.student;
  const studentName = student.student_name || student.name || 'Student';
  const badge = getPerformanceBadgeClasses(summary.overallRating);
  const isImproved = summary.overallTrend === 'Improved';
  const isDeclined = summary.overallTrend === 'Declined';
  const enrollment =
    student.enrollment_number ||
    student.enrollmentNo ||
    student.rollNumber ||
    student.prn ||
    'N/A';

  // Prepare chart data for subjects
  const subjectChartData = summary.details.map((d) => ({
    name: d.subject.subjectCode,
    fullName: d.subject.subjectName,
    unit1: d.unit1Percentage,
    unit2: d.unit2Percentage,
    average: d.averagePercentage,
  }));

  const handleGenerateAiAdvice = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/ai/analyze-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: studentName,
          department: student.department,
          year: student.year,
          enrollmentNo: enrollment,
          overallPercentage: summary.overallAveragePercentage,
          rating: summary.overallRating,
          trend: summary.overallTrend,
          improvementDelta: summary.overallImprovementDelta,
          subjects: summary.details.map((d) => ({
            code: d.subject.subjectCode,
            name: d.subject.subjectName,
            u1: d.unit1Percentage,
            u2: d.unit2Percentage,
            avg: d.averagePercentage,
            rating: d.rating,
          })),
        }),
      });
      const data = await res.json();
      setAiAdvice(data.analysis || summary.generatedAnalysis);
    } catch (e) {
      setAiAdvice(summary.generatedAnalysis);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#071426]/70 backdrop-blur-xs overflow-y-auto"
      id="student-profile-modal"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-[#D7E3EA] max-w-4xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Header Banner */}
        <div className="bg-[#0B1F3A] p-6 text-white relative border-b border-[#102A43]">
          <button
            onClick={() => {
              setSelectedStudentProfile(null);
              setAiAdvice(null);
            }}
            className="absolute right-5 top-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#67E8F9] hover:text-white transition-colors cursor-pointer"
            id="close-profile-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pr-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#102A43] border border-[#00D9FF]/40 flex items-center justify-center text-2xl font-black text-[#00D9FF] shadow-lg">
                {studentName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-black tracking-tight text-white">{studentName}</h2>
                  <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-[#102A43] text-[#00D9FF] border border-[#00D9FF]/40 rounded-md">
                    {enrollment}
                  </span>
                </div>
                <p className="text-xs text-[#67E8F9]/90 mt-1 flex items-center gap-2 font-medium">
                  <span>{student.department}</span>
                  <span>•</span>
                  <span>{student.year}</span>
                </p>
              </div>
            </div>

            {/* Overall Percentage Badge */}
            <div className="text-right sm:text-right bg-[#102A43] p-3.5 rounded-2xl border border-[#00D9FF]/30 backdrop-blur-xs">
              <div className="text-[11px] text-[#67E8F9]/80 font-bold uppercase tracking-wider">Overall Academic Result</div>
              <div className="text-2xl font-black text-white">{summary.overallAveragePercentage}%</div>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badge.bg}`}>
                {summary.overallRating}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          {/* 1. Student Information Card */}
          <div className="bg-[#F5F9FC] p-5 rounded-2xl border border-[#D7E3EA]">
            <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#0094B3]" />
              <span>Student Information</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[#64748B] block text-[11px] font-medium">Student Name</span>
                <span className="font-bold text-[#172B4D] text-sm">{studentName}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[11px] font-medium">Enrollment Number</span>
                <span className="font-mono font-bold text-[#0B1F3A] text-sm">{enrollment}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[11px] font-medium">Programming Name</span>
                <span className="font-semibold text-[#172B4D]">{student.department}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[11px] font-medium">Year</span>
                <span className="font-semibold text-[#172B4D]">{student.year}</span>
              </div>
            </div>
          </div>

          {/* 2. Overall Academic Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#F5F9FC] p-4 rounded-2xl border border-[#D7E3EA]">
              <div className="text-xs font-bold text-[#0B1F3A]">Overall Unit 1 Average</div>
              <div className="text-xl font-black text-[#172B4D] mt-0.5">
                {summary.overallUnit1Marks} <span className="text-xs text-[#64748B] font-normal">/{summary.overallUnit1Max}</span>
              </div>
              <div className="text-[11px] text-[#0094B3] font-semibold">{summary.overallUnit1Percentage}%</div>
            </div>

            <div className="bg-[#F5F9FC] p-4 rounded-2xl border border-[#D7E3EA]">
              <div className="text-xs font-bold text-[#0B1F3A]">Overall Unit 2 Average</div>
              <div className="text-xl font-black text-[#172B4D] mt-0.5">
                {summary.overallUnit2Marks} <span className="text-xs text-[#64748B] font-normal">/{summary.overallUnit2Max}</span>
              </div>
              <div className="text-[11px] text-[#00D9FF] font-semibold">{summary.overallUnit2Percentage}%</div>
            </div>

            <div className="bg-[#DCFCE7] p-4 rounded-2xl border border-[#BBF7D0]">
              <div className="text-xs font-bold text-[#16A34A]">Overall Subject Average</div>
              <div className="text-xl font-black text-[#16A34A] mt-0.5">
                {summary.overallAverageMarks} <span className="text-xs text-[#16A34A] font-normal">/{summary.overallAverageMax}</span>
              </div>
              <div className="text-[11px] text-[#16A34A] font-bold">{summary.overallAveragePercentage}% ({summary.overallRating})</div>
            </div>

            <div className="bg-[#F5F9FC] p-4 rounded-2xl border border-[#D7E3EA]">
              <div className="text-xs font-bold text-[#64748B]">Progress / Trend</div>
              <div className="text-xl font-black text-[#172B4D] mt-0.5 flex items-center gap-1">
                {isImproved && <span className="text-[#22C55E]">+{summary.overallImprovementDelta}% 📈</span>}
                {isDeclined && <span className="text-[#EF4444]">{summary.overallImprovementDelta}% 📉</span>}
                {!isImproved && !isDeclined && <span className="text-[#64748B]">0% ➡️</span>}
              </div>
              <div className="text-[11px] text-[#64748B] font-medium">Status: {summary.overallTrend}</div>
            </div>
          </div>

          {/* 3. Strong vs Weak Subject Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {summary.highestSubject && (
              <div className="p-4 rounded-2xl bg-[#DCFCE7]/60 border border-[#BBF7D0] flex items-start gap-3">
                <div className="p-2 bg-[#DCFCE7] text-[#16A34A] rounded-xl shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#16A34A]">Strongest Subject</div>
                  <div className="text-sm font-bold text-[#172B4D] mt-0.5">
                    {summary.highestSubject.subject.subjectName} ({summary.highestSubject.averagePercentage}%)
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Average score: {summary.highestSubject.averageMarks}/{summary.highestSubject.averageMaxMarks} (Unit 1: {summary.highestSubject.unit1Marks}/{summary.highestSubject.unit1MaxMarks}, Unit 2: {summary.highestSubject.unit2Marks}/{summary.highestSubject.unit2MaxMarks})
                  </p>
                </div>
              </div>
            )}

            {summary.lowestSubject && (
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
                <div className="p-2 bg-amber-100 text-[#F59E0B] rounded-xl shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-900">Requires Focus</div>
                  <div className="text-sm font-bold text-[#172B4D] mt-0.5">
                    {summary.lowestSubject.subject.subjectName} ({summary.lowestSubject.averagePercentage}%)
                  </div>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Average score: {summary.lowestSubject.averageMarks}/{summary.lowestSubject.averageMaxMarks}. Remedial attention recommended.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 4. Subject-Wise Marks & Performance Table */}
          <div className="bg-white rounded-2xl border border-[#D7E3EA] overflow-hidden shadow-xs">
            <div className="px-4 py-3 bg-[#F5F9FC] border-b border-[#D7E3EA] flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#172B4D] uppercase tracking-wider">
                Subject-Wise Marks &amp; Auto-Calculations
              </h3>
              <span className="text-[11px] text-[#64748B] font-semibold">{summary.details.length} Registered Subjects</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#64748B] divide-y divide-[#D7E3EA]">
                <thead className="bg-[#F5F9FC] text-[#0B1F3A] font-bold text-[11px]">
                  <tr>
                    <th className="px-4 py-2.5">Subject</th>
                    <th className="px-3 py-2.5 text-center">Unit 1</th>
                    <th className="px-3 py-2.5 text-center">Unit 2</th>
                    <th className="px-3 py-2.5 text-center">Subject Average</th>
                    <th className="px-3 py-2.5 text-right">Avg %</th>
                    <th className="px-3 py-2.5 text-center">Performance</th>
                    <th className="px-3 py-2.5 text-center">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D7E3EA]">
                  {summary.details.map((d) => {
                    const subBadge = getPerformanceBadgeClasses(d.rating);
                    return (
                      <tr key={d.subject.id} className="hover:bg-[#F5F9FC] transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-[#172B4D]">{d.subject.subjectName}</div>
                          <span className="text-[10px] font-mono text-[#0094B3]">{d.subject.subjectCode}</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-semibold text-[#172B4D]">{d.unit1Marks}/{d.unit1MaxMarks}</span>
                          <div className="text-[10px] text-[#64748B]">({d.unit1Percentage}%)</div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-semibold text-[#172B4D]">{d.unit2Marks}/{d.unit2MaxMarks}</span>
                          <div className="text-[10px] text-[#64748B]">({d.unit2Percentage}%)</div>
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-[#172B4D] bg-[#F5F9FC]">
                          {d.averageMarks}/{d.averageMaxMarks}
                        </td>
                        <td className="px-3 py-3 text-right font-black text-[#172B4D]">
                          {d.averagePercentage}%
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${subBadge.bg}`}>
                            {d.rating}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          {d.trend === 'Improved' && (
                            <span className="text-[#22C55E] font-bold text-[11px]">
                              +{d.improvementPercentage}% 📈
                            </span>
                          )}
                          {d.trend === 'Declined' && (
                            <span className="text-[#EF4444] font-bold text-[11px]">
                              {d.improvementPercentage}% 📉
                            </span>
                          )}
                          {d.trend === 'Consistent' && (
                            <span className="text-[#64748B] font-medium text-[11px]">
                              0% ➡️
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. Subject Comparison Chart */}
          {subjectChartData.length > 0 && (
            <div className="bg-[#F5F9FC] p-5 rounded-2xl border border-[#D7E3EA]">
              <h3 className="text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-3">
                Unit 1 vs Unit 2 vs Average Chart
              </h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D7E3EA" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#64748B' }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748B' }} />
                    <Tooltip
                      formatter={(val: number) => [`${val}%`, 'Score']}
                      labelFormatter={(label) => {
                        const item = subjectChartData.find((x) => x.name === label);
                        return item ? `${item.fullName} (${label})` : label;
                      }}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #D7E3EA',
                        fontSize: '11px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="unit1" name="Unit 1 %" fill="#0B1F3A" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="unit2" name="Unit 2 %" fill="#00D9FF" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="average" name="Subject Avg %" fill="#22C55E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 6. Automated Academic Performance Analysis */}
          <div className="p-5 rounded-2xl bg-[#F5F9FC] border border-[#D7E3EA] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#0B1F3A] font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#00D9FF]" />
                <span>Automated Academic Performance Analysis</span>
              </div>
              <button
                onClick={handleGenerateAiAdvice}
                disabled={loadingAi}
                className="text-[11px] text-[#0094B3] hover:text-[#0B1F3A] font-bold flex items-center gap-1 cursor-pointer"
              >
                {loadingAi ? 'Analyzing...' : 'Refresh AI Analysis'}
              </button>
            </div>
            <p className="text-xs text-[#172B4D] leading-relaxed">
              {aiAdvice || summary.generatedAnalysis}
            </p>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="bg-[#F5F9FC] px-6 py-4 border-t border-[#D7E3EA] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedStudentForMarks(student);
                setSelectedStudentProfile(null);
              }}
              className="px-4 py-2 text-xs font-bold text-[#0B1F3A] bg-white hover:bg-[#E2ECF4] border border-[#D7E3EA] rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              id="edit-marks-from-profile-btn"
            >
              <Edit className="w-3.5 h-3.5 text-[#0094B3]" />
              <span>Enter / Update Marks</span>
            </button>
            <button
              onClick={() => {
                setStudentFormModal({ isOpen: true, studentToEdit: student });
                setSelectedStudentProfile(null);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-[#172B4D] hover:bg-[#E2ECF4] bg-white border border-[#D7E3EA] rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              Edit Details
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => exportIndividualStudentPDF(summary)}
              className="px-4 py-2 text-xs font-bold text-white bg-[#0B1F3A] hover:bg-[#102A43] rounded-xl transition-all shadow-md shadow-[#0B1F3A]/20 flex items-center gap-1.5 cursor-pointer active:scale-95 border border-[#00D9FF]/30"
              id="export-pdf-profile-btn"
            >
              <Download className="w-3.5 h-3.5 text-[#00D9FF]" />
              <span>Export Report (PDF)</span>
            </button>

            <button
              onClick={() => {
                setSelectedStudentProfile(null);
                setAiAdvice(null);
              }}
              className="px-4 py-2 text-xs font-bold text-[#64748B] hover:bg-[#E2ECF4] hover:text-[#172B4D] rounded-xl transition-all cursor-pointer"
              id="close-profile-btn"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
