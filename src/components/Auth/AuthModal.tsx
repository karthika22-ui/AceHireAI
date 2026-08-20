import React, { useState } from 'react';
import { X, Sparkles, User, GraduationCap, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, user, setUser, signup, login, resendVerificationEmail } = useApp();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('signup');

  // Form fields
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(user.phone || '');
  const [userStatus, setUserStatus] = useState(user.userStatus || 'College Student');
  const [college, setCollege] = useState(user.college || '');
  const [department, setDepartment] = useState(user.department || '');
  const [loading, setLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isUnconfirmedEmail, setIsUnconfirmedEmail] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleResendVerification = async () => {
    if (!email.trim() || isResending) return;
    setIsResending(true);
    setModalError(null);
    setModalSuccess(null);
    try {
      await resendVerificationEmail(email);
      setModalSuccess(`📬 Verification email resent to ${email}! Please check your inbox.`);
      setIsUnconfirmedEmail(false);
    } catch (err: any) {
      setModalError(err?.message || 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setModalError(null);
    setModalSuccess(null);
    setIsUnconfirmedEmail(false);

    try {
      if (mode === 'signup' && password) {
        await signup(email, password, {
          name,
          phone,
          userStatus,
          college,
          department
        });
      } else if (mode === 'login' && password) {
        await login(email, password);
      } else {
        setUser({
          ...user,
          name,
          email,
          phone,
          userStatus,
          college,
          department
        });
      }
      setIsAuthModalOpen(false);
    } catch (err: any) {
      const msg = err?.message || 'Operation failed. Please try again.';
      if (msg.toLowerCase().includes('email not confirmed') || msg.toLowerCase().includes('email_not_confirmed')) {
        setIsUnconfirmedEmail(true);
        setModalError('Your email address has not been verified yet. Please check your inbox.');
      } else {
        setModalError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AceHire AI Placement Profile</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {mode === 'signup' ? 'Create Student Profile' : mode === 'login' ? 'Welcome Back' : 'Reset Password'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tailor AI Mock Interviews & Placement Practice to your goals.
          </p>
        </div>

        {/* Alerts */}
        {modalError && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex flex-col gap-2">
            <span>{modalError}</span>
            {isUnconfirmedEmail && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResending}
                className="mt-1 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all w-fit cursor-pointer disabled:opacity-50"
              >
                {isResending ? 'Sending...' : 'Resend Verification Email'}
              </button>
            )}
          </div>
        )}

        {modalSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            {modalSuccess}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Karthik Subramanian"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    College / University
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      placeholder="e.g. CEG Anna Univ"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Department
                  </label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. CSE / ECE / IT"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@college.edu"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl btn-primary text-white font-bold text-base flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            <span>Save Profile & Start Preparing</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Switch */}
        <div className="text-center mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
          {mode === 'signup' ? (
            <span>
              Already have an account?{' '}
              <button onClick={() => setMode('login')} className="text-blue-500 font-bold hover:underline">
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Need a profile?{' '}
              <button onClick={() => setMode('signup')} className="text-blue-500 font-bold hover:underline">
                Create Account
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
