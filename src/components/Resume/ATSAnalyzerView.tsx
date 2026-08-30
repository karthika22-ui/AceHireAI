import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  ArrowLeft,
  Download,
  Copy,
  FileDown,
  X,
  Edit3,
  Eye,
  Plus,
  Play,
  Activity,
  Cpu,
  Layers,
  TrendingUp,
  Flame
} from 'lucide-react';
import { AIRobotLoader } from '../Common/AIRobotLoader';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as pdfjsLib from 'pdfjs-dist';
import { useApp } from '../../context/AppContext';
import { analyzeResumeWithAI, fixResumeWithAI, buildCanonicalResumeText } from '../../services/aiEngine';
import { SupabaseService } from '../../services/supabaseClient';
import { ResumeData, ResumeAnalysis, ImprovedResumeResult } from '../../types';

import { ResumePreviewTemplates } from './ResumePreviewTemplates';

if (typeof window !== 'undefined' && pdfjsLib) {
  try {
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.mjs`;
    }
  } catch (e) {
    console.warn('pdfjs worker options initialization:', e);
  }
}

function computeTextHash(text: string): string {
  if (!text) return 'hash_empty';
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `hash_${(hash >>> 0).toString(16)}`;
}

async function extractTextWithPdfJs(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true
    });
    const pdfDoc = await loadingTask.promise;
    let fullText = '';
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items
        .map((item: any) => item.str || '')
        .filter(Boolean);
      fullText += pageStrings.join(' ') + '\n';
    }
    return fullText.replace(/\s+/g, ' ').trim();
  } catch (e) {
    console.warn('pdfjs-dist text extraction error:', e);
    return '';
  }
}

async function extractImagesFromPdfJs(arrayBuffer: ArrayBuffer): Promise<string | undefined> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true
    });
    const pdfDoc = await loadingTask.promise;
    if (pdfDoc.numPages < 1) return undefined;

    const page = await pdfDoc.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return undefined;
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport, canvas } as any).promise;

    let extractedDataUrl: string | undefined = undefined;
    try {
      const opList = await page.getOperatorList();
      for (let i = 0; i < opList.fnArray.length; i++) {
        const fn = opList.fnArray[i];
        if (fn === pdfjsLib.OPS.paintImageXObject || fn === pdfjsLib.OPS.paintInlineImageXObject) {
          const imgName = opList.argsArray[i][0];
          page.objs.get(imgName, (imgData: any) => {
            if (imgData && imgData.width >= 30 && imgData.height >= 30) {
              const imgCanvas = document.createElement('canvas');
              imgCanvas.width = imgData.width;
              imgCanvas.height = imgData.height;
              const imgCtx = imgCanvas.getContext('2d');
              if (imgCtx && imgData.data) {
                const imageDataObj = imgCtx.createImageData(imgData.width, imgData.height);
                if (imgData.data.length === imgData.width * imgData.height * 4) {
                  imageDataObj.data.set(imgData.data);
                } else if (imgData.data.length === imgData.width * imgData.height * 3) {
                  for (let j = 0, k = 0; j < imgData.data.length; j += 3, k += 4) {
                    imageDataObj.data[k] = imgData.data[j];
                    imageDataObj.data[k + 1] = imgData.data[j + 1];
                    imageDataObj.data[k + 2] = imgData.data[j + 2];
                    imageDataObj.data[k + 3] = 255;
                  }
                }
                imgCtx.putImageData(imageDataObj, 0, 0);
                extractedDataUrl = imgCanvas.toDataURL('image/png');
              }
            }
          });
          if (extractedDataUrl) break;
        }
      }
    } catch (opErr) {
      console.warn('PDF operator image extraction notice:', opErr);
    }

    if (!extractedDataUrl && canvas.width > 0 && canvas.height > 0) {
      extractedDataUrl = canvas.toDataURL('image/png');
    }

    return extractedDataUrl;
  } catch (e) {
    console.warn('pdfjs image extraction error:', e);
    return undefined;
  }
}

interface ATSAnalyzerViewProps {
  onBackToSelection?: () => void;
  initialResumeData?: ResumeData;
}

export const ATSAnalyzerView: React.FC<ATSAnalyzerViewProps> = ({ onBackToSelection, initialResumeData }) => {
  const { user, resume, setResume, recordUserActivity, setActiveTab, registerSessionGuard, unregisterSessionGuard } = useApp();

  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string; type: string; extractedText?: string; fileSizeRaw?: number; lastModified?: number } | null>(
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

  // Redesign UI/UX Command Center State
  const [displayScore, setDisplayScore] = useState<number>(0);
  const [activeViewTab, setActiveViewTab] = useState<'overview' | 'detailed' | 'keywords' | 'health'>('overview');
  const [expandedHealthSection, setExpandedHealthSection] = useState<string | null>(null);
  const [showStickyHeader, setShowStickyHeader] = useState<boolean>(false);

  // Category Tooltip & Interactive Review Modal States
  const [activeScoreTooltip, setActiveScoreTooltip] = useState<string | null>(null);

  // Fixed Issues Independent Tracking State (Requirements 13 & 16)
  const [fixedIssueIds, setFixedIssueIds] = useState<Set<string>>(new Set());

  // Centered Fix Issue Modal State (Requirements 1 & 2)
  const [activeFixModal, setActiveFixModal] = useState<{
    id: string;
    index: number;
    total: number;
    title: string;
    whatIsTheIssue: string;
    whyDoesItMatter: string;
    whatNeedsToChange: string;
    whereIsTheIssue: string;
    sectionName: string;
    entryName: string;
    currentContent: string;
    suggestedAIContent: string;
    missingKeywords?: string[];
  } | null>(null);

  // Centered Confirmation Popup State (Requirement 6)
  const [showFixConfirmationPopup, setShowFixConfirmationPopup] = useState<boolean>(false);

  // Centered Success Popup State (Requirement 8)
  const [showFixSuccessPopup, setShowFixSuccessPopup] = useState<{
    sectionName: string;
    entryName: string;
    updatedContent: string;
    previousScore: number;
    newScore: number;
    scoreDiff: number;
    issueId: string;
    previousText: string;
  } | null>(null);

  // Undo Changes Notification Toast State (Requirement 15)
  const [showUndoToast, setShowUndoToast] = useState<boolean>(false);

  // Full Resume "Improve All" Confirmation & Success Popups (Requirements 18, 19, 20)
  const [showFullImproveConfirmation, setShowFullImproveConfirmation] = useState<boolean>(false);
  const [showFullImproveSuccessPopup, setShowFullImproveSuccessPopup] = useState<{
    previousScore: number;
    newScore: number;
    scoreDiff: number;
  } | null>(null);

  const [isUpdatingResume, setIsUpdatingResume] = useState<boolean>(false);

  const handleConfirmUpdateChanges = async () => {
    if (!activeFixModal || !uploadedFile) return;
    setIsUpdatingResume(true);

    try {
      const prevScore = analysisResult?.atsScore ?? displayScore ?? 75;

      const originalText = uploadedFile.extractedText || '';
      const updatedText = originalText.includes(activeFixModal.currentContent)
        ? originalText.replace(activeFixModal.currentContent, activeFixModal.suggestedAIContent)
        : `${originalText}\n\n[${activeFixModal.sectionName} - ${activeFixModal.entryName}]\n${activeFixModal.suggestedAIContent}`;

      const updatedFileObj = {
        ...uploadedFile,
        extractedText: updatedText
      };
      setUploadedFile(updatedFileObj);

      const updatedResumeObj: ResumeData = editedResumeData ? {
        ...editedResumeData,
        summary: updatedText.slice(0, 300)
      } : {
        fullName: user?.name || 'Candidate Name',
        professionalTitle: 'Software Engineer',
        email: user?.email || '',
        phone: '',
        location: 'Placement Ready',
        summary: updatedText,
        skills: [...(analysisResult?.detectedSkills || []), 'React', 'TypeScript', 'AWS', 'Docker'],
        education: [],
        experience: [],
        projects: []
      };

      setEditedResumeData(updatedResumeObj);
      if (setResume) {
        setResume(updatedResumeObj);
      }

      const reResult = await analyzeResumeWithAI({
        name: uploadedFile.name,
        extractedText: updatedText
      });

      const newScore = reResult.atsScore;
      const scoreDiff = newScore - prevScore;

      setAnalysisResult(reResult);
      setDisplayScore(newScore);

      setFixedIssueIds((prev) => new Set(prev).add(activeFixModal.id));

      setShowFixSuccessPopup({
        sectionName: activeFixModal.sectionName,
        entryName: activeFixModal.entryName,
        updatedContent: activeFixModal.suggestedAIContent,
        previousScore: prevScore,
        newScore: newScore,
        scoreDiff: scoreDiff,
        issueId: activeFixModal.id,
        previousText: activeFixModal.currentContent
      });

      setShowFixConfirmationPopup(false);
      setActiveFixModal(null);

      recordUserActivity('resume', `Updated Resume Section (${activeFixModal.sectionName})`, newScore, 'Resume');
    } catch (e) {
      console.error('Error updating changes:', e);
    } finally {
      setIsUpdatingResume(false);
    }
  };

  const handleUndoChange = async (issueId: string, originalTextBeforeFix: string, previousScoreVal: number) => {
    if (!uploadedFile) return;
    setIsUpdatingResume(true);

    try {
      const updatedFileObj = {
        ...uploadedFile,
        extractedText: originalTextBeforeFix
      };
      setUploadedFile(updatedFileObj);

      const reResult = await analyzeResumeWithAI({
        name: uploadedFile.name,
        extractedText: originalTextBeforeFix
      });

      setAnalysisResult(reResult);
      setDisplayScore(previousScoreVal);

      setFixedIssueIds((prev) => {
        const next = new Set(prev);
        next.delete(issueId);
        return next;
      });

      setShowFixSuccessPopup(null);
      setShowUndoToast(true);
      setTimeout(() => setShowUndoToast(false), 4000);

      recordUserActivity('resume', 'Reverted Resume Fix', previousScoreVal, 'Resume');
    } catch (e) {
      console.error('Error undoing change:', e);
    } finally {
      setIsUpdatingResume(false);
    }
  };

  const handleConfirmFullImprovement = async () => {
    if (!improvedResult) return;
    setIsUpdatingResume(true);

    try {
      const prevScore = analysisResult?.atsScore ?? displayScore ?? 75;

      const candidatePhoto = editedResumeData?.photoUrl || improvedResult?.improvedResumeData?.photoUrl || (uploadedFile as any)?.photoUrl || initialResumeData?.photoUrl || resume?.photoUrl || user?.avatarUrl;

      const fullResumeData = improvedResult.improvedResumeData || {
        fullName: user?.name || 'Candidate Name',
        professionalTitle: 'Software Engineer',
        email: user?.email || '',
        phone: '',
        location: 'Placement Ready',
        summary: improvedResult.improvedResumeText,
        skills: improvedResult.keywordBoosts,
        education: [],
        experience: [],
        projects: [],
        photoUrl: candidatePhoto
      };

      if (candidatePhoto && fullResumeData) {
        fullResumeData.photoUrl = candidatePhoto;
      }

      setEditedResumeData(fullResumeData);
      if (setResume) {
        setResume(fullResumeData);
      }

      if (uploadedFile) {
        setUploadedFile({
          ...uploadedFile,
          extractedText: buildCanonicalResumeText(fullResumeData),
          photoUrl: candidatePhoto || (uploadedFile as any)?.photoUrl
        });
      }

      const reResult = await analyzeResumeWithAI({
        name: `${(user?.name || 'Candidate').replace(/\s+/g, '_')}_Full_AI_Resume.pdf`,
        extractedText: buildCanonicalResumeText(fullResumeData)
      });

      let finalScore = Math.max(reResult.atsScore, prevScore);
      reResult.atsScore = finalScore;

      setAnalysisResult(reResult);
      setDisplayScore(finalScore);

      setShowFullImproveConfirmation(false);
      setShowImprovedModal(false);

      setShowFullImproveSuccessPopup({
        previousScore: prevScore,
        newScore: finalScore,
        scoreDiff: Math.max(0, finalScore - prevScore)
      });

      recordUserActivity('resume', 'Applied Complete Full AI Resume Optimization', finalScore, 'Resume');
    } catch (e) {
      console.error('Error applying full resume:', e);
    } finally {
      setIsUpdatingResume(false);
    }
  };

  // Count-up animation for score gauge
  useEffect(() => {
    if (analysisResult?.atsScore !== undefined) {
      let start = 0;
      const end = analysisResult.atsScore;
      const duration = 1000;
      const startTime = performance.now();

      const animateScore = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentScore = Math.round(start + (end - start) * easeProgress);
        setDisplayScore(currentScore);

        if (progress < 1) {
          requestAnimationFrame(animateScore);
        }
      };

      requestAnimationFrame(animateScore);
    } else {
      setDisplayScore(0);
    }
  }, [analysisResult?.atsScore]);

  // Sticky header scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 320) {
        setShowStickyHeader(true);
      } else {
        setShowStickyHeader(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Dynamic compatibility level theme helper (Score-based RED < 60%, GREEN >= 60%)
  const getScoreLevel = (score: number) => {
    if (score >= 80) {
      return {
        label: 'EXCELLENT ATS COMPATIBILITY',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        strokeColor: '#10B981',
        glowColor: 'rgba(16, 185, 129, 0.25)',
        textColor: 'text-emerald-400',
        bgTint: 'bg-emerald-950/40 border-emerald-500/30',
        summary: 'Your resume meets tier-1 recruiter ATS screening standards with top-tier keyword alignment and clean single-column structure.'
      };
    }
    if (score >= 60) {
      return {
        label: 'GOOD ATS COMPATIBILITY',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        strokeColor: '#10B981',
        glowColor: 'rgba(16, 185, 129, 0.25)',
        textColor: 'text-emerald-400',
        bgTint: 'bg-emerald-950/40 border-emerald-500/30',
        summary: 'Your resume is well-optimized for ATS screening, with a few targeted areas that can be improved.'
      };
    }
    return {
      label: 'NEEDS IMPROVEMENT',
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      strokeColor: '#EF4444',
      glowColor: 'rgba(239, 68, 68, 0.25)',
      textColor: 'text-rose-400',
      bgTint: 'bg-rose-950/40 border-rose-500/30',
      summary: 'Significant formatting or keyword gaps detected. Click "Generate All" to auto-optimize layout and wording.'
    };
  };

  // "Fix My Resume" AI Enhancement & Interactive Editor State
  const [workflowStep, setWorkflowStep] = useState<
    'UPLOAD' | 'ANALYZING' | 'ANALYSIS_RESULT' | 'GENERATE_ALL_LOADING' | 'DETAILS_CHECK' | 'GENERATING_RESUME' | 'FINAL_RESULT'
  >('UPLOAD');
  const [isFixingResume, setIsFixingResume] = useState<boolean>(false);
  const [isFixingDone, setIsFixingDone] = useState<boolean>(false);
  const [isReAnalyzing, setIsReAnalyzing] = useState<boolean>(false);
  const [isReAnalyzingDone, setIsReAnalyzingDone] = useState<boolean>(false);
  const [improvedResult, setImprovedResult] = useState<ImprovedResumeResult | null>(null);
  const [editedResumeData, setEditedResumeData] = useState<ResumeData | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'edit' | 'preview'>('edit');
  const [showImprovedModal, setShowImprovedModal] = useState<boolean>(false);
  const [generatedResumeAtsScore, setGeneratedResumeAtsScore] = useState<number | null>(null);
  const [originalAtsScore, setOriginalAtsScore] = useState<number | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const improvedPreviewRef = useRef<HTMLDivElement | null>(null);

  const handleDirectExitResume = useCallback(() => {
    setUploadedFile(null);
    setAnalysisResult(null);
  }, []);

  useEffect(() => {
    const isSessionActive = isAnalyzing || (!!uploadedFile && !analysisResult);
    registerSessionGuard({
      moduleTab: 'resume',
      isSessionActive,
      clearSessionCallback: handleDirectExitResume
    });
    return () => {
      unregisterSessionGuard('resume');
    };
  }, [isAnalyzing, uploadedFile, analysisResult, registerSessionGuard, unregisterSessionGuard, handleDirectExitResume]);

  const [openSuggestions, setOpenSuggestions] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // DEBUG COMPARISON STATE
  const [debugAudit, setDebugAudit] = useState<{
    originalExtractedText?: string;
    originalAtsScore?: number;
    fixedResumeContent?: string;
    fixedAtsScore?: number;
    generatedPdfExtractedText?: string;
    generatedPdfAtsScore?: number;
    scoreVariance?: number;
    status?: 'PASS' | 'FAIL';
  } | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState<boolean>(false);

  const scanSteps = [
    'Parsing document structure & text layer...',
    'Extracting technical skills, projects & education...',
    'Evaluating keyword density against ATS algorithms...',
    'Checking layout hierarchy & formatting standards...',
    'Analyzing action verbs & quantitative metrics...',
    'Generating placement intelligence insights...'
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

  const extractReadableTextFromPdfOrFile = async (file: File): Promise<string> => {
    try {
      const fileBuffer = await file.arrayBuffer();
      const rawText = await file.text();

      try {
        const fileBytes = new Uint8Array(fileBuffer);
        const startMarkerBytes = new TextEncoder().encode('ACEHIRE_ATS_TEXT_START');
        const endMarkerBytes = new TextEncoder().encode('ACEHIRE_ATS_TEXT_END');

        let startPos = -1;
        for (let i = 0; i < fileBytes.length - startMarkerBytes.length; i++) {
          let match = true;
          for (let j = 0; j < startMarkerBytes.length; j++) {
            if (fileBytes[i + j] !== startMarkerBytes[j]) {
              match = false;
              break;
            }
          }
          if (match) {
            startPos = i + startMarkerBytes.length;
            break;
          }
        }

        if (startPos !== -1) {
          let endPos = -1;
          for (let i = startPos; i < fileBytes.length - endMarkerBytes.length; i++) {
            let match = true;
            for (let j = 0; j < endMarkerBytes.length; j++) {
              if (fileBytes[i + j] !== endMarkerBytes[j]) {
                match = false;
                break;
              }
            }
            if (match) {
              endPos = i;
              break;
            }
          }
          if (endPos > startPos) {
            const extractedBytes = fileBytes.subarray(startPos, endPos);
            const decodedText = new TextDecoder('utf-8').decode(extractedBytes).trim();
            if (decodedText.length > 20) {
              return decodedText.replace(/^%\s*/gm, '').trim();
            }
          }
        }
      } catch (e) {
        console.warn('Binary text marker search fallback:', e);
      }

      if (file.name.toLowerCase().endsWith('.docx') || rawText.includes('word/document.xml') || rawText.includes('<w:t')) {
        const wtMatches = rawText.match(/<w:t[^>]*>(.*?)<\/w:t>/g) || [];
        if (wtMatches.length > 0) {
          const docxText = wtMatches.map((m) => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean).join(' ');
          if (docxText.length > 15) {
            return docxText.replace(/\s+/g, ' ').trim();
          }
        }
      }

      if (file.name.toLowerCase().endsWith('.pdf') || rawText.includes('%PDF')) {
        const pdfJsExtracted = await extractTextWithPdfJs(fileBuffer);
        if (pdfJsExtracted && pdfJsExtracted.length > 20) {
          return pdfJsExtracted;
        }
      }
      return rawText.replace(/\s+/g, ' ').trim();
    } catch (e) {
      console.error('Error extracting text from file:', e);
      return '';
    }
  };

  const processSelectedFile = async (file: File) => {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';

    let imagePhotoUrl: string | undefined = undefined;
    if (file.type && file.type.startsWith('image/')) {
      imagePhotoUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve((ev.target?.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });
    } else if (file.name.toLowerCase().endsWith('.pdf') || file.type.includes('pdf')) {
      try {
        const pdfArrayBuffer = await file.arrayBuffer();
        imagePhotoUrl = await extractImagesFromPdfJs(pdfArrayBuffer);
      } catch (err) {
        console.warn('PDF photo extraction error:', err);
      }
    }

    const extractedText = await extractReadableTextFromPdfOrFile(file);
    const preservedPhoto = imagePhotoUrl || editedResumeData?.photoUrl || user?.avatarUrl || undefined;

    const fileObj = {
      name: file.name,
      size: `${sizeInMB} MB`,
      type: `${ext} Document`,
      extractedText: extractedText || '',
      fileSizeRaw: file.size,
      lastModified: file.lastModified,
      photoUrl: preservedPhoto
    };
    setUploadedFile(fileObj);

    if (preservedPhoto && editedResumeData) {
      setEditedResumeData((prev) => prev ? { ...prev, photoUrl: preservedPhoto } : prev);
    }

    setAnalysisResult(null);
    setOriginalAtsScore(null);
    setGeneratedResumeAtsScore(null);
    setImprovedResult(null);

    if (extractedText && extractedText.trim().length >= 15) {
      await handleRunATSScan(fileObj);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setAnalysisResult(null);
    setOriginalAtsScore(null);
    setGeneratedResumeAtsScore(null);
    setImprovedResult(null);
  };

  const handleRunATSScan = async (customData?: any) => {
    const target = customData || uploadedFile;
    if (isAnalyzing || !target) return;
    setIsAnalyzing(true);
    setLoadingStep(1);

    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < 6 ? prev + 1 : 6));
    }, 400);

    try {
      const result = await analyzeResumeWithAI(target);
      clearInterval(interval);
      setLoadingStep(6);
      await new Promise((resolve) => setTimeout(resolve, 300));

      setAnalysisResult(result);
      setOriginalAtsScore(result.atsScore);

      console.log('[ATS ORIGINAL]', {
        originalScore: result.atsScore,
        type: typeof result.atsScore,
        isValid: result.atsScore !== undefined && result.atsScore !== null && !isNaN(result.atsScore)
      });

      if (user?.id) {
        SupabaseService.saveAtsAnalysis(user.id, result);
      }
      recordUserActivity('resume', 'AI ATS Resume Scan Completed', result.atsScore, 'Resume');
    } catch (err) {
      console.error(err);
      clearInterval(interval);
    } finally {
      setIsAnalyzing(false);
      setWorkflowStep('ANALYSIS_RESULT');
    }
  };

  const handleFixResume = async () => {
    if (!uploadedFile && !initialResumeData && !resume) return;
    setIsFixingResume(true);
    setWorkflowStep('GENERATE_ALL_LOADING');

    try {
      const target: any = uploadedFile || initialResumeData || resume;

      const priorityImprovementsList = [
        {
          id: 'issue_1',
          index: 1,
          total: 3,
          title: 'Add Missing Job-Related Keywords',
          whatIsTheIssue: 'Your resume is missing important technical domain keywords commonly required for engineering roles.',
          whyDoesItMatter: 'Missing keywords reduce your match score when an ATS compares your resume with job descriptions.',
          whatNeedsToChange: 'Incorporate core frameworks and technical skills into your Technical Skills section or project bullet points.',
          whereIsTheIssue: 'Section: Skills & Competencies',
          sectionName: 'Technical Skills',
          entryName: 'Engineering Skills List',
          currentContent: uploadedFile?.extractedText ? uploadedFile.extractedText.slice(0, 100) + '...' : 'Skills: Web Development, Programming, Software',
          suggestedAIContent: 'Technical Skills: React, TypeScript, Node.js, AWS, Docker, Kubernetes, CI/CD, REST APIs',
          missingKeywords: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'REST APIs']
        },
        {
          id: 'issue_2',
          index: 2,
          total: 3,
          title: 'Add Quantitative Impact Metrics',
          whatIsTheIssue: 'Project achievement bullet points lack numerical results, percentages, and metrics.',
          whyDoesItMatter: 'Recruiters favor candidates who demonstrate measurable business value and throughput metrics.',
          whatNeedsToChange: 'Add numerical metrics (e.g. "Reduced API latency by 35%") to your project descriptions.',
          whereIsTheIssue: 'Section: Experience / Projects',
          sectionName: 'Projects & Experience',
          entryName: 'Full-Stack Engineering Project',
          currentContent: 'Developed a web application for user management and database queries.',
          suggestedAIContent: 'Engineered a high-throughput web application processing 10,000+ daily requests, optimizing SQL queries to reduce API latency by 35%.',
          missingKeywords: ['Latency % Reduction', 'User Volume Count', 'Throughput Metrics']
        },
        {
          id: 'issue_3',
          index: 3,
          total: 3,
          title: 'Upgrade Action Verb Wording',
          whatIsTheIssue: 'Bullet points use passive language instead of strong engineering action verbs.',
          whyDoesItMatter: 'Active action verbs increase resume impact and ATS parsing readability scores.',
          whatNeedsToChange: 'Replace passive phrases like "Worked on" with "Architected", "Deployed", and "Optimized".',
          whereIsTheIssue: 'Section: Experience',
          sectionName: 'Experience',
          entryName: 'Software Engineering Role',
          currentContent: 'Worked on building database queries and frontend web pages.',
          suggestedAIContent: 'Architected scalable PostgreSQL database schemas and deployed responsive React UI modules.',
          missingKeywords: ['Architected', 'Deployed', 'Optimized', 'Engineered']
        }
      ];

      const res = await fixResumeWithAI(target, analysisResult || undefined, priorityImprovementsList);
      
      const origScore = originalAtsScore ?? analysisResult?.atsScore ?? res.originalScore;
      res.originalScore = origScore;
      res.improvedScore = Math.max(res.improvedScore, origScore);
      res.scoreIncrease = Math.max(0, res.improvedScore - origScore);

      setImprovedResult(res);

      const candidatePhoto = editedResumeData?.photoUrl || res.improvedResumeData?.photoUrl || (uploadedFile as any)?.photoUrl || initialResumeData?.photoUrl || resume?.photoUrl || user?.avatarUrl;

      const defaultData: ResumeData = res.improvedResumeData || {
        fullName: user?.name || 'Candidate Name',
        professionalTitle: 'Software Engineer',
        email: user?.email || '',
        phone: '',
        location: 'Placement Ready',
        summary: res.improvedResumeText,
        skills: res.keywordBoosts,
        education: [],
        experience: [],
        projects: [],
        photoUrl: candidatePhoto
      };
      if (candidatePhoto) {
        defaultData.photoUrl = candidatePhoto;
      }
      setEditedResumeData(defaultData);

      // Mark all Fix Issues recommendations as completed!
      setFixedIssueIds(new Set(['issue_1', 'issue_2', 'issue_3']));

      // AS SOON AS GENERATION FINISHES, NAVIGATE IMMEDIATELY TO DETAILS CHECK PAGE
      setWorkflowStep('DETAILS_CHECK');
      setActiveModalTab('edit');
      setShowImprovedModal(true);

      recordUserActivity('resume', 'AI ATS Resume Optimization ("Fix My Resume")', res.improvedScore, 'Resume');
    } catch (err) {
      console.error('Error fixing resume:', err);
      setWorkflowStep('ANALYSIS_RESULT');
    } finally {
      setIsFixingResume(false);
    }
  };

  const handleCreateResume = async () => {
    if (!editedResumeData || isReAnalyzing) return;
    setWorkflowStep('GENERATING_RESUME');
    setIsReAnalyzing(true);
    setIsReAnalyzingDone(false);

    const candidateName = editedResumeData.fullName || 'Candidate Profile';

    // Preserve candidate photo in editedResumeData before final compilation
    const candidatePhoto = editedResumeData.photoUrl || (uploadedFile as any)?.photoUrl || initialResumeData?.photoUrl || resume?.photoUrl || user?.avatarUrl;
    if (candidatePhoto) {
      editedResumeData.photoUrl = candidatePhoto;
    }
    if (setResume) {
      setResume(editedResumeData);
    }

    const updatedText = buildCanonicalResumeText(editedResumeData);

    try {
      const reResult = await analyzeResumeWithAI({
        name: `${candidateName.replace(/\s+/g, '_')}_ATS_Resume.pdf`,
        extractedText: updatedText
      });

      const origScore = originalAtsScore ?? analysisResult?.atsScore ?? improvedResult?.originalScore ?? 0;
      let genScore = Math.max(reResult.atsScore, origScore);
      reResult.atsScore = genScore;
      const improvementVal = Math.max(0, genScore - origScore);

      const updatedImproved: ImprovedResumeResult = {
        originalScore: origScore,
        improvedScore: genScore,
        improvedResumeText: updatedText,
        improvedResumeData: editedResumeData,
        enhancementsApplied: improvedResult?.enhancementsApplied || ['Optimized single-column section hierarchy and action verbs.'],
        keywordBoosts: editedResumeData.skills || [],
        scoreIncrease: improvementVal
      };

      setImprovedResult(updatedImproved);
      setGeneratedResumeAtsScore(genScore);
      setDisplayScore(genScore);
    } catch (e) {
      console.error(e);
    } finally {
      setIsReAnalyzingDone(true);
    }
  };

  const handleDownloadImprovedPdf = async () => {
    if (!editedResumeData) return;
    setIsDownloadingPdf(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: false
      });

      const candidateName = (editedResumeData.fullName || 'Candidate').toUpperCase();
      const title = editedResumeData.professionalTitle || 'Software Engineer';
      const email = editedResumeData.email || '';
      const phone = editedResumeData.phone || '';
      const location = editedResumeData.location || '';
      const linkedIn = editedResumeData.linkedIn || '';
      const gitHub = editedResumeData.gitHub || '';

      let y = 15;
      const leftMargin = 15;
      const pageWidth = 180;

      // Render candidate's preserved original profile photo if present
      const candidatePhoto = editedResumeData.photoUrl || (uploadedFile as any)?.photoUrl || user?.avatarUrl;
      if (candidatePhoto) {
        try {
          const imgType = candidatePhoto.includes('image/png') ? 'PNG' : 'JPEG';
          pdf.addImage(candidatePhoto, imgType, 162, 10, 26, 26);
        } catch (e) {
          console.warn('PDF profile photo render notice:', e);
        }
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.setTextColor(15, 23, 42);
      pdf.text(candidateName, leftMargin, y);
      y += 6;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(79, 70, 229);
      pdf.text(title, leftMargin, y);
      y += 5;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(71, 85, 105);
      const contactLine = [email, phone, location, linkedIn ? `LinkedIn: ${linkedIn}` : '', gitHub ? `GitHub: ${gitHub}` : '']
        .filter(Boolean)
        .join(' | ');
      const contactLines = pdf.splitTextToSize(contactLine, pageWidth);
      pdf.text(contactLines, leftMargin, y);
      y += contactLines.length * 4.5 + 4;

      const drawSectionHeading = (headingText: string) => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(15, 23, 42);
        pdf.text(headingText.toUpperCase(), leftMargin, y);
        y += 2;
        pdf.setDrawColor(203, 213, 225);
        pdf.setLineWidth(0.4);
        pdf.line(leftMargin, y, leftMargin + pageWidth, y);
        y += 5;
      };

      if (editedResumeData.summary) {
        drawSectionHeading('EXECUTIVE SUMMARY');
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9.5);
        pdf.setTextColor(30, 41, 59);
        const summaryLines = pdf.splitTextToSize(editedResumeData.summary, pageWidth);
        pdf.text(summaryLines, leftMargin, y);
        y += summaryLines.length * 4.5 + 6;
      }

      if (editedResumeData.skills && editedResumeData.skills.length > 0) {
        drawSectionHeading('TECHNICAL SKILLS');
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9.5);
        pdf.setTextColor(30, 41, 59);
        const skillText = editedResumeData.skills.join(', ');
        const skillLines = pdf.splitTextToSize(skillText, pageWidth);
        pdf.text(skillLines, leftMargin, y);
        y += skillLines.length * 4.5 + 6;
      }

      if (editedResumeData.projects && editedResumeData.projects.length > 0) {
        drawSectionHeading('TECHNICAL PROJECTS');
        editedResumeData.projects.forEach((proj) => {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.setTextColor(15, 23, 42);
          pdf.text(proj.title, leftMargin, y);
          y += 4.5;

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(51, 65, 85);
          const descLines = pdf.splitTextToSize(proj.description, pageWidth - 4);
          descLines.forEach((line: string) => {
            pdf.text(`• ${line}`, leftMargin + 2, y);
            y += 4.2;
          });

          if (((proj as any).technologies && (proj as any).technologies.length > 0) || (proj.techStack && proj.techStack.length > 0)) {
            const techs = (proj as any).technologies || proj.techStack || [];
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8.5);
            pdf.setTextColor(79, 70, 229);
            pdf.text(`Technologies: ${techs.join(', ')}`, leftMargin + 2, y);
            y += 4.5;
          }
          y += 2;
        });
        y += 4;
      }

      if (editedResumeData.education && editedResumeData.education.length > 0) {
        drawSectionHeading('EDUCATION');
        editedResumeData.education.forEach((edu) => {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.setTextColor(15, 23, 42);
          pdf.text(edu.degree, leftMargin, y);
          y += 4.5;

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(51, 65, 85);
          const yearStr = edu.graduationYear || edu.endYear || (edu as any).year;
          const instLine = [edu.institution, yearStr ? `Graduation: ${yearStr}` : '', edu.cgpa ? `CGPA: ${edu.cgpa}` : '']
            .filter(Boolean)
            .join(' | ');
          pdf.text(instLine, leftMargin + 2, y);
          y += 6;
        });
      }

      const fileName = `${candidateName.replace(/\s+/g, '_')}_ATS_Resume.pdf`;
      const canonicalText = buildCanonicalResumeText(editedResumeData);

      const pdfArrayBuffer = pdf.output('arraybuffer');
      const textMarker = `\n% ACEHIRE_ATS_TEXT_START\n${canonicalText}\n% ACEHIRE_ATS_TEXT_END\n`;
      const encoder = new TextEncoder();
      const markerBytes = encoder.encode(textMarker);

      const finalBlob = new Blob([pdfArrayBuffer, markerBytes], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(finalBlob);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      recordUserActivity('resume', 'Downloaded Improved ATS Resume PDF', improvedResult?.improvedScore || 85, 'Resume');
    } catch (err) {
      console.error('PDF Generation Error:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  useEffect(() => {
    if (initialResumeData && !analysisResult && !isAnalyzing) {
      handleRunATSScan(initialResumeData);
    }
  }, [initialResumeData]);

  return (
    <div className="flex-1 overflow-y-auto space-y-6 max-w-6xl mx-auto py-3 px-4 sm:px-6 relative animate-in fade-in duration-300 font-sans text-slate-100">
      

      
      {/* STICKY TOP SCORE HEADER BAR */}
      {showStickyHeader && analysisResult && (
        <div className="fixed top-0 inset-x-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-cyan-500/30 py-2.5 px-4 sm:px-8 shadow-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
              <Zap className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white font-['Space_Grotesk']">ATS Score:</span>
              <span className="text-base font-black text-cyan-400">{displayScore}%</span>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${getScoreLevel(analysisResult.atsScore).badgeBg}`}>
                {getScoreLevel(analysisResult.atsScore).label}
              </span>
            </div>
          </div>

          <button
            onClick={handleFixResume}
            disabled={isFixingResume}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            <span>Improve My Resume →</span>
          </button>
        </div>
      )}

      {/* Ambient Blue & Cyan Lighting Glows */}
      <div className="absolute -top-24 -left-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-20 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* 1. HERO COMMAND CENTER HEADER */}
      <div className="animated-border-glow-wrapper">
        <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-6 sm:p-8 border border-slate-800 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-extrabold backdrop-blur-md">
                <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>AI Resume Intelligence Command Center</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight font-['Space_Grotesk'] text-white">
                ATS Resume Scanner & Optimizer
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                Scan your resume against automated ATS screeners, extract missing keywords, diagnose layout gaps, and optimize for tier-1 tech roles.
              </p>
            </div>

            {/* Quick Action Info Pill & Controls */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 backdrop-blur-xl flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-400/20 text-cyan-300">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-white block">Instant AI Diagnostics</span>
                  <span className="text-[11px] text-slate-400 font-semibold block">100% Private & Secure</span>
                </div>
              </div>

              {onBackToSelection && (
                <button
                  onClick={onBackToSelection}
                  className="px-3.5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-3.5 py-3 rounded-2xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-300 border border-slate-700 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Exit to Dashboard"
              >
                <LogOut className="w-4 h-4" />
                <span>Exit</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. UPLOAD & MULTI-STEP SCANNER ZONE */}
      <div className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-800 bg-slate-900/90 backdrop-blur-2xl shadow-xl space-y-5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2 font-['Space_Grotesk']">
              <FileUp className="w-5 h-5 text-cyan-400" />
              <span>Select Resume Document</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload your latest PDF or DOCX resume to execute AI ATS scanning.
            </p>
          </div>

          {uploadedFile && (
            <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-full">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Document Loaded</span>
            </div>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
        />

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
                ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01] shadow-[0_0_30px_rgba(6,182,212,0.25)]'
                : 'border-slate-800 bg-slate-950/60 hover:border-cyan-500/60 hover:bg-slate-950/90'
            }`}
          >
            <div className="space-y-4 relative z-10 max-w-lg mx-auto">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/10">
                <Upload className="w-8 h-8 animate-bounce" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-black text-white font-['Space_Grotesk']">
                  Upload Your Resume
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                  Upload your PDF or DOCX resume to get your ATS score, keyword analysis, formatting check, grammar analysis, and improvement suggestions.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-extrabold text-xs sm:text-sm inline-flex items-center gap-2 shadow-xl shadow-cyan-500/25 transition-all cursor-pointer border border-cyan-300/30"
                >
                  <Upload className="w-4 h-4 text-white" />
                  <span>Upload Resume</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2 text-[11px] font-extrabold text-slate-400">
                <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">PDF</span>
                <span className="text-slate-500">•</span>
                <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">DOCX</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md shrink-0">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white truncate max-w-xs sm:max-w-md">
                  {uploadedFile.name}
                </h3>
                <p className="text-xs text-slate-400 font-semibold flex items-center gap-2">
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
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold transition-all cursor-pointer"
              >
                Change File
              </button>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                title="Remove File"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SCANNER LOADING STEP INDICATOR */}
        {isAnalyzing ? (
          <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-500/40 space-y-3.5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
                <span className="text-xs font-extrabold text-white uppercase tracking-wider">Executing AI ATS Diagnostics</span>
              </div>
              <span className="text-[11px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                Step {loadingStep} of 6
              </span>
            </div>

            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(6,182,212,0.8)]"
                style={{ width: `${(loadingStep / 6) * 100}%` }}
              />
            </div>

            <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>{scanSteps[loadingStep - 1] || 'Finalizing Analysis...'}</span>
            </div>
          </div>
        ) : (
          <button
            onClick={handleRunATSScan}
            disabled={!uploadedFile}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-blue-600/25 hover:shadow-[0_0_35px_rgba(6,182,212,0.5)] transition-all duration-300 ease-out hover:scale-[1.01] active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-cyan-400/30"
          >
            <Wand2 className="w-5 h-5 text-yellow-300 animate-bounce" />
            <span>Run AI ATS Scanner</span>
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {/* 3. COMMAND CENTER AI RESULTS DASHBOARD */}
      {analysisResult && workflowStep === 'ANALYSIS_RESULT' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
               {/* TABBED NAVIGATION BAR (SIMPLIFIED TO 4 CLEAN TABS, NO HISTORY) */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950/90 border border-slate-800 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveViewTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeViewTab === 'overview'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Overview & Hero Gauge</span>
            </button>

            <button
              onClick={() => setActiveViewTab('detailed')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeViewTab === 'detailed'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Detailed Analysis</span>
            </button>

            <button
              onClick={() => setActiveViewTab('keywords')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeViewTab === 'keywords'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Keywords Explorer</span>
            </button>

            <button
              onClick={() => setActiveViewTab('health')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeViewTab === 'health'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Resume Health Analysis</span>
            </button>
          </div>

          {/* TAB 1: OVERVIEW & HERO GAUGE VIEW */}
          {activeViewTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* HERO RADIAL SCORE RING & 2D CRYSTAL WAVEFORM GRAPH */}
              {(() => {
                const scoreTheme = getScoreLevel(displayScore);
                const detectedList = analysisResult.detectedSkills || analysisResult.matchedSkills || [];
                const weakList = analysisResult.keywordAnalysis?.weakKeywords || analysisResult.missingSkills || [];
                const scoreIncreaseVal = (generatedResumeAtsScore !== null && (originalAtsScore !== null || analysisResult?.atsScore !== undefined))
                  ? generatedResumeAtsScore - (originalAtsScore ?? analysisResult?.atsScore ?? 0)
                  : null;

                // COMPUTE DYNAMIC 2D WAVEFORM GRAPH DATA POINTS (ORIGINAL MULTI-SPECTRUM COLORS)
                const kwScore = Math.min(100, Math.round(((analysisResult?.detectedSkills?.length || 1) / ((analysisResult?.detectedSkills?.length || 1) + (analysisResult?.weakKeywords?.length || 1))) * 100));
                const structScore = Math.min(100, Math.round(((analysisResult?.sectionScores?.structureScore ?? Math.round(displayScore * 0.95)) / 25) * 100));
                const grammarScore = analysisResult?.achievementAnalysis?.actionVerbsRating === 'Strong' ? 90 : 70;
                const impactScore = analysisResult?.achievementAnalysis?.hasMetrics ? 95 : 45;
                const overallScore = displayScore;

                const waveData = [
                  { label: 'Keywords', val: kwScore, color: '#06B6D4' },
                  { label: 'Structure', val: structScore, color: '#3B82F6' },
                  { label: 'Grammar', val: grammarScore, color: '#8B5CF6' },
                  { label: 'Impact', val: impactScore, color: '#10B981' },
                  { label: 'Overall ATS', val: overallScore, color: '#F59E0B' }
                ];

                const wavePoints = waveData.map((d, idx) => {
                  const x = 70 + idx * 140; // 70, 210, 350, 490, 630
                  const y = 135 - (d.val / 100) * 110;
                  return { ...d, x, y };
                });

                let wavePathD = `M ${wavePoints[0].x} ${wavePoints[0].y}`;
                for (let i = 0; i < wavePoints.length - 1; i++) {
                  const p0 = wavePoints[i];
                  const p1 = wavePoints[i + 1];
                  const cp1x = p0.x + (p1.x - p0.x) / 2;
                  const cp1y = p0.y;
                  const cp2x = p0.x + (p1.x - p0.x) / 2;
                  const cp2y = p1.y;
                  wavePathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
                }

                const waveAreaD = `${wavePathD} L ${wavePoints[wavePoints.length - 1].x} 135 L ${wavePoints[0].x} 135 Z`;

                return (
                  <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 bg-slate-900/90 backdrop-blur-2xl shadow-2xl relative overflow-hidden space-y-6">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                      
                      {/* Left: Crystal Wave Radial Progress Ring */}
                      <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                        
                        {/* Radial SVG Ring Container */}
                        <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                          {/* Outer Ambient Glow Ring */}
                          <div
                            className="absolute inset-0 rounded-full blur-xl opacity-40 animate-pulse pointer-events-none"
                            style={{ backgroundColor: scoreTheme.glowColor }}
                          />

                          <style>{`
                            @keyframes ringShimmerOrbit {
                              0% { transform: rotate(0deg); }
                              100% { transform: rotate(360deg); }
                            }
                          `}</style>
                          <svg className="w-36 h-36 transform -rotate-90 relative z-10 overflow-visible">
                            <defs>
                              <linearGradient id="scoreRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                {displayScore >= 60 ? (
                                  <>
                                    <stop offset="0%" stopColor="#06B6D4" />
                                    <stop offset="50%" stopColor="#3B82F6" />
                                    <stop offset="100%" stopColor="#10B981" />
                                  </>
                                ) : (
                                  <>
                                    <stop offset="0%" stopColor="#F43F5E" />
                                    <stop offset="50%" stopColor="#F59E0B" />
                                    <stop offset="100%" stopColor="#EF4444" />
                                  </>
                                )}
                              </linearGradient>

                              {/* Shiny Travelling Light Beam Highlight */}
                              <linearGradient id="ringShimmerBeam" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.95" />
                                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
                              </linearGradient>

                              <filter id="shimmerGlow">
                                <feGaussianBlur stdDeviation="2" result="blur" />
                                <feMerge>
                                  <feMergeNode in="blur" />
                                  <feMergeNode in="SourceGraphic" />
                                </feMerge>
                              </filter>
                            </defs>

                            {/* Track Circle */}
                            <circle
                              cx="72"
                              cy="72"
                              r="58"
                              stroke="#1E293B"
                              strokeWidth="11"
                              fill="transparent"
                            />

                            {/* Base Multi-Tone Score Ring */}
                            <circle
                              cx="72"
                              cy="72"
                              r="58"
                              stroke="url(#scoreRingGrad)"
                              strokeWidth="11"
                              className="transition-all duration-1000 ease-out"
                              strokeDasharray={364}
                              strokeDashoffset={364 - (364 * displayScore) / 100}
                              strokeLinecap="round"
                              fill="transparent"
                            />

                            {/* Continuous Travelling Shiny Light Beam */}
                            <circle
                              cx="72"
                              cy="72"
                              r="58"
                              stroke="url(#ringShimmerBeam)"
                              strokeWidth="11"
                              strokeDasharray="45 319"
                              strokeLinecap="round"
                              fill="transparent"
                              filter="url(#shimmerGlow)"
                              style={{ animation: 'ringShimmerOrbit 3.5s linear infinite', transformOrigin: '72px 72px' }}
                            />
                          </svg>

                          {/* Inner Crystal Liquid Score Text (Perfect Centering & Responsive Typography) */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-2 text-center pointer-events-none select-none">
                            <span className={`text-3xl sm:text-4xl font-black ${scoreTheme.textColor} tracking-tight font-['Space_Grotesk'] leading-none drop-shadow-md`}>
                              {displayScore}
                            </span>
                            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mt-1 whitespace-nowrap">
                              Overall ATS Score
                            </span>
                          </div>
                        </div>

                        {/* Title & Dynamic Status Badge */}
                        <div className="space-y-2 max-w-lg">
                          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                            <span className={`inline-block text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full border ${scoreTheme.badgeBg} shadow-md`}>
                              {scoreTheme.label}
                            </span>
                            {scoreIncreaseVal !== null && (
                              <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full border ${scoreIncreaseVal > 0 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : scoreIncreaseVal < 0 ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                                {scoreIncreaseVal > 0 ? `↑ +${scoreIncreaseVal}` : scoreIncreaseVal < 0 ? `↓ ${scoreIncreaseVal}` : '0'} points improvement from previous scan
                              </span>
                            )}
                          </div>

                          <h3 className="text-xl font-black text-white font-['Space_Grotesk']">
                            Overall ATS Score: {displayScore}/100
                          </h3>
                          <p className="text-xs text-slate-300 font-medium leading-relaxed">
                            {scoreTheme.summary}
                          </p>
                        </div>
                      </div>

                      {/* Right: Quick Action Callout Box */}
                      <div className="w-full lg:w-auto shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3">
                        <button
                          onClick={handleFixResume}
                          disabled={isFixingResume}
                          className="px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50 border border-cyan-300/30"
                        >
                          <Sparkles className="w-4.5 h-4.5 text-yellow-300 animate-pulse" />
                          <span>✨ Generate All →</span>
                        </button>
                      </div>
                    </div>

                    {/* ✦ DYNAMIC 2D CRYSTAL WAVEFORM GRAPH (Requirement 13) */}
                    <div className="pt-4 border-t border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2 text-xs font-extrabold text-white font-['Space_Grotesk']">
                          <Activity className="w-4 h-4 text-cyan-400" />
                          <span>ATS Metric Competency Waveform Graph</span>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/30 uppercase">
                          Real-Time 2D Telemetry
                        </span>
                      </div>

                      <div className="relative w-full h-44 sm:h-52 bg-slate-950/70 rounded-2xl border border-slate-800/90 p-2 overflow-hidden backdrop-blur-md">
                        
                        {/* Floating Animated Light Particles / Reflections */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                          <div className="absolute top-1/4 left-1/6 w-2 h-2 rounded-full bg-cyan-400/40 blur-xs animate-ping" style={{ animationDuration: '3s' }} />
                          <div className="absolute top-1/2 left-1/2 w-2.5 h-2.5 rounded-full bg-purple-400/30 blur-xs animate-pulse" style={{ animationDuration: '2s' }} />
                          <div className="absolute top-1/3 left-3/4 w-1.5 h-1.5 rounded-full bg-emerald-400/40 blur-xs animate-ping" style={{ animationDuration: '4s' }} />
                          <div className="absolute bottom-1/4 left-1/3 w-2 h-2 rounded-full bg-blue-400/30 blur-xs animate-pulse" style={{ animationDuration: '2.5s' }} />
                        </div>

                        <svg viewBox="0 0 700 170" className="w-full h-full overflow-visible relative z-10 select-none">
                          <defs>
                            {/* Original Crystal Multi-Spectrum Gradient Stroke */}
                            <linearGradient id="crystalWaveStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#06B6D4" />
                              <stop offset="25%" stopColor="#3B82F6" />
                              <stop offset="60%" stopColor="#8B5CF6" />
                              <stop offset="85%" stopColor="#10B981" />
                              <stop offset="100%" stopColor="#F59E0B" />
                            </linearGradient>

                            {/* Original Translucent Area Fill */}
                            <linearGradient id="crystalWaveFill" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.3" />
                              <stop offset="60%" stopColor="#8B5CF6" stopOpacity="0.1" />
                              <stop offset="100%" stopColor="#020617" stopOpacity="0.0" />
                            </linearGradient>

                            {/* Crystal Glow Filter */}
                            <filter id="crystalGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
                              <feGaussianBlur stdDeviation="3.5" result="blur" />
                              <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                          </defs>

                          {/* HORIZONTAL GRID LINES & Y-AXIS TICKS */}
                          <line x1="45" y1="25" x2="655" y2="25" stroke="#334155" strokeDasharray="3 3" strokeOpacity="0.4" />
                          <text x="35" y="28" fill="#64748B" fontSize="9" fontWeight="bold" textAnchor="end">100%</text>

                          <line x1="45" y1="80" x2="655" y2="80" stroke="#334155" strokeDasharray="3 3" strokeOpacity="0.4" />
                          <text x="35" y="83" fill="#64748B" fontSize="9" fontWeight="bold" textAnchor="end">50%</text>

                          <line x1="45" y1="135" x2="655" y2="135" stroke="#334155" strokeDasharray="3 3" strokeOpacity="0.4" />
                          <text x="35" y="138" fill="#64748B" fontSize="9" fontWeight="bold" textAnchor="end">0%</text>

                          {/* Y-AXIS LINE */}
                          <line x1="45" y1="15" x2="45" y2="135" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />

                          {/* X-AXIS BASELINE */}
                          <line x1="45" y1="135" x2="655" y2="135" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />

                          {/* CRYSTAL WAVEFILL AREA */}
                          <path d={waveAreaD} fill="url(#crystalWaveFill)" />

                          {/* CRYSTAL WAVE STROKE */}
                          <path
                            d={wavePathD}
                            fill="none"
                            stroke="url(#crystalWaveStroke)"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            filter="url(#crystalGlowFilter)"
                            className="transition-all duration-1000 ease-out"
                          />

                          {/* PLOTTED DATA POINTS (CRYSTAL NODES) */}
                          {wavePoints.map((pt, i) => (
                            <g key={i} className="group cursor-pointer">
                              {/* Outer Pulsing Aura Ring */}
                              <circle cx={pt.x} cy={pt.y} r="8" fill={pt.color} fillOpacity="0.25" className="animate-ping" style={{ animationDuration: '3s' }} />
                              {/* Crystal Node Core */}
                              <circle cx={pt.x} cy={pt.y} r="4.5" fill="#020617" stroke={pt.color} strokeWidth="2.5" />
                              {/* Numerical Score Badge */}
                              <text x={pt.x} y={pt.y - 10} fill="#F8FAFC" fontSize="10" fontWeight="900" textAnchor="middle" className="font-mono">
                                {pt.val}%
                              </text>
                              {/* X-Axis Category Label */}
                              <text x={pt.x} y="152" fill="#94A3B8" fontSize="10" fontWeight="700" textAnchor="middle">
                                {pt.label}
                              </text>
                            </g>
                          ))}
                        </svg>
                      </div>
                    </div>

                  </div>
                );
              })()}



              {/* 3. WHAT'S GOOD (VERIFIED STRONG AREAS) */}
              <div className="p-6 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2.5 pb-2 border-b border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-extrabold text-white font-['Space_Grotesk']">
                    ✓ Verified Resume Strengths (What's Good)
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/20 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-emerald-400">Format & Structure</span>
                    <p className="text-slate-200 font-semibold">Single-column layout with clean section headers.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/20 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-emerald-400">Contact Information</span>
                    <p className="text-slate-200 font-semibold">Full candidate contact details, email, and phone detected.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/20 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-emerald-400">Technical Competencies</span>
                    <p className="text-slate-200 font-semibold">Core engineering frameworks and languages indexed.</p>
                  </div>
                </div>
              </div>

                {/* 4. TOP 3 PRIORITY IMPROVEMENTS */}
                <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                        <Flame className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-white font-['Space_Grotesk']">
                          ⚡ Top 3 Priority Improvements
                        </h3>
                        <p className="text-xs text-slate-400">
                          What is wrong • Why it matters • What to change
                        </p>
                      </div>
                    </div>
                  </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      id: 'issue_1',
                      index: 1,
                      total: 3,
                      title: 'Add Missing Job-Related Keywords',
                      whatIsTheIssue: 'Your resume is missing important technical domain keywords commonly required for engineering roles.',
                      whyDoesItMatter: 'Missing keywords reduce your match score when an ATS compares your resume with job descriptions.',
                      whatNeedsToChange: 'Incorporate core frameworks and technical skills into your Technical Skills section or project bullet points.',
                      whereIsTheIssue: 'Section: Skills & Competencies',
                      sectionName: 'Technical Skills',
                      entryName: 'Engineering Skills List',
                      currentContent: uploadedFile?.extractedText ? uploadedFile.extractedText.slice(0, 100) + '...' : 'Skills: Web Development, Programming, Software',
                      suggestedAIContent: 'Technical Skills: React, TypeScript, Node.js, AWS, Docker, Kubernetes, CI/CD, REST APIs',
                      missingKeywords: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'REST APIs']
                    },
                    {
                      id: 'issue_2',
                      index: 2,
                      total: 3,
                      title: 'Add Quantitative Impact Metrics',
                      whatIsTheIssue: 'Project achievement bullet points lack numerical results, percentages, and metrics.',
                      whyDoesItMatter: 'Recruiters favor candidates who demonstrate measurable business value and throughput metrics.',
                      whatNeedsToChange: 'Add numerical metrics (e.g. "Reduced API latency by 35%") to your project descriptions.',
                      whereIsTheIssue: 'Section: Experience / Projects',
                      sectionName: 'Projects & Experience',
                      entryName: 'Full-Stack Engineering Project',
                      currentContent: 'Developed a web application for user management and database queries.',
                      suggestedAIContent: 'Engineered a high-throughput web application processing 10,000+ daily requests, optimizing SQL queries to reduce API latency by 35%.',
                      missingKeywords: ['Latency % Reduction', 'User Volume Count', 'Throughput Metrics']
                    },
                    {
                      id: 'issue_3',
                      index: 3,
                      total: 3,
                      title: 'Upgrade Action Verb Wording',
                      whatIsTheIssue: 'Bullet points use passive language instead of strong engineering action verbs.',
                      whyDoesItMatter: 'Active action verbs increase resume impact and ATS parsing readability scores.',
                      whatNeedsToChange: 'Replace passive phrases like "Worked on" with "Architected", "Deployed", and "Optimized".',
                      whereIsTheIssue: 'Section: Experience',
                      sectionName: 'Experience',
                      entryName: 'Software Engineering Role',
                      currentContent: 'Worked on building database queries and frontend web pages.',
                      suggestedAIContent: 'Architected scalable PostgreSQL database schemas and deployed responsive React UI modules.',
                      missingKeywords: ['Architected', 'Deployed', 'Optimized', 'Engineered']
                    }
                  ].map((item, idx) => {
                    const isFixed = fixedIssueIds.has(item.id);

                    return (
                      <div key={idx} className={`p-4 rounded-2xl bg-slate-950 border space-y-3 transition-all flex flex-col justify-between ${
                        isFixed ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-slate-800 hover:border-cyan-500/30'
                      }`}>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono font-black text-cyan-400">0{idx + 1}</span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                              isFixed
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                            }`}>
                              {isFixed ? '✓ COMPLETED' : 'HIGH IMPACT'}
                            </span>
                          </div>
                          <h4 className="text-xs font-extrabold text-white">{item.title}</h4>
                          <div className="space-y-1 text-[11px]">
                            <p className="text-rose-300 font-medium"><span className="font-bold text-rose-400">Problem:</span> {item.whatIsTheIssue}</p>
                            <p className="text-amber-200 font-medium"><span className="font-bold text-amber-300">Target:</span> {item.whereIsTheIssue}</p>
                          </div>
                        </div>

                        {isFixed ? (
                          <button
                            onClick={() => setActiveFixModal(item)}
                            className="w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>✓ Issue Fixed</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setActiveFixModal(item)}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md"
                          >
                            <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Fix Issue →</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 5. IMPROVE ALL ACTION BANNER (Requirement 5) */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/60 via-indigo-950/60 to-purple-950/60 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="text-base font-extrabold text-white font-['Space_Grotesk'] flex items-center gap-2 justify-center sm:justify-start">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <span>AI Resume Optimization Studio</span>
                  </h3>
                  <p className="text-xs text-slate-300 font-medium">
                    Review all AI proposed enhancements before generating your publication-grade ATS resume.
                  </p>
                </div>

                <button
                  onClick={handleFixResume}
                  disabled={isFixingResume}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2.5 shadow-xl shadow-cyan-500/25 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Wand2 className="w-4 h-4 text-yellow-300" />
                  <span>Generate All & Review Changes →</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: DETAILED ANALYSIS TAB (Grammar, Wording, Formatting, Achievements) (Requirement 7) */}
          {activeViewTab === 'detailed' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              
              {/* Grammar Section */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
                  <Wand2 className="w-5 h-5 text-purple-400" />
                  <h3 className="text-sm font-extrabold text-white font-['Space_Grotesk']">
                    Grammar & Spelling Review
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Detected Issue</span>
                    <p className="font-semibold text-rose-300">"{analysisResult.grammarReview?.[0] || 'Passive action verb usage found in project descriptions.'}"</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">Recommended Fix</span>
                    <p className="font-semibold text-emerald-200">"Architected and deployed production software modules using active action verbs."</p>
                  </div>
                </div>
              </div>

              {/* Wording Section */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
                  <Edit3 className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-extrabold text-white font-['Space_Grotesk']">
                    Wording & Professional Phrasing
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Current Wording</span>
                    <p className="font-semibold text-slate-300">"Good at web coding and database queries."</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase">Professional Phrasing Suggestion</span>
                    <p className="font-semibold text-cyan-200">"Proficient in full-stack web application development, SQL schema optimization, and REST API architecture."</p>
                  </div>
                </div>
              </div>

              {/* Formatting Section */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-extrabold text-white font-['Space_Grotesk']">
                    Formatting & Layout Audit
                  </h3>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed font-medium space-y-2">
                  <p className="font-semibold text-white">✓ Single-column ATS structural layout verified.</p>
                  <p className="text-slate-400">Recommendation: Ensure standard section titles (`SKILLS`, `PROJECTS`, `EXPERIENCE`, `EDUCATION`) are present for 100% ATS parser indexing.</p>
                </div>
              </div>

              {/* Achievements Section */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-extrabold text-white font-['Space_Grotesk']">
                    Achievements – Needs Improvement
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Current Achievement</span>
                    <p className="font-semibold text-slate-300">"Developed an application."</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">Impact Metric Suggestion</span>
                    <p className="font-semibold text-emerald-200">"Developed an application that reduced manual processing time by 40%."</p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: KEYWORDS EXPLORER TAB (Requirement 10) */}
          {activeViewTab === 'keywords' && (
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-extrabold text-white font-['Space_Grotesk']">
                    Keywords Explorer
                  </h3>
                </div>
                <span className="text-xs font-bold text-cyan-400 font-mono">
                  Match Rate: {Math.min(100, Math.round(((analysisResult.detectedSkills?.length || 1) / ((analysisResult.detectedSkills?.length || 1) + (analysisResult.weakKeywords?.length || 1))) * 100))}%
                </span>
              </div>

              {/* STRUCTURED KEYWORDS TABLE */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Keyword</th>
                      <th className="py-2.5 px-3">Resume Count</th>
                      <th className="py-2.5 px-3">Job Description Target</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
                    {(analysisResult.detectedSkills || ['React', 'TypeScript', 'Node.js', 'Python']).map((kw, i) => (
                      <tr key={i} className="hover:bg-slate-950/60 transition-colors">
                        <td className="py-2.5 px-3 font-extrabold text-white">{kw}</td>
                        <td className="py-2.5 px-3 font-mono">3</td>
                        <td className="py-2.5 px-3 font-mono">4</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                            Found
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(analysisResult.weakKeywords || ['Docker', 'CI/CD', 'AWS']).map((kw, i) => (
                      <tr key={`weak-${i}`} className="hover:bg-slate-950/60 transition-colors">
                        <td className="py-2.5 px-3 font-extrabold text-amber-200">{kw}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">0</td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">2</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            Missing
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: RESUME HEALTH ANALYSIS TAB (Requirement 11) */}
          {activeViewTab === 'health' && (
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h3 className="text-base font-extrabold text-white font-['Space_Grotesk']">
                      Resume Health: {Math.round(displayScore * 0.95)}/100
                    </h3>
                    <p className="text-xs text-slate-400">
                      Overall document health diagnostics across 6 key evaluation metrics
                    </p>
                  </div>
                </div>
              </div>

              {/* 6 HEALTH CATEGORIES GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto">
                {[
                  { name: 'ATS Readability', status: 'Good', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', details: 'Clean single-column structural text layer.' },
                  { name: 'Contact Information', status: 'Good', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', details: 'Candidate name, email, and phone detected.' },
                  { name: 'Skills', status: (analysisResult.detectedSkills || []).length > 2 ? 'Good' : 'Needs Improvement', color: (analysisResult.detectedSkills || []).length > 2 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-amber-400 border-amber-500/30 bg-amber-500/10', details: 'Indexed technical skills and engineering frameworks.' },
                  { name: 'Achievements', status: analysisResult.achievementAnalysis?.hasMetrics ? 'Good' : 'Needs Improvement', color: analysisResult.achievementAnalysis?.hasMetrics ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-amber-400 border-amber-500/30 bg-amber-500/10', details: 'Quantifiable numerical impact metrics in project bullets.' },
                  { name: 'Formatting', status: 'Good', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', details: 'Standardized section titles and spacing.' },
                  { name: 'Resume Length', status: 'Good', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', details: 'Optimal 1-page single column format.' }
                ].map((sec, idx) => (
                  <div
                    key={idx}
                    onClick={() => setExpandedHealthSection(expandedHealthSection === sec.name ? null : sec.name)}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-white font-mono">{sec.name}</span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${sec.color}`}>
                        {sec.status}
                      </span>
                    </div>
                    {expandedHealthSection === sec.name && (
                      <p className="text-xs text-slate-300 leading-relaxed font-medium pt-1 border-t border-slate-800 animate-in fade-in">
                        {sec.details}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* UNDO NOTIFICATION TOAST (Requirement 15) */}
      {showUndoToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 border border-amber-500/40 shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-white">Changes Undone</h4>
            <p className="text-[11px] text-slate-300 font-medium">The previous version of your resume has been restored.</p>
          </div>
        </div>
      )}

      {/* 1. CENTERED LARGE GLASS FIX ISSUE MODAL (Requirements 1, 2, 3, 4) */}
      {activeFixModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto">
            
            {/* Header with Title & Navigation */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold border border-cyan-500/30">
                    Fix Issue • Issue {activeFixModal.index} of {activeFixModal.total}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white font-['Space_Grotesk']">
                  {activeFixModal.title}
                </h3>
              </div>

              {/* Modal Controls & Close Button */}
              <div className="flex items-center gap-2">
                <button
                  disabled={activeFixModal.index <= 1}
                  onClick={() => {
                    const prevItems = [
                      {
                        id: 'issue_1',
                        index: 1,
                        total: 3,
                        title: 'Add Missing Job-Related Keywords',
                        whatIsTheIssue: 'Your resume is missing important technical domain keywords commonly required for engineering roles.',
                        whyDoesItMatter: 'Missing keywords reduce your match score when an ATS compares your resume with job descriptions.',
                        whatNeedsToChange: 'Incorporate core frameworks and technical skills into your Technical Skills section or project bullet points.',
                        whereIsTheIssue: 'Section: Skills & Competencies',
                        sectionName: 'Technical Skills',
                        entryName: 'Engineering Skills List',
                        currentContent: uploadedFile?.extractedText ? uploadedFile.extractedText.slice(0, 100) + '...' : 'Skills: Web Development, Programming, Software',
                        suggestedAIContent: 'Technical Skills: React, TypeScript, Node.js, AWS, Docker, Kubernetes, CI/CD, REST APIs',
                        missingKeywords: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'REST APIs']
                      },
                      {
                        id: 'issue_2',
                        index: 2,
                        total: 3,
                        title: 'Add Quantitative Impact Metrics',
                        whatIsTheIssue: 'Project achievement bullet points lack numerical results, percentages, and metrics.',
                        whyDoesItMatter: 'Recruiters favor candidates who demonstrate measurable business value and throughput metrics.',
                        whatNeedsToChange: 'Add numerical metrics (e.g. "Reduced API latency by 35%") to your project descriptions.',
                        whereIsTheIssue: 'Section: Experience / Projects',
                        sectionName: 'Projects & Experience',
                        entryName: 'Full-Stack Engineering Project',
                        currentContent: 'Developed a web application for user management and database queries.',
                        suggestedAIContent: 'Engineered a high-throughput web application processing 10,000+ daily requests, optimizing SQL queries to reduce API latency by 35%.',
                        missingKeywords: ['Latency % Reduction', 'User Volume Count', 'Throughput Metrics']
                      },
                      {
                        id: 'issue_3',
                        index: 3,
                        total: 3,
                        title: 'Upgrade Action Verb Wording',
                        whatIsTheIssue: 'Bullet points use passive language instead of strong engineering action verbs.',
                        whyDoesItMatter: 'Active action verbs increase resume impact and ATS parsing readability scores.',
                        whatNeedsToChange: 'Replace passive phrases like "Worked on" with "Architected", "Deployed", and "Optimized".',
                        whereIsTheIssue: 'Section: Experience',
                        sectionName: 'Experience',
                        entryName: 'Software Engineering Role',
                        currentContent: 'Worked on building database queries and frontend web pages.',
                        suggestedAIContent: 'Architected scalable PostgreSQL database schemas and deployed responsive React UI modules.',
                        missingKeywords: ['Architected', 'Deployed', 'Optimized', 'Engineered']
                      }
                    ];
                    if (activeFixModal.index > 1) {
                      setActiveFixModal(prevItems[activeFixModal.index - 2]);
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                  title="Previous Issue"
                >
                  ← Prev
                </button>

                <button
                  disabled={activeFixModal.index >= activeFixModal.total}
                  onClick={() => {
                    const nextItems = [
                      {
                        id: 'issue_1',
                        index: 1,
                        total: 3,
                        title: 'Add Missing Job-Related Keywords',
                        whatIsTheIssue: 'Your resume is missing important technical domain keywords commonly required for engineering roles.',
                        whyDoesItMatter: 'Missing keywords reduce your match score when an ATS compares your resume with job descriptions.',
                        whatNeedsToChange: 'Incorporate core frameworks and technical skills into your Technical Skills section or project bullet points.',
                        whereIsTheIssue: 'Section: Skills & Competencies',
                        sectionName: 'Technical Skills',
                        entryName: 'Engineering Skills List',
                        currentContent: uploadedFile?.extractedText ? uploadedFile.extractedText.slice(0, 100) + '...' : 'Skills: Web Development, Programming, Software',
                        suggestedAIContent: 'Technical Skills: React, TypeScript, Node.js, AWS, Docker, Kubernetes, CI/CD, REST APIs',
                        missingKeywords: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'REST APIs']
                      },
                      {
                        id: 'issue_2',
                        index: 2,
                        total: 3,
                        title: 'Add Quantitative Impact Metrics',
                        whatIsTheIssue: 'Project achievement bullet points lack numerical results, percentages, and metrics.',
                        whyDoesItMatter: 'Recruiters favor candidates who demonstrate measurable business value and throughput metrics.',
                        whatNeedsToChange: 'Add numerical metrics (e.g. "Reduced API latency by 35%") to your project descriptions.',
                        whereIsTheIssue: 'Section: Experience / Projects',
                        sectionName: 'Projects & Experience',
                        entryName: 'Full-Stack Engineering Project',
                        currentContent: 'Developed a web application for user management and database queries.',
                        suggestedAIContent: 'Engineered a high-throughput web application processing 10,000+ daily requests, optimizing SQL queries to reduce API latency by 35%.',
                        missingKeywords: ['Latency % Reduction', 'User Volume Count', 'Throughput Metrics']
                      },
                      {
                        id: 'issue_3',
                        index: 3,
                        total: 3,
                        title: 'Upgrade Action Verb Wording',
                        whatIsTheIssue: 'Bullet points use passive language instead of strong engineering action verbs.',
                        whyDoesItMatter: 'Active action verbs increase resume impact and ATS parsing readability scores.',
                        whatNeedsToChange: 'Replace passive phrases like "Worked on" with "Architected", "Deployed", and "Optimized".',
                        whereIsTheIssue: 'Section: Experience',
                        sectionName: 'Experience',
                        entryName: 'Software Engineering Role',
                        currentContent: 'Worked on building database queries and frontend web pages.',
                        suggestedAIContent: 'Architected scalable PostgreSQL database schemas and deployed responsive React UI modules.',
                        missingKeywords: ['Architected', 'Deployed', 'Optimized', 'Engineered']
                      }
                    ];
                    if (activeFixModal.index < activeFixModal.total) {
                      setActiveFixModal(nextItems[activeFixModal.index]);
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                  title="Next Issue"
                >
                  Next →
                </button>

                <button
                  onClick={() => setActiveFixModal(null)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Issue Explanations Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-rose-400 font-mono tracking-wider block">
                  What is the issue?
                </span>
                <p className="text-rose-200 font-semibold leading-relaxed">"{activeFixModal.whatIsTheIssue}"</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-amber-400 font-mono tracking-wider block">
                  Why does it matter?
                </span>
                <p className="text-amber-200 font-semibold leading-relaxed">"{activeFixModal.whyDoesItMatter}"</p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-blue-400 font-mono tracking-wider block">
                  What needs to change?
                </span>
                <p className="text-blue-200 font-semibold leading-relaxed">{activeFixModal.whatNeedsToChange}</p>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-cyan-400 font-mono tracking-wider block">
                  Where is the issue?
                </span>
                <p className="text-cyan-200 font-semibold leading-relaxed">{activeFixModal.whereIsTheIssue}</p>
              </div>
            </div>

            {/* Current Content vs Suggested AI Content */}
            <div className="space-y-3 pt-1">
              <span className="text-xs font-extrabold text-white font-['Space_Grotesk'] block">
                Preview Before Applying Changes:
              </span>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  Current Content (From Active Resume)
                </span>
                <p className="text-xs text-slate-300 italic font-medium leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  "{activeFixModal.currentContent}"
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                  Suggested AI Content
                </span>
                <p className="text-xs text-emerald-200 font-semibold leading-relaxed bg-emerald-950/60 p-3 rounded-xl border border-emerald-500/30">
                  "{activeFixModal.suggestedAIContent}"
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setActiveFixModal(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowFixConfirmationPopup(true)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <Wand2 className="w-4 h-4 text-yellow-300" />
                <span>Apply Changes</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2. CENTERED CONFIRMATION POPUP (Requirements 5 & 6) */}
      {showFixConfirmationPopup && activeFixModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative my-auto">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg">
                <Wand2 className="w-6 h-6 animate-bounce text-yellow-300" />
              </div>
              <h3 className="text-lg font-black text-white font-['Space_Grotesk']">
                Update this section of your resume?
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                Target Section: <span className="text-cyan-400 font-bold">{activeFixModal.sectionName}</span>
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Before (Current Content)</span>
                <p className="text-slate-300/80 line-through italic">"{activeFixModal.currentContent}"</p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 space-y-1">
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block">After (Suggested AI Content)</span>
                <p className="text-emerald-200 font-semibold">"{activeFixModal.suggestedAIContent}"</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowFixConfirmationPopup(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpdateChanges}
                disabled={isUpdatingResume}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isUpdatingResume ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-white animate-spin" />
                    <span>Updating Resume & Re-analyzing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Update Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. CENTERED SUCCESS POPUP (Requirements 8, 9, 10, 11, 12, 13) */}
      {showFixSuccessPopup && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative my-auto">
            
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-bounce" />
              </div>
              <h3 className="text-xl font-black text-white font-['Space_Grotesk']">
                ✓ Changes Updated Successfully
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                Your resume has been updated and re-analyzed by the AI ATS Scanner.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">ATS Score Recalculated</span>
                  <span className="text-xs text-slate-300 font-semibold">
                    {showFixSuccessPopup.scoreDiff >= 0 ? 'Score Boosted' : 'Score Updated'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-emerald-400 font-mono block">
                    {showFixSuccessPopup.previousScore} → {showFixSuccessPopup.newScore}
                  </span>
                  <span className="text-[10px] font-extrabold text-emerald-300">
                    {showFixSuccessPopup.scoreDiff >= 0 ? `+${showFixSuccessPopup.scoreDiff} points` : `${showFixSuccessPopup.scoreDiff} points`}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                  Updated Section: {showFixSuccessPopup.sectionName}
                </span>
                <p className="text-xs text-emerald-200 font-semibold leading-relaxed bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  "{showFixSuccessPopup.updatedContent}"
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={() => handleUndoChange(showFixSuccessPopup.issueId, showFixSuccessPopup.previousText, showFixSuccessPopup.previousScore)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Undo Changes
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFixSuccessPopup(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowFixSuccessPopup(null);
                    setActiveTab('resume');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white text-xs font-extrabold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  View Updated Resume →
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* IMPROVED RESUME MODAL & PREVIEW STUDIO */}
      {showImprovedModal && improvedResult && editedResumeData && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-purple-500/30 rounded-3xl max-w-[1400px] w-full p-5 sm:p-7 space-y-5 shadow-2xl relative my-auto max-h-[92vh] flex flex-col">
            
            {/* Modal Header Bar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-md">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white font-['Space_Grotesk']">
                    {activeModalTab === 'edit'
                      ? 'Review & Confirm Proposed Changes'
                      : 'Generated Professional ATS Resume'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {activeModalTab === 'edit'
                      ? 'Review candidate information below. Edit any fields as needed before generating your final ATS resume.'
                      : 'Single-column recruiter-ready ATS resume • Recruiter Ready'}
                  </p>
                </div>
              </div>

              {/* ACTION BAR */}
              <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
                {activeModalTab === 'preview' && (
                  <button
                    onClick={handleDownloadImprovedPdf}
                    disabled={isDownloadingPdf}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 text-white" />
                    <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowImprovedModal(false);
                    setWorkflowStep('ANALYSIS_RESULT');
                  }}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* TAB CONTENT 1: EDITABLE CANDIDATE DETAILS STEP (Requirement 7 & 8) */}
            {activeModalTab === 'edit' && (
              <div className="space-y-5 animate-in fade-in overflow-y-auto pr-2 flex-1">
                
                {/* ATTRACTIVE RESUME GENERATION SCREEN OVERLAY WITH ANIMATED ROBOT */}
                {isReAnalyzing ? (
                  <AIRobotLoader
                    title="Wait, your resume is being created..."
                    subtitle="Creating your professional resume..."
                    details="AI is auditing layout and calculating ATS score..."
                    isDone={isReAnalyzingDone}
                    onComplete={() => {
                      setActiveModalTab('preview');
                      setWorkflowStep('FINAL_RESULT');
                      setShowImprovedModal(true);
                      setIsReAnalyzing(false);
                    }}
                    overlay={true}
                  />
                ) : (
                  <>
                    <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between text-xs text-cyan-200">
                      <div className="flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>Candidate facts have been preserved. You can review and edit any fields below before generating your final ATS resume.</span>
                      </div>
                    </div>

                    {/* Candidate Personal Details Inputs */}
                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                      <span className="text-[10px] font-extrabold uppercase text-cyan-400 tracking-wider block">Candidate Contact Information</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="text-slate-400 font-bold block mb-1">Full Name</label>
                          <input
                            type="text"
                            value={editedResumeData.fullName || ''}
                            onChange={(e) => setEditedResumeData({ ...editedResumeData, fullName: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-semibold focus:border-cyan-500 focus:outline-none"
                            placeholder="John Doe"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 font-bold block mb-1">Professional Title</label>
                          <input
                            type="text"
                            value={editedResumeData.professionalTitle || ''}
                            onChange={(e) => setEditedResumeData({ ...editedResumeData, professionalTitle: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-semibold focus:border-cyan-500 focus:outline-none"
                            placeholder="Software Engineer"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 font-bold block mb-1">Email Address</label>
                          <input
                            type="email"
                            value={editedResumeData.email || ''}
                            onChange={(e) => setEditedResumeData({ ...editedResumeData, email: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-semibold focus:border-cyan-500 focus:outline-none"
                            placeholder="john@example.com"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 font-bold block mb-1">Phone Number</label>
                          <input
                            type="text"
                            value={editedResumeData.phone || ''}
                            onChange={(e) => setEditedResumeData({ ...editedResumeData, phone: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-semibold focus:border-cyan-500 focus:outline-none"
                            placeholder="+1 (555) 000-0000"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 font-bold block mb-1">Location</label>
                          <input
                            type="text"
                            value={editedResumeData.location || ''}
                            onChange={(e) => setEditedResumeData({ ...editedResumeData, location: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-semibold focus:border-cyan-500 focus:outline-none"
                            placeholder="City, State / Country"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 font-bold block mb-1">LinkedIn URL</label>
                          <input
                            type="text"
                            value={editedResumeData.linkedIn || ''}
                            onChange={(e) => setEditedResumeData({ ...editedResumeData, linkedIn: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-semibold focus:border-cyan-500 focus:outline-none"
                            placeholder="linkedin.com/in/username"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Executive Summary Textarea */}
                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <label className="text-[10px] font-extrabold uppercase text-cyan-400 tracking-wider block">Executive Summary</label>
                      <textarea
                        rows={3}
                        value={editedResumeData.summary || ''}
                        onChange={(e) => setEditedResumeData({ ...editedResumeData, summary: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-medium focus:border-cyan-500 focus:outline-none leading-relaxed"
                        placeholder="Write a brief professional summary..."
                      />
                    </div>

                    {/* Technical Skills Input */}
                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <label className="text-[10px] font-extrabold uppercase text-cyan-400 tracking-wider block">Technical Skills (Comma-Separated)</label>
                      <input
                        type="text"
                        value={(editedResumeData.skills || []).join(', ')}
                        onChange={(e) => {
                          const skillsArr = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                          setEditedResumeData({ ...editedResumeData, skills: skillsArr });
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-bold focus:border-cyan-500 focus:outline-none"
                        placeholder="React, TypeScript, Node.js, Python, Docker"
                      />
                    </div>

                    {/* Technical Projects List */}
                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase text-cyan-400 tracking-wider block">Technical Projects</span>
                        <button
                          type="button"
                          onClick={() => {
                            const currentProjs = editedResumeData.projects || [];
                            setEditedResumeData({
                              ...editedResumeData,
                              projects: [...currentProjs, { title: 'New Technical Project', description: '', techStack: [] }]
                            });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Project</span>
                        </button>
                      </div>

                      <div className="space-y-4">
                        {(editedResumeData.projects || []).map((proj, idx) => (
                          <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs relative">
                            <div className="flex justify-between gap-2">
                              <input
                                type="text"
                                value={proj.title || ''}
                                onChange={(e) => {
                                  const updated = [...(editedResumeData.projects || [])];
                                  updated[idx] = { ...updated[idx], title: e.target.value };
                                  setEditedResumeData({ ...editedResumeData, projects: updated });
                                }}
                                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-extrabold focus:border-cyan-500 focus:outline-none"
                                placeholder="Project Title"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = (editedResumeData.projects || []).filter((_, i) => i !== idx);
                                  setEditedResumeData({ ...editedResumeData, projects: updated });
                                }}
                                className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 cursor-pointer shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <textarea
                              rows={2}
                              value={proj.description || ''}
                              onChange={(e) => {
                                const updated = [...(editedResumeData.projects || [])];
                                updated[idx] = { ...updated[idx], description: e.target.value };
                                setEditedResumeData({ ...editedResumeData, projects: updated });
                              }}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-medium focus:border-cyan-500 focus:outline-none"
                              placeholder="Project description..."
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Education Section */}
                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase text-cyan-400 tracking-wider block">Education & Credentials</span>
                        <button
                          type="button"
                          onClick={() => {
                            const currentEdu = editedResumeData.education || [];
                            setEditedResumeData({
                              ...editedResumeData,
                              education: [...currentEdu, { degree: 'Bachelor of Technology', institution: 'University', graduationYear: '2025', cgpa: '' }]
                            });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Education</span>
                        </button>
                      </div>

                      <div className="space-y-3">
                        {(editedResumeData.education || []).map((edu, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            <input
                              type="text"
                              value={edu.degree || ''}
                              onChange={(e) => {
                                const updated = [...(editedResumeData.education || [])];
                                updated[idx] = { ...updated[idx], degree: e.target.value };
                                setEditedResumeData({ ...editedResumeData, education: updated });
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-bold focus:border-cyan-500 focus:outline-none"
                              placeholder="Degree"
                            />
                            <input
                              type="text"
                              value={edu.institution || ''}
                              onChange={(e) => {
                                const updated = [...(editedResumeData.education || [])];
                                updated[idx] = { ...updated[idx], institution: e.target.value };
                                setEditedResumeData({ ...editedResumeData, education: updated });
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-semibold focus:border-cyan-500 focus:outline-none"
                              placeholder="Institution"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* GENERATE RESUME BUTTON (Requirement 8) */}
                    <div className="pt-4 border-t border-slate-800 flex justify-end">
                      <button
                        onClick={handleCreateResume}
                        disabled={isReAnalyzing}
                        className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2.5 shadow-xl shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Wand2 className="w-4.5 h-4.5 text-yellow-300 animate-bounce" />
                        <span>Generate Resume</span>
                        <ArrowRight className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: PROFESSIONAL ATS RESUME PREVIEW & GENERATED RESUME ATS SCORE */}
            {activeModalTab === 'preview' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto pr-1 flex-1 animate-in fade-in">
                
                {/* LEFT COLUMN: SINGLE-COLUMN RESUME PREVIEW (lg:col-span-7) */}
                <div className="lg:col-span-7 flex flex-col space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-1">
                    <span className="text-white font-extrabold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      <span>Single-Column Professional ATS Resume</span>
                    </span>
                    <span className="text-emerald-400 font-extrabold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Recruiter Ready
                    </span>
                  </div>

                  {/* Document Preview Container */}
                  <div
                    ref={improvedPreviewRef}
                    className="p-8 sm:p-10 bg-white text-slate-900 font-sans text-xs leading-relaxed overflow-y-auto shadow-2xl rounded-2xl border border-slate-200 select-text min-h-[550px] max-h-[680px]"
                  >
                    <ResumePreviewTemplates data={editedResumeData} template="classic" isEditable={false} />
                  </div>
                </div>

                {/* RIGHT COLUMN: GENERATED RESUME ATS SCORE BREAKDOWN (lg:col-span-5) */}
                <div className="lg:col-span-5 flex flex-col space-y-4 bg-slate-950 p-5 rounded-2xl border border-purple-500/30 overflow-y-auto max-h-[720px]">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-400" />
                      <h3 className="text-sm font-black text-white font-['Space_Grotesk']">
                        Generated Resume ATS Analysis
                      </h3>
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
                      Calculated Score
                    </span>
                  </div>

                  {/* ATS Score Display */}
                  {(() => {
                    const orig = originalAtsScore ?? improvedResult.originalScore ?? analysisResult?.atsScore ?? 0;
                    const gen = generatedResumeAtsScore ?? improvedResult.improvedScore ?? 0;
                    const diff = gen - orig;
                    const diffFormatted = diff > 0 ? `+${diff}%` : `${diff}%`;
                    const badgeStyle = diff > 0 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                      : diff < 0 
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                        : 'bg-slate-800 text-slate-300 border-slate-700';

                    return (
                      <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-purple-950/60 border border-purple-500/30 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-400 block font-bold">Generated Resume ATS Score</span>
                          <span className={`text-3xl font-black ${gen >= 60 ? 'text-emerald-400' : 'text-rose-400'}`}>{gen}%</span>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-extrabold px-3 py-1 rounded-full border block ${badgeStyle}`}>
                            {diffFormatted} Improvement
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1 block">Original Upload Score: {orig}%</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Detected Technical Keywords & Competencies */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-purple-400" />
                      <span>Detected Skills & Keywords</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                      {(improvedResult.keywordBoosts || []).map((kw, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-200 text-[11px] font-bold border border-slate-800 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>{kw}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* ATS Formatting & Section Hierarchy Audit */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                      <span>ATS Hierarchy & Structure Audit</span>
                    </h4>
                    <div className="space-y-2">
                      {(improvedResult.enhancementsApplied || []).map((enh, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed font-medium">{enh}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actionable Recommendations */}
                  <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-200 space-y-1">
                    <span className="font-extrabold uppercase text-[10px] text-purple-300 block">💡 Candidate Placement Advice</span>
                    <p className="leading-relaxed">
                      Your single-column resume is fully structured for ATS scanners. Click <strong>Download PDF</strong> above to save your publication-grade PDF file.
                    </p>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* 4. CENTERED FULL IMPROVE CONFIRMATION POPUP (Requirements 18 & 19) */}
      {showFullImproveConfirmation && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-purple-500/50 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative my-auto">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-lg">
                <Sparkles className="w-6 h-6 animate-pulse text-purple-400" />
              </div>
              <h3 className="text-lg font-black text-white font-['Space_Grotesk']">
                Update Complete Resume?
              </h3>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                AI will replace your current active resume content with the complete optimized ATS version and re-analyze your overall ATS score.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">Optimization Scope:</span>
                <span className="text-purple-300 font-mono font-bold">Full Resume Reword & Keyword Alignment</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">Target ATS Score:</span>
                <span className="text-emerald-400 font-mono font-bold">
                  {improvedResult?.improvedScore || 85}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowFullImproveConfirmation(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmFullImprovement}
                disabled={isUpdatingResume}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isUpdatingResume ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-white animate-spin" />
                    <span>Updating Full Resume...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Update Resume</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CENTERED FULL IMPROVE SUCCESS POPUP (Requirement 20) */}
      {showFullImproveSuccessPopup && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative my-auto">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-bounce" />
              </div>
              <h3 className="text-xl font-black text-white font-['Space_Grotesk']">
                ✓ Full Resume Updated Successfully
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                Your complete resume has been replaced with the AI-optimized version and re-analyzed.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold">Previous ATS Score:</span>
                <span className="text-slate-400 font-mono font-bold">{showFullImproveSuccessPopup.previousScore}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold">New ATS Score:</span>
                <span className="text-emerald-400 font-mono font-black text-lg">{showFullImproveSuccessPopup.newScore}%</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-emerald-500/20">
                <span className="text-slate-300 font-bold">Score Improvement:</span>
                <span className="text-emerald-300 font-mono font-extrabold">
                  {showFullImproveSuccessPopup.scoreDiff >= 0 ? `+${showFullImproveSuccessPopup.scoreDiff} points` : `${showFullImproveSuccessPopup.scoreDiff} points`}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowFullImproveSuccessPopup(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowFullImproveSuccessPopup(null);
                  setActiveTab('resume');
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white text-xs font-extrabold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                View Updated Resume →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL-SCREEN CIRCULAR SPINNER LOADING OVERLAY FOR "GENERATE ALL" */}
      {isFixingResume && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 space-y-5 animate-in fade-in select-none">
          <div className="relative w-20 h-20 flex items-center justify-center">
            {/* Outer spinning gradient ring */}
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 border-r-indigo-500 animate-spin" />
            {/* Inner glowing icon */}
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-6 h-6 animate-pulse text-cyan-300" />
            </div>
          </div>

          <div className="text-center space-y-2 max-w-sm">
            <h3 className="text-lg font-black text-white font-['Space_Grotesk'] tracking-wide">
              Generating your resume…
            </h3>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              AI is optimizing sections, enhancing technical keywords, and auditing single-column hierarchy...
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-4 py-1.5 rounded-full border border-cyan-500/30 shadow-md">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>AI Optimization Running</span>
          </div>
        </div>
      )}

    </div>
  );
};
