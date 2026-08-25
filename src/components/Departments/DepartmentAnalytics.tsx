import React, { useState } from 'react';
import { useAcademic } from '../../context/AcademicContext';
import {
  Building2,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  Trophy,
  AlertTriangle,
  Download,
  BookOpen,
  CheckCircle,
  GraduationCap,
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
import { Department, AcademicYear } from '../../types';
import { exportDepartmentSummaryPDF } from '../../utils/pdfExport';

export const DepartmentAnalytics: React.FC = () => {
  const { getDepartmentYearStats, allSummaries, setSelectedStudentProfile } = useAcademic();

  const [selectedDept, setSelectedDept] = useState<Department>('Computer Engineering');
  const [selectedYear, setSelectedYear] = useState<AcademicYear>('2nd Year');

  const stats = getDepartmentYearStats(selectedDept, selectedYear);

  const relevantSummaries = allSummaries.filter(
    (s) => s.student.department === selectedDept && s.student.year === selectedYear
  );

  // Subject chart data
  const subjectChartData = stats.subjectAverages.map((sa) => ({
    name: sa.subject.subjectCode,
    fullName: sa.subject.subjectName,
    unit1: sa.unit1Avg,
    unit2: sa.unit2Avg,
    overall: sa.overallAvg,
    passRate: sa.passPercentage,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="department-analytics-view">
      
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#D7E3EA] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#172B4D] tracking-tight">
              Department & Year Academic Analytics
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-[#F5F9FC] text-[#0B1F3A] rounded-full border border-[#D7E3EA]">
              In-Depth Evaluation
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Cohort performance, subject pass metrics, and unit test progress
          </p>
        </div>

        <button
          onClick={() => exportDepartmentSummaryPDF(stats, relevantSummaries)}
          className="px-4 py-2 text-xs font-semibold bg-[#0B1F3A] hover:bg-[#102A43] text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 shadow-[#0B1F3A]/20 active:scale-95 border border-[#00D9FF]/30"
          id="export-dept-pdf-btn"
        >
          <Download className="w-4 h-4 text-[#00D9FF]" />
          <span>Export Department PDF Report</span>
        </button>
      </div>

      {/* Selectors */}
      <div className="bg-white p-4 rounded-2xl border border-[#D7E3EA] shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1">
            Select Department
          </label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value as Department)}
            className="w-full px-3.5 py-2.5 bg-[#F5F9FC] text-xs font-semibold text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:border-[#00D9FF] focus:bg-white outline-none"
            id="dept-analytics-dept-select"
          >
            <option value="Computer Engineering">Computer Engineering</option>
            <option value="Civil Engineering">Civil Engineering</option>
            <option value="Mechanical Engineering">Mechanical Engineering</option>
            <option value="Electrical Engineering">Electrical Engineering</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1">
            Select Academic Year
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value as AcademicYear)}
            className="w-full px-3.5 py-2.5 bg-[#F5F9FC] text-xs font-semibold text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:border-[#00D9FF] focus:bg-white outline-none"
            id="dept-analytics-year-select"
          >
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="2nd Year DSY">2nd Year DSY (Direct 2nd Year)</option>
          </select>
        </div>
      </div>

      {/* 6 Key Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-[#D7E3EA] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B]">Cohort Size</div>
          <div className="text-2xl font-bold text-[#172B4D] mt-1">{stats.totalStudents} Students</div>
          <div className="text-[10px] text-[#64748B] mt-1">{selectedDept.split(' ')[0]} ({selectedYear})</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#D7E3EA] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B]">Unit 1 Class Avg</div>
          <div className="text-2xl font-bold text-[#0B1F3A] mt-1">{stats.avgUnit1Percentage}%</div>
          <div className="text-[10px] text-[#64748B] mt-1">Assessment 1 Benchmark</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#D7E3EA] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B]">Unit 2 Class Avg</div>
          <div className="text-2xl font-bold text-[#0094B3] mt-1">{stats.avgUnit2Percentage}%</div>
          <div className="text-[10px] text-[#64748B] mt-1">Assessment 2 Benchmark</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#D7E3EA] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B]">Overall Class Avg</div>
          <div className="text-2xl font-black text-[#0B1F3A] mt-1">{stats.overallAveragePercentage}%</div>
          <div className="text-[10px] text-[#64748B] mt-1">Aggregate Standing</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#D7E3EA] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B]">Improved in Unit 2</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.improvedCount}</div>
          <div className="text-[10px] text-emerald-700 font-medium mt-1">📈 Positive Growth</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#D7E3EA] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B]">Declined in Unit 2</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">{stats.declinedCount}</div>
          <div className="text-[10px] text-rose-700 font-medium mt-1">📉 Requires Review</div>
        </div>

      </div>

      {/* Class Topper Spotlight & Low Performer Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.highestStudent && (
          <div className="bg-[#F5F9FC] p-4 rounded-2xl border border-[#D7E3EA] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] text-[#00D9FF] flex items-center justify-center font-bold shadow-md shadow-[#0B1F3A]/20">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#0B1F3A] uppercase tracking-wider">
                  Class Topper (Rank #1)
                </span>
                <div
                  onClick={() => setSelectedStudentProfile(stats.highestStudent!.student)}
                  className="font-bold text-[#172B4D] text-sm hover:text-[#0094B3] cursor-pointer transition-colors"
                >
                  {stats.highestStudent.student.name} ({stats.highestStudent.student.rollNumber})
                </div>
                <div className="text-xs text-[#64748B] font-mono">
                  PRN: {stats.highestStudent.student.prn}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-[#0B1F3A]">{stats.highestStudent.percentage}%</div>
              <span className="text-[10px] font-semibold text-[#64748B]">Highest Score</span>
            </div>
          </div>
        )}

        {stats.lowestStudent && (
          <div className="bg-rose-50/40 p-4 rounded-2xl border border-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold shadow-md shadow-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                  Lowest Performing Student
                </span>
                <div
                  onClick={() => setSelectedStudentProfile(stats.lowestStudent!.student)}
                  className="font-bold text-[#172B4D] text-sm hover:text-rose-600 cursor-pointer transition-colors"
                >
                  {stats.lowestStudent.student.name} ({stats.lowestStudent.student.rollNumber})
                </div>
                <div className="text-xs text-rose-600 font-medium">Needs remedial faculty guidance</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-rose-700">{stats.lowestStudent.percentage}%</div>
              <span className="text-[10px] font-semibold text-rose-800">Overall Score</span>
            </div>
          </div>
        )}
      </div>

      {/* Subject-Wise Analysis Table & Charts */}
      <div className="bg-white rounded-2xl border border-[#D7E3EA] shadow-xs overflow-hidden">
        <div className="p-4 bg-[#F5F9FC] border-b border-[#D7E3EA] flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
              Subject Examination Analytics ({selectedDept} • {selectedYear})
            </h3>
            <p className="text-xs text-[#64748B]">
              Average scores and pass percentage per subject for this cohort
            </p>
          </div>
        </div>

        {stats.subjectAverages.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#64748B] divide-y divide-[#D7E3EA]">
                <thead className="bg-[#F5F9FC] text-[#0B1F3A] font-semibold text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Subject Code</th>
                    <th className="px-4 py-3">Subject Name</th>
                    <th className="px-3 py-3 text-center">Unit 1 Class Avg (%)</th>
                    <th className="px-3 py-3 text-center">Unit 2 Class Avg (%)</th>
                    <th className="px-3 py-3 text-center">Overall Avg (%)</th>
                    <th className="px-3 py-3 text-right">Pass Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D7E3EA] bg-white">
                  {stats.subjectAverages.map((sa) => (
                    <tr key={sa.subject.id} className="hover:bg-[#F5F9FC] transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-[#0B1F3A]">
                        {sa.subject.subjectCode}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#172B4D]">
                        {sa.subject.subjectName}
                      </td>
                      <td className="px-3 py-3 text-center font-semibold text-[#0B1F3A]">
                        {sa.unit1Avg}%
                      </td>
                      <td className="px-3 py-3 text-center font-semibold text-[#0094B3]">
                        {sa.unit2Avg}%
                      </td>
                      <td className="px-3 py-3 text-center font-black text-[#172B4D]">
                        {sa.overallAvg}%
                      </td>
                      <td className="px-3 py-3 text-right font-bold">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] ${
                            sa.passPercentage >= 75
                              ? 'bg-emerald-100 text-emerald-800'
                              : sa.passPercentage >= 50
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {sa.passPercentage}% Pass
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Subject Chart */}
            <div className="p-5 border-t border-[#D7E3EA]">
              <h4 className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider mb-3">
                Subject Comparative Graph (Unit 1 vs Unit 2 vs Overall)
              </h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D7E3EA" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const fullName = payload[0]?.payload.fullName;
                          return (
                            <div className="bg-[#0B1F3A] text-white p-2.5 rounded-xl shadow-xl text-xs border border-[#00D9FF]/30">
                              <div className="font-bold text-white mb-1">{fullName} ({label})</div>
                              <div className="text-[#67E8F9]">Unit 1 Avg: {payload[0]?.value}%</div>
                              <div className="text-[#00D9FF]">Unit 2 Avg: {payload[1]?.value}%</div>
                              <div className="text-white font-semibold mt-1">Overall Avg: {payload[2]?.value}%</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="unit1" name="Unit 1 Avg (%)" fill="#0B1F3A" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="unit2" name="Unit 2 Avg (%)" fill="#00D9FF" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="overall" name="Overall Avg (%)" fill="#102A43" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-[#64748B]">
            No subject data recorded for {selectedDept} ({selectedYear}).
          </div>
        )}
      </div>

    </div>
  );
};
