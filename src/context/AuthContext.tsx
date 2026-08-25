import React, { createContext, useContext, useState, useEffect } from 'react';
import { Teacher } from '../types';
import { StorageService } from '../utils/storage';
import { hashPassword, verifyPassword } from '../utils/crypto';

interface AuthContextType {
  currentTeacher: Teacher | null;
  currentUser: Teacher | null; // Compatibility alias
  isAuthenticated: boolean;
  registerTeacher: (name: string, password: string) => Promise<{ success: boolean; message: string; teacherId?: string; teacher?: Teacher }>;
  login: (teacherId: string, password: string) => Promise<{ success: boolean; message: string; teacher?: Teacher }>;
  loginWithCredentials: (teacherId: string, password?: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (teacherId: string, name: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  updateTeacherName: (newName: string) => { success: boolean; message: string };
  updateTeacherProfile: (profileData: Partial<Teacher>) => { success: boolean; message: string; teacher?: Teacher };
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  isTeacher: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(() => {
    try {
      const activeId = StorageService.getActiveTeacherId();
      if (!activeId) return null;
      const teachers = StorageService.getTeachers();
      return teachers.find((t) => t.teacher_id.toUpperCase() === activeId.toUpperCase()) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (currentTeacher) {
      StorageService.setActiveTeacherId(currentTeacher.teacher_id);
    } else {
      StorageService.setActiveTeacherId(null);
    }
  }, [currentTeacher]);

  const registerTeacher = async (name: string, password: string) => {
    try {
      const cleanName = name.trim();
      if (!cleanName || cleanName.length < 2) {
        return { success: false, message: 'Please enter a valid Full Name.' };
      }
      if (!password || password.length < 4) {
        return { success: false, message: 'Password must be at least 4 characters.' };
      }

      const nextTeacherId = StorageService.generateNextTeacherId();
      const passHash = await hashPassword(password);

      const newTeacher: Teacher = {
        id: `tch_${Date.now()}`,
        teacher_id: nextTeacherId,
        name: cleanName,
        password_hash: passHash,
        department: 'Computer Engineering',
        created_at: new Date().toISOString(),
      };

      const existingTeachers = StorageService.getTeachers();
      const updated = [newTeacher, ...existingTeachers];
      StorageService.saveTeachers(updated);

      return {
        success: true,
        message: 'Registration successful!',
        teacherId: newTeacher.teacher_id,
        teacher: newTeacher,
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to register teacher.' };
    }
  };

  const login = async (teacherId: string, password: string) => {
    try {
      const cleanId = teacherId.trim().toUpperCase();
      if (!cleanId) {
        return { success: false, message: 'Please enter your Teacher ID.' };
      }
      if (!password) {
        return { success: false, message: 'Please enter your password.' };
      }

      const teachers = StorageService.getTeachers();
      const found = teachers.find(
        (t) => t.teacher_id.toUpperCase() === cleanId
      );

      if (!found) {
        return {
          success: false,
          message: `Teacher ID "${teacherId}" not found. Please register first if you are a new teacher.`,
        };
      }

      const isMatch = await verifyPassword(password, found.password_hash);
      // Fallback for default seed teacher password
      const isSeedMatch = found.teacher_id === 'TCH001' && (password === 'teacher123' || password === 'admin');

      if (!isMatch && !isSeedMatch) {
        return { success: false, message: 'Incorrect password. Please try again or use Forgot Password.' };
      }

      setCurrentTeacher(found);
      return { success: true, message: 'Login successful!', teacher: found };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Login failed.' };
    }
  };

  const loginWithCredentials = async (teacherId: string, password?: string) => {
    return login(teacherId, password || '');
  };

  const resetPassword = async (teacherId: string, name: string, newPassword: string) => {
    try {
      const cleanId = teacherId.trim().toUpperCase();
      const cleanName = name.trim().toLowerCase();

      if (!cleanId || !cleanName) {
        return { success: false, message: 'Please provide both your Teacher ID and Registered Full Name.' };
      }
      if (!newPassword || newPassword.length < 4) {
        return { success: false, message: 'New password must be at least 4 characters long.' };
      }

      const teachers = StorageService.getTeachers();
      const found = teachers.find((t) => t.teacher_id.toUpperCase() === cleanId);

      if (!found) {
        return { success: false, message: `Teacher ID "${teacherId}" does not exist in the system.` };
      }

      // Check name match
      if (!found.name.toLowerCase().includes(cleanName) && !cleanName.includes(found.name.toLowerCase())) {
        return {
          success: false,
          message: 'The name provided does not match the registered record for this Teacher ID.',
        };
      }

      const newHash = await hashPassword(newPassword);
      const updated = teachers.map((t) => (t.id === found.id ? { ...t, password_hash: newHash } : t));
      StorageService.saveTeachers(updated);

      if (currentTeacher?.id === found.id) {
        setCurrentTeacher({ ...found, password_hash: newHash });
      }

      return { success: true, message: 'Password reset successfully! You can now log in.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to reset password.' };
    }
  };

  const updateTeacherName = (newName: string) => {
    try {
      if (!currentTeacher) return { success: false, message: 'Not logged in.' };
      const clean = newName.trim();
      if (!clean) return { success: false, message: 'Name cannot be empty.' };

      const teachers = StorageService.getTeachers();
      const updatedTeacher = { ...currentTeacher, name: clean };
      const updatedList = teachers.map((t) => (t.id === currentTeacher.id ? updatedTeacher : t));
      
      StorageService.saveTeachers(updatedList);
      setCurrentTeacher(updatedTeacher);

      return { success: true, message: 'Teacher name updated successfully.' };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Failed to update name.' };
    }
  };

  const updateTeacherProfile = (profileData: Partial<Teacher>) => {
    try {
      if (!currentTeacher) return { success: false, message: 'Not logged in.' };
      
      // Protect unique teacher_id and id from unauthorized modification
      const safeData = { ...profileData };
      delete safeData.teacher_id;
      delete safeData.teacherId;
      delete safeData.id;
      delete safeData.password_hash;

      const cleanName = safeData.name ? safeData.name.trim() : currentTeacher.name;
      if (!cleanName) return { success: false, message: 'Full Name cannot be empty.' };

      const teachers = StorageService.getTeachers();
      const updatedTeacher: Teacher = {
        ...currentTeacher,
        ...safeData,
        name: cleanName,
      };

      const updatedList = teachers.map((t) => (t.id === currentTeacher.id ? updatedTeacher : t));
      StorageService.saveTeachers(updatedList);
      setCurrentTeacher(updatedTeacher);

      return { success: true, message: 'Profile updated successfully.', teacher: updatedTeacher };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Failed to update profile.' };
    }
  };

  const changePassword = async (currentPass: string, newPass: string) => {
    try {
      if (!currentTeacher) return { success: false, message: 'Not logged in.' };
      if (!newPass || newPass.length < 4) {
        return { success: false, message: 'New password must be at least 4 characters.' };
      }

      const isCurrentValid = await verifyPassword(currentPass, currentTeacher.password_hash);
      const isSeedValid = currentTeacher.teacher_id === 'TCH001' && (currentPass === 'teacher123' || currentPass === 'admin');

      if (!isCurrentValid && !isSeedValid) {
        return { success: false, message: 'Current password does not match.' };
      }

      const newHash = await hashPassword(newPass);
      const teachers = StorageService.getTeachers();
      const updatedTeacher = { ...currentTeacher, password_hash: newHash };
      const updatedList = teachers.map((t) => (t.id === currentTeacher.id ? updatedTeacher : t));

      StorageService.saveTeachers(updatedList);
      setCurrentTeacher(updatedTeacher);

      return { success: true, message: 'Password updated successfully!' };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Failed to change password.' };
    }
  };

  const logout = () => {
    setCurrentTeacher(null);
    StorageService.setActiveTeacherId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentTeacher,
        currentUser: currentTeacher,
        isAuthenticated: !!currentTeacher,
        registerTeacher,
        login,
        loginWithCredentials,
        resetPassword,
        updateTeacherName,
        updateTeacherProfile,
        changePassword,
        logout,
        isTeacher: true,
        isAdmin: false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
