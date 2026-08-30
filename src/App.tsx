import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { SplashScreen } from './components/Splash/SplashScreen';
import { AuthModal } from './components/Auth/AuthModal';
import { LoginPage } from './components/Auth/LoginPage';
import { Navbar } from './components/Navigation/Navbar';
import { Sidebar } from './components/Navigation/Sidebar';
import { BottomNav } from './components/Navigation/BottomNav';
import { PersistentInterviewBanner } from './components/Navigation/PersistentInterviewBanner';
import { DashboardView } from './components/Dashboard/DashboardView';
import { MockInterviewView } from './components/Interview/MockInterviewView';
import { ResumeView } from './components/Resume/ResumeView';
import { CodingView } from './components/Coding/CodingView';
import { AptitudeView } from './components/Aptitude/AptitudeView';
import { CommunicationView } from './components/Communication/CommunicationView';
import { RoadmapView } from './components/Roadmap/RoadmapView';
import { ProfileView } from './components/Profile/ProfileView';
import { SettingsView } from './components/Settings/SettingsView';

import { X } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab, isLoggedIn } = useApp();

  if (!isLoggedIn || activeTab === 'login') {
    return <LoginPage />;
  }

  const isHomeOrDashboard = activeTab === 'home' || activeTab === 'dashboard';

  return (
    <main className="flex-1 flex flex-col h-[calc(100vh-65px)] overflow-hidden p-3.5 sm:p-5 max-w-7xl mx-auto w-full mb-16 md:mb-0 relative">
      <PersistentInterviewBanner />

      <div className={isHomeOrDashboard ? 'flex-1 flex flex-col h-full overflow-hidden' : 'hidden'}>
        <DashboardView />
      </div>

      <div className={activeTab === 'interview' ? 'flex-1 flex flex-col h-full overflow-hidden' : 'hidden'}>
        <MockInterviewView />
      </div>

      <div className={activeTab === 'resume' ? 'flex-1 flex flex-col h-full overflow-hidden' : 'hidden'}>
        <ResumeView />
      </div>

      <div className={activeTab === 'coding' ? 'flex-1 flex flex-col h-full overflow-hidden' : 'hidden'}>
        <CodingView />
      </div>

      <div className={activeTab === 'aptitude' ? 'flex-1 flex flex-col h-full overflow-hidden' : 'hidden'}>
        <AptitudeView />
      </div>

      <div className={activeTab === 'communication' ? 'flex-1 flex flex-col h-full overflow-hidden' : 'hidden'}>
        <CommunicationView />
      </div>

      <div className={activeTab === 'roadmap' ? 'flex-1 flex flex-col h-full min-h-0 overflow-hidden' : 'hidden'}>
        <RoadmapView />
      </div>

      <div className={activeTab === 'profile' ? 'flex-1 flex flex-col h-full min-h-0 overflow-hidden' : 'hidden'}>
        <ProfileView />
      </div>

      <div className={activeTab === 'settings' ? 'flex-1 flex flex-col h-full min-h-0 overflow-hidden' : 'hidden'}>
        <SettingsView />
      </div>
    </main>
  );
};

const AppShell: React.FC = () => {
  const { showSplash, setShowSplash, activeDrawer, closeDrawer } = useApp();

  useEffect(() => {
    if (activeDrawer) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeDrawer]);

  return (
    <div className="h-screen overflow-hidden bg-slate-50 dark:bg-gradient-to-b dark:from-[#0F172A] dark:via-[#1E1B4B] dark:to-[#2E1065] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300 relative">
      {/* Welcome Page Soft Ambient Refractive Lighting (Light Navy, Soft Blue & Subtle Violet Glows) */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[750px] h-[400px] bg-gradient-to-b from-[#38BDF8]/15 via-[#818CF8]/10 to-transparent rounded-full blur-[130px] pointer-events-none z-0 dark:opacity-100 opacity-25" />
      <div className="fixed top-1/3 -left-20 w-[600px] h-[600px] bg-[#818CF8]/15 rounded-full blur-[140px] pointer-events-none z-0 dark:opacity-100 opacity-20" />
      <div className="fixed top-1/3 -right-20 w-[600px] h-[600px] bg-[#C084FC]/15 rounded-full blur-[140px] pointer-events-none z-0 dark:opacity-100 opacity-20" />
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#38BDF8]/15 rounded-full blur-[130px] pointer-events-none z-0 dark:opacity-100 opacity-25" />

      {showSplash && <SplashScreen onDismiss={() => setShowSplash(false)} />}
      
      <AuthModal />

      <Navbar />

      <div className="flex-1 flex w-full overflow-hidden relative z-10">
        <Sidebar />
        <MainContent />
      </div>

      <BottomNav />

      {/* TOP-LEVEL CENTERED PROFILE / SETTINGS MODAL OVERLAY */}
      {activeDrawer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden pointer-events-auto">
          {/* Dark Soft Backdrop Blur */}
          <div
            onClick={closeDrawer}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-0 animate-in fade-in duration-200"
          />

          {/* Centered Modal Container */}
          <div className="relative z-10 w-full max-w-4xl h-[85vh] max-h-[calc(100vh-64px)] my-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            {/* Sticky Header with Close (X) button */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/90 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-400 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  {activeDrawer === 'profile' ? 'Profile Details' : 'Application Settings'}
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  {activeDrawer === 'profile' ? 'View & update your profile' : 'Customize preferences & theme'}
                </span>
              </div>
              <button
                onClick={closeDrawer}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700/60 flex items-center gap-1.5 text-xs font-extrabold"
                title="Close Modal"
              >
                <X className="w-4 h-4 text-slate-300" />
                <span>Close</span>
              </button>
            </div>

            {/* Modal Inner View Container (Fixed layout, child views handle internal right-panel scrolling) */}
            <div className="flex-1 min-h-0 p-4 sm:p-6 w-full max-w-full overflow-hidden flex flex-col">
              {activeDrawer === 'profile' ? <ProfileView /> : <SettingsView />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

export default App;
