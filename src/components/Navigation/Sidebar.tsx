import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Bot,
  Code2,
  BrainCircuit,
  MessageCircle,
  Compass,
  Map,
  User,
  BarChart3,
  LogOut
} from 'lucide-react';
import { useApp, ActiveTab } from '../../context/AppContext';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, isLoggedIn, logout } = useApp();

  // Hide entire left sidebar before login
  if (!isLoggedIn || activeTab === 'login') {
    return null;
  }

  const navItems: Array<{ id: ActiveTab; label: string; icon: React.ReactNode }> = [
    { id: 'home', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'interview', label: 'AI Mock Interview', icon: <Bot className="w-5 h-5" /> },
    { id: 'resume', label: 'Resume Builder & ATS', icon: <FileText className="w-5 h-5" /> },
    { id: 'coding', label: 'Coding Practice', icon: <Code2 className="w-5 h-5" /> },
    { id: 'aptitude', label: 'Aptitude Practice', icon: <BrainCircuit className="w-5 h-5" /> },
    { id: 'communication', label: 'Communication Hub', icon: <MessageCircle className="w-5 h-5" /> },
    { id: 'skillgap', label: 'Skill Gap Analysis', icon: <Compass className="w-5 h-5" /> },
    { id: 'roadmap', label: 'AI Learning Roadmap', icon: <Map className="w-5 h-5" /> },
    { id: 'dashboard', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> }
  ];

  return (
    <aside className="hidden md:flex flex-col justify-between w-64 shrink-0 h-[calc(100vh-65px)] sticky top-[65px] glass-panel border-r border-slate-200/80 dark:border-slate-800/80 p-3.5 transition-colors overflow-hidden select-none">
      {/* Navigation List (Fixed, Non-Scrolling) */}
      <nav className="space-y-1 overflow-hidden">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 group relative overflow-hidden cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-600 dark:text-slate-400 border border-transparent hover:border-[#38BDF8]/40 hover:bg-slate-800/80 hover:text-white hover:scale-[1.02] hover:shadow-[0_0_18px_rgba(56,189,248,0.22)]'
              }`}
            >
              {/* Smooth Left-to-Right Shine Sweep Animation on Hover */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />

              <div className="flex items-center gap-3 relative z-10">
                <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Logout Button Always Fixed at Bottom */}
      <div className="pt-2 border-t border-slate-200/40 dark:border-slate-800/50">
        <button
          onClick={logout}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center gap-3 relative z-10">
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
            <span>Logout</span>
          </div>
        </button>
      </div>
    </aside>
  );
};
