import React from 'react';
import { useAcademic } from '../../context/AcademicContext';
import {
  LayoutDashboard,
  BookOpen,
  UserPlus,
  TrendingUp,
  UserCircle,
  MoreVertical,
  Users,
  FileEdit,
  Sparkles,
} from 'lucide-react';

interface AndroidBottomNavProps {
  onOpenMoreMenu: () => void;
  isMoreMenuOpen: boolean;
}

export const AndroidBottomNav: React.FC<AndroidBottomNavProps> = ({
  onOpenMoreMenu,
  isMoreMenuOpen,
}) => {
  const { activeTab, setActiveTab } = useAcademic();

  const mainNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      isActive: activeTab === 'dashboard' || activeTab === 'teacher-dashboard',
    },
    {
      id: 'courses',
      label: 'My Course',
      icon: BookOpen,
      isActive:
        activeTab === 'courses' ||
        activeTab === 'my-courses' ||
        activeTab === 'subjects' ||
        activeTab === 'add-course',
    },
    {
      id: 'students',
      label: 'Students',
      icon: UserPlus,
      isActive: activeTab === 'students',
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: TrendingUp,
      isActive: activeTab === 'performance',
    },
    {
      id: 'my-profile',
      label: 'Profile',
      icon: UserCircle,
      isActive: activeTab === 'my-profile' || activeTab === 'profile',
    },
  ];

  const isMoreActive =
    activeTab === 'all-students' ||
    activeTab === 'marks-allocation' ||
    activeTab === 'batch-marks' ||
    activeTab === 'enter-marks';

  return (
    <>
      {/* Android Bottom Navigation Bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B1F3A] border-t border-[#102A43] px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.25)] select-none"
        style={{ paddingBottom: 'calc(0.375rem + env(safe-area-inset-bottom, 0px))' }}
        id="android-bottom-navigation"
        aria-label="Mobile Bottom Navigation"
      >
        <div className="grid grid-cols-6 items-center justify-around max-w-lg mx-auto">
          {/* Main 5 Navigation Items */}
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = item.isActive && !isMoreMenuOpen;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                }}
                className={`relative flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all cursor-pointer group active:scale-90 ${
                  active ? 'text-[#00D9FF]' : 'text-[#8EA3BE] hover:text-white'
                }`}
                id={`bottom-nav-${item.id}`}
                aria-label={item.label}
              >
                {/* Active Indicator Capsule (Material 3 style) */}
                <div
                  className={`relative flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200 ${
                    active
                      ? 'bg-[#102A43] ring-1 ring-[#00D9FF]/40 shadow-[0_0_10px_rgba(0,217,255,0.25)]'
                      : 'bg-transparent group-hover:bg-[#102A43]/40'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      active ? 'scale-110 stroke-[2.5]' : 'scale-100 stroke-[1.75]'
                    }`}
                  />
                  {active && (
                    <span className="absolute -top-0.5 right-1 w-1.5 h-1.5 rounded-full bg-[#00D9FF] animate-pulse shadow-[0_0_6px_#00D9FF]" />
                  )}
                </div>
                <span
                  className={`text-[10.5px] font-medium tracking-tight mt-0.5 truncate max-w-[58px] ${
                    active ? 'text-white font-bold' : 'text-[#8EA3BE]'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* More Drawer Action Button (for All Students & Marks Allocation) */}
          <button
            type="button"
            onClick={onOpenMoreMenu}
            className={`relative flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all cursor-pointer group active:scale-90 ${
              isMoreMenuOpen || isMoreActive
                ? 'text-[#00D9FF]'
                : 'text-[#8EA3BE] hover:text-white'
            }`}
            id="bottom-nav-more"
            aria-label="More Features"
          >
            <div
              className={`relative flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200 ${
                isMoreMenuOpen || isMoreActive
                  ? 'bg-[#102A43] ring-1 ring-[#00D9FF]/40 shadow-[0_0_10px_rgba(0,217,255,0.25)]'
                  : 'bg-transparent group-hover:bg-[#102A43]/40'
              }`}
            >
              <MoreVertical
                className={`w-5 h-5 transition-transform duration-200 ${
                  isMoreMenuOpen || isMoreActive ? 'scale-110 stroke-[2.5]' : 'scale-100 stroke-[1.75]'
                }`}
              />
              {isMoreActive && (
                <span className="absolute -top-0.5 right-1 w-1.5 h-1.5 rounded-full bg-[#00D9FF] shadow-[0_0_6px_#00D9FF]" />
              )}
            </div>
            <span
              className={`text-[10.5px] font-medium tracking-tight mt-0.5 truncate max-w-[58px] ${
                isMoreMenuOpen || isMoreActive ? 'text-white font-bold' : 'text-[#8EA3BE]'
              }`}
            >
              More
            </span>
          </button>
        </div>
      </nav>

      {/* Android Bottom Sheet / Modal for "More" Navigation Items */}
      {isMoreMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-[#071426]/75 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={onOpenMoreMenu}
        >
          <div
            className="bg-[#0B1F3A] text-white border-t border-[#102A43] rounded-t-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-250 max-h-[85vh] overflow-y-auto"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
            onClick={(e) => e.stopPropagation()}
            id="mobile-more-sheet"
          >
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 rounded-full bg-[#334E68] mx-auto mb-2" />

            <div className="flex items-center justify-between border-b border-[#102A43] pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>Additional Sections</span>
                  <Sparkles className="w-4 h-4 text-[#00D9FF]" />
                </h3>
                <p className="text-xs text-[#8EA3BE]">
                  Access All Students directory &amp; Marks Allocation
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenMoreMenu}
                className="p-1.5 text-[#8EA3BE] hover:text-white rounded-xl bg-[#102A43]"
              >
                ✕
              </button>
            </div>

            {/* Menu options */}
            <div className="space-y-2">
              {/* 4. All Students */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('all-students');
                  onOpenMoreMenu();
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  activeTab === 'all-students'
                    ? 'bg-[#102A43] border-[#00D9FF] text-white shadow-md shadow-[#00D9FF]/10'
                    : 'bg-[#071426]/60 border-[#102A43] text-[#D7E3EA] hover:bg-[#102A43]'
                }`}
                id="more-sheet-all-students"
              >
                <div className="flex items-center gap-3.5 text-left">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      activeTab === 'all-students'
                        ? 'bg-[#00D9FF] text-[#0B1F3A]'
                        : 'bg-[#102A43] text-[#67E8F9]'
                    }`}
                  >
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">All Students</div>
                    <div className="text-xs text-[#8EA3BE]">
                      Student directory, filters &amp; Excel roster export
                    </div>
                  </div>
                </div>
                {activeTab === 'all-students' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00D9FF] shadow-[0_0_8px_#00D9FF]" />
                )}
              </button>

              {/* 5. Marks Allocation */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('marks-allocation');
                  onOpenMoreMenu();
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  activeTab === 'marks-allocation' ||
                  activeTab === 'batch-marks' ||
                  activeTab === 'enter-marks'
                    ? 'bg-[#102A43] border-[#00D9FF] text-white shadow-md shadow-[#00D9FF]/10'
                    : 'bg-[#071426]/60 border-[#102A43] text-[#D7E3EA] hover:bg-[#102A43]'
                }`}
                id="more-sheet-marks-allocation"
              >
                <div className="flex items-center gap-3.5 text-left">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      activeTab === 'marks-allocation' ||
                      activeTab === 'batch-marks' ||
                      activeTab === 'enter-marks'
                        ? 'bg-[#00D9FF] text-[#0B1F3A]'
                        : 'bg-[#102A43] text-[#67E8F9]'
                    }`}
                  >
                    <FileEdit className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">Marks Allocation</div>
                    <div className="text-xs text-[#8EA3BE]">
                      Unit Test 1 (30M) &amp; Unit Test 2 (30M) entry
                    </div>
                  </div>
                </div>
                {(activeTab === 'marks-allocation' ||
                  activeTab === 'batch-marks' ||
                  activeTab === 'enter-marks') && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00D9FF] shadow-[0_0_8px_#00D9FF]" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
