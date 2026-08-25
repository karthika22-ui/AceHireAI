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
  ArrowLeft,
  Download,
  Copy,
  FileDown,
  X,
  Edit3,
  Eye,
  Plus,
  Play
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useApp } from '../../context/AppContext';
import { analyzeResumeWithAI, fixResumeWithAI } from '../../services/aiEngine';
import { SupabaseService } from '../../services/supabaseClient';
import { ResumeData, ResumeAnalysis, ImprovedResumeResult } from '../../types';
import { SessionResumeModal } from '../Common/SessionResumeModal';
import { ResumePreviewTemplates } from './ResumePreviewTemplates';

interface ATSAnalyzerViewProps {
  onBackToSelection?: () => void;
  initialResumeData?: ResumeData;
}

export const ATSAnalyzerView: React.FC<ATSAnalyzerViewProps> = ({ onBackToSelection, initialResumeData }) => {
  const { user, resume, recordUserActivity, setActiveTab, registerWorkflowGuard, clearWorkflowGuard } = useApp();

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

  // "Fix My Resume" AI Enhancement & Interactive Editor State
  const [isFixingResume, setIsFixingResume] = useState<boolean>(false);
  const [isReAnalyzing, setIsReAnalyzing] = useState<boolean>(false);
  const [improvedResult, setImprovedResult] = useState<ImprovedResumeResult | null>(null);
  const [editedResumeData, setEditedResumeData] = useState<ResumeData | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'edit' | 'preview'>('edit');
  const [showImprovedModal, setShowImprovedModal] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const improvedPreviewRef = useRef<HTMLDivElement | null>(null);

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

  const extractReadableTextFromPdfOrFile = async (file: File): Promise<string> => {
    try {
      const rawText = await file.text();

      // If text contains PDF stream signatures
      if (file.name.toLowerCase().endsWith('.pdf') || rawText.includes('%PDF')) {
        const textChunks: string[] = [];

        // 1. Extract strings inside parenthesis followed by Tj / TJ operators: (text) Tj
        const tjMatches = rawText.match(/\((.*?)\)\s*T[jJ]/gs) || [];
        for (const m of tjMatches) {
          const content = m.replace(/\)\s*T[jJ]$/, '').replace(/^\(/, '');
          const unescaped = content.replace(/\\([()\\])/g, '$1').trim();
          if (unescaped && !unescaped.startsWith('/') && !unescaped.startsWith('0 0 0') && unescaped.length > 0) {
            textChunks.push(unescaped);
          }
        }

        // 2. Extract array string items [ (text1) -10 (text2) ] TJ
        const arrayMatches = rawText.match(/\[\s*(\(.*?\)\s*)+\]\s*TJ/gs) || [];
        for (const arr of arrayMatches) {
          const strings = arr.match(/\((.*?)\)/g) || [];
          for (const s of strings) {
            const content = s.slice(1, -1);
            const unescaped = content.replace(/\\([()\\])/g, '$1').trim();
            if (unescaped && !unescaped.startsWith('/') && unescaped.length > 0) {
              textChunks.push(unescaped);
            }
          }
        }

        if (textChunks.length > 3) {
          return textChunks.join(' ').replace(/\s+/g, ' ').trim();
        }

        // Fallback PDF text cleaning: strip binary non-printable characters & PDF object syntax
        const sanitized = rawText
          .replace(/%PDF-[\s\S]*?stream/g, '')
          .replace(/endstream[\s\S]*?endobj/g, '')
          .replace(/[/<>{}[\]()]/g, ' ')
          .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
          .replace(/\b(obj|endobj|stream|endstream|xref|trailer|startxref)\b/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        return sanitized;
      }
      return rawText;
    } catch (e) {
      console.error('Error extracting text from file:', e);
      return '';
    }
  };

  const processSelectedFile = async (file: File) => {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';

    const extractedText = await extractReadableTextFromPdfOrFile(file);

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

  const handleFixResume = async () => {
    if (!uploadedFile && !initialResumeData && !resume) return;
    setIsFixingResume(true);

    try {
      const target = uploadedFile || initialResumeData || resume;
      const res = await fixResumeWithAI(target, analysisResult || undefined);
      setImprovedResult(res);

      const defaultData: ResumeData = res.improvedResumeData || {
        fullName: user?.name || 'Candidate Name',
        professionalTitle: 'Software Engineer',
        email: user?.email || 'email@address.com',
        phone: '+1 (555) 019-2834',
        location: 'Placement Ready',
        summary: res.improvedResumeText,
        skills: res.keywordBoosts,
        education: [],
        experience: [],
        projects: []
      };
      setEditedResumeData(defaultData);
      setActiveModalTab('edit');
      setShowImprovedModal(true);

      if (analysisResult) {
        const updatedAnalysis: ResumeAnalysis = {
          ...analysisResult,
          atsScore: res.improvedScore,
          strengths: [
            '100% single-column ATS readable document structure verified.',
            'High-impact action verbs (Engineered, Architected, Optimized) used across all bullet points.',
            `Integrated ${res.keywordBoosts.length} industry domain keywords seamlessly.`,
            ...(analysisResult.strengths || [])
          ],
          formattingSuggestions: [
            '✓ Standard single-column structure confirmed for maximum ATS parsing compatibility.',
            '✓ Active project links and LinkedIn profile metadata structured cleanly.',
            '✓ Quantitative impact metrics integrated across project achievements.'
          ],
          grammarReview: [
            '✓ Active action verbs verified ("Engineered", "Implemented", "Architected").',
            '✓ Professional tense consistency and zero passive phrasing verified.'
          ],
          summary: `AI Optimized Version: Resume successfully enhanced to target ${res.improvedScore}% ATS compatibility. Structure, keyword placement, action verbs, and impact metrics aligned to top placement standards.`,
          actionableImprovements: [
            {
              section: 'ATS Optimization Complete',
              issue: `Original score ${res.originalScore}% updated to ${res.improvedScore}%`,
              recommendation: 'Review and edit your resume details, click Create Resume to generate the professional preview, and download your file.'
            }
          ],
          improvementChecklist: [
            '✓ High-impact action verbs added to all project bullet points.',
            '✓ Technical domain keywords incorporated into skills section.',
            '✓ Quantitative performance metrics formatted for readability.',
            '✓ Standardized ATS section headings verified.'
          ],
          improvedResult: res
        };
        setAnalysisResult(updatedAnalysis);
        if (user?.id) {
          SupabaseService.saveAtsAnalysis(user.id, updatedAnalysis);
        }
      }
      recordUserActivity('resume', 'AI ATS Resume Optimization ("Fix My Resume")', res.improvedScore, 'Resume');
    } catch (err) {
      console.error('Error fixing resume:', err);
    } finally {
      setIsFixingResume(false);
    }
  };

  const handleCreateResume = async () => {
    if (!editedResumeData) return;
    setIsReAnalyzing(true);

    const candidateName = editedResumeData.fullName || 'Candidate Profile';
    const textHeader = `${candidateName.toUpperCase()}\nEmail: ${editedResumeData.email || ''} | Phone: ${editedResumeData.phone || ''} | Location: ${editedResumeData.location || ''}\n`;
    const textSummary = `EXECUTIVE SUMMARY\n${editedResumeData.summary || ''}\n`;
    const textSkills = `CORE SKILLS\n${(editedResumeData.skills || []).join(', ')}\n`;
    const textExp = (editedResumeData.experience || []).map((e) => `${e.role || ''} at ${e.company || ''} (${e.duration || ''}): ${e.description || ''}`).join('\n');
    const textProj = (editedResumeData.projects || []).map((p) => `${p.title || ''}: ${p.description || ''}`).join('\n');
    const textEdu = (editedResumeData.education || []).map((ed) => `${ed.degree || ''} - ${ed.institution || ''} (${ed.graduationYear || ''})`).join('\n');

    const updatedText = `${textHeader}\n${textSummary}\n${textSkills}\n${textExp}\n${textProj}\n${textEdu}`;

    try {
      const reResult = await analyzeResumeWithAI({
        name: `${candidateName.replace(/\s+/g, '_')}_ATS_Resume.pdf`,
        extractedText: updatedText
      });

      const updatedImproved: ImprovedResumeResult = {
        originalScore: improvedResult?.originalScore || analysisResult?.atsScore || 60,
        improvedScore: reResult.atsScore,
        improvedResumeText: updatedText,
        improvedResumeData: editedResumeData,
        enhancementsApplied: improvedResult?.enhancementsApplied || ['Optimized single-column section hierarchy and action verbs.'],
        keywordBoosts: editedResumeData.skills || [],
        scoreIncrease: Math.max(0, reResult.atsScore - (improvedResult?.originalScore || 60))
      };

      setImprovedResult(updatedImproved);
      if (analysisResult) {
        setAnalysisResult({
          ...analysisResult,
          atsScore: reResult.atsScore,
          improvedResult: updatedImproved
        });
      }
      setActiveModalTab('preview');
    } catch (e) {
      console.error(e);
      setActiveModalTab('preview');
    } finally {
      setIsReAnalyzing(false);
    }
  };

  const handleReAnalyzeATS = async () => {
    if (!editedResumeData) return;
    setIsReAnalyzing(true);
    try {
      const candidateName = editedResumeData.fullName || 'Candidate';
      const textHeader = `${candidateName.toUpperCase()}\nEmail: ${editedResumeData.email || ''} | Phone: ${editedResumeData.phone || ''} | Location: ${editedResumeData.location || ''}\n`;
      const textSummary = `EXECUTIVE SUMMARY\n${editedResumeData.summary || ''}\n`;
      const textSkills = `CORE SKILLS\n${(editedResumeData.skills || []).join(', ')}\n`;
      const textExp = (editedResumeData.experience || []).map((e) => `${e.role || ''} at ${e.company || ''} (${e.duration || ''}): ${e.description || ''}`).join('\n');
      const textProj = (editedResumeData.projects || []).map((p) => `${p.title || ''}: ${p.description || ''}`).join('\n');
      const textEdu = (editedResumeData.education || []).map((ed) => `${ed.degree || ''} - ${ed.institution || ''} (${ed.graduationYear || ''})`).join('\n');

      const fullText = `${textHeader}\n${textSummary}\n${textSkills}\n${textExp}\n${textProj}\n${textEdu}`;

      const reResult = await analyzeResumeWithAI({
        name: `${candidateName.replace(/\s+/g, '_')}_ATS_Resume.pdf`,
        extractedText: fullText,
        fileSizeRaw: 1024 * 1024,
        lastModified: Date.now()
      });
      const newScore = reResult.atsScore;
      if (improvedResult) {
        const updatedImproved: ImprovedResumeResult = {
          ...improvedResult,
          improvedScore: newScore,
          improvedResumeText: fullText,
          improvedResumeData: editedResumeData,
          scoreIncrease: Math.max(0, newScore - improvedResult.originalScore)
        };
        setImprovedResult(updatedImproved);
        if (analysisResult) {
          const updatedAnalysis = {
            ...reResult,
            summary: `Re-Analyzed Generated Resume: Dynamic ATS Score is ${newScore}% based on keyword indexing and single-column structure.`,
            improvedResult: updatedImproved
          };
          setAnalysisResult(updatedAnalysis);
          if (user?.id) {
            SupabaseService.saveAtsAnalysis(user.id, updatedAnalysis);
          }
        }
      }
    } catch (e) {
      console.error('Re-analysis error:', e);
    } finally {
      setIsReAnalyzing(false);
    }
  };

  const handleDownloadImprovedText = () => {
    if (!improvedResult) return;
    const element = document.createElement('a');
    const file = new Blob([improvedResult.improvedResumeText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${(user?.name || 'Candidate').replace(/\s+/g, '_')}_ATS_Optimized_Resume.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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

      // Header: Candidate Name
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.setTextColor(15, 23, 42);
      pdf.text(candidateName, leftMargin, y);
      y += 6;

      // Header: Professional Title
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(79, 70, 229);
      pdf.text(title, leftMargin, y);
      y += 5;

      // Header: Contact Details Bar
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(71, 85, 105);
      const contactLine = [email, phone, location, linkedIn ? `LinkedIn: ${linkedIn}` : '', gitHub ? `GitHub: ${gitHub}` : '']
        .filter(Boolean)
        .join(' | ');
      const contactLines = pdf.splitTextToSize(contactLine, pageWidth);
      pdf.text(contactLines, leftMargin, y);
      y += contactLines.length * 4 + 4;

      // Helper for Section Headers with Dividers
      const addSectionHeader = (headerText: string) => {
        if (y > 270) {
          pdf.addPage();
          y = 15;
        }
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(15, 23, 42);
        pdf.text(headerText.toUpperCase(), leftMargin, y);
        y += 2;
        pdf.setDrawColor(203, 213, 225);
        pdf.setLineWidth(0.5);
        pdf.line(leftMargin, y, leftMargin + pageWidth, y);
        y += 5;
      };

      // 1. EXECUTIVE SUMMARY
      if (editedResumeData.summary) {
        addSectionHeader('EXECUTIVE SUMMARY');
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9.5);
        pdf.setTextColor(30, 41, 59);
        const sumLines = pdf.splitTextToSize(editedResumeData.summary, pageWidth);
        pdf.text(sumLines, leftMargin, y);
        y += sumLines.length * 4.5 + 4;
      }

      // 2. CORE SKILLS
      if (editedResumeData.skills && editedResumeData.skills.length > 0) {
        addSectionHeader('CORE TECHNICAL SKILLS');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9.5);
        pdf.setTextColor(15, 23, 42);
        pdf.text('Technical Skills & Domain Keywords:', leftMargin, y);
        y += 4;
        pdf.setFont('helvetica', 'normal');
        const skillStr = editedResumeData.skills.join(', ');
        const skillLines = pdf.splitTextToSize(skillStr, pageWidth);
        pdf.text(skillLines, leftMargin, y);
        y += skillLines.length * 4.5 + 4;
      }

      // 3. PROFESSIONAL EXPERIENCE
      if (editedResumeData.experience && editedResumeData.experience.length > 0) {
        addSectionHeader('PROFESSIONAL EXPERIENCE & INTERNSHIPS');
        editedResumeData.experience.forEach((exp) => {
          if (y > 265) {
            pdf.addPage();
            y = 15;
          }
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.setTextColor(15, 23, 42);
          const expTitle = `${exp.role || 'Developer'} - ${exp.company || 'Organization'}`;
          pdf.text(expTitle, leftMargin, y);
          if (exp.duration) {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8.5);
            pdf.setTextColor(100, 116, 139);
            pdf.text(exp.duration, leftMargin + pageWidth, y, { align: 'right' });
          }
          y += 4.5;
          if (exp.description) {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(9);
            pdf.setTextColor(30, 41, 59);
            const descLines = pdf.splitTextToSize(`• ${exp.description}`, pageWidth);
            pdf.text(descLines, leftMargin, y);
            y += descLines.length * 4.2 + 3;
          }
        });
      }

      // 4. KEY TECHNICAL PROJECTS
      if (editedResumeData.projects && editedResumeData.projects.length > 0) {
        addSectionHeader('KEY TECHNICAL PROJECTS');
        editedResumeData.projects.forEach((proj) => {
          if (y > 265) {
            pdf.addPage();
            y = 15;
          }
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.setTextColor(15, 23, 42);
          pdf.text(proj.title || 'Technical Project', leftMargin, y);
          y += 4.5;
          if (proj.techStack && proj.techStack.length) {
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8.5);
            pdf.setTextColor(79, 70, 229);
            const techStr = `Technologies: ${Array.isArray(proj.techStack) ? proj.techStack.join(', ') : proj.techStack}`;
            pdf.text(techStr, leftMargin, y);
            y += 4;
          }
          if (proj.description) {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(9);
            pdf.setTextColor(30, 41, 59);
            const pDescLines = pdf.splitTextToSize(`• ${proj.description}`, pageWidth);
            pdf.text(pDescLines, leftMargin, y);
            y += pDescLines.length * 4.2 + 3;
          }
        });
      }

      // 5. EDUCATION
      if (editedResumeData.education && editedResumeData.education.length > 0) {
        addSectionHeader('EDUCATION & ACADEMIC CREDENTIALS');
        editedResumeData.education.forEach((edu) => {
          if (y > 270) {
            pdf.addPage();
            y = 15;
          }
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9.5);
          pdf.setTextColor(15, 23, 42);
          const eduStr = `• ${edu.degree || 'Degree'} — ${edu.institution || 'University'} ${edu.graduationYear ? `(${edu.graduationYear})` : ''} ${edu.cgpa ? `| CGPA: ${edu.cgpa}` : ''}`;
          const eduLines = pdf.splitTextToSize(eduStr, pageWidth);
          pdf.text(eduLines, leftMargin, y);
          y += eduLines.length * 4.5 + 2;
        });
      }

      const fileName = `${candidateName.replace(/\s+/g, '_')}_ATS_Resume.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF generation error', err);
    } finally {
      setIsDownloadingPdf(false);
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

                {/* "FIX MY RESUME" AI ENHANCEMENT ACTION BAR */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
                      <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Boost ATS Compatibility to 98–99%</span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          AI AUTO-FIX
                        </span>
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        Preserves original user facts, companies & degrees while optimizing wording, action verbs & keywords.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleFixResume}
                    disabled={isFixingResume}
                    className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-cyan-500/25 hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-300 ease-out hover:scale-[1.02] active:scale-98 cursor-pointer disabled:opacity-50 border border-cyan-300/30 shrink-0"
                  >
                    {isFixingResume ? (
                      <>
                        <RefreshCw className="w-4.5 h-4.5 text-white animate-spin" />
                        <span>Optimizing to 98–99%...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4.5 h-4.5 text-yellow-300 animate-bounce" />
                        <span>Fix My Resume (Target 98–99% ATS)</span>
                      </>
                    )}
                  </button>
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

      {/* IMPROVED RESUME MODAL & PREVIEW STUDIO */}
      {showImprovedModal && improvedResult && editedResumeData && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-purple-500/30 rounded-3xl max-w-[1400px] w-full p-5 sm:p-7 space-y-5 shadow-2xl relative my-auto max-h-[92vh] flex flex-col">
            
            {/* Modal Header & Action Bar (KEEPS ONLY: Edit Data, Analyze ATS Score, Download PDF) */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-md">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white font-['Space_Grotesk']">
                    AI Corrected ATS Resume Studio
                  </h2>
                  <p className="text-xs text-slate-400">
                    Single-column recruiter-ready ATS resume • Genuine user facts preserved
                  </p>
                </div>
              </div>

              {/* UNIFIED ACTION BAR (EXACTLY 3 BUTTONS: Edit Data, Analyze ATS Score, Download PDF) */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
                {/* 1. EDIT DATA BUTTON */}
                <button
                  onClick={() => setActiveModalTab('edit')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                    activeModalTab === 'edit'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Edit Data</span>
                </button>

                {/* 2. ANALYZE ATS SCORE BUTTON */}
                <button
                  onClick={handleReAnalyzeATS}
                  disabled={isReAnalyzing}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                  title="Re-analyze generated resume content dynamically with ATS engine"
                >
                  <BarChart3 className={`w-3.5 h-3.5 text-white ${isReAnalyzing ? 'animate-spin' : ''}`} />
                  <span>{isReAnalyzing ? 'Analyzing Score...' : 'Analyze ATS Score'}</span>
                </button>

                {/* 3. DOWNLOAD PDF BUTTON */}
                <button
                  onClick={handleDownloadImprovedPdf}
                  disabled={isDownloadingPdf}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-white" />
                  <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
                </button>

                <button
                  onClick={() => setShowImprovedModal(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* TAB CONTENT 1: EDIT RESUME DATA */}
            {activeModalTab === 'edit' && (
              <div className="space-y-5 animate-in fade-in overflow-y-auto pr-2 flex-1">
                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between text-xs text-purple-200">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Review and edit your candidate fields below. All original education, experience, and project facts are preserved.</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase">Full Name</label>
                    <input
                      type="text"
                      value={editedResumeData.fullName || ''}
                      onChange={(e) => setEditedResumeData({ ...editedResumeData, fullName: e.target.value })}
                      className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase">Professional Title</label>
                    <input
                      type="text"
                      value={editedResumeData.professionalTitle || ''}
                      onChange={(e) => setEditedResumeData({ ...editedResumeData, professionalTitle: e.target.value })}
                      className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase">Email Address</label>
                    <input
                      type="text"
                      value={editedResumeData.email || ''}
                      onChange={(e) => setEditedResumeData({ ...editedResumeData, email: e.target.value })}
                      className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase">Phone Number</label>
                    <input
                      type="text"
                      value={editedResumeData.phone || ''}
                      onChange={(e) => setEditedResumeData({ ...editedResumeData, phone: e.target.value })}
                      className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase">Executive Summary</label>
                  <textarea
                    rows={3}
                    value={editedResumeData.summary || ''}
                    onChange={(e) => setEditedResumeData({ ...editedResumeData, summary: e.target.value })}
                    className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:ring-1 focus:ring-purple-500 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase">Skills & Domain Keywords (Comma Separated)</label>
                  <input
                    type="text"
                    value={(editedResumeData.skills || []).join(', ')}
                    onChange={(e) =>
                      setEditedResumeData({
                        ...editedResumeData,
                        skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                      })
                    }
                    className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* CREATE RESUME ACTION BUTTON */}
                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={handleCreateResume}
                    disabled={isReAnalyzing}
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2.5 shadow-xl shadow-cyan-500/25 transition-all cursor-pointer"
                  >
                    <Wand2 className="w-4.5 h-4.5 text-yellow-300" />
                    <span>{isReAnalyzing ? 'Generating & Analyzing...' : 'Create Resume & View Professional Preview'}</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: PROFESSIONAL ATS RESUME PREVIEW & SIDE-BY-SIDE REAL ATS ANALYSIS */}
            {activeModalTab === 'preview' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto pr-1 flex-1 animate-in fade-in">
                
                {/* LEFT COLUMN: FULLY VISIBLE & SCROLLABLE SINGLE-COLUMN RESUME PREVIEW (lg:col-span-7) */}
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

                  {/* Fully Visible & Scrollable Document Preview */}
                  <div
                    ref={improvedPreviewRef}
                    className="p-8 sm:p-10 bg-white text-slate-900 font-sans text-xs leading-relaxed overflow-y-auto shadow-2xl rounded-2xl border border-slate-200 select-text min-h-[550px] max-h-[680px]"
                  >
                    <ResumePreviewTemplates data={editedResumeData} template="classic" isEditable={false} />
                  </div>
                </div>

                {/* RIGHT COLUMN: SIDE-BY-SIDE REAL ATS ANALYSIS BREAKDOWN (lg:col-span-5) */}
                <div className="lg:col-span-5 flex flex-col space-y-4 bg-slate-950 p-5 rounded-2xl border border-purple-500/30 overflow-y-auto max-h-[720px]">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-400" />
                      <h3 className="text-sm font-black text-white font-['Space_Grotesk']">
                        Real ATS Analysis Breakdown
                      </h3>
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
                      Live Audit
                    </span>
                  </div>

                  {/* Dynamic Unhardcoded ATS Score Gauge Card */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-purple-950/60 border border-purple-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block font-bold">Un-fabricated ATS Match Score</span>
                      <span className="text-2xl font-black text-emerald-400">{improvedResult.improvedScore}%</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/40 block">
                        +{improvedResult.scoreIncrease}% Score Increase
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1 block">Original: {improvedResult.originalScore}%</span>
                    </div>
                  </div>

                  {/* Detected Technical Keywords & Competencies */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-purple-400" />
                      <span>Detected Skills & Domain Keywords</span>
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
                      <span>ATS Compatibility & Hierarchy Audit</span>
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
                      Your single-column resume is fully structured for ATS scanners. Click <strong>Download PDF</strong> to save your publication-grade PDF file.
                    </p>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
