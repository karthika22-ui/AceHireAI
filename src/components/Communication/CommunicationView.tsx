import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Globe,
  RefreshCw,
  Zap,
  ArrowRight
} from 'lucide-react';
import { LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { evaluateAnswerWithAI } from '../../services/aiEngine';
import { DualLanguageFeedback } from '../../types';

import { SessionResumeModal } from '../Common/SessionResumeModal';

export const CommunicationView: React.FC = () => {
  const { recordUserActivity, setActiveTab } = useApp();

  const [inputSentence, setInputSentence] = useState<string>('I am interested software and myself Karthik.');
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<DualLanguageFeedback | null>(null);

  // Session Persistence States
  const [showCommModal, setShowCommModal] = useState<boolean>(false);
  const [pendingCommSession, setPendingCommSession] = useState<{
    inputSentence: string;
    feedback: DualLanguageFeedback | null;
  } | null>(null);

  // Check on mount for saved communication session
  useEffect(() => {
    // Session state managed in React component state & Supabase DB
  }, []);

  const handleContinueComm = () => {
    if (pendingCommSession) {
      setInputSentence(pendingCommSession.inputSentence);
      setFeedback(pendingCommSession.feedback);
    }
    setShowCommModal(false);
    setPendingCommSession(null);
  };

  const handleExitComm = () => {
    setShowCommModal(false);
    setPendingCommSession(null);
    setInputSentence('I am interested software and myself Karthik.');
    setFeedback(null);
  };

  const handleCheckCommunication = async () => {
    if (!inputSentence.trim()) return;
    setIsChecking(true);
    try {
      const res = await evaluateAnswerWithAI('Communication Check', inputSentence, 'HR');
      setFeedback(res);

      // Record activity to update Communication readiness, Overall score, Today's Goal, and Recent Activity
      recordUserActivity('communication', 'Grammar Check & Tone Practice', res.confidenceScore, 'Communication');
    } catch (err) {
      console.error(err);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-6 max-w-4xl mx-auto pb-12 pr-1 animate-in fade-in relative">
      
      {/* Session Resume Modal */}
      <SessionResumeModal
        isOpen={showCommModal && !!pendingCommSession}
        moduleName="Communication Skills"
        progressText={
          pendingCommSession
            ? `Ongoing practice draft: "${pendingCommSession.inputSentence.substring(0, 35)}..."`
            : ''
        }
        onContinue={handleContinueComm}
        onExit={handleExitComm}
      />

      {/* Top Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 text-xs font-bold mb-2">
            <MessageSquare className="w-4 h-4" />
            <span>AI English & Tanglish Communication Coach</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Communication Improvement
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Fix grammar mistakes, boost vocabulary, and understand rule explanations in clear Tanglish.
          </p>
        </div>

        <button
          onClick={() => {
            setActiveTab('dashboard');
          }}
          className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          title="Exit to Dashboard"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit</span>
        </button>
      </div>

      {/* Input Box Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border space-y-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Enter Sentence or Answer Draft to Inspect
        </label>
        <textarea
          rows={4}
          value={inputSentence}
          onChange={(e) => setInputSentence(e.target.value)}
          placeholder="e.g. 'I am interested software' or 'Myself John'"
          className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
        />

        <button
          onClick={handleCheckCommunication}
          disabled={isChecking || !inputSentence.trim()}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
        >
          {isChecking ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing Grammar & Building Dual Explanations...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>Check Grammar & Generate Tanglish Explanation</span>
            </>
          )}
        </button>
      </div>

      {/* Side by Side Dual Language Feedback Modal / Result Card */}
      {feedback && (
        <div className="space-y-6 animate-in slide-in-from-bottom-3">
          {/* Overview Metric Pill */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-pink-400" />
              <div>
                <span className="text-xs text-slate-400 block font-bold">Confidence Score</span>
                <strong className="text-xl font-extrabold text-pink-400">{feedback.confidenceScore}%</strong>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 text-xs font-bold">
              {feedback.communicationRating} Rating
            </span>
          </div>

          {/* Side by Side Explanations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tanglish Explanation Card */}
            <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="tanglish-badge px-2.5 py-0.5 rounded text-[10px]">
                  🇮🇳 Tanglish Explanation
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Rural Friendly</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Tamil Script Explanation:
              </h3>
              <p className="text-xs font-medium text-amber-950 dark:text-amber-200 leading-relaxed bg-amber-500/5 p-3 rounded-xl border border-amber-500/20">
                "{feedback.tanglishExplanation}"
              </p>
            </div>

            {/* English Explanation Card */}
            <div className="p-6 rounded-3xl bg-blue-500/10 border border-blue-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="bg-blue-600 text-white px-2.5 py-0.5 rounded text-[10px] font-bold">
                  🇬🇧 Standard English
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">Formal Review</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Grammar Rule Breakdown:
              </h3>
              <p className="text-xs font-medium text-blue-950 dark:text-blue-200 leading-relaxed bg-blue-500/5 p-3 rounded-xl border border-blue-500/20">
                "{feedback.englishExplanation}"
              </p>
            </div>
          </div>

          {/* Improved Sentence Card */}
          <div className="glass-card rounded-3xl p-6 border space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Perfect Professional Sentence
            </h4>
            <p className="text-sm font-serif italic text-slate-900 dark:text-white font-medium">
              "{feedback.improvedAnswer}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
