import React, { useState } from 'react';
import {
  Brain,
  Briefcase,
  MessageSquare,
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  Key,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LoginPage: React.FC = () => {
  const { login, signup, user } = useApp();

  // State
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');

  // Save Login Information Modal State
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [pendingLogin, setPendingLogin] = useState<{ email: string; pass: string } | null>(null);

  const triggerLogin = async (targetEmail: string, targetPass: string) => {
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isSignUp) {
        await signup(targetEmail, targetPass, {
          name: name || user.name,
          college: college || user.college
        });
      } else {
        await login(targetEmail, targetPass);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    triggerLogin(email, password);
  };

  const handleGoogleSignIn = () => {
    triggerLogin('google.student@college.edu', 'googlepass123');
  };

  return (
    <div className="h-[calc(100vh-65px)] w-full flex flex-col items-center justify-between px-4 sm:px-6 py-4 select-none overflow-hidden relative font-sans bg-gradient-to-b from-[#060913] via-[#0B1124] to-[#120B2E] text-white">
      {/* 1. Soft Ambient AI Lighting & Glows */}
      <div className="absolute top-1/3 -left-28 w-[650px] h-[650px] bg-[#9333EA]/20 rounded-full blur-[170px] pointer-events-none" />
      <div className="absolute top-1/3 -right-28 w-[650px] h-[650px] bg-[#0284C7]/25 rounded-full blur-[170px] pointer-events-none" />
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-gradient-to-r from-[#2563EB]/15 via-[#7C3AED]/15 to-[#0284C7]/15 rounded-full blur-[150px] pointer-events-none" />

      {/* Stationary Light Particles */}
      <div className="absolute top-16 left-1/5 w-1.5 h-1.5 bg-[#38BDF8] rounded-full opacity-70 shadow-[0_0_10px_#38BDF8] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-[#C084FC] rounded-full opacity-70 shadow-[0_0_10px_#C084FC] pointer-events-none" />
      <div className="absolute bottom-1/3 left-12 w-1.5 h-1.5 bg-[#34D399] rounded-full opacity-70 shadow-[0_0_8px_#34D399] pointer-events-none" />
      <div className="absolute bottom-20 right-16 w-2 h-2 bg-[#FBBF24] rounded-full opacity-65 shadow-[0_0_10px_#FBBF24] pointer-events-none" />

      {/* SVG AI Wave Mesh Lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-35"
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="wavePurpleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C084FC" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#9333EA" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="waveBlueGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0" />
            <stop offset="50%" stopColor="#2563EB" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <path
          d="M-100 500 C 200 420, 400 580, 700 480 C 1000 380, 1200 520, 1500 450"
          stroke="url(#wavePurpleGrad)"
          strokeWidth="2.5"
          fill="none"
        />
        <path
          d="M-100 450 C 300 550, 600 400, 900 520 C 1200 640, 1400 460, 1600 500"
          stroke="url(#waveBlueGrad)"
          strokeWidth="2.5"
          fill="none"
        />
      </svg>

      {/* Spacer for vertical balance */}
      <div />

      {/* 2. Main Login Glass Card */}
      <div className="w-full max-w-4xl relative z-10 bg-[#070B1D]/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-slate-700/60 shadow-[0_0_35px_rgba(56,189,248,0.15)] grid grid-cols-1 md:grid-cols-12 gap-6 items-center animate-in fade-in zoom-in-95 duration-500">
        {/* Left Side: Brand Hero */}
        <div className="md:col-span-5 flex flex-col justify-center space-y-4 pr-0 md:pr-5 md:border-r border-slate-800/80 pointer-events-none select-none">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-[#38BDF8]/50 via-[#9333EA]/40 to-[#C084FC]/50 p-0.5 shadow-[0_0_35px_rgba(56,189,248,0.35)]">
            <div className="w-full h-full bg-[#080E21]/90 backdrop-blur-xl rounded-[22px] flex items-center justify-center relative overflow-hidden">
              <Brain className="w-8 h-8 sm:w-9 sm:h-9 text-[#38BDF8] animate-pulse" />
              <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C084FC] absolute top-2 right-2" />
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#34D399] absolute bottom-2 left-2" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-['Space_Grotesk'] text-white">
              AceHire{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#C084FC]">
                AI
              </span>
            </h1>

            <div className="text-[11px] font-extrabold tracking-wider uppercase flex items-center gap-1.5 mt-1">
              <span className="text-[#38BDF8]">PRACTICE SMART.</span>
              <span className="text-[#818CF8]">GET HIRED.</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-wide">
              AI-Powered Placement Platform
            </h2>
            <p className="text-xs text-slate-300 font-normal leading-relaxed">
              Master interviews, coding, aptitude, and resume preparation — all in one AI platform powered by Supabase.
            </p>
          </div>

          <div className="space-y-2 pt-1 hidden sm:block">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Real-Time Tanglish & English Feedback</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#C084FC]" />
              <span>Instant ATS Resume Optimization</span>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Form */}
        <div className="md:col-span-7 flex flex-col justify-center space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Continue with Google */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            type="button"
            className="w-full py-2.5 rounded-xl border border-slate-700/80 hover:border-[#38BDF8] bg-[#0D1432]/90 hover:bg-[#121B45] font-bold text-xs text-white flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] shadow-md hover:shadow-[0_0_25px_rgba(56,189,248,0.25)] group cursor-pointer"
          >
            <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-0.5">
            <div className="h-[1px] bg-slate-800 flex-1 relative">
              <div className="w-1.5 h-1.5 bg-[#38BDF8] rotate-45 absolute -right-0.75 -top-0.5 shadow-[0_0_6px_#38BDF8]" />
            </div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
              OR SUPABASE EMAIL AUTHENTICATION
            </span>
            <div className="h-[1px] bg-slate-800 flex-1 relative">
              <div className="w-1.5 h-1.5 bg-[#C084FC] rotate-45 absolute -left-0.75 -top-0.5 shadow-[0_0_6px_#C084FC]" />
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Registration Fields */}
            {isSignUp && (
              <div className="space-y-2.5 animate-in fade-in">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                    FULL NAME
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Karthik Subramanian"
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-800 bg-[#050816] text-xs font-medium text-white placeholder-slate-500 hover:border-[#38BDF8]/60 focus:outline-none focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/30 transition-all duration-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                    COLLEGE / INSTITUTION
                  </label>
                  <input
                    type="text"
                    required
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="CEG Anna University"
                    className="w-full px-4 py-2 rounded-xl border border-slate-800 bg-[#050816] text-xs font-medium text-white placeholder-slate-500 hover:border-[#38BDF8]/60 focus:outline-none focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/30 transition-all duration-300"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@college.edu"
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-800 bg-[#050816] text-xs font-medium text-white placeholder-slate-500 hover:border-[#38BDF8]/60 hover:shadow-[0_0_15px_rgba(56,189,248,0.15)] focus:outline-none focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/30 transition-all duration-300"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                PASSWORD
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2 rounded-xl border border-slate-800 bg-[#050816] text-xs font-medium text-white placeholder-slate-500 hover:border-[#38BDF8]/60 hover:shadow-[0_0_15px_rgba(56,189,248,0.15)] focus:outline-none focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/30 transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#0284C7] via-[#2563EB] to-[#9333EA] hover:from-[#0369A1] hover:via-[#1D4ED8] hover:to-[#7C3AED] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_35px_rgba(37,99,235,0.6)] hover:shadow-[0_0_45px_rgba(56,189,248,0.85)] hover:scale-[1.02] active:scale-95 transition-all duration-300 cursor-pointer border border-[#38BDF8]/40 mt-1 group relative overflow-hidden disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <span className="relative z-10">{isSignUp ? 'Create Account & Launch' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="text-center pt-0.5">
            <p className="text-xs text-slate-400 font-normal">
              {isSignUp ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      setErrorMsg(null);
                    }}
                    className="text-[#38BDF8] hover:text-white font-bold underline cursor-pointer ml-1 transition-all duration-300 hover:scale-[1.02] inline-block"
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setErrorMsg(null);
                    }}
                    className="text-[#38BDF8] hover:text-white font-bold underline cursor-pointer ml-1 transition-all duration-300 hover:scale-[1.02] inline-block"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      <footer className="text-[11px] text-slate-400/65 font-medium z-10 pb-1 opacity-65">
        © 2026 AceHire AI | AI Placement Preparation Platform
      </footer>
    </div>
  );
};
