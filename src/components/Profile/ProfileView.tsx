import React, { useState, useRef } from 'react';
import { 
  User, Mail, Phone, GraduationCap, Building2, Edit3, Save, CheckCircle2, 
  Camera, X, Upload, Trash2, Sparkles, Lock, Shield, Clock, Key
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserStatus } from '../../types';

const AVATAR_PRESETS = [
  // 5 Professional Female Avatars
  { id: 'f1', gender: 'Female', title: 'Corporate Lead', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80' },
  { id: 'f2', gender: 'Female', title: 'Product Manager', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80' },
  { id: 'f3', gender: 'Female', title: 'Tech Consultant', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80' },
  { id: 'f4', gender: 'Female', title: 'Data Analyst', url: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=300&auto=format&fit=crop&q=80' },
  { id: 'f5', gender: 'Female', title: 'Software Engineer', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80' },

  // 5 Professional Male Avatars
  { id: 'm1', gender: 'Male', title: 'Software Architect', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80' },
  { id: 'm2', gender: 'Male', title: 'Tech Lead', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80' },
  { id: 'm3', gender: 'Male', title: 'Executive Associate', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80' },
  { id: 'm4', gender: 'Male', title: 'Full Stack Dev', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80' },
  { id: 'm5', gender: 'Male', title: 'Engineering Manager', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80' }
];

export const ProfileView: React.FC = () => {
  const { user, setUser } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Form State
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [userStatus, setUserStatus] = useState<UserStatus>(user.userStatus || 'College Student');
  const [schoolName, setSchoolName] = useState(user.schoolName || '');
  const [stream, setStream] = useState(user.stream || '');
  const [expectedCompletionYear, setExpectedCompletionYear] = useState(user.expectedCompletionYear || '');
  const [college, setCollege] = useState(user.college || '');
  const [degree, setDegree] = useState(user.degree || '');
  const [department, setDepartment] = useState(user.department || '');
  const [currentYear, setCurrentYear] = useState(user.currentYear || '3rd Year');
  const [graduationYear, setGraduationYear] = useState(user.graduationYear || '');
  const [highestQualification, setHighestQualification] = useState(user.highestQualification || '');
  const [currentRole, setCurrentRole] = useState(user.currentRole || '');
  const [company, setCompany] = useState(user.company || '');
  const [experience, setExperience] = useState(user.experience || '');
  const [targetIndustry, setTargetIndustry] = useState(user.targetIndustry || '');
  const [passoutYear, setPassoutYear] = useState(user.passoutYear || '');

  // Sync state when active user changes
  React.useEffect(() => {
    setName(user.name || '');
    setPhone(user.phone || '');
    setUserStatus(user.userStatus || 'College Student');
    setSchoolName(user.schoolName || '');
    setStream(user.stream || '');
    setExpectedCompletionYear(user.expectedCompletionYear || '');
    setCollege(user.college || '');
    setDegree(user.degree || '');
    setDepartment(user.department || '');
    setCurrentYear(user.currentYear || '3rd Year');
    setGraduationYear(user.graduationYear || '');
    setHighestQualification(user.highestQualification || '');
    setCurrentRole(user.currentRole || '');
    setCompany(user.company || '');
    setExperience(user.experience || '');
    setTargetIndustry(user.targetIndustry || '');
    setPassoutYear(user.passoutYear || '');
  }, [user]);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const updatedUser = {
      ...user,
      name,
      phone,
      userStatus,
      schoolName,
      stream,
      expectedCompletionYear,
      college,
      degree,
      department,
      currentYear,
      graduationYear,
      highestQualification,
      currentRole,
      company,
      experience,
      targetIndustry,
      passoutYear
    };

    setUser(updatedUser);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSelectAvatar = (url: string) => {
    setUser({ ...user, avatarUrl: url });
    setShowAvatarModal(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setUser({ ...user, avatarUrl: reader.result as string });
          setShowAvatarModal(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setUser({ ...user, avatarUrl: AVATAR_PRESETS[0].url });
    setShowAvatarModal(false);
  };

  const openPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setShowPasswordModal(false);
    setPasswordSuccess(true);
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  return (
    <div className="flex-1 overflow-y-auto max-h-full space-y-6 max-w-4xl mx-auto py-4 px-4 sm:px-6 relative animate-in fade-in duration-300">
      {/* Ambient Background Glows */}
      <div className="absolute -top-20 -left-20 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none dark:opacity-100 opacity-30" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none dark:opacity-100 opacity-30" />

      {/* Main Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-purple-500/20 bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl shadow-xl space-y-7 relative overflow-hidden transition-all duration-300 hover:border-purple-500/40">
        
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800/80 pb-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            {/* Avatar */}
            <div className="relative group cursor-pointer shrink-0" onClick={() => setShowAvatarModal(true)}>
              <img
                src={user.avatarUrl || AVATAR_PRESETS[0].url}
                alt={user.name}
                className="w-22 h-22 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-cyan-500/40 shadow-xl shadow-cyan-500/20 transition-all duration-300 group-hover:ring-purple-400 group-hover:scale-105"
              />
              <button
                type="button"
                className="absolute bottom-0 right-0 p-2 rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-lg border-2 border-white dark:border-slate-900 transition-all duration-200 group-hover:scale-110 cursor-pointer"
                title="Change Profile Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Name, Email, Status Badge */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {user.name}
                </h1>
                <span className="px-3 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-300 text-xs font-bold">
                  {user.userStatus || 'College Student'}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
                  {user.email}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                    {user.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="relative overflow-hidden group px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-extrabold shadow-lg shadow-purple-600/30 transition-all duration-300 flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <button
              onClick={() => handleSaveProfile()}
              className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-600/30 transition-all duration-300 flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          )}
        </div>

        {/* Notifications */}
        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Profile updated successfully!
          </div>
        )}

        {passwordSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Password updated successfully!
          </div>
        )}

        {/* VIEW MODE */}
        {!isEditing ? (
          <div className="space-y-6">
            {/* Section 1: Basic & Personal Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800/60">
                <User className="w-4 h-4 text-purple-600 dark:text-cyan-400" />
                <h2 className="text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  Personal Details
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-slate-700 dark:text-slate-300">
                <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Full Name
                  </span>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                    {user.name}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Email Address
                  </span>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                    {user.email}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Phone Number
                  </span>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                    {user.phone || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Education / Career Information (STATUS SPECIFIC) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800/60">
                <GraduationCap className="w-4 h-4 text-purple-600 dark:text-cyan-400" />
                <h2 className="text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  {user.userStatus === 'Working Professional' ? 'Career & Qualification Details' : 'Education Details'}
                </h2>
              </div>

              {/* PLUS TWO STUDENT VIEW */}
              {user.userStatus === 'Plus Two Student' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1 sm:col-span-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      School Name
                    </span>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {user.schoolName || 'Not provided'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Stream
                    </span>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {user.stream || 'Not provided'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Expected Completion Year
                    </span>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {user.expectedCompletionYear || 'Not provided'}
                    </p>
                  </div>
                </div>
              )}

              {/* COLLEGE STUDENT VIEW */}
              {user.userStatus === 'College Student' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1 sm:col-span-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      College Name
                    </span>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {user.college || 'Not provided'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Degree
                    </span>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {user.degree || 'Not provided'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Department
                    </span>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {user.department || 'Not provided'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Current Year of Study
                    </span>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {user.currentYear || 'Not provided'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Graduation Year
                    </span>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {user.graduationYear || 'Not provided'}
                    </p>
                  </div>
                </div>
              )}

              {/* GRADUATE OR POSTGRADUATE VIEW */}
              {(user.userStatus === 'Graduate' || user.userStatus === 'Postgraduate') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1 sm:col-span-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      College Name
                    </span>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {user.college || 'Not provided'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Degree
                    </span>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {user.degree || 'Not provided'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Department
                    </span>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {user.department || 'Not provided'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1 sm:col-span-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Graduation Year
                    </span>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {user.graduationYear || 'Not provided'}
                    </p>
                  </div>
                </div>
              )}

              {/* WORKING PROFESSIONAL VIEW */}
              {user.userStatus === 'Working Professional' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Highest Qualification
                    </span>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {user.highestQualification || 'Not provided'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Current Role
                    </span>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {user.currentRole || 'Not provided'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Company
                    </span>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {user.company || 'Not provided'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Experience
                    </span>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {user.experience || 'Not provided'}
                    </p>
                  </div>
                </div>
              )}

              {/* JOB SEEKER VIEW */}
              {user.userStatus === 'Job Seeker' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Highest Qualification
                    </span>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {user.highestQualification || 'Not provided'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Target Industry
                    </span>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {user.targetIndustry || 'Not provided'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Passout Year
                    </span>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {user.passoutYear || 'Not provided'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Experience
                    </span>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {user.experience || 'Fresher'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* EDIT MODE */
          <form onSubmit={handleSaveProfile} className="space-y-5 animate-in fade-in">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800/60">
              <Edit3 className="w-4 h-4 text-purple-600 dark:text-cyan-400" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                Edit Profile Information
              </h2>
            </div>

            {/* Basic Info Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Status Selection */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Current Status *
              </label>
              <select
                value={userStatus}
                onChange={(e) => setUserStatus(e.target.value as UserStatus)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
              >
                <option value="College Student">🎓 College Student</option>
                <option value="Plus Two Student">🏫 Plus Two Student</option>
                <option value="Graduate">📜 Graduate</option>
                <option value="Postgraduate">🎓 Postgraduate</option>
                <option value="Working Professional">💼 Working Professional</option>
                <option value="Job Seeker">🎯 Job Seeker</option>
              </select>
            </div>

            {/* Status-Specific Education / Career Fields */}

            {userStatus === 'Plus Two Student' && (
              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    School Name
                  </label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Stream
                    </label>
                    <input
                      type="text"
                      value={stream}
                      onChange={(e) => setStream(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Expected Completion Year
                    </label>
                    <input
                      type="text"
                      value={expectedCompletionYear}
                      onChange={(e) => setExpectedCompletionYear(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {userStatus === 'College Student' && (
              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    College Name
                  </label>
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Degree
                    </label>
                    <input
                      type="text"
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Department
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Current Year
                    </label>
                    <select
                      value={currentYear}
                      onChange={(e) => setCurrentYear(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Graduation Year
                    </label>
                    <input
                      type="text"
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {(userStatus === 'Graduate' || userStatus === 'Postgraduate') && (
              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    College Name
                  </label>
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Degree
                    </label>
                    <input
                      type="text"
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Department
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Graduation Year
                  </label>
                  <input
                    type="text"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {userStatus === 'Working Professional' && (
              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Highest Qualification
                    </label>
                    <input
                      type="text"
                      value={highestQualification}
                      onChange={(e) => setHighestQualification(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Current Role
                    </label>
                    <input
                      type="text"
                      value={currentRole}
                      onChange={(e) => setCurrentRole(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Company
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Experience (Years)
                    </label>
                    <input
                      type="text"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {userStatus === 'Job Seeker' && (
              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Highest Qualification
                    </label>
                    <input
                      type="text"
                      value={highestQualification}
                      onChange={(e) => setHighestQualification(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Target Industry
                    </label>
                    <input
                      type="text"
                      value={targetIndustry}
                      onChange={(e) => setTargetIndustry(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Passout Year
                    </label>
                    <input
                      type="text"
                      value={passoutYear}
                      onChange={(e) => setPassoutYear(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Experience
                    </label>
                    <input
                      type="text"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              >
                Save Profile
              </button>
            </div>
          </form>
        )}

        {/* Security Section */}
        <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-2 pb-1">
            <Shield className="w-4 h-4 text-purple-600 dark:text-cyan-400" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
              Security & Credentials
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Password & Security</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Update account credentials safely</p>
                </div>
              </div>

              <button
                type="button"
                onClick={openPasswordModal}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-600/20 border border-slate-300 dark:border-slate-700 text-purple-700 dark:text-purple-300 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 shadow-sm"
              >
                <Key className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                Change Password
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Profile Status
                </span>
                <Clock className="w-4 h-4 text-purple-600 dark:text-cyan-400" />
              </div>
              <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">Active</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Saved & Synced</p>
            </div>
          </div>
        </div>

      </div>

      {/* AVATAR POPUP MODAL */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-purple-500/30 bg-white dark:bg-slate-900/95 max-w-2xl w-full shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Choose Profile Photo</h3>
              </div>
              <button
                onClick={() => setShowAvatarModal(false)}
                className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Custom File Upload & Remove Actions (Unchanged) */}
            <div className="grid grid-cols-2 gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-600/20 hover:bg-purple-100 dark:hover:bg-purple-600/30 border border-purple-200 dark:border-purple-500/40 text-purple-700 dark:text-purple-300 text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Upload Custom Photo
              </button>

              <button
                type="button"
                onClick={handleRemovePhoto}
                className="p-3 rounded-2xl bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                Remove Photo
              </button>
            </div>

            {/* 10 Professional AI Avatar Options */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Select Professional AI Avatar (5 Female, 5 Male)
                </span>
                <span className="text-[10px] font-bold text-purple-600 dark:text-cyan-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                  10 Clean Options
                </span>
              </div>

              {/* 5-Column Responsive Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 max-h-80 overflow-y-auto p-1.5">
                {AVATAR_PRESETS.map((avatar) => {
                  const isSelected = user.avatarUrl === avatar.url;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => handleSelectAvatar(avatar.url)}
                      className={`relative group rounded-2xl overflow-hidden aspect-square border-2 transition-all duration-300 focus:outline-none cursor-pointer ${
                        isSelected
                          ? 'border-purple-500 ring-4 ring-purple-500/40 ring-offset-2 dark:ring-offset-slate-900 shadow-xl shadow-purple-500/30 scale-105 z-10'
                          : 'border-slate-200 dark:border-slate-800 hover:border-purple-400 hover:scale-102 hover:shadow-md'
                      }`}
                    >
                      <img
                        src={avatar.url}
                        alt={`${avatar.gender} Avatar - ${avatar.title}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />

                      {/* Selected Highlight Overlay Badge */}
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg animate-in zoom-in">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      )}

                      {/* Hover / Selected Label Badge */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent p-1.5 text-center">
                        <span className="text-[9px] font-bold text-white block truncate leading-tight">
                          {avatar.title}
                        </span>
                        <span className="text-[8px] text-slate-300 block opacity-80 uppercase tracking-tighter">
                          {avatar.gender}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PASSWORD CHANGE MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-purple-500/30 bg-white dark:bg-slate-900/95 max-w-md w-full shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Change Password</h3>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
