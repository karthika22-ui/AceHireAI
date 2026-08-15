import React, { useState } from 'react';
import {
  Brain,
  Briefcase,
  MessageSquare,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  GraduationCap,
  School,
  Building2,
  Award,
  Sparkles,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserStatus } from '../../types';

export const LoginPage: React.FC = () => {
  const { login, signup, loginWithGoogle } = useApp();

  // Mode State
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpStep, setSignUpStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State - Basic Details
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Form State - User Status & Relevant Fields
  const [userStatus, setUserStatus] = useState<UserStatus>('College Student');

  // Plus Two Student
  const [schoolName, setSchoolName] = useState('');
  const [stream, setStream] = useState('');
  const [expectedCompletionYear, setExpectedCompletionYear] = useState('');

  // College / Graduate / Postgraduate
  const [college, setCollege] = useState('');
  const [degree, setDegree] = useState('');
  const [department, setDepartment] = useState('');
  const [currentYear, setCurrentYear] = useState('3rd Year');
  const [graduationYear, setGraduationYear] = useState('');

  // Working Professional / Job Seeker
  const [highestQualification, setHighestQualification] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [company, setCompany] = useState('');
  const [experience, setExperience] = useState('');
  const [targetIndustry, setTargetIndustry] = useState('');
  const [passoutYear, setPassoutYear] = useState('');

  const triggerAuth = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isSignUp) {
        await signup(email, password, {
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
        });
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp && signUpStep === 1) {
      setSignUpStep(2);
      return;
    }
    triggerAuth();
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Google Sign-In failed. Please check your network and Supabase settings.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] w-full flex flex-col items-center justify-between px-4 sm:px-6 py-6 select-none overflow-y-auto relative font-sans bg-gradient-to-b from-[#060913] via-[#0B1124] to-[#120B2E] text-white">
      {/* Soft Ambient AI Lighting & Glows */}
      <div className="absolute top-1/3 -left-28 w-[650px] h-[650px] bg-[#9333EA]/20 rounded-full blur-[170px] pointer-events-none" />
      <div className="absolute top-1/3 -right-28 w-[650px] h-[650px] bg-[#0284C7]/25 rounded-full blur-[170px] pointer-events-none" />

      {/* Main Glass Container */}
      <div className="w-full max-w-4xl relative z-10 bg-[#070B1D]/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-slate-700/60 shadow-[0_0_35px_rgba(56,189,248,0.15)] grid grid-cols-1 md:grid-cols-12 gap-6 items-start my-auto">
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
              {isSignUp ? 'Create Account' : 'AI Placement Platform Login'}
            </h2>
            <p className="text-xs text-slate-300 font-normal leading-relaxed">
              {isSignUp
                ? 'Tell us your background so AI can tailor your mock interviews, coding practice, and roadmaps.'
                : 'Welcome back! Sign in to access your interview progress, ATS resume analyses, and custom learning roadmaps.'}
            </p>
          </div>

          <div className="space-y-2 pt-1 hidden sm:block">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Tailored by your current status & education</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#C084FC]" />
              <span>AI Feedback & Preparation Roadmaps</span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="md:col-span-7 flex flex-col justify-center space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Sign In with Google (Only on Login view) */}
          {!isSignUp && (
            <>
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                type="button"
                className="w-full py-2.5 rounded-xl border border-slate-700/80 hover:border-[#38BDF8] bg-[#0D1432]/90 hover:bg-[#121B45] font-bold text-xs text-white flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] shadow-md group cursor-pointer"
              >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center gap-3 my-0.5">
                <div className="h-[1px] bg-slate-800 flex-1 relative" />
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
                  OR EMAIL LOGIN
                </span>
                <div className="h-[1px] bg-slate-800 flex-1 relative" />
              </div>
            </>
          )}

          {/* Signup Step Indicators */}
          {isSignUp && (
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => setSignUpStep(1)}
                className={`flex-1 text-center py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  signUpStep === 1
                    ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                1. Basic Details
              </button>
              <button
                type="button"
                onClick={() => setSignUpStep(2)}
                className={`flex-1 text-center py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  signUpStep === 2
                    ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                2. Status & Details
              </button>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* LOGIN MODE */}
            {!isSignUp && (
              <div className="space-y-3">
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
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-800 bg-[#050816] text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/30 transition-all"
                    />
                  </div>
                </div>

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
                      className="w-full pl-10 pr-10 py-2 rounded-xl border border-slate-800 bg-[#050816] text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/30 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-2.5 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SIGNUP MODE */}
            {isSignUp && (
              <>
                {/* STEP 1: BASIC DETAILS */}
                {signUpStep === 1 && (
                  <div className="space-y-3 animate-in fade-in">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                        FULL NAME *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Karthik Subramanian"
                          className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-800 bg-[#050816] text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-[#38BDF8] transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                        EMAIL ADDRESS *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="karthik@college.edu"
                          className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-800 bg-[#050816] text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-[#38BDF8] transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                        PHONE NUMBER *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-800 bg-[#050816] text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-[#38BDF8] transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                        PASSWORD *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-10 pr-10 py-2 rounded-xl border border-slate-800 bg-[#050816] text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-[#38BDF8] transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-2.5 text-slate-500 hover:text-slate-300"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: USER STATUS & RELEVANT EDUCATION/CAREER FIELDS */}
                {signUpStep === 2 && (
                  <div className="space-y-3 animate-in fade-in">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                        CURRENT STATUS *
                      </label>
                      <select
                        value={userStatus}
                        onChange={(e) => setUserStatus(e.target.value as UserStatus)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-800 bg-[#050816] text-xs font-bold text-cyan-400 focus:outline-none focus:border-[#38BDF8]"
                      >
                        <option value="College Student">🎓 College Student</option>
                        <option value="Plus Two Student">🏫 Plus Two Student</option>
                        <option value="Graduate">📜 Graduate</option>
                        <option value="Postgraduate">🎓 Postgraduate</option>
                        <option value="Working Professional">💼 Working Professional</option>
                        <option value="Job Seeker">🎯 Job Seeker</option>
                      </select>
                    </div>

                    {/* PLUS TWO STUDENT */}
                    {userStatus === 'Plus Two Student' && (
                      <div className="space-y-2.5 pt-1">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                            SCHOOL NAME *
                          </label>
                          <input
                            type="text"
                            required
                            value={schoolName}
                            onChange={(e) => setSchoolName(e.target.value)}
                            placeholder="e.g. St. Bede's Higher Secondary School"
                            className="w-full px-4 py-2 rounded-xl border border-slate-800 bg-[#050816] text-xs text-white placeholder-slate-500 focus:border-[#38BDF8] focus:outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                              STREAM *
                            </label>
                            <input
                              type="text"
                              required
                              value={stream}
                              onChange={(e) => setStream(e.target.value)}
                              placeholder="e.g. Bio-Math / Computer Science"
                              className="w-full px-4 py-2 rounded-xl border border-slate-800 bg-[#050816] text-xs text-white placeholder-slate-500 focus:border-[#38BDF8] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                              COMPLETION YEAR *
                            </label>
                            <input
                              type="text"
                              required
                              value={expectedCompletionYear}
                              onChange={(e) => setExpectedCompletionYear(e.target.value)}
                              placeholder="e.g. 2026"
                              className="w-full px-4 py-2 rounded-xl border border-slate-800 bg-[#050816] text-xs text-white placeholder-slate-500 focus:border-[#38BDF8] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* COLLEGE STUDENT */}
                    {userStatus === 'College Student' && (
                      <div className="space-y-2.5 pt-1">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                            COLLEGE / UNIVERSITY NAME *
                          </label>
                          <input
                            type="text"
                            required
                            value={college}
                            onChange={(e) => setCollege(e.target.value)}
                            placeholder="e.g. CEG Anna University / SSN College"
                            className="w-full px-4 py-2 rounded-xl border border-slate-800 bg-[#050816] text-xs text-white placeholder-slate-500 focus:border-[#38BDF8] focus:outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                              DEGREE *
                            </label>
                            <input
                              type="text"
                              required
                              value={degree}
                              onChange={(e) => setDegree(e.target.value)}
                              placeholder="e.g. B.E / B.Tech / B.Sc"
                              className="w-full px-4 py-2 rounded-xl border border-slate-800 bg-[#050816] text-xs text-white placeholder-slate-500 focus:border-[#38BDF8] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                              DEPARTMENT *
                            </label>
                            <input
                              type="text"
                              required
                              value={department}
                              onChange={(e) => setDepartment(e.target.value)}
                              placeholder="e.g. CSE / ECE / IT"
                              className="w-full px-4 py-2 rounded-xl border border-slate-800 bg-[#050816] text-xs text-white placeholder-slate-500 focus:border-[#38BDF8] focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                              CURRENT YEAR *
                            </label>
                            <select
                              value={currentYear}
                              onChange={(e) => setCurrentYear(e.target.value)}
                              className="w-full px-4 py-2 rounded-xl border border-slate-800 bg-[#050816] text-xs text-white focus:border-[#38BDF8] focus:outline-none"
                            >
                              <option value="1st Year">1st Year</option>
                              <option value="2nd Year">2nd Year</option>
                              <option value="3rd Year">3rd Year</option>
                              <option value="4th Year">4th Year</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                              GRADUATION YEAR *
                            </label>
                            <input
                              type="text"
                              required
                              value={graduationYear}
                              onChange={(e) => setGraduationYear(e.target.value)}
                              placeholder="e.g. 2026"
                              className="w-full px-4 py-2 rounded-xl border border-slate-800 bg-[#050816] text-xs text-white placeholder-slate-500 focus:border-[#38BDF8] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* GRADUATE OR POSTGRADUATE */}
                    {(userStatus === 'Graduate' || userStatus === 'Postgraduate') && (
                      <div className="space-y-2.5 pt-1">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                            COLLEGE / UNIVERSITY NAME *
                          </label>
                          <input
                            type="text"
                            required
                            value={college}
                            onChange={(e) => setCollege(e.target.value)}
                            placeholder="e.g. PSG Tech / Anna University"
                            className="w-full px-4 py-2 rounded-xl border border-slate-800 bg-[#050816] text-xs text-white placeholder-slate-500 focus:border-[#38BDF8] focus:outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                              DEGREE *
                            </label>
                            <input
                              type="text"
                              required
                              value={degree}
                              onChange={(e) => setDegree(e.target.value)}
                              placeholder="e.g. B.Tech / M.Tech / MCA"
                              className="w-full px-4 py-2 rounded-xl border border-slate-800 bg-[#050816] text-xs text-white placeholder-slate-500 focus:border-[#38BDF8] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                              DEPARTMENT *
                            </label>
                            <input
                              type="text"
                              required
                              value={department}
                              onChange={(e) => setDepartment(e.target.value)}
                              placeholder="e.g. CSE / ECE / IT"
                              className="w-full px-4 py-2 rounded-xl border border-slate-800 bg-[#050816] text-xs text-white placeholder-slate-500 focus:border-[#38BDF8] focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                            GRADUATION YEAR *
                          </label>
                          <input
                            type="text"
                            required
                            value={graduationYear}
                            onChange={(e) => setGraduationYear(e.target.value)}
                            placeholder="e.g. 2025"
                            className="w-full px-4 py-2 rounded-xl border border-slate-800 bg-[#050816] text-xs text-white placeholder-slate-500 focus:border-[#38BDF8] focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* WORKING PROFESSIONAL */}
                    {userStatus === 'Working Professional' && (
                      <div className="space-y-2.5 pt-1">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                              HIGHEST QUALIFICATION *
                            </label>
                            <input
                              type="text"
                              required
                              value={highestQualification}
                              onChange={(e) => setHighestQualification(e.target.value)}
                              placeholder="e.g. B.E / M.Tech / MCA"
                              className="w-full px-4 py-2 rounded-xl border border-slate-800 bg-[#050816] text-xs text-white placeholder-slate-500 focus:border-[#38BDF8] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                              CURRENT ROLE *
                            </label>
                            <input
                              type="text"
                              required
                              value={currentRole}
                              onChange={(e) => setCurrentRole(e.target.value)}
                              placeholder="e.g. Software Engineer"
                              className="w-full px-4 py-2 rounded-xl border border-slate-800 bg-[#050816] text-xs text-white placeholder-slate-500 focus:border-[#38BDF8] focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                              COMPANY NAME *
                            </label>
                            <input
                              type="text"
                              required
                              value={company}
                              onChange={(e) => setCompany(e.target.value)}
                              placeholder="e.g. Zoho / TCS / Wipro"
                              className="w-full px-4 py-2 rounded-xl border border-slate-800 bg-[#050816] text-xs text-white placeholder-slate-500 focus:border-[#38BDF8] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                              EXPERIENCE (YEARS) *
                            </label>
                            <input
                              type="text"
                              required
                              value={experience}
                              onChange={(e) => setExperience(e.target.value)}
                              placeholder="e.g. 2 Years"
                              className="w-full px-4 py-2 rounded-xl border border-slate-800 bg-[#050816] text-xs text-white placeholder-slate-500 focus:border-[#38BDF8] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* JOB SEEKER */}
                    {userStatus === 'Job Seeker' && (
                      <div className="space-y-2.5 pt-1">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                              HIGHEST QUALIFICATION *
                            </label>
                            <input
                              type="text"
                              required
                              value={highestQualification}
                              onChange={(e) => setHighestQualification(e.target.value)}
                              placeholder="e.g. B.Tech / MCA / B.Sc"
                              className="w-full px-4 py-2 rounded-xl border border-slate-800 bg-[#050816] text-xs text-white placeholder-slate-500 focus:border-[#38BDF8] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                              TARGET INDUSTRY / FIELD *
                            </label>
                            <input
                              type="text"
                              required
                              value={targetIndustry}
                              onChange={(e) => setTargetIndustry(e.target.value)}
                              placeholder="e.g. Software / Data Science"
                              className="w-full px-4 py-2 rounded-xl border border-slate-800 bg-[#050816] text-xs text-white placeholder-slate-500 focus:border-[#38BDF8] focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                              PASSOUT YEAR *
                            </label>
                            <input
                              type="text"
                              required
                              value={passoutYear}
                              onChange={(e) => setPassoutYear(e.target.value)}
                              placeholder="e.g. 2025"
                              className="w-full px-4 py-2 rounded-xl border border-slate-800 bg-[#050816] text-xs text-white placeholder-slate-500 focus:border-[#38BDF8] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                              EXPERIENCE *
                            </label>
                            <input
                              type="text"
                              required
                              value={experience}
                              onChange={(e) => setExperience(e.target.value)}
                              placeholder="e.g. Fresher / 1 Year"
                              className="w-full px-4 py-2 rounded-xl border border-slate-800 bg-[#050816] text-xs text-white placeholder-slate-500 focus:border-[#38BDF8] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ACTION BUTTONS */}
            <div className="pt-2 flex items-center gap-3">
              {isSignUp && signUpStep > 1 && (
                <button
                  type="button"
                  onClick={() => setSignUpStep(1)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-[#050816] text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#0284C7] via-[#2563EB] to-[#9333EA] hover:from-[#0369A1] hover:via-[#1D4ED8] hover:to-[#7C3AED] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_35px_rgba(37,99,235,0.6)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border border-[#38BDF8]/40 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : isSignUp ? (
                  signUpStep === 1 ? (
                    <>
                      <span>Next Step</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Complete Signup & Launch</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Switch */}
          <div className="text-center pt-1">
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
                    className="text-[#38BDF8] hover:text-white font-bold underline cursor-pointer ml-1"
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
                      setSignUpStep(1);
                      setErrorMsg(null);
                    }}
                    className="text-[#38BDF8] hover:text-white font-bold underline cursor-pointer ml-1"
                  >
                    Create Account
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      <footer className="text-[11px] text-slate-400/65 font-medium z-10 pt-2 opacity-65">
        © 2026 AceHire AI | Placement Preparation Platform
      </footer>
    </div>
  );
};
