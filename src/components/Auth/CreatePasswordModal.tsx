import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, KeyRound, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CreatePasswordModal: React.FC = () => {
  const { user, showCreatePasswordModal, setShowCreatePasswordModal, createHasHirePassword } = useApp();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!showCreatePasswordModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!newPassword.trim()) {
      setErrorMsg('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your password.');
      return;
    }

    setLoading(true);
    try {
      await createHasHirePassword(newPassword);
      setSuccessMsg('HasHire AI password created successfully! You can now log in with either Google or Email + Password.');
      setTimeout(() => {
        setShowCreatePasswordModal(false);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-md bg-[#070B1D]/95 border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-[0_0_40px_rgba(56,189,248,0.2)] space-y-5 font-sans">
        {/* Soft Ambient Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#38BDF8]/15 rounded-full blur-[70px] pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-[#38BDF8]/20 to-[#9333EA]/20 text-[#38BDF8] border border-sky-500/30 shrink-0">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-tight font-['Space_Grotesk']">
              Create your HasHire AI password
            </h2>
            <p className="text-xs text-slate-300 font-medium mt-0.5 leading-relaxed">
              You signed in with Google. Create a password to also sign in with your email.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Read-Only Email Field */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                disabled
                className="w-full bg-[#0D1432]/60 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-400 cursor-not-allowed select-all"
              />
            </div>
          </div>

          {/* New Password Field */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
              NEW PASSWORD
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type={showNewPass ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 characters)"
                disabled={loading}
                required
                className="w-full bg-[#0D1432]/90 border border-slate-700/80 focus:border-[#38BDF8] rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
              CONFIRM PASSWORD
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type={showConfirmPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password to confirm"
                disabled={loading}
                required
                className="w-full bg-[#0D1432]/90 border border-slate-700/80 focus:border-[#38BDF8] rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#C084FC] hover:opacity-95 text-white text-xs font-extrabold tracking-wide flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_0_20px_rgba(56,189,248,0.3)] disabled:opacity-50 cursor-pointer mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Password...</span>
              </>
            ) : (
              <span>Create Password</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
