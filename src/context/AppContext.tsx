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
import {
  supabase,
  SupabaseService,
  ActivityItem,
  INITIAL_READINESS,
  getInitialProfileForEmail,
  getInitialResumeForEmail,
  isSupabaseConfigured
} from '../services/supabaseClient';

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

interface AppContextType {
  user: UserProfile;
  setUser: (user: UserProfile) => void;
  isLoggedIn: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  signup: (email: string, pass: string, details?: Partial<UserProfile>) => Promise<boolean>;
  logout: () => Promise<void>;
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
  recordUserActivity: (
    module: keyof Omit<ReadinessScore, 'overall' | 'lastUpdated'>,
    title: string,
    scoreVal: number,
    typeLabel: string
  ) => void;
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
  const [user, setUserState] = useState<UserProfile>(() =>
    getInitialProfileForEmail('student@college.edu')
  );
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const [readinessScore, setReadinessScore] = useState<ReadinessScore>(INITIAL_READINESS);
  const [resume, setResumeState] = useState<ResumeData>(() =>
    getInitialResumeForEmail('student@college.edu')
  );
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [completedTasksCount, setCompletedTasksCount] = useState<number>(0);

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
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
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

  // 1. SUPABASE AUTH & DATA SYNC LISTENER
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleAuthUserChange(session.user.id, session.user.email || '');
      }
    });

    // Listen to real-time auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await handleAuthUserChange(session.user.id, session.user.email || '');
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setCurrentUserId('');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleAuthUserChange = async (userId: string, email: string) => {
    setIsLoggedIn(true);
    setCurrentUserId(userId);

    // Fetch user-specific data from Supabase DB tables
    const [fetchedProfile, fetchedScores, fetchedResume, fetchedActivities] = await Promise.all([
      SupabaseService.fetchProfile(userId),
      SupabaseService.fetchReadinessScore(userId),
      SupabaseService.fetchResume(userId, email),
      SupabaseService.fetchRecentActivities(userId)
    ]);

    if (fetchedProfile) setUserState(fetchedProfile);
    if (fetchedScores) setReadinessScore(fetchedScores);
    if (fetchedResume) setResumeState(fetchedResume);
    if (fetchedActivities) {
      setRecentActivities(fetchedActivities);
      setCompletedTasksCount(fetchedActivities.length);
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const setUser = (newUser: UserProfile) => {
    setUserState(newUser);
    if (currentUserId || newUser.id) {
      SupabaseService.saveProfile(newUser, currentUserId || newUser.id);
    }
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

  const recordUserActivity = async (
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
        updatedScores.communication) /
        5
    );
    updatedScores.overall = avg;

    setReadinessScore(updatedScores);
    if (currentUserId) {
      await SupabaseService.saveReadinessScore(updatedScores, currentUserId);
    }

    // 3. Add to Recent Activities in Supabase DB
    const newAct: ActivityItem = {
      id: `act-${Date.now()}`,
      title,
      type: typeLabel,
      score: `${scoreVal}% Score`,
      time: 'Just now'
    };

    if (currentUserId) {
      const updatedList = await SupabaseService.addRecentActivity(newAct, currentUserId);
      setRecentActivities(updatedList);
      setCompletedTasksCount(updatedList.length);
    } else {
      setRecentActivities((prev) => [newAct, ...prev]);
      setCompletedTasksCount((prev) => prev + 1);
    }
  };

  const recordActivity = async (
    title: string,
    typeLabel: string,
    scoreText?: string,
    targetTab?: ActiveTab
  ) => {
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

    if (currentUserId) {
      const updatedList = await SupabaseService.addRecentActivity(newAct, currentUserId);
      setRecentActivities(updatedList);
      setCompletedTasksCount(updatedList.length);
    } else {
      setRecentActivities((prev) => [newAct, ...prev]);
      setCompletedTasksCount((prev) => prev + 1);
    }
  };

  const clearRecentActivities = async () => {
    if (currentUserId) {
      await SupabaseService.clearRecentActivities(currentUserId);
    }
    setRecentActivities([]);
    setCompletedTasksCount(0);
  };

  const resetAllProgress = async () => {
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
    if (currentUserId) {
      await SupabaseService.saveReadinessScore(zeroReadiness, currentUserId);
      await SupabaseService.clearRecentActivities(currentUserId);
    }

    setRecentActivities([]);
    setCompletedTasksCount(0);
  };

  // SUPABASE LOGIN ACTION
  const login = async (email: string, pass: string): Promise<boolean> => {
    const cleanEmail = email.trim() || 'student@college.edu';
    const { data, error } = await SupabaseService.signIn(cleanEmail, pass);

    if (error && isSupabaseConfigured()) {
      console.error('Supabase Sign In error:', error.message);
      // Fallback for demo login if needed
    }

    const userId = data?.user?.id || currentUserId || `user-${Date.now()}`;
    setIsLoggedIn(true);
    setCurrentUserId(userId);

    // Fetch User Data from Supabase DB
    const loadedProfile = await SupabaseService.fetchProfile(userId);
    const loadedScores = await SupabaseService.fetchReadinessScore(userId);
    const loadedResume = await SupabaseService.fetchResume(userId, cleanEmail);
    const loadedActivities = await SupabaseService.fetchRecentActivities(userId);

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
    return true;
  };

  // SUPABASE SIGNUP ACTION
  const signup = async (
    email: string,
    pass: string,
    details?: Partial<UserProfile>
  ): Promise<boolean> => {
    const cleanEmail = email.trim();
    const { data, error } = await SupabaseService.signUp(cleanEmail, pass, details);

    if (error && isSupabaseConfigured()) {
      console.error('Supabase Sign Up error:', error.message);
    }

    const userId = data?.user?.id || `user-${Date.now()}`;
    setIsLoggedIn(true);
    setCurrentUserId(userId);

    const initialProfile: UserProfile = {
      id: userId,
      name: details?.name || cleanEmail.split('@')[0],
      email: cleanEmail,
      college: details?.college || '',
      department: details?.department || '',
      preferredLanguage: details?.preferredLanguage || 'Tanglish',
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString()
    };

    setUserState(initialProfile);
    await SupabaseService.saveProfile(initialProfile, userId);

    setShowSplash(false);
    if (pendingTargetTab && pendingTargetTab !== 'login') {
      setActiveTab(pendingTargetTab);
      setPendingTargetTab(null);
    } else {
      setActiveTab('home');
    }
    return true;
  };

  // SUPABASE LOGOUT ACTION
  const logout = async (): Promise<void> => {
    await SupabaseService.signOut();
    setIsLoggedIn(false);
    setCurrentUserId('');

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
    if (currentUserId || user.id) {
      SupabaseService.saveResume(newResume, currentUserId || user.id);
    }
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
      if (currentUserId) {
        SupabaseService.saveReadinessScore(updated, currentUserId);
      }
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
        signup,
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
