import React, { useState, useRef, useEffect } from 'react';
import { 
  User, Mail, Phone, GraduationCap, Building2, Edit3, Save, CheckCircle2, 
  Camera, X, Upload, Trash2, Sparkles, Lock, Shield, Key, Brain, Languages, Briefcase, LogOut
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserStatus, LanguagePreference } from '../../types';
import { SupabaseService } from '../../services/supabaseClient';

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
  const { user, setUser, logout } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Form State Pre-filled Directly from User Account Single Source of Truth
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
  const [preferredLanguage, setPreferredLanguage] = useState<LanguagePreference>(user.preferredLanguage || 'Tanglish');
  const [gender, setGender] = useState<string>(user.gender || '');

  // Synchronize local form state whenever active user data changes
  useEffect(() => {
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
    setPreferredLanguage(user.preferredLanguage || 'Tanglish');
    setGender(user.gender || '');
  }, [user]);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Save Profile Changes Handler (Updates Single Source of Truth in Context, LocalStorage & Supabase)
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
      passoutYear,
      preferredLanguage,
      gender
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    try {
      const { error } = await SupabaseService.updatePassword(newPassword);
      if (error) {
        setPasswordError(error.message || 'Failed to update password in Supabase.');
        return;
      }
      setShowPasswordModal(false);
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to update password.');
    }
  };

  // Helper to check if any academic/professional field is present for rendering
  const hasAcademicDetails = Boolean(
    (user.userStatus === 'College Student' && (user.college || user.degree || user.department || user.currentYear || user.graduationYear)) ||
    (user.userStatus === 'Plus Two Student' && (user.schoolName || user.stream || user.expectedCompletionYear)) ||
    ((user.userStatus === 'Graduate' || user.userStatus === 'Postgraduate') && (user.college || user.degree || user.department || user.graduationYear)) ||
    (user.userStatus === 'Working Professional' && (user.highestQualification || user.currentRole || user.company || user.experience)) ||
    (user.userStatus === 'Job Seeker' && (user.highestQualification || user.targetIndustry || user.passoutYear || user.experience))
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col h-full overflow-y-auto overflow-x-hidden space-y-6 relative animate-in fade-in duration-300 pr-1 pb-10">
      
      {/* Ambient Background Glows */}
      <div className="absolute -top-20 -left-20 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none dark:opacity-100 opacity-30" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none dark:opacity-100 opacity-30" />

      {/* Main Glass Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-purple-500/20 bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl shadow-xl space-y-7 relative overflow-hidden transition-all duration-300">
        
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800/80 pb-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            
            {/* Avatar Photo Container */}
            <div className="relative group cursor-pointer shrink-0" onClick={() => setShowAvatarModal(true)}>
              <img
                src={user.avatarUrl || AVATAR_PRESETS[0].url}
                alt={user.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-cyan-500/40 shadow-xl shadow-cyan-500/20 transition-all duration-300 group-hover:ring-purple-400 group-hover:scale-105"
              />
              <button
                type="button"
                className="absolute bottom-0 right-0 p-2.5 rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-lg border-2 border-white dark:border-slate-900 transition-all duration-200 group-hover:scale-110 cursor-pointer"
                title="Change Profile Photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Name, Email, Status & Language Badges */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-['Space_Grotesk']">
                  {user.name}
                </h1>
                <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-300 text-xs font-extrabold">
                  {user.userStatus || 'College Student'}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-300 text-xs font-bold flex items-center gap-1">
                  <Languages className="w-3 h-3 text-cyan-400" />
                  <span>{user.preferredLanguage || 'Tanglish'}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
                  {user.email}
                </span>
                {user.phone ? (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                    {user.phone}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-extrabold shadow-lg shadow-purple-600/30 transition-all duration-300 flex items-center gap-2 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSaveProfile()}
                className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-600/30 transition-all duration-300 flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            )}

            <button
              type="button"
              onClick={logout}
              className="px-4 py-2.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-extrabold shadow-sm transition-all duration-300 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
              title="Log out of your account"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Success Toasts */}
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

        {/* VIEW MODE: PERFECT VERTICAL ALIGNMENT & PREFERRED AI LANGUAGE PLACEMENT DIRECTLY ABOVE CHANGE PASSWORD */}
        {!isEditing ? (
          <div className="space-y-7">
            
            {/* Section 1: Personal Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800/60">
                <User className="w-4 h-4 text-purple-600 dark:text-cyan-400" />
                <h2 className="text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  Personal Details
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
                    Full Name
                  </span>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                    {user.name}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
                    Email Address
                  </span>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate" title={user.email}>
                    {user.email}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
                    Phone Number
                  </span>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                    {user.phone || 'Not provided'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
                    Gender / Addressing
                  </span>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                    {user.gender === 'Male'
                      ? 'Male (Bro in Tanglish)'
                      : user.gender === 'Female'
                      ? 'Female (Sis in Tanglish)'
                      : 'Not specified (Neutral)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Education / Academic & Career Details */}
            {hasAcademicDetails && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800/60">
                  <GraduationCap className="w-4 h-4 text-purple-600 dark:text-cyan-400" />
                  <h2 className="text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                    {user.userStatus === 'Working Professional' ? 'Career Details' : 'Academic & Education Details'}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* College / Institution */}
                  {user.college ? (
                    <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1 md:col-span-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                        College / Institution
                      </span>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                        {user.college}
                      </p>
                    </div>
                  ) : null}

                  {/* School Name */}
                  {user.schoolName ? (
                    <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1 md:col-span-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                        School Name
                      </span>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                        {user.schoolName}
                      </p>
                    </div>
                  ) : null}

                  {/* Degree */}
                  {user.degree ? (
                    <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                        Degree / Program
                      </span>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                        {user.degree}
                      </p>
                    </div>
                  ) : null}

                  {/* Department */}
                  {user.department ? (
                    <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                        Department / Branch
                      </span>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                        {user.department}
                      </p>
                    </div>
                  ) : null}

                  {/* Current Year */}
                  {user.currentYear ? (
                    <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                        Year of Study
                      </span>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                        {user.currentYear}
                      </p>
                    </div>
                  ) : null}

                  {/* Graduation Year */}
                  {user.graduationYear ? (
                    <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                        Graduation Year
                      </span>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                        {user.graduationYear}
                      </p>
                    </div>
                  ) : null}

                  {/* Stream */}
                  {user.stream ? (
                    <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                        Stream
                      </span>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                        {user.stream}
                      </p>
                    </div>
                  ) : null}

                  {/* Highest Qualification */}
                  {user.highestQualification ? (
                    <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                        Highest Qualification
                      </span>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                        {user.highestQualification}
                      </p>
                    </div>
                  ) : null}

                  {/* Current Role */}
                  {user.currentRole ? (
                    <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                        Current Role
                      </span>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                        {user.currentRole}
                      </p>
                    </div>
                  ) : null}

                  {/* Company */}
                  {user.company ? (
                    <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                        Company Name
                      </span>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                        {user.company}
                      </p>
                    </div>
                  ) : null}

                  {/* Target Industry */}
                  {user.targetIndustry ? (
                    <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                        Target Industry
                      </span>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                        {user.targetIndustry}
                      </p>
                    </div>
                  ) : null}

                  {/* Experience */}
                  {user.experience ? (
                    <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                        Experience
                      </span>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                        {user.experience}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Section 3: PREFERRED AI LANGUAGE SECTION (POSITIONED DIRECTLY ABOVE CHANGE PASSWORD) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800/60">
                <Languages className="w-4 h-4 text-purple-600 dark:text-cyan-400" />
                <h2 className="text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  AI Feedback Language Preference
                </h2>
              </div>

              <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Preferred AI Language
                  </span>
                  <p className="text-sm font-extrabold text-indigo-600 dark:text-cyan-400">
                    {user.preferredLanguage === 'English'
                      ? '🇬🇧 Standard English'
                      : '🌐 Tanglish (Tamil written in English script)'}
                  </p>
                </div>
                <span className="px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-300 text-xs font-extrabold shrink-0">
                  {user.preferredLanguage || 'Tanglish'}
                </span>
              </div>
            </div>

            {/* Section 4: ACCOUNT SECURITY & CHANGE PASSWORD SECTION */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800/60">
                <Shield className="w-4 h-4 text-purple-600 dark:text-cyan-400" />
                <h2 className="text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  Account Security & Password
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                      Password & Security
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Password is encrypted and stored securely.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openPasswordModal}
                    className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-extrabold flex items-center gap-2 cursor-pointer shrink-0 transition-all"
                  >
                    <Key className="w-4 h-4 text-indigo-500" />
                    <span>Change Password</span>
                  </button>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                      Active Account Session
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Sign out safely. Progress remains saved.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={logout}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold shadow-lg shadow-red-600/30 flex items-center gap-2 cursor-pointer shrink-0 transition-all hover:scale-105 active:scale-95"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out / Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (

          /* EDIT MODE: UPDATES SINGLE SOURCE OF TRUTH WITH MATCHING ALIGNMENT */
          <form onSubmit={handleSaveProfile} className="space-y-6 animate-in fade-in">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800/60">
              <Edit3 className="w-4 h-4 text-purple-600 dark:text-cyan-400" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                Edit Profile Information
              </h2>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 truncate">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-xs sm:text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 truncate">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold text-xs sm:text-sm cursor-not-allowed"
                  title="Email address cannot be changed"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 truncate">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-xs sm:text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 truncate">
                  Gender / Addressing
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-xs sm:text-sm focus:border-purple-500 focus:outline-none cursor-pointer"
                >
                  <option value="">Prefer not to say (Neutral)</option>
                  <option value="Male">Male (Bro in Tanglish)</option>
                  <option value="Female">Female (Sis in Tanglish)</option>
                  <option value="Other">Other (Neutral)</option>
                </select>
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
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none cursor-pointer"
              >
                <option value="College Student">🎓 College Student</option>
                <option value="Plus Two Student">🏫 Plus Two Student</option>
                <option value="Graduate">📜 Graduate</option>
                <option value="Postgraduate">🎓 Postgraduate</option>
                <option value="Working Professional">💼 Working Professional</option>
                <option value="Job Seeker">🎯 Job Seeker</option>
              </select>
            </div>

            {/* College Student / Graduate Fields */}
            {(userStatus === 'College Student' || userStatus === 'Graduate' || userStatus === 'Postgraduate') && (
              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    College / Institution Name
                  </label>
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="Enter college or university name"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Degree
                    </label>
                    <input
                      type="text"
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      placeholder="e.g. B.E. Computer Science"
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
                      placeholder="e.g. CSE / IT / ECE"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userStatus === 'College Student' && (
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                        Current Year of Study
                      </label>
                      <select
                        value={currentYear}
                        onChange={(e) => setCurrentYear(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none cursor-pointer"
                      >
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Graduation Year
                    </label>
                    <input
                      type="text"
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      placeholder="e.g. 2025"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Plus Two Student Fields */}
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
                    placeholder="Enter school name"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Stream
                    </label>
                    <input
                      type="text"
                      value={stream}
                      onChange={(e) => setStream(e.target.value)}
                      placeholder="e.g. Computer Science / Maths"
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
                      placeholder="e.g. 2025"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Working Professional / Job Seeker Fields */}
            {(userStatus === 'Working Professional' || userStatus === 'Job Seeker') && (
              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Highest Qualification
                    </label>
                    <input
                      type="text"
                      value={highestQualification}
                      onChange={(e) => setHighestQualification(e.target.value)}
                      placeholder="e.g. B.E. Computer Science"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  {userStatus === 'Working Professional' ? (
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                        Current Role
                      </label>
                      <input
                        type="text"
                        value={currentRole}
                        onChange={(e) => setCurrentRole(e.target.value)}
                        placeholder="e.g. Software Engineer"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                        Target Industry
                      </label>
                      <input
                        type="text"
                        value={targetIndustry}
                        onChange={(e) => setTargetIndustry(e.target.value)}
                        placeholder="e.g. IT / Software Services"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userStatus === 'Working Professional' ? (
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Enter company name"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                        Passout Year
                      </label>
                      <input
                        type="text"
                        value={passoutYear}
                        onChange={(e) => setPassoutYear(e.target.value)}
                        placeholder="e.g. 2024"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Years of Experience
                    </label>
                    <input
                      type="text"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="e.g. 1 Year / Fresher"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PREFERRED AI LANGUAGE SELECTION (POSITIONED DIRECTLY ABOVE ACTIONS / CHANGE PASSWORD) */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Preferred AI Feedback Language
              </label>
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value as LanguagePreference)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:border-purple-500 focus:outline-none cursor-pointer"
              >
                <option value="Tanglish">🌐 Tanglish (Tamil written in English)</option>
                <option value="English">🇬🇧 Standard English</option>
              </select>
            </div>

            {/* Submit / Cancel Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-extrabold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* AVATAR SELECTION & PHOTO UPLOAD MODAL */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-white font-['Space_Grotesk']">
                  Change Profile Photo
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Upload a custom photo or choose from 10 professional presets.
                </p>
              </div>
              <button
                onClick={() => setShowAvatarModal(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Upload Area */}
            <div className="p-4 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/60 flex flex-col items-center justify-center text-center gap-2">
              <Upload className="w-7 h-7 text-indigo-400 animate-bounce" />
              <div className="text-xs">
                <span className="font-extrabold text-white">Upload Profile Photo</span>
                <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG or WebP up to 5MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs cursor-pointer shadow"
              >
                Choose Photo File
              </button>
            </div>

            {/* Presets Grid */}
            <div className="space-y-3">
              <span className="text-xs font-extrabold uppercase text-slate-400 block tracking-wider">
                Or Select Professional Preset
              </span>
              <div className="grid grid-cols-5 gap-3 max-h-48 overflow-y-auto p-1">
                {AVATAR_PRESETS.map((avatar) => (
                  <img
                    key={avatar.id}
                    src={avatar.url}
                    alt={avatar.title}
                    onClick={() => handleSelectAvatar(avatar.url)}
                    className="w-16 h-16 rounded-full object-cover border-2 border-slate-700 hover:border-purple-500 hover:scale-110 transition-all cursor-pointer shadow"
                  />
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-xs text-red-400 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove Custom Photo
              </button>

              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-extrabold text-xs hover:bg-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECURE CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-extrabold text-white font-['Space_Grotesk']">
                  Change Password
                </h3>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">
                  {passwordError}
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-1">
                  Current Password *
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-bold text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-bold text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-bold text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-extrabold text-xs hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow cursor-pointer"
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

export default ProfileView;
