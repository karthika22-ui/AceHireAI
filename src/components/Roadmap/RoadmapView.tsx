import React, { useState, useEffect } from 'react';
import {
  Map,
  Sparkles,
  CheckCircle2,
  Clock,
  Calendar,
  ArrowRight,
  Flame,
  LogOut,
  Target,
  Bot,
  Lock,
  PlayCircle,
  TrendingUp,
  Award,
  BookOpen,
  ChevronRight,
  Check,
  Zap,
  Brain,
  Edit3,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SessionResumeModal } from '../Common/SessionResumeModal';

export type UserLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type DailyTime = '30 min' | '1 hour' | '2 hours' | '3+ hours';
export type TimeFilter = 'All' | 'Daily' | 'Weekly' | 'Monthly';

interface RoadmapTask {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  period: TimeFilter;
}

interface RoadmapStage {
  id: string;
  topic: string;
  description: string;
  status: 'Completed' | 'Current' | 'Locked';
  progress: number;
  estimatedHours: number;
  tasks: RoadmapTask[];
}

const LOCAL_STORAGE_KEY = 'acehire_ai_roadmap_state_v3';

// Helper to generate dynamic roadmap stages for ANY entered career goal
function generateDynamicRoadmapStages(
  goalText: string,
  level: UserLevel,
  dailyTime: DailyTime
): RoadmapStage[] {
  const goal = goalText.trim() || 'Software Engineer';
  const gLower = goal.toLowerCase();

  let stageTemplates: { topic: string; description: string; hours: number; taskTitles: string[] }[] = [];

  if (gLower.includes('data scientist') || gLower.includes('data science')) {
    stageTemplates = [
      {
        topic: 'Python Programming & Math Foundations',
        description: 'Linear Algebra, Calculus, Statistics, NumPy, and Vectorized operations.',
        hours: 25,
        taskTitles: ['Master NumPy Matrix Operations', 'Descriptive & Inferential Statistics', 'Probability Distribution & Hypothesis Testing']
      },
      {
        topic: 'Data Wrangling & Exploratory Analysis (EDA)',
        description: 'Pandas DataFrames, data cleaning, feature engineering, and Matplotlib visualization.',
        hours: 35,
        taskTitles: ['Pandas Data Cleaning & Imputation', 'Exploratory Data Analysis Plots', 'Feature Scaling & One-Hot Encoding']
      },
      {
        topic: 'Machine Learning Algorithms & Scikit-Learn',
        description: 'Supervised and Unsupervised Learning: Regression, Random Forests, XGBoost, and Clustering.',
        hours: 45,
        taskTitles: ['Train Linear & Logistic Regression Models', 'Build Random Forest & XGBoost Classifiers', 'K-Means Clustering & PCA Analysis']
      },
      {
        topic: 'Deep Learning & Neural Networks',
        description: 'PyTorch / TensorFlow, Neural Network Architectures, and Model Tuning.',
        hours: 50,
        taskTitles: ['Build Neural Network in PyTorch', 'Hyperparameter Tuning & Cross Validation']
      },
      {
        topic: 'Model Deployment & Portfolio Case Studies',
        description: 'Deploy ML models using FastAPI, Streamlit, and Docker on Cloud platforms.',
        hours: 30,
        taskTitles: ['Build Streamlit Interactive ML Web App', 'Deploy ML Model API with FastAPI & Docker']
      }
    ];
  } else if (gLower.includes('cyber') || gLower.includes('security')) {
    stageTemplates = [
      {
        topic: 'Networking & Linux Fundamentals',
        description: 'Master TCP/IP protocols, Linux CLI commands, and network architecture.',
        hours: 20,
        taskTitles: ['Learn TCP/IP & Subnetting Basics', 'Master Linux Terminal Commands', 'Configure Wireshark Packet Inspection']
      },
      {
        topic: 'Ethical Hacking & Vulnerability Assessment',
        description: 'Understand OWASP Top 10, Nmap port scanning, and vulnerability auditing.',
        hours: 30,
        taskTitles: ['OWASP Top 10 Web Vulnerabilities', 'Nmap Network Scanning & Recon', 'Burp Suite Proxy Basics']
      },
      {
        topic: 'Cryptography & Security Protocols',
        description: 'Symmetric/Asymmetric Encryption, SSL/TLS, and PKI infrastructure.',
        hours: 25,
        taskTitles: ['AES vs RSA Encryption Principles', 'SSL/TLS Handshake & Certificates']
      },
      {
        topic: 'Penetration Testing & SIEM Tools',
        description: 'Hands-on Metasploit, Snort IDS, and log analysis in Splunk.',
        hours: 40,
        taskTitles: ['Metasploit Exploitation Basics', 'Analyze Security Logs in Splunk']
      },
      {
        topic: 'Security Portfolio & Certification Prep',
        description: 'Build security audit reports and prepare for CompTIA Security+ / CEH.',
        hours: 35,
        taskTitles: ['Complete Security Audit Case Study', 'CompTIA Security+ Mock Exam Practice']
      }
    ];
  } else if (gLower.includes('data analyst')) {
    stageTemplates = [
      {
        topic: 'Excel & Data Fundamentals',
        description: 'Advanced Excel formulas, Pivot tables, VLOOKUP/XLOOKUP, and data hygiene.',
        hours: 20,
        taskTitles: ['Advanced Pivot Tables & Slicers', 'Excel XLOOKUP & Data Validation']
      },
      {
        topic: 'SQL Querying for Data Analytics',
        description: 'Complex SQL joins, Group By, Window Functions (ROW_NUMBER, RANK), and aggregations.',
        hours: 30,
        taskTitles: ['Master SQL Window Functions', 'Write Analytical Subqueries & CTEs']
      },
      {
        topic: 'PowerBI / Tableau Visual Analytics',
        description: 'Interactive dashboard creation, DAX measures, and stakeholder storytelling.',
        hours: 25,
        taskTitles: ['Create Interactive PowerBI Dashboard', 'Build DAX Calculated Measures']
      },
      {
        topic: 'Python for Data Analysis',
        description: 'Pandas, NumPy, and statistical hypothesis testing for business insight.',
        hours: 30,
        taskTitles: ['Perform Statistical Hypothesis Testing', 'Automate Data Extraction Scripts']
      }
    ];
  } else if (gLower.includes('ui') || gLower.includes('ux') || gLower.includes('design')) {
    stageTemplates = [
      {
        topic: 'UX Design Principles & Research',
        description: 'Understand user research, personas, wireframing, and Information Architecture.',
        hours: 20,
        taskTitles: ['Conduct User Interviews & Personas', 'Information Architecture & Flow Mapping']
      },
      {
        topic: 'Figma Mastery & Design Systems',
        description: 'Master Auto-Layout, Constraints, Component Variants, and Design Tokens in Figma.',
        hours: 30,
        taskTitles: ['Figma Auto-Layout & Constraints Mastery', 'Create Scalable Component Systems']
      },
      {
        topic: 'High-Fidelity UI & Responsive Layouts',
        description: 'Color theory, Typography hierarchy, Accessibility (WCAG), and responsive breakpoints.',
        hours: 25,
        taskTitles: ['Apply WCAG Color Contrast & Accessibility', 'Design Mobile & Desktop Breakpoints']
      },
      {
        topic: 'Interactive Prototyping & Usability Testing',
        description: 'Build interactive prototypes and conduct usability testing sessions.',
        hours: 25,
        taskTitles: ['Build Interactive Micro-Animations in Figma', 'Conduct Usability Test Sessions']
      }
    ];
  } else {
    stageTemplates = [
      {
        topic: `Foundations of ${goal}`,
        description: `Master core concepts, terminology, and essential tools required for ${goal}.`,
        hours: 25,
        taskTitles: [`Learn Fundamental Concepts for ${goal}`, `Set Up Development Environment & Tools`, `Build First Starter Exercise`]
      },
      {
        topic: `Core Concepts & Hands-on Practice`,
        description: `Deep-dive into primary frameworks, libraries, and practical implementation patterns.`,
        hours: 35,
        taskTitles: [`Practical Hands-on Module for ${goal}`, `Solve 3 Guided Practice Exercises`, `Understand Architecture & State Flow`]
      },
      {
        topic: `Advanced Architecture & Tooling`,
        description: `Explore production-level architecture, performance tuning, and design patterns.`,
        hours: 40,
        taskTitles: [`Implement Scalable Architecture Patterns`, `Optimize Performance & Code Quality`]
      },
      {
        topic: `Portfolio Projects & Real-World Capstone`,
        description: `Construct and deploy production-ready projects to showcase to employers.`,
        hours: 45,
        taskTitles: [`Build Portfolio Project for ${goal}`, `Deploy App to Production Platform`]
      },
      {
        topic: `Placement & Technical Interview Prep`,
        description: `Prepare for technical interview rounds, system design, and resume alignment.`,
        hours: 30,
        taskTitles: [`Review Top Technical Interview Questions for ${goal}`, `Conduct Mock Technical Interview Round`]
      }
    ];
  }

  return stageTemplates.map((stg, sIdx) => {
    const isFirst = sIdx === 0;
    const isSecond = sIdx === 1;

    let status: 'Completed' | 'Current' | 'Locked' = 'Locked';
    let progress = 0;

    if (level === 'Intermediate' && isFirst) {
      status = 'Completed';
      progress = 100;
    } else if (level === 'Advanced' && (isFirst || isSecond)) {
      status = 'Completed';
      progress = 100;
    } else if (isFirst || (level === 'Intermediate' && isSecond) || (level === 'Advanced' && sIdx === 2)) {
      status = 'Current';
      progress = level === 'Beginner' ? 35 : 50;
    }

    return {
      id: `stg-${sIdx + 1}`,
      topic: stg.topic,
      description: stg.description,
      status: status,
      progress: progress,
      estimatedHours: stg.hours,
      tasks: stg.taskTitles.map((title, tIdx) => ({
        id: `task-${sIdx + 1}-${tIdx + 1}`,
        title: title,
        duration: dailyTime === '30 min' ? '30 min' : dailyTime === '1 hour' ? '45 min' : '60 min',
        completed: status === 'Completed' || (status === 'Current' && tIdx === 0),
        period: (tIdx % 2 === 0 ? 'Daily' : 'Weekly') as TimeFilter
      }))
    };
  });
}

