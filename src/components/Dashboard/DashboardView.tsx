import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  MessageSquare,
  FileText,
  CheckCircle2,
  Code2,
  BrainCircuit,
  MessageCircle,
  ArrowRight,
  Target,
  Zap,
  RotateCcw,
  Upload,
  Search,
  PlayCircle,
  Trash2,
  History,
  Map,
  X
} from 'lucide-react';
import { useApp, ActiveTab } from '../../context/AppContext';

export const DashboardView: React.FC = () => {
  const {
    user,
    readinessScore,
    setActiveTab,
    recentActivities,
    completedTasksCount,
    clearRecentActivities
  } = useApp();

  const [showClearConfirmModal, setShowClearConfirmModal] = useState<boolean>(false);
  const [showViewAllModal, setShowViewAllModal] = useState<boolean>(false);

  // Track module launch state locally in React state so "Start" -> "Continue" updates on launch
  const [startedModules, setStartedModules] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    ['interview', 'resume', 'coding', 'aptitude', 'communication'].forEach((id) => {
      map[id] = false;
    });
    return map;
  });

  const [unfinishedSession, setUnfinishedSession] = useState<any | null>(null);
  const [showUnfinishedModal, setShowUnfinishedModal] = useState<boolean>(false);

  const handleContinueUnfinished = () => {
    setShowUnfinishedModal(false);
    setActiveTab('interview');
  };

  const handleDiscardUnfinished = () => {
    setUnfinishedSession(null);
    setShowUnfinishedModal(false);
  };

  const handleLaunchModule = (id: ActiveTab) => {
    setStartedModules((prev) => ({ ...prev, [id]: true }));
    setActiveTab(id);
  };

  // Exactly 6 Placement Modules
  const featureCards = [
    {
      id: 'interview' as const,
      title: 'AI Mock Interview',
      description: 'Practice HR, Technical & Tanglish AI interview rounds with instant feedback.',
      progress: readinessScore.interview,
      icon: (
        <div className="relative flex items-center justify-center">
          <Bot className="w-5 h-5 text-[#38BDF8]" />
          <MessageSquare className="w-2.5 h-2.5 text-[#C084FC] absolute -top-1 -right-1 fill-[#C084FC]" />
        </div>
      ),
      color: 'from-blue-500/10 via-indigo-500/10 to-purple-500/10 border-blue-500/30'
    },
    {
      id: 'resume' as const,
      title: 'Resume Builder & ATS',
      description: 'Instant AI ATS scoring, missing keywords detection & formatting tips.',
      progress: readinessScore.resume,
      icon: (
        <div className="relative flex items-center justify-center">
          <FileText className="w-5 h-5 text-[#38BDF8]" />
          <CheckCircle2 className="w-2.5 h-2.5 text-[#34D399] absolute -bottom-0.5 -right-0.5 fill-[#34D399] text-slate-950" />
        </div>
      ),
      color: 'from-blue-500/10 to-cyan-500/10 border-blue-500/30'
    },
    {
      id: 'coding' as const,
      title: 'Coding Practice',
      description: 'Solve C, C++, Java, Python & SQL challenges with real-time AI code reviews.',
      progress: readinessScore.coding,
      icon: (
        <div className="relative flex items-center justify-center px-1 py-0.5 rounded bg-slate-900 border border-slate-700/80">
          <Code2 className="w-4 h-4 text-[#34D399]" />
        </div>
      ),
      color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/30'
    },
    {
      id: 'aptitude' as const,
      title: 'Aptitude Practice',
      description: 'Master Quantitative, Logical & Verbal reasoning with Tanglish step solutions.',
      progress: readinessScore.aptitude,
      icon: <BrainCircuit className="w-5 h-5 text-amber-400" />,
      color: 'from-amber-500/10 to-orange-500/10 border-amber-500/30'
    },
    {
      id: 'communication' as const,
      title: 'Communication Hub',
      description: 'AI Grammar corrector, tone enhancer & confidence booster for interviews.',
      progress: readinessScore.communication,
      icon: (
        <div className="relative flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-[#C084FC] fill-[#C084FC]/30" />
        </div>
      ),
      color: 'from-purple-500/10 to-pink-500/10 border-purple-500/30'
    },
  ];

  return (
    <div className="relative flex flex-col h-full overflow-hidden space-y-3.5 animate-in fade-in duration-300 rounded-3xl bg-transparent dark:bg-gradient-to-b dark:from-[#0F172A] dark:via-[#1E1B4B] dark:to-[#2E1065] text-slate-900 dark:text-white p-2 sm:p-3">
      
      {/* 1. Welcome Page Style Soft Ambient Refractive Lighting (Light Navy, Soft Blue & Subtle Violet Glows) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#38BDF8]/30 via-[#818CF8]/25 to-transparent rounded-full blur-[130px] pointer-events-none z-0 dark:opacity-100 opacity-20" />
      <div className="absolute top-1/3 -left-20 w-[600px] h-[600px] bg-[#818CF8]/30 rounded-full blur-[140px] pointer-events-none z-0 dark:opacity-100 opacity-20" />
      <div className="absolute top-1/3 -right-20 w-[600px] h-[600px] bg-[#C084FC]/30 rounded-full blur-[140px] pointer-events-none z-0 dark:opacity-100 opacity-20" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#38BDF8]/25 rounded-full blur-[130px] pointer-events-none z-0 dark:opacity-100 opacity-20" />

      {/* 1. FIXED Welcome Summary Card (Never Scrolls) */}
      <div className="shrink-0 relative z-10">
        <div className="animated-border-glow-wrapper">
          <div className="relative overflow-hidden rounded-[23px] bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-950 p-6 sm:p-7 text-white border-0 shadow-2xl">
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              {/* Welcome Text & Action Buttons */}
              <div className="space-y-3 max-w-xl">
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-['Space_Grotesk'] text-white">
                  {user.isFirstLogin === true || user.loginCount === 1
                    ? `Welcome, ${user.name ? user.name.split(' ')[0] : 'Student'}! 👋`
                    : `Welcome back, ${user.name ? user.name.split(' ')[0] : 'Student'}! 👋`}
                </h1>
                <p className="text-sm sm:text-base text-slate-100 dark:text-slate-300 font-medium">
                  Continue your AI-powered placement preparation.
                </p>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => handleLaunchModule('interview')}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-[#22C55E] hover:text-white text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-lg shadow-blue-600/30 hover:shadow-[#22C55E]/30 transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-95 group/btn"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => handleLaunchModule('resume')}
                    className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs sm:text-sm font-bold border border-slate-700 transition-all cursor-pointer"
                  >
                    Continue
                  </button>
                </div>
              </div>

              {/* Requirement 4: High-Contrast Placement Readiness Gauge Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/85 dark:bg-slate-950/85 border border-slate-700/80 shadow-2xl flex items-center gap-4.5 shrink-0 min-w-[280px]">
                {/* Circular Progress Gauge */}
                <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      stroke="#334155"
                      strokeWidth="7"
                      fill="transparent"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      stroke="#22C55E"
                      strokeWidth="7"
                      className="transition-all duration-1000 ease-out"
                      strokeDasharray={213}
                      strokeDashoffset={213 - (213 * readinessScore.overall) / 100}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <span className="absolute text-3xl font-black text-white drop-shadow-md tracking-tight">
                    {readinessScore.overall}%
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-300 uppercase font-extrabold tracking-wider block">
                    Placement Readiness
                  </span>
                  <strong className="text-lg font-extrabold text-white block mt-0.5">
                    {readinessScore.overall >= 80 ? 'Highly Ready' : 'In Progress'}
                  </strong>
                  <p className="text-xs text-emerald-400 font-bold mt-1">Overall Readiness Index</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* 2. SCROLLABLE CONTENT AREA with Reduced Vertical Spacing */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 pb-6 relative z-10">
        {/* Core Placement Modules */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 font-['Space_Grotesk']">
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 fill-blue-400/20 brightness-110" />
              <span>Placement Modules</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {featureCards.map((card) => {
              const buttonText = 'Continue';

              return (
                /* Requirement 5: Improved Module Cards with Brighter Border, Soft Shadow & 4px Lift on Hover */
                <div
                  key={card.id}
                  className="glass-card rounded-2xl p-5 border border-slate-300/80 dark:border-slate-700/80 bg-slate-900/70 backdrop-blur-xl shadow-md shadow-slate-950/20 hover:border-[#22C55E]/60 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#22C55E]/15 transition-all duration-300 ease-out flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2.5 rounded-xl border bg-gradient-to-br ${card.color} shadow-sm brightness-110`}>
                        {card.icon}
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Progress</span>
                        <span className="text-sm font-extrabold text-white">{card.progress}%</span>
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-[#22C55E] transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {card.description}
                    </p>
                  </div>

                  {/* Progress Bar & Dynamic Start Button */}
                  <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                    <div className="w-24 bg-slate-800/90 h-1.5 rounded-full overflow-hidden border border-slate-700/50">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${
                          card.progress > 0 ? 'bg-[#22C55E]' : 'bg-slate-500'
                        }`}
                        style={{ width: `${card.progress}%` }}
                      />
                    </div>

                    <button
                      onClick={() => handleLaunchModule(card.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 dark:bg-slate-800 text-white text-xs font-bold hover:bg-[#22C55E] dark:hover:bg-[#22C55E] hover:border-[#22C55E] border border-transparent dark:border-slate-700/60 hover:shadow-[0_0_18px_rgba(34,197,94,0.5)] transition-all duration-300 ease-out flex items-center gap-1.5 active:scale-95 cursor-pointer relative overflow-hidden group/btn"
                    >
                      <span className="relative z-10 text-white font-bold">{buttonText}</span>
                      <ArrowRight className="w-3.5 h-3.5 relative z-10 text-white group-hover/btn:translate-x-1.5 transition-transform duration-300 ease-out brightness-110" />
                      <span className="absolute inset-0 bg-white/25 opacity-0 group-active/btn:opacity-100 transition-opacity duration-150 rounded-xl pointer-events-none" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* 6th Card: Today's Goal Card (Rearranged into 3-column grid for zero empty space) */}
            <div className="glass-card rounded-2xl p-5 border border-slate-300/80 dark:border-slate-700/80 bg-slate-900/70 backdrop-blur-xl shadow-md shadow-slate-950/20 hover:border-amber-500/60 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/15 transition-all duration-300 ease-out flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 shadow-sm brightness-110">
                    <Target className="w-5 h-5 text-amber-400 brightness-110" />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Target Status</span>
                    <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full block mt-0.5 ${
                      completedTasksCount > 0
                        ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                        : 'text-slate-400 bg-slate-800/60 border border-slate-700'
                    }`}>
                      {completedTasksCount > 0 ? `${completedTasksCount} / 3 Tasks` : '0 / 3 Tasks'}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                  Today's Goal
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {completedTasksCount === 0
                    ? 'Complete 3 practice sessions (Mock Interview, Coding, Aptitude) to fulfill today\'s target.'
                    : `You have completed ${completedTasksCount} out of 3 goal tasks today.`}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="w-24 bg-slate-800/90 h-1.5 rounded-full overflow-hidden border border-slate-700/50">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      completedTasksCount > 0 ? 'bg-[#22C55E]' : 'bg-slate-500'
                    }`}
                    style={{ width: `${Math.min(100, (completedTasksCount / 3) * 100)}%` }}
                  />
                </div>

                <button
                  onClick={() => handleLaunchModule('interview')}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 dark:bg-slate-800 text-white text-xs font-bold hover:bg-[#22C55E] dark:hover:bg-[#22C55E] hover:border-[#22C55E] border border-transparent dark:border-slate-700/60 hover:shadow-[0_0_18px_rgba(34,197,94,0.5)] transition-all duration-300 ease-out flex items-center gap-1.5 active:scale-95 cursor-pointer relative overflow-hidden group/btn"
                >
                  <span className="relative z-10 text-white font-bold">Continue</span>
                  <ArrowRight className="w-3.5 h-3.5 relative z-10 text-white group-hover/btn:translate-x-1.5 transition-transform duration-300 ease-out brightness-110" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Bottom Grid: Quick Actions & Recent Activity (Balanced 2-Column Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Quick Actions Section */}
          <div className="glass-card rounded-2xl p-6 border border-slate-300/80 dark:border-slate-700/80 bg-slate-900/70 backdrop-blur-xl shadow-md shadow-slate-950/20 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 ease-out flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#38BDF8] fill-[#38BDF8]/20 brightness-110" />
                <span>Quick Actions</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleLaunchModule('interview')}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 hover:bg-purple-500/10 text-left transition-all duration-300 hover:scale-[1.02] active:scale-95 group cursor-pointer"
                  title="Start AI Mock Interview"
                >
                  <PlayCircle className="w-5 h-5 text-purple-300 mb-2 group-hover:scale-110 transition-transform brightness-110" />
                  <h4 className="text-xs font-bold text-white leading-snug">Start Mock Interview</h4>
                </button>

                <button
                  onClick={() => handleLaunchModule('coding')}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-left transition-all duration-300 hover:scale-[1.02] active:scale-95 group cursor-pointer"
                  title="Practice Coding"
                >
                  <Code2 className="w-5 h-5 text-emerald-300 mb-2 group-hover:scale-110 transition-transform brightness-110" />
                  <h4 className="text-xs font-bold text-white leading-snug">Practice Coding</h4>
                </button>

                <button
                  onClick={() => handleLaunchModule('resume')}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/50 hover:bg-blue-500/10 text-left transition-all duration-300 hover:scale-[1.02] active:scale-95 group cursor-pointer"
                  title="Upload Resume"
                >
                  <Upload className="w-5 h-5 text-blue-300 mb-2 group-hover:scale-110 transition-transform brightness-110" />
                  <h4 className="text-xs font-bold text-white leading-snug">Upload Resume</h4>
                </button>

                <button
                  onClick={() => handleLaunchModule('resume')}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-left transition-all duration-300 hover:scale-[1.02] active:scale-95 group cursor-pointer"
                  title="ATS Resume Check"
                >
                  <Search className="w-5 h-5 text-cyan-300 mb-2 group-hover:scale-110 transition-transform brightness-110" />
                  <h4 className="text-xs font-bold text-white leading-snug">ATS Resume Check</h4>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="glass-card rounded-2xl p-6 border border-slate-300/80 dark:border-slate-700/80 bg-slate-900/70 backdrop-blur-xl shadow-md shadow-slate-950/20 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 ease-out flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-emerald-400 brightness-110" />
                  <span>Recent Activity</span>
                </h3>

                {recentActivities.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowViewAllModal(true)}
                      className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-extrabold transition-all border border-blue-500/30 flex items-center gap-1 cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>View All ({recentActivities.length})</span>
                    </button>

                    <button
                      onClick={() => setShowClearConfirmModal(true)}
                      className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-extrabold transition-all border border-red-500/30 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  </div>
                )}
              </div>

              {recentActivities.length === 0 ? (
                <div className="py-8 text-center space-y-2 border border-dashed border-slate-700/60 rounded-xl bg-slate-900/40 p-4">
                  <p className="text-xs font-bold text-slate-300">No recent activity yet.</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Complete any practice module to see your activity history.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivities.slice(0, 5).map((act) => {
                    const targetTab: ActiveTab = 
                      (act.targetTab as ActiveTab) ||
                      (act.type === 'Interview' ? 'interview' : 
                      act.type === 'Coding' ? 'coding' : 
                      act.type === 'Aptitude' ? 'aptitude' : 
                      act.type === 'Communication' ? 'communication' :
                      act.type === 'Roadmap' ? 'roadmap' : 'resume');

                    return (
                      <div
                        key={act.id}
                        onClick={() => handleLaunchModule(targetTab)}
                        className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/50 flex items-center justify-between text-xs cursor-pointer transition-all hover:scale-[1.01] active:scale-95 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-blue-500/10">
                            {act.type === 'Interview' ? (
                              <Bot className="w-4 h-4 text-purple-300 brightness-110" />
                            ) : act.type === 'Coding' ? (
                              <Code2 className="w-4 h-4 text-emerald-300 brightness-110" />
                            ) : act.type === 'Aptitude' ? (
                              <BrainCircuit className="w-4 h-4 text-amber-300 brightness-110" />
                            ) : act.type === 'Communication' ? (
                              <MessageSquare className="w-4 h-4 text-pink-300 brightness-110" />
                            ) : act.type === 'Roadmap' ? (
                              <Map className="w-4 h-4 text-emerald-300 brightness-110" />
                            ) : (
                              <FileText className="w-4 h-4 text-cyan-300 brightness-110" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-white leading-snug group-hover:text-blue-400 transition-colors">
                              {act.title}
                            </h4>
                            <span className="text-[10px] text-slate-400">{act.time}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">
                          {act.score}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* UNFINISHED INTERVIEW POPUP MODAL (PREMIUM GLASSMORPHISM REDESIGN) */}
      {showUnfinishedModal && unfinishedSession && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="glass-card rounded-[28px] p-7 sm:p-9 max-w-md w-full border border-blue-500/40 bg-slate-900/95 shadow-[0_0_50px_rgba(59,130,246,0.25)] space-y-6 text-center relative overflow-hidden">
            
            {/* Ambient Refractive Background Glow */}
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Glowing Icon Header */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl pointer-events-none animate-pulse" />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/30 via-indigo-600/30 to-purple-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400 shadow-xl relative z-10">
                <Bot className="w-9 h-9 text-blue-400" />
              </div>
            </div>

            {/* Header Badge & Title */}
            <div className="space-y-2 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] font-extrabold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Saved Progress Detected</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white font-['Space_Grotesk'] leading-tight">
                You have an unfinished AI Mock Interview.
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                Resume your <strong className="text-blue-400 font-bold">{unfinishedSession.selectedType || 'AI'} Round ({unfinishedSession.difficulty || 'Medium'})</strong> saved at Question {(unfinishedSession.currentQuestionIndex || 0) + 1} of {unfinishedSession.activeQuestions?.length || 4}.
              </p>
            </div>

            {/* Continuous Shine Animated Buttons */}
            <div className="space-y-3 pt-2 relative z-10">
              {/* Continue Interview Button */}
              <button
                onClick={handleContinueUnfinished}
                className="relative w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-blue-600/35 hover:scale-[1.02] active:scale-95 transition-all duration-300 cursor-pointer overflow-hidden group border border-blue-400/30"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/35 to-transparent animate-shine-continuous pointer-events-none" />
                <PlayCircle className="w-4 h-4 text-white relative z-10" />
                <span className="relative z-10">Continue Interview</span>
                <ArrowRight className="w-4 h-4 text-white relative z-10 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Discard Interview Button */}
              <button
                onClick={handleDiscardUnfinished}
                className="relative w-full py-3.5 rounded-2xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.01] active:scale-95 overflow-hidden group"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine-continuous pointer-events-none" />
                <Trash2 className="w-4 h-4 text-red-400 relative z-10" />
                <span className="relative z-10">Discard Interview</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* CLEAR RECENT ACTIVITY CONFIRMATION MODAL */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#090F26] border border-red-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="p-4 rounded-3xl bg-red-500/10 text-red-400 w-16 h-16 mx-auto flex items-center justify-center border border-red-500/20 shadow-inner">
              <Trash2 className="w-8 h-8 text-red-400 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-white font-['Space_Grotesk'] tracking-wide">
                Clear recent activity?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                Are you sure you want to clear your recent activity history? Your profile and account readiness scores will remain intact.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold text-xs transition-all cursor-pointer border border-slate-700"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={() => {
                  clearRecentActivities();
                  setShowClearConfirmModal(false);
                }}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer border border-red-400/40"
              >
                <span>Confirm Clear</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE ACTIVITY HISTORY VIEW ALL MODAL */}
      {showViewAllModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#090F26] border border-blue-500/30 rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col relative overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <History className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white font-['Space_Grotesk'] tracking-wide">
                    Complete Activity History
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Timeline from your first login until now ({recentActivities.length} entries)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowViewAllModal(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal List Body */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {recentActivities.length === 0 ? (
                <div className="py-12 text-center space-y-2 border border-dashed border-slate-800 rounded-2xl bg-slate-900/40 p-6">
                  <p className="text-sm font-bold text-slate-300">No activity history recorded.</p>
                </div>
              ) : (
                recentActivities.map((act) => {
                  const targetTab: ActiveTab = 
                    (act.targetTab as ActiveTab) ||
                    (act.type === 'Interview' ? 'interview' : 
                    act.type === 'Coding' ? 'coding' : 
                    act.type === 'Aptitude' ? 'aptitude' : 
                    act.type === 'Communication' ? 'communication' :
                    act.type === 'Roadmap' ? 'roadmap' : 'resume');

                  return (
                    <div
                      key={act.id}
                      onClick={() => {
                        setShowViewAllModal(false);
                        handleLaunchModule(targetTab);
                      }}
                      className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 flex items-center justify-between gap-4 text-xs cursor-pointer transition-all hover:scale-[1.01] group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-800 group-hover:bg-blue-500/10 shrink-0">
                          {act.type === 'Interview' ? (
                            <Bot className="w-5 h-5 text-purple-300" />
                          ) : act.type === 'Coding' ? (
                            <Code2 className="w-5 h-5 text-emerald-300" />
                          ) : act.type === 'Aptitude' ? (
                            <BrainCircuit className="w-5 h-5 text-amber-300" />
                          ) : act.type === 'Communication' ? (
                            <MessageSquare className="w-5 h-5 text-pink-300" />
                          ) : act.type === 'Roadmap' ? (
                            <Map className="w-5 h-5 text-emerald-300" />
                          ) : (
                            <FileText className="w-5 h-5 text-cyan-300" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-white text-sm group-hover:text-blue-400 transition-colors">
                            {act.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded-md">
                              {act.type}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">{act.time}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                          {act.score}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 group-hover:text-blue-400 transition-all" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400 font-medium">Click any entry to open the module</span>
              <button
                onClick={() => setShowViewAllModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs transition-all cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
