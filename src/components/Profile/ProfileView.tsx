import React, { useState, useRef } from 'react';
import { 
  User, Mail, GraduationCap, Building2, Globe, Edit3, Save, CheckCircle2, 
  Camera, X, Upload, Trash2, Sparkles, Lock, Shield, Clock, Key, Eye, EyeOff 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LanguagePreference } from '../../types';

const AVATAR_PRESETS = [
  { id: 'f1', gender: 'Female', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { id: 'f2', gender: 'Female', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
  { id: 'f3', gender: 'Female', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' },
  { id: 'm1', gender: 'Male', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' },
  { id: 'm2', gender: 'Male', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80' },
  { id: 'm3', gender: 'Male', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: 'n1', gender: 'Neutral', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80' },
  { id: 'n2', gender: 'Neutral', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80' }
];

export const ProfileView: React.FC = () => {
  const { user, setUser } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [name, setName] = useState(user.name);
  const [college, setCollege] = useState(user.college);
  const [department, setDepartment] = useState(user.department);
  const [preferredLang, setPreferredLang] = useState<LanguagePreference>(user.preferredLanguage);

  // Sync state when active user changes
  React.useEffect(() => {
    setName(user.name);
    setCollege(user.college);
    setDepartment(user.department);
    setPreferredLang(user.preferredLanguage);
  }, [user]);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setUser({
      ...user,
      name,
      college,
      department,
      preferredLanguage: preferredLang
    });
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
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setShowPasswordModal(true);
  };

  const resetPasswordModal = () => {
    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
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
    resetPasswordModal();
    setPasswordSuccess(true);
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  return (
    <div className="flex-1 overflow-y-auto max-h-full space-y-6 max-w-4xl mx-auto py-4 px-4 sm:px-6 relative animate-in fade-in duration-300">
      {/* Subtle Purple & Cyan Ambient Background Glows */}
      <div className="absolute -top-20 -left-20 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none dark:opacity-100 opacity-30" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none dark:opacity-100 opacity-30" />

      {/* Main Premium Glassmorphism Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-purple-500/20 bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl shadow-xl space-y-7 relative overflow-hidden transition-all duration-300 hover:border-purple-500/40">
        
        {/* Profile Header: Avatar, Name, Email, Edit Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800/80 pb-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            
            {/* Profile Avatar with Change Photo Trigger */}
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

            {/* Name and Email */}
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {user.name}
              </h1>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-2">
                <Mail className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                <span>{user.email}</span>
              </p>
            </div>
          </div>

          {/* Edit Profile Button with Smooth Shine Animation */}
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="relative overflow-hidden group px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-extrabold shadow-lg shadow-purple-600/30 transition-all duration-300 flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span className="absolute inset-0 w-full h-full bg-white/25 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />
              <Edit3 className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Edit Profile</span>
            </button>
          ) : (
            <button
              onClick={() => handleSaveProfile()}
              className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-600/30 transition-all duration-300 flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          )}
        </div>

        {/* Success Notifications */}
        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            Profile updated successfully!
          </div>
        )}

        {passwordSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            Password updated successfully!
          </div>
        )}

        {/* Section 1: Personal Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800/60">
            <User className="w-4 h-4 text-purple-600 dark:text-cyan-400" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 dark:from-purple-400 dark:via-cyan-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Personal Information
            </h2>
          </div>

          {!isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-700 dark:text-slate-300 font-medium">
              <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1 transition-all hover:border-purple-500/30 shadow-sm">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Full Name
                </span>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                  {user.name}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1 transition-all hover:border-purple-500/30 shadow-sm">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Email Address
                </span>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                  <Mail className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                  {user.email}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1 transition-all hover:border-purple-500/30 shadow-sm">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  College Name
                </span>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                  <Building2 className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                  {user.college}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1 transition-all hover:border-purple-500/30 shadow-sm">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Department
                </span>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                  {user.department}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1 sm:col-span-2 transition-all hover:border-purple-500/30 shadow-sm">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Preferred Language
                </span>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                  {user.preferredLanguage}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    College Name
                  </label>
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:border-purple-500"
                    required
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
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Preferred Language
                  </label>
                  <select
                    value={preferredLang}
                    onChange={(e) => setPreferredLang(e.target.value as LanguagePreference)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:border-purple-500"
                  >
                    <option value="Tanglish">Tanglish (Tamil + English)</option>
                    <option value="English">Standard English</option>
                  </select>
                </div>
              </div>

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
        </div>

        {/* Section 2: Security Section */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800/60">
            <Shield className="w-4 h-4 text-purple-600 dark:text-cyan-400" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 dark:from-purple-400 dark:via-cyan-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Security
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Change Password Card */}
            <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-purple-500/30 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Password & Authentication</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Update your security credentials</p>
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

            {/* Last Updated Card */}
            <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1.5 transition-all hover:border-purple-500/30 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Last Updated
                </span>
                <Clock className="w-4 h-4 text-purple-600 dark:text-cyan-400" />
              </div>
              <p className="text-base font-extrabold text-slate-900 dark:text-white">Today</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Up to date</p>
            </div>
          </div>
        </div>

      </div>

      {/* Modal 1: AVATAR / PROFILE PHOTO MODAL POPUP */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-purple-500/30 bg-white dark:bg-slate-900/95 max-w-md w-full shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Change Profile Photo</h3>
              </div>
              <button
                onClick={() => setShowAvatarModal(false)}
                className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Actions: Upload Photo, Remove Photo */}
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
                Upload Photo
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

            {/* Preset Avatars Selection */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Or Choose an AI Avatar
              </span>
              <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto pr-1">
                {AVATAR_PRESETS.map((avatar) => (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => handleSelectAvatar(avatar.url)}
                    className="relative group rounded-2xl overflow-hidden ring-2 ring-transparent hover:ring-purple-400 transition-all focus:outline-none cursor-pointer"
                  >
                    <img
                      src={avatar.url}
                      alt={avatar.gender}
                      className="w-full h-16 object-cover transition-transform group-hover:scale-110"
                    />
                    <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[9px] font-bold text-center text-slate-300 py-0.5">
                      {avatar.gender}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cancel Button */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: CHANGE PASSWORD MODAL POPUP WITH INDEPENDENT EYE ICON TOGGLES */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-purple-500/30 bg-white dark:bg-slate-900/95 max-w-md w-full shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-purple-600 dark:text-cyan-400" />
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Change Password</h3>
              </div>
              <button
                onClick={resetPasswordModal}
                className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold">
                  {passwordError}
                </div>
              )}

              {/* Current Password Field */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:border-purple-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer p-1"
                    title={showCurrentPassword ? "Hide password" : "Show password"}
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4 text-purple-600 dark:text-cyan-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password Field */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:border-purple-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer p-1"
                    title={showNewPassword ? "Hide password" : "Show password"}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4 text-purple-600 dark:text-cyan-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm New Password Field */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:border-purple-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer p-1"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 text-purple-600 dark:text-cyan-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={resetPasswordModal}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
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
