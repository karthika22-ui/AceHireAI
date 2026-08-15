import React, { useState, useEffect, useRef } from 'react';
import {
  BrainCircuit,
  CheckCircle2,
  XCircle,
  Timer,
  Globe,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Award,
  Play,
  LogOut
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { APTITUDE_BANK } from '../../services/aiEngine';
import { AptitudeCategory, AptitudeQuestion, DifficultyLevel } from '../../types';
import { SessionResumeModal } from '../Common/SessionResumeModal';

export const AptitudeView: React.FC = () => {
  const { user, recordUserActivity, setActiveTab } = useApp();

  const [category, setCategory] = useState<AptitudeCategory>('Quantitative');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Easy');
  
  // Difficulty Config Helper:
  // Easy: 10 minutes (600s), 20 questions
  // Medium: 15 minutes (900s), 25 questions
  // Hard: 20 minutes (1200s), 30 questions
  const getSessionConfig = (diff: DifficultyLevel) => {
    switch (diff) {
      case 'Easy':
        return { totalQuestions: 20, timeSeconds: 600, label: '10 Minutes • 20 Questions' };
      case 'Medium':
        return { totalQuestions: 25, timeSeconds: 900, label: '15 Minutes • 25 Questions' };
      case 'Hard':
        return { totalQuestions: 30, timeSeconds: 1200, label: '20 Minutes • 30 Questions' };
      default:
        return { totalQuestions: 20, timeSeconds: 600, label: '10 Minutes • 20 Questions' };
    }
  };

  // Helper to generate dynamic questions list matching targetCount
  const getQuizQuestions = (cat: AptitudeCategory, diff: DifficultyLevel, count: number): AptitudeQuestion[] => {
    const base = APTITUDE_BANK.filter((q) => q.category === cat && q.difficulty === diff);
    const pool = base.length > 0 ? base : APTITUDE_BANK.filter((q) => q.category === cat);
    const source = pool.length > 0 ? pool : APTITUDE_BANK;

    return Array.from({ length: count }, (_, i) => {
      const item = source[i % source.length];
      return {
        ...item,
        id: `${item.id}-dyn-${i + 1}`
      };
    });
  };

  // Quiz Flow States
  const [quizQuestions, setQuizQuestions] = useState<AptitudeQuestion[]>([]);
  const [isQuizStarted, setIsQuizStarted] = useState<boolean>(false);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [langView, setLangView] = useState<'Tanglish' | 'English'>(user.preferredLanguage);
  
  // Overall Timer State for entire test
  const [timer, setTimer] = useState<number>(() => getSessionConfig('Easy').timeSeconds);
  const [timeUpMessage, setTimeUpMessage] = useState<string | null>(null);

  // Track Answers & Quiz Results
  const [userAnswers, setUserAnswers] = useState<Array<{ isCorrect: boolean; selectedIdx: number | null }>>([]);
  const [isQuizCompleted, setIsQuizCompleted] = useState<boolean>(false);
  const [quizStartTime, setQuizStartTime] = useState<number>(() => Date.now());

  // Session Persistence States
  const [showContinuePrompt, setShowContinuePrompt] = useState<boolean>(false);
  const [pendingSession, setPendingSession] = useState<{
    category: AptitudeCategory;
    difficulty: DifficultyLevel;
    currentIdx: number;
    timer: number;
    userAnswers: Array<{ isCorrect: boolean; selectedIdx: number | null }>;
    isQuizStarted: boolean;
    selectedIndex: number | null;
    showExplanation: boolean;
    quizStartTime: number;
  } | null>(null);

  // Prevent multiple timer interval execution
  const timeUpLockRef = useRef<boolean>(false);

  const currentConfig = getSessionConfig(difficulty);
  const totalQuestionCount = quizQuestions.length > 0 ? quizQuestions.length : currentConfig.totalQuestions;
  const q: AptitudeQuestion = quizQuestions[currentIdx] || APTITUDE_BANK[0];

  useEffect(() => {
    setLangView(user.preferredLanguage);
  }, [user.preferredLanguage]);

  const handleContinueSession = () => {
    if (pendingSession) {
      setCategory(pendingSession.category);
      setDifficulty(pendingSession.difficulty);
      const conf = getSessionConfig(pendingSession.difficulty);
      const generated = getQuizQuestions(pendingSession.category, pendingSession.difficulty, conf.totalQuestions);
      setQuizQuestions(generated);
      setCurrentIdx(pendingSession.currentIdx);
      setTimer(pendingSession.timer);
      setUserAnswers(pendingSession.userAnswers);
      setSelectedIndex(pendingSession.selectedIndex);
      setShowExplanation(pendingSession.showExplanation);
      setQuizStartTime(pendingSession.quizStartTime);
      setIsQuizStarted(true);
    }
    setShowContinuePrompt(false);
    setPendingSession(null);
  };

  const handleExitSession = () => {
    setShowContinuePrompt(false);
    setPendingSession(null);
    setIsQuizStarted(false);
    resetQuizState();
  };

  // Overall Timer Countdown Effect (Runs for the entire test duration)
  useEffect(() => {
    let interval: any;
    if (isQuizStarted && !isQuizCompleted && !timeUpMessage && !showContinuePrompt && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleOverallTimerExpiry();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isQuizStarted, isQuizCompleted, timeUpMessage, showContinuePrompt, timer]);

  const handleOverallTimerExpiry = () => {
    if (timeUpLockRef.current) return;
    timeUpLockRef.current = true;

    setTimeUpMessage("Overall Time Up! Submitting aptitude test...");

    setTimeout(() => {
      setTimeUpMessage(null);
      timeUpLockRef.current = false;
      setIsQuizCompleted(true);
    }, 1200);
  };

  const handleStartQuiz = () => {
    const conf = getSessionConfig(difficulty);
    const generated = getQuizQuestions(category, difficulty, conf.totalQuestions);
    setQuizQuestions(generated);
    setIsQuizStarted(true);
    setCurrentIdx(0);
    setSelectedIndex(null);
    setShowExplanation(false);
    setTimer(conf.timeSeconds);
    setUserAnswers([]);
    setIsQuizCompleted(false);
    setTimeUpMessage(null);
    timeUpLockRef.current = false;
    setQuizStartTime(Date.now());
  };

  const handleSelectCategory = (cat: AptitudeCategory) => {
    setCategory(cat);
    setIsQuizStarted(false);
    resetQuizState();
  };

  const handleSelectDifficulty = (diff: DifficultyLevel) => {
    setDifficulty(diff);
    setIsQuizStarted(false);
    resetQuizState();
  };

  const resetQuizState = () => {
    setCurrentIdx(0);
    setSelectedIndex(null);
    setShowExplanation(false);
    const conf = getSessionConfig(difficulty);
    setTimer(conf.timeSeconds);
    setUserAnswers([]);
    setIsQuizCompleted(false);
    setTimeUpMessage(null);
    timeUpLockRef.current = false;
    setQuizStartTime(Date.now());
  };

  const handleSelectOption = (index: number) => {
    if (isQuizCompleted) return;
    setSelectedIndex(index);
    setShowExplanation(true);

    const isCorrect = index === q.correctIndex;
    setUserAnswers((prev) => {
      const updated = [...prev];
      updated[currentIdx] = { isCorrect, selectedIdx: index };
      return updated;
    });

    const scoreVal = isCorrect ? 90 : 40;
    recordUserActivity('aptitude', `${category} (${difficulty}) Question ${currentIdx + 1}`, scoreVal, 'Aptitude');
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      const prevIdx = currentIdx - 1;
      setCurrentIdx(prevIdx);
      const existingAnswer = userAnswers[prevIdx];
      setSelectedIndex(existingAnswer ? existingAnswer.selectedIdx : null);
      setShowExplanation(existingAnswer !== undefined && existingAnswer !== null);
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 < totalQuestionCount) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      const existingAnswer = userAnswers[nextIdx];
      setSelectedIndex(existingAnswer ? existingAnswer.selectedIdx : null);
      setShowExplanation(existingAnswer !== undefined && existingAnswer !== null);
    }
  };

  const handleSubmitQuiz = () => {
    setIsQuizCompleted(true);
  };

  // Helper to format remaining timer in MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate Result Summary Metrics
  const totalQuestions = totalQuestionCount;
  const answeredCount = userAnswers.filter((a) => a !== undefined && a !== null && a.selectedIdx !== null).length;
  const correctCount = userAnswers.filter((a) => a && a.isCorrect).length;
  const wrongCount = totalQuestions - correctCount;
  const scorePercent = Math.round((correctCount / totalQuestions) * 100);
  const totalTimeTakenSeconds = Math.round((Date.now() - quizStartTime) / 1000);
  const timeTakenFormatted = `${Math.floor(totalTimeTakenSeconds / 60)}m ${totalTimeTakenSeconds % 60}s`;

  return (
    <div className="flex-1 overflow-y-auto space-y-6 max-w-4xl mx-auto pb-12 pr-1 animate-in fade-in relative">
      
      {/* Centered Full-Screen Backdrop-Blur Overlay Modal for Timer Expiry */}
      {timeUpMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 w-14 h-14 mx-auto flex items-center justify-center border border-amber-500/30">
              <Timer className="w-8 h-8 animate-bounce text-amber-400" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white font-['Space_Grotesk'] tracking-wide">
                Time Up!
              </h3>
              <p className="text-sm font-medium text-slate-300">
                {timeUpMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Session Continuation Modal */}
      <SessionResumeModal
        isOpen={showContinuePrompt && !!pendingSession}
        moduleName="Aptitude Practice"
        progressText={
          pendingSession
            ? `You are currently on Question ${pendingSession.currentIdx + 1} of ${totalQuestionCount} (${pendingSession.category} - ${pendingSession.difficulty})`
            : ''
        }
        onContinue={handleContinueSession}
        onExit={handleExitSession}
      />

      {/* Top Banner & Selectors */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold mb-2">
              <BrainCircuit className="w-4 h-4" />
              <span>Placement Aptitude & Reasoning Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
              Aptitude Practice Hub
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Master Quantitative, Logical & Verbal rounds with instant practice rounds.
            </p>
          </div>

          {/* Category Selector & Exit Button */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              {(['Quantitative', 'Logical', 'Verbal'] as AptitudeCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleSelectCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    category === cat
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setActiveTab('dashboard');
              }}
              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Exit to Dashboard"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>
          </div>
        </div>

        {/* Difficulty Selector below Category Selector */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Select Difficulty:
          </span>

          <div className="flex items-center gap-1.5">
            {(['Easy', 'Medium', 'Hard'] as DifficultyLevel[]).map((diff) => (
              <button
                key={diff}
                onClick={() => handleSelectDifficulty(diff)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  difficulty === diff
                    ? diff === 'Easy'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                      : diff === 'Medium'
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40'
                      : 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/40'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent hover:border-slate-300'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* STEP 1: PRE-QUIZ LANDING CARD (When quiz is not started) */}
      {!isQuizStarted && !isQuizCompleted && (
        <div className="glass-card rounded-3xl p-8 sm:p-10 border text-center space-y-6">
          <div className="p-4 rounded-3xl bg-amber-500/10 text-amber-500 w-16 h-16 mx-auto flex items-center justify-center border border-amber-500/30">
            <BrainCircuit className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-['Space_Grotesk']">
              Ready to Start {category} Aptitude?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Selected Level: <span className="font-bold text-amber-500">{difficulty}</span> • {currentConfig.label}
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleStartQuiz}
              className="px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm inline-flex items-center gap-2 shadow-xl hover:shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Aptitude</span>
            </button>
          </div>
        </div>
      )}

      {/* RESULT SUMMARY CARD (Displayed after test completed) */}
      {isQuizCompleted && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border space-y-6 animate-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/30">
                <Award className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                  Aptitude Quiz Result Summary
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {category} Practice • {difficulty} Difficulty
                </p>
              </div>
            </div>

            <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 font-black text-sm">
              Score: {scorePercent}%
            </span>
          </div>

          {/* Stats Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white block">{totalQuestions}</span>
              <span className="text-[11px] font-bold text-slate-500 uppercase">Total Questions</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 block">{correctCount}</span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Correct Answers</span>
            </div>

            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-1">
              <span className="text-2xl font-black text-red-600 dark:text-red-400 block">{wrongCount}</span>
              <span className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase">Wrong / Unanswered</span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-1">
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400 block">{timeTakenFormatted}</span>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase">Time Taken</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={handleStartQuiz}
              className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Quiz</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <span>Back to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE QUIZ QUESTION CARD (Only shown after clicking "Start Aptitude") */}
      {isQuizStarted && !isQuizCompleted && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold">
                {category} - {difficulty}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Question {currentIdx + 1} of {totalQuestionCount}
              </span>
            </div>

            {/* Overall Countdown Timer */}
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 shadow-sm animate-pulse">
              <Timer className="w-4 h-4 text-amber-500" />
              <span>{formatTimer(timer)} remaining</span>
            </div>
          </div>

          {/* Progress Indicator Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
              <span>Overall Progress</span>
              <span>Question {currentIdx + 1} / {totalQuestionCount} • ({answeredCount} Answered)</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                style={{ width: `${((currentIdx + 1) / totalQuestionCount) * 100}%` }}
              />
            </div>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed pt-2">
            {q.question}
          </h2>

          {/* Options List */}
          <div className="space-y-3">
            {q.options.map((opt, idx) => {
              const isSelected = selectedIndex === idx;
              const isCorrect = idx === q.correctIndex;
              let btnStyle = 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-amber-400';

              if (showExplanation) {
                if (isCorrect) {
                  btnStyle = 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold';
                } else if (isSelected) {
                  btnStyle = 'bg-red-500/10 border-red-500 text-red-700 dark:text-red-300 font-bold';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isQuizCompleted}
                  className={`w-full p-4 rounded-2xl border text-left text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {showExplanation && (
                    <span>
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : isSelected ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : null}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Card */}
          {showExplanation && (
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-3 animate-in slide-in-from-bottom-2 text-white shadow-2xl">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-extrabold flex items-center gap-1.5 ${
                  selectedIndex === q.correctIndex ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {selectedIndex === q.correctIndex ? '✅ Correct' : '❌ Incorrect'}
                </span>
                <button
                  onClick={() => setLangView(langView === 'Tanglish' ? 'English' : 'Tanglish')}
                  className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Switch Explanation: {langView}</span>
                </button>
              </div>

              {selectedIndex !== q.correctIndex && (
                <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs">
                  <span className="font-extrabold text-amber-400 block mb-0.5">Correct Answer:</span>
                  <span className="font-semibold text-white">"{q.options[q.correctIndex]}"</span>
                </div>
              )}

              <div className="space-y-1 pt-1">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                  AI Explanation ({langView}):
                </span>
                <p className="text-xs sm:text-sm font-medium text-slate-200 leading-relaxed">
                  {langView === 'Tanglish' ? q.explanationTanglish : q.explanationEnglish}
                </p>
                <div className="pt-2 text-xs text-amber-400/90 italic flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Explanation will be available after backend integration.</span>
                </div>
              </div>
            </div>
          )}

          {/* Persistent Question Navigation & Early Submission Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div>
              {currentIdx > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous Question</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              {currentIdx + 1 < totalQuestionCount ? (
                <button
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg hover:shadow-emerald-600/30 cursor-pointer transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Quiz ({answeredCount}/{totalQuestionCount})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
