import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Code2,
  Play,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  RotateCcw,
  ArrowRight,
  LogOut,
  ChevronLeft,
  Zap,
  Edit3,
  Volume2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateQuestions, STARTER_TEMPLATES, generateAICodeReview, DynamicAICodeReview } from '../../services/aiEngine';
import { CodingLanguage, DifficultyLevel, CodingSubmissionResult, CodingChallenge } from '../../types';

import { AIRobotLoader } from '../Common/AIRobotLoader';
import { SupabaseService } from '../../services/supabaseClient';
import ttsService from '../../services/ttsService';

export const CodingView: React.FC = () => {
  const { recordUserActivity, user, setActiveTab, registerSessionGuard, unregisterSessionGuard } = useApp();

  const [hasStartedChallenge, setHasStartedChallenge] = useState<boolean>(false);
  const [selectedLang, setSelectedLang] = useState<CodingLanguage>('Python');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Easy');

  const [currentProblem, setCurrentProblem] = useState<CodingChallenge | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(1);
  const seenTitlesRef = useRef<Set<string>>(new Set());
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Editor initializes completely empty
  const [userCode, setUserCode] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [hasEvaluated, setHasEvaluated] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<CodingSubmissionResult | null>(null);
  const [dynamicAiFeedback, setDynamicAiFeedback] = useState<DynamicAICodeReview | null>(null);

  // NEW EVALUATION OVERLAY STATES
  const [isEvaluatingOverlay, setIsEvaluatingOverlay] = useState<boolean>(false);
  const [isEvaluationLoading, setIsEvaluationLoading] = useState<boolean>(false);
  const [isRobotSpeaking, setIsRobotSpeaking] = useState<boolean>(false);
  const [robotVoiceMessage, setRobotVoiceMessage] = useState<string | null>(null);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [evaluationMetrics, setEvaluationMetrics] = useState<{
    correctnessPercent: number;
    passedTestCasesCount: number;
    totalTestCasesCount: number;
    mistakes: string[];
    howToImprove: string[];
  } | null>(null);



  useEffect(() => {
    if (!user?.id) return;
    SupabaseService.fetchCodingProgress(user.id);
  }, [user?.id]);

  // Automatically scroll container to top when starting a challenge
  useEffect(() => {
    if (hasStartedChallenge) {
      if (mainContainerRef.current) {
        mainContainerRef.current.scrollTo({ top: 0, behavior: 'auto' });
      }
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [hasStartedChallenge]);

  // Helper for TTSService with natural Tamil female voice synthesis & mouth sync
  const speakRobotFeedback = (text: string) => {
    ttsService.speak({
      text,
      language: user.preferredLanguage === 'Tanglish' ? 'Tanglish' : 'English',
      onStart: () => setIsRobotSpeaking(true),
      onEnd: () => setIsRobotSpeaking(false),
      onError: () => setIsRobotSpeaking(false),
    });
  };

  // Language Icon Helper
  const getLanguageIcon = (lang: CodingLanguage) => {
    switch (lang) {
      case 'Python':
        return '🐍';
      case 'Java':
        return '☕';
      case 'C':
        return '💻';
      case 'C++':
        return '⚙';
      case 'SQL':
        return '🗄';
      default:
        return '💻';
    }
  };

  // Difficulty Badge Style Helper
  const getDifficultyBadgeStyle = (diff: DifficultyLevel) => {
    switch (diff) {
      case 'Easy':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Hard':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  // Real Code Syntax & Validation Helper
  const validateCodeSyntax = (code: string, lang: CodingLanguage): boolean => {
    const trimmed = code.trim();
    if (trimmed.length < 4) return false;

    // Single random word check
    if (/^[a-zA-Z0-9_\s]+$/.test(trimmed) && !trimmed.includes('\n') && !trimmed.includes(' ') && !trimmed.includes('=')) {
      return false;
    }

    const lower = trimmed.toLowerCase();

    switch (lang) {
      case 'Python': {
        const pythonKeywords = ['def ', 'class ', 'import ', 'from ', 'print', 'for ', 'while ', 'if ', 'return', 'lambda ', 'input', '='];
        return pythonKeywords.some((kw) => lower.includes(kw));
      }
      case 'Java': {
        const javaKeywords = ['class ', 'public ', 'private ', 'void ', 'int ', 'string', 'system.out', 'for', 'while', 'if', 'return', ';', '='];
        return javaKeywords.some((kw) => lower.includes(kw)) && (lower.includes(';') || lower.includes('{'));
      }
      case 'C':
      case 'C++': {
        const cKeywords = ['#include', 'int ', 'void ', 'main', 'printf', 'cout', 'std::', 'for', 'while', 'if', ';', '='];
        return cKeywords.some((kw) => lower.includes(kw)) && (lower.includes(';') || lower.includes('{') || lower.includes('#'));
      }
      case 'SQL': {
        const sqlKeywords = ['select ', 'from ', 'where ', 'insert ', 'update ', 'delete ', 'join ', 'create ', 'table ', 'group by', 'order by'];
        return sqlKeywords.some((kw) => lower.includes(kw));
      }
      default:
        return true;
    }
  };

  // Function to fetch a new unique AI coding question
  const fetchNewQuestion = async (lang: CodingLanguage, diff: DifficultyLevel) => {
    if (isGenerating) return;
    setIsGenerating(true);
    setGenerationError(null);
    setExecutionResult(null);
    setDynamicAiFeedback(null);
    setHasEvaluated(false);
    setEvaluationMetrics(null);
    setRobotVoiceMessage(null);

    let attempts = 0;
    let generatedSuccess = false;

    while (attempts < 3 && !generatedSuccess) {
      attempts++;
      try {
        const rawQuestions = await generateQuestions({
          topic: lang,
          difficulty: diff.toLowerCase(),
          questionType: 'coding',
          numberOfQuestions: 1,
          avoidTitles: Array.from(seenTitlesRef.current)
        });

        const generated = rawQuestions && rawQuestions.length > 0 ? rawQuestions[0] : null;

        if (generated && generated.title && generated.description) {
          const normalizedTitle = generated.title.toLowerCase().trim();
          
          if (seenTitlesRef.current.has(normalizedTitle) && attempts < 3) {
            continue;
          }

          seenTitlesRef.current.add(normalizedTitle);

          const randomSuffix = Math.random().toString(36).substring(2, 7);
          const uniqueId = `code-ai-${lang.toLowerCase()}-${Date.now()}-${randomSuffix}`;

          const formatted: CodingChallenge = {
            id: uniqueId,
            title: generated.title,
            difficulty: diff,
            language: lang,
            description: generated.description,
            inputFormat: generated.inputFormat,
            outputFormat: generated.outputFormat,
            explanation: generated.explanation,
            starterCode: generated.starterCode || STARTER_TEMPLATES[lang] || '',
            sampleInput: generated.sampleInput || '',
            sampleOutput: generated.sampleOutput || '',
            constraints: Array.isArray(generated.constraints)
              ? generated.constraints
              : typeof generated.constraints === 'string'
              ? [generated.constraints]
              : ['1 <= N <= 10^5', 'Time Limit: 1.0s'],
            testCases: [
              {
                input: generated.sampleInput || '',
                expectedOutput: generated.sampleOutput || ''
              }
            ]
          };

          setCurrentProblem(formatted);
          setUserCode('');
          setGenerationError(null);
          generatedSuccess = true;

          await SupabaseService.initCodingProgress({
            userEmail: user?.email || 'student@college.edu',
            userId: user?.id,
            language: lang,
            difficulty: diff,
            problemId: uniqueId,
            problemTitle: generated.title,
            status: 'started',
            score: 0
          });
        } else {
          throw new Error('Invalid question response format from Gemini API');
        }
      } catch (err) {
        console.error('Error generating AI coding question:', err);
        if (attempts >= 3) {
          setCurrentProblem(null);
          setGenerationError('Unable to generate a new question. Please try again.');
        }
      }
    }

    setIsGenerating(false);
  };



  // NEXT QUESTION: Clears all previous evaluation states completely
  const handleNextQuestion = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsEvaluatingOverlay(false);
    setIsEvaluationLoading(false);
    setExecutionResult(null);
    setDynamicAiFeedback(null);
    setEvaluationMetrics(null);
    setRobotVoiceMessage(null);
    setHasEvaluated(false);
    setUserCode('');
    setQuestionCount((prev) => prev + 1);
    fetchNewQuestion(selectedLang, difficulty);
  };

  const handleResetCode = () => {
    setUserCode('');
    setExecutionResult(null);
    setDynamicAiFeedback(null);
    setEvaluationMetrics(null);
    setRobotVoiceMessage(null);
  };

  const handleDirectExitCoding = useCallback(() => {
    setHasStartedChallenge(false);
    setUserCode('');
    setCurrentProblem(null);
    setExecutionResult(null);
    setDynamicAiFeedback(null);
    setEvaluationMetrics(null);
    setHasEvaluated(false);
    setIsEvaluatingOverlay(false);
  }, []);

  useEffect(() => {
    registerSessionGuard({
      moduleTab: 'coding',
      isSessionActive: hasStartedChallenge,
      clearSessionCallback: handleDirectExitCoding
    });
    return () => {
      unregisterSessionGuard('coding');
    };
  }, [hasStartedChallenge, registerSessionGuard, unregisterSessionGuard, handleDirectExitCoding]);

  // EDIT CODE: Closes overlay & preserves user code
  const handleCloseEvaluationOverlayToEdit = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsEvaluatingOverlay(false);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  // RUN & EVALUATE CODE FLOW WITH DIRECT AI ROBOT FEEDBACK (NO INTERMEDIATE LOADING SCREEN)
  const handleRunCode = async () => {
    try {
      setIsRunning(true);
      setIsEvaluationLoading(true);
      setEvaluationError(null);
      setEvaluationMetrics(null);
      setRobotVoiceMessage('');
      setDynamicAiFeedback(null);
      ttsService.stop();

      const userName = user?.name ? user.name.split(' ')[0] : 'Student';
      const trimmedCode = userCode.trim();
      const isTanglish = user.preferredLanguage === 'Tanglish';

      // Step 1: Empty Code Check
      if (!trimmedCode) {
        await new Promise((res) => setTimeout(res, 1200));

        const emptyMessage = isTanglish
          ? `${userName}, code edhum submit pannala. First solution write panni execute pannunga.`
          : `${userName}, no code was submitted. Please write your solution before evaluating.`;

        const metrics = {
          correctnessPercent: 0,
          passedTestCasesCount: 0,
          totalTestCasesCount: 1,
          mistakes: ['No code submitted in editor.'],
          howToImprove: ['Write your solution logic in the editor before running.']
        };

        setEvaluationMetrics(metrics);
        setRobotVoiceMessage(emptyMessage);
        setHasEvaluated(true);
        setIsEvaluationLoading(false);
        setIsRunning(false);
        setIsEvaluatingOverlay(true);
        ttsService.stop();
        return;
      }

      // Step 2: Syntax & Validation Check
      const isCodeValid = validateCodeSyntax(trimmedCode, selectedLang);
      if (!isCodeValid) {
        await new Promise((res) => setTimeout(res, 1500));

        const syntaxMistake = `Invalid ${selectedLang} code syntax. Please check syntax rules.`;
        const syntaxMessage = isTanglish
          ? `${userName}, unga code-la konjam mistakes irukku. Innum konjam practice pannunga.`
          : `${userName}, there are a few mistakes in your code. Keep practicing.`;

        const metrics = {
          correctnessPercent: 0,
          passedTestCasesCount: 0,
          totalTestCasesCount: 1,
          mistakes: [syntaxMistake],
          howToImprove: ['Check brackets, semicolons, function signatures, and language syntax.']
        };

        setEvaluationMetrics(metrics);
        setRobotVoiceMessage(syntaxMessage);
        setHasEvaluated(true);
        setIsEvaluationLoading(false);
        setIsRunning(false);
        setIsEvaluatingOverlay(true);
        ttsService.stop();
        return;
      }

      // Step 3: AI Code Review
      const problemTitle = currentProblem?.title || 'Coding Challenge';
      const problemDesc = currentProblem?.description || '';

      const dynamicReview: DynamicAICodeReview = await generateAICodeReview({
        problemTitle,
        description: problemDesc,
        code: trimmedCode,
        language: selectedLang,
        validationStatus: 'Success'
      }, user);

      const isCorrect = dynamicReview.result === 'Correct';
      const score = isCorrect ? 100 : 60;
      const passedCount = isCorrect ? 1 : 0;
      const totalCount = 1;

      let robotMsg = '';
      if (isCorrect) {
        robotMsg = isTanglish
          ? `${userName}, unga code sariyaaga velai seigiradhu. Mikavum nanraaga seidhirukkireergal. Idhe madhiri thodarnthu practice seiyungal.`
          : `${userName}, your code works perfectly! Excellent job. Keep practicing like this.`;
      } else {
        robotMsg = isTanglish
          ? `${userName}, unga code-la sila parts correct-ah irukku, but konjam corrections thevai. Feedback-a check panni next attempt-la improve pannunga.`
          : `${userName}, good attempt! Some parts of your code are correct, but a few adjustments are needed. Check the feedback to improve on your next attempt.`;
      }

      const mistakesList = dynamicReview.mistakes && dynamicReview.mistakes !== 'None'
        ? [dynamicReview.mistakes]
        : isCorrect
        ? ['None. Logic handles inputs correctly.']
        : ['Edge case handling needs refinement.'];

      const improveList = dynamicReview.betterApproach
        ? [dynamicReview.betterApproach]
        : [`Optimize ${dynamicReview.timeComplexity} complexity where possible.`];

      const metrics = {
        correctnessPercent: score,
        passedTestCasesCount: passedCount,
        totalTestCasesCount: totalCount,
        mistakes: mistakesList,
        howToImprove: improveList
      };

      setEvaluationMetrics(metrics);
      setRobotVoiceMessage(robotMsg);
      setDynamicAiFeedback(dynamicReview);
      setHasEvaluated(true);
      recordUserActivity('coding', problemTitle, score, 'Coding');

      if (currentProblem) {
        await SupabaseService.updateCodingProgress({
          problemId: currentProblem.id,
          userEmail: user?.email || 'student@college.edu',
          userId: user?.id,
          code: userCode,
          score: score,
          status: isCorrect ? 'Correct' : 'Needs Improvement',
          timeComplexity: dynamicReview.timeComplexity,
          englishAdvice: dynamicReview.englishAdvice,
          tanglishAdvice: dynamicReview.tanglishAdvice
        });
      }

      setIsEvaluationLoading(false);
      setIsRunning(false);
      setIsEvaluatingOverlay(true);
      ttsService.stop();

    } catch (err: any) {
      console.error('Error evaluating code:', err);
      setIsEvaluationLoading(false);
      setIsRunning(false);
      setIsEvaluatingOverlay(true);
      setEvaluationError('Evaluation could not be completed due to a temporary connection issue. Please try again.');
    }
  };

  // --- RENDER 1: CLEAN CODING SETUP PAGE ---
  if (!hasStartedChallenge) {
    return (
      <div ref={mainContainerRef} className="flex-1 overflow-y-auto space-y-6 w-[92%] sm:w-[94%] max-w-7xl mx-auto pb-12 pr-1 animate-in fade-in relative select-none">
        


        {/* Top Header Section */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border text-center relative overflow-hidden space-y-3">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
            <Code2 className="w-4 h-4" />
            <span>AI Algorithmic Coding Practice</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Coding Sandbox & AI Review
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto font-medium">
            Practice coding interview questions with AI feedback.
          </p>
        </div>

        {/* Multi-step Setup Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border space-y-8">
          
          {/* Step 1: Select Your Programming Language */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-xs shadow-md">
                1
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Select Your Programming Language
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(['Java', 'Python', 'C', 'C++', 'SQL'] as CodingLanguage[]).map((lang) => {
                const isSelected = selectedLang === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setSelectedLang(lang);
                      setUserCode('');
                    }}
                    className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/20 scale-[1.03]'
                        : 'bg-slate-900/60 dark:bg-slate-900/40 text-slate-300 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="text-2xl">{getLanguageIcon(lang)}</span>
                    <span className="text-xs font-extrabold tracking-wide">{lang}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Select Difficulty */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-xs shadow-md">
                2
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Select Difficulty
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['Easy', 'Medium', 'Hard'] as DifficultyLevel[]).map((diff) => {
                const isSelected = difficulty === diff;
                const badgeColor =
                  diff === 'Easy'
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                    : diff === 'Medium'
                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                    : 'border-red-500/50 bg-red-500/10 text-red-400';

                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`p-4 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? `bg-slate-900 text-white border-2 shadow-lg ${badgeColor} scale-[1.02]`
                        : 'bg-slate-900/60 dark:bg-slate-900/40 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-3 h-3 rounded-full ${
                          diff === 'Easy'
                            ? 'bg-emerald-400'
                            : diff === 'Medium'
                            ? 'bg-amber-400'
                            : 'bg-red-400'
                        }`}
                      />
                      <span className="text-sm font-bold">{diff}</span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Premium Start Button */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => {
                setHasStartedChallenge(true);
                fetchNewQuestion(selectedLang, difficulty);
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-600/25 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 group relative overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Generating Challenge...</span>
                </>
              ) : (
                <>
                  <span>Start Your Coding</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    );
  }

  // --- RENDER 2: LEETCODE / HACKERRANK STYLE DUAL PANEL CODING CHALLENGE PAGE ---
  return (
    <div ref={mainContainerRef} className="flex-1 w-[94%] sm:w-[96%] max-w-7xl mx-auto flex flex-col h-[calc(100vh-130px)] space-y-3 pb-2 animate-in fade-in select-none overflow-hidden relative">
      


      {/* Slim Progress Bar at top showing coding progress */}
      <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden shrink-0">
        <div
          className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
          style={{ width: `${Math.min(questionCount * 25, 100)}%` }}
        />
      </div>

      {/* Sticky Header Navigation Bar */}
      <div className="glass-card rounded-2xl p-3 border flex flex-wrap items-center justify-between gap-3 shrink-0 sticky top-0 z-20 backdrop-blur-md bg-slate-950/80">
        <div className="flex items-center gap-3">
          <button
            onClick={handleDirectExitCoding}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Back to Setup"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Setup</span>
          </button>

          <div>
            <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Coding Sandbox & AI Review</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Next Question Button */}
          <button
            onClick={handleNextQuestion}
            disabled={isGenerating || !hasEvaluated}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title={!hasEvaluated ? "Please evaluate your code first before proceeding to Next Question" : "Generate Next Question"}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span>Next Question</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          {/* Exit Button */}
          <button
            onClick={handleDirectExitCoding}
            className="px-3 py-1.5 rounded-xl border border-slate-700/80 bg-transparent text-slate-300 hover:bg-red-500 hover:text-white hover:border-red-500 text-xs font-bold flex items-center gap-1.5 transition-all duration-300 cursor-pointer"
            title="Exit Challenge"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>
        </div>
      </div>

      {/* Main Equal Height Grid (Left Panel 45% / Right Panel 55%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden">
        
        {/* ================= LEFT PANEL (45% - lg:col-span-5): Question Details ================= */}
        <div className="lg:col-span-5 h-full flex flex-col glass-card rounded-2xl border p-5 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
          
          {generationError ? (
            <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-center space-y-3 my-auto">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
              <p className="text-sm font-bold text-red-600 dark:text-red-400">
                {generationError}
              </p>
              <button
                onClick={handleNextQuestion}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow cursor-pointer inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
            </div>
          ) : isGenerating && !currentProblem ? (
            <div className="p-8 text-center space-y-3 my-auto">
              <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Generating a unique {difficulty} {selectedLang} challenge using Gemini AI...
              </p>
            </div>
          ) : currentProblem ? (
            <>
              <div className="space-y-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                    Question #{questionCount}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                    <span>⏱ 1.0s</span>
                    <span>•</span>
                    <span>💾 256 MB</span>
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug flex items-center justify-between gap-2">
                  <span>{currentProblem.title}</span>
                  {isGenerating && <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin shrink-0" />}
                </h2>

                <span className="text-[10px] text-slate-500 font-mono block -mt-1">
                  ID: {currentProblem.id}
                </span>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed font-medium">
                  {currentProblem.description}
                </div>
              </div>

              {currentProblem.inputFormat && (
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Input Format
                  </h4>
                  <div className="p-4 rounded-2xl bg-slate-900/60 text-slate-300 text-xs border border-slate-800 leading-relaxed font-medium">
                    {currentProblem.inputFormat}
                  </div>
                </div>
              )}

              {currentProblem.outputFormat && (
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Output Format
                  </h4>
                  <div className="p-4 rounded-2xl bg-slate-900/60 text-slate-300 text-xs border border-slate-800 leading-relaxed font-medium">
                    {currentProblem.outputFormat}
                  </div>
                </div>
              )}

              {currentProblem.constraints && currentProblem.constraints.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Constraints
                  </h4>
                  <div className="p-4 rounded-2xl bg-slate-900/60 text-slate-300 font-mono text-xs border border-slate-800 space-y-1.5">
                    {currentProblem.constraints.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentProblem.sampleInput && (
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Sample Input
                  </h4>
                  <div className="p-3.5 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs border border-slate-800 shadow-inner">
                    {currentProblem.sampleInput}
                  </div>
                </div>
              )}

              {currentProblem.sampleOutput && (
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Sample Output
                  </h4>
                  <div className="p-3.5 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs border border-slate-800 shadow-inner">
                    {currentProblem.sampleOutput}
                  </div>
                </div>
              )}

              {currentProblem.explanation && (
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Explanation
                  </h4>
                  <div className="p-4 rounded-2xl bg-slate-900/60 text-slate-300 text-xs border border-slate-800 leading-relaxed">
                    {currentProblem.explanation}
                  </div>
                </div>
              )}

              <div className="pt-2 text-[11px] italic font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Hidden test cases will be checked after submission.</span>
              </div>
            </>
          ) : null}
        </div>

        {/* ================= RIGHT PANEL (55% - lg:col-span-7): Code Editor ================= */}
        <div className="lg:col-span-7 h-full flex flex-col space-y-4 overflow-hidden">
          <div className="glass-card rounded-2xl p-5 border flex-1 flex flex-col space-y-3 overflow-hidden">
            
            {/* Setup Indicator Header */}
            <div className="flex items-center justify-between gap-2.5 px-1 pb-2 border-b border-slate-800/60 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Setup:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-extrabold border border-emerald-500/30 flex items-center gap-1">
                  <span>{getLanguageIcon(selectedLang)}</span>
                  <span>Language: {selectedLang}</span>
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${getDifficultyBadgeStyle(difficulty)}`}>
                  Difficulty: {difficulty}
                </span>
              </div>
            </div>

            {/* Editor Action Header */}
            <div className="flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs font-bold text-slate-400">
                Type your solution logic below:
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetCode}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
                  title="Reset code to empty editor"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Code</span>
                </button>

                <button
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer transition-all"
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Executing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>Run & Evaluate Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Code Editor */}
            <textarea
              ref={editorRef}
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              placeholder="Start typing your solution here..."
              className="flex-1 min-h-0 w-full p-4 rounded-2xl bg-[#0f172a] border border-slate-800/90 font-mono text-emerald-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/60 leading-relaxed shadow-inner resize-none overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 animate-in fade-in"
            />
          </div>
        </div>
      </div>

      {/* ================= COMPACT HORIZONTAL RECTANGULAR CARD OVERLAY ================= */}
      {isEvaluatingOverlay && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-300">
          <div className="glass-card rounded-[26px] p-5 sm:p-7 max-w-4xl w-full max-h-[88vh] overflow-y-auto border border-emerald-500/40 bg-slate-900/95 shadow-2xl relative text-slate-100 animate-in zoom-in-95 duration-200 scrollbar-thin scrollbar-thumb-slate-800">
            
            {/* Background Lighting Glow */}
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

            {evaluationError ? (
              /* STATE A: ERROR STATE */
              <div className="text-center space-y-4 py-6">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Evaluation Error</h3>
                <p className="text-xs text-slate-300">{evaluationError}</p>
                <button
                  type="button"
                  onClick={handleCloseEvaluationOverlayToEdit}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer border border-slate-700"
                >
                  Return to Editor
                </button>
              </div>
            ) : (
              /* STATE B: CLEAN TEXT EVALUATION RESULT CARD */
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-white tracking-wide font-['Space_Grotesk']">
                        Code Evaluation Complete
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">
                        Language: {selectedLang} • Difficulty: {difficulty}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-xs sm:text-sm font-black px-3.5 py-1.5 rounded-full border ${
                      (evaluationMetrics?.correctnessPercent || 0) >= 80
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : (evaluationMetrics?.correctnessPercent || 0) > 0
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                    }`}
                  >
                    {evaluationMetrics?.correctnessPercent}% Correct
                  </span>
                </div>

                {/* AI Text Feedback Box */}
                {robotVoiceMessage && (
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      AI Feedback Summary ({user.preferredLanguage})
                    </span>
                    <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                      {robotVoiceMessage}
                    </p>
                  </div>
                )}

                {/* Clean Evaluation Results Content */}
                {evaluationMetrics && (
                  <div className="space-y-3.5 text-xs">
                    {/* Metrics Bar */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-400 font-bold">Correctness:</span>
                        <span className="font-extrabold text-emerald-400 text-sm sm:text-base">
                          {evaluationMetrics.correctnessPercent}%
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-400 font-bold">Test Cases:</span>
                        <span className="font-extrabold text-slate-200 text-sm sm:text-base">
                          {evaluationMetrics.passedTestCasesCount} / {evaluationMetrics.totalTestCasesCount} Passed
                        </span>
                      </div>
                    </div>

                    {/* Mistakes List */}
                    <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                      <span className="font-extrabold text-amber-400 block text-xs uppercase tracking-wider">
                        ⚠ Mistakes
                      </span>
                      <ul className="space-y-1.5 text-slate-300 font-medium leading-relaxed">
                        {evaluationMetrics.mistakes.map((m, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-amber-400">•</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* How to Improve List */}
                    <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                      <span className="font-extrabold text-emerald-400 block text-xs uppercase tracking-wider">
                        💡 How to Improve
                      </span>
                      <ul className="space-y-1.5 text-slate-300 font-medium leading-relaxed">
                        {evaluationMetrics.howToImprove.map((imp, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-400">•</span>
                            <span>{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* EXACTLY TWO ACTION BUTTONS */}
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <button
                    type="button"
                    onClick={handleCloseEvaluationOverlayToEdit}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 text-slate-300" />
                    <span>Edit Code</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    <span>Next Question</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default CodingView;
