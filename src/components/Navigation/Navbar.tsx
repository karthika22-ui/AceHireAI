import React from 'react';
import {
  Brain,
  Briefcase,
  MessageSquare,
  Bell,
  Moon,
  Sun,
  Settings,
  ArrowLeft
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Navbar: React.FC = () => {
  const {
    user,
    notifications,
    markNotificationRead,
    darkMode,
    setDarkMode,
    activeTab,
    setActiveTab,
    isLoggedIn,
    navigateToWelcomePage
  } = useApp();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const [showNotifications, setShowNotifications] = React.useState(false);

  // Clean Header for Unauthenticated Visitors / Login View
  if (!isLoggedIn || activeTab === 'login') {
    return (
      <header className="h-[65px] border-b border-slate-200/80 dark:border-slate-800/80 glass-panel sticky top-0 z-40 px-4 sm:px-8 flex items-center justify-between transition-colors">
        {/* Brand Logo (NON-CLICKABLE: cursor-default pointer-events-none select-none) */}
        <div className="flex items-center gap-3 select-none cursor-default pointer-events-none">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#38BDF8]/50 via-[#9333EA]/40 to-[#C084FC]/50 p-0.5 shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-[#080E21]/90 rounded-[14px] flex items-center justify-center relative overflow-hidden">
              <Brain className="w-5 h-5 text-[#38BDF8]" />
              <Briefcase className="w-2.5 h-2.5 text-[#C084FC] absolute top-1.5 right-1.5" />
              <MessageSquare className="w-2.5 h-2.5 text-[#34D399] absolute bottom-1.5 left-1.5" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight font-['Space_Grotesk'] text-slate-900 dark:text-white flex items-center gap-1">
              AceHire <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#C084FC]">AI</span>
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase -mt-0.5">
              Practice Smart. Get Hired.
            </p>
          </div>
        </div>

        {/* Top-Right Action Controls (Back to Home & Theme Toggle) */}
        <div className="flex items-center gap-3 sm:gap-3.5">
          {/* Back to Home Button in Navbar */}
          <button
            onClick={navigateToWelcomePage}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-extrabold flex items-center gap-1.5 transition-all duration-300 cursor-pointer group shadow-sm hover:border-[#38BDF8]/60"
            title="Return to Welcome Landing Page"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Home</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Toggle Theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="h-[65px] border-b border-slate-200/80 dark:border-slate-800/80 glass-panel sticky top-0 z-40 px-4 sm:px-8 flex items-center justify-between transition-colors">
      {/* Brand Logo & Tagline (NON-CLICKABLE: Cursor-default pointer-events-none select-none) */}
      <div className="flex items-center gap-3 cursor-default select-none pointer-events-none">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#38BDF8]/50 via-[#9333EA]/40 to-[#C084FC]/50 p-0.5 shadow-lg shadow-blue-500/20">
          <div className="w-full h-full bg-[#080E21]/90 rounded-[14px] flex items-center justify-center relative overflow-hidden">
            <Brain className="w-5 h-5 text-[#38BDF8]" />
            <Briefcase className="w-2.5 h-2.5 text-[#C084FC] absolute top-1.5 right-1.5" />
            <MessageSquare className="w-2.5 h-2.5 text-[#34D399] absolute bottom-1.5 left-1.5" />
          </div>
        </div>
        <div>
          <h1 className="text-lg font-extrabold tracking-tight font-['Space_Grotesk'] text-slate-900 dark:text-white flex items-center gap-1">
            AceHire <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#C084FC]">AI</span>
          </h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase -mt-0.5">
            Practice Smart. Get Hired.
          </p>
        </div>
      </div>

      {/* Right Action Widgets with Perfectly Equal Spacing (Theme Toggle, Settings, Notifications, Profile Avatar) */}
      <div className="flex items-center gap-3 sm:gap-3.5">
        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          title="Toggle Theme"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Settings Toggle */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">AI Placement Alerts</h3>
                <span className="text-[10px] font-bold bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full">
                  {unreadCount} Unread
                </span>
              </div>
              <div className="space-y-3 mt-3 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                      n.read
                        ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800/60 opacity-70'
                        : 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/60'
                    }`}
                  >
                    <div className="font-bold text-slate-900 dark:text-white mb-0.5">{n.title}</div>
                    <div className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">{n.message}</div>
                    <div className="text-[9px] text-slate-400 font-medium mt-1">{n.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 p-1.5 pr-3 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 text-white border-purple-400 shadow-md shadow-purple-500/25'
              : 'border-slate-200 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:border-purple-500/50'
          }`}
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 via-violet-600 to-emerald-500 text-white font-bold text-xs flex items-center justify-center shadow-sm ring-1 ring-emerald-400/50">
            {user.name ? user.name.charAt(0) : 'K'}
          </div>
          <span className="hidden md:inline text-xs font-bold max-w-[100px] truncate">
            {user.name ? user.name.split(' ')[0] : 'Karthik'}
          </span>
        </button>
      </div>
    </header>
  );
};
