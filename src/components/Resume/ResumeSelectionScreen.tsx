import React from 'react';
import { FileText, Sparkles, Wand2, BarChart3, ArrowRight, ShieldCheck } from 'lucide-react';

interface ResumeSelectionScreenProps {
  onSelectOption: (option: 'ats' | 'builder') => void;
}

export const ResumeSelectionScreen: React.FC<ResumeSelectionScreenProps> = ({ onSelectOption }) => {
  return (
    <div className="flex-1 overflow-y-auto max-w-5xl mx-auto py-2 px-4 sm:px-6 space-y-7 relative animate-in fade-in duration-300">
      {/* Ambient Blue & Purple Refractive Background Lighting */}
      <div className="absolute -top-24 -left-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none dark:opacity-100 opacity-25" />
      <div className="absolute -bottom-24 -right-20 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none dark:opacity-100 opacity-25" />

      {/* CHANGE 1: VISUALLY POLISHED HERO HEADER CARD (Dashboard Welcome Section Style) */}
      <div className="animated-border-glow-wrapper">
        <div className="relative overflow-hidden rounded-[23px] bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-950 p-6 sm:p-8 text-white border-0 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-cyan-200 text-xs font-bold backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span>HasHire AI Placement Suite</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-['Space_Grotesk'] text-white">
                Resume Builder & ATS
              </h1>
              <p className="text-sm sm:text-base text-slate-100 dark:text-slate-300 font-medium leading-relaxed">
                Build a professional resume or analyze your existing resume for ATS compatibility.
              </p>
            </div>

            {/* Side Info Pill */}
            <div className="p-4.5 rounded-2xl bg-white/10 dark:bg-slate-950/80 border border-white/20 dark:border-slate-800 backdrop-blur-xl flex items-center gap-3 shrink-0">
              <div className="p-2.5 rounded-xl bg-cyan-400/20 text-cyan-300">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-extrabold text-white block">100% Placement Ready</span>
                <span className="text-[11px] text-cyan-100 dark:text-slate-400 font-medium block">AI-Powered Optimization</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURE CARDS GRID (Equal sized cards preserved below header) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 pt-1">
        {/* CARD 1: BUILD RESUME */}
        <div
          onClick={() => onSelectOption('builder')}
          className="group glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800/80 hover:border-blue-500/50 dark:hover:border-blue-500/60 bg-white/95 dark:bg-slate-900/80 backdrop-blur-2xl shadow-xl hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_0_40px_rgba(99,102,241,0.2)] transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between cursor-pointer relative overflow-hidden"
        >
          {/* Top Subtle Gradient Accents */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all pointer-events-none" />

          <div className="space-y-5 relative z-10">
            {/* Icon Header */}
            <div className="flex items-center justify-between">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform duration-300">
                <Wand2 className="w-7 h-7" />
              </div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                Create New
              </span>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk'] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Build Resume
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                Create a professional, job-ready resume from your details.
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-8 relative z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectOption('builder');
              }}
              className="w-full py-3.5 px-5 rounded-2xl bg-slate-900 dark:bg-white/10 group-hover:bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 border border-slate-800 dark:border-white/15 group-hover:border-blue-500 group-hover:shadow-lg group-hover:shadow-blue-600/25 transition-all duration-300 cursor-pointer"
            >
              <span>Build My Resume →</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* CARD 2: ATS ANALYSIS */}
        <div
          onClick={() => onSelectOption('ats')}
          className="group glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800/80 hover:border-purple-500/50 dark:hover:border-purple-500/60 bg-white/95 dark:bg-slate-900/80 backdrop-blur-2xl shadow-xl hover:shadow-[0_0_40px_rgba(168,85,247,0.15)] dark:hover:shadow-[0_0_40px_rgba(168,85,247,0.2)] transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between cursor-pointer relative overflow-hidden"
        >
          {/* Top Subtle Gradient Accents */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />

          <div className="space-y-5 relative z-10">
            {/* Icon Header */}
            <div className="flex items-center justify-between">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-purple-600/20 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-7 h-7" />
              </div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                Analyze Existing
              </span>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk'] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                ATS Analysis
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                Check your existing resume for ATS compatibility and job relevance.
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-8 relative z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectOption('ats');
              }}
              className="w-full py-3.5 px-5 rounded-2xl bg-slate-900 dark:bg-white/10 group-hover:bg-purple-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 border border-slate-800 dark:border-white/15 group-hover:border-purple-500 group-hover:shadow-lg group-hover:shadow-purple-600/25 transition-all duration-300 cursor-pointer"
            >
              <span>Analyze Resume →</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER INFO BADGE */}
      <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 pt-2 relative z-10">
        <ShieldCheck className="w-4 h-4 text-cyan-500" />
        <span>Optimized for fresher & college placement drives</span>
      </div>
    </div>
  );
};
