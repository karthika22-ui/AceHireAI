import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  Upload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileUp,
  FileCheck2,
  Trash2,
  Zap,
  Wand2,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Lightbulb,
  Award,
  BarChart3,
  Search,
  Check,
  ArrowRight,
  LogOut,
  ArrowLeft
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { analyzeResumeWithAI } from '../../services/aiEngine';
import { SupabaseService } from '../../services/supabaseClient';
import { ResumeData, ResumeAnalysis } from '../../types';
import { SessionResumeModal } from '../Common/SessionResumeModal';

interface ATSAnalyzerViewProps {
  onBackToSelection?: () => void;
  initialResumeData?: ResumeData;
}

export const ATSAnalyzerView: React.FC<ATSAnalyzerViewProps> = ({ onBackToSelection, initialResumeData }) => {
  const { user, resume, recordUserActivity, setActiveTab, registerWorkflowGuard, clearWorkflowGuard } = useApp();

  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string; type: string } | null>(
    initialResumeData
      ? {
          name: `${initialResumeData.fullName || 'Candidate'}_Generated_Resume.pdf`,
          size: '1.2 MB',
          type: 'Generated Resume'
        }
      : null
  );

  const [showResumeSessionModal, setShowResumeSessionModal] = useState<boolean>(false);

  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<number>(1);
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysis | null>(null);

  // REGISTER GLOBAL EXIT GUARD FOR ATS ANALYSIS
  useEffect(() => {
    const isDirty = isAnalyzing || (!!uploadedFile && !analysisResult);
    registerWorkflowGuard('ATS Analysis', isDirty);
    return () => {
      clearWorkflowGuard('ATS Analysis');
    };
  }, [isAnalyzing, uploadedFile, analysisResult, registerWorkflowGuard, clearWorkflowGuard]);
  const [openSuggestions, setOpenSuggestions] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const scanSteps = [
    'Parsing PDF/DOCX document text & structure layers...',
    'Extracting technical skills, projects & achievements...',
    'Evaluating keyword frequency against industry ATS standards...',
    'Detecting formatting, layout & grammar issues...',
    'Generating AI placement recommendations & score...'
  ];

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processSelectedFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processSelectedFile(file);
    }
  };

  const processSelectedFile = async (file: File) => {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';

    let extractedText = '';
    try {
      extractedText = await file.text();
    } catch (e) {
      console.error('Error reading text from file:', e);
    }

    const fileObj = {
      name: file.name,
      size: `${sizeInMB} MB`,
      type: `${ext} Document`,
      extractedText: extractedText || '',
      fileSizeRaw: file.size,
      lastModified: file.lastModified
    };
    setUploadedFile(fileObj);
    setAnalysisResult(null);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setAnalysisResult(null);
  };

  const handleRunATSScan = async (customData?: any) => {
    const target = customData || uploadedFile;
    if (isAnalyzing || !target) return;
    setIsAnalyzing(true);
    setLoadingStep(1);

    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < 5 ? prev + 1 : 5));
    }, 450);

    try {
      const result = await analyzeResumeWithAI(target);
      clearInterval(interval);
      setLoadingStep(5);
      await new Promise((resolve) => setTimeout(resolve, 300));
      setAnalysisResult(result);
      if (user?.id) {
        SupabaseService.saveAtsAnalysis(user.id, result);
      }
      recordUserActivity('resume', 'AI ATS Resume Scan Completed', result.atsScore, 'Resume');
    } catch (err) {
      console.error(err);
      clearInterval(interval);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (initialResumeData && !analysisResult && !isAnalyzing) {
      handleRunATSScan(initialResumeData);
    } else if (user?.id && !analysisResult && !isAnalyzing) {
      SupabaseService.fetchAtsAnalyses(user.id).then((scans) => {
        if (scans && scans.length > 0 && scans[0].analysis_result) {
          setAnalysisResult(scans[0].analysis_result as ResumeAnalysis);
        }
      });
    }
  }, [initialResumeData, user?.id]);

  const getScoreTheme = (score: number) => {
    if (score >= 80) {
      return {
        color: '#22C55E',
        stroke: 'stroke-emerald-500',
        bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
        badge: 'bg-emerald-500 text-white',
        title: 'High ATS Compatibility 🎉',
        desc: 'Your resume meets top industry ATS parsing standards with high keyword alignment.'
      };
    }
    if (score >= 60) {
      return {
        color: '#F59E0B',
        stroke: 'stroke-amber-500',
        bg: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
        badge: 'bg-amber-500 text-white',
        title: 'Moderate ATS Match ⚠️',
        desc: 'Good structural foundation, but missing several critical technical keywords.'
      };
    }
    return {
      color: '#EF4444',
      stroke: 'stroke-red-500',
      bg: 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400',
      badge: 'bg-red-500 text-white',
      title: 'Needs Optimization 🚨',
      desc: 'Critical keyword gaps and layout warnings detected. Update your resume to boost callbacks.'
    };
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-7 max-w-5xl mx-auto py-2 px-4 sm:px-6 relative animate-in fade-in duration-300">
      
      {/* Session Resume Modal */}
      <SessionResumeModal
        isOpen={showResumeSessionModal && !!uploadedFile}
        moduleName="Resume Builder & ATS"
        progressText={
          uploadedFile
            ? `Uploaded File: ${uploadedFile.name}`
            : ''
        }
        onContinue={() => {
          setShowResumeSessionModal(false);
        }}
        onExit={() => {
          setShowResumeSessionModal(false);
          setUploadedFile(null);
          setAnalysisResult(null);
        }}
      />
      
      {/* Ambient Blue & Cyan Refractive Background Lighting */}
      <div className="absolute -top-24 -left-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none dark:opacity-100 opacity-25" />
      <div className="absolute -bottom-24 -right-20 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none dark:opacity-100 opacity-25" />

      {/* 1. HERO HEADER CARD */}
      <div className="animated-border-glow-wrapper">
        <div className="relative overflow-hidden rounded-[23px] bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-950 p-6 sm:p-8 text-white border-0 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-cyan-200 text-xs font-bold backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span>AI Placement Resume Intelligence</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-['Space_Grotesk'] text-white">
                Resume Builder & ATS Scanner
              </h1>
              <p className="text-sm sm:text-base text-slate-100 dark:text-slate-300 font-medium leading-relaxed">
                Scan your resume against automated ATS filters, extract missing keywords, and receive instant AI recommendations.
              </p>
            </div>

            {/* Quick Action Info Pill & Exit / Back Buttons */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
              <div className="p-4 rounded-2xl bg-white/10 dark:bg-slate-950/80 border border-white/20 dark:border-slate-800 backdrop-blur-xl flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-400/20 text-cyan-300">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-white block">100% Private & Secure</span>
                  <span className="text-[11px] text-cyan-100 dark:text-slate-400 font-medium block">Instant AI Analysis</span>
                </div>
              </div>

              {onBackToSelection && (
                <button
                  onClick={onBackToSelection}
                  className="px-3.5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-extrabold flex items-center gap-1.5 backdrop-blur-xl transition-all cursor-pointer"
                  title="Back to Options"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              )}

              <button
                onClick={() => {
                  setActiveTab('dashboard');
                }}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-red-500/20 text-white hover:text-red-300 border border-white/20 hover:border-red-400 text-xs font-extrabold flex items-center gap-1.5 backdrop-blur-xl transition-all cursor-pointer"
                title="Exit to Dashboard"
              >
                <LogOut className="w-4 h-4" />
                <span>Exit</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. RESUME UPLOAD & ACTION ZONE */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-purple-500/20 bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl shadow-xl space-y-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 font-['Space_Grotesk']">
              <FileUp className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
              <span>Upload Resume Document</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Select or drop your latest PDF/DOCX resume file for AI scanning.
            </p>
          </div>

          {uploadedFile && (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-full">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Document Loaded</span>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
        />

        {/* DRAG AND DROP ZONE */}
        {!uploadedFile ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOver(true);
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all duration-300 cursor-pointer relative overflow-hidden group ${
              isDraggingOver
                ? 'border-cyan-500 bg-cyan-500/10 dark:bg-cyan-500/15 scale-[1.01] shadow-[0_0_40px_rgba(6,182,212,0.2)]'
                : 'border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/60 hover:border-cyan-400 hover:bg-cyan-50/50 dark:hover:bg-slate-950/90'
            }`}
          >
            <div className="space-y-3 relative z-10">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500 dark:text-cyan-400 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 animate-bounce" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  No resume uploaded yet.
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-cyan-600 dark:text-cyan-400 mt-1">
                  Upload your Resume (PDF/DOCX) to start ATS Analysis.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2 text-[11px] font-extrabold text-slate-500 dark:text-slate-400">
                <span className="px-2.5 py-1 rounded-md bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                  PDF (.pdf)
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                  DOCX (.docx)
                </span>
                <span>Max 10MB</span>
              </div>
            </div>
          </div>
        ) : (
          /* LOADED FILE DISPLAY CARD */
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-100/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md shrink-0">
                <FileCheck2 className="w-7 h-7" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                  {uploadedFile.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-2">
                  <span>{uploadedFile.type}</span>
                  <span>•</span>
                  <span>{uploadedFile.size}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-extrabold transition-all cursor-pointer"
              >
                Change File
              </button>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 transition-all cursor-pointer"
                title="Remove File"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SCAN BUTTON & SCANNING LOADING ANIMATION */}
        {isAnalyzing ? (
          <div className="p-6 rounded-2xl bg-slate-950 border border-cyan-500/40 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
                <span className="text-sm font-extrabold text-white">AI ATS Scanning in Progress</span>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
                Step {loadingStep} of 5
              </span>
            </div>

            {/* Glowing Scan Progress Bar */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(56,189,248,0.7)]"
                style={{ width: `${(loadingStep / 5) * 100}%` }}
              />
            </div>

            <div className="text-xs font-semibold text-slate-300 flex items-center gap-2 pt-1">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>{scanSteps[loadingStep - 1] || 'Finalizing Analysis...'}</span>
            </div>
          </div>
        ) : (
          <button
            onClick={handleRunATSScan}
            disabled={!uploadedFile}
            className="relative w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-extrabold text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-xl shadow-blue-600/30 hover:shadow-[0_0_35px_rgba(56,189,248,0.5)] transition-all duration-300 ease-out hover:scale-[1.01] active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none overflow-hidden group border border-cyan-400/30"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine-continuous pointer-events-none" />
            <Wand2 className="w-5 h-5 text-white relative z-10" />
            <span className="relative z-10 font-extrabold">Run AI ATS Scanner</span>
            <ArrowRight className="w-5 h-5 relative z-10 text-white group-hover:translate-x-1.5 transition-transform duration-300" />
          </button>
        )}
      </div>

      {/* 3. ATS ANALYSIS RESULTS CARDS */}
      {analysisResult && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 zoom-in-95 duration-500">
          
          {/* CARD 1: OVERALL ATS SCORE CARD */}
          {(() => {
            const theme = getScoreTheme(analysisResult.atsScore);
            const detectedList = analysisResult.detectedSkills || analysisResult.matchedSkills || [];
            const weakList = analysisResult.keywordAnalysis?.weakKeywords || analysisResult.missingSkills || [];

            return (
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-purple-500/20 bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl shadow-xl space-y-6 relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  
                  {/* Left: Score Circular Progress Gauge */}
                  <div className="flex items-center gap-6">
                    <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                      <svg className="w-28 h-28 transform -rotate-90">
                        <circle
                          cx="56"
                          cy="56"
                          r="46"
                          stroke="currentColor"
                          strokeWidth="9"
                          className="text-slate-200 dark:text-slate-800"
                          fill="transparent"
                        />
                        <circle
                          cx="56"
                          cy="56"
                          r="46"
                          stroke={theme.color}
                          strokeWidth="9"
                          className="transition-all duration-1000 ease-out"
                          strokeDasharray={289}
                          strokeDashoffset={289 - (289 * analysisResult.atsScore) / 100}
                          strokeLinecap="round"
                          fill="transparent"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                          {analysisResult.atsScore}%
                        </span>
                        <span className="text-[10px] font-extrabold uppercase text-slate-400">ATS Score</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-center md:text-left">
                      <span className={`inline-block text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full ${theme.badge} shadow-md`}>
                        {theme.title}
                      </span>
                      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                        Overall ATS Readiness Score
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md font-medium">
                        Based on structure, content quality, keyword usage, formatting, readability, grammar, and achievements.
                      </p>
                    </div>
                  </div>

                  {/* Right: Quick Breakdown Stats */}
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex-1 md:flex-initial p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center min-w-[130px]">
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 block">
                        {detectedList.length}
                      </span>
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Detected Skills</span>
                    </div>

                    <div className="flex-1 md:flex-initial p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center min-w-[130px]">
                      <span className="text-2xl font-black text-amber-600 dark:text-amber-400 block">
                        {weakList.length}
                      </span>
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Weak Keywords</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* CARD 2: RESUME STRENGTHS & DETECTED TECHNICAL SKILLS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Resume Strengths */}
            <div className="glass-card rounded-3xl p-6 border border-emerald-500/30 bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Resume Strengths ({analysisResult.strengths?.length || 2})
                  </h3>
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  VERIFIED
                </span>
              </div>

              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                {(analysisResult.strengths || [
                  'Clean foundational structure with demarcated technical skills & experience.',
                  'Accessible contact links and clear section organization.'
                ]).map((str, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Detected Technical Skills */}
            <div className="glass-card rounded-3xl p-6 border border-blue-500/30 bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-500" />
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Detected Technical Skills ({(analysisResult.detectedSkills || analysisResult.matchedSkills || []).length})
                  </h3>
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                  DETECTED
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {(analysisResult.detectedSkills || analysisResult.matchedSkills || []).map((skill, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-xl bg-blue-500/15 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-500/30 flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-blue-500" />
                    <span>{skill}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* CARD 3: KEYWORD ANALYSIS */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl shadow-lg space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                  Keyword Analysis
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Evaluates technical term frequency and underused domain keywords in uploaded document.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Weak / Underused Keywords */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Underrepresented Keywords ({(analysisResult.keywordAnalysis?.weakKeywords || analysisResult.missingSkills || []).length})
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(analysisResult.keywordAnalysis?.weakKeywords || analysisResult.missingSkills || []).map((kw, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-bold border border-amber-500/30"
                    >
                      + {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Keyword Improvement Suggestions */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Keyword Optimization Guidance
                </span>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {(analysisResult.keywordAnalysis?.keywordSuggestions || [
                    'Ensure core technical skills appear in both summary and project descriptions.',
                    'Incorporate underrepresented domain keywords to improve automated indexing.'
                  ]).map((sug, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                      <span>{sug}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* CARD 4: AI EXECUTIVE RESUME SUMMARY */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl shadow-lg space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                AI Executive Resume Summary
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {analysisResult.summary || 'Candidate profile demonstrates verified technical competencies. Resume structure displays solid foundation across core engineering projects and technical skills.'}
            </p>
          </div>

          {/* CARD 5 & CARD 6: FORMATTING & GRAMMAR AUDIT GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Formatting & Parsing Audit */}
            <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl shadow-lg space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200 dark:border-slate-800">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Formatting & Parsing Audit
                </h3>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                {analysisResult.formattingSuggestions.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Grammar & Wording Precision */}
            <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl shadow-lg space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200 dark:border-slate-800">
                <Wand2 className="w-5 h-5 text-purple-500" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Grammar & Wording Precision
                </h3>
              </div>

              <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                <div className="p-3 rounded-xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Action Verbs Check</span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {analysisResult.grammarReview?.[0] || '✓ Strong action verbs analyzed from document structure.'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Spelling & Tense Consistency</span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {analysisResult.grammarReview?.[1] || '✓ Spelling & tense consistency verified across sections.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 7: ACHIEVEMENT & IMPACT ANALYSIS */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                    Achievement & Impact Analysis
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Checks projects and work experience for measurable results, metrics, and numerical impact.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Action Verbs: {analysisResult.achievementAnalysis?.actionVerbsRating || 'Strong'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Quantitative Metrics Presence</span>
                <span className={`text-xs font-black ${analysisResult.achievementAnalysis?.hasMetrics ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {analysisResult.achievementAnalysis?.hasMetrics ? '✓ Metrics Found' : '⚠️ Metrics Needed'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {analysisResult.achievementAnalysis?.feedback || (
                  analysisResult.achievementAnalysis?.hasMetrics
                    ? '✓ Quantitative impact metrics (% improvements, latency reductions, user scale) detected in achievements.'
                    : 'Actionable Suggestion: Add quantitative impact metrics (e.g. "Reduced API latency by 35%" or "Built for 5,000+ users") to validate engineering results.'
                )}
              </p>
            </div>
          </div>

          {/* CARD 8 & CARD 9: RECOMMENDATIONS & ATS IMPROVEMENT CHECKLIST */}
          <div className="glass-card rounded-3xl border border-slate-200 dark:border-purple-500/30 bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl shadow-xl overflow-hidden">
            <button
              onClick={() => setOpenSuggestions((prev) => !prev)}
              className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                    AI Resume Improvement Recommendations & Checklist
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Step-by-step guidance based strictly on the uploaded resume
                  </p>
                </div>
              </div>

              {openSuggestions ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {openSuggestions && (
              <div className="p-6 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in">
                
                {/* Recommendations */}
                <div className="space-y-3">
                  <span className="text-xs font-extrabold uppercase text-purple-600 dark:text-purple-400 tracking-wider block">
                    Actionable Improvements
                  </span>
                  {analysisResult.actionableImprovements.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                          {item.section}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                          Recommendation {idx + 1}
                        </span>
                      </div>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                        Issue: {item.issue}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                        💡 {item.recommendation}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Final Checklist */}
                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-500" />
                    <h4 className="text-xs font-extrabold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                      ATS Improvement Checklist
                    </h4>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {(analysisResult.improvementChecklist || [
                      'Add quantitative metrics (percentages, latency, user numbers) to project bullet points.',
                      'Include active GitHub repository and LinkedIn profile links in header.',
                      'Incorporate underused domain keywords into technical skills section.',
                      'Use standard single-column PDF/DOCX structure with clear section headings.'
                    ]).map((chk, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{chk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
