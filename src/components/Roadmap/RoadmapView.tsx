import React, { useState, useEffect } from 'react';
import {
  Map,
  Sparkles,
  CheckCircle2,
  Clock,
  Calendar,
  ArrowRight,
  ArrowLeft,
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
  X,
  RefreshCw,
  AlertCircle,
  Rocket,
  Bell,
  BellOff,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SupabaseService } from '../../services/supabaseClient';
import { SessionResumeModal } from '../Common/SessionResumeModal';

export type UserLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type DailyTime = '30 min' | '1 hour' | '2 hours' | '3+ hours';
export type TimeFilter = 'All' | 'Daily' | 'Weekly' | 'Monthly';

export interface RoadmapTask {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  period: TimeFilter;
}

export interface RoadmapStage {
  id: string;
  topic: string;
  description: string;
  status: 'Completed' | 'Current' | 'Locked';
  progress: number;
  estimatedHours: number;
  tasks: RoadmapTask[];
}

const LOCAL_STORAGE_KEY = 'acehire_ai_roadmap_state_v4';

const POPULAR_CAREER_TAGS = [
  'Software Engineer',
  'Data Scientist',
  'UI/UX Designer',
  'Cloud Engineer',
  'AI Engineer',
  'Cybersecurity Engineer'
];

// Helper to generate dynamic roadmap stages tailored to ANY career goal
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
        taskTitles: ['Build Neural Network in PyTorch', 'Hyperparameter Tuning & Cross Validation', 'CNNs for Computer Vision & NLP Basics']
      },
      {
        topic: 'Model Deployment & Portfolio Projects',
        description: 'Deploy ML models using FastAPI, Streamlit, and Docker on Cloud platforms.',
        hours: 30,
        taskTitles: ['Build Streamlit Interactive ML Web App', 'Deploy ML Model API with FastAPI & Docker', 'Complete End-to-End Data Science Capstone']
      },
      {
        topic: 'Data Science Interview Preparation',
        description: 'Mock technical interviews, SQL queries, ML theory, and case study rounds.',
        hours: 25,
        taskTitles: ['Solve 20 Advanced SQL Data Science Queries', 'Practice Machine Learning System Design', 'Conduct AI Mock Technical Interview']
      }
    ];
  } else if (gLower.includes('cyber') || gLower.includes('security')) {
    stageTemplates = [
      {
        topic: 'Networking & Linux Administration Core',
        description: 'Master TCP/IP protocols, OSI layers, Linux CLI commands, and network architecture.',
        hours: 25,
        taskTitles: ['Learn TCP/IP & Subnetting Basics', 'Master Linux Terminal & Bash Scripting', 'Configure Wireshark Packet Inspection']
      },
      {
        topic: 'Ethical Hacking & Vulnerability Assessment',
        description: 'Understand OWASP Top 10, Nmap port scanning, and web security auditing.',
        hours: 35,
        taskTitles: ['OWASP Top 10 Web Vulnerabilities Audit', 'Nmap Network Recon & Port Scanning', 'Burp Suite Web Proxy Testing']
      },
      {
        topic: 'Cryptography & Security Infrastructure',
        description: 'Symmetric/Asymmetric Encryption, SSL/TLS, PKI, and IAM authentication.',
        hours: 30,
        taskTitles: ['AES vs RSA Encryption Principles', 'SSL/TLS Handshake & Certificate Config', 'Implement Identity & Access Management (IAM)']
      },
      {
        topic: 'Penetration Testing & SIEM Analytics',
        description: 'Hands-on Metasploit, intrusion detection (Snort), and log analysis in Splunk.',
        hours: 45,
        taskTitles: ['Metasploit Exploitation & Payload Setup', 'Analyze Security Logs in Splunk SIEM', 'Build Intrusion Detection System Rules']
      },
      {
        topic: 'Security Portfolio & Certification Prep',
        description: 'Construct security audit reports and prepare for CompTIA Security+ / CEH.',
        hours: 35,
        taskTitles: ['Complete Security Audit Report for Sample App', 'CompTIA Security+ Practice Test Round', 'Conduct Cybersecurity Mock Interview']
      }
    ];
  } else if (gLower.includes('ui') || gLower.includes('ux') || gLower.includes('design')) {
    stageTemplates = [
      {
        topic: 'UX Design Thinking & User Research',
        description: 'Master user interviews, persona creation, empathy mapping, and information architecture.',
        hours: 20,
        taskTitles: ['Conduct User Research & Build Target Personas', 'Construct Information Architecture & Sitemap', 'Create User Journey Maps']
      },
      {
        topic: 'Figma Mastery & Scalable Design Systems',
        description: 'Master Auto-Layout, Constraints, Component Variants, and Design Tokens in Figma.',
        hours: 35,
        taskTitles: ['Figma Auto-Layout & Constraints Mastery', 'Create Scalable UI Component Library', 'Design Responsive Mobile & Desktop Layouts']
      },
      {
        topic: 'Visual UI Design & Accessibility (WCAG)',
        description: 'Color theory, typography hierarchy, grid systems, and WCAG accessibility standards.',
        hours: 30,
        taskTitles: ['Apply WCAG Color Contrast & Accessibility', 'Master Typography Scale & Visual Hierarchy', 'Design Dark & Light Mode Themes']
      },
      {
        topic: 'Interactive Prototyping & Usability Testing',
        description: 'Build interactive high-fidelity prototypes and conduct usability testing sessions.',
        hours: 30,
        taskTitles: ['Build Micro-Animations & Micro-Interactions', 'Conduct Usability Testing & Iterate Designs', 'Prepare Handoff Specifications for Developers']
      },
      {
        topic: 'UI/UX Portfolio & Product Design Case Studies',
        description: 'Construct end-to-end product design case studies to showcase to design leads.',
        hours: 35,
        taskTitles: ['Publish 2 End-to-End Figma Case Studies', 'Design Interactive Web Portfolio', 'Conduct UI/UX Design Mock Interview']
      }
    ];
  } else if (gLower.includes('cloud') || gLower.includes('devops')) {
    stageTemplates = [
      {
        topic: 'Linux System Administration & Networking',
        description: 'Linux shell scripting, Systemd services, SSH keys, DNS, and networking basics.',
        hours: 25,
        taskTitles: ['Master Linux Bash Automation Scripts', 'Configure Systemd & Process Monitoring', 'Setup SSH & Firewalld Rules']
      },
      {
        topic: 'Cloud Infrastructure (AWS / Azure / GCP)',
        description: 'IAM, EC2/VMs, VPC networking, S3 storage, and load balancing.',
        hours: 40,
        taskTitles: ['Provision Cloud Compute Instances & Storage', 'Configure Custom Cloud VPC & Subnets', 'Deploy Application behind Elastic Load Balancer']
      },
      {
        topic: 'Containerization & Orchestration (Docker & K8s)',
        description: 'Build Docker containers, compose files, and manage Kubernetes clusters.',
        hours: 45,
        taskTitles: ['Containerize Microservices with Dockerfile', 'Setup Docker Compose Multi-Container App', 'Deploy & Scale Pods in Kubernetes']
      },
      {
        topic: 'Infrastructure as Code (Terraform) & CI/CD',
        description: 'Automate infrastructure using Terraform and build GitHub Actions CI/CD pipelines.',
        hours: 40,
        taskTitles: ['Write Modular Terraform Provisioning Code', 'Build Automated CI/CD Deployment Pipeline', 'Implement Cloud Monitoring with Prometheus & Grafana']
      },
      {
        topic: 'Cloud Architecture & Certification Prep',
        description: 'Cloud Security best practices and AWS Solutions Architect interview preparation.',
        hours: 30,
        taskTitles: ['Design High Availability Cloud Architecture', 'Complete AWS / Azure Practice Exam', 'Conduct Cloud DevOps Mock Interview']
      }
    ];
  } else if (gLower.includes('ai') || gLower.includes('machine learning') || gLower.includes('ml')) {
    stageTemplates = [
      {
        topic: 'Python Math Foundations & Data Stack',
        description: 'Linear Algebra, Probability, Calculus, NumPy, Pandas, and Matplotlib.',
        hours: 25,
        taskTitles: ['NumPy Vectorization & Matrix Math', 'Pandas Data Wrangling & Cleaning', 'Exploratory Data Analysis Plots']
      },
      {
        topic: 'Core Machine Learning & Scikit-Learn',
        description: 'Supervised Learning, Regression, Trees, Ensemble Learning, and Model Metrics.',
        hours: 35,
        taskTitles: ['Build Classification & Regression Models', 'Tune Hyperparameters with GridSearch', 'Evaluate ROC-AUC & Confusion Matrix']
      },
      {
        topic: 'Deep Learning & Neural Architectures',
        description: 'PyTorch, Neural Networks, CNNs for Vision, Transformers, and PyTorch Lightning.',
        hours: 45,
        taskTitles: ['Implement Feedforward Neural Net in PyTorch', 'Train Convolutional Neural Network (CNN)', 'Fine-Tune Transformer Model (HuggingFace)']
      },
      {
        topic: 'Generative AI, LLMs & Agentic Systems',
        description: 'Prompt Engineering, LangChain, RAG architecture, Vector Databases, and Agents.',
        hours: 45,
        taskTitles: ['Build RAG Pipeline with Vector Database', 'Develop Autonomous AI Agent with Tools', 'Deploy GenAI App using FastAPI']
      },
      {
        topic: 'AI Systems Engineering & Interview Prep',
        description: 'Production MLOps, LLM Evaluation, System Design, and Placement interviews.',
        hours: 30,
        taskTitles: ['Implement ML Model Monitoring & Logging', 'Practice AI Systems Design Interview', 'Conduct AI Engineering Mock Interview']
      }
    ];
  } else if (gLower.includes('software engineer') || gLower.includes('software development') || gLower.includes('swe')) {
    stageTemplates = [
      {
        topic: 'Stage 1 → Programming Fundamentals',
        description: 'Master core programming constructs, object-oriented concepts, and clean code principles in Java, C++, or Python.',
        hours: 25,
        taskTitles: ['Master OOP Core Principles (Encapsulation, Polymorphism)', 'Solve 15 Control Flow & Recursion Problems', 'Write Clean & Modular Code Modules']
      },
      {
        topic: 'Stage 2 → Data Structures & Algorithms',
        description: 'Arrays, Linked Lists, Stacks, Queues, Trees, Graphs, Sorting, and Dynamic Programming.',
        hours: 50,
        taskTitles: ['Master Time & Space Complexity Analysis (Big O)', 'Solve 30 Array & String LeetCode Problems', 'Implement Binary Trees & Graph Traversal (DFS/BFS)']
      },
      {
        topic: 'Stage 3 → Database & SQL',
        description: 'Relational Database Design, SQL Joins, Indexing, Transactions, and Normalization.',
        hours: 30,
        taskTitles: ['Write Complex SQL Joins & Grouping Queries', 'Master Database Indexing & Query Optimization', 'Design Normalized Entity-Relationship Schemas']
      },
      {
        topic: 'Stage 4 → Web/Backend Development',
        description: 'REST APIs, Server-side Architecture, Middleware, Auth, and System Design basics.',
        hours: 45,
        taskTitles: ['Build RESTful API Services with Node.js/Java', 'Implement JWT User Authentication & Security', 'Integrate Database ORM & Connection Pooling']
      },
      {
        topic: 'Stage 5 → Projects',
        description: 'Construct full-stack production application with deployment, CI/CD, and Git workflows.',
        hours: 40,
        taskTitles: ['Build Full-Stack Web Application', 'Deploy Project to Production Cloud Hosting', 'Write Unit & Integration Test Suite']
      },
      {
        topic: 'Stage 6 → Interview Preparation',
        description: 'System design rounds, live coding drills, resume review, and HR mock interviews.',
        hours: 30,
        taskTitles: ['Complete 5 System Design Case Studies', 'Practice Live Technical Coding Drills', 'Conduct AI Mock HR & Technical Interviews']
      }
    ];
  } else {
    // Dynamic Generator for ANY custom entered career goal!
    const capitalizedGoal = goalText.trim().replace(/\b\w/g, (c) => c.toUpperCase());
    stageTemplates = [
      {
        topic: `Stage 1 → Core Foundations of ${capitalizedGoal}`,
        description: `Master fundamental principles, terminology, and standard tools essential for ${capitalizedGoal}.`,
        hours: 25,
        taskTitles: [`Learn Essential Terminology & Fundamentals for ${capitalizedGoal}`, `Set Up Industry Standard Workspace & Tools`, `Complete 5 Foundational Practice Exercises`]
      },
      {
        topic: `Stage 2 → Key Concepts & Applied Practice`,
        description: `Deep dive into primary frameworks, methods, and hands-on implementation patterns.`,
        hours: 35,
        taskTitles: [`Master Primary Concepts & Workflows for ${capitalizedGoal}`, `Solve 10 Practical Application Challenges`, `Understand System Architecture & Flow`]
      },
      {
        topic: `Stage 3 → Advanced Architecture & Optimization`,
        description: `Explore production-grade techniques, performance tuning, and professional standards.`,
        hours: 40,
        taskTitles: [`Implement Scalable Design & Engineering Patterns`, `Optimize Performance, Security & Quality Standards`, `Conduct Code/Work Reviews & Refactoring`]
      },
      {
        topic: `Stage 4 → Industry Portfolio Projects`,
        description: `Construct and publish real-world capstone projects to showcase domain expertise to employers.`,
        hours: 45,
        taskTitles: [`Design & Develop Major Portfolio Capstone Project`, `Deploy & Document Solution for Stakeholders`, `Write Project Technical Documentation`]
      },
      {
        topic: `Stage 5 → Placement & Interview Mastery`,
        description: `Prepare for technical interview rounds, domain assessments, and placement drives.`,
        hours: 30,
        taskTitles: [`Review Top 50 Interview Questions for ${capitalizedGoal}`, `Optimize Resume & Project Portfolio Highlights`, `Complete AI Mock Technical & HR Interview Rounds`]
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
      progress = level === 'Beginner' ? 0 : 25;
    }

    // Workload tailoring based on selected daily time:
    let taskLimit = 3;
    let durationLabel = '30 min';
    let hoursMult = 1.0;

    if (dailyTime === '30 min') {
      taskLimit = 2; // 2 focused micro-tasks (15 min each = 30 min daily workload)
      durationLabel = '15 min';
      hoursMult = 0.5;
    } else if (dailyTime === '1 hour') {
      taskLimit = 3; // 3 tasks (20-30 min each = 1 hour daily workload)
      durationLabel = '30 min';
      hoursMult = 1.0;
    } else if (dailyTime === '2 hours') {
      taskLimit = 4; // 4 tasks (30-45 min each = 2 hours daily workload)
      durationLabel = '45 min';
      hoursMult = 1.6;
    } else if (dailyTime === '3+ hours') {
      taskLimit = 5; // 5 tasks (45-60 min each = 3+ hours daily workload)
      durationLabel = '60 min';
      hoursMult = 2.2;
    }

    const selectedTaskTitles = stg.taskTitles.slice(0, taskLimit);

    return {
      id: `stg-${sIdx + 1}`,
      topic: stg.topic,
      description: stg.description,
      status: status,
      progress: progress,
      estimatedHours: Math.max(10, Math.round(stg.hours * hoursMult)),
      tasks: selectedTaskTitles.map((title, tIdx) => ({
        id: `task-${sIdx + 1}-${tIdx + 1}`,
        title: title,
        duration: durationLabel,
        completed: status === 'Completed',
        period: (tIdx % 2 === 0 ? 'Daily' : 'Weekly') as TimeFilter
      }))
    };
  });
}

