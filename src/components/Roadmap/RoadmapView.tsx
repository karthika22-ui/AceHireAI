import React, { useState, useEffect } from 'react';
import {
  Map,
  Sparkles,
  CheckCircle2,
  Calendar,
  Bot,
  Award,
  ChevronRight,
  Check,
  Brain,
  Code,
  FileText,
  MessageSquare,
  Video,
  CheckSquare,
  LayoutDashboard,
  BarChart3,
  PartyPopper,
  Bell,
  BookOpen,
  Clock,
  Info,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type UserLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type DailyTime = '30 min' | '1 hour' | '2 hours' | '3+ hours';
export type RealModuleTab = 'resume' | 'aptitude' | 'coding' | 'communication' | 'interview';

export interface RealModuleSkillGap {
  moduleKey: RealModuleTab;
  moduleName: string;
  statusTag: 'Strong' | 'Needs Improvement' | 'Weak' | 'Not Started';
  priorityTag: 'HIGH PRIORITY' | 'MEDIUM PRIORITY' | 'LOW PRIORITY' | 'NOT STARTED';
  realScoreText: string;
  reason: string;
}

export interface RealAppPhase {
  phaseNumber: number;
  title: string;
  moduleKey: RealModuleTab;
  moduleName: string;
  description: string;
  priority: 'HIGH PRIORITY' | 'MEDIUM PRIORITY' | 'LOW PRIORITY' | 'NOT STARTED';
  estimatedHours: string;
  statusLabel: string;
  realScoreVal: number;
  hasActivity: boolean;
  actionLabel: string;
  supportedFeatures: string[];
}

export interface TodayGoalTask {
  id: string;
  goalTitle: string;
  reason: string;
  estimatedTime: string;
  moduleKey: RealModuleTab;
  moduleName: string;
  status: 'not_started' | 'in_progress' | 'completed';
}

export interface TodaySessionInfo {
  dayName: string;
  moduleKey: RealModuleTab;
  moduleName: string;
  taskDetails: string;
  status: 'not_started' | 'in_progress' | 'completed';
  startedAtTimestamp?: number;
}

export interface RebuiltRoadmapState {
  skillGaps: RealModuleSkillGap[];
  phases: RealAppPhase[];
  todayGoals: TodayGoalTask[];
  todaySession: TodaySessionInfo;
  aiRecommendation: string;
  overallProgressScore: number;
  hasRecordedActivity: boolean;
  lastUpdated: string;
}

const LOCAL_STORAGE_KEY = 'acehire_ai_roadmap_state_v14';
const STORAGE_KEY_LAST_GOALS_DATE = 'acehire_roadmap_last_goals_date';
const STORAGE_KEY_LAST_NOTIF_DATE = 'acehire_roadmap_last_notif_date';

// Helper to check if a real practice activity was completed for a target module in recentActivities
function hasCompletedRecentActivityForModule(
  moduleKey: RealModuleTab,
  recentActivities: Array<{ id: string; title: string; type: string; score: string; time: string }>,
  startedAtTimestamp?: number
): boolean {
  if (!recentActivities || recentActivities.length === 0) return false;

  const keyLower = moduleKey.toLowerCase();
  
  return recentActivities.some((act) => {
    const titleLower = (act.title || '').toLowerCase();
    const typeLower = (act.type || '').toLowerCase();

    const matchesModule =
      (keyLower === 'communication' && (typeLower.includes('communication') || titleLower.includes('communication') || typeLower.includes('grammar') || titleLower.includes('grammar'))) ||
      (keyLower === 'coding' && (typeLower.includes('coding') || titleLower.includes('coding') || typeLower.includes('code') || titleLower.includes('code'))) ||
      (keyLower === 'aptitude' && (typeLower.includes('aptitude') || titleLower.includes('aptitude') || typeLower.includes('quant') || titleLower.includes('logical'))) ||
      (keyLower === 'interview' && (typeLower.includes('interview') || titleLower.includes('interview') || typeLower.includes('mock'))) ||
      (keyLower === 'resume' && (typeLower.includes('resume') || titleLower.includes('resume') || typeLower.includes('ats') || titleLower.includes('ats')));

    if (!matchesModule) return false;

    // If activity time is 'Just now', it was completed in the current active session
    if (act.time === 'Just now') return true;

    // Extract timestamp from activity id (format: 'act-1725002000000')
    if (startedAtTimestamp && act.id && act.id.startsWith('act-')) {
      const actTs = parseInt(act.id.replace('act-', ''), 10);
      if (!isNaN(actTs) && actTs >= startedAtTimestamp - 5000) {
        return true;
      }
    }

    return true;
  });
}

// Single Unified Function for Performance, Skill Gap, and Priority Evaluation
function getUnifiedModulePerformance(
  score: number,
  hasActivity: boolean,
  moduleName: string
): {
  statusTag: 'Strong' | 'Needs Improvement' | 'Weak' | 'Not Started';
  priorityTag: 'HIGH PRIORITY' | 'MEDIUM PRIORITY' | 'LOW PRIORITY' | 'NOT STARTED';
  scoreText: string;
  reasonText: string;
} {
  if (!hasActivity && score === 0) {
    return {
      statusTag: 'Not Started',
      priorityTag: 'NOT STARTED',
      scoreText: 'Not Started',
      reasonText: `No practice sessions recorded in ${moduleName} yet. Complete your first session to establish your baseline performance.`
    };
  }

  if (score >= 75) {
    return {
      statusTag: 'Strong',
      priorityTag: 'LOW PRIORITY',
      scoreText: `${score}% Score`,
      reasonText: `Your performance in ${moduleName} is strong (${score}%). Maintain readiness with periodic practice.`
    };
  }

  if (score >= 50) {
    return {
      statusTag: 'Needs Improvement',
      priorityTag: 'MEDIUM PRIORITY',
      scoreText: `${score}% Score`,
      reasonText: `Your performance in ${moduleName} is ${score}%. Moderate practice is recommended to reach >75%.`
    };
  }

  // score < 50
  return {
    statusTag: 'Weak',
    priorityTag: 'HIGH PRIORITY',
    scoreText: `${score}% Score`,
    reasonText: `Your performance in ${moduleName} is ${score}%, which is below target threshold. Priority practice required.`
  };
}

// Generates data-driven placement roadmap based STRICTLY on real performance
function generateDataDrivenPlacementRoadmap(
  readinessScore: { overall: number; interview: number; resume: number; coding: number; aptitude: number; communication: number },
  recentActivities: Array<{ id: string; title: string; type: string; score: string; time: string }>
): RebuiltRoadmapState {
  const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  // Extract REAL scores from AppContext
  const resumeScore = readinessScore.resume || 0;
  const aptitudeScore = readinessScore.aptitude || 0;
  const codingScore = readinessScore.coding || 0;
  const commScore = readinessScore.communication || 0;
  const interviewScore = readinessScore.interview || 0;

  // Check activity history per module
  const hasResumeAct = recentActivities.some((a) => a.type?.toLowerCase().includes('resume') || a.title?.toLowerCase().includes('resume'));
  const hasAptitudeAct = recentActivities.some((a) => a.type?.toLowerCase().includes('aptitude') || a.title?.toLowerCase().includes('aptitude'));
  const hasCodingAct = recentActivities.some((a) => a.type?.toLowerCase().includes('coding') || a.title?.toLowerCase().includes('coding'));
  const hasCommAct = recentActivities.some((a) => a.type?.toLowerCase().includes('communication') || a.title?.toLowerCase().includes('communication'));
  const hasInterviewAct = recentActivities.some((a) => a.type?.toLowerCase().includes('interview') || a.title?.toLowerCase().includes('interview'));

  const hasRecordedActivity = recentActivities.length > 0 || readinessScore.overall > 0;

  // Compute UNIFIED Module Evaluations
  const evalResume = getUnifiedModulePerformance(resumeScore, hasResumeAct, 'Resume Builder / ATS');
  const evalAptitude = getUnifiedModulePerformance(aptitudeScore, hasAptitudeAct, 'Aptitude Practice');
  const evalCoding = getUnifiedModulePerformance(codingScore, hasCodingAct, 'Coding Practice');
  const evalComm = getUnifiedModulePerformance(commScore, hasCommAct, 'Communication Hub');
  const evalInterview = getUnifiedModulePerformance(interviewScore, hasInterviewAct, 'AI Mock Interview');

  // 1. AI SKILL GAP ANALYSIS (REAL APP DATA ONLY)
  const skillGaps: RealModuleSkillGap[] = [
    { moduleKey: 'resume', moduleName: 'Resume Builder / ATS', statusTag: evalResume.statusTag, priorityTag: evalResume.priorityTag, realScoreText: evalResume.scoreText, reason: evalResume.reasonText },
    { moduleKey: 'aptitude', moduleName: 'Aptitude Practice', statusTag: evalAptitude.statusTag, priorityTag: evalAptitude.priorityTag, realScoreText: evalAptitude.scoreText, reason: evalAptitude.reasonText },
    { moduleKey: 'coding', moduleName: 'Coding Practice', statusTag: evalCoding.statusTag, priorityTag: evalCoding.priorityTag, realScoreText: evalCoding.scoreText, reason: evalCoding.reasonText },
    { moduleKey: 'communication', moduleName: 'Communication Hub', statusTag: evalComm.statusTag, priorityTag: evalComm.priorityTag, realScoreText: evalComm.scoreText, reason: evalComm.reasonText },
    { moduleKey: 'interview', moduleName: 'AI Mock Interview', statusTag: evalInterview.statusTag, priorityTag: evalInterview.priorityTag, realScoreText: evalInterview.scoreText, reason: evalInterview.reasonText }
  ];

  // 2. REAL APPLICATION PREPARATION PHASES (PHASES 1 to 3 BASED ON DYNAMIC PRIORITY)
  const allModules: RealAppPhase[] = [
    {
      phaseNumber: 1,
      title: 'PHASE 1 — High Priority & Baseline Focus',
      moduleKey: 'coding',
      moduleName: 'Coding Practice',
      description: evalCoding.reasonText,
      priority: evalCoding.priorityTag,
      estimatedHours: '30 min session',
      statusLabel: evalCoding.scoreText,
      realScoreVal: codingScore,
      hasActivity: hasCodingAct || codingScore > 0,
      actionLabel: (hasCodingAct || codingScore > 0) ? 'Continue Coding Practice' : 'Start Coding Practice',
      supportedFeatures: ['Java, Python, C, C++ & SQL Problem Solving', 'Array, String & Recursion Sandbox Challenges', 'Multi-Table SQL JOIN Queries']
    },
    {
      phaseNumber: 2,
      title: 'PHASE 2 — Aptitude & Core Problem Solving',
      moduleKey: 'aptitude',
      moduleName: 'Aptitude Practice',
      description: evalAptitude.reasonText,
      priority: evalAptitude.priorityTag,
      estimatedHours: '25 min session',
      statusLabel: evalAptitude.scoreText,
      realScoreVal: aptitudeScore,
      hasActivity: hasAptitudeAct || aptitudeScore > 0,
      actionLabel: (hasAptitudeAct || aptitudeScore > 0) ? 'Continue Aptitude Practice' : 'Start Aptitude Practice',
      supportedFeatures: ['Quantitative Aptitude Drills', 'Logical Reasoning Puzzles & Sequences', 'Verbal Ability & Comprehension']
    },
    {
      phaseNumber: 3,
      title: 'PHASE 3 — Communication & Mock Interview Readiness',
      moduleKey: 'interview',
      moduleName: 'AI Mock Interview',
      description: evalInterview.reasonText,
      priority: evalInterview.priorityTag,
      estimatedHours: '30 min session',
      statusLabel: evalInterview.scoreText,
      realScoreVal: interviewScore,
      hasActivity: hasInterviewAct || interviewScore > 0,
      actionLabel: (hasInterviewAct || interviewScore > 0) ? 'Continue AI Mock Interview' : 'Start AI Mock Interview',
      supportedFeatures: ['Technical & HR AI Mock Interview Sessions', 'Dual-Language Answer Feedback & Structural Recommendations']
    }
  ];

  // Sort by priority for Today's Goals & Session allocation
  const sortedPhases = [...allModules].sort((a, b) => {
    const pWeights: Record<string, number> = { 'HIGH PRIORITY': 1, 'NOT STARTED': 2, 'MEDIUM PRIORITY': 3, 'LOW PRIORITY': 4 };
    return pWeights[a.priority] - pWeights[b.priority];
  });

  const top1 = sortedPhases[0];
  const top2 = sortedPhases[1];

  const isTop1Completed = hasCompletedRecentActivityForModule(top1.moduleKey, recentActivities);

  // 3. TODAY'S GOALS DYNAMICALLY SELECTED FROM WEAKEST REAL MODULES
  const todayGoals: TodayGoalTask[] = [
    {
      id: 'tg-1',
      goalTitle: top1.hasActivity ? `Complete practice in ${top1.moduleName}` : `Start baseline session in ${top1.moduleName}`,
      reason: top1.description,
      estimatedTime: '30 min',
      moduleKey: top1.moduleKey,
      moduleName: top1.moduleName,
      status: isTop1Completed ? 'completed' : top1.hasActivity ? 'in_progress' : 'not_started'
    },
    {
      id: 'tg-2',
      goalTitle: top2.hasActivity ? `Complete tasks in ${top2.moduleName}` : `Start practice session in ${top2.moduleName}`,
      reason: top2.description,
      estimatedTime: '20 min',
      moduleKey: top2.moduleKey,
      moduleName: top2.moduleName,
      status: hasCompletedRecentActivityForModule(top2.moduleKey, recentActivities) ? 'completed' : top2.hasActivity ? 'in_progress' : 'not_started'
    },
    {
      id: 'tg-3',
      goalTitle: 'Refine 1 answer in Communication Hub',
      reason: 'Improve grammar accuracy and sentence structure for placement interviews.',
      estimatedTime: '15 min',
      moduleKey: 'communication',
      moduleName: 'Communication Hub',
      status: hasCompletedRecentActivityForModule('communication', recentActivities) ? 'completed' : hasCommAct ? 'in_progress' : 'not_started'
    }
  ];

  // 4. DYNAMIC TODAY'S SESSION
  const todaySession: TodaySessionInfo = {
    dayName: currentDayName,
    moduleKey: top1.moduleKey,
    moduleName: top1.moduleName,
    taskDetails: `Complete your focused ${currentDayName} session in ${top1.moduleName}. ${top1.description}`,
    status: isTop1Completed ? 'completed' : top1.hasActivity ? 'in_progress' : 'not_started'
  };

  // 5. OVERALL PROGRESS SCORE
  const overallProgressScore = readinessScore.overall;

  // 6. CONTEXTUAL AI RECOMMENDATION FROM REAL DATA
  let aiRecommendation = '';
  if (!hasRecordedActivity) {
    aiRecommendation = `Welcome! Complete a practice activity in Coding, Aptitude, Communication, Resume, or Mock Interview so AI can analyze your performance.`;
  } else if (top1.priority === 'HIGH PRIORITY') {
    aiRecommendation = `Based on your real performance, ${top1.moduleName} is your highest priority focus (${top1.statusLabel}). Complete your ${currentDayName} session in ${top1.moduleName} to improve your placement score.`;
  } else {
    aiRecommendation = `Great momentum! Complete Today's Goals & your ${currentDayName} session to maintain your score across all preparation modules.`;
  }

  return {
    skillGaps,
    phases: allModules,
    todayGoals,
    todaySession,
    aiRecommendation,
    overallProgressScore,
    hasRecordedActivity,
    lastUpdated: new Date().toISOString()
  };
}

export const RoadmapView: React.FC = () => {
  const { user, readinessScore, setActiveTab, recentActivities, addNotification } = useApp();

  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [roadmapData, setRoadmapData] = useState<RebuiltRoadmapState | null>(null);
  const [notifState, setNotifState] = useState<{
    status: 'idle' | 'loading' | 'success' | 'denied' | 'error';
    message: string;
    details?: string;
  }>({
    status: 'idle',
    message: ''
  });

  // Check Browser Notification Permission on Mount & Auto Subscribe
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = Notification.permission;
      setNotificationPermission(perm);
      if (perm === 'granted') {
        import('../../utils/webPushHelper').then(({ initAutoPushSubscription }) => {
          initAutoPushSubscription(user?.id);
        });
      }
    } else {
      setNotificationPermission('unsupported');
    }
  }, [user?.id]);

  const handleRequestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setNotificationPermission(res);
        if (res === 'granted') {
          const { initAutoPushSubscription } = await import('../../utils/webPushHelper');
          await initAutoPushSubscription(user?.id);
        } else if (res === 'denied') {
          setNotifState({
            status: 'denied',
            message: 'Browser notification permission is currently DENIED.',
            details: 'Notifications for this site have been blocked in your browser site settings.'
          });
        }
      } catch (e) {
        console.warn('Error requesting notification permission:', e);
      }
    }
  };

  const handleSendTestNotification = async () => {
    setNotifState({
      status: 'loading',
      message: 'Checking notification permission & initializing Web Push Service Worker...'
    });

    try {
      const { sendMobileTestPushNotification } = await import('../../utils/webPushHelper');
      const res = await sendMobileTestPushNotification(user?.id);

      if (typeof window !== 'undefined' && 'Notification' in window) {
        setNotificationPermission(Notification.permission);
      }

      if (res.permissionState === 'denied' || (!res.success && res.message.includes('DENIED'))) {
        setNotifState({
          status: 'denied',
          message: 'Browser notification permission is currently DENIED.',
          details: 'Notifications for this site have been blocked in your browser site settings.'
        });
        return;
      }

      if (!res.success) {
        setNotifState({
          status: 'error',
          message: res.message || 'Push notification registration failed.'
        });
        return;
      }

      setNotifState({
        status: 'success',
        message: '✓ Test notification sent to your device!',
        details: res.message
      });
    } catch (err: any) {
      setNotifState({
        status: 'error',
        message: err.message || 'Failed to dispatch test notification.'
      });
    }
  };


  // Load Persisted State & Re-calculate based on REAL data
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const lastGoalsDate = localStorage.getItem(STORAGE_KEY_LAST_GOALS_DATE);

    let currentRoadmap = generateDataDrivenPlacementRoadmap(readinessScore, recentActivities);

    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed: RebuiltRoadmapState = JSON.parse(saved);
        if (parsed && parsed.phases && parsed.phases.length > 0) {
          // Check if today is a NEW calendar day
          if (lastGoalsDate && lastGoalsDate !== todayStr) {
            currentRoadmap.todayGoals = currentRoadmap.todayGoals.map((g) => ({ ...g, status: 'not_started' as const }));
            if (currentRoadmap.todaySession) {
              currentRoadmap.todaySession = {
                ...currentRoadmap.todaySession,
                dayName: currentDayName,
                status: 'not_started' as const,
                startedAtTimestamp: undefined
              };
            }
            localStorage.setItem(STORAGE_KEY_LAST_GOALS_DATE, todayStr);
          }
        }
      }
    } catch (e) {
      console.warn('Could not load saved roadmap state:', e);
    }

    localStorage.setItem(STORAGE_KEY_LAST_GOALS_DATE, todayStr);

    // AUTOMATICALLY DETECT IF TODAY'S SESSION OR GOALS WERE COMPLETED IN TARGET MODULES
    const isSessionModuleCompleted = hasCompletedRecentActivityForModule(
      currentRoadmap.todaySession.moduleKey,
      recentActivities,
      currentRoadmap.todaySession?.startedAtTimestamp
    );

    currentRoadmap.todaySession = {
      ...currentRoadmap.todaySession,
      status: isSessionModuleCompleted ? 'completed' : currentRoadmap.todaySession.status
    };

    currentRoadmap.todayGoals = currentRoadmap.todayGoals.map((g) => {
      const isGoalCompleted = g.status === 'completed' || hasCompletedRecentActivityForModule(g.moduleKey, recentActivities);
      return {
        ...g,
        status: isGoalCompleted ? ('completed' as const) : g.status
      };
    });

    setRoadmapData(currentRoadmap);
    triggerDailyGoalsNotification(todayStr, currentDayName);
  }, [readinessScore, recentActivities]);

  const triggerDailyGoalsNotification = (todayStr: string, currentDayName: string) => {
    const lastNotifDate = localStorage.getItem(STORAGE_KEY_LAST_NOTIF_DATE);
    if (lastNotifDate !== todayStr) {
      localStorage.setItem(STORAGE_KEY_LAST_NOTIF_DATE, todayStr);

      if (addNotification) {
        addNotification(
          "Today's Learning Reminder 🎯",
          `Complete your Today's Goal and ${currentDayName} Session in your AI Learning Roadmap.`,
          'general'
        );
      }
    }
  };

  const handleNavigateToModule = (moduleKey: RealModuleTab) => {
    switch (moduleKey) {
      case 'resume':
        setActiveTab('resume');
        break;
      case 'aptitude':
        setActiveTab('aptitude');
        break;
      case 'coding':
        setActiveTab('coding');
        break;
      case 'communication':
        setActiveTab('communication');
        break;
      case 'interview':
        setActiveTab('interview');
        break;
      default:
        setActiveTab('dashboard');
    }
  };

  const handleToggleTodayGoal = (goalId: string) => {
    if (!roadmapData) return;

    const updatedGoals = roadmapData.todayGoals.map((g) => {
      if (g.id === goalId) {
        const nextStatus: 'not_started' | 'completed' = g.status === 'completed' ? 'not_started' : 'completed';
        return { ...g, status: nextStatus };
      }
      return g;
    });

    const updatedState = { ...roadmapData, todayGoals: updatedGoals };
    setRoadmapData(updatedState);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedState));
    } catch (e) {}
  };

  const handleStartTodaySession = () => {
    if (!roadmapData) return;

    const nowTs = Date.now();
    const updatedState = {
      ...roadmapData,
      todaySession: {
        ...roadmapData.todaySession,
        status: 'in_progress' as const,
        startedAtTimestamp: nowTs
      }
    };
    setRoadmapData(updatedState);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedState));
    } catch (e) {}

    handleNavigateToModule(roadmapData.todaySession.moduleKey);
  };

  if (!roadmapData) return null;

  const todayGoalsCompletedCount = roadmapData.todayGoals.filter((g) => g.status === 'completed').length;
  const isTodaySessionCompleted = roadmapData.todaySession.status === 'completed';
  const isAllTodayTasksAndSessionCompleted =
    todayGoalsCompletedCount === roadmapData.todayGoals.length && isTodaySessionCompleted;

  const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="flex-1 h-full overflow-y-auto overflow-x-hidden space-y-8 animate-in fade-in duration-300 pb-24 pr-1">
      
      {/* SECTION 1: HEADER BANNER */}
      <div className="glass-card rounded-[26px] p-6 sm:p-7 border border-slate-700/80 bg-slate-900/90 backdrop-blur-2xl shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-cyan-300 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30">
              My AI Learning Roadmap
            </span>
          </div>

          <h2 className="text-xl sm:text-3xl font-extrabold text-white font-['Space_Grotesk'] flex items-center gap-2">
            🎯 AI Learning Roadmap
          </h2>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            AI analyzes your real placement preparation activity across the existing application modules.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="px-4 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <LayoutDashboard className="w-4 h-4 text-cyan-400" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      {/* NO ACTIVITY BANNER (IF ZERO PRACTICE RECORDED YET) */}
      {!roadmapData.hasRecordedActivity && (
        <div className="p-5 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 flex items-start gap-4 text-xs animate-in fade-in">
          <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-extrabold text-white font-['Space_Grotesk']">
              Not enough activity yet
            </h4>
            <p className="text-slate-300 font-medium leading-relaxed">
              Complete a few practice activities in Coding, Aptitude, Communication, Resume Builder, or AI Mock Interview so AI can analyze your performance and update your priorities.
            </p>
          </div>
        </div>
      )}

      {/* AUTOMATIC DAILY WEB PUSH REMINDER CARD */}
      <div className="glass-card rounded-2xl p-5 bg-slate-950 border border-blue-500/30 space-y-4 text-xs shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-cyan-400 shrink-0">
              <Bell className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <strong className="text-cyan-300 block font-extrabold uppercase text-[10px] tracking-wider font-['Space_Grotesk']">
                  Dynamic Daily Roadmap Reminders
                </strong>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                  notificationPermission === 'granted'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : notificationPermission === 'denied'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {notificationPermission === 'granted' && '🟢 Automatic Reminders Active'}
                  {notificationPermission === 'denied' && '❌ Permission Blocked'}
                  {notificationPermission === 'default' && '⚠️ Permission Needed'}
                </span>
              </div>
              <span className="text-slate-300 font-medium block mt-0.5">
                {notificationPermission === 'granted'
                  ? `Daily push reminders will automatically arrive on your phone/laptop for your scheduled ${currentDayName} ${roadmapData.todaySession?.moduleName || 'practice'} session.`
                  : notificationPermission === 'denied'
                  ? 'Browser notifications are blocked in your site settings. Enable notifications to receive daily goal reminders.'
                  : 'Enable browser notifications to automatically receive your daily placement roadmap reminders.'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            {notificationPermission === 'default' && (
              <button
                type="button"
                onClick={handleRequestNotificationPermission}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-400 hover:to-cyan-300 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-md"
              >
                Enable Daily Notifications
              </button>
            )}

            {/* DEVELOPER / ADMIN TEST BUTTON — HIDDEN FROM NORMAL USERS */}
            {typeof window !== 'undefined' && ((import.meta as any).env?.DEV || window.location.search.includes('dev=true')) && (
              <button
                type="button"
                disabled={notifState.status === 'loading'}
                onClick={handleSendTestNotification}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-extrabold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
              >
                <Bell className="w-3 h-3 text-cyan-400" />
                <span>Dev Test Push</span>
              </button>
            )}
          </div>
        </div>

        {/* STATUS FEEDBACK INLINE CARD (FOR DEV TESTING) */}
        {notifState.status === 'loading' && (
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-3 text-cyan-300 text-xs font-semibold animate-pulse">
            <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            <span>{notifState.message}</span>
          </div>
        )}

        {notifState.status === 'success' && (
          <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-start gap-3 text-xs text-emerald-200 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-white font-bold text-xs block">{notifState.message}</strong>
              <p className="text-emerald-300/90 font-medium text-[11px]">{notifState.details}</p>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono text-emerald-300 space-y-0.5">
                <div>Title: <strong>HasHire AI — Today's Preparation</strong></div>
                <div>Body: <strong>Complete your Today Goal and today's {currentDayName} {roadmapData.todaySession?.moduleName || 'practice'} session in HasHire AI.</strong></div>
              </div>
            </div>
          </div>
        )}

        {/* DENIED PERMISSION INSTRUCTIONS PANEL */}
        {(notificationPermission === 'denied' || notifState.status === 'denied') && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 space-y-2.5 text-xs text-red-200 animate-in fade-in">
            <div className="flex items-center gap-2 text-red-300 font-extrabold text-xs">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>Browser Notification Permission is Currently Blocked</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Your browser is blocking notifications for this website. To enable push notifications on your phone or laptop:
            </p>
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5 text-[11px] text-slate-300 font-medium">
              <div className="font-bold text-cyan-300">📱 How to enable in your mobile browser settings:</div>
              <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1">
                <li>Tap the <strong>Lock icon 🔒</strong> or <strong>Site Info icon 🎛️</strong> next to the URL in your browser address bar.</li>
                <li>Select <strong>Site settings</strong> or <strong>Permissions</strong>.</li>
                <li>Find <strong>Notifications</strong> and change the setting from <em>Block</em> to <strong>Allow</strong>.</li>
                <li>Return to this page and refresh to complete automatic push registration.</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* AI RECOMMENDATION BANNER */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-purple-950/70 to-slate-950 border border-indigo-500/30 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 shrink-0">
            <Bot className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <strong className="text-indigo-300 block font-extrabold uppercase text-[10px] tracking-wider">AI Analysis Summary</strong>
            <span className="text-slate-200 font-medium">{roadmapData.aiRecommendation}</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: AI SKILL GAP ANALYSIS */}
      <div className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-700/80 bg-slate-900/90 backdrop-blur-2xl shadow-xl space-y-5">
        <div className="space-y-1 border-b border-slate-800 pb-3">
          <h3 className="text-lg font-extrabold text-white flex items-center gap-2 font-['Space_Grotesk']">
            <Brain className="w-5 h-5 text-cyan-400" />
            <span>AI Skill Gap Analysis</span>
          </h3>
          <p className="text-xs text-slate-400">
            Performance evaluation across the 5 practice modules calculated strictly from real user activity.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {roadmapData.skillGaps.map((sg) => (
            <div
              key={sg.moduleKey}
              className={`p-4 rounded-2xl border space-y-2 transition-all ${
                sg.statusTag === 'Strong'
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                  : sg.statusTag === 'Needs Improvement' || sg.statusTag === 'Weak'
                  ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black truncate block">{sg.moduleName}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  sg.statusTag === 'Strong'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : sg.statusTag === 'Needs Improvement'
                    ? 'bg-amber-500/20 text-amber-300'
                    : sg.statusTag === 'Weak'
                    ? 'bg-red-500/20 text-red-300'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {sg.statusTag === 'Strong' && '🟢 Strong'}
                  {sg.statusTag === 'Needs Improvement' && '🟡 Needs Work'}
                  {sg.statusTag === 'Weak' && '🔴 Weak'}
                  {sg.statusTag === 'Not Started' && '⚪ Not Started'}
                </span>

                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {sg.realScoreText}
                </span>
              </div>

              <p className="text-[11px] leading-relaxed font-medium">
                {sg.reason}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: PERSONALIZED PREPARATION PHASES */}
      <div className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-700/80 bg-slate-900/90 backdrop-blur-2xl shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2 font-['Space_Grotesk']">
              <Map className="w-5 h-5 text-cyan-400" />
              <span>Personalized Preparation Phases</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Preparation phases with priorities dynamically matched to your real AI performance data.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {roadmapData.phases.map((phase) => (
            <div
              key={phase.phaseNumber}
              className={`p-5 sm:p-6 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5 ${
                phase.priority === 'HIGH PRIORITY'
                  ? 'border-cyan-400/80 bg-slate-950/90 shadow-lg shadow-cyan-400/10'
                  : phase.priority === 'NOT STARTED'
                  ? 'border-purple-500/40 bg-slate-950/70'
                  : 'border-slate-800 bg-slate-950/60'
              }`}
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs font-black flex items-center justify-center border border-cyan-500/30">
                    {phase.phaseNumber}
                  </span>
                  <h4 className="text-base font-extrabold text-white font-['Space_Grotesk']">
                    {phase.title}
                  </h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    phase.priority === 'HIGH PRIORITY'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : phase.priority === 'MEDIUM PRIORITY'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : phase.priority === 'NOT STARTED'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {phase.priority === 'HIGH PRIORITY' && '🔴 HIGH PRIORITY'}
                    {phase.priority === 'MEDIUM PRIORITY' && '🟡 MEDIUM PRIORITY'}
                    {phase.priority === 'LOW PRIORITY' && '🟢 LOW PRIORITY'}
                    {phase.priority === 'NOT STARTED' && '⚪ NOT STARTED'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-medium">
                  {phase.description}
                </p>

                <div className="pt-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Supported Module Features:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {phase.supportedFeatures.map((feat, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300">
                        • {feat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between gap-3 shrink-0 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                <div className="text-left md:text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Real Progress</span>
                  <strong className={`text-xs font-mono font-black ${phase.hasActivity ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {phase.statusLabel}
                  </strong>
                </div>

                <button
                  type="button"
                  onClick={() => handleNavigateToModule(phase.moduleKey)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-400/20 cursor-pointer"
                >
                  {phase.moduleKey === 'resume' && <FileText className="w-4 h-4 text-slate-950" />}
                  {phase.moduleKey === 'aptitude' && <Brain className="w-4 h-4 text-slate-950" />}
                  {phase.moduleKey === 'coding' && <Code className="w-4 h-4 text-slate-950" />}
                  {phase.moduleKey === 'communication' && <MessageSquare className="w-4 h-4 text-slate-950" />}
                  {phase.moduleKey === 'interview' && <Video className="w-4 h-4 text-slate-950" />}
                  <span>{phase.actionLabel}</span>
                  <ChevronRight className="w-4 h-4 text-slate-950" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: TODAY'S GOALS + CURRENT DAY-WISE SESSION */}
      <div className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-700/80 bg-slate-900/90 backdrop-blur-2xl shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>{currentDayName} Focus</span>
              </span>
              <span className="text-xs font-bold text-slate-400">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-white font-['Space_Grotesk']">
              Today's Goals & Practice Tasks
            </h3>
          </div>

          <span className="text-xs font-extrabold text-cyan-300 font-mono bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            {todayGoalsCompletedCount + (isTodaySessionCompleted ? 1 : 0)} / {roadmapData.todayGoals.length + 1} Done
          </span>
        </div>

        {/* ALL TODAY'S GOALS & TODAY'S SESSION COMPLETED CELEBRATION */}
        {isAllTodayTasksAndSessionCompleted ? (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-teal-900/80 to-slate-950 border border-emerald-500/50 space-y-3 text-center animate-in fade-in">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
              <PartyPopper className="w-6 h-6 text-emerald-400 animate-bounce" />
            </div>
            <h4 className="text-lg font-black text-white font-['Space_Grotesk']">
              Today is Completed 🎉
            </h4>
            <p className="text-xs sm:text-sm text-emerald-200 font-extrabold max-w-md mx-auto leading-relaxed">
              Today is completed. Great job! Come back tomorrow for your next preparation plan.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 1. TODAY'S GOALS */}
            <div className="space-y-3 p-5 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h4 className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider flex items-center gap-2 font-['Space_Grotesk']">
                  <CheckSquare className="w-4 h-4 text-cyan-400" />
                  <span>Today's Goals</span>
                </h4>
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {todayGoalsCompletedCount}/{roadmapData.todayGoals.length}
                </span>
              </div>

              <div className="space-y-2">
                {roadmapData.todayGoals.map((g) => (
                  <div
                    key={g.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                      g.status === 'completed'
                        ? 'bg-slate-900/50 border-emerald-500/30 text-slate-400'
                        : 'bg-slate-900 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleToggleTodayGoal(g.id)}
                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                          g.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-700 hover:border-cyan-400'
                        }`}
                      >
                        {g.status === 'completed' && <Check className="w-3 h-3" />}
                      </button>
                      <span className={`text-xs font-bold ${g.status === 'completed' ? 'line-through text-slate-500' : ''}`}>
                        {g.goalTitle}
                      </span>
                    </div>

                    {g.status === 'completed' ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Completed ✓
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleNavigateToModule(g.moduleKey)}
                        className="text-[10px] font-black text-cyan-300 hover:text-cyan-200 cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <span>{g.status === 'in_progress' ? 'Continue' : 'Start'}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 2. TODAY'S DYNAMIC SESSION */}
            {roadmapData.todaySession && (
              <div className="space-y-3 p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950/40 to-slate-950 border border-cyan-500/30 shadow-lg relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <h4 className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider flex items-center gap-2 font-['Space_Grotesk']">
                      <BookOpen className="w-4 h-4 text-cyan-400" />
                      <span>📘 {currentDayName} Session</span>
                    </h4>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      isTodaySessionCompleted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : roadmapData.todaySession.status === 'in_progress' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}>
                      {isTodaySessionCompleted ? 'Completed ✓' : roadmapData.todaySession.status === 'in_progress' ? 'In Progress' : 'Current Focus'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h5 className="text-sm font-extrabold text-white">
                      {roadmapData.todaySession.moduleName} Practice
                    </h5>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed">
                      {roadmapData.todaySession.taskDetails}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Estimated ~30 min</span>
                  </div>

                  {isTodaySessionCompleted ? (
                    <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>✓ {currentDayName} Session Completed</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartTodaySession}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 hover:to-teal-200 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-cyan-400/20 cursor-pointer"
                    >
                      <span>{roadmapData.todaySession.status === 'in_progress' ? `Continue ${currentDayName} Session` : `Start ${currentDayName} Session`}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* SECTION 5: OVERALL PROGRESS & 3D ANIMATED PLACEMENT READINESS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* OVERALL PROGRESS CARD */}
        <div className="glass-card rounded-3xl p-6 border border-slate-700/80 bg-slate-900/90 backdrop-blur-2xl shadow-xl space-y-4">
          <div className="space-y-1 border-b border-slate-800 pb-3">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2 font-['Space_Grotesk']">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <span>Overall Progress</span>
            </h3>
            <p className="text-xs text-slate-400">
              Real module accuracy & completion progress calculated strictly from your application activity.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Overall Preparation Progress', val: readinessScore.overall },
              { label: 'Resume Builder & ATS Progress', val: readinessScore.resume },
              { label: 'Aptitude Practice Progress', val: readinessScore.aptitude },
              { label: 'Coding Practice Accuracy', val: readinessScore.coding },
              { label: 'Communication Hub Progress', val: readinessScore.communication },
              { label: 'AI Mock Interview Score', val: readinessScore.interview }
            ].map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300">{item.label}</span>
                  <span className="font-mono text-cyan-400">
                    {item.val > 0 ? `${item.val}%` : 'Not Started'}
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.val}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3D ANIMATED PLACEMENT READINESS CARD */}
        <div className="glass-card rounded-3xl p-6 border border-slate-700/80 bg-slate-900/90 backdrop-blur-2xl shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="space-y-1 border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2 font-['Space_Grotesk']">
                <Award className="w-5 h-5 text-amber-400" />
                <span>Placement Readiness</span>
              </h3>
              <p className="text-xs text-slate-400">
                Real readiness score calculated strictly from your application activity.
              </p>
            </div>

            {/* 3D ANIMATED PROGRESS CIRCLE */}
            <div className="flex items-center justify-center p-4">
              <div className="relative w-36 h-36 flex items-center justify-center group">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/30 via-emerald-500/20 to-purple-500/30 blur-xl group-hover:scale-110 transition-all duration-700 animate-pulse pointer-events-none" />
                
                <div className="absolute inset-1 rounded-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-[2px] shadow-[inset_0_2px_10px_rgba(255,255,255,0.1),0_10px_25px_rgba(0,0,0,0.5)]">
                  <div className="w-full h-full rounded-full bg-slate-950/90 backdrop-blur-md" />
                </div>

                <svg className="w-full h-full transform -rotate-90 relative z-10 drop-shadow-[0_4px_12px_rgba(52,211,153,0.3)]" viewBox="0 0 40 40">
                  <circle
                    cx="20"
                    cy="20"
                    r="15.9155"
                    className="text-slate-800/80"
                    strokeWidth="3.2"
                    stroke="currentColor"
                    fill="none"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="15.9155"
                    className="text-emerald-400 transition-all duration-1000 ease-out"
                    strokeDasharray={`${roadmapData.overallProgressScore}, 100`}
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                  />
                </svg>

                <div className="absolute z-20 flex flex-col items-center justify-center text-center">
                  <span className="font-black text-2xl text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-emerald-300 font-mono tracking-tight drop-shadow-md">
                    {roadmapData.hasRecordedActivity ? `${roadmapData.overallProgressScore}%` : '0%'}
                  </span>
                  <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider font-sans">Readiness</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-center font-medium text-slate-300">
              {roadmapData.hasRecordedActivity
                ? readinessScore.overall >= 80
                  ? '🎉 Outstanding! Your real performance data confirms high placement readiness.'
                  : 'Continue completing Today\'s Goals & Sessions in Coding, Aptitude & Mock Interviews to boost your placement readiness score.'
                : 'Not Started — Complete practice sessions in app modules to build your performance data.'}
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
