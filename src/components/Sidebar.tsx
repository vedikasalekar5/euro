import React from 'react';
import { useAcademic } from '../context/AcademicContext';
import { useAuth } from '../context/AuthContext';
import { CollegeLogo } from '../assets/collegeLogo';
import {
  LayoutDashboard,
  UserPlus,
  Users,
  FileEdit,
  UserCircle,
  LogOut,
  Sparkles,
  BookOpen,
  TrendingUp,
  GraduationCap,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { activeTab, setActiveTab } = useAcademic();
  const { currentTeacher, logout } = useAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'courses',
      label: 'My Course',
      icon: BookOpen,
    },
    {
      id: 'students',
      label: 'Students',
      icon: UserPlus,
    },
    {
      id: 'all-students',
      label: 'All Students',
      icon: Users,
    },
    {
      id: 'marks-allocation',
      label: 'Marks Allocation',
      icon: FileEdit,
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: TrendingUp,
    },
    {
      id: 'my-profile',
      label: 'Profile',
      icon: UserCircle,
    },
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileOpen(false);
  };

  const handleLogoutClick = () => {
    logout();
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-[#071426]/80 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Fixed Sidebar Container - Deep Navy + Bright Cyan Theme */}
      <aside
        className={`fixed lg:static top-0 left-0 z-40 h-full w-64 shrink-0 bg-[#0B1F3A] text-white flex flex-col border-r border-[#102A43] shadow-2xl lg:shadow-none transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        id="app-sidebar"
      >
        {/* Header - EURO MANDAR Branding & Guidance */}
        <div className="p-4 border-b border-[#102A43] flex flex-col gap-2.5 bg-[#071426]/50">
          <div className="flex items-center gap-3">
            <CollegeLogo className="w-10 h-10 shadow-md ring-2 ring-[#00D9FF]/40 shrink-0 rounded-xl" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-black text-white tracking-wider font-sans truncate">
                  EURO MANDAR
                </h2>
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] animate-pulse" />
              </div>
              <p className="text-[11px] text-[#67E8F9] font-medium truncate" title="EURO MANDAR Management System">
                Unit Test Management
              </p>
            </div>
          </div>
          
          <div className="px-2.5 py-1.5 bg-[#102A43]/80 rounded-xl border border-[#00D9FF]/20 text-[11px] text-[#D7E3EA]">
            <span className="text-[10px] text-[#67E8F9]/80 block font-medium">Under the Guidance of</span>
            <span className="font-bold text-white">Prof. Sandesh A. Gajmal</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto" id="sidebar-navigation-menu">
          <div className="px-3 pb-2 text-[10px] font-bold text-[#67E8F9]/70 uppercase tracking-widest flex items-center justify-between">
            <span>Navigation</span>
            <span className="w-8 h-[1px] bg-[#00D9FF]/30" />
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id ||
              (item.id === 'dashboard' && activeTab === 'teacher-dashboard') ||
              (item.id === 'courses' && (activeTab === 'my-courses' || activeTab === 'subjects' || activeTab === 'add-course')) ||
              (item.id === 'marks-allocation' && (activeTab === 'batch-marks' || activeTab === 'enter-marks')) ||
              (item.id === 'my-profile' && activeTab === 'profile');

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all text-left cursor-pointer group relative overflow-hidden ${
                  isActive
                    ? 'bg-[#102A43] text-white font-semibold border border-[#00D9FF]/60 shadow-lg shadow-[#00D9FF]/10'
                    : 'text-[#D7E3EA]/80 hover:bg-[#102A43]/60 hover:text-white hover:border-[#00D9FF]/20 border border-transparent'
                }`}
                id={`sidebar-nav-${item.id}`}
              >
                {/* Active cyan left indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#00D9FF] rounded-r-full shadow-[0_0_8px_#00D9FF]" />
                )}

                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-[#00D9FF]' : 'text-[#67E8F9]/70 group-hover:text-[#00D9FF]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00D9FF] shadow-[0_0_6px_#00D9FF]" />
                )}
              </button>
            );
          })}

          <div className="pt-3 mt-3 border-t border-[#102A43]">
            <button
              onClick={handleLogoutClick}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-[#F87171] hover:bg-rose-950/40 hover:text-rose-200 border border-transparent hover:border-rose-800/40 transition-all text-left cursor-pointer group"
              id="sidebar-nav-logout"
            >
              <LogOut className="w-4 h-4 shrink-0 text-[#F87171] group-hover:translate-x-0.5 transition-transform" />
              <span>Logout</span>
            </button>
          </div>
        </nav>

        {/* Teacher Profile Footer Badge */}
        {currentTeacher && (
          <button
            onClick={() => handleNavClick('my-profile')}
            className="p-3 border border-[#102A43] hover:border-[#00D9FF]/50 bg-[#071426]/70 hover:bg-[#102A43] m-2.5 rounded-2xl flex items-center justify-between gap-3 text-left transition-all cursor-pointer group shadow-sm"
            id="sidebar-profile-card"
            title="View Profile"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {currentTeacher.photo_url || currentTeacher.photoUrl || currentTeacher.avatar ? (
                <img
                  src={currentTeacher.photo_url || currentTeacher.photoUrl || currentTeacher.avatar}
                  alt={currentTeacher.name}
                  className="w-8 h-8 rounded-lg object-cover ring-1 ring-[#00D9FF]/40 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[#102A43] border border-[#00D9FF]/40 text-[#00D9FF] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  {currentTeacher.name ? currentTeacher.name.charAt(0) : 'T'}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate group-hover:text-[#67E8F9] transition-colors">
                  {currentTeacher.name}
                </div>
                <div className="text-[10px] font-mono text-[#67E8F9]/80 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-[#00D9FF]" />
                  <span>{currentTeacher.teacher_id}</span>
                </div>
              </div>
            </div>
            <UserCircle className="w-4 h-4 text-[#67E8F9]/60 group-hover:text-[#00D9FF] shrink-0 transition-colors" />
          </button>
        )}
      </aside>
    </>
  );
};
