import React, { useState, useEffect } from 'react';
import { Map, Sparkles, CheckCircle2, Clock, Calendar, ArrowRight, Flame, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateAIRoadmap } from '../../services/aiEngine';
import { SessionResumeModal } from '../Common/SessionResumeModal';

export const RoadmapView: React.FC = () => {
  const { user, setActiveTab, recordActivity } = useApp();
  const [tasks, setTasks] = useState(() => generateAIRoadmap(user.dreamCompany));
  const [filter, setFilter] = useState<'All' | 'Daily' | 'Weekly' | 'Monthly'>('All');

  // Session Persistence States
  const [showRoadmapModal, setShowRoadmapModal] = useState<boolean>(false);
  const [pendingRoadmapSession, setPendingRoadmapSession] = useState<{
    filter: 'All' | 'Daily' | 'Weekly' | 'Monthly';
    completedTaskIds: string[];
  } | null>(null);

  // Check on mount for saved roadmap session
  useEffect(() => {
    const saved = localStorage.getItem('acehire_roadmap_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.completedTaskIds && parsed.completedTaskIds.length > 0) {
          setPendingRoadmapSession(parsed);
          setShowRoadmapModal(true);
        } else {
          localStorage.removeItem('acehire_roadmap_session');
        }
      } catch {
        localStorage.removeItem('acehire_roadmap_session');
      }
    }
  }, []);

  // Save session state when tasks are toggled
  useEffect(() => {
    const completedTaskIds = tasks.filter((t) => t.completed).map((t) => t.id);
    if (completedTaskIds.length > 0 && !showRoadmapModal) {
      const sessionData = {
        filter,
        completedTaskIds
      };
      localStorage.setItem('acehire_roadmap_session', JSON.stringify(sessionData));
    } else if (completedTaskIds.length === 0) {
      localStorage.removeItem('acehire_roadmap_session');
    }
  }, [filter, tasks, showRoadmapModal]);

  const handleContinueRoadmap = () => {
    if (pendingRoadmapSession) {
      setFilter(pendingRoadmapSession.filter);
      setTasks((prev) =>
        prev.map((t) => ({
          ...t,
          completed: pendingRoadmapSession.completedTaskIds.includes(t.id)
        }))
      );
    }
    setShowRoadmapModal(false);
    setPendingRoadmapSession(null);
  };

  const handleExitRoadmap = () => {
    localStorage.removeItem('acehire_roadmap_session');
    setShowRoadmapModal(false);
    setPendingRoadmapSession(null);
    setTasks(generateAIRoadmap(user.dreamCompany));
  };

  const handleExitToDashboard = () => {
    localStorage.removeItem('acehire_roadmap_session');
    setActiveTab('dashboard');
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
    recordActivity('Updated AI Learning Roadmap', 'Roadmap', 'In Progress', 'roadmap');
  };

  const filtered = filter === 'All' ? tasks : tasks.filter((t) => t.period === filter);

  return (
    <div className="flex-1 overflow-y-auto space-y-6 max-w-4xl mx-auto pb-12 pr-1 animate-in fade-in relative">
      
      {/* Session Resume Modal */}
      <SessionResumeModal
        isOpen={showRoadmapModal && !!pendingRoadmapSession}
        moduleName="AI Learning Roadmap"
        progressText={
          pendingRoadmapSession
            ? `${pendingRoadmapSession.completedTaskIds.length} of ${tasks.length} tasks completed (${user.dreamCompany} Plan)`
            : ''
        }
        onContinue={handleContinueRoadmap}
        onExit={handleExitRoadmap}
      />

      {/* Top Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-2">
            <Map className="w-4 h-4" />
            <span>AI Placement Roadmap Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Daily AI Learning Plan
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personalized placement preparation timeline for {user.dreamCompany}.
          </p>
        </div>

        {/* Filter Pills & Exit Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            {(['All', 'Daily', 'Weekly', 'Monthly'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setFilter(period)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filter === period
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {period}
              </button>
            ))}
          </div>

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

      {/* Task Roadmap List */}
      <div className="space-y-4">
        {filtered.map((t) => (
          <div
            key={t.id}
            onClick={() => toggleTask(t.id)}
            className={`glass-card rounded-2xl p-5 border cursor-pointer transition-all flex items-start justify-between gap-4 ${
              t.completed ? 'opacity-60 bg-slate-100/50 dark:bg-slate-800/30' : 'hover:border-emerald-400'
            }`}
          >
            <div className="flex items-start gap-4">
              <button
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors ${
                  t.completed
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              >
                {t.completed && <CheckCircle2 className="w-4 h-4" />}
              </button>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase">
                    {t.period} • {t.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{t.dueDate}</span>
                </div>
                <h3 className={`text-base font-bold ${t.completed ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                  {t.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.description}
                </p>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (t.category === 'Interview') setActiveTab('interview');
                else if (t.category === 'Coding') setActiveTab('coding');
                else if (t.category === 'Resume') setActiveTab('resume');
                else setActiveTab('aptitude');
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 shrink-0"
            >
              Action &rarr;
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