export const RoadmapView: React.FC = () => {
  const { setActiveTab, recordActivity } = useApp();

  // Mode: 'initial' | 'loading' | 'generated'
  const [screenMode, setScreenMode] = useState<'initial' | 'loading' | 'generated'>('initial');

  // Single Free-Text Career Goal Input (NO Predefined buttons)
  const [customGoalInput, setCustomGoalInput] = useState<string>('');
  const [userLevel, setUserLevel] = useState<UserLevel>('Beginner');
  const [dailyTime, setDailyTime] = useState<DailyTime>('1 hour');

  // Generated Roadmap State
  const [stages, setStages] = useState<RoadmapStage[]>([]);
  const [selectedStage, setSelectedStage] = useState<RoadmapStage | null>(null);

  // Resume Modal
  const [showRoadmapModal, setShowRoadmapModal] = useState<boolean>(false);

  // Load persisted state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.stages && parsed.stages.length > 0) {
          setCustomGoalInput(parsed.customGoalInput || '');
          setUserLevel(parsed.userLevel || 'Beginner');
          setDailyTime(parsed.dailyTime || '1 hour');
          setStages(parsed.stages);
          setScreenMode('generated');
        }
      }
    } catch (e) {
      console.warn('Could not load saved roadmap state:', e);
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    if (screenMode === 'generated' && stages.length > 0) {
      try {
        const payload = {
          customGoalInput,
          userLevel,
          dailyTime,
          stages
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
      } catch (e) {
        console.warn('Could not save roadmap state:', e);
      }
    }
  }, [screenMode, stages, customGoalInput, userLevel, dailyTime]);

  const activeGoalName = customGoalInput.trim() || 'Software Engineer';

  const handleExitToDashboard = () => {
    setActiveTab('home');
  };

  // Generate Personalized AI Roadmap with 2-second loading animation
  const handleGenerateRoadmap = () => {
    setScreenMode('loading');
    
    setTimeout(() => {
      const generatedStages = generateDynamicRoadmapStages(activeGoalName, userLevel, dailyTime);
      setStages(generatedStages);
      setScreenMode('generated');
      recordActivity(`Generated AI Roadmap for ${activeGoalName}`, 'Roadmap', 'In Progress', 'roadmap');
    }, 2000);
  };

  // Toggle task completion
  const handleToggleTask = (stageId: string, taskId: string) => {
    setStages((prevStages) => {
      const updated = prevStages.map((stage) => {
        if (stage.id !== stageId) return stage;

        const updatedTasks = stage.tasks.map((t) =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        );

        const completedCount = updatedTasks.filter((t) => t.completed).length;
        const calcProgress = Math.round((completedCount / updatedTasks.length) * 100);

        let newStatus: 'Completed' | 'Current' | 'Locked' = stage.status;
        if (calcProgress === 100) newStatus = 'Completed';
        else if (calcProgress > 0 || stage.status === 'Current') newStatus = 'Current';

        return {
          ...stage,
          progress: calcProgress,
          status: newStatus,
          tasks: updatedTasks
        };
      });

      // Unlock next stage automatically when previous reaches 100%
      for (let i = 0; i < updated.length - 1; i++) {
        if (updated[i].status === 'Completed' && updated[i + 1].status === 'Locked') {
          updated[i + 1].status = 'Current';
        }
      }

      return updated;
    });
  };

  // Stats
  const allTasks = stages.flatMap((s) => s.tasks);
  const completedTasksCount = allTasks.filter((t) => t.completed).length;
  const overallProgress = allTasks.length > 0 ? Math.round((completedTasksCount / allTasks.length) * 100) : 0;
  const currentStageObj = stages.find((s) => s.status === 'Current') || stages[0] || null;
  const completedStagesCount = stages.filter((s) => s.status === 'Completed').length;
  const totalHours = stages.reduce((acc, s) => acc + s.estimatedHours, 0);

  const todayTasks = currentStageObj ? currentStageObj.tasks.filter((t) => !t.completed) : [];

  const getGoalSpecificAIInsight = () => {
    if (!activeGoalName) return 'Focus on building strong core fundamentals first.';
    
    if (completedStagesCount === 0) {
      return `For ${activeGoalName}, master "${stages[0]?.topic || 'core concepts'}" first. Building foundational skills will accelerate your learning path.`;
    }
    if (currentStageObj) {
      return `You're currently mastering "${currentStageObj.topic}". Completing today's tasks will boost your ${activeGoalName} readiness to ${Math.min(100, overallProgress + 15)}%!`;
    }
    return `Outstanding! You have completed all key modules for ${activeGoalName}. Prepare for technical placement interviews!`;
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-6 max-w-5xl mx-auto py-2 px-4 sm:px-6 relative animate-in fade-in duration-300">
      
      {/* Session Resume Modal */}
      <SessionResumeModal
        isOpen={showRoadmapModal}
        moduleName="AI Learning Roadmap"
        progressText="Ongoing roadmap session active."
        onContinue={() => setShowRoadmapModal(false)}
        onExit={() => setShowRoadmapModal(false)}
      />

      {/* Ambient Lighting Background Glows */}
      <div className="absolute -top-24 -left-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none dark:opacity-100 opacity-25" />
      <div className="absolute -bottom-24 -right-20 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none dark:opacity-100 opacity-25" />

      {/* ========================================================================= */}
      {/* SCREEN MODE 1: INITIAL GOAL SELECTION LANDING SCREEN */}
      {/* ========================================================================= */}
      {screenMode === 'initial' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          <div className="animated-border-glow-wrapper">
            <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-blue-600 via-indigo-800 to-purple-900 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-950 p-6 sm:p-9 text-white border-0 shadow-2xl">
              <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                
                {/* Left Column: Form & Inputs */}
                <div className="lg:col-span-7 space-y-6">
                  
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-cyan-200 text-xs font-bold backdrop-blur-md">
                      <Brain className="w-4 h-4 text-cyan-300" />
                      <span>AI Learning Roadmap Engine</span>
                    </div>

                    <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-['Space_Grotesk'] text-white leading-tight">
                      🧠 AI Learning Roadmap
                    </h1>
                    <p className="text-sm sm:text-base text-slate-100 dark:text-slate-300 font-medium leading-relaxed">
                      Enter your goal. We'll build your personalized learning journey.
                    </p>
                  </div>

                  {/* Clean Text Input for ANY Career Goal (No predefined buttons) */}
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-cyan-200 block uppercase tracking-wider">
                      Enter Career Goal
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={customGoalInput}
                        onChange={(e) => setCustomGoalInput(e.target.value)}
                        placeholder="Enter your career goal (e.g., Data Scientist, UI/UX Designer, Cloud Engineer...)"
                        className="w-full p-4 pr-12 rounded-2xl bg-white/10 dark:bg-slate-950/80 border border-white/25 dark:border-slate-800 text-white placeholder-slate-300 dark:placeholder-slate-500 text-xs sm:text-sm font-semibold focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 backdrop-blur-xl transition-all"
                      />
                      <Sparkles className="w-5 h-5 text-cyan-300 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Balanced 2-Column Selectors: Skill Level & Daily Study Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Skill Level */}
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-slate-200 block uppercase tracking-wider">
                        Skill Level
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['Beginner', 'Intermediate', 'Advanced'] as UserLevel[]).map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setUserLevel(lvl)}
                            className={`py-2.5 px-2 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer text-center ${
                              userLevel === lvl
                                ? 'bg-white text-slate-900 font-black shadow-md scale-[1.02]'
                                : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Daily Study Time */}
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-slate-200 block uppercase tracking-wider">
                        Daily Study Time
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(['30 min', '1 hour', '2 hours', '3+ hours'] as DailyTime[]).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setDailyTime(t)}
                            className={`py-2.5 px-2 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer text-center ${
                              dailyTime === t
                                ? 'bg-cyan-400 text-slate-950 font-black shadow-md scale-[1.02]'
                                : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                            }`}
                          >
                            ⏱️ {t}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Primary CTA Button */}
                  <button
                    type="button"
                    onClick={handleGenerateRoadmap}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-cyan-400/25 transition-all duration-300 hover:scale-[1.01] active:scale-98 cursor-pointer"
                  >
                    <Sparkles className="w-5 h-5 text-slate-950 animate-spin [animation-duration:4s]" />
                    <span>✨ Generate My AI Roadmap</span>
                  </button>

                </div>

                {/* Right Column: HIGHLIGHTED PROFESSIONAL AI CARD (Brighter Accent Color) */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center">
                  <div className="relative w-full max-w-sm p-6 rounded-3xl bg-slate-900/90 dark:bg-slate-950/90 border border-cyan-400/40 shadow-[0_0_30px_rgba(56,189,248,0.25)] space-y-5 text-center relative overflow-hidden">
                    
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-500 p-0.5 shadow-lg flex items-center justify-center">
                      <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-cyan-300">
                        <Bot className="w-10 h-10 animate-pulse" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                        🤖 AI Roadmap Insight
                      </span>
                      <h3 className="text-base sm:text-lg font-extrabold text-white font-['Space_Grotesk'] pt-1">
                        {activeGoalName}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        Enter any career goal. Our AI generates tailored stages, skill requirements, and milestones optimized for your target.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-left pt-2 border-t border-slate-800 text-[11px] font-extrabold text-cyan-300">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Dynamic Modules</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Adaptive Tasks</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN MODE 2: POLISHED 2-SECOND LOADING ANIMATION */}
      {/* ========================================================================= */}
      {screenMode === 'loading' && (
        <div className="min-h-[400px] flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-300">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 border-t-cyan-400 animate-spin" />
            <Brain className="w-10 h-10 text-cyan-300 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
              Building your personalized roadmap...
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">
              Structuring stages, topics, and daily milestones for "{activeGoalName}".
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN MODE 3: GENERATED PERSONALIZED ROADMAP JOURNEY */}
      {/* ========================================================================= */}
      {screenMode === 'generated' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* TARGET GOAL HERO HEADER */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-purple-500/20 bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-cyan-400 text-xs font-bold">
                <Target className="w-4 h-4" />
                <span>Selected Career Goal</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk'] flex items-center gap-2">
                🎯 {activeGoalName}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Skill Level: <strong>{userLevel}</strong> • Daily Time: <strong>{dailyTime}</strong> • Estimated Duration: <strong>~{totalHours} Hours</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setScreenMode('initial')}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-extrabold flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-blue-500" />
                <span>Change Goal / Level</span>
              </button>

              <button
                onClick={handleExitToDashboard}
                className="px-3.5 py-2.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit</span>
              </button>
            </div>
          </div>

          {/* ROADMAP OVERVIEW STATS & AI INSIGHT */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Overall Roadmap Progress */}
            <div className="md:col-span-2 glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                    Overall Roadmap Progress
                  </h3>
                </div>
                <span className="text-xl font-black text-blue-600 dark:text-cyan-400 font-mono">
                  {overallProgress}%
                </span>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-300 dark:border-slate-700">
                <div
                  className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 block text-[10px] font-bold">Completed Modules</span>
                  <strong className="text-emerald-500 text-xs font-black">{completedStagesCount} / {stages.length}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 block text-[10px] font-bold">Current Module</span>
                  <strong className="text-blue-500 text-xs font-extrabold truncate block">{currentStageObj ? currentStageObj.topic.split(' ')[0] : 'None'}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 block text-[10px] font-bold">Remaining Modules</span>
                  <strong className="text-purple-500 text-xs font-black">{stages.length - completedStagesCount}</strong>
                </div>
              </div>
            </div>

            {/* HIGHLIGHTED AI INSIGHT CARD */}
            <div className="glass-card rounded-3xl p-5 border border-purple-500/30 bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl shadow-xl flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-extrabold text-xs">
                  <Bot className="w-4 h-4" />
                  <span>🤖 AI Insight ({activeGoalName})</span>
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                  "{getGoalSpecificAIInsight()}"
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>Readiness Level:</span>
                <span className="text-emerald-500 font-extrabold">{Math.min(100, overallProgress + 15)}% Job Ready</span>
              </div>
            </div>
          </div>

          {/* CURRENT MODULE CARD */}
          {currentStageObj && (
            <div className="glass-card rounded-3xl p-5 sm:p-6 border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 dark:bg-slate-900/90 backdrop-blur-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-600 dark:text-cyan-300 text-[11px] font-extrabold">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Current Module (Learning Now)</span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                  {currentStageObj.topic}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {currentStageObj.description}
                </p>

                <div className="flex items-center gap-3 pt-1">
                  <div className="w-40 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${currentStageObj.progress}%` }} />
                  </div>
                  <span className="text-xs font-black text-blue-600 dark:text-cyan-400 font-mono">
                    {currentStageObj.progress}%
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStage(currentStageObj)}
                className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer shrink-0"
              >
                <span>View Tasks</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* PERSONALIZED ROADMAP NODES */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 font-['Space_Grotesk']">
                  <Map className="w-6 h-6 text-blue-500" />
                  <span>Personalized Roadmap Nodes</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Click any stage node to view tasks and detailed learning content.
                </p>
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20">
                {stages.length} Connected Stages
              </span>
            </div>

            <div className="relative space-y-4">
              {stages.map((stage, idx) => {
                const isCompleted = stage.status === 'Completed';
                const isCurrent = stage.status === 'Current';

                return (
                  <div key={stage.id} className="relative">
                    {idx < stages.length - 1 && (
                      <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800 z-0" />
                    )}

                    <div
                      onClick={() => setSelectedStage(stage)}
                      className={`relative z-10 p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-500/10 dark:bg-blue-500/15 shadow-xl shadow-blue-500/10 scale-[1.01]'
                          : isCompleted
                          ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10'
                          : 'border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-extrabold text-sm shadow-md transition-transform group-hover:scale-110 ${
                            isCompleted
                              ? 'bg-emerald-500 text-white'
                              : isCurrent
                              ? 'bg-blue-600 text-white ring-4 ring-blue-500/20'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="w-5 h-5" />
                          ) : isCurrent ? (
                            <PlayCircle className="w-5 h-5" />
                          ) : (
                            <Lock className="w-4 h-4" />
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isCompleted
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                  : isCurrent
                                  ? 'bg-blue-500/20 text-blue-600 dark:text-cyan-400'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                              }`}
                            >
                              Stage {idx + 1} • {stage.status}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ~{stage.estimatedHours} Hours
                            </span>
                          </div>

                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                            {stage.topic}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                            {stage.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200 dark:border-slate-800">
                        <div className="text-right space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">
                            Stage Progress
                          </span>
                          <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                            {stage.progress}%
                          </span>
                        </div>

                        <button
                          type="button"
                          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all ${
                            isCurrent
                              ? 'bg-blue-600 text-white shadow-md'
                              : isCompleted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <span>View Tasks</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TODAY'S LEARNING PLAN */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 font-['Space_Grotesk']">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <span>Today's Learning Plan ({currentStageObj ? currentStageObj.topic : 'Current Module'})</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Complete these tasks today to advance your roadmap progress.
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {todayTasks.length} Tasks Pending
              </span>
            </div>

            <div className="space-y-2.5">
              {todayTasks.length > 0 ? (
                todayTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => currentStageObj && handleToggleTask(currentStageObj.id, t.id)}
                    className="p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-4 bg-slate-50/80 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 hover:border-blue-400"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0" />
                      <div>
                        <span className="text-[10px] font-black uppercase text-blue-500 block">
                          {currentStageObj?.topic}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {t.title}
                        </h4>
                      </div>
                    </div>

                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{t.duration}</span>
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-between">
                  <span>🎉 All tasks for today's active module are completed!</span>
                  <button
                    type="button"
                    onClick={() => setScreenMode('initial')}
                    className="px-3 py-1 rounded-xl bg-emerald-600 text-white text-[11px]"
                  >
                    Unlock Next Module
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* VIEW TASKS MODAL */}
      {selectedStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card rounded-3xl p-6 max-w-xl w-full border border-blue-500/30 bg-slate-900 text-white shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                  Stage Module Details
                </span>
                <h3 className="text-lg font-extrabold text-white font-['Space_Grotesk']">
                  {selectedStage.topic}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStage(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              {selectedStage.description}
            </p>

            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Module Tasks ({selectedStage.tasks.filter((t) => t.completed).length} / {selectedStage.tasks.length} Done)
              </h4>

              <div className="space-y-2">
                {selectedStage.tasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleToggleTask(selectedStage.id, t.id)}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 cursor-pointer hover:border-blue-500/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          t.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-700'
                        }`}
                      >
                        {t.completed && <Check className="w-3 h-3" />}
                      </div>
                      <span className={`text-xs font-semibold ${t.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {t.title}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono">
                      {t.duration}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedStage(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-extrabold text-slate-300"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedStage(null);
                  if (selectedStage.topic.includes('DSA') || selectedStage.topic.includes('Algorithms')) {
                    setActiveTab('coding');
                  } else if (selectedStage.topic.includes('Interview')) {
                    setActiveTab('interview');
                  } else {
                    setActiveTab('aptitude');
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-blue-600/30"
              >
                <span>Start Learning</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RoadmapView;
