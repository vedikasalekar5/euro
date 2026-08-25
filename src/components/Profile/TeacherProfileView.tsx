import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAcademic } from '../../context/AcademicContext';
import { Department, AcademicYear } from '../../types';
import { exportTeacherProfilePDF } from '../../utils/pdfExport';
import {
  User,
  Shield,
  KeyRound,
  Edit3,
  BookOpen,
  Save,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Sparkles,
  Layers,
  FileDown,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Calendar,
  Award,
  Clock,
  Camera,
  Trash2,
  Lock,
  Plus,
} from 'lucide-react';

const POSITIONS = [
  'Professor',
  'Assistant Professor',
  'Associate Professor',
  'HOD',
  'Lecturer',
  'Lab Assistant',
  'Clerk',
  'Instructor',
  'Other',
];

const DEPARTMENTS: Department[] = [
  'Computer Engineering',
  'Civil Engineering',
  'Mechanical Engineering',
  'Electrical Engineering',
];

export const TeacherProfileView: React.FC = () => {
  const { currentTeacher, updateTeacherProfile, changePassword } = useAuth();
  const { subjects, students, marks, showToast, setCourseFormModal, setActiveTab } = useAcademic();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const teacherName = currentTeacher?.name || 'Faculty Member';
  const teacherId = currentTeacher?.teacher_id || 'TCH001';
  const teacherDept = currentTeacher?.department || 'Computer Engineering';
  const teacherPosition = currentTeacher?.position || 'Professor';
  const teacherEmail = currentTeacher?.email || 'faculty@rsiet.edu.in';
  const teacherMobile = currentTeacher?.mobile || currentTeacher?.phone || '+91 98765 43210';
  const teacherQualification = currentTeacher?.qualification || 'M.Tech in Computer Engineering / B.E.';
  const teacherExperience = currentTeacher?.experience || '6+ Years';
  const teacherJoiningDate =
    currentTeacher?.date_of_joining || currentTeacher?.dateOfJoining || currentTeacher?.joiningDate || '01 July 2022';
  const teacherPhoto = currentTeacher?.photo_url || currentTeacher?.photoUrl || currentTeacher?.avatar || '';
  const teacherBio = currentTeacher?.bio || currentTeacher?.specialization || '';

  // Profile Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: teacherName,
    position: teacherPosition,
    customPosition: '',
    department: teacherDept,
    email: teacherEmail,
    mobile: teacherMobile,
    qualification: teacherQualification,
    experience: teacherExperience,
    date_of_joining: teacherJoiningDate,
    photo_url: teacherPhoto,
    bio: teacherBio,
  });

  // Password change state
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Teacher courses & stats (isolated strictly to this teacher's ID)
  const teacherStudents = students.filter((s) => s.teacher_id === teacherId);
  const teacherSubjects = subjects.filter((s) => s.teacher_id === teacherId);
  const teacherMarks = marks.filter((m) => m.teacher_id === teacherId);

  // Sync edit form with current teacher
  const openEditProfile = () => {
    const isCustom = !POSITIONS.slice(0, -1).includes(teacherPosition);
    setFormData({
      name: currentTeacher?.name || '',
      position: isCustom ? 'Other' : teacherPosition,
      customPosition: isCustom ? teacherPosition : '',
      department: (currentTeacher?.department as Department) || 'Computer Engineering',
      email: currentTeacher?.email || '',
      mobile: currentTeacher?.mobile || currentTeacher?.phone || '',
      qualification: currentTeacher?.qualification || '',
      experience: currentTeacher?.experience || '',
      date_of_joining: currentTeacher?.date_of_joining || currentTeacher?.dateOfJoining || currentTeacher?.joiningDate || '',
      photo_url: currentTeacher?.photo_url || currentTeacher?.photoUrl || currentTeacher?.avatar || '',
      bio: currentTeacher?.bio || currentTeacher?.specialization || '',
    });
    setIsEditing(true);
    setIsChangingPass(false);
    setFeedback(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setFeedback({ type: 'error', text: 'Image file size exceeds 3MB limit.' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setFormData((prev) => ({ ...prev, photo_url: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const actualPosition =
      formData.position === 'Other'
        ? formData.customPosition.trim() || 'Faculty Member'
        : formData.position;

    const res = updateTeacherProfile({
      name: formData.name.trim(),
      position: actualPosition,
      department: formData.department,
      programming_name: formData.department,
      email: formData.email.trim(),
      mobile: formData.mobile.trim(),
      qualification: formData.qualification.trim(),
      experience: formData.experience.trim(),
      date_of_joining: formData.date_of_joining.trim(),
      photo_url: formData.photo_url,
      bio: formData.bio.trim(),
    });

    if (res.success) {
      setIsEditing(false);
      setFeedback({ type: 'success', text: 'Profile updated successfully.' });
    } else {
      setFeedback({ type: 'error', text: res.message });
      showToast(res.message, 'error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (passData.newPassword !== passData.confirmPassword) {
      setFeedback({ type: 'error', text: 'New password and confirm password do not match.' });
      return;
    }

    if (passData.newPassword.length < 4) {
      setFeedback({ type: 'error', text: 'New password must be at least 4 characters.' });
      return;
    }

    const res = await changePassword(passData.currentPassword, passData.newPassword);
    if (res.success) {
      setIsChangingPass(false);
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setFeedback({ type: 'success', text: 'Password has been updated securely.' });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const handleDownloadProfilePDF = async () => {
    if (!currentTeacher) return;
    try {
      setIsDownloadingPdf(true);
      await exportTeacherProfilePDF({
        teacher: currentTeacher,
        courses: teacherSubjects,
      });
    } catch (err) {
      console.error('Failed to download profile PDF', err);
      showToast('Failed to generate Profile PDF.', 'error');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-12" id="teacher-profile-section">
      {/* Top Profile Banner Card */}
      <div className="bg-[#0B1F3A] rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-[#102A43] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Profile Photo / Avatar */}
          <div className="relative group shrink-0">
            {teacherPhoto ? (
              <img
                src={teacherPhoto}
                alt={teacherName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-[#00D9FF]/30 shadow-xl"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#102A43] border border-[#00D9FF]/40 flex items-center justify-center text-3xl font-black text-[#00D9FF] shadow-xl ring-4 ring-[#00D9FF]/20 shrink-0">
                {teacherName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {teacherName}
              </h2>
              <div className="flex items-center gap-1 px-2.5 py-0.5 text-xs font-mono font-bold bg-[#102A43] text-[#00D9FF] border border-[#00D9FF]/30 rounded-md">
                <Lock className="w-3 h-3 text-[#00D9FF]" />
                <span>{teacherId}</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#67E8F9] font-medium flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-[#00D9FF]" />
              <span>{teacherPosition}</span>
              <span>•</span>
              <Building2 className="w-3.5 h-3.5 text-[#00D9FF]" />
              <span>{teacherDept}</span>
            </p>

            <p className="text-[11px] text-[#67E8F9]/80 font-mono flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#00D9FF]" />
              <span>EURO MANDAR – Academic Performance Management</span>
            </p>

            <div className="pt-1 flex items-center gap-1.5 text-xs text-white/90">
              <span className="text-[#67E8F9]">Under the Guidance of:</span>
              <span className="font-bold text-white">Prof. Sandesh A. Gajmal</span>
            </div>
          </div>
        </div>

        {/* Top Actions: Edit Profile, Download Profile PDF, Change Password */}
        <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
          <button
            onClick={() => {
              if (isEditing) {
                setIsEditing(false);
              } else {
                openEditProfile();
              }
            }}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#102A43] hover:bg-[#102A43]/80 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs border border-[#D7E3EA]/20 active:scale-95"
            id="btn-toggle-edit-profile"
          >
            <Edit3 className="w-4 h-4 text-[#00D9FF]" />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
          </button>

          <button
            onClick={handleDownloadProfilePDF}
            disabled={isDownloadingPdf}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#F5F9FC] hover:bg-[#D7E3EA] text-[#0B1F3A] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 border border-[#D7E3EA]"
            id="btn-download-profile-pdf"
          >
            <FileDown className="w-4 h-4 text-[#0B1F3A]" />
            <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download Profile PDF'}</span>
          </button>

          <button
            onClick={() => {
              setIsChangingPass(!isChangingPass);
              setIsEditing(false);
              setFeedback(null);
            }}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#00D9FF] hover:bg-[#67E8F9] text-[#071426] text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 font-bold"
            id="btn-toggle-change-password"
          >
            <KeyRound className="w-4 h-4" />
            <span>{isChangingPass ? 'Cancel' : 'Change Password'}</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Alert Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center gap-2.5 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-[#DCFCE7] border-[#BBF7D0] text-[#16A34A]'
              : 'bg-rose-50 border-rose-200 text-[#EF4444]'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-[#22C55E] shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0" />
          )}
          <span className="font-bold">{feedback.text}</span>
        </div>
      )}

      {/* 1. Edit Profile Form Panel */}
      {isEditing && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#D7E3EA] shadow-xl space-y-6 animate-in fade-in" id="edit-profile-form-container">
          <div className="flex items-center justify-between border-b border-[#D7E3EA] pb-4">
            <div className="flex items-center gap-2.5 text-[#0B1F3A]">
              <div className="p-2 bg-[#F5F9FC] text-[#0B1F3A] rounded-xl border border-[#D7E3EA]">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#172B4D]">Edit Professional Profile</h3>
                <p className="text-xs text-[#64748B]">Update your faculty credentials and professional information</p>
              </div>
            </div>

            <span className="text-[11px] font-mono font-bold text-[#0B1F3A] bg-[#F5F9FC] px-2.5 py-1 rounded-lg border border-[#D7E3EA]">
              ID: {teacherId} (Protected)
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Photo Upload Section */}
            <div className="p-4 bg-[#F5F9FC] rounded-2xl border border-[#D7E3EA] flex flex-col sm:flex-row items-center gap-4">
              <div className="relative">
                {formData.photo_url ? (
                  <img
                    src={formData.photo_url}
                    alt="Preview"
                    className="w-20 h-20 rounded-2xl object-cover ring-2 ring-[#00D9FF] shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-[#0B1F3A] text-[#00D9FF] flex items-center justify-center font-bold text-2xl border border-[#102A43]">
                    <User className="w-8 h-8" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1 text-center sm:text-left">
                <h4 className="text-xs font-bold text-[#172B4D]">Faculty Profile Photo</h4>
                <p className="text-[11px] text-[#64748B]">
                  Upload a professional passport-size photo (PNG, JPG, max 3MB).
                </p>

                <div className="flex items-center gap-2 pt-2 justify-center sm:justify-start">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                    id="profile-photo-file-input"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-[#0B1F3A] hover:bg-[#102A43] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 border border-[#00D9FF]/30"
                    id="btn-change-photo"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#00D9FF]" />
                    <span>Change Photo</span>
                  </button>

                  {formData.photo_url && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, photo_url: '' }))}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-[#EF4444] text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-rose-200"
                      id="btn-remove-photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Photo</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Grid of Profile Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Prof. Priya Patil"
                  className="w-full px-3.5 py-2.5 bg-[#F5F9FC] text-xs font-semibold text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:border-[#00D9FF] focus:bg-white outline-none"
                  id="input-profile-name"
                />
              </div>

              {/* Unique Teacher ID (Read-only system protected) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#172B4D] uppercase tracking-wider">
                    Unique Teacher ID
                  </label>
                  <span className="text-[10px] text-[#0094B3] font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> System-Generated
                  </span>
                </div>
                <input
                  type="text"
                  disabled
                  value={teacherId}
                  className="w-full px-3.5 py-2.5 bg-[#F5F9FC] text-xs font-mono font-bold text-[#64748B] border border-[#D7E3EA] rounded-xl cursor-not-allowed"
                  id="input-profile-teacher-id"
                />
              </div>

              {/* Position in College */}
              <div>
                <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
                  Position in College <span className="text-[#EF4444]">*</span>
                </label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F5F9FC] text-xs font-semibold text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:border-[#00D9FF] focus:bg-white outline-none cursor-pointer"
                  id="select-profile-position"
                >
                  {POSITIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom position if 'Other' */}
              {formData.position === 'Other' && (
                <div>
                  <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
                    Specify Custom Position <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customPosition}
                    onChange={(e) => setFormData({ ...formData, customPosition: e.target.value })}
                    placeholder="e.g. Dean Academics"
                    className="w-full px-3.5 py-2.5 bg-[#F5F9FC] text-xs font-semibold text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:border-[#00D9FF] focus:bg-white outline-none"
                    id="input-custom-position"
                  />
                </div>
              )}

              {/* Department */}
              <div>
                <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
                  Department <span className="text-[#EF4444]">*</span>
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value as Department })}
                  className="w-full px-3.5 py-2.5 bg-[#F5F9FC] text-xs font-semibold text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:border-[#00D9FF] focus:bg-white outline-none cursor-pointer"
                  id="select-profile-department"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Email ID */}
              <div>
                <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
                  Email ID
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. teacher@rsiet.edu.in"
                  className="w-full px-3.5 py-2.5 bg-[#F5F9FC] text-xs font-semibold text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:border-[#00D9FF] focus:bg-white outline-none"
                  id="input-profile-email"
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3.5 py-2.5 bg-[#F5F9FC] text-xs font-semibold text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:border-[#00D9FF] focus:bg-white outline-none"
                  id="input-profile-mobile"
                />
              </div>

              {/* Qualification */}
              <div>
                <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
                  Qualification
                </label>
                <input
                  type="text"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  placeholder="e.g. M.Tech / B.E. / Ph.D."
                  className="w-full px-3.5 py-2.5 bg-[#F5F9FC] text-xs font-semibold text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:border-[#00D9FF] focus:bg-white outline-none"
                  id="input-profile-qualification"
                />
              </div>

              {/* Experience */}
              <div>
                <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
                  Experience
                </label>
                <input
                  type="text"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  placeholder="e.g. 5 Years / 8+ Years"
                  className="w-full px-3.5 py-2.5 bg-[#F5F9FC] text-xs font-semibold text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:border-[#00D9FF] focus:bg-white outline-none"
                  id="input-profile-experience"
                />
              </div>

              {/* Date of Joining */}
              <div>
                <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
                  Date of Joining
                </label>
                <input
                  type="text"
                  value={formData.date_of_joining}
                  onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
                  placeholder="e.g. 01 July 2022"
                  className="w-full px-3.5 py-2.5 bg-[#F5F9FC] text-xs font-semibold text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:border-[#00D9FF] focus:bg-white outline-none"
                  id="input-profile-joining-date"
                />
              </div>
            </div>

            {/* Bio / Specialization */}
            <div>
              <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
                Specialization &amp; Professional Summary
              </label>
              <textarea
                rows={2}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Key areas of expertise, research interests, laboratory supervision..."
                className="w-full px-3.5 py-2.5 bg-[#F5F9FC] text-xs font-semibold text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:border-[#00D9FF] focus:bg-white outline-none resize-none"
                id="textarea-profile-bio"
              />
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D7E3EA]">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 text-xs font-bold text-[#64748B] hover:bg-[#F5F9FC] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-[#0B1F3A] hover:bg-[#102A43] active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-[#0B1F3A]/20 transition-colors flex items-center gap-2 cursor-pointer border border-[#00D9FF]/30"
                id="btn-save-profile-changes"
              >
                <Save className="w-4 h-4 text-[#00D9FF]" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Change Password Form Panel */}
      {isChangingPass && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#D7E3EA] shadow-xl space-y-4 animate-in fade-in">
          <div className="flex items-center gap-2.5 text-[#0B1F3A] border-b border-[#D7E3EA] pb-3">
            <div className="p-2 bg-[#F5F9FC] text-[#0B1F3A] rounded-xl border border-[#D7E3EA]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#172B4D]">Change Portal Password</h3>
              <p className="text-xs text-[#64748B]">Secure your faculty account with a strong password</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={passData.currentPassword}
                onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
                placeholder="Enter current password"
                className="w-full px-3.5 py-2.5 bg-[#F5F9FC] text-xs font-semibold text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:border-[#00D9FF] outline-none"
                id="input-current-password"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={passData.newPassword}
                onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                placeholder="Min 4 characters"
                className="w-full px-3.5 py-2.5 bg-[#F5F9FC] text-xs font-semibold text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:border-[#00D9FF] outline-none"
                id="input-new-password"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={passData.confirmPassword}
                onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                placeholder="Repeat new password"
                className="w-full px-3.5 py-2.5 bg-[#F5F9FC] text-xs font-semibold text-[#172B4D] border border-[#D7E3EA] rounded-xl focus:border-[#00D9FF] outline-none"
                id="input-confirm-password"
              />
            </div>

            <div className="sm:col-span-3 flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsChangingPass(false)}
                className="px-4 py-2.5 text-xs font-semibold text-[#64748B] hover:bg-[#F5F9FC] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#0B1F3A] hover:bg-[#102A43] active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-[#0B1F3A]/20 transition-colors flex items-center gap-2 cursor-pointer border border-[#00D9FF]/30"
                id="btn-submit-password-change"
              >
                <Save className="w-4 h-4 text-[#00D9FF]" />
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Main Profile Details Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Personal & Faculty Credentials */}
        <div className="bg-white rounded-2xl p-6 border border-[#D7E3EA] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#D7E3EA] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#F5F9FC] text-[#0B1F3A] rounded-xl border border-[#D7E3EA]">
                <User className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#172B4D]">Faculty Information</h3>
            </div>

            <button
              onClick={openEditProfile}
              className="text-[11px] font-bold text-[#0094B3] hover:text-[#0B1F3A] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[#64748B] font-semibold uppercase text-[10px] block">Full Name</span>
              <span className="font-bold text-[#172B4D] text-sm mt-0.5 block">{teacherName}</span>
            </div>

            <div>
              <span className="text-[#64748B] font-semibold uppercase text-[10px] block">Unique Teacher ID</span>
              <span className="font-mono font-bold text-[#0B1F3A] bg-[#F5F9FC] px-2.5 py-1 rounded-md border border-[#D7E3EA] inline-block mt-0.5">
                {teacherId}
              </span>
            </div>

            <div>
              <span className="text-[#64748B] font-semibold uppercase text-[10px] block">Position in College</span>
              <span className="font-semibold text-[#172B4D] mt-0.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[#64748B]" />
                {teacherPosition}
              </span>
            </div>

            <div>
              <span className="text-[#64748B] font-semibold uppercase text-[10px] block">Department</span>
              <span className="font-semibold text-[#172B4D] mt-0.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#64748B]" />
                {teacherDept}
              </span>
            </div>

            <div>
              <span className="text-[#64748B] font-semibold uppercase text-[10px] block">Email ID</span>
              <span className="font-semibold text-[#172B4D] mt-0.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#64748B]" />
                {teacherEmail}
              </span>
            </div>

            <div>
              <span className="text-[#64748B] font-semibold uppercase text-[10px] block">Mobile Number</span>
              <span className="font-semibold text-[#172B4D] mt-0.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#64748B]" />
                {teacherMobile}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Academic Qualifications & Service */}
        <div className="bg-white rounded-2xl p-6 border border-[#D7E3EA] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#D7E3EA] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#F5F9FC] text-[#0B1F3A] rounded-xl border border-[#D7E3EA]">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#172B4D]">Qualifications &amp; Service</h3>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <span className="text-[#64748B] font-semibold uppercase text-[10px] block">Qualification</span>
              <span className="font-bold text-[#172B4D] mt-0.5 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#0B1F3A] shrink-0" />
                {teacherQualification}
              </span>
            </div>

            <div>
              <span className="text-[#64748B] font-semibold uppercase text-[10px] block">Teaching Experience</span>
              <span className="font-semibold text-[#172B4D] mt-0.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#0094B3]" />
                {teacherExperience}
              </span>
            </div>

            <div>
              <span className="text-[#64748B] font-semibold uppercase text-[10px] block">Date of Joining</span>
              <span className="font-semibold text-[#172B4D] mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#0094B3]" />
                {teacherJoiningDate}
              </span>
            </div>

            {teacherBio && (
              <div>
                <span className="text-[#64748B] font-semibold uppercase text-[10px] block">Specialization / Bio</span>
                <p className="text-xs text-[#172B4D] mt-1 leading-relaxed bg-[#F5F9FC] p-2.5 rounded-xl border border-[#D7E3EA]">
                  {teacherBio}
                </p>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={handleDownloadProfilePDF}
                disabled={isDownloadingPdf}
                className="w-full py-2 bg-[#F5F9FC] hover:bg-[#D7E3EA] text-[#0B1F3A] font-bold text-xs rounded-xl border border-[#D7E3EA] transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <FileDown className="w-3.5 h-3.5 text-[#0B1F3A]" />
                <span>Download Official Profile PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Security & Faculty Isolation */}
        <div className="bg-white rounded-2xl p-6 border border-[#D7E3EA] shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#D7E3EA] pb-3">
            <div className="p-2 bg-[#F5F9FC] text-[#0B1F3A] rounded-xl border border-[#D7E3EA]">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#172B4D]">Security &amp; Isolation</h3>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <span className="text-[#64748B] font-semibold uppercase text-[10px] block">Password Security:</span>
              <span className="font-semibold text-[#16A34A] bg-[#DCFCE7] px-2.5 py-1 rounded-md border border-[#BBF7D0] inline-block mt-0.5">
                SHA-256 Cryptographic Hash
              </span>
            </div>

            <div>
              <span className="text-[#64748B] font-semibold uppercase text-[10px] block">Faculty Data Isolation:</span>
              <div className="flex items-center gap-1.5 text-[#172B4D] font-medium mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
                <span>Scoped to Teacher ID: {teacherId}</span>
              </div>
            </div>

            <div>
              <span className="text-[#64748B] font-semibold uppercase text-[10px] block">Profile Access Control:</span>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Only the authenticated teacher with Teacher ID {teacherId} can view and edit this profile.
              </p>
            </div>

            <div className="pt-1">
              <button
                onClick={() => {
                  setIsChangingPass(true);
                  setIsEditing(false);
                }}
                className="text-xs font-bold text-[#0094B3] hover:text-[#0B1F3A] hover:underline cursor-pointer flex items-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Change Password →</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 4. Courses / Subjects Personally Taught by This Teacher */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#D7E3EA] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#D7E3EA] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-[#F5F9FC] text-[#0B1F3A] rounded-xl border border-[#D7E3EA]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#172B4D]">
                My Courses &amp; Curricular Assignments ({teacherSubjects.length})
              </h3>
              <p className="text-xs text-[#64748B]">
                Subjects personally created and managed by {teacherName} ({teacherId})
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              setCourseFormModal({
                isOpen: true,
                courseToEdit: null,
                defaultDept: teacherDept as Department,
                defaultYear: '2nd Year',
              })
            }
            className="px-3.5 py-2 bg-[#0B1F3A] hover:bg-[#102A43] active:scale-95 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border border-[#00D9FF]/30"
            id="btn-profile-add-course"
          >
            <Plus className="w-4 h-4 text-[#00D9FF]" />
            <span>Add Course</span>
          </button>
        </div>

        {teacherSubjects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F5F9FC] text-[#0B1F3A] font-bold border-b border-[#D7E3EA]">
                  <th className="py-2.5 px-3">Sr.</th>
                  <th className="py-2.5 px-3">Course / Subject Name</th>
                  <th className="py-2.5 px-3 text-center">Course Code</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3 text-center">Year</th>
                  <th className="py-2.5 px-3 text-center">Evaluation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D7E3EA] text-[#172B4D]">
                {teacherSubjects.map((sub, idx) => (
                  <tr key={sub.id} className="hover:bg-[#F5F9FC] transition-colors">
                    <td className="py-2.5 px-3 text-[#64748B] font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-[#172B4D]">
                      {sub.course_title || sub.subject_name}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-[#0B1F3A]">
                      {(sub as any).course_code || (sub as any).courseCode || 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-[#64748B]">{sub.department}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 bg-[#F5F9FC] text-[#0B1F3A] font-semibold rounded-md text-[11px] border border-[#D7E3EA]">
                        {sub.year}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-[#64748B]">
                      Unit 1 (30M) • Unit 2 (30M)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-[#F5F9FC] rounded-2xl border border-dashed border-[#D7E3EA] space-y-2">
            <BookOpen className="w-8 h-8 text-[#64748B] mx-auto" />
            <p className="text-xs font-bold text-[#172B4D]">No personal courses added yet.</p>
            <p className="text-[11px] text-[#64748B]">
              Click the "Add Course" button to add the subjects and course codes you teach.
            </p>
          </div>
        )}
      </div>

      {/* 5. Teaching Load Summary Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#D7E3EA] shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-[#F5F9FC] text-[#0B1F3A] rounded-2xl border border-[#D7E3EA]">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#64748B] font-medium">My Total Students</span>
            <div className="text-xl font-black text-[#172B4D]">{teacherStudents.length}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D7E3EA] shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-[#F5F9FC] text-[#0B1F3A] rounded-2xl border border-[#D7E3EA]">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#64748B] font-medium">My Total Subjects</span>
            <div className="text-xl font-black text-[#172B4D]">{teacherSubjects.length}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D7E3EA] shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-[#F5F9FC] text-[#0B1F3A] rounded-2xl border border-[#D7E3EA]">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#64748B] font-medium">Marks Evaluated</span>
            <div className="text-xl font-black text-[#172B4D]">{teacherMarks.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
