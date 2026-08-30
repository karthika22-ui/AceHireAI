import React, { useState, useEffect, useMemo } from 'react';
import {
  Map,
  Sparkles,
  CheckCircle2,
  Calendar,
  Target,
  Bot,
  Award,
  BookOpen,
  ChevronRight,
  Check,
  Brain,
  X,
  RefreshCw,
  AlertCircle,
  Code,
  FileText,
  MessageSquare,
  Video,
  CheckSquare,
  LayoutDashboard,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { useApp, ActiveTab } from '../../context/AppContext';
import { SupabaseService } from '../../services/supabaseClient';

export type UserLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type DailyTime = '30 min' | '1 hour' | '2 hours' | '3+ hours';
export type SupportedModuleKey = 'coding' | 'aptitude' | 'communication' | 'interview' | 'resume';

export interface AppModuleSkillGap {
  moduleKey: SupportedModuleKey;
  moduleName: string;
  statusTag: 'Strong' | 'Needs Improvement' | 'Priority Improvement' | 'No Activity Yet';
  reason: string;
}

export interface AppModuleRoadmapCard {
  id: string;
  moduleKey: SupportedModuleKey;
  moduleName: string;
  priority: 'High' | 'Medium' | 'Standard';
  whyRecommended: string;
  statusLabel: string;
  progress: number;
  hasActivity: boolean;
  estimatedMinutes: string;
  actionLabel: string;
  suggestedTasks: string[];
}

export interface DailyGoalTask {
  id: string;
  taskName: string;
  estimatedTime: string;
  completed: boolean;
  moduleKey: SupportedModuleKey;
  moduleName: string;
}

export interface WeeklyScheduleDay {
  dayName: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  focusModule: string;
  moduleKey: SupportedModuleKey;
  taskDetails: string;
}

export interface RebuiltPersonalizedRoadmapState {
  customGoalInput: string;
  userLevel: UserLevel;
  dailyTime: DailyTime;
  skillGaps: AppModuleSkillGap[];
  moduleCards: AppModuleRoadmapCard[];
  todayGoals: DailyGoalTask[];
  weeklySchedule: WeeklyScheduleDay[];
  aiRecommendation: string;
  careerReadinessScore: number;
  lastUpdated: string;
}

const LOCAL_STORAGE_KEY = 'acehire_ai_roadmap_state_v7';

const CAREER_GOAL_OPTIONS = [
  'Software Developer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'AI / ML Engineer',
  'Data Analyst'
];

// Helper to analyze REAL user performance data from AppContext and prioritize the 5 REAL app modules:
// 1. Coding Practice ('coding')
// 2. Aptitude Practice ('aptitude')
// 3. Communication Hub ('communication')
// 4. AI Mock Interview ('interview')
// 5. Resume Builder & ATS ('resume')
function buildPersonalizedPlacementRoadmap(
  goalText: string,
  userLevel: UserLevel,
  dailyTime: DailyTime,
  readinessScore: { overall: number; interview: number; resume: number; coding: number; aptitude: number; communication: number },
  recentActivitiesCount: number
): {
  skillGaps: AppModuleSkillGap[];
  moduleCards: AppModuleRoadmapCard[];
  todayGoals: DailyGoalTask[];
  weeklySchedule: WeeklyScheduleDay[];
  aiRecommendation: string;
  careerReadinessScore: number;
} {
  const goal = goalText.trim() || 'Software Developer';
  const gLower = goal.toLowerCase();

  // Extract real scores (0 if no activity recorded yet)
  const codingScore = readinessScore.coding || 0;
  const aptitudeScore = readinessScore.aptitude || 0;
  const commScore = readinessScore.communication || 0;
  const interviewScore = readinessScore.interview || 0;
  const resumeScore = readinessScore.resume || 0;

  const hasAnyActivity = recentActivitiesCount > 0 || readinessScore.overall > 0;

  // 1. Calculate Real AI Skill Gap Analysis across the 5 REAL modules
  const skillGaps: AppModuleSkillGap[] = [
    {
      moduleKey: 'coding',
      moduleName: 'Coding Practice',
      statusTag: codingScore >= 75 ? 'Strong' : codingScore >= 40 ? 'Needs Improvement' : hasAnyActivity ? 'Priority Improvement' : 'No Activity Yet',
      reason: codingScore >= 75 ? 'Solid multi-language problem-solving verified' : 'Requires problem-solving practice in Java/Python/SQL'
    },
    {
      moduleKey: 'aptitude',
      moduleName: 'Aptitude Practice',
      statusTag: aptitudeScore >= 75 ? 'Strong' : aptitudeScore >= 40 ? 'Needs Improvement' : hasAnyActivity ? 'Priority Improvement' : 'No Activity Yet',
      reason: aptitudeScore >= 75 ? 'Good quantitative & logical reasoning baseline' : 'Practice Quant, Logical & Verbal test sets'
    },
    {
      moduleKey: 'communication',
      moduleName: 'Communication Hub',
      statusTag: commScore >= 75 ? 'Strong' : commScore >= 40 ? 'Needs Improvement' : hasAnyActivity ? 'Priority Improvement' : 'No Activity Yet',
      reason: commScore >= 75 ? 'Clear sentence structure & tone' : 'Refine interview grammar & tone in Communication Hub'
    },
    {
      moduleKey: 'interview',
      moduleName: 'AI Mock Interview',
      statusTag: interviewScore >= 75 ? 'Strong' : interviewScore >= 40 ? 'Needs Improvement' : hasAnyActivity ? 'Priority Improvement' : 'No Activity Yet',
      reason: interviewScore >= 75 ? 'Confident technical & HR interview responses' : 'Conduct dual-language simulated interview rounds'
    },
    {
      moduleKey: 'resume',
      moduleName: 'Resume Builder & ATS',
      statusTag: resumeScore >= 75 ? 'Strong' : resumeScore >= 40 ? 'Needs Improvement' : hasAnyActivity ? 'Priority Improvement' : 'No Activity Yet',
      reason: resumeScore >= 75 ? 'ATS score optimized for job applications' : 'Run ATS check & boost missing skills in resume'
    }
  ];

  // 2. Build Module Cards for the 5 REAL modules, ordered dynamically by AI priority
  const rawCards: AppModuleRoadmapCard[] = [
    {
      id: 'mod-coding',
      moduleKey: 'coding',
      moduleName: 'CODING PRACTICE',
      priority: (gLower.includes('backend') || gLower.includes('software') || gLower.includes('full stack') || codingScore < 50) ? 'High' : 'Medium',
      whyRecommended: `Your ${goal} role requires consistent problem solving in Java, Python, C++ & SQL.`,
      statusLabel: codingScore > 0 ? `${codingScore}% Accuracy` : 'No activity yet',
      progress: codingScore,
      hasActivity: codingScore > 0,
      estimatedMinutes: '35 mins daily',
      actionLabel: 'Continue Coding Practice',
      suggestedTasks: [
        'Solve 3 Logic Problems in Coding Practice',
        'Practice SQL JOIN Queries',
        'Review Big O Time Complexity'
      ]
    },
    {
      id: 'mod-aptitude',
      moduleKey: 'aptitude',
      moduleName: 'APTITUDE PRACTICE',
      priority: aptitudeScore < 50 ? 'High' : 'Medium',
      whyRecommended: 'Campus recruitment screening tests heavily evaluate Quantitative & Logical reasoning.',
      statusLabel: aptitudeScore > 0 ? `${aptitudeScore}% Score` : 'No activity yet',
      progress: aptitudeScore,
      hasActivity: aptitudeScore > 0,
      estimatedMinutes: '25 mins daily',
      actionLabel: 'Continue Aptitude Practice',
      suggestedTasks: [
        'Practice 15 Quantitative MCQs (Percentages & Speed)',
        'Solve 10 Logical Reasoning Puzzles',
        'Review Tanglish Step Explanations'
      ]
    },
    {
      id: 'mod-communication',
      moduleKey: 'communication',
      moduleName: 'COMMUNICATION HUB',
      priority: commScore < 50 ? 'High' : 'Standard',
      whyRecommended: 'Clear sentence structure and professional grammar are essential for clearing HR & Technical interview rounds.',
      statusLabel: commScore > 0 ? `${commScore}% Score` : 'No activity yet',
      progress: commScore,
      hasActivity: commScore > 0,
      estimatedMinutes: '15 mins daily',
      actionLabel: 'Continue Communication Hub',
      suggestedTasks: [
        'Refine 2 Interview Answers in Communication Hub',
        'Review AI Grammar Error Case Analysis'
      ]
    },
    {
      id: 'mod-interview',
      moduleKey: 'interview',
      moduleName: 'AI MOCK INTERVIEW',
      priority: (interviewScore < 50 || gLower.includes('full stack') || gLower.includes('software')) ? 'High' : 'Medium',
      whyRecommended: 'Simulate live HR & Technical interviews with instant dual-language AI feedback.',
      statusLabel: interviewScore > 0 ? `${interviewScore}% Average Score` : 'No activity yet',
      progress: interviewScore,
      hasActivity: interviewScore > 0,
      estimatedMinutes: '30 mins session',
      actionLabel: 'Continue AI Mock Interview',
      suggestedTasks: [
        'Conduct 1 Technical AI Mock Interview Session',
        'Conduct 1 HR Behavioral AI Mock Interview Session',
        'Review Dual-Language (English/Tanglish) Feedback'
      ]
    },
    {
      id: 'mod-resume',
      moduleKey: 'resume',
      moduleName: 'RESUME BUILDER & ATS',
      priority: resumeScore < 60 ? 'High' : 'Standard',
      whyRecommended: 'Ensure your resume clears automated ATS scanning filters with high keyword relevance.',
      statusLabel: resumeScore > 0 ? `${resumeScore}% ATS Score` : 'No activity yet',
      progress: resumeScore,
      hasActivity: resumeScore > 0,
      estimatedMinutes: '20 mins update',
      actionLabel: 'Continue Resume Builder',
      suggestedTasks: [
        'Run Instant ATS Resume Compatibility Check',
        'Add Missing Technical Skills to Resume',
        'Format Project Achievements'
      ]
    }
  ];

  // Sort cards so High Priority modules appear first
  const priorityWeight: Record<string, number> = { High: 1, Medium: 2, Standard: 3 };
  const moduleCards = rawCards.sort((a, b) => priorityWeight[a.priority] - priorityWeight[b.priority]);

  // 3. Generate Today's Goals based on prioritized modules
  const topModule1 = moduleCards[0];
  const topModule2 = moduleCards[1];

  const todayGoals: DailyGoalTask[] = [
    {
      id: 'tg-1',
      taskName: `Complete 1 session in ${topModule1.moduleName}`,
      estimatedTime: '30 min',
      completed: false,
      moduleKey: topModule1.moduleKey,
      moduleName: topModule1.moduleName
    },
    {
      id: 'tg-2',
      taskName: `Complete practice in ${topModule2.moduleName}`,
      estimatedTime: '20 min',
      completed: false,
      moduleKey: topModule2.moduleKey,
      moduleName: topModule2.moduleName
    },
    {
      id: 'tg-3',
      taskName: 'Refine interview answer in Communication Hub',
      estimatedTime: '15 min',
      completed: false,
      moduleKey: 'communication',
      moduleName: 'COMMUNICATION HUB'
    }
  ];

  // 4. Generate Weekly Schedule ("THIS WEEK") mapping to real modules
  const weeklySchedule: WeeklyScheduleDay[] = [
    { dayName: 'Monday', focusModule: 'Coding Practice', moduleKey: 'coding', taskDetails: 'Solve 3 Logic Problems & Array Challenges' },
    { dayName: 'Tuesday', focusModule: 'Aptitude Practice', moduleKey: 'aptitude', taskDetails: 'Practice Quantitative & Speed-Distance MCQs' },
    { dayName: 'Wednesday', focusModule: 'Communication Hub', moduleKey: 'communication', taskDetails: 'Grammar Error Analysis & Sentence Polishing' },
    { dayName: 'Thursday', focusModule: 'Coding Practice (SQL)', moduleKey: 'coding', taskDetails: 'Solve SQL Multi-Table JOIN Queries' },
    { dayName: 'Friday', focusModule: 'AI Mock Interview', moduleKey: 'interview', taskDetails: 'Conduct Technical Mock Interview Session' },
    { dayName: 'Saturday', focusModule: 'Resume Builder & ATS', moduleKey: 'resume', taskDetails: 'Run ATS Compatibility Analysis & Update Skills' },
    { dayName: 'Sunday', focusModule: 'AI Mock Interview (HR)', moduleKey: 'interview', taskDetails: 'Conduct HR Behavioral Mock Interview Session' }
  ];

  // 5. Calculate Career Readiness Score from real data
  const careerReadinessScore = readinessScore.overall;

  // 6. Contextual AI Recommendation
  let aiRecommendation = '';
  if (!hasAnyActivity) {
    aiRecommendation = `Welcome! To build your personalized ${goal} roadmap, start by practicing in Coding Practice or running an ATS check in Resume Builder.`;
  } else if (topModule1.moduleKey === 'coding') {
    aiRecommendation = `Your ${goal} target requires high coding accuracy. Priority: Complete your daily Coding Practice tasks before taking Mock Interviews.`;
  } else if (topModule1.moduleKey === 'interview') {
    aiRecommendation = `Your technical foundation is solid! Focus on AI Mock Interview sessions to polish live responses and confidence.`;
  } else {
    aiRecommendation = `Keep up the momentum! Follow Today's Goals to balance Coding, Aptitude, Communication, and Interview preparation.`;
  }

  return {
    skillGaps,
    moduleCards,
    todayGoals,
    weeklySchedule,
    aiRecommendation,
    careerReadinessScore
  };
}

export const RoadmapView: React.FC = () => {
  const { user, readinessScore, setActiveTab, recordActivity, recentActivities, addNotification } = useApp();

  // Screen modes: 'setup' | 'loading' | 'dashboard'
  const [screenMode, setScreenMode] = useState<'setup' | 'loading' | 'dashboard'>('setup');

  // Selected Inputs
  const [selectedGoal, setSelectedGoal] = useState<string>('Software Developer');
  const [customGoalInput, setCustomGoalInput] = useState<string>('');
  const [userLevel, setUserLevel] = useState<UserLevel>('Intermediate');
  const [dailyTime, setDailyTime] = useState<DailyTime>('1 hour');

  // Error States
  const [validationError, setValidationError] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Generated AI Roadmap Data
  const [roadmapData, setRoadmapData] = useState<RebuiltPersonalizedRoadmapState | null>(null);

  // Generation Loading Step State
  const [loadingStep, setLoadingStep] = useState<number>(0);

  // Load Persisted State on Mount (Safely invalidates old v5 or v6 generic CS syllabus data)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed: RebuiltPersonalizedRoadmapState = JSON.parse(saved);
        // Ensure saved data is from v7 format containing moduleCards array
        if (parsed && parsed.customGoalInput && parsed.moduleCards && parsed.moduleCards.length > 0) {
          setRoadmapData(parsed);
          setSelectedGoal(parsed.customGoalInput);
          setCustomGoalInput(parsed.customGoalInput);
          setUserLevel(parsed.userLevel || 'Intermediate');
          setDailyTime(parsed.dailyTime || '1 hour');
          setScreenMode('dashboard');
          return;
        }
      }
    } catch (e) {
      console.warn('Could not load saved v7 roadmap state:', e);
    }
    setScreenMode('setup');
  }, []);

  // Save State to localStorage and Supabase whenever roadmapData updates
  useEffect(() => {
    if (roadmapData && screenMode === 'dashboard') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(roadmapData));
        if (user?.id) {
          roadmapData.moduleCards.forEach((card) => {
            SupabaseService.saveRoadmapItem(user.id, {
              period: 'Daily',
              category: roadmapData.customGoalInput,
              title: card.moduleName,
              description: card.whyRecommended,
              completed: card.progress >= 80,
              dueDate: card.estimatedMinutes
            });
          });
        }
      } catch (e) {
        console.warn('Could not persist roadmap state:', e);
      }
    }
  }, [roadmapData, screenMode, user?.id]);

  const activeGoal = customGoalInput.trim() || selectedGoal;

  // Handle Starting Roadmap Generation
  const handleStartGeneration = () => {
    if (!activeGoal) {
      setValidationError('Please choose or enter a career goal.');
      return;
    }

    setValidationError(null);
    setGenerationError(null);
    setScreenMode('loading');
    setLoadingStep(1);

    setTimeout(() => setLoadingStep(2), 400);
    setTimeout(() => setLoadingStep(3), 800);
    setTimeout(() => setLoadingStep(4), 1200);

    setTimeout(() => {
      try {
        const generated = buildPersonalizedPlacementRoadmap(
          activeGoal,
          userLevel,
          dailyTime,
          readinessScore,
          recentActivities.length
        );

        const newState: RebuiltPersonalizedRoadmapState = {
          customGoalInput: activeGoal,
          userLevel,
          dailyTime,
          skillGaps: generated.skillGaps,
          moduleCards: generated.moduleCards,
          todayGoals: generated.todayGoals,
          weeklySchedule: generated.weeklySchedule,
          aiRecommendation: generated.aiRecommendation,
          careerReadinessScore: generated.careerReadinessScore,
          lastUpdated: new Date().toISOString()
        };

        setRoadmapData(newState);
        setScreenMode('dashboard');
        recordActivity(`Generated Personalized AI Roadmap for ${activeGoal}`, 'Roadmap', 'In Progress', 'roadmap');

        if (addNotification) {
          addNotification(
            `AI Roadmap Ready (${activeGoal})`,
            `Your placement preparation plan for "${activeGoal}" is live! Follow Today's Goals to practice.`,
            'coding'
          );
        }
      } catch (e) {
        console.error('Roadmap generation error:', e);
        setGenerationError('Unable to generate your roadmap. Please try again.');
        setScreenMode('setup');
      }
    }, 1600);
  };

  // Toggle Today's Goal Completion
  const handleToggleTodayGoal = (goalId: string) => {
    if (!roadmapData) return;

    const updatedToday = roadmapData.todayGoals.map((t) => {
      if (t.id === goalId) {
        return { ...t, completed: !t.completed };
      }
      return t;
    });

    setRoadmapData({
      ...roadmapData,
      todayGoals: updatedToday,
      lastUpdated: new Date().toISOString()
    });
  };

  // Direct Module Navigation Handler
  const handleNavigateToModule = (targetModule: ActiveTab) => {
    setActiveTab(targetModule);
  };

  const hasActivityData = recentActivities.length > 0 || readinessScore.overall > 0;

  return (
    <div className="flex-1 overflow-y-auto space-y-6 max-w-6xl mx-auto py-3 px-4 sm:px-6 relative animate-in fade-in duration-300">
      
      {/* Ambient Glows */}
      <div className="absolute -top-24 -left-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none dark:opacity-100 opacity-25" />
      <div className="absolute -bottom-24 -right-20 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none dark:opacity-100 opacity-25" />

      {/* ========================================================================= */}
      {/* MODE 1: SETUP CAREER GOAL & LEVEL (NO TARGET COMPANY) */}
      {/* ========================================================================= */}
      {screenMode === 'setup' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Header Card */}
          <div className="glass-card rounded-[28px] border border-slate-700/80 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-6 sm:p-9 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold backdrop-blur-md">
                    <Brain className="w-4 h-4 text-cyan-400" />
                    <span>Personalized Placement Preparation Engine</span>
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-['Space_Grotesk'] text-white">
                    🧠 AI Learning Roadmap
                  </h1>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('home')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shrink-0"
                >
                  <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                  <span>Back to Dashboard</span>
                </button>
              </div>

              <p className="text-xs sm:text-base text-slate-300 font-medium leading-relaxed max-w-2xl">
                Choose your career goal. Our AI analyzes your real performance in Coding Practice, Aptitude Practice, Communication Hub, Resume Builder, and AI Mock Interviews to structure your personalized placement preparation plan.
              </p>

              {generationError && (
                <div className="p-3.5 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-bold flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{generationError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartGeneration}
                    className="px-3 py-1 rounded-xl bg-red-500/30 hover:bg-red-500/40 text-white font-extrabold text-[11px] cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* 1. CHOOSE CAREER GOAL (NO TARGET COMPANY) */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <label className="text-xs font-extrabold text-cyan-300 block uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-4 h-4 text-cyan-400" />
                  <span>Choose Your Career Goal</span>
                </label>

                {/* Popular Role Chips */}
                <div className="flex flex-wrap gap-2">
                  {CAREER_GOAL_OPTIONS.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        setSelectedGoal(role);
                        setCustomGoalInput(role);
                        setValidationError(null);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                        (customGoalInput.trim() || selectedGoal) === role
                          ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 font-black shadow-lg scale-[1.02]'
                          : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700'
                      }`}
                    >
                      <span>{role}</span>
                    </button>
                  ))}
                </div>

                {/* Custom Role Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={customGoalInput}
                    onChange={(e) => {
                      setCustomGoalInput(e.target.value);
                      setSelectedGoal(e.target.value);
                      if (e.target.value.trim()) setValidationError(null);
                    }}
                    placeholder="Or enter custom goal (e.g., DevOps Engineer, Cloud Architect, Data Scientist...)"
                    className="w-full p-4 pr-12 rounded-2xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm font-semibold focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 backdrop-blur-xl transition-all"
                  />
                  <Sparkles className="w-5 h-5 text-cyan-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {validationError && (
                  <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-extrabold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span>{validationError}</span>
                  </div>
                )}
              </div>

              {/* 2. SKILL LEVEL & DAILY TIME SELECTORS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Skill Level */}
                <div className="space-y-2 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <label className="text-xs font-extrabold text-cyan-300 block uppercase tracking-wider">
                    Current Skill Level Baseline
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Beginner', 'Intermediate', 'Advanced'] as UserLevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setUserLevel(lvl)}
                        className={`py-2.5 px-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center ${
                          userLevel === lvl
                            ? 'bg-white text-slate-950 font-black shadow-md scale-[1.02]'
                            : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Daily Time */}
                <div className="space-y-2 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <label className="text-xs font-extrabold text-cyan-300 block uppercase tracking-wider">
                    Daily Study Commitment
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['30 min', '1 hour', '2 hours', '3+ hours'] as DailyTime[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setDailyTime(t)}
                        className={`py-2.5 px-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center ${
                          dailyTime === t
                            ? 'bg-cyan-400 text-slate-950 font-black shadow-md scale-[1.02]'
                            : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700'
                        }`}
                      >
                        ⏱️ {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <button
                type="button"
                onClick={handleStartGeneration}
                className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-cyan-400/20 transition-all duration-300 hover:scale-[1.01] cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-slate-950" />
                <span>Generate My AI Roadmap</span>
              </button>

            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: STEP-BY-STEP LOADING SCREEN */}
      {/* ========================================================================= */}
      {screenMode === 'loading' && (
        <div className="min-h-[460px] glass-card rounded-[28px] border border-slate-700/80 bg-slate-900/90 backdrop-blur-2xl p-8 flex flex-col items-center justify-center space-y-6 text-center shadow-2xl animate-in fade-in duration-300">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
            <div className="absolute inset-3 rounded-full border-4 border-purple-500/20 border-b-purple-400 animate-spin [animation-duration:3s]" />
            <Brain className="w-12 h-12 text-cyan-300 animate-pulse" />
          </div>

          <div className="space-y-2 max-w-md">
            <h3 className="text-xl sm:text-2xl font-extrabold text-white font-['Space_Grotesk']">
              Generating Your AI Learning Roadmap...
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              Target Role: <strong className="text-cyan-300">{activeGoal}</strong> • Daily Commitment: <strong className="text-purple-300">{dailyTime}</strong>
            </p>
          </div>

          {/* Progress Checklist */}
          <div className="w-full max-w-md bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left space-y-2.5 text-xs font-semibold">
            <div className={`flex items-center gap-2.5 transition-colors ${loadingStep >= 1 ? 'text-emerald-400 font-extrabold' : 'text-slate-500'}`}>
              {loadingStep >= 1 ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-700" />}
              <span>Analyzing your performance...</span>
            </div>

            <div className={`flex items-center gap-2.5 transition-colors ${loadingStep >= 2 ? 'text-cyan-300 font-extrabold' : 'text-slate-500'}`}>
              {loadingStep >= 2 ? <CheckCircle2 className="w-4 h-4 text-cyan-300 shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-700" />}
              <span>Finding skill gaps...</span>
            </div>

            <div className={`flex items-center gap-2.5 transition-colors ${loadingStep >= 3 ? 'text-purple-300 font-extrabold' : 'text-slate-500'}`}>
              {loadingStep >= 3 ? <CheckCircle2 className="w-4 h-4 text-purple-300 shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-700" />}
              <span>Creating your personalized roadmap...</span>
            </div>

            <div className={`flex items-center gap-2.5 transition-colors ${loadingStep >= 4 ? 'text-emerald-400 font-extrabold' : 'text-slate-500'}`}>
              {loadingStep >= 4 ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-700" />}
              <span>Preparing today's goals & weekly plan...</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: REBUILT GENERATED STANDALONE ROADMAP VIEW */}
      {/* ========================================================================= */}
      {screenMode === 'dashboard' && roadmapData && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* TOP STANDALONE HERO BAR WITH BACK TO DASHBOARD BUTTON */}
          <div className="glass-card rounded-[26px] p-6 border border-slate-700/80 bg-slate-900/90 backdrop-blur-2xl shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-cyan-300 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30">
                  Your AI Learning Roadmap
                </span>
                <span className="text-xs font-bold text-slate-400">
                  Goal: {roadmapData.customGoalInput}
                </span>
              </div>

              <h2 className="text-xl sm:text-3xl font-extrabold text-white font-['Space_Grotesk'] flex items-center gap-2">
                🎯 {roadmapData.customGoalInput} Roadmap
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                Baseline: <strong className="text-cyan-300">{roadmapData.userLevel}</strong> • Daily Commitment: <strong className="text-purple-300">{roadmapData.dailyTime}</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className="px-4 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                <span>Back to Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => setScreenMode('setup')}
                className="px-3.5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Change Goal"
              >
                <RefreshCw className="w-4 h-4 text-cyan-400" />
                <span>Re-configure</span>
              </button>
            </div>
          </div>

          {/* AI CONTEXTUAL RECOMMENDATION BANNER */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-purple-950/70 to-slate-950 border border-indigo-500/30 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 shrink-0">
                <Bot className="w-5 h-5 text-indigo-400 animate-pulse" />
              </div>
              <div>
                <strong className="text-indigo-300 block font-extrabold uppercase text-[10px] tracking-wider">AI Recommendation</strong>
                <span className="text-slate-200 font-medium">{roadmapData.aiRecommendation}</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 1: AI SKILL GAP ANALYSIS */}
          {/* ========================================================================= */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-700/80 bg-slate-900/90 backdrop-blur-2xl shadow-xl space-y-5">
            <div className="space-y-1 border-b border-slate-800 pb-3">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2 font-['Space_Grotesk']">
                <Brain className="w-5 h-5 text-cyan-400" />
                <span>AI Skill Gap Analysis</span>
              </h3>
              <p className="text-xs text-slate-400">
                Real performance categorization across the 5 practice modules based on your application activity.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
              {roadmapData.skillGaps.map((sg) => (
                <div
                  key={sg.moduleKey}
                  className={`p-4 rounded-2xl border space-y-2 transition-all ${
                    sg.statusTag === 'Strong'
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                      : sg.statusTag === 'Needs Improvement'
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                      : sg.statusTag === 'Priority Improvement'
                      ? 'bg-red-950/30 border-red-500/40 text-red-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black truncate block">{sg.moduleName}</span>
                  </div>

                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    sg.statusTag === 'Strong'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : sg.statusTag === 'Needs Improvement'
                      ? 'bg-amber-500/20 text-amber-300'
                      : sg.statusTag === 'Priority Improvement'
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {sg.statusTag === 'Strong' && '🟢 Strong'}
                    {sg.statusTag === 'Needs Improvement' && '🟡 Needs Work'}
                    {sg.statusTag === 'Priority Improvement' && '🔴 Priority'}
                    {sg.statusTag === 'No Activity Yet' && '⚪ No Activity Yet'}
                  </span>

                  <p className="text-[11px] leading-relaxed font-medium">
                    {sg.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: YOUR PERSONALIZED LEARNING ROADMAP (REAL MODULE CARDS) */}
          {/* ========================================================================= */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-700/80 bg-slate-900/90 backdrop-blur-2xl shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2 font-['Space_Grotesk']">
                  <Map className="w-5 h-5 text-cyan-400" />
                  <span>Your Personalized Learning Roadmap</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  The 5 core application practice modules prioritized dynamically according to your skill gaps.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {roadmapData.moduleCards.map((card, idx) => (
                <div
                  key={card.id}
                  className={`p-5 sm:p-6 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5 ${
                    card.priority === 'High'
                      ? 'border-cyan-400/80 bg-slate-950/90 shadow-lg shadow-cyan-400/10'
                      : 'border-slate-800 bg-slate-950/60'
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs font-black flex items-center justify-center border border-cyan-500/30">
                        {idx + 1}
                      </span>
                      <h4 className="text-base font-extrabold text-white font-['Space_Grotesk']">
                        {card.moduleName}
                      </h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        card.priority === 'High'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : card.priority === 'Medium'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {card.priority === 'High' && '🔴 High Priority'}
                        {card.priority === 'Medium' && '🟡 Medium Priority'}
                        {card.priority === 'Standard' && '🟢 Standard Priority'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-medium">
                      <strong>Why AI Recommends:</strong> "{card.whyRecommended}"
                    </p>

                    {/* Suggested Practice Tasks inside the module */}
                    <div className="pt-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Recommended Practice Topics:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {card.suggestedTasks.map((st, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300">
                            • {st}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between gap-3 shrink-0 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Current Progress</span>
                      <strong className={`text-xs font-mono font-black ${card.hasActivity ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {card.statusLabel}
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleNavigateToModule(card.moduleKey)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-400/20 cursor-pointer"
                    >
                      {card.moduleKey === 'coding' && <Code className="w-4 h-4 text-slate-950" />}
                      {card.moduleKey === 'aptitude' && <Brain className="w-4 h-4 text-slate-950" />}
                      {card.moduleKey === 'communication' && <MessageSquare className="w-4 h-4 text-slate-950" />}
                      {card.moduleKey === 'interview' && <Video className="w-4 h-4 text-slate-950" />}
                      {card.moduleKey === 'resume' && <FileText className="w-4 h-4 text-slate-950" />}
                      <span>{card.actionLabel}</span>
                      <ChevronRight className="w-4 h-4 text-slate-950" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: TODAY'S GOALS */}
          {/* ========================================================================= */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-700/80 bg-slate-900/90 backdrop-blur-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2 font-['Space_Grotesk']">
                  <CheckSquare className="w-5 h-5 text-cyan-400" />
                  <span>TODAY'S GOALS</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Actionable daily goals derived from your prioritized application roadmap.
                </p>
              </div>
              <span className="text-xs font-extrabold text-cyan-300 font-mono">
                {roadmapData.todayGoals.filter((t) => t.completed).length} / {roadmapData.todayGoals.length} Done
              </span>
            </div>

            <div className="space-y-2.5">
              {roadmapData.todayGoals.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleTodayGoal(t.id)}
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                        t.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-700 hover:border-cyan-400'
                      }`}
                    >
                      {t.completed && <Check className="w-3.5 h-3.5" />}
                    </button>

                    <div>
                      <span className="text-[10px] text-slate-400 font-mono">⏱️ {t.estimatedTime} • {t.moduleName}</span>
                      <h4 className={`text-xs font-extrabold mt-0.5 ${t.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                        {t.taskName}
                      </h4>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleNavigateToModule(t.moduleKey)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-[11px] font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ml-8 sm:ml-0"
                  >
                    <span>Start / Continue</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 4: THIS WEEK (WEEKLY PLAN) */}
          {/* ========================================================================= */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-700/80 bg-slate-900/90 backdrop-blur-2xl shadow-xl space-y-4">
            <div className="space-y-1 border-b border-slate-800 pb-3">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2 font-['Space_Grotesk']">
                <Calendar className="w-5 h-5 text-purple-400" />
                <span>THIS WEEK</span>
              </h3>
              <p className="text-xs text-slate-400">
                Weekly preparation plan structured across the 5 practice modules.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {roadmapData.weeklySchedule.map((ws) => (
                <div key={ws.dayName} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider block">
                      {ws.dayName}
                    </span>
                    <strong className="text-xs text-white block font-extrabold">{ws.focusModule}</strong>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                      {ws.taskDetails}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleNavigateToModule(ws.moduleKey)}
                    className="mt-3 w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <span>Open Module</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 5 & 6: MY PROGRESS & CAREER READINESS */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MY PROGRESS CARD */}
            <div className="glass-card rounded-3xl p-6 border border-slate-700/80 bg-slate-900/90 backdrop-blur-2xl shadow-xl space-y-4">
              <div className="space-y-1 border-b border-slate-800 pb-3">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2 font-['Space_Grotesk']">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  <span>MY PROGRESS</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Real module accuracy & completion progress calculated from your activity.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Overall Preparation Progress', val: readinessScore.overall },
                  { label: 'Coding Practice Progress', val: readinessScore.coding },
                  { label: 'Aptitude Practice Progress', val: readinessScore.aptitude },
                  { label: 'Communication Hub Progress', val: readinessScore.communication },
                  { label: 'AI Mock Interview Progress', val: readinessScore.interview },
                  { label: 'Resume Builder & ATS Progress', val: readinessScore.resume }
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-300">{item.label}</span>
                      <span className="font-mono text-cyan-400">
                        {item.val > 0 ? `${item.val}%` : 'No activity yet'}
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

            {/* CAREER READINESS CARD */}
            <div className="glass-card rounded-3xl p-6 border border-slate-700/80 bg-slate-900/90 backdrop-blur-2xl shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="space-y-1 border-b border-slate-800 pb-3">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2 font-['Space_Grotesk']">
                    <Award className="w-5 h-5 text-amber-400" />
                    <span>CAREER READINESS</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Calculated readiness based on your actual performance data.
                  </p>
                </div>

                <div className="flex items-center justify-center p-4">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path className="text-slate-800" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="text-emerald-400 transition-all duration-700" strokeDasharray={`${roadmapData.careerReadinessScore}, 100`} strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <span className="absolute font-black text-xl text-white font-mono">{roadmapData.careerReadinessScore}%</span>
                  </div>
                </div>

                <p className="text-xs text-center font-medium text-slate-300">
                  {hasActivityData
                    ? readinessScore.overall >= 80
                      ? '🎉 Outstanding! Your performance data confirms high placement readiness.'
                      : 'Continue completing Today\'s Goals in Coding, Aptitude & Mock Interviews to boost your placement readiness score.'
                    : 'Continue practicing to build enough performance data.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleNavigateToModule('interview')}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer mt-2"
              >
                <Video className="w-4 h-4 text-slate-950" />
                <span>Start AI Mock Technical & HR Interview</span>
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default RoadmapView;
