import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  ArrowRight,
  ArrowLeft,
  Mic,
  MicOff,
  TrendingUp,
  Award,
  BookOpen,
  LogOut,
  Bot,
  X,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { evaluateAnswerWithAI } from '../../services/aiEngine';
import { SupabaseService } from '../../services/supabaseClient';
import { DualLanguageFeedback } from '../../types';
import { SessionResumeModal } from '../Common/SessionResumeModal';

export type SelectedLanguage = 'English' | 'Tanglish';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
export type ViewState = 'input' | 'result';

// Non-repeating Question Bank per Difficulty Level
const QUESTION_BANK_BY_DIFFICULTY: Record<DifficultyLevel, string[]> = {
  Easy: [
    "What is your name and tell me about your background?",
    "Where are you from and what college do you attend?",
    "What are your favorite hobbies and interests outside of studies?",
    "What core technical and personal skills are you most confident in?",
    "What programming language do you enjoy using the most and why?"
  ],
  Medium: [
    "What are your short-term and long-term career goals?",
    "Tell me about a key college project you built and your role in it.",
    "What are your primary technical and personal strengths?",
    "Why are you interested in pursuing a career in software development?",
    "How do you prepare for campus placement coding interviews?"
  ],
  Hard: [
    "Describe a difficult technical problem you solved and how you approached it.",
    "How would you handle a disagreement with a teammate during a group project?",
    "How would you explain a complex technical project to a non-technical manager?",
    "Describe a time when you faced an unexpected failure and how you overcame it.",
    "How do you manage tight deadlines when multiple academic deliverables overlap?"
  ]
};

