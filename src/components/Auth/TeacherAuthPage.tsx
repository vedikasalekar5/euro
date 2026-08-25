import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CollegeLogo } from '../../assets/collegeLogo';
import {
  Lock,
  User,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Eye,
  EyeOff,
  BookOpen,
} from 'lucide-react';

export const TeacherAuthPage: React.FC = () => {
  const { registerTeacher, login, resetPassword } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginTeacherId, setLoginTeacherId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Registration success modal/card
  const [registrationSuccess, setRegistrationSuccess] = useState<{
    teacherId: string;
    name: string;
  } | null>(null);

  // Forgot Password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotTeacherId, setForgotTeacherId] = useState('');
  const [forgotName, setForgotName] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotMsg, setForgotMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Quick fill helper for Demo teacher
  const fillDemoCredentials = () => {
    setLoginTeacherId('TCH001');
    setLoginPassword('teacher123');
    setLoginError(null);
  };

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginTeacherId.trim()) {
      setLoginError('Please enter your Teacher ID (e.g. TCH001).');
      return;
    }
    if (!loginPassword) {
      setLoginError('Please enter your password.');
      return;
    }

    setIsLoggingIn(true);
    const res = await login(loginTeacherId, loginPassword);
    setIsLoggingIn(false);

    if (!res.success) {
      setLoginError(res.message);
    }
  };

  // Handle Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regFullName.trim()) {
      setRegError('Please enter your full name.');
      return;
    }
    if (!regPassword) {
      setRegError('Please enter a password.');
      return;
    }
    if (regPassword.length < 4) {
      setRegError('Password must be at least 4 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match. Please re-type your password.');
      return;
    }

    setIsRegistering(true);
    const res = await registerTeacher(regFullName.trim(), regPassword);
    setIsRegistering(false);

    if (res.success && res.teacherId) {
      setRegistrationSuccess({
        teacherId: res.teacherId,
        name: regFullName.trim(),
      });
      setRegFullName('');
      setRegPassword('');
      setRegConfirmPassword('');
    } else {
      setRegError(res.message);
    }
  };

  // Handle Forgot Password
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg(null);

    if (!forgotTeacherId.trim() || !forgotName.trim()) {
      setForgotMsg({ type: 'error', text: 'Please provide both your Teacher ID and Registered Full Name.' });
      return;
    }
    if (!forgotNewPassword || forgotNewPassword.length < 4) {
      setForgotMsg({ type: 'error', text: 'New password must be at least 4 characters.' });
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsResetting(true);
    const res = await resetPassword(forgotTeacherId, forgotName, forgotNewPassword);
    setIsResetting(false);

    if (res.success) {
      setForgotMsg({ type: 'success', text: res.message });
      setLoginTeacherId(forgotTeacherId.trim().toUpperCase());
      setTimeout(() => {
        setIsForgotModalOpen(false);
        setForgotMsg(null);
        setForgotTeacherId('');
        setForgotName('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
      }, 1800);
    } else {
      setForgotMsg({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F9FC] text-[#172B4D] flex flex-col justify-between selection:bg-[#00D9FF] selection:text-[#0B1F3A]" id="teacher-auth-screen">
      {/* Background Decorative Grid & Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#00D9FF]/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-[#102A43]/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-[#67E8F9]/10 rounded-full blur-3xl"></div>
      </div>

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <CollegeLogo className="w-12 h-12 shadow-md shadow-[#0B1F3A]/10 ring-2 ring-[#00D9FF]/30 rounded-full shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-[#0B1F3A] font-sans">
                EURO MANDAR
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-[#E6FCFF] text-[#0B1F3A] border border-[#67E8F9] rounded-md">
                Mandar Education Society
              </span>
            </div>
            <p className="text-xs text-[#64748B]">
              Rajaram Shinde Institute of Engineering and Technology (RSIET)
            </p>
            <p className="text-[11px] text-[#0B1F3A] font-medium mt-0.5 flex items-center gap-1">
              <span className="text-[#64748B]">Under the Guidance of</span>
              <span className="font-bold text-[#0B1F3A]">Prof. Sandesh A. Gajmal</span>
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-[#0B1F3A] bg-white px-3.5 py-1.5 rounded-full border border-[#D7E3EA] shadow-2xs font-semibold">
          <BookOpen className="w-3.5 h-3.5 text-[#00D9FF]" />
          <span>Continuous Evaluation (Unit 1 &amp; Unit 2)</span>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="relative z-10 w-full max-w-md mx-auto px-4 py-6">
        <div className="bg-white border border-[#D7E3EA] rounded-3xl shadow-xl overflow-hidden p-6 sm:p-8">
          
          {/* Header Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F5F9FC] text-[#0B1F3A] border border-[#D7E3EA] mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#00D9FF]" />
              <span>Faculty Exclusive Access</span>
            </div>
            <h2 className="text-2xl font-black text-[#0B1F3A] tracking-tight">
              {mode === 'login' ? 'Teacher Login' : 'Teacher Registration'}
            </h2>
            <p className="text-xs text-[#64748B] mt-1 max-w-xs mx-auto">
              {mode === 'login'
                ? 'Sign in using your permanent Teacher ID and password.'
                : 'Create your teacher profile to receive an auto-generated Teacher ID.'}
            </p>
          </div>

          {/* Primary Two Options Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#F5F9FC] rounded-2xl border border-[#D7E3EA] mb-6" id="auth-mode-toggle">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setLoginError(null);
              }}
              className={`py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#0B1F3A] text-white shadow-md'
                  : 'text-[#64748B] hover:text-[#0B1F3A]'
              }`}
              id="auth-tab-login"
            >
              <Lock className={`w-3.5 h-3.5 ${mode === 'login' ? 'text-[#00D9FF]' : ''}`} />
              <span>🔐 Login</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('register');
                setRegError(null);
              }}
              className={`py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#0B1F3A] text-white shadow-md'
                  : 'text-[#64748B] hover:text-[#0B1F3A]'
              }`}
              id="auth-tab-register"
            >
              <User className={`w-3.5 h-3.5 ${mode === 'register' ? 'text-[#00D9FF]' : ''}`} />
              <span>👩‍🏫 Register</span>
            </button>
          </div>

          {/* 1. LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4" id="teacher-login-form">
              {loginError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start gap-2 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{loginError}</span>
                </div>
              )}

              {/* Teacher ID Field */}
              <div>
                <label className="block text-xs font-bold text-[#172B4D] mb-1.5">
                  Teacher ID / ID No.
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                  <input
                    type="text"
                    value={loginTeacherId}
                    onChange={(e) => setLoginTeacherId(e.target.value)}
                    placeholder="Enter your Teacher ID (e.g. TCH001)"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl text-sm text-[#172B4D] placeholder-[#64748B] font-mono focus:border-[#00D9FF] focus:bg-white focus:ring-2 focus:ring-[#00D9FF]/20 outline-none transition-all"
                    id="login-teacher-id-input"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#172B4D]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotModalOpen(true);
                      setForgotTeacherId(loginTeacherId);
                    }}
                    className="text-xs text-[#0B1F3A] hover:text-[#00D9FF] font-bold transition-colors cursor-pointer"
                    id="login-forgot-password-link"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl text-sm text-[#172B4D] placeholder-[#64748B] focus:border-[#00D9FF] focus:bg-white focus:ring-2 focus:ring-[#00D9FF]/20 outline-none transition-all"
                    id="login-password-input"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0B1F3A]"
                    aria-label="Toggle password visibility"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full mt-2 py-3 bg-[#0B1F3A] hover:bg-[#102A43] active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md border border-[#102A43] hover:border-[#00D9FF] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                id="login-submit-btn"
              >
                <span>{isLoggingIn ? 'Verifying Teacher...' : 'Login'}</span>
                <ArrowRight className="w-4 h-4 text-[#00D9FF]" />
              </button>

              {/* Demo Quick-Fill Box */}
              <div className="mt-4 pt-4 border-t border-[#D7E3EA] text-center">
                <p className="text-[11px] text-[#64748B] mb-2 font-medium">
                  First time testing? Use pre-configured Faculty Demo:
                </p>
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="w-full py-2 px-3 bg-[#F5F9FC] hover:bg-[#E6FCFF] text-[#0B1F3A] rounded-xl border border-[#D7E3EA] hover:border-[#00D9FF] text-xs font-mono transition-all flex items-center justify-between group cursor-pointer"
                  id="login-demo-quickfill-btn"
                >
                  <span className="flex items-center gap-1.5 text-[#0B1F3A] font-sans font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-[#00D9FF]" />
                    <span>Demo Account:</span>
                  </span>
                  <span>TCH001 • teacher123</span>
                  <span className="text-[10px] text-[#0B1F3A] font-sans font-bold group-hover:underline">Auto-Fill</span>
                </button>
              </div>
            </form>
          )}

          {/* 2. REGISTRATION FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4" id="teacher-registration-form">
              {regError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start gap-2 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{regError}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-[#172B4D] mb-1.5">
                  Teacher Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="e.g. Prof. Sneha Kulkarni"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl text-sm text-[#172B4D] placeholder-[#64748B] focus:border-[#00D9FF] focus:bg-white focus:ring-2 focus:ring-[#00D9FF]/20 outline-none transition-all"
                    id="register-fullname-input"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-[#172B4D] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a strong password (min 4 chars)"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl text-sm text-[#172B4D] placeholder-[#64748B] focus:border-[#00D9FF] focus:bg-white focus:ring-2 focus:ring-[#00D9FF]/20 outline-none transition-all"
                    id="register-password-input"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0B1F3A]"
                    aria-label="Toggle password visibility"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-[#172B4D] mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl text-sm text-[#172B4D] placeholder-[#64748B] focus:border-[#00D9FF] focus:bg-white focus:ring-2 focus:ring-[#00D9FF]/20 outline-none transition-all"
                    id="register-confirm-password-input"
                    required
                  />
                </div>
              </div>

              <div className="p-3.5 bg-[#F5F9FC] border border-[#D7E3EA] rounded-2xl text-[11px] text-[#0B1F3A] flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-[#00D9FF] shrink-0 mt-0.5" />
                <span>
                  Your unique, permanent <strong>Teacher ID</strong> (e.g. TCH002) will be automatically generated upon submission.
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isRegistering}
                className="w-full mt-2 py-3 bg-[#0B1F3A] hover:bg-[#102A43] active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md border border-[#102A43] hover:border-[#00D9FF] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                id="register-submit-btn"
              >
                <span>{isRegistering ? 'Generating Teacher ID...' : 'Complete Registration'}</span>
                <ArrowRight className="w-4 h-4 text-[#00D9FF]" />
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer Note */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 text-center text-xs text-[#64748B] space-y-1.5" id="auth-footer">
        <p>
          Mandar Education Society's • Rajaram Shinde Institute of Engineering and Technology (RSIET) • Continuous Evaluation System (Unit 1 &amp; Unit 2)
        </p>
        <p className="text-[#64748B] font-medium">
          Developed by <span className="text-[#0B1F3A] font-bold">Vedika Satish Salekar</span>
        </p>
      </footer>

      {/* REGISTRATION SUCCESS MODAL / CARD */}
      {registrationSuccess && (
        <div className="fixed inset-0 bg-[#071426]/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-[#D7E3EA] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-150" id="registration-success-dialog">
            <div className="w-16 h-16 rounded-3xl bg-[#E6FCFF] border border-[#67E8F9] text-[#0B1F3A] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-[#00D9FF]" />
            </div>

            <div>
              <h3 className="text-xl font-black text-[#0B1F3A]">
                Registration Successful! 🎉
              </h3>
              <p className="text-xs text-[#64748B] mt-1">
                Welcome, {registrationSuccess.name}! Your faculty account has been registered.
              </p>
            </div>

            <div className="p-4 bg-[#F5F9FC] border border-[#D7E3EA] rounded-2xl">
              <div className="text-[11px] uppercase tracking-wider text-[#64748B] font-bold mb-1">
                Your Auto-Generated Teacher ID
              </div>
              <div className="text-3xl font-black font-mono text-[#0B1F3A] tracking-wider">
                {registrationSuccess.teacherId}
              </div>
              <p className="text-xs text-[#F59E0B] font-bold mt-2">
                ⚠️ Please save this ID. You will need it to log in.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setLoginTeacherId(registrationSuccess.teacherId);
                setRegistrationSuccess(null);
                setMode('login');
              }}
              className="w-full py-3 bg-[#0B1F3A] hover:bg-[#102A43] border border-[#102A43] hover:border-[#00D9FF] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              id="continue-to-login-btn"
            >
              <span>Continue to Login</span>
              <ArrowRight className="w-4 h-4 text-[#00D9FF]" />
            </button>
          </div>
        </div>
      )}

      {/* FORGOT PASSWORD MODAL */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 bg-[#071426]/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-[#D7E3EA] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150" id="forgot-password-modal">
            <div className="flex items-center justify-between pb-3 border-b border-[#D7E3EA]">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#00D9FF]" />
                <h3 className="text-lg font-black text-[#0B1F3A]">Reset Teacher Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="text-[#64748B] hover:text-[#0B1F3A] text-xs font-bold px-2.5 py-1 rounded-lg bg-[#F5F9FC] hover:bg-[#E6FCFF] cursor-pointer"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-[#64748B]">
              Verify your registered Teacher ID and Full Name to set a new password securely.
            </p>

            {forgotMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  forgotMsg.type === 'success'
                    ? 'bg-[#E6FCFF] border border-[#67E8F9] text-[#0B1F3A] font-bold'
                    : 'bg-rose-50 border border-rose-200 text-rose-800 font-bold'
                }`}
              >
                {forgotMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-[#00D9FF]" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
                <span>{forgotMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-[#172B4D] mb-1">
                  Teacher ID (e.g. TCH001)
                </label>
                <input
                  type="text"
                  value={forgotTeacherId}
                  onChange={(e) => setForgotTeacherId(e.target.value)}
                  placeholder="e.g. TCH001"
                  className="w-full px-3 py-2 bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl text-xs text-[#172B4D] font-mono focus:border-[#00D9FF] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172B4D] mb-1">
                  Registered Full Name
                </label>
                <input
                  type="text"
                  value={forgotName}
                  onChange={(e) => setForgotName(e.target.value)}
                  placeholder="Exact full name used during registration"
                  className="w-full px-3 py-2 bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl text-xs text-[#172B4D] focus:border-[#00D9FF] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172B4D] mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  placeholder="Min 4 characters"
                  className="w-full px-3 py-2 bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl text-xs text-[#172B4D] focus:border-[#00D9FF] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172B4D] mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2 bg-[#F5F9FC] border border-[#D7E3EA] rounded-xl text-xs text-[#172B4D] focus:border-[#00D9FF] outline-none"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="flex-1 py-2.5 bg-[#F5F9FC] hover:bg-[#E6FCFF] text-[#64748B] font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="flex-1 py-2.5 bg-[#0B1F3A] hover:bg-[#102A43] border border-[#102A43] hover:border-[#00D9FF] text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50 cursor-pointer active:scale-95 shadow-xs"
                  id="forgot-password-submit-btn"
                >
                  {isResetting ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
