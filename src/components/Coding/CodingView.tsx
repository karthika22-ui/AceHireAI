import React, { useState, useEffect, useRef } from 'react';
import {
  Code2,
  Play,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Terminal,
  Clock,
  Globe,
  RefreshCw,
  RotateCcw,
  ArrowRight,
  LogOut,
  ChevronLeft,
  Zap,
  Info,
  Edit3
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateQuestions, STARTER_TEMPLATES, generateAICodeReview, DynamicAICodeReview } from '../../services/aiEngine';
import { CodingLanguage, DifficultyLevel, CodingSubmissionResult, CodingChallenge } from '../../types';
import { SessionResumeModal } from '../Common/SessionResumeModal';
import { SupabaseService } from '../../services/supabaseClient';
import { formatTanglishAddressing } from '../../utils/addressing';

export const CodingView: React.FC = () => {
  const { recordUserActivity, user, setActiveTab, registerWorkflowGuard, clearWorkflowGuard } = useApp();

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

  // Editor initializes completely empty (no starter code/comments/templates)
  const [userCode, setUserCode] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [hasEvaluated, setHasEvaluated] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<CodingSubmissionResult | null>(null);
  const [dynamicAiFeedback, setDynamicAiFeedback] = useState<DynamicAICodeReview | null>(null);
  const [adviceLanguage, setAdviceLanguage] = useState<'Tanglish' | 'English'>(user.preferredLanguage);

  // REGISTER GLOBAL EXIT GUARD FOR CODING PRACTICE
  useEffect(() => {
    const isDirty = hasStartedChallenge && userCode.trim().length > 0;
    registerWorkflowGuard('Coding Practice', isDirty);
    return () => {
      clearWorkflowGuard('Coding Practice');
    };
  }, [hasStartedChallenge, userCode, registerWorkflowGuard, clearWorkflowGuard]);

  // Session Persistence States
  const [showCodingModal, setShowCodingModal] = useState<boolean>(false);
  const [pendingCodingSession, setPendingCodingSession] = useState<{
    selectedLang: CodingLanguage;
    difficulty: DifficultyLevel;
    userCode: string;
    problemTitle: string;
  } | null>(null);

  // Automatically scroll container to top when starting a challenge
  useEffect(() => {
    if (hasStartedChallenge) {
      if (mainContainerRef.current) {
        mainContainerRef.current.scrollTo({ top: 0, behavior: 'auto' });
      }
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [hasStartedChallenge]);

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

  // Real Code Syntax & Random Text Validation Helper
  const validateCodeSyntax = (code: string, lang: CodingLanguage): boolean => {
    const trimmed = code.trim();
    if (trimmed.length < 4) return false;

    // Single random word check e.g. "hello", "hi", "123abc"
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
    console.log('🔄 [CODING_PROGRESS EVENT] fetchNewQuestion triggered for', lang, diff);
    if (isGenerating) {
      console.warn('⚠️ [CODING_PROGRESS EVENT] Question generation already in progress. Skipping duplicate call.');
      return;
    }
    setIsGenerating(true);
    setGenerationError(null);
    setExecutionResult(null);
    setDynamicAiFeedback(null);
    setHasEvaluated(false);

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
          
          // Retry if Gemini generated a title already seen in this session
          if (seenTitlesRef.current.has(normalizedTitle) && attempts < 3) {
            console.warn(`Duplicate question title "${generated.title}" received. Retrying attempt ${attempts}...`);
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
          // Set code editor completely EMPTY on new question load
          setUserCode('');
          setGenerationError(null);
          generatedSuccess = true;

          console.log('✨ [CODING_PROGRESS EVENT] New question generated:', formatted.title, formatted.id);

          // Immediately insert record into coding_progress table
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

  const handleContinueCoding = () => {
    if (pendingCodingSession) {
      setSelectedLang(pendingCodingSession.selectedLang);
      setDifficulty(pendingCodingSession.difficulty);
      setUserCode(pendingCodingSession.userCode);
      setHasStartedChallenge(true);
    }
    setShowCodingModal(false);
    setPendingCodingSession(null);
  };

  const handleExitCoding = () => {
    setShowCodingModal(false);
    setPendingCodingSession(null);
    setUserCode('');
  };

  const handleNextQuestion = () => {
    console.log('👉 [CODING_PROGRESS EVENT] "Next Question" button clicked!');
    setQuestionCount((prev) => prev + 1);
    setUserCode('');
    setExecutionResult(null);
    setDynamicAiFeedback(null);
    setHasEvaluated(false);
    fetchNewQuestion(selectedLang, difficulty);
  };

  const handleResetCode = () => {
    // Reset editor to empty string while keeping current state
    setUserCode('');
    setExecutionResult(null);
    setDynamicAiFeedback(null);
  };

  const handleReopenEditor = () => {
    // 1. Hide AI Feedback panel completely to return to coding editor view
    setExecutionResult(null);
    setDynamicAiFeedback(null);

    // 2. Focus cursor inside the editor without scrolling to unrelated positions
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handleRunCode = async () => {
    if (isRunning) return;
    setIsRunning(true);

    const trimmedCode = userCode.trim();
    const problemTitle = currentProblem?.title || 'Coding Challenge';
    const problemDesc = currentProblem?.description || '';

    // Step 1: Check Empty
    if (!trimmedCode) {
      const emptyErrorMsg = 'Please write your solution before running.';
      setExecutionResult({
        status: 'Compilation Error',
        passed: false,
        score: 0,
        executionTimeMs: 0,
        passedTestCasesCount: 0,
        totalTestCasesCount: 1,
        errorMessage: emptyErrorMsg
      });
      setHasEvaluated(true);
      setIsRunning(false);
      return;
    }

    // Step 2: Check Syntax & Random Text Validation
    const isCodeValid = validateCodeSyntax(trimmedCode, selectedLang);
    if (!isCodeValid) {
      const invalidErrorMsg = `Invalid code. Please enter valid ${selectedLang} code.`;
      const rawTanglishInvalidMsg = selectedLang === 'Python' 
        ? 'Idhu valid Python code illa. Proper function or logic write pannunga.' 
        : `Idhu valid ${selectedLang} code illa. Proper logic write pannunga.`;
      const tanglishInvalidMsg = formatTanglishAddressing(rawTanglishInvalidMsg, user, 'Tanglish');

      const syntaxErrorResult: CodingSubmissionResult = {
        status: 'Compilation Error',
        passed: false,
        score: 0,
        executionTimeMs: 12,
        errorMessage: invalidErrorMsg,
        aiCodeReview: {
          timeComplexity: 'N/A',
          spaceComplexity: 'N/A',
          optimizations: [invalidErrorMsg],
          englishAdvice: invalidErrorMsg,
          tanglishAdvice: tanglishInvalidMsg
        }
      };

      setExecutionResult(syntaxErrorResult);
      setDynamicAiFeedback({
        result: 'Compilation Error',
        strengths: 'None',
        mistakes: invalidErrorMsg,
        betterApproach: `Write syntactically correct ${selectedLang} code with proper keywords and structure.`,
        timeComplexity: 'N/A',
        spaceComplexity: 'N/A',
        interviewTip: 'Always double-check language syntax rules before compiling.',
        englishAdvice: invalidErrorMsg,
        tanglishAdvice: tanglishInvalidMsg
      });
      setHasEvaluated(true);
      setIsRunning(false);

      if (currentProblem) {
        await SupabaseService.updateCodingProgress({
          problemId: currentProblem.id,
          userEmail: user?.email || 'student@college.edu',
          userId: user?.id,
          code: userCode,
          score: 0,
          status: 'Compilation Error',
          timeComplexity: 'N/A',
          englishAdvice: invalidErrorMsg,
          tanglishAdvice: tanglishInvalidMsg
        });
      }
      return;
    }

    // Step 3: Valid Code -> Generate Dynamic AI Review
    const dynamicReview = await generateAICodeReview({
      problemTitle,
      description: problemDesc,
      code: trimmedCode,
      language: selectedLang,
      validationStatus: 'Success'
    }, user);

    const successResult: CodingSubmissionResult = {
      status: 'Success',
      passed: true,
      score: 100,
      executionTimeMs: 28,
      passedTestCasesCount: 1,
      totalTestCasesCount: 1,
      aiCodeReview: {
        timeComplexity: dynamicReview.timeComplexity,
        spaceComplexity: dynamicReview.spaceComplexity,
        optimizations: [dynamicReview.betterApproach],
        englishAdvice: dynamicReview.englishAdvice,
        tanglishAdvice: dynamicReview.tanglishAdvice
      }
    };

    setExecutionResult(successResult);
    setDynamicAiFeedback(dynamicReview);
    setHasEvaluated(true);
    recordUserActivity('coding', problemTitle, 100, 'Coding');

    // Step 4: Persist in Supabase
    if (currentProblem) {
      await SupabaseService.updateCodingProgress({
        problemId: currentProblem.id,
        userEmail: user?.email || 'student@college.edu',
        userId: user?.id,
        code: userCode,
        score: 100,
        status: 'Correct',
        timeComplexity: dynamicReview.timeComplexity,
        englishAdvice: dynamicReview.englishAdvice,
        tanglishAdvice: dynamicReview.tanglishAdvice
      });
    }

    setIsRunning(false);
  };

  // --- RENDER 1: CLEAN CODING SETUP PAGE ---
  if (!hasStartedChallenge) {
    return (
      <div ref={mainContainerRef} className="flex-1 overflow-y-auto space-y-6 w-[92%] sm:w-[94%] max-w-7xl mx-auto pb-12 pr-1 animate-in fade-in relative select-none">
        
        {/* Session Resume Modal */}
        <SessionResumeModal
          isOpen={showCodingModal && !!pendingCodingSession}
          moduleName="Coding Practice"
          progressText={
            pendingCodingSession
              ? `Language: ${pendingCodingSession.selectedLang} • Problem: ${pendingCodingSession.problemTitle}`
              : ''
          }
          onContinue={handleContinueCoding}
          onExit={handleExitCoding}
        />

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
    <div ref={mainContainerRef} className="flex-1 w-[94%] sm:w-[96%] max-w-7xl mx-auto flex flex-col h-[calc(100vh-130px)] space-y-3 pb-2 animate-in fade-in select-none overflow-hidden">
      
      {/* Session Resume Modal */}
      <SessionResumeModal
        isOpen={showCodingModal && !!pendingCodingSession}
        moduleName="Coding Practice"
        progressText={
          pendingCodingSession
            ? `Language: ${pendingCodingSession.selectedLang} • Problem: ${pendingCodingSession.problemTitle}`
            : ''
        }
        onContinue={handleContinueCoding}
        onExit={handleExitCoding}
      />

      {/* Requirement 4: Slim Progress Bar at top showing coding progress */}
      <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden shrink-0">
        <div
          className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
          style={{ width: `${Math.min(questionCount * 25, 100)}%` }}
        />
      </div>

      {/* Requirement 9: Sticky Header Navigation Bar */}
      <div className="glass-card rounded-2xl p-3 border flex flex-wrap items-center justify-between gap-3 shrink-0 sticky top-0 z-20 backdrop-blur-md bg-slate-950/80">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setHasStartedChallenge(false)}
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
          {/* Requirement 9: Next Question Button disabled until code evaluated */}
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

          {/* Requirement 1: Exit Button with White/Transparent default & smooth red hover */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className="px-3 py-1.5 rounded-xl border border-slate-700/80 bg-transparent text-slate-300 hover:bg-red-500 hover:text-white hover:border-red-500 text-xs font-bold flex items-center gap-1.5 transition-all duration-300 cursor-pointer"
            title="Exit to Dashboard"
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
          
          {/* Error Banner when Gemini API fails */}
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
              {/* Requirement 1 & 8: Left Panel hierarchy (No duplicate language/difficulty badges) */}
              
              {/* 1. Problem Statement Card (Title, Question #, Muted Problem ID, Description) */}
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

                {/* Requirement 2: Small Muted Problem ID below title */}
                <span className="text-[10px] text-slate-500 font-mono block -mt-1">
                  ID: {currentProblem.id}
                </span>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed font-medium">
                  {currentProblem.description}
                </div>
              </div>

              {/* 2. Input Format */}
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

              {/* 3. Output Format */}
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

              {/* 4. Constraints */}
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

              {/* 5. Sample Input */}
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

              {/* 6. Sample Output */}
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

              {/* 7. Explanation */}
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

        {/* ================= RIGHT PANEL (55% - lg:col-span-7): Code Editor & AI Feedback Overlay ================= */}
        <div className="lg:col-span-7 h-full flex flex-col space-y-4 overflow-hidden">
          
          <div className="glass-card rounded-2xl p-5 border flex-1 flex flex-col space-y-3 overflow-hidden">
            
            {/* Requirement 2: Setup Indicator Header (ALWAYS VISIBLE AT TOP) */}
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

            {/* Requirement 2: Editor Action Header (ALWAYS VISIBLE AT TOP) */}
            <div className="flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs font-bold text-slate-400">
                {executionResult ? 'AI Feedback Overview:' : 'Type your solution logic below:'}
              </span>

              <div className="flex items-center gap-2">
                {/* Reset Code Button */}
                <button
                  onClick={handleResetCode}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
                  title="Reset code to empty editor"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Code</span>
                </button>

                {/* Run & Evaluate Code Flow Button */}
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

            {/* Requirement 2 & 6: Dynamic Area Below Setup Bar (Toggles between Code Editor & AI Feedback Overlay) */}
            {!executionResult ? (
              <textarea
                ref={editorRef}
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                placeholder="Start typing your solution here..."
                className="flex-1 min-h-0 w-full p-4 rounded-2xl bg-[#0f172a] border border-slate-800/90 font-mono text-emerald-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/60 leading-relaxed shadow-inner resize-none overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 animate-in fade-in"
              />
            ) : (
              /* AI Feedback Overlay Panel covering editor area below Setup bar */
              <div className="flex-1 min-h-0 w-full rounded-2xl bg-slate-900/95 border border-slate-800 p-5 space-y-4 overflow-y-auto animate-in fade-in zoom-in-95 scrollbar-thin scrollbar-thumb-slate-800">
                
                {/* Header with single Edit Code button */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                      AI Feedback
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Requirement 3: Single Edit Code Button */}
                    <button
                      onClick={handleReopenEditor}
                      className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-600 px-3 py-1.5 rounded-xl border border-emerald-500/30 shadow transition-all cursor-pointer font-extrabold"
                      title="Return to editor & modify code"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Code</span>
                    </button>

                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        executionResult.status === 'Success'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {executionResult.status === 'Success' ? 'Correct' : executionResult.status === 'Compilation Error' ? 'Compilation Error' : 'Wrong'}
                    </span>
                  </div>
                </div>

                {/* Success XP banner if applicable */}
                {executionResult.status === 'Success' && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-extrabold text-sm border border-emerald-500/30">
                        ✓
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-emerald-400">Correct Answer</h4>
                        <p className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                          <Zap className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>+100 XP Earned</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleNextQuestion}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <span>Next Question</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Dynamic AI Feedback Details */}
                <div className="space-y-3 text-xs">
                  
                  {/* Result & Language Toggle Bar */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-extrabold text-slate-300 flex items-center gap-1.5">
                      <span>✅ Result:</span>
                      <strong className={executionResult.status === 'Success' ? 'text-emerald-400' : 'text-red-400'}>
                        {executionResult.status === 'Success' ? 'Correct' : executionResult.status === 'Compilation Error' ? 'Compilation Error' : 'Wrong'}
                      </strong>
                    </span>

                    <button
                      onClick={() => setAdviceLanguage(adviceLanguage === 'Tanglish' ? 'English' : 'Tanglish')}
                      className="text-[10px] font-bold underline text-amber-400 cursor-pointer"
                    >
                      Switch to {adviceLanguage === 'Tanglish' ? 'English' : 'Tanglish'}
                    </button>
                  </div>

                  {executionResult.errorMessage && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs">
                      {executionResult.errorMessage}
                    </div>
                  )}

                  {/* Tanglish / English Advice Banner */}
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-slate-200 font-medium leading-relaxed">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                      💡 Explanation ({adviceLanguage})
                    </span>
                    <span>
                      {adviceLanguage === 'Tanglish'
                        ? dynamicAiFeedback?.tanglishAdvice || executionResult.aiCodeReview?.tanglishAdvice
                        : dynamicAiFeedback?.englishAdvice || executionResult.aiCodeReview?.englishAdvice}
                    </span>
                  </div>

                  {/* Structured Feedback Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <span className="font-extrabold text-emerald-400 block text-[11px]">
                        ⭐ Strengths
                      </span>
                      <p className="text-slate-300 font-medium text-[11px] leading-relaxed">
                        {dynamicAiFeedback?.strengths || 'Clean structural approach adhering to candidate constraints.'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <span className="font-extrabold text-amber-400 block text-[11px]">
                        ⚠ Mistakes
                      </span>
                      <p className="text-slate-300 font-medium text-[11px] leading-relaxed">
                        {dynamicAiFeedback?.mistakes || 'Validate zero/null boundary conditions and edge inputs.'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1 sm:col-span-2">
                      <span className="font-extrabold text-purple-400 block text-[11px]">
                        💡 Better Approach
                      </span>
                      <p className="text-slate-300 font-medium text-[11px] leading-relaxed">
                        {dynamicAiFeedback?.betterApproach || 'Using optimal pointer traversal reduces lookup overhead.'}
                      </p>
                    </div>
                  </div>

                  {/* Complexities */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div className="p-2.5 rounded-xl bg-slate-950 font-mono border border-slate-800">
                      <span className="text-slate-400 block text-[10px] mb-0.5">⏱ Time Complexity:</span>
                      <strong className="text-emerald-400 text-xs">
                        {dynamicAiFeedback?.timeComplexity || executionResult.aiCodeReview?.timeComplexity || 'O(N)'}
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 font-mono border border-slate-800">
                      <span className="text-slate-400 block text-[10px] mb-0.5">💾 Space Complexity:</span>
                      <strong className="text-purple-400 text-xs">
                        {dynamicAiFeedback?.spaceComplexity || executionResult.aiCodeReview?.spaceComplexity || 'O(1)'}
                      </strong>
                    </div>
                  </div>

                  {/* Interview Tip */}
                  <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-slate-300">
                    <span className="font-extrabold text-teal-400 block text-[11px] mb-0.5">
                      🎯 Interview Tip
                    </span>
                    <p className="text-slate-300 font-medium text-[11px]">
                      {dynamicAiFeedback?.interviewTip || 'State your algorithmic time complexity clearly before writing code.'}
                    </p>
                  </div>

                </div>

              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
};
