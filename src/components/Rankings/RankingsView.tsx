import React, { useState, useMemo } from 'react';
import { useAcademic } from '../../context/AcademicContext';
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Download,
  Filter,
  Eye,
  GraduationCap,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Department, AcademicYear } from '../../types';
import { getPerformanceBadgeClasses } from '../../utils/calculations';
import { exportSummariesToExcel } from '../../utils/excelExport';

export const RankingsView: React.FC = () => {
  const { allSummaries, setSelectedStudentProfile } = useAcademic();

  const [deptFilter, setDeptFilter] = useState<Department | 'All'>('All');
  const [yearFilter, setYearFilter] = useState<AcademicYear | 'All'>('All');

  const rankedSummaries = useMemo(() => {
    return allSummaries
      .filter((s) => {
        const matchesDept = deptFilter === 'All' || s.student.department === deptFilter;
        const matchesYear = yearFilter === 'All' || s.student.year === yearFilter;
        return matchesDept && matchesYear;
      })
      .sort((a, b) => b.overallAveragePercentage - a.overallAveragePercentage);
  }, [allSummaries, deptFilter, yearFilter]);

  const top1 = rankedSummaries[0];
  const top2 = rankedSummaries[1];
  const top3 = rankedSummaries[2];

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="rankings-view">
      
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#D7E3EA] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-black text-[#172B4D] tracking-tight">
              Academic Merit Leaderboard
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-[#F5F9FC] text-[#0B1F3A] rounded-full border border-[#00D9FF]/40 flex items-center gap-1">
              <Trophy className="w-3 h-3 text-[#0094B3]" /> Rank Standings
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Real-time student rankings calculated from Unit 1 and Unit 2 examination assessments
          </p>
        </div>

        <button
          onClick={() =>
            exportSummariesToExcel(
              rankedSummaries,
              `Merit_Leaderboard_${deptFilter}_${yearFilter}.xlsx`
            )
          }
          className="px-4 py-2.5 text-xs font-bold bg-[#0B1F3A] hover:bg-[#102A43] text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95 border border-[#00D9FF]/30 cursor-pointer"
          id="export-leaderboard-btn"
        >
          <Download className="w-4 h-4 text-[#00D9FF]" />
          <span>Export Leaderboard (.xlsx)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D7E3EA] shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
            Department Scope
          </label>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value as any)}
            className="w-full px-3.5 py-2.5 bg-[#F5F9FC] text-xs font-semibold text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:border-[#00D9FF] focus:bg-white outline-none cursor-pointer"
            id="ranking-dept-filter"
          >
            <option value="All">All College Departments</option>
            <option value="Computer Engineering">Computer Engineering</option>
            <option value="Civil Engineering">Civil Engineering</option>
            <option value="Mechanical Engineering">Mechanical Engineering</option>
            <option value="Electrical Engineering">Electrical Engineering</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
            Academic Year
          </label>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value as any)}
            className="w-full px-3.5 py-2.5 bg-[#F5F9FC] text-xs font-semibold text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:border-[#00D9FF] focus:bg-white outline-none cursor-pointer"
            id="ranking-year-filter"
          >
            <option value="All">All Academic Years</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="2nd Year DSY">2nd Year DSY</option>
          </select>
        </div>
      </div>

      {/* Podium Display (Top 3) */}
      {rankedSummaries.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4">
          
          {/* 2nd Place */}
          {top2 && (
            <div
              onClick={() => setSelectedStudentProfile(top2.student)}
              className="bg-white p-5 rounded-2xl border-2 border-[#D7E3EA] shadow-xs text-center relative cursor-pointer hover:border-[#00D9FF] hover:shadow-md transition-all order-2 md:order-1"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#F5F9FC] text-[#0B1F3A] border border-[#D7E3EA] mx-auto flex items-center justify-center font-black text-lg mb-2 shadow-xs">
                🥈
              </div>
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#F5F9FC] text-[#0B1F3A] border border-[#D7E3EA] rounded-full">
                Rank #2 (Silver)
              </span>
              <h3 className="font-bold text-[#172B4D] text-base mt-2">{top2.student.name}</h3>
              <p className="text-xs text-[#64748B]">{top2.student.department} • {top2.student.year}</p>
              <div className="text-2xl font-black text-[#172B4D] mt-2">{top2.overallAveragePercentage}%</div>
              <div className="text-[11px] text-[#16A34A] font-bold mt-0.5">+{top2.overallImprovementDelta}% Growth</div>
            </div>
          )}

          {/* 1st Place (Gold Champion) */}
          {top1 && (
            <div
              onClick={() => setSelectedStudentProfile(top1.student)}
              className="bg-[#0B1F3A] p-6 rounded-2xl border-2 border-[#00D9FF] shadow-xl text-center relative cursor-pointer hover:scale-[1.02] transition-all order-1 md:order-2 ring-4 ring-[#00D9FF]/20 transform md:-translate-y-2 text-white"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#102A43] text-[#00D9FF] border border-[#00D9FF]/50 mx-auto flex items-center justify-center font-black text-2xl mb-2 shadow-lg">
                👑
              </div>
              <span className="px-3 py-1 text-xs font-black bg-[#00D9FF] text-[#071426] rounded-full uppercase tracking-wider">
                Rank #1 College Topper
              </span>
              <h3 className="font-black text-white text-lg mt-2">{top1.student.name}</h3>
              <p className="text-xs text-[#67E8F9] font-medium">{top1.student.department} • {top1.student.year}</p>
              <div className="text-3xl font-black text-[#00D9FF] mt-2">{top1.overallAveragePercentage}%</div>
              <div className="text-xs text-[#67E8F9] font-bold mt-0.5">+{top1.overallImprovementDelta}% Unit 2 Surge</div>
            </div>
          )}

          {/* 3rd Place */}
          {top3 && (
            <div
              onClick={() => setSelectedStudentProfile(top3.student)}
              className="bg-white p-5 rounded-2xl border-2 border-[#D7E3EA] shadow-xs text-center relative cursor-pointer hover:border-[#00D9FF] hover:shadow-md transition-all order-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#F5F9FC] text-[#0B1F3A] border border-[#D7E3EA] mx-auto flex items-center justify-center font-black text-lg mb-2 shadow-xs">
                🥉
              </div>
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#F5F9FC] text-[#0B1F3A] border border-[#D7E3EA] rounded-full">
                Rank #3 (Bronze)
              </span>
              <h3 className="font-bold text-[#172B4D] text-base mt-2">{top3.student.name}</h3>
              <p className="text-xs text-[#64748B]">{top3.student.department} • {top3.student.year}</p>
              <div className="text-2xl font-black text-[#172B4D] mt-2">{top3.overallAveragePercentage}%</div>
              <div className="text-[11px] text-[#16A34A] font-bold mt-0.5">+{top3.overallImprovementDelta}% Growth</div>
            </div>
          )}

        </div>
      )}

      {/* Complete Merit List Table */}
      <div className="bg-white rounded-2xl border border-[#D7E3EA] shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-[#F5F9FC] border-b border-[#D7E3EA] flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#172B4D] uppercase tracking-wider">
            Complete Merit Order List ({rankedSummaries.length} Students Ranked)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#172B4D] divide-y divide-[#D7E3EA]">
            <thead className="bg-[#F5F9FC] font-bold text-[#0B1F3A] text-[11px]">
              <tr>
                <th className="px-4 py-3 text-center">Rank</th>
                <th className="px-4 py-3">Roll No</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Department &amp; Year</th>
                <th className="px-3 py-3 text-center">Unit 1 %</th>
                <th className="px-3 py-3 text-center">Unit 2 %</th>
                <th className="px-4 py-3 text-right">Overall Average %</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D7E3EA] bg-white">
              {rankedSummaries.map((s, index) => {
                const rank = index + 1;
                const badge = getPerformanceBadgeClasses(s.overallRating);
                const isTop3 = rank <= 3;

                return (
                  <tr
                    key={s.student.id}
                    className={`hover:bg-[#F5F9FC] transition-colors ${
                      isTop3 ? 'bg-[#F5F9FC]/60' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-center">
                      {rank === 1 ? (
                        <span className="w-6 h-6 rounded-full bg-[#0B1F3A] text-[#00D9FF] border border-[#00D9FF]/40 font-black text-xs inline-flex items-center justify-center shadow-xs">
                          1
                        </span>
                      ) : rank === 2 ? (
                        <span className="w-6 h-6 rounded-full bg-[#102A43] text-white font-bold text-xs inline-flex items-center justify-center">
                          2
                        </span>
                      ) : rank === 3 ? (
                        <span className="w-6 h-6 rounded-full bg-[#0094B3] text-white font-bold text-xs inline-flex items-center justify-center">
                          3
                        </span>
                      ) : (
                        <span className="font-semibold text-[#64748B] font-mono">#{rank}</span>
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono font-medium text-[#172B4D]">
                      {s.student.rollNumber}
                    </td>

                    <td className="px-4 py-3">
                      <div
                        onClick={() => setSelectedStudentProfile(s.student)}
                        className="font-bold text-[#172B4D] hover:text-[#0094B3] cursor-pointer transition-colors"
                      >
                        {s.student.name}
                      </div>
                      <div className="text-[10px] text-[#64748B] font-mono">PRN: {s.student.prn}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-[#172B4D]">{s.student.department}</div>
                      <div className="text-[11px] text-[#64748B]">{s.student.year}</div>
                    </td>

                    <td className="px-3 py-3 text-center font-medium text-[#172B4D]">
                      {s.overallUnit1Percentage}%
                    </td>

                    <td className="px-3 py-3 text-center font-medium text-[#172B4D]">
                      {s.overallUnit2Percentage}%
                    </td>

                    <td className="px-4 py-3 text-right font-black text-sm text-[#172B4D]">
                      {s.overallAveragePercentage}%
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg}`}
                      >
                        {s.overallRating}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedStudentProfile(s.student)}
                        className="p-1.5 text-[#64748B] hover:text-[#0B1F3A] hover:bg-[#F5F9FC] rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-semibold cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