// Question-Specific & Difficulty-Aware Best Answer Generator
function generateQuestionSpecificBestAnswer(
  question: string,
  userAnswer: string,
  difficulty: DifficultyLevel
): string {
  const qLower = question.toLowerCase();
  const ansTrim = userAnswer.trim();

  // Helper name extractor
  const nameMatch = ansTrim.match(/(?:myself|name is|i am|i'm)\s+([A-Za-z]+)/i);
  const detectedName = nameMatch ? nameMatch[1] : 'Karthika';

  if (difficulty === 'Easy' || qLower.includes('name') || qLower.includes('from') || qLower.includes('hobbies') || qLower.includes('skills') || qLower.includes('programming language')) {
    if (qLower.includes('name') || qLower.includes('background')) {
      return `Hello! My name is ${detectedName}. I am currently a Computer Science student with a passion for software engineering and problem solving.`;
    }
    if (qLower.includes('from') || qLower.includes('college')) {
      return `I am from Chennai, Tamil Nadu, and I am pursuing my B.E. in Computer Science at Anna University.`;
    }
    if (qLower.includes('hobbies') || qLower.includes('interests')) {
      return `Outside of academics, I enjoy building web applications, reading technology blogs, and playing badminton.`;
    }
    if (qLower.includes('skills') || qLower.includes('confident')) {
      return `My core skills include programming in Java and Python, web development with HTML, CSS, and React, alongside strong problem-solving fundamentals.`;
    }
    if (qLower.includes('programming language') || qLower.includes('enjoy')) {
      return `My favorite programming language is Java because of its object-oriented principles, reliability, and strong ecosystem for building scalable software.`;
    }
  }

  if (difficulty === 'Medium' || qLower.includes('career goals') || qLower.includes('project') || qLower.includes('strengths') || qLower.includes('software development') || qLower.includes('prepare')) {
    if (qLower.includes('career goals') || qLower.includes('future')) {
      return `My short-term goal is to secure a software engineering role in a dynamic tech company where I can strengthen my coding skills. Long-term, I aspire to become a Senior Software Engineer leading scalable system design.`;
    }
    if (qLower.includes('project')) {
      return `In my college project, I built a web application using React and Node.js. My primary responsibility was developing responsive UI components and integrating backend REST APIs.`;
    }
    if (qLower.includes('strengths')) {
      return `My main technical strengths include analytical problem solving, fast learning adaptability, and collaborative teamwork. I enjoy tackling challenging algorithmic problems and learning new frameworks quickly.`;
    }
    if (qLower.includes('software development')) {
      return `I am passionate about software development because I love taking abstract logical challenges and turning them into practical, high-impact digital applications.`;
    }
    if (qLower.includes('prepare') || qLower.includes('interviews')) {
      return `I prepare for campus placements by solving Data Structures problems daily on LeetCode, reviewing core CS subjects like DBMS and OS, and practicing communication skills with mock interviews.`;
    }
  }

  if (difficulty === 'Hard' || qLower.includes('difficult problem') || qLower.includes('disagreement') || qLower.includes('non-technical') || qLower.includes('failure') || qLower.includes('deadlines')) {
    if (qLower.includes('difficult problem') || qLower.includes('solved')) {
      return `When faced with database query performance bottlenecks in my project, I analyzed query execution plans, added indexes on key foreign keys, and integrated caching, reducing overall latency by 50%.`;
    }
    if (qLower.includes('disagreement') || qLower.includes('team')) {
      return `During a group project conflict regarding architecture choices, I built a quick prototype to benchmark both options objectively. The test results helped our team reach a confident, data-driven consensus.`;
    }
    if (qLower.includes('non-technical') || qLower.includes('explain')) {
      return `When explaining a technical concept to non-technical stakeholders, I use real-life analogies, eliminate unnecessary technical jargon, and focus on user benefits and business outcomes.`;
    }
    if (qLower.includes('failure') || qLower.includes('unexpected')) {
      return `When a deployment bug broke API integration during project testing, I took ownership, rolled back to a stable build, identified the root cause using log traces, and added unit tests to prevent recurrence.`;
    }
    if (qLower.includes('deadlines') || qLower.includes('overlap')) {
      return `When multiple project deadlines collide, I prioritize tasks based on impact and urgency, break deliverables into clear daily milestones, and maintain transparent status updates with team leads.`;
    }
  }

  return `My goal for "${question}" is to communicate my ideas clearly and professionally. ${ansTrim ? `Building upon my answer ("${ansTrim.substring(0, 45)}..."), ` : ''}I ensure my response is structured with a clear introduction, relevant supporting details, and a confident summary.`;
}

export const CommunicationView: React.FC = () => {
  const { user, recordUserActivity, setActiveTab, registerWorkflowGuard, clearWorkflowGuard } = useApp();

  // Settings & View State
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Medium');
  const [feedbackLanguage, setFeedbackLanguage] = useState<SelectedLanguage>('English');
  const [viewState, setViewState] = useState<ViewState>('input');

  // Question & Session History
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [askedQuestions, setAskedQuestions] = useState<Record<DifficultyLevel, string[]>>({
    Easy: [],
    Medium: [],
    Hard: []
  });

  // User Answer & Voice Recognition
  const [inputSentence, setInputSentence] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [speechRecognition, setSpeechRecognition] = useState<any | null>(null);
  const [hasVoiceSupport, setHasVoiceSupport] = useState<boolean>(true);
  const [voiceNotice, setVoiceNotice] = useState<string>('');

  // Validation Popup State
  const [showValidationPopup, setShowValidationPopup] = useState<boolean>(false);

  // Analysis State & Result Feedback
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // REGISTER GLOBAL EXIT GUARD FOR COMMUNICATION PRACTICE
  useEffect(() => {
    const isDirty = inputSentence.trim().length > 0 || isRecording || isAnalyzing;
    registerWorkflowGuard('Communication Practice', isDirty);
    return () => {
      clearWorkflowGuard('Communication Practice');
    };
  }, [inputSentence, isRecording, isAnalyzing, registerWorkflowGuard, clearWorkflowGuard]);
  const [feedback, setFeedback] = useState<DualLanguageFeedback | null>(null);

  // Score comparison tracking for "Try Again"
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [newScore, setNewScore] = useState<number | null>(null);
  const [hasAttemptedAgain, setHasAttemptedAgain] = useState<boolean>(false);

  // Modal session refs
  const [showCommModal, setShowCommModal] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const resultContainerRef = useRef<HTMLDivElement | null>(null);

  // Active question
  const currentQuestionList = QUESTION_BANK_BY_DIFFICULTY[difficulty];
  const currentQuestion = currentQuestionList[currentQuestionIndex % currentQuestionList.length];

  // Web Speech API Initialization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsRecording(true);
          setVoiceNotice('Listening... Speak naturally in English.');
        };

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript.trim()) {
            setInputSentence(transcript);
          }
        };

        recognition.onerror = (err: any) => {
          console.warn('Speech recognition error:', err);
          setIsRecording(false);
          setVoiceNotice('Voice listening ended. You can edit the text below.');
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        setSpeechRecognition(recognition);
        setHasVoiceSupport(true);
      } else {
        setHasVoiceSupport(false);
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!hasVoiceSupport || !speechRecognition) {
      setVoiceNotice('Web Speech Recognition is unavailable in this browser. You can type your answer below.');
      return;
    }

    if (isRecording) {
      speechRecognition.stop();
      setIsRecording(false);
      setVoiceNotice('Recording stopped. Review or edit your text before submitting.');
    } else {
      setInputSentence('');
      setVoiceNotice('Listening... Speak naturally.');
      try {
        speechRecognition.start();
      } catch (e) {
        console.warn('Speech recognition start error:', e);
      }
    }
  };

  // Switch difficulty & load non-repeating question
  const handleSelectDifficulty = (newDiff: DifficultyLevel) => {
    setDifficulty(newDiff);
    setFeedback(null);
    setInputSentence('');
    setViewState('input');
    setHasAttemptedAgain(false);
    
    const questions = QUESTION_BANK_BY_DIFFICULTY[newDiff];
    const asked = askedQuestions[newDiff];
    const unaskedIndex = questions.findIndex((q) => !asked.includes(q));

    if (unaskedIndex !== -1) {
      setCurrentQuestionIndex(unaskedIndex);
    } else {
      setCurrentQuestionIndex(Math.floor(Math.random() * questions.length));
    }
  };

  // Submit & analyze actual user answer
  const handleAnalyzeCommunication = async () => {
    const textToEvaluate = inputSentence.trim();

    // Validation: Empty answer check
    if (!textToEvaluate) {
      setShowValidationPopup(true);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
      return;
    }

    if (isAnalyzing) return;

    if (isRecording && speechRecognition) {
      speechRecognition.stop();
      setIsRecording(false);
    }

    setIsAnalyzing(true);
    try {
      const res = await evaluateAnswerWithAI(currentQuestion, textToEvaluate, 'HR', difficulty, feedbackLanguage, undefined, user);

      if (feedback && feedback.confidenceScore !== undefined) {
        setPreviousScore(feedback.confidenceScore);
        setNewScore(res.confidenceScore);
        setHasAttemptedAgain(true);
      } else {
        setPreviousScore(null);
        setNewScore(null);
        setHasAttemptedAgain(false);
      }

      setFeedback(res);
      setViewState('result');

      if (user?.id) {
        SupabaseService.saveCommunicationProgress(user.id, {
          topic: currentQuestion,
          difficulty: difficulty,
          score: res.confidenceScore,
          feedback: res
        });
      }

      recordUserActivity('communication', `AI Communication Practice (${difficulty})`, res.confidenceScore, 'Communication');

      // Immediate viewport alignment to top of result
      setTimeout(() => {
        if (resultContainerRef.current) {
          resultContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);

    } catch (err) {
      console.error('Error analyzing communication:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Action: ← Try Again
  const handleTryAgain = () => {
    setInputSentence('');
    setViewState('input');
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
      window.scrollTo({ top: 150, behavior: 'smooth' });
    }, 100);
  };

  // Action: Next Question →
  const handleNextQuestion = () => {
    setAskedQuestions((prev) => ({
      ...prev,
      [difficulty]: [...prev[difficulty], currentQuestion]
    }));

    setFeedback(null);
    setInputSentence('');
    setViewState('input');
    setHasAttemptedAgain(false);
    setPreviousScore(null);
    setNewScore(null);

    setCurrentQuestionIndex((prev) => (prev + 1) % currentQuestionList.length);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dynamic feedback details generator tailored to ACTUAL user answer + question
  const getDynamicFeedbackDetails = () => {
    if (!feedback) return { good: '', wrong: '', tip: '', relevanceStatus: '' };

    const rawInput = inputSentence.trim();
    const words = rawInput.split(/\s+/).length;
    const lower = rawInput.toLowerCase();
    const qLower = currentQuestion.toLowerCase();

    let good = '';
    let wrong = '';
    let tip = '';
    let relevanceStatus = '';

    // Check relevance to question
    const questionKeywords = qLower.split(' ').filter(w => w.length > 3 && !['what', 'where', 'your', 'tell', 'about', 'would', 'have'].includes(w));
    const hasKeywordMatch = questionKeywords.some(k => lower.includes(k));

    if (!hasKeywordMatch && words > 3 && !qLower.includes('name')) {
      relevanceStatus = `Your answer does not directly address "${currentQuestion}". Try to focus specifically on the topic requested.`;
    } else {
      relevanceStatus = `Your response directly aligns with the question prompt.`;
    }

    // Evaluate What Was Good
    if (feedback.confidenceScore >= 80) {
      good = `Excellent answer! You directly addressed "${currentQuestion}" with clear technical terminology and logical structure.`;
    } else if (words >= 5) {
      good = `Your core intent and main point were clearly understandable.`;
    } else {
      good = `You introduced your thought directly without delay.`;
    }

    // Evaluate What Was Wrong
    if (feedback.grammarScore >= 85 && !lower.includes('myself')) {
      wrong = `No major grammar mistakes found! Your sentence structure, verb tenses, and word choices are correct.`;
    } else if (lower.includes('myself')) {
      wrong = `Avoid starting your response with "Myself [Name]". In professional communication, use "My name is" or "I am".`;
    } else if (feedback.grammarScore < 80) {
      wrong = `There are minor grammatical/preposition errors in your sentence structure.`;
    } else if (words < 6) {
      wrong = `Your answer is very brief. Expand slightly with 1-2 supporting details or examples.`;
    } else {
      wrong = `No major grammar mistakes found! Your sentence structure is clear and grammatically sound.`;
    }

    // AI Communication Tip
    if (difficulty === 'Easy') {
      tip = `Keep your answer clear, friendly, and complete. State your point directly in 1-2 clean sentences.`;
    } else if (difficulty === 'Medium') {
      tip = `Structure your answer: 1) Direct answer -> 2) Supporting technical project detail -> 3) Summary statement.`;
    } else {
      tip = `Use the STAR format (Situation, Task, Action, Result) with quantitative metrics to sound interview-ready.`;
    }

    return { good, wrong, tip, relevanceStatus };
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-6 max-w-6xl w-full mx-auto py-4 px-4 sm:px-8 relative animate-in fade-in duration-300">
      
      {/* Session Resume Modal */}
      <SessionResumeModal
        isOpen={showCommModal}
        moduleName="Communication Hub"
        progressText="Ongoing communication practice active."
        onContinue={() => setShowCommModal(false)}
        onExit={() => setShowCommModal(false)}
      />

      {/* Professional Empty Input Validation Popup */}
      {showValidationPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card rounded-3xl p-6 max-w-md w-full border border-amber-500/40 bg-slate-900 text-white shadow-2xl space-y-4 text-center relative overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-white font-['Space_Grotesk']">
                Answer Required
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                Please enter or speak your answer before analyzing.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowValidationPopup(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-md cursor-pointer transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Ambient Lighting Glows */}
      <div className="absolute -top-24 -left-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none dark:opacity-100 opacity-25" />
      <div className="absolute -bottom-24 -right-20 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none dark:opacity-100 opacity-25" />

      {/* 1. HERO HEADER */}
      <div className="animated-border-glow-wrapper">
        <div className="relative overflow-hidden rounded-[23px] bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-950 p-5 sm:p-7 text-white border-0 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-cyan-200 text-xs font-bold backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span>AI Communication Coach</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-['Space_Grotesk'] flex items-center gap-2 text-white">
                <span>🗣️ Communication Hub</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-100 dark:text-slate-300 font-medium leading-relaxed">
                Practice naturally. Speak confidently. Improve with AI.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('dashboard')}
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-red-500/20 text-white hover:text-red-300 border border-white/20 hover:border-red-400 text-xs font-extrabold flex items-center gap-1.5 backdrop-blur-xl transition-all cursor-pointer shrink-0 self-start sm:self-center"
              title="Exit to Dashboard"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. DIFFICULTY SELECTOR */}
      <div className="glass-card rounded-2xl p-2.5 border border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl shadow-md flex items-center justify-between gap-2">
        <span className="text-xs font-extrabold text-slate-600 dark:text-slate-400 px-3 uppercase tracking-wider hidden sm:block">
          Difficulty:
        </span>
        <div className="grid grid-cols-3 gap-2 w-full sm:w-auto flex-1 max-w-md">
          {(['Easy', 'Medium', 'Hard'] as DifficultyLevel[]).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => handleSelectDifficulty(level)}
              className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center ${
                difficulty === level
                  ? level === 'Easy'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 scale-[1.02]'
                    : level === 'Medium'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 scale-[1.02]'
                    : 'bg-purple-600 text-white shadow-md shadow-purple-600/25 scale-[1.02]'
                  : 'bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {level === 'Easy' ? '🟢 Easy' : level === 'Medium' ? '🔵 Medium' : '🟣 Hard'}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW STATE 1: INPUT STATE */}
      {viewState === 'input' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* COMPACT QUESTION CARD */}
          <div className="glass-card rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-purple-500/20 bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl shadow-xl space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-500" />
                <span className="text-xs font-extrabold text-blue-600 dark:text-cyan-400 uppercase tracking-wider">
                  AI Communication Question • {difficulty} Level
                </span>
              </div>
            </div>

            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk'] leading-snug">
              "{currentQuestion}"
            </h2>
          </div>

          {/* USER RESPONSE AREA (Type OR Speak) */}
          <div className="glass-card rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-purple-500/20 bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                ⌨️ Type or 🎤 Speak your response:
              </label>

              <button
                type="button"
                onClick={toggleRecording}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse shadow-red-500/30'
                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isRecording ? 'Stop Recording' : '🎤 Start Speaking'}</span>
              </button>
            </div>

            {/* Recording Animation Indicator */}
            {isRecording && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-extrabold flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  <span>Listening... Speak naturally in English. Words will appear live below.</span>
                </div>
                <button
                  type="button"
                  onClick={toggleRecording}
                  className="px-2 py-0.5 rounded bg-red-500 text-white text-[10px] font-extrabold"
                >
                  Stop
                </button>
              </div>
            )}

            {voiceNotice && !isRecording && (
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-cyan-400 text-xs font-semibold">
                <span>{voiceNotice}</span>
              </div>
            )}

            <textarea
              ref={textareaRef}
              rows={4}
              value={inputSentence}
              onChange={(e) => setInputSentence(e.target.value)}
              placeholder="Type what you want to say... (or click 🎤 Start Speaking)"
              className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all leading-relaxed"
            />

            <button
              onClick={handleAnalyzeCommunication}
              disabled={isAnalyzing}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-blue-600/25 transition-all duration-300 ease-out hover:scale-[1.01] active:scale-98 cursor-pointer disabled:opacity-50 border border-cyan-400/30"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Analyzing Communication with AI...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-white" />
                  <span>Analyze My Communication →</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* VIEW STATE 2: PREMIUM COMPACT RESULT STATE */}
      {viewState === 'result' && feedback && (
        <div ref={resultContainerRef} className="space-y-5 animate-in slide-in-from-bottom-3 duration-300">
          
          {/* Try Again Score Comparison Toast */}
          {hasAttemptedAgain && previousScore !== null && newScore !== null && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>Great improvement! 🎉 Previous Score: <strong>{previousScore}%</strong> → New Score: <strong className="text-emerald-400">{newScore}%</strong></span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] uppercase font-black">
                +{Math.max(0, newScore - previousScore)}% Boost
              </span>
            </div>
          )}

          {/* MAIN PREMIUM SCORE & FEEDBACK CARD */}
          <div className="rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white border border-indigo-500/30 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Header: PREMIUM SCORE GAUGE + Feedback Language Selector */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-5">
              
              {/* Circular Score Indicator */}
              <div className="flex items-center gap-5">
                <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="7" className="text-slate-800" fill="transparent" />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke={feedback.confidenceScore >= 80 ? '#22C55E' : feedback.confidenceScore >= 60 ? '#F59E0B' : '#EF4444'}
                      strokeWidth="7"
                      className="transition-all duration-1000 ease-out"
                      strokeDasharray={201}
                      strokeDashoffset={201 - (201 * feedback.confidenceScore) / 100}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <span className="absolute text-xl font-black text-white tracking-tight">
                    {feedback.confidenceScore}%
                  </span>
                </div>

                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                    {feedback.communicationRating} Rating
                  </span>
                  <h3 className="text-lg font-extrabold text-white font-['Space_Grotesk']">
                    Overall Communication Score
                  </h3>
                  <p className="text-xs text-slate-400 font-medium line-clamp-1">
                    Question: "{currentQuestion}"
                  </p>
                </div>
              </div>

              {/* FEEDBACK LANGUAGE SELECTOR */}
              <div className="p-1 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setFeedbackLanguage('English')}
                  className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    feedbackLanguage === 'English'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackLanguage('Tanglish')}
                  className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    feedbackLanguage === 'Tanglish'
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tanglish
                </button>
              </div>
            </div>

            {/* Dynamic AI Feedback Details */}
            {(() => {
              const details = getDynamicFeedbackDetails();
              return (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      AI Feedback & Relevance Breakdown ({feedbackLanguage})
                    </span>

                    <div className="space-y-2 text-xs font-medium text-slate-200">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>What was good:</strong> {details.good}</span>
                      </div>

                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span><strong>Grammar & Improvement:</strong> {details.wrong}</span>
                      </div>

                      <div className="flex items-start gap-2 pt-2 border-t border-slate-800">
                        <BookOpen className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <span><strong>Rule / Explanation:</strong> {feedbackLanguage === 'Tanglish' ? feedback.tanglishExplanation : feedback.englishExplanation}</span>
                      </div>
                    </div>
                  </div>

                  {/* Question-Specific Best Answer */}
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold text-xs">
                      <Award className="w-4 h-4" />
                      <span>Best Answer (Interview Ready)</span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-emerald-100 leading-relaxed">
                      "{generateQuestionSpecificBestAnswer(currentQuestion, inputSentence, difficulty)}"
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* ACTION BUTTONS WITH GLOW & SHINE EFFECTS */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-800">
              
              {/* Secondary Action: ← Try Again */}
              <button
                type="button"
                onClick={handleTryAgain}
                className="px-5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-white hover:text-cyan-200 border border-slate-700 hover:border-cyan-500/40 shadow-md hover:scale-[1.02] active:scale-98 transition-all duration-300 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-slate-300" />
                <span>← Try Again</span>
              </button>

              {/* Primary Action: Next Question → with Glow */}
              <button
                type="button"
                onClick={handleNextQuestion}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-xl shadow-blue-600/30 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-98 transition-all duration-300 cursor-pointer border border-cyan-400/30"
              >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default CommunicationView;
