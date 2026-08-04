import React, { useState, useEffect } from 'react';
import { PlayCircle, LogOut, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SavedInterviewState } from '../../types';

export const PersistentInterviewBanner: React.FC = () => {
  const { activeTab, setActiveTab, showSplash, isLoggedIn } = useApp();
  const [savedSession, setSavedSession] = useState<SavedInterviewState | null>(null);

  useEffect(() => {
    // Session state managed in memory/context
    setSavedSession(null);
  }, []);

  // Do not show on Welcome Page (showSplash), or when inside interview page, or if logged out, or if no saved interview exists
  if (showSplash || !isLoggedIn || activeTab === 'interview' || !savedSession) {
    return null;
  }

  const handleContinue = () => {
    setActiveTab('interview');
  };

  const handleExit = () => {
    setSavedSession(null);
  };

  const currentQNum = (savedSession.currentQuestionIndex || 0) + 1;
  const totalQNum = savedSession.activeQuestions?.length || 4;

  return (
    <div className="w-full shrink-0 animate-in slide-in-from-top-3 duration-300 mb-3">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/90 to-slate-900 border border-blue-500/40 p-3 sm:px-5 sm:py-3 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 shrink-0">
            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs">
            <span className="font-extrabold text-white tracking-wide">
              You have an unfinished AI Mock Interview.
            </span>
            <span className="text-slate-300 font-medium text-[11px] bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700/60 w-fit">
              {savedSession.selectedType || 'AI'} ({savedSession.difficulty || 'Medium'}) • Question {currentQNum} of {totalQNum}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={handleContinue}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Continue Interview</span>
          </button>

          <button
            onClick={handleExit}
            className="px-3 py-1.5 rounded-xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Interview</span>
          </button>
        </div>
      </div>
    </div>
  );
};
