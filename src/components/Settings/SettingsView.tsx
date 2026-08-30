import React, { useState } from 'react';
import {
  Settings,
  Bell,
  Globe,
  Palette,
  Shield,
  Download,
  Moon,
  Sun,
  Languages,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, darkMode, setDarkMode, user, updateLanguagePreference, resetAllProgress } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'notifications' | 'language' | 'appearance' | 'security' | 'reset'>('notifications');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);

  const triggerToast = (msg: string) => {
    setSaveSuccessMessage(msg);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ user, settings }));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "acehire_student_backup.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerToast('Student placement data exported successfully!');
  };

  const handleConfirmReset = () => {
    resetAllProgress();
    setIsResetModalOpen(false);
    triggerToast('All progress has been reset to 0%!');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden space-y-6 relative animate-in fade-in">
      {/* Top Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold mb-2">
            <Settings className="w-4 h-4" />
            <span>AceHire AI Workspace Configurations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
            Application Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure Explanation Language preferences, AI notifications, theme accents, and data reset.
          </p>
        </div>

        {saveSuccessMessage && (
          <div className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs shadow-lg animate-bounce">
            ✓ {saveSuccessMessage}
          </div>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0 overflow-hidden pb-4">
        {/* Left Col: Settings Navigation Tabs (FIXED SIDEBAR - NO SCROLL) */}
        <div className="md:col-span-4 space-y-2 shrink-0">
          {[
            { id: 'notifications' as const, label: 'Notifications & Alerts', icon: <Bell className="w-4 h-4 text-blue-500" /> },
            { id: 'language' as const, label: 'Explanation Language', icon: <Languages className="w-4 h-4 text-amber-500" /> },
            { id: 'appearance' as const, label: 'Appearance & Theme', icon: <Palette className="w-4 h-4 text-purple-500" /> },
            { id: 'security' as const, label: 'Database & Data Export', icon: <Shield className="w-4 h-4 text-emerald-500" /> },
            { id: 'reset' as const, label: 'Reset Progress', icon: <RotateCcw className="w-4 h-4 text-red-500" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`w-full p-4 rounded-2xl border text-left font-bold text-xs sm:text-sm transition-all flex items-center gap-3 cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-[1.02]'
                  : 'glass-card text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right Col: Settings Panels (ONLY THIS AREA SCROLLS) */}
        <div className="md:col-span-8 flex flex-col h-full min-h-0 overflow-y-auto overflow-x-hidden glass-card rounded-3xl p-6 sm:p-8 border space-y-6 pr-2 pb-20">
          
          {/* Notifications Panel */}
          {activeSubTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 font-['Space_Grotesk']">
                <Bell className="w-5 h-5 text-blue-500" />
                <span>Notification & Reminder Preferences</span>
              </h3>

              <div className="space-y-4">
                {[
                  {
                    key: 'dailyPracticeReminder' as const,
                    title: 'Daily Practice Reminder',
                    desc: 'Daily reminder to complete your targeted placement goal tasks.'
                  },
                  {
                    key: 'mockInterviewReminder' as const,
                    title: 'Mock Interview Reminder',
                    desc: 'Scheduled reminders for HR & Technical mock interview practice.'
                  },
                  {
                    key: 'codingPracticeReminder' as const,
                    title: 'Coding Practice Reminder',
                    desc: 'Reminders to solve daily coding and algorithm challenges.'
                  },
                  {
                    key: 'aptitudePracticeReminder' as const,
                    title: 'Aptitude Practice Reminder',
                    desc: 'Reminders for Quantitative, Logical & Verbal reasoning practice.'
                  }
                ].map((item) => {
                  const isChecked = settings.notifications[item.key] ?? true;
                  return (
                    <div
                      key={item.key}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4 transition-all hover:border-blue-500/40"
                    >
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{item.title}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                      </div>

                      {/* Modern Toggle Switch (ON/OFF) */}
                      <button
                        type="button"
                        onClick={() => {
                          updateSettings({
                            notifications: {
                              ...settings.notifications,
                              [item.key]: !isChecked
                            }
                          });
                          triggerToast(`${item.title} set to ${!isChecked ? 'ON' : 'OFF'}`);
                        }}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out cursor-pointer relative shrink-0 ${
                          isChecked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ease-in-out ${
                            isChecked ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* MOBILE PHONE WEB PUSH NOTIFICATION TEST CONTROL PANEL (DEV / ADMIN ONLY) */}
              {typeof window !== 'undefined' && ((import.meta as any).env?.DEV || window.location.search.includes('dev=true')) && (
                <div className="p-6 rounded-3xl bg-slate-900 text-white border border-blue-500/40 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider block">
                        🛠️ Developer Push Testing
                      </span>
                      <h4 className="text-base font-extrabold text-white font-['Space_Grotesk']">
                        Developer Push Notification Test
                      </h4>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                      DEV MODE ONLY
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    Test whether HasHire AI can send a REAL PUSH NOTIFICATION to your mobile phone's system notification tray. Normal users receive daily notifications automatically without manual button clicks.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        const { sendMobileTestPushNotification } = await import('../../utils/webPushHelper');
                        const res = await sendMobileTestPushNotification(user?.id);
                        triggerToast(res.message);
                      }}
                      className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Bell className="w-4 h-4 text-cyan-400 animate-pulse" />
                      <span>Dev Test Push</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Explanation Language Section */}
          {activeSubTab === 'language' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 font-['Space_Grotesk']">
                  <Globe className="w-5 h-5 text-amber-500" />
                  <span>Explanation Language</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Select the language used for AI-generated explanations and feedback across all modules.
                </p>
              </div>

              <div className="space-y-3">
                {/* Option 1: English (Radio Card) */}
                <div
                  onClick={() => {
                    updateLanguagePreference('English');
                    triggerToast('Saved Explanation Language: English');
                  }}
                  className={`p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between group ${
                    user.preferredLanguage === 'English'
                      ? 'bg-blue-600/10 border-blue-600 text-slate-900 dark:text-white shadow-lg'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      user.preferredLanguage === 'English'
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-slate-400 dark:border-slate-600 group-hover:border-blue-400'
                    }`}>
                      {user.preferredLanguage === 'English' && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">English</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Standard English AI explanations (Default)</p>
                    </div>
                  </div>
                  {user.preferredLanguage === 'English' && (
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-blue-500 text-white">
                      Selected
                    </span>
                  )}
                </div>

                {/* Option 2: Tanglish (Tamil + English) (Radio Card) */}
                <div
                  onClick={() => {
                    updateLanguagePreference('Tanglish');
                    triggerToast('Saved Explanation Language: Tanglish (Tamil + English)');
                  }}
                  className={`p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between group ${
                    user.preferredLanguage === 'Tanglish'
                      ? 'bg-amber-500/10 border-amber-500 text-slate-900 dark:text-white shadow-lg'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      user.preferredLanguage === 'Tanglish'
                        ? 'border-amber-500 bg-amber-500'
                        : 'border-slate-400 dark:border-slate-600 group-hover:border-amber-400'
                    }`}>
                      {user.preferredLanguage === 'Tanglish' && (
                        <div className="w-2 h-2 rounded-full bg-slate-950" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">Tanglish (Tamil + English)</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Conversational Tamil script in English for rural clarity</p>
                    </div>
                  </div>
                  {user.preferredLanguage === 'Tanglish' && (
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-full tanglish-badge">
                      Selected
                    </span>
                  )}
                </div>
              </div>

              {/* Rules Summary */}
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-900 dark:text-blue-300 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  <span>Language Behavior Guarantee</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] opacity-90 leading-relaxed">
                  <li><strong>Correct / Incorrect</strong> labels are ALWAYS displayed in English.</li>
                  <li><strong>Correct Answer</strong> is ALWAYS displayed in English.</li>
                  <li><strong>ONLY the explanation</strong> is translated into {user.preferredLanguage}.</li>
                </ul>
              </div>
            </div>
          )}

          {activeSubTab === 'appearance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 font-['Space_Grotesk']">
                <Palette className="w-5 h-5 text-purple-500" />
                <span>Theme & Interactive UI Accent</span>
              </h3>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Theme Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setDarkMode(true)}
                    className={`p-4 rounded-2xl border text-center font-bold text-xs flex items-center justify-center gap-2 cursor-pointer ${
                      darkMode ? 'bg-purple-600 text-white border-purple-600 shadow' : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    <Moon className="w-4 h-4" /> Dark Theme (Recommended)
                  </button>
                  <button
                    onClick={() => setDarkMode(false)}
                    className={`p-4 rounded-2xl border text-center font-bold text-xs flex items-center justify-center gap-2 cursor-pointer ${
                      !darkMode ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    <Sun className="w-4 h-4" /> Light Theme
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 font-['Space_Grotesk']">
                <Shield className="w-5 h-5 text-emerald-500" />
                <span>Supabase Database & Backup</span>
              </h3>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Supabase PostgreSQL Connection Status
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                    Connected & Synchronized
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Tables `profiles`, `resumes`, and `interview_answers` are synced.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleExportData}
                  className="flex-1 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 shadow cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Export Student Data JSON
                </button>
              </div>
            </div>
          )}

          {/* Reset Progress Section */}
          {activeSubTab === 'reset' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 font-['Space_Grotesk']">
                  <RotateCcw className="w-5 h-5 text-red-500" />
                  <span>Reset All Student Progress</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Restore first-time student dashboard baseline state by resetting scores, tasks, and recent activity.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-3">
                <div className="flex items-center gap-3 text-red-700 dark:text-red-300">
                  <AlertTriangle className="w-6 h-6 shrink-0" />
                  <div className="text-xs">
                    <strong className="block font-bold text-sm">Warning: Irreversible Progress Reset</strong>
                    Resetting will clear placement readiness scores (0%), reset Today's Goal (0/3), revert module buttons to "Start", and wipe recent activity logs.
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setIsResetModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset Progress</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* CONFIRMATION DIALOG MODAL FOR RESET PROGRESS */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="glass-card w-full max-w-md rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl space-y-6 bg-slate-900 text-white animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-red-400 font-bold text-base font-['Space_Grotesk']">
                <AlertTriangle className="w-5 h-5" />
                <span>Reset All Progress?</span>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm font-medium text-slate-300 leading-relaxed">
              Reset All Progress? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold transition-all shadow-lg shadow-red-600/30 cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
