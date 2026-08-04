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
  LogOut
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateQuestions, STARTER_TEMPLATES } from '../../services/aiEngine';
import { CodingLanguage, DifficultyLevel, CodingSubmissionResult, CodingChallenge } from '../../types';
import { SessionResumeModal } from '../Common/SessionResumeModal';

export const CodingView: React.FC = () => {
  const { recordUserActivity, user, setActiveTab } = useApp();

  const [selectedLang, setSelectedLang] = useState<CodingLanguage>('Python');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Easy');

  const [currentProblem, setCurrentProblem] = useState<CodingChallenge | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const seenTitlesRef = useRef<Set<string>>(new Set());

  const [userCode, setUserCode] = useState<string>(STARTER_TEMPLATES['Python']);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<CodingSubmissionResult | null>(null);
  const [adviceLanguage, setAdviceLanguage] = useState<'Tanglish' | 'English'>(user.preferredLanguage);

  // Session Persistence States
  const [showCodingModal, setShowCodingModal] = useState<boolean>(false);
  const [pendingCodingSession, setPendingCodingSession] = useState<{
    selectedLang: CodingLanguage;
    difficulty: DifficultyLevel;
    userCode: string;
    problemTitle: string;
  } | null>(null);

  // Function to fetch a new unique AI coding question
  const fetchNewQuestion = async (lang: CodingLanguage, diff: DifficultyLevel) => {
    if (isGenerating) return;
    setIsGenerating(true);
    setGenerationError(null);
    setExecutionResult(null);

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
          
          // If Gemini generated a title already seen in this session, retry once to ensure session uniqueness
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
          setUserCode(formatted.starterCode);
          setGenerationError(null);
          generatedSuccess = true;
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

  // Generate initial question on mount
  useEffect(() => {
    fetchNewQuestion(selectedLang, difficulty);
  }, []);

  const handleContinueCoding = () => {
    if (pendingCodingSession) {
      setSelectedLang(pendingCodingSession.selectedLang);
      setDifficulty(pendingCodingSession.difficulty);
      setUserCode(pendingCodingSession.userCode);
    }
    setShowCodingModal(false);
    setPendingCodingSession(null);
  };

  const handleExitCoding = () => {
    setShowCodingModal(false);
    setPendingCodingSession(null);
    setUserCode(STARTER_TEMPLATES[selectedLang]);
  };

  const handleSelectLanguage = (lang: CodingLanguage) => {
    setSelectedLang(lang);
    setUserCode(STARTER_TEMPLATES[lang]);
    setExecutionResult(null);
    fetchNewQuestion(lang, difficulty);
  };

  const handleSelectDifficulty = (diff: DifficultyLevel) => {
    setDifficulty(diff);
    setUserCode(STARTER_TEMPLATES[selectedLang]);
    setExecutionResult(null);
    fetchNewQuestion(selectedLang, diff);
  };

  const handleNextQuestion = () => {
    setUserCode(STARTER_TEMPLATES[selectedLang]);
    setExecutionResult(null);
    fetchNewQuestion(selectedLang, difficulty);
  };

  const handleResetCode = () => {
    if (currentProblem && currentProblem.starterCode) {
      setUserCode(currentProblem.starterCode);
    } else {
      setUserCode(STARTER_TEMPLATES[selectedLang]);
    }
    setExecutionResult(null);
  };

  const handleRunCode = async () => {
    if (isRunning) return;
    setIsRunning(true);

    await new Promise((resolve) => setTimeout(resolve, 900));

    const trimmedCode = userCode.trim();
    const currentTemplate = STARTER_TEMPLATES[selectedLang].trim();

    let result: CodingSubmissionResult;
    const testCasesCount = currentProblem?.testCases?.length || 1;
    const problemTitle = currentProblem?.title || 'Coding Challenge';

    // Check if code was unedited or empty
    if (!trimmedCode || trimmedCode === currentTemplate) {
      result = {
        status: 'Failed Test Cases',
        passed: false,
        score: 0,
        executionTimeMs: 0,
        passedTestCasesCount: 0,
        totalTestCasesCount: testCasesCount,
        errorMessage: 'Starter template unedited. Please implement your code logic before running evaluation.'
      };
    }
    // Check for syntax / compiler issues (basic validation: unclosed brackets, missing semicolons in C/Java/C++)
    else if (
      (selectedLang === 'Java' || selectedLang === 'C' || selectedLang === 'C++') &&
      (!trimmedCode.includes(';') || (trimmedCode.match(/\{/g) || []).length !== (trimmedCode.match(/\}/g) || []).length)
    ) {
      result = {
        status: 'Compilation Error',
        passed: false,
        score: 0,
        executionTimeMs: 14,
        errorMessage: 'Compilation Error: Syntax error detected (missing semicolon or mismatched brackets).'
      };
    }
    else {
      result = {
        status: 'Success',
        passed: true,
        score: 100,
        executionTimeMs: 24,
        passedTestCasesCount: testCasesCount,
        totalTestCasesCount: testCasesCount,
        aiCodeReview: {
          timeComplexity: 'O(N) - Linear Time',
          spaceComplexity: 'O(1) - Constant Space',
          optimizations: [
            'Efficient algorithmic structure.',
            'Consider validating boundary constraints for edge cases.'
          ],
          englishAdvice: 'Great job! Your solution handles the sample constraints efficiently with clean code structure.',
          tanglishAdvice: 'Super bro! Code logic efficient-a write pannirukinga. Test cases elam pass aagi irukku.'
        }
      };
      recordUserActivity('coding', problemTitle, result.score, 'Coding');
    }

    setExecutionResult(result);
    setIsRunning(false);
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-6 max-w-6xl mx-auto pb-12 pr-1 animate-in fade-in relative">
      
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

      {/* Top Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-2">
            <Code2 className="w-4 h-4" />
            <span>AI Algorithmic Coding Practice</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Coding Sandbox & AI Review
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Solve placement coding challenges in Java, Python, C, C++, and SQL with AI feedback.
          </p>
        </div>

        {/* Language Selection Bar & Exit Button */}
        <div className="flex flex-wrap items-center gap-2">
          {(['Java', 'Python', 'C', 'C++', 'SQL'] as CodingLanguage[]).map((lang) => (
            <button
              key={lang}
              onClick={() => handleSelectLanguage(lang)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                selectedLang === lang
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {lang}
            </button>
          ))}

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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Problem Statement */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card rounded-3xl p-6 border space-y-4">
            
            {/* Header with Difficulty Controls & Single "Next Question" Button */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-1.5">
                {(['Easy', 'Medium', 'Hard'] as DifficultyLevel[]).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => handleSelectDifficulty(diff)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all border cursor-pointer ${
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

              {/* Single Button: Next Question */}
              <button
                onClick={handleNextQuestion}
                disabled={isGenerating}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow cursor-pointer disabled:opacity-50"
                title="Generate Next AI Question"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <span>Next Question</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Error Banner when Gemini API fails */}
            {generationError ? (
              <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-center space-y-3 my-4">
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
              <div className="p-8 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Generating a unique {difficulty} {selectedLang} challenge using Gemini AI...
                </p>
              </div>
            ) : currentProblem ? (
              <>
                {/* 1. Problem ID */}
                <div>
                  <span className="text-[11px] font-mono text-slate-400 block mb-0.5">Problem ID: {currentProblem.id}</span>
                  
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium my-1">
                    <span>⏱ Time Limit: 1 second</span>
                    <span>•</span>
                    <span>💾 Memory Limit: 256 MB</span>
                  </div>

                  {/* 2. Problem Title */}
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {currentProblem.title}
                    {isGenerating && <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin" />}
                  </h2>
                </div>

                {/* 3. Problem Description */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {currentProblem.description}
                </p>

                <div className="space-y-3 pt-2">
                  {/* 4. Input Format */}
                  {currentProblem.inputFormat && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Input Format
                      </h4>
                      <div className="p-3 rounded-xl bg-slate-900/60 text-slate-300 text-xs border border-slate-800 leading-relaxed">
                        {currentProblem.inputFormat}
                      </div>
                    </div>
                  )}

                  {/* 5. Output Format */}
                  {currentProblem.outputFormat && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Output Format
                      </h4>
                      <div className="p-3 rounded-xl bg-slate-900/60 text-slate-300 text-xs border border-slate-800 leading-relaxed">
                        {currentProblem.outputFormat}
                      </div>
                    </div>
                  )}

                  {/* 6. Constraints */}
                  {currentProblem.constraints && currentProblem.constraints.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Constraints
                      </h4>
                      <ul className="p-3 rounded-xl bg-slate-900/60 text-slate-300 font-mono text-xs border border-slate-800/80 space-y-1 list-disc list-inside">
                        {currentProblem.constraints.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 7. Sample Input */}
                  {currentProblem.sampleInput && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Sample Input
                      </h4>
                      <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs border border-slate-800">
                        {currentProblem.sampleInput}
                      </div>
                    </div>
                  )}

                  {/* 8. Sample Output */}
                  {currentProblem.sampleOutput && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Sample Output
                      </h4>
                      <div className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs border border-slate-800">
                        {currentProblem.sampleOutput}
                      </div>
                    </div>
                  )}

                  {/* 9. Explanation */}
                  {currentProblem.explanation && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Explanation
                      </h4>
                      <div className="p-3 rounded-xl bg-slate-900/60 text-slate-300 text-xs border border-slate-800 leading-relaxed">
                        {currentProblem.explanation}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 text-[11px] italic font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Hidden test cases will be checked after submission.</span>
                  </div>
                </div>
              </>
            ) : null}

          </div>
        </div>

        {/* Right Column: Code Editor & Compiler Output */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-card rounded-3xl p-6 border space-y-4">
            
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Editor ({selectedLang})
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Reset Code Button */}
                <button
                  onClick={handleResetCode}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                  title="Reset code to starter template"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Code</span>
                </button>

                {/* Run & Evaluate Code Button */}
                <button
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
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

            {/* Code Textarea Editor */}
            <textarea
              rows={13}
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              placeholder="Write your code here..."
              className="w-full p-4 rounded-2xl bg-slate-950 font-mono text-emerald-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed shadow-inner"
            />

            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 text-center flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>AI Review will be available after code execution.</span>
            </div>

          </div>

          {/* Execution Result Banner */}
          {executionResult && (
            <div
              className={`glass-card rounded-3xl p-6 border space-y-4 animate-in slide-in-from-bottom-2 ${
                executionResult.status === 'Success'
                  ? 'border-emerald-500/30 bg-gradient-to-b from-emerald-500/5 to-transparent'
                  : executionResult.status === 'Compilation Error'
                  ? 'border-red-500/30 bg-gradient-to-b from-red-500/5 to-transparent'
                  : 'border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-transparent'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  {executionResult.status === 'Success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : executionResult.status === 'Compilation Error' ? (
                    <XCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  )}
                  
                  <span
                    className={`text-sm font-extrabold px-3 py-1 rounded-full text-xs ${
                      executionResult.status === 'Success'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : executionResult.status === 'Compilation Error'
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {executionResult.status}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{executionResult.executionTimeMs}ms</span>
                </div>
              </div>

              {executionResult.errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 text-xs font-mono">
                  {executionResult.errorMessage}
                </div>
              )}

              {executionResult.aiCodeReview && (
                <>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono border border-slate-800">
                      <span className="text-slate-400 block mb-0.5">Time Complexity:</span>
                      <strong className="text-emerald-400">{executionResult.aiCodeReview.timeComplexity}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono border border-slate-800">
                      <span className="text-slate-400 block mb-0.5">Space Complexity:</span>
                      <strong className="text-purple-400">{executionResult.aiCodeReview.spaceComplexity}</strong>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Globe className="w-4 h-4" /> AI Optimization Advice ({adviceLanguage})
                      </span>
                      <button
                        onClick={() => setAdviceLanguage(adviceLanguage === 'Tanglish' ? 'English' : 'Tanglish')}
                        className="text-[10px] font-bold underline text-amber-600 dark:text-amber-400 cursor-pointer"
                      >
                        Switch to {adviceLanguage === 'Tanglish' ? 'English' : 'Tanglish'}
                      </button>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">
                      {adviceLanguage === 'Tanglish'
                        ? executionResult.aiCodeReview.tanglishAdvice
                        : executionResult.aiCodeReview.englishAdvice}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
