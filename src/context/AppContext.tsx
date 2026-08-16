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
import { AlertTriangle } from 'lucide-react';
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
  loginWithGoogle: () => Promise<void>;
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
  addNotification: (title: string, message: string, type?: 'interview' | 'coding' | 'resume' | 'general') => void;
  achievements: AchievementBadge[];
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (val: boolean) => void;
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  recalculatePlacementScore: () => void;
  resetAllProgress: () => void;
  activeWorkflowGuard: { workflowName: string; isDirty: boolean } | null;
  registerWorkflowGuard: (workflowName: string, isDirty: boolean) => void;
  clearWorkflowGuard: (workflowName?: string) => void;
  confirmExitWorkflow: () => void;
  cancelExitWorkflow: () => void;
  isExitModalOpen: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserProfile>(() => {
    if (typeof window !== 'undefined') {
      try {
        const active = localStorage.getItem('acehire_active_user');
        if (active) {
          const parsed = JSON.parse(active);
          if (parsed && parsed.email) return parsed;
        }
      } catch (e) {}
    }
    return getInitialProfileForEmail('student@college.edu');
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const [readinessScore, setReadinessScore] = useState<ReadinessScore>(INITIAL_READINESS);
  const [resume, setResumeState] = useState<ResumeData>(() =>
    getInitialResumeForEmail('student@college.edu')
  );
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [completedTasksCount, setCompletedTasksCount] = useState<number>(0);

  const [activeTab, setActiveTabDirectly] = useState<ActiveTab>('home');
  const [pendingTargetTab, setPendingTargetTab] = useState<ActiveTab | null>(null);

  // Global Exit Confirmation Guard States
  const [activeWorkflowGuard, setActiveWorkflowGuardState] = useState<{ workflowName: string; isDirty: boolean } | null>(null);
  const [isExitModalOpen, setIsExitModalOpen] = useState<boolean>(false);
  const [pendingTab, setPendingTab] = useState<ActiveTab | null>(null);

  const registerWorkflowGuard = (workflowName: string, isDirty: boolean) => {
    if (isDirty) {
      setActiveWorkflowGuardState({ workflowName, isDirty: true });
    } else {
      setActiveWorkflowGuardState((prev) => {
        if (prev?.workflowName === workflowName) {
          return null;
        }
        return prev;
      });
    }
  };

  const clearWorkflowGuard = (workflowName?: string) => {
    if (!workflowName || activeWorkflowGuard?.workflowName === workflowName) {
      setActiveWorkflowGuardState(null);
    }
  };

  const setActiveTab = (targetTab: ActiveTab) => {
    if (targetTab === activeTab) return;

    if (activeWorkflowGuard && activeWorkflowGuard.isDirty) {
      setPendingTab(targetTab);
      setIsExitModalOpen(true);
    } else {
      setActiveTabDirectly(targetTab);
    }
  };

  const confirmExitWorkflow = () => {
    const target = pendingTab;
    setIsExitModalOpen(false);
    setPendingTab(null);
    setActiveWorkflowGuardState(null);
    if (target) {
      setActiveTabDirectly(target);
    }
  };

  const cancelExitWorkflow = () => {
    setIsExitModalOpen(false);
    setPendingTab(null);
  };

  // Browser Back Button & Reload Interception
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeWorkflowGuard && activeWorkflowGuard.isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handlePopState = (e: PopStateEvent) => {
      if (activeWorkflowGuard && activeWorkflowGuard.isDirty) {
        window.history.pushState(null, '', window.location.href);
        setIsExitModalOpen(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [activeWorkflowGuard]);

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
        handleAuthUserChange(session.user.id, session.user.email || '', session.user.user_metadata);
      }
    });

    // Listen to real-time auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await handleAuthUserChange(session.user.id, session.user.email || '', session.user.user_metadata);
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setCurrentUserId('');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleAuthUserChange = async (userId: string, email: string, userMetadata?: Record<string, any>) => {
    setIsLoggedIn(true);
    setCurrentUserId(userId);

    // Fetch user-specific data from Supabase DB tables or LocalStorage
    let [fetchedProfile, fetchedScores, fetchedResume, fetchedActivities] = await Promise.all([
      SupabaseService.fetchProfile(userId),
      SupabaseService.fetchReadinessScore(userId),
      SupabaseService.fetchResume(userId, email),
      SupabaseService.fetchRecentActivities(userId)
    ]);

    // Extract actual Google name & picture metadata if user authenticated via Google OAuth
    const rawGoogleName = userMetadata?.full_name || 
                          userMetadata?.name || 
                          (email ? email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '');
    const googleAvatar = userMetadata?.avatar_url || userMetadata?.picture;

    // Auto-create or repair profile if missing, fallback, or incomplete
    if (
      !fetchedProfile ||
      !fetchedProfile.name ||
      fetchedProfile.name === 'User' ||
      fetchedProfile.name === 'Google' ||
      fetchedProfile.name === 'Google Student'
    ) {
      const finalName = rawGoogleName || fetchedProfile?.name || 'Student User';
      const newProfile: UserProfile = {
        id: userId,
        name: finalName,
        email: email || fetchedProfile?.email || 'student@college.edu',
        phone: fetchedProfile?.phone || '',
        userStatus: fetchedProfile?.userStatus || 'College Student',
        schoolName: fetchedProfile?.schoolName || '',
        stream: fetchedProfile?.stream || '',
        expectedCompletionYear: fetchedProfile?.expectedCompletionYear || '',
        college: fetchedProfile?.college || '',
        degree: fetchedProfile?.degree || '',
        department: fetchedProfile?.department || '',
        currentYear: fetchedProfile?.currentYear || '',
        graduationYear: fetchedProfile?.graduationYear || '',
        highestQualification: fetchedProfile?.highestQualification || '',
        currentRole: fetchedProfile?.currentRole || '',
        company: fetchedProfile?.company || '',
        experience: fetchedProfile?.experience || '',
        targetIndustry: fetchedProfile?.targetIndustry || '',
        passoutYear: fetchedProfile?.passoutYear || '',
        preferredLanguage: fetchedProfile?.preferredLanguage || 'Tanglish',
        targetJobRole: fetchedProfile?.targetJobRole || '',
        skills: fetchedProfile?.skills || [],
        avatarUrl:
          googleAvatar ||
          fetchedProfile?.avatarUrl ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: fetchedProfile?.createdAt || new Date().toISOString()
      };
      fetchedProfile = newProfile;
      await SupabaseService.saveProfile(newProfile, userId);
    }

    if (fetchedProfile) setUserState(fetchedProfile);
    if (fetchedScores) setReadinessScore(fetchedScores);
    if (fetchedResume) setResumeState(fetchedResume);
    if (fetchedActivities) {
      setRecentActivities(fetchedActivities);
      setCompletedTasksCount(fetchedActivities.length);
    }
    setShowSplash(false);
    setActiveTabDirectly((prev) => (prev === 'login' ? 'home' : prev));
  };

  // 2. PER-EMAIL USER PROGRESS RESTORATION & ISOLATION SINK
  useEffect(() => {
    if (!user?.email || isSupabaseConfigured()) return;
    const cleanEmail = user.email.trim().toLowerCase();

    // Restore per-email readiness score
    const savedScore = localStorage.getItem(`acehire_readiness_score_${cleanEmail}`);
    if (savedScore) {
      try {
        const parsed = JSON.parse(savedScore);
        if (parsed && typeof parsed.overall === 'number') {
          setReadinessScore(parsed);
        }
      } catch (e) {}
    } else {
      setReadinessScore(INITIAL_READINESS);
    }

    // Restore per-email recent activities
    const savedActivities = localStorage.getItem(`acehire_recent_activities_${cleanEmail}`);
    if (savedActivities) {
      try {
        const parsed = JSON.parse(savedActivities);
        if (Array.isArray(parsed)) {
          setRecentActivities(parsed);
          setCompletedTasksCount(parsed.length);
        }
      } catch (e) {}
    } else {
      setRecentActivities([]);
      setCompletedTasksCount(0);
    }
  }, [user?.email]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const setUser = (newUser: UserProfile) => {
    setUserState(newUser);
    if (typeof window !== 'undefined' && newUser?.email) {
      try {
        localStorage.setItem(`acehire_user_profile_${newUser.email.toLowerCase()}`, JSON.stringify(newUser));
        localStorage.setItem('acehire_active_user', JSON.stringify(newUser));
      } catch (e) {}
    }
    if (currentUserId || newUser.id) {
      SupabaseService.saveProfile(newUser, currentUserId || newUser.id);
    }
  };

  const persistUserProgress = (cleanEmail: string, scores: ReadinessScore, activities: ActivityItem[]) => {
    if (!cleanEmail) return;
    try {
      localStorage.setItem(`acehire_readiness_score_${cleanEmail}`, JSON.stringify(scores));
      localStorage.setItem(`acehire_recent_activities_${cleanEmail}`, JSON.stringify(activities));
      localStorage.setItem(`acehire_completed_tasks_${cleanEmail}`, String(activities.length));
    } catch (e) {}
  };

  const navigateToTab = (targetTab: ActiveTab) => {
    if (isLoggedIn) {
      setActiveTab(targetTab);
    } else {
      setPendingTargetTab(targetTab);
      setActiveTab('login');
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
    const cleanEmail = user?.email?.trim().toLowerCase() || 'student@college.edu';

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

    // 3. Add to Recent Activities
    const newAct: ActivityItem = {
      id: `act-${Date.now()}`,
      title,
      type: typeLabel,
      score: `${scoreVal}% Score`,
      time: 'Just now'
    };

    setRecentActivities((prev) => {
      const updatedList = [newAct, ...prev];
      setCompletedTasksCount(updatedList.length);
      persistUserProgress(cleanEmail, updatedScores, updatedList);
      return updatedList;
    });

    if (currentUserId) {
      await SupabaseService.saveReadinessScore(updatedScores, currentUserId);
      await SupabaseService.addRecentActivity(newAct, currentUserId);
    }
  };

  const recordActivity = async (
    title: string,
    typeLabel: string,
    scoreText?: string,
    targetTab?: ActiveTab
  ) => {
    const cleanEmail = user?.email?.trim().toLowerCase() || 'student@college.edu';
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

    setRecentActivities((prev) => {
      const updatedList = [newAct, ...prev];
      setCompletedTasksCount(updatedList.length);
      persistUserProgress(cleanEmail, readinessScore, updatedList);
      return updatedList;
    });

    if (currentUserId) {
      await SupabaseService.addRecentActivity(newAct, currentUserId);
    }
  };

  const clearRecentActivities = async () => {
    const cleanEmail = user?.email?.trim().toLowerCase() || 'student@college.edu';
    setRecentActivities([]);
    setCompletedTasksCount(0);
    persistUserProgress(cleanEmail, readinessScore, []);
    if (currentUserId) {
      await SupabaseService.clearRecentActivities(currentUserId);
    }
  };

  const resetAllProgress = async () => {
    const cleanEmail = user?.email?.trim().toLowerCase() || 'student@college.edu';
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
    setRecentActivities([]);
    setCompletedTasksCount(0);
    persistUserProgress(cleanEmail, zeroReadiness, []);

    if (currentUserId) {
      await SupabaseService.saveReadinessScore(zeroReadiness, currentUserId);
      await SupabaseService.clearRecentActivities(currentUserId);
    }
  };

  // SUPABASE LOGIN ACTION
  const login = async (email: string, pass: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await SupabaseService.signIn(cleanEmail, pass);

    if (error && isSupabaseConfigured()) {
      console.error('Supabase Sign In error:', error.message);
    }

    const userId = data?.user?.id || currentUserId || `user-${Date.now()}`;
    setIsLoggedIn(true);
    setCurrentUserId(userId);

    // Fetch User Data from Supabase DB or Local Storage
    const loadedProfile = await SupabaseService.fetchProfile(cleanEmail || userId);
    const loadedScores = await SupabaseService.fetchReadinessScore(userId);
    const loadedResume = await SupabaseService.fetchResume(userId, cleanEmail);
    const loadedActivities = await SupabaseService.fetchRecentActivities(userId);

    // Restore per-email scores & activities if local storage contains saved progress for this email
    const localScoreStr = localStorage.getItem(`acehire_readiness_score_${cleanEmail}`);
    const localActivitiesStr = localStorage.getItem(`acehire_recent_activities_${cleanEmail}`);

    let activeScores = loadedScores;
    if (localScoreStr) {
      try {
        const parsed = JSON.parse(localScoreStr);
        if (parsed && typeof parsed.overall === 'number') activeScores = parsed;
      } catch (e) {}
    }

    let activeActivities = loadedActivities;
    if (localActivitiesStr) {
      try {
        const parsed = JSON.parse(localActivitiesStr);
        if (Array.isArray(parsed)) activeActivities = parsed;
      } catch (e) {}
    }

    // Increment login count for returning email user
    const currentCount = loadedProfile.loginCount || 1;
    const updatedProfile: UserProfile = {
      ...loadedProfile,
      loginCount: currentCount + 1,
      isFirstLogin: false,
      lastLoginAt: new Date().toISOString()
    };

    setUser(updatedProfile);
    if (activeScores) setReadinessScore(activeScores);
    if (loadedResume) setResumeState(loadedResume);
    if (activeActivities) {
      setRecentActivities(activeActivities);
      setCompletedTasksCount(activeActivities.length);
    }

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
    const cleanEmail = email.trim().toLowerCase();
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
      phone: details?.phone || '',
      userStatus: details?.userStatus || 'College Student',
      schoolName: details?.schoolName || '',
      stream: details?.stream || '',
      expectedCompletionYear: details?.expectedCompletionYear || '',
      college: details?.college || '',
      degree: details?.degree || '',
      department: details?.department || '',
      currentYear: details?.currentYear || '',
      graduationYear: details?.graduationYear || '',
      highestQualification: details?.highestQualification || '',
      currentRole: details?.currentRole || '',
      company: details?.company || '',
      experience: details?.experience || '',
      targetIndustry: details?.targetIndustry || '',
      passoutYear: details?.passoutYear || '',
      preferredLanguage: details?.preferredLanguage || 'Tanglish',
      targetJobRole: details?.targetJobRole || '',
      skills: details?.skills || [],
      avatarUrl:
        details?.avatarUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      loginCount: 1,
      isFirstLogin: true,
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    setUser(initialProfile);

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
      if (currentUserId) {
        SupabaseService.saveUserSettings(currentUserId, updated);
      }
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

  const addNotification = (
    title: string,
    message: string,
    type: 'interview' | 'coding' | 'resume' | 'general' = 'coding'
  ) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      time: 'Just now',
      read: false,
      type
    };
    setNotifications((prev) => [newNotif, ...prev]);
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

  // GOOGLE OAUTH ACTION WITH SUPABASE OAUTH FLOW
  const loginWithGoogle = async (): Promise<void> => {
    if (!isSupabaseConfigured()) {
      throw new Error(
        'Google Sign-In requires active Supabase configuration. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
      );
    }

    const { error } = await SupabaseService.signInWithGoogle();
    if (error) {
      throw new Error(error.message || 'Failed to initiate Google Sign-In with Supabase.');
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isLoggedIn,
        login,
        loginWithGoogle,
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
        addNotification,
        achievements,
        darkMode,
        setDarkMode,
        isAuthModalOpen,
        setIsAuthModalOpen,
        settings,
        updateSettings,
        recalculatePlacementScore,
        resetAllProgress,
        activeWorkflowGuard,
        registerWorkflowGuard,
        clearWorkflowGuard,
        confirmExitWorkflow,
        cancelExitWorkflow,
        isExitModalOpen
      }}
    >
      {children}

      {/* GLOBAL EXIT CONFIRMATION MODAL */}
      {isExitModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 relative text-left">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white font-['Space_Grotesk']">
                  Exit {activeWorkflowGuard?.workflowName || 'Workflow'}?
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Unsaved or incomplete progress detected.
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Are you sure you want to exit {activeWorkflowGuard?.workflowName || 'this workflow'}? Your current progress may not be completed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={cancelExitWorkflow}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold text-xs transition-all cursor-pointer"
              >
                No, Stay
              </button>

              <button
                onClick={confirmExitWorkflow}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-lg transition-all cursor-pointer"
              >
                Yes, Exit
              </button>
            </div>
          </div>
        </div>
      )}
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
