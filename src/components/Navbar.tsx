import React, { useState, useRef, useEffect } from 'react';
import { useAcademic } from '../context/AcademicContext';
import { useAuth } from '../context/AuthContext';
import { CollegeLogo } from '../assets/collegeLogo';
import {
  Search,
  UserPlus,
  Edit3,
  Menu,
  Sparkles,
  LogOut,
  User,
  GraduationCap,
} from 'lucide-react';
import { getPerformanceBadgeClasses } from '../utils/calculations';

interface NavbarProps {
  onToggleMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar }) => {
  const {
    allSummaries,
    setSelectedStudentProfile,
    setStudentFormModal,
    setActiveTab,
  } = useAcademic();

  const { currentTeacher, logout } = useAuth();

  const [searchVal, setSearchVal] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = searchVal.trim()
    ? allSummaries
        .filter((s) => {
          const q = searchVal.toLowerCase();
          const name = (s.student.student_name || s.student.name || '').toLowerCase();
          const enroll = (s.student.enrollment_number || s.student.enrollmentNo || '').toLowerCase();
          const bt = (s.student.bt_no || s.student.btNo || '').toLowerCase();
          const dept = (s.student.department || '').toLowerCase();
          return name.includes(q) || enroll.includes(q) || bt.includes(q) || dept.includes(q);
        })
        .slice(0, 6)
    : [];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#D7E3EA] shadow-xs" id="top-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Left: Mobile Toggle & Brand Identity */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-xl text-[#64748B] hover:text-[#0B1F3A] hover:bg-[#F5F9FC] transition-colors"
              id="mobile-sidebar-toggle-btn"
              aria-label="Toggle navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div
              className="flex items-center gap-3 cursor-pointer select-none"
              onClick={() => setActiveTab('dashboard')}
              id="navbar-brand-logo"
            >
              <CollegeLogo className="w-9 h-9 shadow-xs ring-2 ring-[#00D9FF]/30 rounded-full" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold text-[#0B1F3A] tracking-tight">
                    EURO MANDAR
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#00D9FF]" />
                </div>
                <p className="text-[11px] text-[#64748B] hidden md:block">
                  Rajaram Shinde Institute of Engineering & Technology
                </p>
              </div>
            </div>
          </div>

          {/* Center: Live Student Search Bar */}
          <div className="flex-1 max-w-md relative" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              <input
                type="text"
                value={searchVal}
                onChange={(e) => {
                  setSearchVal(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Search Student Name, Enrollment No..."
                className="w-full pl-10 pr-4 py-2 bg-[#F5F9FC] hover:bg-white focus:bg-white text-xs sm:text-sm text-[#172B4D] placeholder-[#64748B] rounded-xl border border-[#D7E3EA] focus:border-[#00D9FF] focus:ring-2 focus:ring-[#00D9FF]/20 transition-all outline-none"
                id="global-student-search-input"
              />
              {searchVal && (
                <button
                  onClick={() => {
                    setSearchVal('');
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#0B1F3A] hover:text-[#0B1F3A] px-1.5 py-0.5 rounded bg-[#67E8F9]/30 font-mono font-bold"
                >
                  ESC
                </button>
              )}
            </div>

            {/* Live Search Popup */}
            {isSearchOpen && searchVal.trim() && (
              <div
                className="absolute left-0 right-0 mt-2 bg-white border border-[#D7E3EA] rounded-2xl shadow-xl overflow-hidden z-50 divide-y divide-[#F5F9FC] animate-in fade-in slide-in-from-top-2 duration-150"
                id="search-results-dropdown"
              >
                <div className="px-3.5 py-2 text-xs font-semibold text-[#64748B] uppercase tracking-wider bg-[#F5F9FC] flex items-center justify-between border-b border-[#D7E3EA]">
                  <span className="text-[#0B1F3A] font-bold">Search Results ({searchResults.length})</span>
                  <span className="text-[11px] text-[#64748B] lowercase">Click to open profile</span>
                </div>

                {searchResults.length > 0 ? (
                  searchResults.map((summary) => {
                    const badge = getPerformanceBadgeClasses(summary.overallRating);
                    const stdName = summary.student.student_name || summary.student.name || 'Student';
                    const enroll = summary.student.enrollment_number || summary.student.enrollmentNo;

                    return (
                      <div
                        key={summary.student.id}
                        onClick={() => {
                          setSelectedStudentProfile(summary.student);
                          setIsSearchOpen(false);
                          setSearchVal('');
                        }}
                        className="px-3.5 py-2.5 hover:bg-[#F5F9FC] cursor-pointer flex items-center justify-between gap-3 transition-colors group"
                        id={`search-result-${summary.student.id}`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#172B4D] group-hover:text-[#00D9FF] transition-colors">
                              {stdName}
                            </span>
                            <span className="text-xs font-mono px-1.5 py-0.5 bg-[#F5F9FC] text-[#0B1F3A] rounded border border-[#D7E3EA]">
                              {enroll}
                            </span>
                          </div>
                          <p className="text-xs text-[#64748B] truncate mt-0.5">
                            {summary.student.department} • {summary.student.year}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-sm font-bold text-[#0B1F3A] font-mono">
                            {summary.overallAveragePercentage}%
                          </div>
                          <span
                            className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg}`}
                          >
                            {summary.overallRating}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-[#64748B]">
                    No student found matching "<span className="text-[#172B4D] font-semibold">{searchVal}</span>".
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Quick Action Buttons & Profile */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setStudentFormModal({ isOpen: true, studentToEdit: null })}
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#0B1F3A] hover:bg-[#102A43] hover:border-[#00D9FF] border border-[#102A43] rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
              id="navbar-add-student-btn"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#00D9FF]" />
              <span>Add Student</span>
            </button>

            <button
              onClick={() => setActiveTab('marks-allocation')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#0B1F3A] bg-[#F5F9FC] hover:bg-white border border-[#D7E3EA] hover:border-[#00D9FF] rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
              id="navbar-enter-marks-btn"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#0B1F3A]" />
              <span>Marks Allocation</span>
            </button>

            {/* Profile Badge */}
            {currentTeacher && (
              <button
                onClick={() => setActiveTab('my-profile')}
                className="flex items-center gap-2 p-1.5 pl-2 pr-3 rounded-xl bg-[#F5F9FC] hover:bg-white border border-[#D7E3EA] hover:border-[#00D9FF] text-left transition-all cursor-pointer group"
                id="navbar-teacher-profile-btn"
                title="Go to My Profile"
              >
                {currentTeacher.photo_url || currentTeacher.photoUrl || currentTeacher.avatar ? (
                  <img
                    src={currentTeacher.photo_url || currentTeacher.photoUrl || currentTeacher.avatar}
                    alt={currentTeacher.name}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-[#00D9FF]"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-[#0B1F3A] text-[#00D9FF] flex items-center justify-center font-bold text-xs border border-[#00D9FF]/30">
                    {currentTeacher.name ? currentTeacher.name.charAt(0) : 'T'}
                  </div>
                )}
                <div className="text-left hidden lg:block">
                  <div className="font-bold text-xs text-[#172B4D] truncate max-w-[120px]">
                    {currentTeacher.name}
                  </div>
                  <div className="text-[10px] text-[#0B1F3A] font-mono flex items-center gap-1 font-semibold">
                    <Sparkles className="w-2.5 h-2.5 text-[#00D9FF]" />
                    <span>{currentTeacher.teacher_id}</span>
                  </div>
                </div>
              </button>
            )}

            {/* Logout shortcut */}
            <button
              onClick={logout}
              className="p-2 rounded-xl text-[#64748B] hover:text-[#EF4444] hover:bg-[#F5F9FC] border border-transparent hover:border-[#D7E3EA] transition-colors"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
