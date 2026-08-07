import React from 'react';
import { Home, FileText, Bot, Settings, User } from 'lucide-react';
import { useApp, ActiveTab } from '../../context/AppContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const mobileTabs: Array<{ id: ActiveTab; label: string; icon: React.ReactNode }> = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'resume', label: 'Resume', icon: <FileText className="w-5 h-5" /> },
    { id: 'interview', label: 'Interview', icon: <Bot className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-2 flex items-center justify-around">
      {mobileTabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
              isActive
                ? 'text-blue-600 dark:text-blue-400 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            {tab.icon}
            <span className="text-[10px]">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