export const RoadmapView: React.FC = () => {
  const { user, setActiveTab, recordActivity, settings, addNotification, registerWorkflowGuard, clearWorkflowGuard } = useApp();

  // Screen modes: 'empty' | 'form' | 'loading' | 'generated'
  const [screenMode, setScreenMode] = useState<'empty' | 'form' | 'loading' | 'generated'>('form');

  // Input states (NO prefilled career goal)
  const [customGoalInput, setCustomGoalInput] = useState<string>('');
  const [userLevel, setUserLevel] = useState<UserLevel>('Beginner');
  const [dailyTime, setDailyTime] = useState<DailyTime>('1 hour');

  // Validation Error State
  const [validationError, setValidationError] = useState<string | null>(null);

  // Generated Roadmap State
  const [stages, setStages] = useState<RoadmapStage[]>([]);
  const [selectedStage, setSelectedStage] = useState<RoadmapStage | null>(null);

  // REGISTER GLOBAL EXIT GUARD FOR LEARNING ROADMAP
  useEffect(() => {
    const isDirty = (screenMode === 'form' && customGoalInput.trim().length > 0) || screenMode === 'loading';
    registerWorkflowGuard('Learning Roadmap', isDirty);
    return () => {
      clearWorkflowGuard('Learning Roadmap');
    };
  }, [screenMode, customGoalInput, registerWorkflowGuard, clearWorkflowGuard]);

  // Session Resume Modal State
  const [showRoadmapModal, setShowRoadmapModal] = useState<boolean>(false);

  // Browser Notification API Permission State & Local Preference
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('acehire_ai_roadmap_reminders_enabled');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Check browser Notification permission status on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission);
    } else {
      setNotifPermission('unsupported');
    }
  }, []);

  const handleRequestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotifPermission('unsupported');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      if (permission === 'granted') {
        setReminderEnabled(true);
        localStorage.setItem('acehire_ai_roadmap_reminders_enabled', 'true');
      } else if (permission === 'denied') {
        setReminderEnabled(false);
        localStorage.setItem('acehire_ai_roadmap_reminders_enabled', 'false');
      }
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
    }
  };

  const handleToggleReminders = async () => {
    if (!reminderEnabled) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          setNotifPermission('granted');
          setReminderEnabled(true);
          localStorage.setItem('acehire_ai_roadmap_reminders_enabled', 'true');
        } else if (Notification.permission === 'denied') {
          setNotifPermission('denied');
          setReminderEnabled(false);
          localStorage.setItem('acehire_ai_roadmap_reminders_enabled', 'false');
        } else {
          await handleRequestNotificationPermission();
        }
      }
    } else {
      setReminderEnabled(false);
      localStorage.setItem('acehire_ai_roadmap_reminders_enabled', 'false');
    }
  };

  // Load persisted state on mount from Supabase or localStorage
  useEffect(() => {
    let loaded = false;
    if (user?.id) {
      SupabaseService.fetchRoadmap(user.id).then((remoteItems) => {
        if (remoteItems && remoteItems.length > 0) {
          const first = remoteItems[0];
          if (first && first.title) {
            setCustomGoalInput(first.category || first.title);
            setScreenMode('generated');
            loaded = true;
          }
        }
      });
    }

    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved && !loaded) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.customGoalInput && parsed.stages && parsed.stages.length > 0) {
          setCustomGoalInput(parsed.customGoalInput);
          setUserLevel(parsed.userLevel || 'Beginner');
          setDailyTime(parsed.dailyTime || '1 hour');
          setStages(parsed.stages);
          setScreenMode('generated');
          return;
        }
      }
      if (!loaded) setScreenMode('form');
    } catch (e) {
      console.warn('Could not load saved roadmap state:', e);
      if (!loaded) setScreenMode('form');
    }
  }, [user?.id]);

  // Save state to Supabase & localStorage whenever stages or inputs change in generated mode
  useEffect(() => {
    if (screenMode === 'generated' && stages.length > 0 && customGoalInput.trim()) {
      try {
        const payload = {
          customGoalInput: customGoalInput.trim(),
          userLevel,
          dailyTime,
          stages,
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
        if (user?.id) {
          stages.forEach((stg) => {
            stg.tasks.forEach((tsk) => {
              SupabaseService.saveRoadmapItem(user.id, {
                period: tsk.period,
                category: customGoalInput.trim(),
                title: tsk.title,
                description: stg.description,
                completed: tsk.completed,
                dueDate: tsk.duration
              });
            });
          });
        }
      } catch (e) {
        console.warn('Could not save roadmap state:', e);
      }
    }
  }, [screenMode, stages, customGoalInput, userLevel, dailyTime, user?.id]);

  const activeGoalName = customGoalInput.trim();

  // Confirmation Modal State for Back to Goal Selection
  const [showBackConfirmModal, setShowBackConfirmModal] = useState<boolean>(false);

  const handleBackToGoalSelectionClick = () => {
    setShowBackConfirmModal(true);
  };

  const handleConfirmBackYes = () => {
    setShowBackConfirmModal(false);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.warn('Could not clear roadmap state:', e);
    }
    setValidationError(null);
    setScreenMode('form');
  };

  const handleConfirmBackNo = () => {
    setShowBackConfirmModal(false);
  };

  const handleExitToDashboard = () => {
    setActiveTab('home');
  };

  // Generate Personalized AI Roadmap with input validation & loading state
  const handleGenerateRoadmap = () => {
    if (!customGoalInput.trim()) {
      setValidationError('Please enter your career goal.');
      return;
    }

    setValidationError(null);
    setScreenMode('loading');

    setTimeout(() => {
      const goalToUse = customGoalInput.trim();
      const generatedStages = generateDynamicRoadmapStages(goalToUse, userLevel, dailyTime);
      setStages(generatedStages);
      setScreenMode('generated');
      recordActivity(`Generated ${dailyTime} AI Roadmap for ${goalToUse}`, 'Roadmap', 'In Progress', 'roadmap');

      // Send reminder notification for scheduled daily practice if enabled in settings
      const isReminderEnabled = settings?.notifications?.dailyPracticeReminder ?? true;
      const firstUncompletedTask = generatedStages[0]?.tasks.find((t) => !t.completed)?.title;
      if (isReminderEnabled && firstUncompletedTask && addNotification) {
        addNotification(
          `AI Roadmap Practice Scheduled (${dailyTime})`,
          `Your daily ${dailyTime} study path for "${goalToUse}" is active! Scheduled daily practice task: "${firstUncompletedTask}".`,
          'coding'
        );
      }
    }, 1800);
  };

  // Toggle task completion & advance progress
  const handleToggleTask = (stageId: string, taskId: string) => {
    let completedTitle = '';
    let nextUncompletedTitle = '';

    setStages((prevStages) => {
      const updated = prevStages.map((stage) => {
        if (stage.id !== stageId) return stage;

        const updatedTasks = stage.tasks.map((t) => {
          if (t.id === taskId) {
            completedTitle = t.title;
            return { ...t, completed: !t.completed };
          }
          return t;
        });

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

      // Find next uncompleted planned task across current/active stage
      const activeStageObj = updated.find((s) => s.status === 'Current') || updated.find((s) => s.progress < 100);
      if (activeStageObj) {
        const nextTask = activeStageObj.tasks.find((t) => !t.completed);
        if (nextTask) nextUncompletedTitle = nextTask.title;
      }

      return updated;
    });

    if (completedTitle) {
      recordActivity(`Completed ${dailyTime} task: "${completedTitle}"`, 'Roadmap', 'In Progress', 'roadmap');

      // Check User Settings for Daily Practice Reminder
      const isReminderEnabled = settings?.notifications?.dailyPracticeReminder ?? true;
      if (isReminderEnabled && nextUncompletedTitle && addNotification) {
        addNotification(
          `Daily Practice Scheduled (${dailyTime})`,
          `Great progress! Completed task. Next scheduled practice task: "${nextUncompletedTitle}". Keep up your ${dailyTime} daily commitment!`,
          'coding'
        );
      }
    }
  };

  // Statistics & Calculations
  const allTasks = stages.flatMap((s) => s.tasks);
  const completedTasksCount = allTasks.filter((t) => t.completed).length;
  const overallProgress = allTasks.length > 0 ? Math.round((completedTasksCount / allTasks.length) * 100) : 0;
  const currentStageObj = stages.find((s) => s.status === 'Current') || stages[0] || null;
  const completedStagesCount = stages.filter((s) => s.status === 'Completed').length;
  const totalHours = stages.reduce((acc, s) => acc + s.estimatedHours, 0);

  // Time conversion
  const dailyHoursMap: Record<DailyTime, number> = {
    '30 min': 0.5,
    '1 hour': 1.0,
    '2 hours': 2.0,
    '3+ hours': 3.5
  };
  const hoursPerDay = dailyHoursMap[dailyTime] || 1.0;
  const totalDaysNeeded = Math.ceil(totalHours / hoursPerDay);
  const totalWeeksNeeded = Math.ceil(totalDaysNeeded / 7);
  const totalMonthsNeeded = Math.max(1, Math.round(totalWeeksNeeded / 4.3));

  const todayTasks = currentStageObj ? currentStageObj.tasks.filter((t) => !t.completed) : [];

  const getGoalSpecificAIInsight = () => {
    if (!activeGoalName) return 'Focus on building strong core fundamentals first.';
    
    if (completedStagesCount === 0) {
      return `For ${activeGoalName}, focus on mastering "${stages[0]?.topic || 'Stage 1'}" first. Consistent daily effort of ${dailyTime} will build momentum fast.`;
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

      {/* Back to Goal Selection Confirmation Modal */}
      {showBackConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-5 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-white font-['Space_Grotesk']">
                Confirm Goal Selection
              </h3>
              <p className="text-xs sm:text-sm font-medium text-slate-300 leading-relaxed">
                Are you sure you want to skip this roadmap and select a different goal?
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmBackYes}
                className="px-6 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-md cursor-pointer transition-all"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={handleConfirmBackNo}
                className="px-6 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs border border-slate-700 shadow-md cursor-pointer transition-all"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ambient Lighting Background Glows */}
      <div className="absolute -top-24 -left-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none dark:opacity-100 opacity-25" />
      <div className="absolute -bottom-24 -right-20 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none dark:opacity-100 opacity-25" />

      {/* ========================================================================= */}
      {/* SCREEN MODE 1: EMPTY STATE (Requirement 10) */}
      {/* ========================================================================= */}
      {screenMode === 'empty' && (
        <div className="min-h-[460px] flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-300 py-8">
          
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-cyan-400 via-indigo-600 to-purple-600 p-0.5 shadow-2xl flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center text-cyan-300">
              <Map className="w-12 h-12 animate-pulse" />
            </div>
          </div>

          <div className="space-y-2 max-w-md">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-cyan-300 text-xs font-extrabold">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Smart Interview Simulator AI</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
              No roadmap generated yet.
            </h2>
            
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Enter your target career goal, skill level, and daily commitment to generate a structured, personalized learning path with milestones and daily tasks.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setScreenMode('form')}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-3 shadow-xl shadow-cyan-400/25 transition-all duration-300 hover:scale-[1.02] active:scale-98 cursor-pointer"
          >
            <Rocket className="w-5 h-5 text-slate-950" />
            <span>Create My AI Roadmap</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN MODE 2: CAREER GOAL FORM SETUP & DYNAMIC PREVIEW */}
      {/* ========================================================================= */}
      {screenMode === 'form' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          <div className="animated-border-glow-wrapper">
            <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-blue-600 via-indigo-800 to-purple-900 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-950 p-6 sm:p-9 text-white border-0 shadow-2xl">
              <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative z-10">
                
                {/* Left Column: Form & Inputs */}
                <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
                  
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-cyan-200 text-xs font-bold backdrop-blur-md">
                      <Brain className="w-4 h-4 text-cyan-300" />
                      <span>AI Learning Roadmap Engine</span>
                    </div>

                    <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-['Space_Grotesk'] text-white leading-tight">
                      🧠 AI Learning Roadmap
                    </h1>
                    <p className="text-sm sm:text-base text-slate-100 dark:text-slate-300 font-medium leading-relaxed">
                      Enter your career goal. We'll build your personalized learning journey.
                    </p>
                  </div>

                  {/* Career Goal Input (Requirement 1) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-cyan-200 block uppercase tracking-wider">
                        Enter your career goal <span className="text-pink-400">*</span>
                      </label>
                      {activeGoalName && (
                        <span className="text-[10px] text-cyan-300 font-bold bg-cyan-400/10 px-2 py-0.5 rounded-md border border-cyan-400/20">
                          Active Input
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={customGoalInput}
                        onChange={(e) => {
                          setCustomGoalInput(e.target.value);
                          if (e.target.value.trim()) setValidationError(null);
                        }}
                        placeholder="e.g., Data Scientist, UI/UX Designer, Cloud Engineer..."
                        className={`w-full p-4 pr-12 rounded-2xl bg-white/10 dark:bg-slate-950/80 border ${
                          validationError
                            ? 'border-red-400 ring-2 ring-red-400/30'
                            : 'border-white/25 dark:border-slate-800'
                        } text-white placeholder-slate-300 dark:placeholder-slate-500 text-xs sm:text-sm font-semibold focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 backdrop-blur-xl transition-all`}
                      />
                      <Sparkles className="w-5 h-5 text-cyan-300 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Inline Validation Error Message (Requirement 1 & 5) */}
                    {validationError && (
                      <div className="p-3 rounded-xl bg-red-500/20 border border-red-400/40 text-red-200 text-xs font-extrabold flex items-center gap-2 animate-in fade-in duration-200">
                        <AlertCircle className="w-4 h-4 text-red-300 shrink-0" />
                        <span>{validationError}</span>
                      </div>
                    )}

                    {/* Example Suggestion Tags */}
                    <div className="pt-1 space-y-1">
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                        Popular Career Examples:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {POPULAR_CAREER_TAGS.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setCustomGoalInput(tag);
                              setValidationError(null);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                              customGoalInput.trim().toLowerCase() === tag.toLowerCase()
                                ? 'bg-cyan-400 text-slate-950 font-bold'
                                : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 2-Column Selectors: Skill Level & Daily Study Time (Requirement 2 & 3) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    
                    {/* Skill Level Selector */}
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

                    {/* Daily Study Time Selector */}
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

                  {/* Primary CTA Button (Requirement 5) */}
                  <button
                    type="button"
                    onClick={handleGenerateRoadmap}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-cyan-400/25 transition-all duration-300 hover:scale-[1.01] active:scale-98 cursor-pointer mt-2"
                  >
                    <Sparkles className="w-5 h-5 text-slate-950 animate-spin [animation-duration:4s]" />
                    <span>✨ Generate My AI Roadmap</span>
                  </button>

                </div>

                {/* Right Column: DYNAMIC PREVIEW CARD (Requirement 4) */}
                <div className="lg:col-span-5 flex flex-col justify-between">
                  <div className="relative h-full p-6 sm:p-7 rounded-3xl bg-slate-900/90 dark:bg-slate-950/90 border border-cyan-400/40 shadow-[0_0_30px_rgba(56,189,248,0.2)] flex flex-col justify-between space-y-6 text-center overflow-hidden">
                    
                    <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="space-y-4">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-500 p-0.5 shadow-lg flex items-center justify-center">
                        <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-cyan-300">
                          <Bot className="w-8 h-8 animate-pulse" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                          🤖 AI Roadmap Live Preview
                        </span>
                        
                        {/* Dynamic Title (Requirement 4: NEVER permanently software engineer) */}
                        <h3 className="text-lg sm:text-xl font-extrabold text-white font-['Space_Grotesk'] pt-1 min-h-[32px] flex items-center justify-center">
                          {activeGoalName ? `🎯 ${activeGoalName}` : 'Your Target Career Goal'}
                        </h3>
                        
                        <p className="text-xs text-slate-300 leading-relaxed font-medium px-2">
                          {activeGoalName ? (
                            <>
                              Your roadmap will be personalized specifically for <strong>"{activeGoalName}"</strong> based on your selected <strong>{userLevel}</strong> skill level and <strong>{dailyTime}</strong> daily study commitment.
                            </>
                          ) : (
                            'Enter your target career goal to preview your personalized AI roadmap structure.'
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Dynamic Preview Badges */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="grid grid-cols-2 gap-2 text-left text-[11px] font-extrabold">
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Target Career</span>
                          <strong className="text-cyan-300 truncate block">{activeGoalName || 'Not entered'}</strong>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Skill Level</span>
                          <strong className="text-emerald-400 block">{userLevel}</strong>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Daily Time</span>
                          <strong className="text-purple-400 block">{dailyTime}</strong>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Curriculum</span>
                          <strong className="text-cyan-300 block">Dynamic Modules</strong>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-1.5 text-[11px] font-extrabold text-emerald-400 pt-1">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Adaptive Stages & Task Tracker</span>
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
      {/* SCREEN MODE 3: PROPER LOADING STATE (Requirement 5) */}
      {/* ========================================================================= */}
      {screenMode === 'loading' && (
        <div className="min-h-[440px] flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-300 py-10">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
            <div className="absolute inset-3 rounded-full border-4 border-purple-500/20 border-b-purple-400 animate-spin [animation-duration:3s]" />
            <Brain className="w-12 h-12 text-cyan-300 animate-pulse" />
          </div>

          <div className="space-y-2 max-w-md">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
              Creating your personalized AI roadmap...
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
              Structuring customized stages, learning topics, and daily milestones for <strong>"{activeGoalName}"</strong>.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN MODE 4: GENERATED ROADMAP RESULT PAGE (Requirement 7 & 8) */}
      {/* ========================================================================= */}
      {screenMode === 'generated' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* TARGET GOAL HERO HEADER */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-purple-500/20 bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-bold border border-cyan-500/20">
                <Target className="w-4 h-4" />
                <span>Selected Career Goal</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk'] flex items-center gap-2">
                🎯 {activeGoalName}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                Skill Level: <strong className="text-blue-500 dark:text-cyan-400">{userLevel}</strong> • Daily Commitment: <strong className="text-purple-500 dark:text-purple-400">{dailyTime}</strong> • Estimated Duration: <strong className="text-emerald-500">{totalHours} Hours</strong> (~{totalWeeksNeeded} Weeks / ~{totalMonthsNeeded} Months)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Notification Permission Flow Button */}
              {notifPermission === 'denied' ? (
                <button
                  type="button"
                  onClick={handleRequestNotificationPermission}
                  title="Notifications blocked in browser. Click to re-check."
                  className="px-3 py-2.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <BellOff className="w-4 h-4 text-red-400" />
                  <span>Notifications Blocked</span>
                </button>
              ) : reminderEnabled && notifPermission === 'granted' ? (
                <button
                  type="button"
                  onClick={handleToggleReminders}
                  title="Study reminders enabled. Click to disable."
                  className="px-3 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Bell className="w-4 h-4 text-emerald-400" />
                  <span>Reminders Active</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleToggleReminders}
                  title="Enable study reminders via browser Notification API"
                  className="px-3 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Bell className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>Enable Reminders</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleBackToGoalSelectionClick}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-cyan-400" />
                <span>Back to Goal Selection</span>
              </button>
            </div>
          </div>

          {/* Notification Permission Denied Banner */}
          {notifPermission === 'denied' && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/25 flex flex-wrap items-center justify-between gap-3 text-xs font-medium text-red-200 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  <strong>Browser Notifications Disabled:</strong> Permission is currently denied in your browser settings. Enable notifications in browser site settings to receive reminders.
                </span>
              </div>
              <button
                type="button"
                onClick={handleRequestNotificationPermission}
                className="px-3 py-1 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-extrabold text-[11px] border border-red-500/40 transition-all cursor-pointer ml-auto"
              >
                Re-check Permission
              </button>
            </div>
          )}

          {/* ROADMAP OVERVIEW STATS & TIMELINE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Overall Roadmap Progress Card */}
            <div className="md:col-span-2 glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                    Overall Roadmap Progress
                  </h3>
                </div>
                <span className="text-xl font-black text-cyan-400 font-mono">
                  {overallProgress}%
                </span>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-300 dark:border-slate-700">
                <div
                  className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 block text-[10px] font-bold">Tasks Completed</span>
                  <strong className="text-emerald-400 text-xs font-black">{completedTasksCount} / {allTasks.length}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 block text-[10px] font-bold">Completed Stages</span>
                  <strong className="text-cyan-400 text-xs font-extrabold truncate block">{completedStagesCount} / {stages.length}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 block text-[10px] font-bold">Estimated Weeks</span>
                  <strong className="text-purple-400 text-xs font-black">~{totalWeeksNeeded} Weeks</strong>
                </div>
              </div>
            </div>

            {/* AI INSIGHT & READINESS CARD */}
            <div className="glass-card rounded-3xl p-5 border border-purple-500/30 bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl shadow-xl flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-extrabold text-xs">
                  <Bot className="w-4 h-4" />
                  <span>🤖 AI Roadmap Insight</span>
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                  "{getGoalSpecificAIInsight()}"
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>Placement Readiness:</span>
                <span className="text-emerald-400 font-extrabold font-mono text-xs">{Math.min(100, Math.max(15, overallProgress + 20))}% Job Ready</span>
              </div>
            </div>
          </div>

          {/* CURRENT ACTIVE STAGE CARD */}
          {currentStageObj && (
            <div className="glass-card rounded-3xl p-5 sm:p-6 border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-purple-500/10 dark:bg-slate-900/90 backdrop-blur-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-[11px] font-extrabold border border-cyan-500/30">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Current Active Module</span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                  {currentStageObj.topic}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {currentStageObj.description}
                </p>

                <div className="flex items-center gap-3 pt-1">
                  <div className="w-48 bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-cyan-400 h-full rounded-full transition-all duration-500" style={{ width: `${currentStageObj.progress}%` }} />
                  </div>
                  <span className="text-xs font-black text-cyan-400 font-mono">
                    {currentStageObj.progress}%
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStage(currentStageObj)}
                className="px-5 py-2.5 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-cyan-400/20 transition-all cursor-pointer shrink-0"
              >
                <span>View Stage Tasks</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* CONNECTED ROADMAP STAGE NODES */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 font-['Space_Grotesk']">
                  <Map className="w-6 h-6 text-cyan-400" />
                  <span>Personalized Learning Stages</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Click any stage node to view detailed topics and tasks.
                </p>
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {stages.length} Structured Stages
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
                          ? 'border-cyan-400 bg-cyan-500/10 dark:bg-cyan-500/15 shadow-xl shadow-cyan-400/10 scale-[1.01]'
                          : isCompleted
                          ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10'
                          : 'border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-extrabold text-sm shadow-md transition-transform group-hover:scale-110 ${
                            isCompleted
                              ? 'bg-emerald-500 text-white'
                              : isCurrent
                              ? 'bg-cyan-400 text-slate-950 ring-4 ring-cyan-400/20'
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
                                  ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300'
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
                            Progress
                          </span>
                          <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                            {stage.progress}%
                          </span>
                        </div>

                        <button
                          type="button"
                          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all ${
                            isCurrent
                              ? 'bg-cyan-400 text-slate-950 font-black shadow-md'
                              : isCompleted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <span>Tasks ({stage.tasks.filter(t => t.completed).length}/{stage.tasks.length})</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TODAY'S LEARNING PLAN (DAILY TASKS WITH TOGGLE) */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 font-['Space_Grotesk']">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span>Daily Actionable Plan ({currentStageObj ? currentStageObj.topic : 'Active Module'})</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Complete these tasks to advance your overall roadmap progress.
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {todayTasks.length} Pending
              </span>
            </div>

            <div className="space-y-2.5">
              {todayTasks.length > 0 ? (
                todayTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => currentStageObj && handleToggleTask(currentStageObj.id, t.id)}
                    className="p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-4 bg-slate-50/80 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 hover:border-cyan-400/60 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-slate-400 dark:border-slate-600 flex items-center justify-center shrink-0 group-hover:border-cyan-400 transition-colors" />
                      <div>
                        <span className="text-[10px] font-black uppercase text-cyan-400 block">
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
                  <span>🎉 All tasks for the current module are completed!</span>
                  <button
                    type="button"
                    onClick={() => setScreenMode('form')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-[11px] font-extrabold cursor-pointer"
                  >
                    Create New Goal Roadmap
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* STAGE TASKS MODAL */}
      {selectedStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card rounded-3xl p-6 max-w-xl w-full border border-cyan-500/30 bg-slate-900 text-white shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                  Stage Module Details
                </span>
                <h3 className="text-lg font-extrabold text-white font-['Space_Grotesk']">
                  {selectedStage.topic}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStage(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              {selectedStage.description}
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  Module Tasks ({selectedStage.tasks.filter((t) => t.completed).length} / {selectedStage.tasks.length} Done)
                </h4>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  ~{selectedStage.estimatedHours} Hours
                </span>
              </div>

              <div className="space-y-2">
                {selectedStage.tasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleToggleTask(selectedStage.id, t.id)}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 cursor-pointer hover:border-cyan-400/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                          t.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-700'
                        }`}
                      >
                        {t.completed && <Check className="w-3.5 h-3.5" />}
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
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-extrabold text-slate-300 cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedStage(null);
                  if (selectedStage.topic.includes('DSA') || selectedStage.topic.includes('Algorithms') || selectedStage.topic.includes('Programming')) {
                    setActiveTab('coding');
                  } else if (selectedStage.topic.includes('Interview') || selectedStage.topic.includes('Prep')) {
                    setActiveTab('interview');
                  } else {
                    setActiveTab('aptitude');
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg shadow-cyan-400/20 cursor-pointer"
              >
                <span>Start Practice</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RoadmapView;

