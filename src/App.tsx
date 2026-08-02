import React from 'react';
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
import { SkillGapView } from './components/SkillGap/SkillGapView';
import { RoadmapView } from './components/Roadmap/RoadmapView';
import { ProfileView } from './components/Profile/ProfileView';
import { SettingsView } from './components/Settings/SettingsView';

const MainContent: React.FC = () => {
  const { activeTab, isLoggedIn } = useApp();

  if (!isLoggedIn || activeTab === 'login') {
    return <LoginPage />;
  }

  return (
    <main className="flex-1 flex flex-col h-[calc(100vh-65px)] overflow-hidden p-3.5 sm:p-5 max-w-7xl mx-auto w-full mb-16 md:mb-0">
      <PersistentInterviewBanner />
      {activeTab === 'home' && <DashboardView />}
      {activeTab === 'interview' && <MockInterviewView />}
      {activeTab === 'resume' && <ResumeView />}
      {activeTab === 'coding' && <CodingView />}
      {activeTab === 'aptitude' && <AptitudeView />}
      {activeTab === 'communication' && <CommunicationView />}
      {activeTab === 'skillgap' && <SkillGapView />}
      {activeTab === 'roadmap' && <RoadmapView />}
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'profile' && <ProfileView />}
      {activeTab === 'settings' && <SettingsView />}
    </main>
  );
};

const AppShell: React.FC = () => {
  const { showSplash, setShowSplash } = useApp();

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
