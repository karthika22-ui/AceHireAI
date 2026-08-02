import React, { useState, useEffect } from 'react';
import { Compass, Sparkles, Building2, CheckCircle2, ArrowRight, BookOpen, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateSkillGapAnalysis } from '../../services/aiEngine';
import { SessionResumeModal } from '../Common/SessionResumeModal';

export const SkillGapView: React.FC = () => {
  const { user, resume, setActiveTab, recordActivity } = useApp();
  const [targetCompany, setTargetCompany] = useState<string>(user.dreamCompany || 'Zoho');

  // Session Persistence States
  const [showSkillGapModal, setShowSkillGapModal] = useState<boolean>(false);
  const [pendingSkillGapSession, setPendingSkillGapSession] = useState<{ targetCompany: string } | null>(null);

  // Check on mount for saved session
  useEffect(() => {
    const saved = localStorage.getItem('acehire_skillgap_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.targetCompany && parsed.targetCompany !== user.dreamCompany) {
          setPendingSkillGapSession(parsed);
          setShowSkillGapModal(true);
        }
      } catch {
        localStorage.removeItem('acehire_skillgap_session');
      }
    }
  }, [user.dreamCompany]);

  // Save session when user customizes target company
  useEffect(() => {
    if (targetCompany && targetCompany !== (user.dreamCompany || 'Zoho') && !showSkillGapModal) {
      localStorage.setItem('acehire_skillgap_session', JSON.stringify({ targetCompany }));
    }
  }, [targetCompany, user.dreamCompany, showSkillGapModal]);

  const handleContinueSkillGap = () => {
    if (pendingSkillGapSession) {
      setTargetCompany(pendingSkillGapSession.targetCompany);
    }
    setShowSkillGapModal(false);
    setPendingSkillGapSession(null);
  };

  const handleExitSkillGap = () => {
    localStorage.removeItem('acehire_skillgap_session');
    setShowSkillGapModal(false);
    setPendingSkillGapSession(null);
    setTargetCompany(user.dreamCompany || 'Zoho');
  };

  const handleExitToDashboard = () => {
    localStorage.removeItem('acehire_skillgap_session');
    setActiveTab('dashboard');
  };

  const items = generateSkillGapAnalysis(resume.skills, targetCompany);

  return (
    <div className="flex-1 overflow-y-auto space-y-6 max-w-5xl mx-auto pb-12 pr-1 animate-in fade-in relative">
      
      {/* Session Resume Modal */}
      <SessionResumeModal
        isOpen={showSkillGapModal && !!pendingSkillGapSession}
        moduleName="Skill Gap Analysis"
        progressText={
          pendingSkillGapSession
            ? `Ongoing benchmark analysis for ${pendingSkillGapSession.targetCompany}`
            : ''
        }
        onContinue={handleContinueSkillGap}
        onExit={handleExitSkillGap}
      />

      {/* Top Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold mb-2">
            <Compass className="w-4 h-4" />
            <span>AI Placement Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Skill Gap Radar & Benchmarking
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Compare your profile skills against {targetCompany} recruitment requirements.
          </p>
        </div>

        {/* Company Quick Switcher & Exit Button */}
        <div className="flex flex-wrap items-center gap-2">
          {['Zoho', 'TCS', 'Google', 'Amazon'].map((c) => (
            <button
              key={c}
              onClick={() => {
                setTargetCompany(c);
                recordActivity(`Viewed ${c} Benchmark`, 'Skill Gap', 'Completed', 'skillgap');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                targetCompany === c
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {c}
            </button>
          ))}

          <button
            onClick={handleExitToDashboard}
            className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Exit to Dashboard"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>
        </div>
      </div>

      {/* Skill Items List */}
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.skill}
            className="glass-card rounded-2xl p-5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="space-y-1 max-w-md">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {item.skill}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    item.status === 'In Progress'
                      ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                      : 'bg-red-500/10 text-red-600 border border-red-500/30'
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {item.recommendedResource}
              </p>
            </div>

            {/* Proficiency Bar & Action */}
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-36 bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full"
                  style={{ width: `${item.currentProficiency}%` }}
                />
              </div>
              <button
                onClick={() => setActiveTab('coding')}
                className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-600 hover:text-white transition-all shrink-0"
              >
                Bridge Gap &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
