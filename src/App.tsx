import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AcademicProvider, useAcademic } from './context/AcademicContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { TeacherDashboard } from './components/Dashboard/TeacherDashboard';
import { StudentManagement } from './components/Students/StudentManagement';
import { AllStudentsView } from './components/Students/AllStudentsView';
import { MyCoursesView } from './components/Courses/MyCoursesView';
import { MarksAllocationView } from './components/Marks/MarksAllocationView';
import { TeacherProfileView } from './components/Profile/TeacherProfileView';
import { PerformanceView } from './components/Performance/PerformanceView';
import { TeacherAuthPage } from './components/Auth/TeacherAuthPage';
import { StudentProfileModal } from './components/Students/StudentProfileModal';
import { StudentFormModal } from './components/Students/StudentFormModal';
import { ImportStudentsModal } from './components/Students/ImportStudentsModal';
import { CourseFormModal } from './components/Courses/CourseFormModal';
import { EnterMarksModal } from './components/Marks/EnterMarksModal';
import { LoginModal } from './components/Auth/LoginModal';
import { Toast } from './components/Toast';
import { AndroidBottomNav } from './components/Android/AndroidBottomNav';
import { AndroidSplashScreen } from './components/Android/AndroidSplashScreen';
import { AndroidNetworkStatus } from './components/Android/AndroidNetworkStatus';
import { AndroidInstallBanner } from './components/Android/AndroidInstallBanner';

const MainAppContent: React.FC = () => {
  const { activeTab, setActiveTab } = useAcademic();
  const { currentUser, isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Android Back-Button Handling: push state to window.history when activeTab changes
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.tab) {
        setActiveTab(event.state.tab);
      } else if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab, setActiveTab]);

  useEffect(() => {
    // Keep history state in sync
    if (window.history.state?.tab !== activeTab) {
      window.history.pushState({ tab: activeTab }, '', window.location.pathname);
    }
  }, [activeTab]);

  // If user is not logged in / enrolled, show the Teacher Self-Enrollment & Login page
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen bg-[#071426] text-[#172B4D] font-sans selection:bg-[#00D9FF] selection:text-[#0B1F3A]">
        {showSplash && <AndroidSplashScreen onFinish={() => setShowSplash(false)} />}
        <AndroidNetworkStatus />
        <TeacherAuthPage />
        <LoginModal />
        <Toast />
        <AndroidInstallBanner />
      </div>
    );
  }

  return (
    <div
      className="h-screen w-screen overflow-hidden bg-[#F5F9FC] flex flex-col font-sans text-[#172B4D] selection:bg-[#00D9FF] selection:text-[#0B1F3A]"
      id="main-app-container"
    >
      {/* Android Splash Screen on startup */}
      {showSplash && <AndroidSplashScreen onFinish={() => setShowSplash(false)} />}

      {/* Network Connectivity Status Banner for Android */}
      <AndroidNetworkStatus />

      {/* Top Navbar */}
      <Navbar onToggleMobileSidebar={() => setMobileOpen(!mobileOpen)} />

      {/* Main Workspace Area: Fixed Sidebar (Desktop) / Drawer (Mobile) + Scrollable Main Content */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        <main
          className="flex-1 h-full overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 lg:p-8 bg-[#F5F9FC]"
          style={{ paddingBottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))' }}
          id="main-scrollable-content"
        >
          <div className="max-w-7xl mx-auto w-full pb-8">
            {/* 1. Dashboard */}
            {(activeTab === 'dashboard' || activeTab === 'teacher-dashboard') && <TeacherDashboard />}

            {/* 2. My Courses (Teacher Personal Course Management) */}
            {(activeTab === 'courses' || activeTab === 'my-courses' || activeTab === 'subjects' || activeTab === 'add-course') && (
              <MyCoursesView />
            )}

            {/* 3. Students (Management) */}
            {activeTab === 'students' && <StudentManagement />}

            {/* 4. All Students (Viewing & Profile Ledger) */}
            {activeTab === 'all-students' && <AllStudentsView />}

            {/* 5. Marks Allocation (Subject-wise Unit 1, Unit 2 & auto Average) */}
            {(activeTab === 'marks-allocation' || activeTab === 'batch-marks' || activeTab === 'enter-marks') && (
              <MarksAllocationView />
            )}

            {/* 6. Performance (Unit Test 1 & 2 Analytics) - Navigation before Profile */}
            {activeTab === 'performance' && <PerformanceView />}

            {/* 7. My Profile */}
            {(activeTab === 'my-profile' || activeTab === 'profile') && <TeacherProfileView />}

            {/* Fallback to Dashboard if any unfamiliar route */}
            {!['dashboard', 'teacher-dashboard', 'courses', 'my-courses', 'subjects', 'add-course', 'students', 'all-students', 'marks-allocation', 'batch-marks', 'enter-marks', 'performance', 'my-profile', 'profile'].includes(activeTab) && (
              <TeacherDashboard />
            )}

            {/* Application & Dashboard Footer */}
            <footer className="mt-8 pt-4 border-t border-[#D7E3EA] text-xs text-[#64748B] flex flex-col sm:flex-row items-center justify-between gap-2" id="application-footer">
              <p className="font-medium text-[#172B4D]/80 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00D9FF]" />
                EURO MANDAR • Continuous Evaluation &amp; Marks Management • RSIET
              </p>
              <p className="text-[11.5px] text-[#64748B]">
                Developed by <span className="font-semibold text-[#0B1F3A]">Vedika Satish Salekar</span>
              </p>
            </footer>
          </div>
        </main>
      </div>

      {/* Android Bottom Navigation Bar (Mobile Viewports) */}
      <AndroidBottomNav
        isMoreMenuOpen={isMoreMenuOpen}
        onOpenMoreMenu={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
      />

      {/* Android Install Banner */}
      <AndroidInstallBanner />

      {/* Global Modals & Overlays */}
      <StudentProfileModal />
      <StudentFormModal />
      <ImportStudentsModal />
      <CourseFormModal />
      <EnterMarksModal />
      <LoginModal />
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AcademicProvider>
        <MainAppContent />
      </AcademicProvider>
    </AuthProvider>
  );
}
