import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  LanguagePreference,
  ReadinessScore,
  ResumeData,
  AppNotification,
  AchievementBadge,
  UserSettings,
  DEFAULT_SETTINGS
} from '../types';
import { SupabaseService, ActivityItem } from '../services/supabaseClient';

export type ActiveTab = 
  | 'home'
  | 'resume'
  | 'interview'
  | 'coding'
  | 'aptitude'
  | 'communication'
  | 'skillgap'
  | 'roadmap'
  | 'dashboard'
  | 'profile'
  | 'settings'
  | 'login';

const STORAGE_KEY_SETTINGS = 'acehire_user_settings';
const STORAGE_KEY_AUTH = 'acehire_is_logged_in';

interface AppContextType {
  user: UserProfile;
  setUser: (user: UserProfile) => void;
  isLoggedIn: boolean;
  login: (email: string, pass: string) => void;
  logout: () => void;
  updateLanguagePreference: (lang: LanguagePreference) => void;
  readinessScore: ReadinessScore;
  setReadinessScore: React.Dispatch<React.SetStateAction<ReadinessScore>>;
  resume: ResumeData;
  setResume: (resume: ResumeData) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingTargetTab: ActiveTab | null;
  setPendingTargetTab: (tab: ActiveTab | null) => void;
  handleFeatureLaunch: (targetTab: ActiveTab, onDismissSplash?: () => void) => void;
  showSplash: boolean;
  setShowSplash: (val: boolean) => void;
  navigateToWelcomePage: () => void;
  recentActivities: ActivityItem[];
  recordUserActivity: (module: keyof Omit<ReadinessScore, 'overall' | 'lastUpdated'>, title: string, scoreVal: number, typeLabel: string) => void;
  recordActivity: (title: string, typeLabel: string, scoreText?: string, targetTab?: ActiveTab) => void;
  clearRecentActivities: () => void;
  completedTasksCount: number;
  streakDays: number;
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  achievements: AchievementBadge[];
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (val: boolean) => void;
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  recalculatePlacementScore: () => void;
  resetAllProgress: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserProfile>(SupabaseService.getProfile());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_AUTH);
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [readinessScore, setReadinessScore] = useState<ReadinessScore>(SupabaseService.getReadinessScore());
  const [resume, setResumeState] = useState<ResumeData>(SupabaseService.getResume());
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>(() => SupabaseService.getRecentActivities());
  const [completedTasksCount, setCompletedTasksCount] = useState<number>(() => {
    return SupabaseService.getRecentActivities().length;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [pendingTargetTab, setPendingTargetTab] = useState<ActiveTab | null>(null);

  // Splash / Welcome Page State
  const [showSplash, setShowSplash] = useState<boolean>(true);

  const [streakDays] = useState<number>(1);
  const [settings, setSettingsState] = useState<UserSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          notifications: {
            ...DEFAULT_SETTINGS.notifications,
            ...(parsed.notifications || {})
          }
        };
      } catch (e) { return DEFAULT_SETTINGS; }
    }
    return DEFAULT_SETTINGS;
  });

  const [darkMode, setDarkModeState] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.appearance?.theme) {
          return parsed.appearance.theme === 'dark';
        }
      } catch (e) {}
    }
    return true;
  });

  const setDarkMode = (val: boolean) => {
    setDarkModeState(val);
    setSettingsState((prev) => {
      const updated = {
        ...prev,
        appearance: {
          ...prev.appearance,
          theme: val ? ('dark' as const) : ('light' as const)
        }
      };
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
      return updated;
    });
  };

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const [achievements] = useState<AchievementBadge[]>([]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const setUser = (newUser: UserProfile) => {
    setUserState(newUser);
    SupabaseService.saveProfile(newUser);
  };

  const handleFeatureLaunch = (targetTab: ActiveTab, onDismissSplash?: () => void) => {
    if (onDismissSplash) {
      onDismissSplash();
    }
    setShowSplash(false);

    if (isLoggedIn) {
      setActiveTab(targetTab);
    } else {
      setPendingTargetTab(targetTab);
      setActiveTab('login');
    }
  };

  const navigateToWelcomePage = () => {
    setShowSplash(true);
    setPendingTargetTab(null);
  };

  const recordUserActivity = (
    module: keyof Omit<ReadinessScore, 'overall' | 'lastUpdated'>,
    title: string,
    scoreVal: number,
    typeLabel: string
  ) => {
    // 1. Update readiness score for target module
    const updatedScores = {
      ...readinessScore,
      [module]: Math.min(100, Math.max(readinessScore[module], scoreVal)),
      lastUpdated: new Date().toLocaleDateString()
    };
    
    // 2. Recalculate overall average
    const avg = Math.round(
      (updatedScores.resume +
        updatedScores.coding +
        updatedScores.aptitude +
        updatedScores.interview +
        updatedScores.communication) / 5
    );
    updatedScores.overall = avg;

    setReadinessScore(updatedScores);
    SupabaseService.saveReadinessScore(updatedScores);

    // 3. Add to Recent Activities
    const newAct: ActivityItem = {
      id: `act-${Date.now()}`,
      title,
      type: typeLabel,
      score: `${scoreVal}% Score`,
      time: 'Just now'
    };

    const updatedList = SupabaseService.addRecentActivity(newAct, user?.email);
    setRecentActivities(updatedList);
    setCompletedTasksCount(updatedList.length);
  };

  const recordActivity = (title: string, typeLabel: string, scoreText?: string, targetTab?: ActiveTab) => {
    const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedDate = new Date().toLocaleDateString([], { month: 'short', day: 'numeric' });
    const displayTime = `${formattedDate}, ${formattedTime}`;

    const newAct: ActivityItem = {
      id: `act-${Date.now()}`,
      title,
      type: typeLabel,
      score: scoreText || 'Viewed',
      time: displayTime,
      timestamp: Date.now(),
      targetTab
    };

    const updatedList = SupabaseService.addRecentActivity(newAct, user?.email);
    setRecentActivities(updatedList);
    setCompletedTasksCount(updatedList.length);
  };

  const clearRecentActivities = () => {
    SupabaseService.clearRecentActivities(user?.email);
    setRecentActivities([]);
    setCompletedTasksCount(0);
  };

  const resetAllProgress = () => {
    const zeroReadiness: ReadinessScore = {
      overall: 0,
      resume: 0,
      coding: 0,
      aptitude: 0,
      interview: 0,
      communication: 0,
      lastUpdated: 'Never'
    };
    setReadinessScore(zeroReadiness);
    SupabaseService.saveReadinessScore(zeroReadiness);

    setRecentActivities([]);
    localStorage.setItem('acehire_recent_activities', JSON.stringify([]));
    setCompletedTasksCount(0);

    // Clear all module launch state tracking so all buttons revert to "Start"
    ['interview', 'resume', 'coding', 'aptitude', 'communication', 'skillgap', 'roadmap'].forEach((id) => {
      localStorage.removeItem(`acehire_started_${id}`);
    });
    localStorage.removeItem('acehire_user_uploaded_resume');
    localStorage.removeItem('acehire_user_resume_analysis');
  };

  const login = (email: string, _pass: string) => {
    const cleanEmail = email.trim() || 'student@college.edu';
    localStorage.setItem('acehire_current_user_email', cleanEmail);
    setIsLoggedIn(true);
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(true));

    // Load User Isolated Data
    const loadedProfile = SupabaseService.getProfile(cleanEmail);
    const loadedScores = SupabaseService.getReadinessScore(cleanEmail);
    const loadedResume = SupabaseService.getResume(cleanEmail);
    const loadedActivities = SupabaseService.getRecentActivities(cleanEmail);

    setUserState(loadedProfile);
    setReadinessScore(loadedScores);
    setResumeState(loadedResume);
    setRecentActivities(loadedActivities);
    setCompletedTasksCount(loadedActivities.length);

    setShowSplash(false);
    if (pendingTargetTab && pendingTargetTab !== 'login') {
      setActiveTab(pendingTargetTab);
      setPendingTargetTab(null);
    } else {
      setActiveTab('home');
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem(STORAGE_KEY_AUTH);
    localStorage.removeItem('acehire_current_user_email');

    // Clear temporary active sessions
    [
      'acehire_saved_interview',
      'acehire_coding_session',
      'acehire_aptitude_session',
      'acehire_communication_session',
      'acehire_skillgap_session',
      'acehire_roadmap_session',
      'acehire_user_uploaded_resume',
      'acehire_user_resume_analysis'
    ].forEach((k) => localStorage.removeItem(k));

    setShowSplash(true);
    setActiveTab('login');
  };

  const updateLanguagePreference = (lang: LanguagePreference) => {
    const updated = { ...user, preferredLanguage: lang };
    setUser(updated);
    updateSettings({ language: { ...settings.language, defaultExplanation: lang } });
  };

  const updateSettings = (newSettingsPartial: Partial<UserSettings>) => {
    setSettingsState((prev) => {
      const updated = { ...prev, ...newSettingsPartial };
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
      return updated;
    });
  };

  const setResume = (newResume: ResumeData) => {
    setResumeState(newResume);
    SupabaseService.saveResume(newResume);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const recalculatePlacementScore = () => {
    setReadinessScore((prev) => {
      const avg = Math.round(
        (prev.resume + prev.coding + prev.aptitude + prev.interview + prev.communication) / 5
      );
      const updated = { ...prev, overall: avg, lastUpdated: new Date().toLocaleDateString() };
      SupabaseService.saveReadinessScore(updated);
      return updated;
    });
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isLoggedIn,
        login,
        logout,
        updateLanguagePreference,
        readinessScore,
        setReadinessScore,
        resume,
        setResume,
        activeTab,
        setActiveTab,
        pendingTargetTab,
        setPendingTargetTab,
        handleFeatureLaunch,
        showSplash,
        setShowSplash,
        navigateToWelcomePage,
        recentActivities,
        recordUserActivity,
        recordActivity,
        clearRecentActivities,
        completedTasksCount,
        streakDays,
        notifications,
        markNotificationRead,
        achievements,
        darkMode,
        setDarkMode,
        isAuthModalOpen,
        setIsAuthModalOpen,
        settings,
        updateSettings,
        recalculatePlacementScore,
        resetAllProgress
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
